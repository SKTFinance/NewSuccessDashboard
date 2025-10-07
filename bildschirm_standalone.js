// Dieses Skript ist eine eigenständige Version für die bildschirm.html
// Es enthält nur die Logik, die für die Bildschirm-Ansicht notwendig ist.

// --- KONSTANTEN ---
const SEATABLE_API_TOKEN = "b148f4c735d193f77841ce4e4ddb2bb8bc2e446b";
const SEATABLE_APP_ACCESS_TOKEN_URL = "https://cloud.seatable.io/api/v2.1/dtable/app-access-token/";
const SEATABLE_DTABLE_UUID = "5b374b51-789c-4aac-a12f-02574f8f4855";

// --- GLOBALE VARIABLEN ---
let seaTableAccessToken = null;
let apiGatewayUrl = null;
let db = { 
    mitarbeiter: [],
    karriereplan: [], // NEU
    umsatz: [], // NEU
};
let METADATA = {}; // NEU
let COLUMN_MAPS = {}; // NEU

// --- HILFSFUNKTIONEN (vereinfacht) ---
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function getSeaTableAccessToken() {
    try {
        const url = `${SEATABLE_APP_ACCESS_TOKEN_URL}?dtable_uuid=${SEATABLE_DTABLE_UUID}`;
        const response = await fetch(url, { headers: { Authorization: `Token ${SEATABLE_API_TOKEN}` } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        seaTableAccessToken = data.access_token;
        apiGatewayUrl = data.dtable_server;
        console.log('[DEBUG] SeaTable Access Token erhalten.');
    } catch (error) {
        console.error("Error getting SeaTable access token:", error);
        document.body.innerHTML = `<div class="text-white text-center p-8">Fehler bei der Verbindung zur Datenbank.</div>`;
    }
}

async function seaTableSqlQuery(sql, convertLinks = true) {
    let retries = 3;
    while (retries > 0) {
        if (!seaTableAccessToken) await getSeaTableAccessToken();
        try {
            const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/sql/`;
            const response = await fetch(url, {
                method: "POST",
                headers: { Authorization: `Bearer ${seaTableAccessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ sql, convert_link_id: convertLinks }),
            });
            if (response.status === 429) throw new Error("RateLimit");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            console.log(`[DEBUG] SQL-Antwort für Query "${sql.substring(0, 40)}...":`, data.results);
            return data.results || [];
        } catch (error) {
            if (error.message === "RateLimit") {
                retries--;
                if (retries === 0) { console.error("SQL query failed due to rate limiting:", sql); return null; }
                await delay(2000);
            } else {
                console.error("Error executing SeaTable SQL query:", error);
                return null;
            }
        }
    }
    return [];
}

async function seaTableQuery(tableName) {
    if (!seaTableAccessToken || !apiGatewayUrl) return [];
    try {
        const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/?table_name=${encodeURIComponent(tableName)}&convert_link_id=true`;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${seaTableAccessToken}` } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.rows || [];
    } catch (error) {
        console.error(`Error fetching data from table ${tableName}:`, error);
        return [];
    }
}

async function fetchColumnMaps() {
  if (!seaTableAccessToken || !apiGatewayUrl) return {};
  try {
    const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/metadata/`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${seaTableAccessToken}` } });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const newColumnMaps = {};
    if (data && data.metadata && data.metadata.tables) {
      METADATA.tables = data.metadata.tables;
      data.metadata.tables.forEach((table) => {
        newColumnMaps[table.name.toLowerCase()] = {};
        table.columns.forEach((col) => { newColumnMaps[table.name.toLowerCase()][col.name] = col.key; });
      });
    }
    return newColumnMaps;
  } catch (error) {
    console.error("Error fetching column maps:", error);
    return {};
  }
}

function findRowById(tableName, id) {
    return db[tableName.toLowerCase()]?.find((row) => row._id === id);
}

function mapSqlResults(results, tableName) {
    const tableNameLower = tableName.toLowerCase();
    if (!COLUMN_MAPS[tableNameLower] || !METADATA.tables) return results;

    const tableMeta = METADATA.tables.find(t => t.name.toLowerCase() === tableNameLower);
    if (!tableMeta) return results;

    const reversedMap = Object.fromEntries(Object.entries(COLUMN_MAPS[tableNameLower]).map(([name, key]) => [key, name]));

    return results.map((row) => {
        const newRow = {};
        for (const key in row) {
            const name = reversedMap[key] || key;
            let value = row[key];
            const colMeta = tableMeta.columns.find((c) => c.key === key);
            if (colMeta && colMeta.type === "single-select" && value !== null) {
                const option = colMeta.data.options.find((opt) => opt.id === value);
                value = option ? option.name : value;
            }
            newRow[name] = value;
        }
        return newRow;
    });
}

function getSubordinates(leaderId, type = 'gruppe') {
    const hierarchy = buildHierarchy();
    if (!hierarchy[leaderId]) return [];

    const subordinates = [];
    const queue = [...(hierarchy[leaderId].children || [])];
    const visited = new Set(queue);

    while (queue.length > 0) {
        const currentId = queue.shift();
        const user = findRowById("mitarbeiter", currentId);
        if (!user || user.Status === 'Ausgeschieden') continue;

        if (type === 'gruppe' && !isUserLeader(user)) {
            subordinates.push(user);
            const node = hierarchy[currentId];
            if (node) {
                node.children.forEach(childId => {
                    if (!visited.has(childId)) {
                        queue.push(childId);
                        visited.add(childId);
                    }
                });
            }
        } else if (type === 'struktur' && isUserLeader(user)) {
             subordinates.push(user);
        }
    }
    return subordinates;
}

function buildHierarchy() {
    const hierarchy = {};
    db.mitarbeiter.forEach(u => {
        if (u._id) hierarchy[u._id] = { user: u, children: [] };
    });
    db.mitarbeiter.forEach(u => {
        if (u.Werber && hierarchy[u.Werber]) {
            hierarchy[u.Werber].children.push(u._id);
        }
    });
    return hierarchy;
}

function isUserLeader(user) {
    if (!user || !user.Karrierestufe) return false;
    const stage = db.karriereplan.find(p => p.Stufe === user.Karrierestufe);
    if (!stage || typeof stage.Hierarchie !== 'number') return false;
    const JUNIOR_GST_HIERARCHIE_LEVEL = 3;
    return stage.Hierarchie >= JUNIOR_GST_HIERARCHIE_LEVEL;
}

function getMonthlyCycleDatesForDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    let currentMonth = d.getMonth();
    let currentYear = d.getFullYear();
    const _findCycleStartForMonth = (year, month) => {
        const date = new Date(year, month, 1);
        while (date.getDay() !== 4) { date.setDate(date.getDate() + 1); }
        if (date.getDate() <= 2) { date.setDate(date.getDate() + 7); }
        return date;
    };
    let thisMonthCycleStart = _findCycleStartForMonth(currentYear, currentMonth);
    let startDate, endDate;
    if (d < thisMonthCycleStart) {
        let prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        let prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        startDate = _findCycleStartForMonth(prevYear, prevMonth);
        endDate = new Date(thisMonthCycleStart);
        endDate.setDate(endDate.getDate() - 1);
    } else {
        startDate = thisMonthCycleStart;
        let nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        let nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        let nextMonthCycleStart = _findCycleStartForMonth(nextYear, nextMonth);
        endDate = new Date(nextMonthCycleStart);
        endDate.setDate(endDate.getDate() - 1);
    }
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
}

function getMonthlyCycleDates() {
    return getMonthlyCycleDatesForDate(new Date());
}

// --- BILDSCHIRM-LOGIK ---

class BildschirmView {
    constructor() {
        this.slideshowInterval = null;
        this.slides = [];
        this.currentSlideIndex = 0;
        this.zoomLevels = [1, 0.9, 0.8, 0.7, 0.6];
        this.countdownInterval = null; // NEU
        this.wettbewerbImages = [ // NEU
            'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?q=80&w=2070&auto=format&fit=crop',
            'https://images.ctfassets.net/rc3dlxapnu6k/70RDHdgBst4X0FVcBSYH2d/7b648b5ac766f85c58de070c0752b973/El_Nido__Island__Philippines.jpg?w=3840&q=50&fm=webp',
            'https://images.interhome.group/travelguide/france-cote-d-azur.jpg',
            'https://www.sabtours.at/app/uploads/fly-images/11341/sab-cruises-center-kreuzfahrten-e1529499988731-1920x690-c.jpg',
        ];
        this.currentZoomIndex = 0;
    }

    _getDomElements() {
        this.slideshowContainer = document.getElementById('leaderboard-slideshow-container');
        this.progressBar = document.getElementById('slideshow-progress-bar');
        this.lastUpdatedTime = document.getElementById('last-updated-time');
        this.zoomBtn = document.getElementById('zoom-toggle-btn');
        this.zoomWrapper = document.getElementById('leaderboard-zoom-wrapper');
        return this.slideshowContainer && this.progressBar && this.lastUpdatedTime && this.zoomBtn && this.zoomWrapper;
    }

    async init() {
        if (!this._getDomElements()) {
            console.error('[Bildschirm] Benötigte DOM-Elemente wurden nicht gefunden.');
            return;
        }
        console.log('[Bildschirm] Ansicht wird initialisiert.');

        this.zoomBtn.addEventListener('click', () => this.toggleZoom());

        await this.fetchAndRenderRankings();
        this.startScheduledDataRefresh();
        this.startSlideshow();
    }

    _getWeeklyDates() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek - 4;
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - diff);
        if (startDate > today) {
            startDate.setDate(startDate.getDate() - 7);
        }
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
    }

    _getMonthlyDates() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        return { startDate, endDate };
    }

    async fetchAndRenderRankings() {
        console.log('[Bildschirm] Lade Ranglisten-Daten via SQL...');
        try {
            const { startDate: monthStartDate, endDate: monthEndDate } = this._getMonthlyDates();
            const { startDate: weekStartDate, endDate: weekEndDate } = this._getWeeklyDates();

            const toIso = (date) => date.toISOString().split('T')[0];

            const getRanking = async (dateFilter, table, aggregation, categoryFilter = "") => {
                const query = `SELECT Mitarbeiter_ID, ${aggregation} as value FROM \`${table}\` WHERE ${dateFilter} ${categoryFilter} GROUP BY Mitarbeiter_ID ORDER BY value DESC LIMIT 3`;
                console.log(`[DEBUG] Führe SQL-Abfrage aus: ${query}`);
                const resultRaw = await seaTableSqlQuery(query, true);
                return (resultRaw || []).map(item => {
                    let mitarbeiterLinkColumnKey = null;
                    // Finde den Schlüssel, der NICHT 'value' ist (dies ist der dynamische Spalten-Key für Mitarbeiter_ID)
                    for (const key in item) {
                        if (key !== 'value') {
                            mitarbeiterLinkColumnKey = key; // z.B. 'Mitarbeiter_ID'
                            break;
                        }
                    }

                    if (!mitarbeiterLinkColumnKey) return null; // Sollte nicht passieren, wenn die Abfrage korrekt ist

                    const mitarbeiterLink = item[mitarbeiterLinkColumnKey]; // z.B. [{ display_value: 'Max Mustermann', row_id: '...' }]
                    const mitarbeiterName = mitarbeiterLink?.[0]?.display_value;
                    const mitarbeiterRowId = mitarbeiterLink?.[0]?.row_id;

                    // Wir überspringen den Datensatz, wenn kein Name gefunden wurde oder der Mitarbeiter ausgeschieden ist.
                    if (!mitarbeiterName) return null;
                    const mitarbeiter = findRowById('mitarbeiter', mitarbeiterRowId);
                    if (!mitarbeiter || mitarbeiter.Status === 'Ausgeschieden') return null;

                    return { name: mitarbeiterName, value: item.value };
                }).filter(Boolean);
            };

            const etCategoryFilter = "AND Kategorie = 'ET' AND (Absage IS NULL OR Absage = false) AND Status != 'Storno'";

            const [wochenEhRanking, wochenEtRanking, monatsEhRanking, monatsEtRanking] = await Promise.all([
                getRanking(`Datum >= '${toIso(weekStartDate)}' AND Datum <= '${toIso(weekEndDate)}'`, 'Umsatz', 'SUM(EH)'),
                getRanking(`Datum >= '${toIso(weekStartDate)}' AND Datum <= '${toIso(weekEndDate)}'`, 'Termine', 'COUNT(_id)', etCategoryFilter),
                getRanking(`Datum >= '${toIso(monthStartDate)}' AND Datum <= '${toIso(monthEndDate)}'`, 'Umsatz', 'SUM(EH)'),
                getRanking(`Datum >= '${toIso(monthStartDate)}' AND Datum <= '${toIso(monthEndDate)}'`, 'Termine', 'COUNT(_id)', etCategoryFilter)
            ]);
            
            const wettbewerbData = await this._getWettbewerbData();

            let slidesData = [
                { title: '<i class="fas fa-bolt mr-3 text-yellow-400"></i>Wochenbeste Eigen-EH', data: wochenEhRanking, unit: 'EH' },
                { title: '<i class="fas fa-user-plus mr-3 text-blue-400"></i>Wochenbeste Recruiter (ETs)', data: wochenEtRanking, unit: 'ETs' },
                { type: 'wettbewerb', ...wettbewerbData },
                { title: '<i class="fas fa-crown mr-3 text-gold"></i>Monatsbeste Eigen-EH', data: monatsEhRanking, unit: 'EH' },
                { title: '<i class="fas fa-trophy mr-3 text-yellow-300"></i>Monatsbeste Recruiter (ETs)', data: monatsEtRanking, unit: 'ETs' },
                { type: 'wettbewerb', ...wettbewerbData },
            ];

            console.log('[DEBUG] Verarbeitete Slide-Daten vor dem Rendern:', slidesData);
            this.slideshowContainer.innerHTML = '';
            this.slides = [];

            slidesData.forEach(slideData => {
                const slide = (slideData.type === 'wettbewerb')
                    ? this._createWettbewerbSlide(slideData)
                    : this._createRankingSlide(slideData);
                this.slideshowContainer.appendChild(slide);
                this.slides.push(slide);
            });

            this.lastUpdatedTime.textContent = new Date().toLocaleTimeString('de-DE');

        } catch (error) {
            console.error('[Bildschirm] Fehler beim Laden der Ranglisten-Daten:', error);
        }
    }

    _createRankingSlide(ranking) {
                const slide = document.createElement('div');
                slide.className = 'leaderboard-card flex flex-col';
                slide.innerHTML = `<h2 class="leaderboard-title">${ranking.title}</h2><div class="leaderboard-list flex-grow flex flex-col justify-around"></div>`;
                this._renderList(slide.querySelector('.leaderboard-list'), ranking.data, ranking.unit);
        return slide;
    }

    _createWettbewerbSlide(data) {
        const slide = document.createElement('div');
        slide.className = 'leaderboard-card flex flex-col wettbewerb-slide'; // Neue Klasse für Styling

        // Zufälliges Hintergrundbild auswählen
        const bgImage = this.wettbewerbImages[Math.floor(Math.random() * this.wettbewerbImages.length)];
        slide.style.backgroundImage = `linear-gradient(rgba(0, 33, 71, 0.8), rgba(4, 60, 100, 0.8)), url('${bgImage}')`;
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';

        const renderList = (title, items, icon, colorClass) => {
            const listItemsHtml = items.length > 0
                ? items.map(item => `<div class="bg-black/20 p-2 rounded-md flex justify-between items-center"><span>${item.name}</span><span class="font-bold text-sm">${item.count} MA</span></div>`).join('')
                : '<div class="text-center text-gray-400 italic p-2">- Bisher niemand -</div>';

            return `
                <div>
                    <h4 class="text-lg font-semibold ${colorClass} mb-2 flex items-center"><i class="fas ${icon} mr-2"></i>${title}</h4>
                    <div class="space-y-1 text-left">
                        ${listItemsHtml}
                    </div>
                </div>
            `;
        };

        slide.innerHTML = `
            <div class="text-center mb-4">
                <h2 class="text-3xl font-extrabold text-white tracking-tight">Manager Reise 2026 🏆</h2>
                <p class="text-2xl font-bold text-accent-gold mt-1">10.000€ Reisebudget Zuschuss! 💸</p>
            </div>
            <div class="text-center text-sm text-gray-300 bg-black/20 p-2 rounded-md mb-4">
                Mindestens JGST + 4 aktive Mitarbeiter in der direkten Gruppe. Stichtag: 07.01.2026
            </div>
            <div class="text-center text-sm mb-4">
                <span class="font-semibold text-gray-200">Zeit übrig:</span>
                <span class="countdown-timer font-mono tracking-wider ml-2 text-white"></span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                ${renderList('Qualifiziert', data.qualified, 'fa-check-circle', 'text-skt-green-accent')}
                ${renderList('Anwärter', data.contenders, 'fa-hourglass-half', 'text-yellow-400')}
            </div>
        `;

        this._startOrUpdateCountdown(slide.querySelector('.countdown-timer'));
        return slide;
    }

    _startOrUpdateCountdown(element) {
        if (!element) return;
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        const deadline = new Date('2026-01-07T00:00:00').getTime();
        const update = () => {
            const now = new Date().getTime();
            const distance = deadline - now;
            if (distance < 0) {
                element.textContent = "Wettbewerb beendet!";
                clearInterval(this.countdownInterval);
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            element.textContent = `${days}T ${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M ${seconds.toString().padStart(2, '0')}S`;
        };
        update();
        this.countdownInterval = setInterval(update, 1000);
    }

    async _getWettbewerbData() {
        const leaders = db.mitarbeiter.filter(m => isUserLeader(m) && m.Status !== 'Ausgeschieden');
        const qualified = [];
        const contenders = [];

        for (const leader of leaders) {
            const qualifyingSubs = await this._getQualifyingSubordinates(leader._id);
            const count = qualifyingSubs.length;
            const subNames = qualifyingSubs.map(s => s.Name); // NEU

            if (count >= 4) {
                qualified.push({ name: leader.Name, count: count, subNames }); // NEU: subNames hinzufügen
            } else if (count >= 2 && count <= 3) {
                contenders.push({ name: leader.Name, count: count, subNames }); // NEU: subNames hinzufügen
            }
        }
        return {
            qualified: qualified.sort((a, b) => b.count - a.count),
            contenders: contenders.sort((a, b) => b.count - a.count)
        };
    }

    async _getQualifyingSubordinates(leaderId) {
        const directSubordinates = getSubordinates(leaderId, 'gruppe');
        if (directSubordinates.length === 0) return [];

        // Calculate date range for the last 2 sales months
        const { startDate: currentCycleStart } = getMonthlyCycleDatesForDate(new Date());
        const prevCycleStart = new Date(currentCycleStart);
        prevCycleStart.setMonth(prevCycleStart.getMonth() - 2);
        const { startDate: twoMonthsAgoStart } = getMonthlyCycleDatesForDate(prevCycleStart);
        const { endDate: currentCycleEnd } = getMonthlyCycleDatesForDate(new Date());

        const startDateIso = twoMonthsAgoStart.toISOString().split('T')[0];
        const endDateIso = currentCycleEnd.toISOString().split('T')[0];

        const subordinateIds = directSubordinates.map(s => `'${s._id}'`).join(',');
        const subordinateNames = directSubordinates.map(s => `'${this.escapeSql(s.Name)}'`).join(',');

        const query = `SELECT Mitarbeiter_ID, SUM(EH) as totalEH FROM Umsatz WHERE Mitarbeiter_ID IN (${subordinateNames}) AND Datum >= '${startDateIso}' AND Datum <= '${endDateIso}' GROUP BY Mitarbeiter_ID`;
        const umsatzResultsRaw = await seaTableSqlQuery(query, true);
        const umsatzResults = mapSqlResults(umsatzResultsRaw || [], 'Umsatz');

        const qualifyingIds = new Set(
            umsatzResults
                .filter(r => r.totalEH >= 1)
                .map(r => r.Mitarbeiter_ID[0].row_id)
        );

        return directSubordinates.filter(s => qualifyingIds.has(s._id));
    }

    escapeSql(str) {
        if (!str) return '';
        return str.replace(/'/g, "''");
    }

    _renderList(container, data, unit) {
        container.innerHTML = '';
        const displayData = [...data];
        while (displayData.length < 3) {
            displayData.push(null);
        }

        displayData.forEach((item, index) => {
            const rankIcons = ['<i class="fas fa-crown text-gold mr-3"></i>', '<i class="fas fa-medal text-gray-300 mr-3"></i>', '<i class="fas fa-award text-yellow-600 mr-3"></i>'];
            const icon = rankIcons[index];
            const itemEl = document.createElement('div');
            itemEl.className = `leaderboard-item ${!item ? 'leaderboard-item-empty' : ''}`;

            if (item) {
                itemEl.innerHTML = `<div class="flex items-center">${icon}<span>${item.name}</span></div><span class="font-bold text-lg">${item.value.toLocaleString('de-DE', { maximumFractionDigits: unit === 'EH' ? 2 : 0 })} ${unit}</span>`;
            } else {
                itemEl.innerHTML = `<div class="flex items-center opacity-50">${icon}<span>-</span></div><span class="font-bold text-lg opacity-50">-</span>`;
            }
            container.appendChild(itemEl);
        });
    }

    startScheduledDataRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        const refreshTimes = ['10:00', '12:00', '15:00', '18:00', '20:00', '22:00'];
        let lastRefreshTime = null;

        this.refreshInterval = setInterval(async () => {
            const currentTime = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            if (refreshTimes.includes(currentTime) && lastRefreshTime !== currentTime) {
                console.log(`[Bildschirm] Geplante Aktualisierung um ${currentTime} wird ausgeführt.`);
                lastRefreshTime = currentTime;
                await this.fetchAndRenderRankings();
            }
        }, 60 * 1000);
        console.log('[Bildschirm] Geplante Aktualisierung eingerichtet für:', refreshTimes);
    }

    startSlideshow() {
        if (this.slideshowInterval) clearInterval(this.slideshowInterval);
        if (this.slides.length === 0) return;

        this.currentSlideIndex = -1;
        this._showNextSlide();
        this.slideshowInterval = setInterval(() => this._showNextSlide(), 7000);
    }

    _showNextSlide() {
        if (this.slides.length === 0) return;
        if (this.currentSlideIndex >= 0) {
            this.slides[this.currentSlideIndex].classList.remove('active');
        }
        this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
        this.slides[this.currentSlideIndex].classList.add('active');
        
        this.progressBar.classList.remove('progress-bar-animate');
        void this.progressBar.offsetWidth;
        this.progressBar.classList.add('progress-bar-animate');
    }

    toggleZoom() {
        this.currentZoomIndex = (this.currentZoomIndex + 1) % this.zoomLevels.length;
        const scale = this.zoomLevels[this.currentZoomIndex];
        if (this.zoomWrapper) {
            this.zoomWrapper.style.transform = `scale(${scale})`;
        }
        this.zoomBtn.innerHTML = `<i class="fas fa-search-plus mr-1"></i> ${Math.round(scale * 100)}%`;
    }
}

async function initialize() {
    console.log('[Bildschirm] Initialisiere Standalone-Bildschirm-Ansicht...');
    
    await getSeaTableAccessToken();
    if (!seaTableAccessToken) {
        document.body.innerHTML = `<div class="text-white text-center p-8">Fehler bei der Verbindung zur Datenbank.</div>`;
        return;
    }

    // Lade alle benötigten Daten
    try {
        COLUMN_MAPS = await fetchColumnMaps();
        const [mitarbeiter, karriereplan] = await Promise.all([
            seaTableQuery("Mitarbeiter"),
            seaTableQuery("Karriereplan"),
        ]);
        db.mitarbeiter = mitarbeiter;
        db.karriereplan = karriereplan;

        // KORREKTUR: Lade nur die Umsätze der letzten 3 Monate, genau wie in main.js.
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const startDateIso = threeMonthsAgo.toISOString().split('T')[0];
        // KORREKTUR: Die Abfrage muss alle Spalten explizit benennen, um mit mapSqlResults zu funktionieren.
        const umsatzQuery = `SELECT _id, Datum, Mitarbeiter_ID, EH FROM Umsatz WHERE Datum >= '${startDateIso}'`;
        const umsatzData = await seaTableSqlQuery(umsatzQuery, true);
        // KORREKTUR: mapSqlResults muss hier aufgerufen werden, um die Spaltennamen zu normalisieren.
        db.umsatz = mapSqlResults(umsatzData || [], 'Umsatz');

        console.log(`[DEBUG] ${db.mitarbeiter.length} Mitarbeiter, ${db.karriereplan.length} Karriereplan-Einträge, ${db.umsatz.length} Umsätze geladen.`);
    } catch (error) {
        console.error("Fehler beim Laden der initialen Daten:", error);
        document.getElementById('leaderboard-slideshow-container').innerHTML = `<div class="text-red-500">${error.message}</div>`;
        return;
    }

    normalizeAllData();

    const bildschirmView = new BildschirmView();
    await bildschirmView.init();
}

document.addEventListener("DOMContentLoaded", initialize);

function normalizeAllData() {
    const tableNames = Object.keys(db).filter(name => COLUMN_MAPS[name]);

    for (const tableName of tableNames) {
        const tableMeta = METADATA.tables?.find(t => t.name.toLowerCase() === tableName);
        if (!tableMeta || !Array.isArray(db[tableName])) continue;

        db[tableName] = db[tableName].map(row => {
            const newRow = { ...row };
            for (const colName in COLUMN_MAPS[tableName]) {
                const colKey = COLUMN_MAPS[tableName][colName];
                const colMeta = tableMeta.columns.find(c => c.key === colKey);
                let value = row[colKey];

                if (value !== undefined && value !== null) {
                    if (colMeta && colMeta.type === "link" && Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        const linkObject = value[0];
                        newRow[colName] = (colName === "Karrierestufe") ? linkObject.display_value : linkObject.row_id;
                        continue;
                    } else if (colMeta && colMeta.type === "single-select") {
                        const option = colMeta.data.options.find(opt => opt.id === value);
                        value = option ? option.name : value;
                    } else if (colMeta && (colMeta.type === "link-formula" || colMeta.type === "lookup") && Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
                        value = value[0].display_value;
                    }
                }
                newRow[colName] = value;
            }
            return newRow;
        });
    }
}