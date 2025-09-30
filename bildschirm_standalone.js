// Dieses Skript ist eine eigenständige Version für die bildschirm.html
// Es enthält nur die Logik, die für die Bildschirm-Ansicht notwendig ist.

// --- KONSTANTEN ---
const SEATABLE_API_TOKEN = "b148f4c735d193f77841ce4e4ddb2bb8bc2e446b";
const SEATABLE_APP_ACCESS_TOKEN_URL = "https://cloud.seatable.io/api/v2.1/dtable/app-access-token/";
const SEATABLE_DTABLE_UUID = "5b374b51-789c-4aac-a12f-02574f8f4855";

// --- GLOBALE VARIABLEN ---
let seaTableAccessToken = null;
let apiGatewayUrl = null;
let db = { mitarbeiter: [] };

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

function findRowById(tableName, id) {
    return db[tableName.toLowerCase()]?.find((row) => row._id === id);
}

function mapSqlResults(results, tableName) {
  // In this standalone version, we don't have COLUMN_MAPS, so we return the raw results.
  // The query already aliases columns like `SUM(EH) as value`.
  return results;
}

// --- BILDSCHIRM-LOGIK ---

class BildschirmView {
    constructor() {
        this.slideshowInterval = null;
        this.slides = [];
        this.currentSlideIndex = 0;
        this.zoomLevels = [1, 0.9, 0.8, 0.7, 0.6];
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
                            mitarbeiterLinkColumnKey = key;
                            break;
                        }
                    }

                    if (!mitarbeiterLinkColumnKey) return null; // Sollte nicht passieren, wenn die Abfrage korrekt ist

                    const mitarbeiterLink = item[mitarbeiterLinkColumnKey];
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

            const rankings = [
                { title: '<i class="fas fa-bolt mr-3 text-yellow-400"></i>Wochenbeste Eigen-EH', data: wochenEhRanking, unit: 'EH' },
                { title: '<i class="fas fa-user-plus mr-3 text-blue-400"></i>Wochenbeste Recruiter (ETs)', data: wochenEtRanking, unit: 'ETs' },
                { title: '<i class="fas fa-crown mr-3 text-gold"></i>Monatsbeste Eigen-EH', data: monatsEhRanking, unit: 'EH' },
                { title: '<i class="fas fa-trophy mr-3 text-yellow-300"></i>Monatsbeste Recruiter (ETs)', data: monatsEtRanking, unit: 'ETs' }
            ];

            console.log('[DEBUG] Verarbeitete Ranking-Daten vor dem Rendern:', rankings);
            this.slideshowContainer.innerHTML = '';
            this.slides = [];

            rankings.forEach(ranking => {
                const slide = document.createElement('div');
                slide.className = 'leaderboard-card flex flex-col';
                slide.innerHTML = `<h2 class="leaderboard-title">${ranking.title}</h2><div class="leaderboard-list flex-grow flex flex-col justify-around"></div>`;
                this._renderList(slide.querySelector('.leaderboard-list'), ranking.data, ranking.unit);
                this.slideshowContainer.appendChild(slide);
                this.slides.push(slide);
            });

            this.lastUpdatedTime.textContent = new Date().toLocaleTimeString('de-DE');

        } catch (error) {
            console.error('[Bildschirm] Fehler beim Laden der Ranglisten-Daten:', error);
        }
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
    if (!seaTableAccessToken) return;

    // Nur Mitarbeiter-Daten laden, da nur diese für die Namen benötigt werden.
    try {
        const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/?table_name=Mitarbeiter&convert_link_id=true`;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${seaTableAccessToken}` } });
        if (!response.ok) throw new Error('Mitarbeiterdaten konnten nicht geladen werden.');
        const data = await response.json();
        db.mitarbeiter = data.rows;
        console.log(`[DEBUG] ${db.mitarbeiter.length} Mitarbeiterdatensätze geladen.`);
    } catch (error) {
        console.error("Fehler beim Laden der Mitarbeiterdaten:", error);
        document.getElementById('leaderboard-slideshow-container').innerHTML = `<div class="text-red-500">${error.message}</div>`;
        return;
    }

    // KORREKTUR: Die Mitarbeiterdaten müssen normalisiert werden, damit die `findRowById`-Funktion korrekt funktioniert.
    normalizeAllData();

    const bildschirmView = new BildschirmView();
    await bildschirmView.init();
}

document.addEventListener("DOMContentLoaded", initialize);

// KORREKTUR: Diese Hilfsfunktion aus main.js wird benötigt, um die Rohdaten aus der Datenbank
// in ein lesbares Format umzuwandeln (z.B. Link-IDs in Text).
function normalizeAllData() {
    if (Array.isArray(db.mitarbeiter)) {
        db.mitarbeiter = db.mitarbeiter.map((row) => {
            const newRow = { ...row };
            // In dieser Standalone-Version müssen wir keine komplexen Mappings durchführen,
            // aber wir stellen sicher, dass die Grundstruktur für `findRowById` konsistent ist.
            // Die `seaTableQuery` mit `convert_link_id=true` liefert bereits brauchbare Daten.
            // Diese Funktion dient hier hauptsächlich als Platzhalter für Konsistenz und zukünftige Erweiterungen.
            return newRow;
        });
    }
}