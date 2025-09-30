// Dieses Skript ist eine eigenständige Version für die beratung.html
// Es enthält nur die Logik, die für die Beratungs-Ansicht notwendig ist.

// --- KONSTANTEN & GLOBALE VARIABLEN (aus main.js kopiert) ---
const SEATABLE_API_TOKEN = "b148f4c735d193f77841ce4e4ddb2bb8bc2e446b";
const SEATABLE_APP_ACCESS_TOKEN_URL = "https://cloud.seatable.io/api/v2.1/dtable/app-access-token/";
const SEATABLE_DTABLE_UUID = "5b374b51-789c-4aac-a12f-02574f8f4855";

let seaTableAccessToken = null;
let apiGatewayUrl = null;
let COLUMN_MAPS = {};
let METADATA = {};
let db = {
    produktauswahl: [],
    mitarbeiter: [],
};

// --- HILFSFUNKTIONEN (aus main.js kopiert) ---

async function getSeaTableAccessToken() {
    try {
        const url = `${SEATABLE_APP_ACCESS_TOKEN_URL}?dtable_uuid=${SEATABLE_DTABLE_UUID}`;
        const response = await fetch(url, { headers: { Authorization: `Token ${SEATABLE_API_TOKEN}` } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        seaTableAccessToken = data.access_token;
        apiGatewayUrl = data.dtable_server;
    } catch (error) {
        console.error("Error getting SeaTable access token:", error);
    }
}

async function seaTableQuery(tableName) {
    if (!seaTableAccessToken) await getSeaTableAccessToken();
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

async function genericAddRowWithLinks(tableName, rowDataWithKeys, linkColumnNames) {
    if (!seaTableAccessToken || !apiGatewayUrl) return false;

    const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));
    const linkData = {};
    const rowDataForCreation = { ...rowDataWithKeys };

    linkColumnNames.forEach(colName => {
        const colKey = tableMap[colName];
        if (Object.prototype.hasOwnProperty.call(rowDataForCreation, colKey)) {
            linkData[colName] = rowDataForCreation[colKey]?.[0] || null;
            delete rowDataForCreation[colKey];
        }
    });

    const rowDataWithNames = {};
    for (const key in rowDataForCreation) {
        const name = reversedMap[key];
        if (name) rowDataWithNames[name] = (rowDataForCreation[key] === undefined || rowDataForCreation[key] === '') ? null : rowDataForCreation[key];
    }

    const newRowId = await genericSeaTableAddRow(tableName, rowDataWithNames);
    if (!newRowId) return false;

    for (const colName in linkData) {
        if (linkData[colName] && !(await updateSingleLink(tableName, newRowId, colName, [linkData[colName]]))) return false;
    }
    return true;
}

async function genericSeaTableAddRow(tableName, rowDataWithNames) {
    try {
        const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/`;
        const body = { table_name: tableName, rows: [rowDataWithNames] };
        const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${seaTableAccessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const result = await response.json();
        if (!response.ok || !result.row_ids || result.row_ids.length === 0) {
            throw new Error(`Create failed: ${result.error_message || 'No row ID returned'}`);
        }
        const newRowId = result.row_ids[0]?._id;
        if (!newRowId) throw new Error("Could not get new row ID");
        return newRowId;
    } catch (error) {
        console.error(`[GENERIC-ADD-ROW] Failed to add row to ${tableName}:`, error);
        return null;
    }
}

async function updateSingleLink(baseTableName, baseRowId, linkColumnName, otherRowIds) {
    if (!seaTableAccessToken || !apiGatewayUrl) return false;
    try {
        const baseTableMeta = METADATA.tables.find(t => t.name.toLowerCase() === baseTableName.toLowerCase());
        if (!baseTableMeta) throw new Error(`Could not find metadata for table '${baseTableName}'`);

        const linkColumnMeta = baseTableMeta.columns.find(c => c.name === linkColumnName);
        if (!linkColumnMeta || !linkColumnMeta.data || !linkColumnMeta.data.link_id) throw new Error(`Could not find link metadata for column '${linkColumnName}' in table '${baseTableName}'`);

        const otherTableId = linkColumnMeta.data.other_table_id;

        const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/links/`;
        const body = {
            table_id: baseTableMeta._id,
            other_table_id: otherTableId,
            link_id: linkColumnMeta.data.link_id,
            other_rows_ids_map: {
                [baseRowId]: Array.isArray(otherRowIds) ? otherRowIds.filter(Boolean) : (otherRowIds ? [otherRowIds] : [])
            }
        };
        
        const response = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${seaTableAccessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!response.ok) {
            throw new Error(`Link update for ${linkColumnName} failed: ${response.status} ${await response.text()}`);
        }
        return true;
    } catch (error) {
        console.error(`Error updating link for ${linkColumnName}:`, error);
        return false;
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

// --- BERATUNG VIEW LOGIK (aus beratung.js kopiert und angepasst) ---

const beratungLog = (message, ...data) => console.log(`%c[Beratung] %c${message}`, 'color: #8e44ad; font-weight: bold;', 'color: black;', ...data);

class BeratungView {
    constructor() {
        this.initialized = false;
        this.currentSlide = 0;
        this.slides = [];
        this.beratungData = {
            kundenname: '',
            mitarbeiterId: null,
            startTime: null,
            kategorien: [],
            agenda: [],
        };
    }

    _getDomElements() {
        this.root = document.getElementById('beratung-root');
        this.slidesContainer = document.getElementById('beratung-slides-container');
        this.navContainer = document.getElementById('beratung-nav');
        this.backBtn = document.getElementById('beratung-back-btn');
        this.nextBtn = document.getElementById('beratung-next-btn');
        this.bgImage = document.getElementById('beratung-bg-image');
        this.slides = Array.from(document.querySelectorAll('.beratung-slide'));
        this.kundennameInput = document.getElementById('beratung-kundenname-input');
        this.welcomeKundenname = document.getElementById('beratung-welcome-kundenname');
        this.kategorienContainer = document.getElementById('beratung-kategorien-container');
        this.agendaContainer = document.getElementById('beratung-agenda-container');
        this.kategorieDetailsContainer = document.getElementById('beratung-slide-kategorie-details');
        return this.root && this.slides.every(Boolean) && this.backBtn && this.nextBtn;
    }

    async init() {
        beratungLog('Initialisiere Beratungs-Ansicht...');        
        if (!this._getDomElements()) {
            beratungLog('!!! FEHLER: Benötigte DOM-Elemente wurden nicht gefunden.');
            return;
        }
        
        this._setupEventListeners();
        this.currentSlide = 0;
        this._showSlide(this.currentSlide);
        this.kundennameInput.focus();
        this.initialized = true;
        beratungLog('Beratungs-Ansicht erfolgreich initialisiert.');
    }

    _setupEventListeners() {
        this.nextBtn.addEventListener('click', () => this._handleNext());
        this.backBtn.addEventListener('click', () => this._handleBack());
        this.kundennameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.kundennameInput.value.trim()) {
                this._handleNext();
            }
        });
    }

    _showSlide(slideIndex) {
        this.slides.forEach((slide, index) => {
            slide.classList.toggle('hidden', index !== slideIndex);
        });
        this.currentSlide = slideIndex;
        this.backBtn.classList.toggle('hidden', slideIndex === 0);
        this.nextBtn.disabled = false;
        if (slideIndex === 1) {
            this.bgImage.style.backgroundImage = `url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop')`;
            this.bgImage.classList.remove('opacity-0');
        } else {
            this.bgImage.classList.add('opacity-0');
        }
        if (slideIndex === 2) this._renderKategorien();
        if (slideIndex === 3) this._renderAgenda();
        if (slideIndex > 3 && slideIndex < this.slides.length - 2) this._renderKategorieDetailSlide(slideIndex - 4);
    }

    _handleNext() {
        if (this.currentSlide === 0) {
            const kundenname = this.kundennameInput.value.trim();
            if (!kundenname) { alert('Bitte geben Sie einen Kundennamen ein.'); return; }
            this.beratungData.kundenname = kundenname;
            this.welcomeKundenname.textContent = `für ${kundenname}`;
            this.beratungData.startTime = new Date();
        }
        if (this.currentSlide === 2) {
            this.beratungData.kategorien = Array.from(this.kategorienContainer.querySelectorAll('.kategorie-item.selected')).map(el => el.dataset.kategorie);
            if (this.beratungData.kategorien.length === 0) { alert('Bitte wählen Sie mindestens ein Thema aus.'); return; }
        }
        if (this.currentSlide === 3) {
            this.beratungData.agenda = Array.from(this.agendaContainer.querySelectorAll('.agenda-item')).map(el => el.textContent);
            this._createDynamicCategorySlides();
        }
        if (this.currentSlide === this.slides.length - 2) this._saveBeratung();
        if (this.currentSlide < this.slides.length - 1) this._showSlide(this.currentSlide + 1);
    }

    _handleBack() {
        if (this.currentSlide > 0) {
            if (this.currentSlide >= 4) this._removeDynamicCategorySlides();
            this._showSlide(this.currentSlide - 1);
        }
    }

    _renderKategorien() {
        this.kategorienContainer.innerHTML = '';
        const kategorien = db.produktauswahl.map(p => p.Kategorien).filter(Boolean);
        const uniqueKategorien = [...new Set(kategorien)];
        uniqueKategorien.forEach(kat => {
            const item = document.createElement('div');
            item.className = 'kategorie-item p-6 rounded-lg text-center font-semibold text-lg cursor-pointer';
            item.textContent = kat;
            item.dataset.kategorie = kat;
            item.addEventListener('click', () => item.classList.toggle('selected'));
            this.kategorienContainer.appendChild(item);
        });
    }

    _renderAgenda() {
        this.agendaContainer.innerHTML = '';
        const sortedKategorien = [...this.beratungData.kategorien].sort((a, b) => (a === 'Investment' ? -1 : b === 'Investment' ? 1 : 0));
        sortedKategorien.forEach(kat => {
            const item = document.createElement('div');
            item.className = 'agenda-item p-4 rounded-lg text-lg flex items-center justify-between';
            item.innerHTML = `<span>${kat}</span><i class="fas fa-bars text-gray-400"></i>`;
            this.agendaContainer.appendChild(item);
        });
        new Sortable(this.agendaContainer, { animation: 150, ghostClass: 'bg-skt-blue-light' });
    }

    _createDynamicCategorySlides() {
        this.slides = this.slides.slice(0, 4);
        this.beratungData.agenda.forEach((kategorie, index) => {
            const slide = document.createElement('div');
            slide.id = `beratung-slide-detail-${index}`;
            slide.className = 'beratung-slide hidden w-full';
            this.slidesContainer.appendChild(slide);
            this.slides.push(slide);
        });
        this.slides.push(document.getElementById('beratung-slide-abschluss'));
    }

    _removeDynamicCategorySlides() {
        this.slides.slice(4, -1).forEach(slide => slide.remove());
        this.slides = this.slides.slice(0, 4);
        this.slides.push(document.getElementById('beratung-slide-abschluss'));
    }

    _renderKategorieDetailSlide(index) {
        const kategorie = this.beratungData.agenda[index];
        const slide = this.slides[4 + index];
        if (!slide) return;
        slide.innerHTML = `<h2 class="text-4xl font-bold text-center mb-8">${kategorie}</h2><p class="text-center text-xl text-gray-300">Platzhalter für die Produktauswahl zum Thema ${kategorie}.</p>`;
    }

    async _saveBeratung() {
        beratungLog('Speichere Beratung...');
        this.navContainer.classList.add('hidden');
        const dauer = Math.round((new Date() - this.beratungData.startTime) / 1000);
        const rowData = {
            [COLUMN_MAPS.beratung.Kunde]: this.beratungData.kundenname,
            [COLUMN_MAPS.beratung.Mitarbeiter]: this.beratungData.mitarbeiterId ? [this.beratungData.mitarbeiterId] : null,
            [COLUMN_MAPS.beratung.Datum]: this.beratungData.startTime.toISOString(),
            [COLUMN_MAPS.beratung.Dauer]: dauer,
            [COLUMN_MAPS.beratung.Kategorien]: this.beratungData.kategorien.join(', '),
            [COLUMN_MAPS.beratung.Prioritaeten]: this.beratungData.agenda.join(', '),
        };
        const success = await genericAddRowWithLinks('Beratung', rowData, ['Mitarbeiter']);
        if (success) {
            beratungLog('Beratung erfolgreich gespeichert.');
            setTimeout(() => { window.location.search = ''; }, 2000);
        } else {
            alert('Fehler beim Speichern der Beratung.');
            this.navContainer.classList.remove('hidden');
        }
    }
}

// --- INITIALISIERUNG ---
async function initialize() {
    beratungLog('Initialisiere Standalone-Beratungs-Ansicht...');
    const rootEl = document.getElementById('beratung-root');
    rootEl.innerHTML = '<div class="loader-white mx-auto"></div><p class="mt-4">Lade Modul...</p>';
    
    await getSeaTableAccessToken();
    if (!seaTableAccessToken) return;

    COLUMN_MAPS = await fetchColumnMaps();
    
    // Lade nur die absolut notwendigen Daten
    db.produktauswahl = await seaTableQuery('Produktauswahl');
    db.mitarbeiter = await seaTableQuery('Mitarbeiter');

    rootEl.innerHTML = ''; // Leere den Lade-Indikator
    const response = await fetch("./beratung.html");
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const content = doc.getElementById('beratung-root').innerHTML;
    rootEl.innerHTML = content;

    const beratungView = new BeratungView();
    // Da es keinen Login gibt, übergeben wir null als currentUser.
    // Die View muss damit umgehen können (z.B. Mitarbeiter-Auswahl anbieten).
    await beratungView.init(null);
}

document.addEventListener("DOMContentLoaded", initialize);