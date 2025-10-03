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
    produkte: [], // NEU: Die eigentliche Produkttabelle wird benötigt.
};

// KORREKTUR: Statisches Mapping von Produkt zu der entsprechenden "Besonderheiten"-Spalte in der Produktauswahl-Tabelle.
const BESONDERHEITEN_MAP = {
    'FLV': 'Besonderheiten_Investment',
    'Eigenheim': 'Besonderheiten_HHEH',
    'Haushalt': 'Besonderheiten_HHEH',
    'Rechtschutz': 'Besonderheiten_RS',
    'Fondssparen': 'Besonderheiten_Fondssparen',
    'Krankenversicherung': 'Besonderheiten_KV',
    'Unfallversicherung': 'Besonderheiten_UV',
    'Berufsunfähigkeit': 'Besonderheiten_BU',
    'Risikoleben': 'Besonderheiten_RLV',
    'Immobilie': 'Besonderheiten_Sonstiges',
    'Haftpflicht': 'Besonderheiten_Sonstiges',
    'KFZ': 'Besonderheiten_Sonstiges',
    'Finanzierung': 'Besonderheiten_Sonstiges',
    'Leasing': 'Besonderheiten_Sonstiges',
    'Strom': 'Besonderheiten_Sonstiges',
    'Gas': 'Besonderheiten_Sonstiges'
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
    // KORREKTUR: Stelle sicher, dass sowohl Token als auch URL vorhanden sind.
    // Wenn eine der beiden fehlt, hole sie neu.
    if (!seaTableAccessToken || !apiGatewayUrl) {
        await getSeaTableAccessToken();
    }
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

async function getSeaTableDownloadLink(filePath) {
    const log = (message, ...data) => console.log(`%c[DownloadLink] %c${message}`, 'color: #17a2b8; font-weight: bold;', 'color: black;', ...data);
    log(`Anfrage für Download-Link für Pfad: ${filePath}`);

    if (!SEATABLE_API_TOKEN) {
        log("!!! FEHLER: Haupt-API-Token (SEATABLE_API_TOKEN) fehlt.");
        console.error("Cannot get download link without the main SeaTable API Token.");
        return null;
    }
    try {
        // The API expects a path relative to the asset directory, e.g., "files/2024-01/document.pdf"
        // The path from the database might be a full URL.
        let relativePath = filePath;
        const assetPrefix = `/asset/${SEATABLE_DTABLE_UUID}/`;
        const assetIndex = relativePath.indexOf(assetPrefix);

        if (assetIndex !== -1) {
            // Extract the path part AFTER "/asset/<dtable_uuid>/"
            relativePath = relativePath.substring(assetIndex + assetPrefix.length);
            log(`Asset-Pfad extrahiert: ${relativePath}`);
        } else {
            log(`WARNUNG: Asset-Präfix nicht im Pfad gefunden. Verwende Pfad wie er ist: ${relativePath}`);
        }

        let rawPath;
        try {
            const correctedPath = relativePath.replace(/%6s/g, '%20');
            rawPath = decodeURIComponent(correctedPath);
            log(`Pfad dekodiert zu: ${rawPath}`);
        } catch (e) {
            log(`Konnte Pfad nicht dekodieren, wird unverändert verwendet. Fehler: ${e.message}`);
            rawPath = relativePath; // Fallback
        }

        const url = `https://cloud.seatable.io/api/v2.1/dtable/app-download-link/?dtable_uuid=${SEATABLE_DTABLE_UUID}&path=${rawPath}`;
        const response = await fetch(url, { method: 'GET', headers: { Authorization: `Token ${SEATABLE_API_TOKEN}` } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.download_link;
    } catch (error) {
        log('!!! KRITISCHER FEHLER beim Abrufen des Download-Links:', error);
        return null;
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
        this.beratungData = { // KORREKTUR: startTime wird jetzt hier initialisiert.
            kundenname: '',
            mitarbeitername: '', // NEU
            mitarbeiterId: null,
            startTime: new Date(),
            kategorien: [],
            agenda: [],
            financialGoals: [], // NEU: Speicher für ausgewählte finanzielle Ziele
        };
        // NEU: Definiert die Reihenfolge der Unter-Slides für jede Kategorie.
        // KORREKTUR: `slideFlow` wird durch eine dynamische `agendaQueue` ersetzt.
        this.agendaQueue = [];
        this.history = []; // Für die Zurück-Navigation
        // NEU: Definiert die Abfolge der Slides für jede Kategorie.
        // 'dynamic' bedeutet, dass die nächste Seite von der User-Auswahl abhängt.
        this.slideFlows = {
            'Investment': ['beratung-slide-special-FLV-Finanzielle_Ziele_Auswahl', 'beratung-slide-special-FLV-Dreikontenmodell', 'beratung-slide-special-FLV-Steuervorteilrechner', 'beratung-slide-investment-selection', 'dynamic'],
            'Recht': ['beratung-slide-explanation-Rechtschutz', 'beratung-slide-dynamic-features', 'beratung-slide-product-recommendation'],
            'Hab & Gut': ['beratung-slide-habundgut-selection', 'dynamic'],
            'Gesundheit': ['beratung-slide-explanation-Krankenversicherung', 'beratung-slide-dynamic-features', 'beratung-slide-product-recommendation'],
            'Körper & Existenz': ['beratung-slide-koerperundexistenz-selection', 'dynamic'],
            'Immobilien': ['beratung-slide-explanation-Immobilie'],
            'Haftpflicht': ['beratung-slide-explanation-Haftpflicht', 'beratung-slide-special-Haftpflicht'],
            'KFZ': ['beratung-slide-explanation-KFZ'],
            'Finanzierung': ['beratung-slide-finanzierung-selection', 'dynamic'],
            'Strom & Gas': ['beratung-slide-stromundgas-selection', 'dynamic'],
            // Sub-Flows, die von 'dynamic' getriggert werden
            'FLV': ['beratung-slide-dynamic-features', 'beratung-slide-product-recommendation'],
            'Fondssparen': ['beratung-slide-dynamic-features', 'beratung-slide-product-recommendation'],
            'Haushalt': ['beratung-slide-explanation-Haushalt', 'beratung-slide-dynamic-features', 'beratung-slide-product-recommendation'],
            'Eigenheim': ['beratung-slide-explanation-Eigenheim', 'beratung-slide-dynamic-features', 'beratung-slide-product-recommendation'],
            'Unfallversicherung': ['beratung-slide-explanation-Unfallversicherung', 'beratung-slide-dynamic-features', 'beratung-slide-product-recommendation'],
            'Berufsunfähigkeit': ['beratung-slide-explanation-Berufsunfähigkeit', 'beratung-slide-dynamic-features', 'beratung-slide-product-recommendation'],
            'Risikoleben': ['beratung-slide-explanation-Risikoleben', 'beratung-slide-dynamic-features', 'beratung-slide-product-recommendation'],
            'Kredit': ['beratung-slide-explanation-Kredit'],
            'Leasing': ['beratung-slide-explanation-Leasing'],
            'Strom': ['beratung-slide-explanation-Strom'],
            'Gas': ['beratung-slide-explanation-Gas'],
        };

        // NEU: Definiert die Start-Slides für die Navigation.
        this.navigation = {
            startPhase: [
                'beratung-slide-mitarbeitername',
                'beratung-slide-kundenname',
                'beratung-slide-welcome',
                'beratung-slide-berater-vorstellung',
                'beratung-slide-kategorien',
                'beratung-slide-agenda'
            ],
            currentPhase: 'start', // 'start' oder 'agenda'
            phaseIndex: 0,
            agendaIndex: -1, // -1 bedeutet, wir sind noch nicht in der Agenda
            subSlideIndex: 0,
            currentFlow: null, // NEU: Speichert den aktuell aktiven Flow (z.B. den Haupt- oder einen Sub-Flow)
        };

        this.currentSelection = { // NEU: Speicher für die aktuelle Auswahl
            kategorie: null,
            besonderheiten: []
        };
        this.recommendedProducts = []; // NEU: Speicher für die Top-Produktempfehlungen
    }

    _getDomElements() {
        this.root = document.getElementById('beratung-root');
        this.slidesContainer = document.getElementById('beratung-slides-container');
        this.navContainer = document.getElementById('beratung-nav');
        this.backBtn = document.getElementById('beratung-back-btn');
        this.nextBtn = document.getElementById('beratung-next-btn');
        this.bgImage = document.getElementById('beratung-bg-image');
        this.mitarbeiternameInput = document.getElementById('beratung-mitarbeitername-input'); // NEU
        this.slides = Array.from(document.querySelectorAll('.beratung-slide'));
        this.kundennameInput = document.getElementById('beratung-kundenname-input');
        this.welcomeKundenname = document.getElementById('beratung-welcome-kundenname');
        this.kategorienContainer = document.getElementById('beratung-kategorien-container');
        this.agendaContainer = document.getElementById('beratung-agenda-container');
        this.loadingOverlay = document.getElementById('beratung-loading-overlay');
        this.loadingText = document.getElementById('loading-text');
        return this.root && this.slides.every(Boolean) && this.backBtn && this.nextBtn;
    }

    _setupModalTriggers() {
        document.querySelectorAll('[data-modal-target]').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.dataset.modalTarget;
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('visible');
                    if (modalId === 'pensionsrechner-modal') {
                        this._initPensionsrechner();
                    }
                    if (modalId === 'vorsorgerechner-modal') {
                        this._initVorsorgerechner();
                    }
                }
            });
        });

        document.querySelectorAll('[data-modal-close]').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.dataset.modalClose;
                document.getElementById(modalId).classList.remove('visible');
            });
        });
    }

    async init(mitarbeiterId) {
        beratungLog('Initialisiere Beratungs-Ansicht...');
        if (!this._getDomElements()) {
            beratungLog('!!! FEHLER: Benötigte DOM-Elemente nicht gefunden.');
            return;
        }
        this.beratungData.mitarbeiterId = mitarbeiterId;
        this._setupEventListeners();
        this._renderKategorien();
        this._showSlide(this.navigation.startPhase[0]); // Zeige den ersten Slide (Kundennamen-Eingabe)
        this.initialized = true;
    }

    _setupEventListeners() {
        this.nextBtn.addEventListener('click', () => this._navigateNext());
        this.backBtn.addEventListener('click', () => this._navigateBack());

        // KORREKTUR: Ruft jetzt eine dedizierte Funktion auf, um den Button-Status zu aktualisieren.
        this.mitarbeiternameInput.addEventListener('input', () => this._updateNavButtons());
        this.kundennameInput.addEventListener('input', () => this._updateNavButtons());

        this.mitarbeiternameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.nextBtn.click();
            }
        });
        this.kundennameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.nextBtn.click();
            }
        });
    }
    
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }

    _showSlide(slideId) {
        beratungLog(`Zeige Slide: ${slideId}`);

        // Finde die aktuell aktive Folie und blende sie aus
        const oldSlide = this.slides.find(s => s.classList.contains('active'));
        if (oldSlide) {
            oldSlide.classList.remove('active'); // Startet die Fade-Out-Animation
            oldSlide.classList.add('is-hiding'); // Markiert die Folie als "wird ausgeblendet"
            
            // Nachdem die Animation beendet ist, setze display: none
            oldSlide.addEventListener('transitionend', () => {
                oldSlide.classList.remove('is-hiding');
            }, { once: true });
        }

        // Finde die neue Folie und blende sie ein
        const newSlide = this.slides.find(s => s.id === slideId);
        if (newSlide) {
            newSlide.classList.remove('is-hiding'); // Sicherstellen, dass sie nicht versteckt ist
            newSlide.classList.add('active'); // Startet die Fade-In-Animation

            // NEU: Hintergrundbild für die ersten beiden Slides einblenden
            const showBg = ['beratung-slide-mitarbeitername', 'beratung-slide-kundenname', 'beratung-slide-welcome'].includes(slideId);
            this.bgImage.classList.toggle('opacity-30', showBg);

            this.currentSlideId = slideId; // Speichere die aktuelle Slide-ID

            // NEU: Prüfe, ob es sich um eine "Säulenauswahl"-Seite handelt und rendere den Inhalt.
            if (slideId.includes('-selection')) {
                const kategorie = this.beratungData.agenda[this.navigation.agendaIndex];
                this._renderSubCategorySelection(kategorie);
            }

            // NEU: Prüfe, ob es sich um die "Besonderheiten"-Seite handelt und rendere den Inhalt.
            if (slideId === 'beratung-slide-dynamic-features') {
                this._renderBesonderheiten();
            }

            // NEU: Prüfe, ob es sich um die Berater-Vorstellungsseite handelt
            if (slideId === 'beratung-slide-berater-vorstellung') {
                this._renderBeraterVorstellung();
            }

            // NEU: Prüfe, ob es sich um die "Finanzielle Ziele"-Seite handelt
            if (slideId === 'beratung-slide-special-FLV-Finanzielle_Ziele_Auswahl') {
                this._renderFinancialGoals();
                this._setupModalTriggers(); // NEU: Event-Listener für die Modal-Buttons setzen
            }

            // NEU: Prüfe, ob es sich um das "3-Konten-Modell" handelt
            if (slideId === 'beratung-slide-special-FLV-Dreikontenmodell') {
                this._initThreeAccountsModel();
            }

            // NEU: Prüfe, ob es sich um den "Steuervorteilrechner" handelt
            if (slideId === 'beratung-slide-special-FLV-Steuervorteilrechner') {
                this._initSteuervorteilrechner();
            }

            // NEU: Prüfe, ob es sich um die Rechtsschutz-Seite handelt
            if (slideId === 'beratung-slide-explanation-Rechtschutz') {
                this._renderRechtsschutzChart();
            }

            // NEU: Prüfe, ob es sich um die Haushalts-Seite handelt
            if (slideId === 'beratung-slide-explanation-Haushalt') {
                this._renderHaushaltChart();
            }

            // NEU: Prüfe, ob es sich um die Eigenheim-Seite handelt
            if (slideId === 'beratung-slide-explanation-Eigenheim') {
                this._renderEigenheimChart();
            }

            // NEU: Prüfe, ob es sich um die "Produktempfehlung"-Seite handelt und rendere den Inhalt.
            if (slideId === 'beratung-slide-product-recommendation') {
                // KORREKTUR: Die Rendering-Logik wird jetzt asynchron nach der Ladeanimation aufgerufen.
                // Der Aufruf erfolgt in _navigateNext.
            }
            this._updateNavButtons(); // KORREKTUR: Button-Status bei jedem Slide-Wechsel aktualisieren.
        } else {
            beratungLog(`!!! FEHLER: Slide mit ID '${slideId}' nicht gefunden.`);
        }
                this._renderEigenheimChart();
    }

    async _navigateNext() {
        const currentSlideId = this.currentSlideId;
        this.history.push(currentSlideId); // Aktuelle Seite zur History hinzufügen

        
        // NEU: Spezielle Logik für das 3-Konten-Modell
        if (currentSlideId === 'beratung-slide-special-FLV-Dreikontenmodell') {
            if (this._showNextThreeAccountsStep()) {
                this.history.pop(); // Bleibe auf dem Slide, entferne den Navigationsschritt aus der History
                return; // Stoppe die weitere Navigation
            }
        }
        
        // NEU: Speichere die ausgewählten finanziellen Ziele
        if (currentSlideId === 'beratung-slide-special-FLV-Finanzielle_Ziele_Auswahl') {
            const container = document.getElementById('financial-goals-container');
            this.beratungData.financialGoals = container 
                ? Array.from(container.querySelectorAll('.goal-card.selected')).map(el => el.dataset.kategorie)
                : [];
        }

        // KORREKTUR: Das Auslesen der Besonderheiten muss hier erfolgen, bevor die Phasenlogik beginnt,
        // da dieser Slide in der 'agenda'-Phase aufgerufen wird.
        if (currentSlideId === 'beratung-slide-dynamic-features') {
            const container = document.getElementById('dynamic-features-container');
            this.currentSelection.besonderheiten = container 
                ? Array.from(container.querySelectorAll('.kategorie-item.selected')).map(el => el.dataset.feature)
                : [];
            
            // NEU: Ladeanimation vor der Produktempfehlung anzeigen
            this._showLoadingOverlay(true, [
                'Passende Produkte werden gesucht...',
                'Gesellschaften werden verglichen...',
                'Vorteile werden abgewogen...'
            ]);
            await new Promise(resolve => setTimeout(resolve, 4500)); // Wartezeit für die Animation
            this._renderProductRecommendation();
            this._showLoadingOverlay(false);
            // Die Navigation wird hier gestoppt und erst nach dem Rendern fortgesetzt.
            // Der nächste Klick auf "Weiter" führt dann von der Empfehlungsseite weg.
        }

        // --- Logik für die Startphase ---
        if (this.navigation.currentPhase === 'start') {
            // Aktionen beim Verlassen des aktuellen Slides
            if (currentSlideId === 'beratung-slide-mitarbeitername') {
                this.beratungData.mitarbeitername = this.mitarbeiternameInput.value || 'Berater';
                // Finde die Mitarbeiter-ID basierend auf dem Namen
                // KORREKTUR: Greife auf den korrekten Spalten-Key für den Namen zu, anstatt auf 'm.Name'.
                const nameKey = COLUMN_MAPS.mitarbeiter?.Name;
                if (!nameKey) {
                    beratungLog('!!! FEHLER: Spalten-Key für "Name" in der Mitarbeiter-Tabelle nicht gefunden.', COLUMN_MAPS.mitarbeiter);
                }
                const mitarbeiter = nameKey ? db.mitarbeiter.find(m => m && m[nameKey] && m[nameKey].toLowerCase() === this.beratungData.mitarbeitername.toLowerCase()) : null;

                if (mitarbeiter) {
                    this.beratungData.mitarbeiterId = mitarbeiter._id;
                    beratungLog(`Mitarbeiter-ID für '${this.beratungData.mitarbeitername}' gefunden: ${this.beratungData.mitarbeiterId}`);
                } else {
                    beratungLog(`WARNUNG: Kein Mitarbeiter mit dem Namen '${this.beratungData.mitarbeitername}' gefunden. Speicherung erfolgt ohne Verknüpfung.`);
                    this.beratungData.mitarbeiterId = null;
                }
            } else if (currentSlideId === 'beratung-slide-kundenname') {
                this.beratungData.kundenname = this.kundennameInput.value || 'Kunde';
                this.welcomeKundenname.textContent = `für ${this._escapeHtml(this.beratungData.kundenname)}`;
            } else if (currentSlideId === 'beratung-slide-kategorien') {
                this.beratungData.kategorien = Array.from(this.kategorienContainer.querySelectorAll('.kategorie-item.selected')).map(el => el.dataset.kategorie);
                this._renderAgenda(); // KORREKTUR: Rendert die sortierbare Agenda-Liste
            } else if (currentSlideId === 'beratung-slide-agenda') {
                // KORREKTUR: Liest die sortierte Reihenfolge aus dem DOM aus.
                this.beratungData.agenda = Array.from(this.agendaContainer.querySelectorAll('.agenda-item')).map(el => el.dataset.kategorie);
                this.navigation.currentPhase = 'agenda';
                this.navigation.agendaIndex = 0;
                this.navigation.subSlideIndex = 0;
                this._navigateNext(); // Direkter Sprung zum ersten Agendapunkt
                return;
            }

            this.navigation.phaseIndex++;
            if (this.navigation.phaseIndex < this.navigation.startPhase.length) {
                const nextSlideId = this.navigation.startPhase[this.navigation.phaseIndex];
                this._showSlide(nextSlideId);
            }
            return;
        }

        // --- Logik für die Agenda-Phase ---
        if (this.navigation.currentPhase === 'agenda') {
            const currentAgendaItem = this.beratungData.agenda[this.navigation.agendaIndex];
            // KORREKTUR: Verwende den explizit gesetzten Flow oder falle auf den Haupt-Flow zurück.
            if (!this.navigation.currentFlow) {
                this.navigation.currentFlow = this.slideFlows[currentAgendaItem];
            }
            const currentFlow = this.navigation.currentFlow;

            if (!currentFlow) {
                beratungLog(`Kein Flow für Agenda-Punkt '${currentAgendaItem}' gefunden. Springe zum nächsten.`);
                this._moveToNextAgendaItem(); // KORREKTUR: Rufe die korrekte Funktion auf
                return;
            }

            const nextSubSlideId = currentFlow[this.navigation.subSlideIndex];

            if (nextSubSlideId === 'dynamic') {
                // Hier wird basierend auf der User-Auswahl der nächste Schritt bestimmt.
                const currentSlide = this.slides.find(s => s.id === this.currentSlideId);
                const selectionContainer = currentSlide ? currentSlide.querySelector('[id$="-selection-container"]') : null;

                if (selectionContainer) {
                    const selectedProducts = Array.from(selectionContainer.querySelectorAll('.selected')).map(el => el.dataset.product);

                    if (selectedProducts.length > 0) {
                        // KORREKTUR: Ersetze das aktuelle Agenda-Item durch die ausgewählten Produkte.
                        // Beispiel: 'Körper & Existenz' wird zu ['Unfallversicherung', 'Berufsunfähigkeit']
                        this.beratungData.agenda.splice(this.navigation.agendaIndex, 1, ...selectedProducts);
                        
                        // Setze den Flow zurück, damit der nächste Durchlauf den Flow für das erste neue Item holt.
                        this.navigation.currentFlow = null;
                        this.navigation.subSlideIndex = 0;

                        // Starte die Navigation für das (neu eingefügte) aktuelle Agenda-Item.
                        // Die agendaIndex bleibt gleich, zeigt aber jetzt auf das erste neue Item.
                        this._navigateNext();
                        return;

                    } else {
                        alert('Bitte treffen Sie eine Auswahl.');
                        this.history.pop(); // Korrigiert den "Zurück"-Verlauf, da keine Navigation stattgefunden hat.
                        return; // Wichtig: Beende den aktuellen Durchlauf
                    }
                }
                // TODO: Weitere 'dynamic' Fälle hier implementieren (Investment, Körper & Existenz, etc.)
            } else if (nextSubSlideId) {
                this.navigation.subSlideIndex++;
                this._showSlide(nextSubSlideId);
            } else {
                // Ende des Flows für diesen Agendapunkt
                this._moveToNextAgendaItem();
            }
        }
    }

    _moveToNextAgendaItem() {
        this.navigation.agendaIndex++;
        this.navigation.subSlideIndex = 0;
        this.navigation.currentFlow = null; // Setze den Flow für den nächsten Agendapunkt zurück
        if (this.navigation.agendaIndex < this.beratungData.agenda.length) {
            this._navigateNext(); // Nächsten Agendapunkt starten
        } else {
            this._renderAbschluss();
        }
    }

    _navigateBack() {
        if (this.history.length === 0) return;

        const previousSlideId = this.history.pop();

        // Logik, um den internen State zurückzusetzen
        if (this.navigation.currentPhase === 'agenda') {
            // Wenn wir vom ersten Sub-Slide eines Agendapunkts zurückgehen
            if (this.navigation.subSlideIndex <= 1) {
                // Wenn wir vom ersten Agendapunkt zurückgehen, landen wir wieder in der Agenda-Planung
                if (this.navigation.agendaIndex === 0) {
                    this.navigation.currentPhase = 'start';
                    this.navigation.phaseIndex = this.navigation.startPhase.indexOf('beratung-slide-agenda');
                    this.navigation.agendaIndex = -1;
                } else {
                    // Gehe zum Ende des vorherigen Agendapunkts
                    this.navigation.agendaIndex--;
                    const prevAgendaItem = this.beratungData.agenda[this.navigation.agendaIndex];
                    const prevFlow = this.slideFlows[prevAgendaItem];
                    this.navigation.subSlideIndex = prevFlow ? prevFlow.length : 0;
                }
            } else {
                this.navigation.subSlideIndex--;
            }
        } else if (this.navigation.currentPhase === 'start') {
            if (this.navigation.phaseIndex > 0) {
                this.navigation.phaseIndex--;
            }
        }

        this._showSlide(previousSlideId);
    }
    
    // NEU: Rendert die Auswahl der Besonderheiten für das aktuelle Produkt.
    _renderBesonderheiten() {
        const container = document.getElementById('beratung-slide-dynamic-features');
        if (!container) return;

        let productForFeatures = this.beratungData.agenda[this.navigation.agendaIndex];
        beratungLog(`Rendere Besonderheiten für Agenda-Punkt: ${productForFeatures}`);

        // NEU: Wenn der Agenda-Punkt eine Kategorie ist (z.B. "Recht"), finde das zugehörige Einzelprodukt (z.B. "Rechtschutz").
        // Dies ist notwendig, weil BESONDERHEITEN_MAP auf Produktnamen basiert.
        if (!BESONDERHEITEN_MAP[productForFeatures]) {
            const produktauswahlMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'produktauswahl');
            const kategorienColumn = produktauswahlMeta?.columns.find(c => c.name === 'Kategorien');
            const katOption = kategorienColumn?.data?.options.find(o => o.name === productForFeatures);
            if (katOption) {
                const produktauswahlEintraege = db.produktauswahl.filter(p => Array.isArray(p[kategorienColumn.key]) && p[kategorienColumn.key].includes(katOption.id));
                const produktLinkKey = COLUMN_MAPS.produktauswahl['Produkt'];
                const produktIds = new Set(produktauswahlEintraege.map(e => e[produktLinkKey]?.[0]?.row_id).filter(Boolean));
                const produkteInKategorie = db.produkte.filter(p => produktIds.has(p._id));
                if (produkteInKategorie.length === 1) {
                    productForFeatures = produkteInKategorie[0][COLUMN_MAPS.produkte['Produkt']];
                    beratungLog(`Einzelprodukt '${productForFeatures}' für Kategorie '${this.beratungData.agenda[this.navigation.agendaIndex]}' gefunden.`);
                }
            }
        }

        const besonderheitenColumnName = BESONDERHEITEN_MAP[productForFeatures];
        if (!besonderheitenColumnName) {
            beratungLog(`!!! FEHLER: Kein Mapping für Besonderheiten für Produkt '${productForFeatures}' gefunden.`);
            container.innerHTML = `<h2 class="text-3xl font-bold text-center mb-8">Konfigurationsfehler</h2><p class="text-center">Für dieses Produkt konnten keine Besonderheiten geladen werden.</p>`;
            return;
        }

        const produktauswahlMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'produktauswahl');
        const besonderheitenColumn = produktauswahlMeta?.columns.find(c => c.name === besonderheitenColumnName);

        if (!besonderheitenColumn || !besonderheitenColumn.data?.options) {
            beratungLog(`!!! FEHLER: Spalte '${besonderheitenColumnName}' oder deren Optionen nicht in Metadaten gefunden.`);
            container.innerHTML = `<h2 class="text-3xl font-bold text-center mb-8">Konfigurationsfehler</h2><p class="text-center">Für dieses Produkt konnten keine Besonderheiten geladen werden.</p>`;
            return;
        }

        let html = `
            <h2 class="text-4xl font-bold text-center mb-2">${this._escapeHtml(productForFeatures)}</h2>
            <p class="text-xl text-center text-gray-300 mb-8">Welche Eigenschaften sind Ihnen hier wichtig?</p>
        `;
        html += `<div id="dynamic-features-container" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">`;
        besonderheitenColumn.data.options.forEach(option => {
            html += `
                <div class="kategorie-item p-4 rounded-lg text-center font-semibold text-lg cursor-pointer" data-feature="${this._escapeHtml(option.name)}">
                    ${this._escapeHtml(option.name)}
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
        container.querySelectorAll('.kategorie-item').forEach(item => item.addEventListener('click', () => item.classList.toggle('selected')));
    }

    // NEU: Rendert die Produktempfehlungs-Seite basierend auf der Auswahl.
    async _renderProductRecommendation() {
        const container = document.getElementById('beratung-slide-product-recommendation');
        if (!container) return;

        container.innerHTML = '<div class="loader-white mx-auto"></div>'; // Ladeindikator

        let currentTopic = this.beratungData.agenda[this.navigation.agendaIndex];
        const selectedFeatures = this.currentSelection.besonderheiten;
        beratungLog(`Rendere Produktempfehlung für Thema '${currentTopic}' mit ausgewählten Features:`, selectedFeatures);

        // NEU: Logik, um den tatsächlichen Produktnamen zu finden, wenn der Agenda-Punkt eine Kategorie ist.
        // Dies ist notwendig, weil BESONDERHEITEN_MAP und die Produktsuche auf Produktnamen basieren.
        let productForRecommendation = currentTopic;
        if (!BESONDERHEITEN_MAP[productForRecommendation]) {
            const produktauswahlMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'produktauswahl');
            const kategorienColumn = produktauswahlMeta?.columns.find(c => c.name === 'Kategorien');
            const katOption = kategorienColumn?.data?.options.find(o => o.name === currentTopic);
            if (katOption) {
                const produktauswahlEintraege = db.produktauswahl.filter(p => Array.isArray(p[kategorienColumn.key]) && p[kategorienColumn.key].includes(katOption.id));
                const produktLinkKey = COLUMN_MAPS.produktauswahl['Produkt'];
                const produktIds = new Set(produktauswahlEintraege.map(e => e[produktLinkKey]?.[0]?.row_id).filter(Boolean));
                const produkteInKategorie = db.produkte.filter(p => produktIds.has(p._id));
                if (produkteInKategorie.length === 1) {
                    productForRecommendation = produkteInKategorie[0][COLUMN_MAPS.produkte['Produkt']];
                    beratungLog(`Kategorie '${currentTopic}' aufgelöst zu Einzelprodukt: '${productForRecommendation}' für Produktempfehlung.`);
                }
            }
        }

        // 1. Finde das Produkt-Objekt zum aktuellen Thema (z.B. das "FLV"-Objekt aus der Produkte-Tabelle).
        const productObject = db.produkte.find(p => p[COLUMN_MAPS.produkte['Produkt']] === productForRecommendation);
        if (!productObject) {
            container.innerHTML = `<h2 class="text-3xl font-bold text-center mb-8">Fehler</h2><p class="text-center">Konnte das Produkt '${productForRecommendation}' nicht in der Datenbank finden.</p>`;
            return;
        }

        // 2. Finde alle Einträge in "Produktauswahl", die mit diesem Produkt verknüpft sind.
        const produktLinkKey = COLUMN_MAPS.produktauswahl['Produkt'];
        const productOptions = db.produktauswahl.filter(option => option[produktLinkKey]?.[0]?.row_id === productObject._id);

        if (productOptions.length === 0) {
            container.innerHTML = `<h2 class="text-3xl font-bold text-center mb-8">Keine Produkte</h2><p class="text-center">Für '${currentTopic}' wurden keine konkreten Produktkonfigurationen gefunden.</p>`;
            return;
        }

        // 3. Finde die korrekte "Besonderheiten"-Spalte für dieses Produkt.
        const besonderheitenColumnName = BESONDERHEITEN_MAP[productForRecommendation];
        const produktauswahlMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'produktauswahl');
        const besonderheitenColumnMeta = produktauswahlMeta?.columns.find(c => c.name === besonderheitenColumnName);
        const besonderheitenColumnKey = besonderheitenColumnMeta?.key;
        const besonderheitenOptions = besonderheitenColumnMeta?.data?.options || [];

        if (!besonderheitenColumnKey) {
            container.innerHTML = `<h2 class="text-3xl font-bold text-center mb-8">Konfigurationsfehler</h2><p class="text-center">Die Spalte '${besonderheitenColumnName}' konnte nicht gefunden werden.</p>`;
            return;
        }

        // 4. Berechne den Score für jede Produktkonfiguration.
        const scoredProducts = productOptions.map(option => {
            const featureIdsInOption = option[besonderheitenColumnKey] || [];
            const featuresInOption = featureIdsInOption.map(id => besonderheitenOptions.find(opt => opt.id === id)?.name).filter(Boolean);

            let matchCount = 0;
            selectedFeatures.forEach(feature => {
                if (featuresInOption.includes(feature)) {
                    matchCount++;
                }
            });

            const score = selectedFeatures.length > 0 ? (matchCount / selectedFeatures.length) * 100 : 100; // 100% wenn nichts gewählt

            // NEU: Logo der Gesellschaft holen
            const gesellschaftId = option[COLUMN_MAPS.produktauswahl['Gesellschaft']]?.[0]?.row_id;
            const gesellschaftObj = db.gesellschaften.find(g => g._id === gesellschaftId);
            // KORREKTUR: Der Spaltenname 'Bild' muss dynamisch aus den Metadaten geholt werden, da der Key variieren kann.
            const gesellschaftenBildKey = COLUMN_MAPS.gesellschaften?.['Bild'];
            const logoUrl = gesellschaftObj && gesellschaftenBildKey ? gesellschaftObj[gesellschaftenBildKey]?.[0] : null;

            // NEU: Detailliertes Logging für die Logo-URL
            beratungLog(`[Logo-Suche] Für Produkt "${option[COLUMN_MAPS.produktauswahl['Name']]}":`);
            beratungLog(`  -> Gesellschafts-ID aus Produktauswahl: ${gesellschaftId || 'Nicht gefunden'}`);
            beratungLog(`  -> Gefundenes Gesellschafts-Objekt:`, gesellschaftObj ? 'Ja' : 'Nein');
            beratungLog(`  -> Spalten-Key für 'Bild' in 'Gesellschaften': ${gesellschaftenBildKey || 'Nicht gefunden'}`);
            beratungLog(`  -> Relative Logo-URL aus DB: ${logoUrl || 'Nicht gefunden'}`);

            return {
                name: option[COLUMN_MAPS.produktauswahl['Name']],
                gesellschaft: option[COLUMN_MAPS.produktauswahl['Gesellschaft']]?.[0]?.display_value || 'N/A',
                score: score,
                availableFeatures: featuresInOption,
                hinweis: option[COLUMN_MAPS.produktauswahl['Hinweis']] || '',
                link: option[COLUMN_MAPS.produktauswahl['Link']] || '',
                logoUrl: logoUrl || null, // KORREKTUR: Tippfehler im Property-Namen behoben
            };
        }).sort((a, b) => b.score - a.score);

        // 5. Rendere die Karten
        let html = `<h2 class="text-4xl font-bold text-center mb-8">Unsere Empfehlung für Sie</h2>`;
        html += `<div class="flex flex-col md:flex-row items-center justify-center gap-8">`;

        const bestProduct = scoredProducts[0];
        // KORREKTUR: Zeige nur die nächsten zwei besten Produkte an.
        const otherProducts = scoredProducts.slice(1, 3);

        const createCardHtml = async (product, isBest) => {
            let featuresHtml = '<ul class="space-y-2 text-left">';
            selectedFeatures.forEach(feature => {
                const hasFeature = product.availableFeatures.includes(feature);
                featuresHtml += `
                    <li class="flex items-center gap-2 ${hasFeature ? 'text-white' : 'text-gray-400 line-through'}">
                        <i class="fas ${hasFeature ? 'fa-check-circle text-skt-green-accent' : 'fa-times-circle text-skt-red-accent'}"></i>
                        <span>${this._escapeHtml(feature)}</span>
                    </li>
                `;
            });
            featuresHtml += '</ul>';

            const hinweisHtml = product.hinweis ? `<p class="text-xs text-gray-300 mt-4 italic">${this._escapeHtml(product.hinweis)}</p>` : '';
            const linkHtml = product.link ? `<a href="${product.link}" target="_blank" class="inline-block mt-4 bg-skt-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-skt-blue-light transition-colors">Mehr erfahren</a>` : '';
            
            let logoHtml = `<div class="h-12 mb-4"></div>`;
            if (product.logoUrl) {
                const finalLogoUrl = await getSeaTableDownloadLink(product.logoUrl);
                if (finalLogoUrl) {
                    logoHtml = `<img src="${finalLogoUrl}" alt="${product.gesellschaft} Logo" class="h-12 mx-auto mb-4 object-contain">`;
                }
            }

            return `
                <div class="p-6 text-center w-80 ${isBest ? 'recommendation-card-best' : 'recommendation-card-alt'} flex-shrink-0">
                    ${logoHtml}
                    <h3 class="text-2xl font-bold mb-2">${product.name}</h3>
                    <p class="text-sm text-gray-400 -mt-2 mb-4">${product.gesellschaft}</p>
                    <p class="text-5xl font-bold mb-4 ${isBest ? 'text-accent-gold' : 'text-gray-300'}">${product.score.toFixed(0)}%</p>
                    <p class="text-sm mb-4 ${isBest ? 'text-gray-200' : 'text-gray-400'}">Übereinstimmung mit Ihren Wünschen</p>
                    ${featuresHtml}
                    ${hinweisHtml}
                    ${linkHtml}
                </div>
            `;
        };

        // Baue das finale HTML zusammen
        // KORREKTUR: Das beste Produkt und die anderen werden jetzt als direkte Kinder des Flex-Containers gerendert, um das Layout zu korrigieren.
        const cardPromises = [];
        if (bestProduct) {
            cardPromises.push(createCardHtml(bestProduct, true));
        }
        otherProducts.forEach(p => cardPromises.push(createCardHtml(p, false)));

        html += (await Promise.all(cardPromises)).join('');
        html += `</div>`;

        container.innerHTML = html;
    }

    // NEU: Rendert die Auswahl-Buttons für Unterkategorien (z.B. FLV, Fondssparen)
    _renderSubCategorySelection(kategorie) {
        const containerIdMap = {
            'Investment': 'investment-selection-container',
            'Hab & Gut': 'habundgut-selection-container',
            'Körper & Existenz': 'koerperundexistenz-selection-container',
            'Finanzierung': 'finanzierung-selection-container',
            'Strom & Gas': 'stromundgas-selection-container'
        };

        const containerId = containerIdMap[kategorie];
        if (!containerId) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = ''; // Leere den Container

        // Finde die Produkte für die gegebene Kategorie
        const produktauswahlMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'produktauswahl');
        const kategorienColumn = produktauswahlMeta?.columns.find(c => c.name === 'Kategorien');
        const katOption = kategorienColumn?.data?.options.find(o => o.name === kategorie);
        if (!katOption) return;

        const produktauswahlEintraege = db.produktauswahl.filter(p => Array.isArray(p[kategorienColumn.key]) && p[kategorienColumn.key].includes(katOption.id));
        const produktLinkKey = COLUMN_MAPS.produktauswahl['Produkt'];
        const produktIds = new Set(produktauswahlEintraege.map(e => e[produktLinkKey]?.[0]?.row_id).filter(Boolean));
        const produkteInKategorie = db.produkte.filter(p => produktIds.has(p._id));

        // Erstelle die Buttons
        produkteInKategorie.forEach(produkt => {
            const productName = produkt[COLUMN_MAPS.produkte['Produkt']];
            // NEU: Wenn das Produkt "Finanzierung" ist, zeige stattdessen "Kredit" an.
            const displayProductName = productName === 'Finanzierung' ? 'Kredit' : productName;
            const button = document.createElement('div');
            button.className = 'kategorie-item p-6 rounded-lg text-center font-semibold text-xl cursor-pointer';
            button.dataset.product = displayProductName; // Verwende den neuen Namen für die Navigation
            button.textContent = displayProductName;
            button.addEventListener('click', () => {
                // KORREKTUR: Erlaube die Auswahl mehrerer Elemente durch Umschalten der 'selected'-Klasse.
                button.classList.toggle('selected');
            });
            container.appendChild(button);
        });
    }

    _renderFinancialGoals() {
        const container = document.getElementById('financial-goals-container');
        if (!container) return;

        const goals = [
            { name: 'Immobilieneigentum', icon: 'fa-home' },
            { name: 'Finanzielle Freiheit', icon: 'fa-infinity' },
            { name: 'Absicherung im Alter', icon: 'fa-shield-alt' },
            { name: 'Reisen', icon: 'fa-plane-departure' },
            { name: 'Auto', icon: 'fa-car' },
            { name: 'Notpolster', icon: 'fa-piggy-bank' },
            { name: 'Luxus', icon: 'fa-gem' },
            { name: 'Familie', icon: 'fa-users' },
        ];

        container.innerHTML = goals.map(goal => `
            <div class="kategorie-item goal-card flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer group" data-kategorie="${this._escapeHtml(goal.name)}">
                <div class="goal-icon-container flex-grow flex items-center justify-center">
                    <i class="fas ${goal.icon} fa-4x text-white opacity-70 group-hover:opacity-100 transition-opacity"></i>
                </div>
                <h3 class="text-white text-xl font-bold text-center mt-4">${goal.name}</h3>
            </div>
        `).join('');

        container.querySelectorAll('.goal-card').forEach(card => {
            card.addEventListener('click', () => card.classList.toggle('selected'));
        });
    }

    _initThreeAccountsModel() {
        const blocks = document.querySelectorAll(".line-block");
        if (blocks.length === 0) return;

        // Reset state when the slide is shown
        this._updateTimelineIcons();
        blocks.forEach(block => {
            block.querySelector(".progress").style.width = "0%";
            block.querySelectorAll(".item").forEach(item => item.classList.remove("show"));
        });

        this.threeAccountsState = {
            blockIndex: 0,
            itemIndex: -1,
            blocks: blocks
        };

        // The main 'next' button will now trigger the steps.
        // The logic is moved to a separate function to be called by the main navigator.
    }

    _showIconsForBlock(block) {
        const iconsContainer = block.querySelector('.icons-new');
        if (iconsContainer) iconsContainer.style.opacity = '1';
    }

    _updateTimelineIcons() {
        const goalToIconMap = {
            'Notpolster': { icon: 'fa-piggy-bank', timeframe: 'kurzfristig' },
            'Reisen': { icon: 'fa-plane-departure', timeframe: 'mittelfristig' },
            'Auto': { icon: 'fa-car', timeframe: 'mittelfristig' },
            'Luxus': { icon: 'fa-gem', timeframe: 'mittelfristig' },
            'Immobilieneigentum': { icon: 'fa-home', timeframe: 'langfristig' },
            'Finanzielle Freiheit': { icon: 'fa-infinity', timeframe: 'langfristig' },
            'Absicherung im Alter': { icon: 'fa-shield-alt', timeframe: 'langfristig' },
            'Familie': { icon: 'fa-users', timeframe: 'langfristig' }
        };

        const selectedGoals = this.beratungData.financialGoals || [];

        const iconsByTimeframe = {
            kurzfristig: [],
            mittelfristig: [],
            langfristig: []
        };

        selectedGoals.forEach(goalName => {
            const mapping = goalToIconMap[goalName];
            if (mapping) {
                iconsByTimeframe[mapping.timeframe].push(`<span><i class="fa-solid ${mapping.icon} fa-2x"></i>${goalName}</span>`);
            }
        });

        const updateIcons = (timeframe, defaultHtml) => {
            const container = document.getElementById(`icons-${timeframe}`);
            if (container) {
                const iconsHtml = iconsByTimeframe[timeframe].join('') || defaultHtml;
                container.innerHTML = iconsHtml;
            }
        };

        updateIcons('kurzfristig', '<i class="fa-solid fa-piggy-bank" title="Sparen"></i>');
        updateIcons('mittelfristig', '<i class="fa-solid fa-car" title="Auto"></i><i class="fa-solid fa-plane" title="Reise"></i>');
        updateIcons('langfristig', '<i class="fa-solid fa-house" title="Immobilie"></i><i class="fa-solid fa-umbrella-beach" title="Pension"></i>');
    }

    _showNextThreeAccountsStep() {
        const state = this.threeAccountsState;
        if (!state || state.blockIndex >= state.blocks.length) return false; // Animation is finished

        const block = state.blocks[state.blockIndex];
        const items = block.querySelectorAll(".item");
        const progress = block.querySelector(".progress");

        if (state.itemIndex === -1) {
            progress.style.width = block.dataset.width + "%";
            this._showIconsForBlock(block);
        }

        state.itemIndex++;
        if (state.itemIndex < items.length) {
            items[state.itemIndex].classList.add("show");
            return true; // There are more steps in this block
        } else {
            state.blockIndex++;
            state.itemIndex = -1;
            if (state.blockIndex >= state.blocks.length) {
                return false; // Finished all blocks
            } else {
                // Immediately show the first item of the next block
                return this._showNextThreeAccountsStep();
            }
        }
    }

    _initSteuervorteilrechner() {
        const container = document.getElementById('rechner-chart-container');
        const sparrateInput = document.getElementById('rechner-sparrate');
        const dauerInput = document.getElementById('rechner-dauer');
        const renditeInput = document.getElementById('rechner-rendite');
        const kestToggle = document.getElementById('rechner-kest');
        const startwertInput = document.getElementById('rechner-startwert');

        if (!container || !sparrateInput || !dauerInput || !renditeInput || !kestToggle || !startwertInput) return;

        const renderChart = () => {
            const startwert = parseFloat(startwertInput.value) || 0;
            const monthlySavings = parseFloat(sparrateInput.value) || 0;
            const years = parseInt(dauerInput.value) || 0;
            const annualReturn = (parseFloat(renditeInput.value) || 0) / 100;
            const considerKest = kestToggle.checked;

            const categories = Array.from({ length: years }, (_, i) => `Jahr ${i + 1}`);
            const seriesData = {
                einzahlung: [], // Was wurde eingezahlt?
                fondsdepot: [],  // Was kommt im Fondsdepot nach KESt raus?
                flv: []          // Was kommt in der FLV raus?
            };

            let totalEinzahlung = startwert;
            let kapitalOhneKest = 0;
            let kapitalMitKest = startwert;
            let totalKest = 0;
            const annualSavings = monthlySavings * 12;
            // NEU: Berechnung für FLV, Startwert wird berücksichtigt
            let flvKapital = startwert;

            

            for (let i = 1; i <= years; i++) {
                totalEinzahlung += annualSavings;
                
                // Berechnung ohne KESt
                // kapitalOhneKest = (kapitalOhneKest + annualSavings) * (1 + annualReturn);

                // Berechnung mit KESt
                const prevKapitalMitKest = kapitalMitKest;
                kapitalMitKest = (kapitalMitKest + annualSavings) * (1 + annualReturn);
                const gain = kapitalMitKest - prevKapitalMitKest - annualSavings;
                const kest = considerKest && gain > 0 ? gain * 0.275 : 0; // KESt nur berechnen, wenn der Schalter an ist
                kapitalMitKest -= kest;
                totalKest += kest;

                // NEU: Berechnung für FLV (4% Versicherungssteuer auf Einzahlung)
                // KORREKTUR: In den ersten 5 Jahren 30% Kosten, danach keine mehr.
                const isInitialPhase = i <= 5;
                const flvNetAnnualSavings = isInitialPhase ? annualSavings * 0.70 : annualSavings; // 30% Kosten in den ersten 5 Jahren
                flvKapital = (flvKapital + flvNetAnnualSavings) * (1 + annualReturn);

                seriesData.einzahlung.push(Math.round(totalEinzahlung));
                seriesData.fondsdepot.push(Math.round(kapitalMitKest));
                seriesData.flv.push(Math.round(flvKapital));
            }

            // Update der Ergebnis-Felder
            document.getElementById('rechner-output-einzahlung').textContent = `${totalEinzahlung.toLocaleString('de-DE')} €`;
            // KORREKTUR: Die Rendite wird jetzt auf Basis des FLV-Werts berechnet, da dieser keine KESt enthält.
            const gesamtrendite = flvKapital - totalEinzahlung;
            document.getElementById('rechner-output-rendite').textContent = `${gesamtrendite.toLocaleString('de-DE', {maximumFractionDigits: 0})} €`;
            document.getElementById('rechner-output-kest').textContent = `-${totalKest.toLocaleString('de-DE', {maximumFractionDigits: 0})} €`;
            document.getElementById('rechner-output-endbetrag').textContent = `${kapitalMitKest.toLocaleString('de-DE', {maximumFractionDigits: 0})} €`;



            const options = {
                series: [{
                    name: 'Eingezahlt',
                    type: 'column',
                    data: seriesData.einzahlung
                }, {
                    name: 'Fondsdepot (nach KESt)',
                    type: 'column',
                    data: seriesData.fondsdepot
                }, {
                    name: 'FLV (KESt-frei)',
                    type: 'column',
                    data: seriesData.flv
                }],
                chart: {
                    height: 450,
                    type: 'line',
                    stacked: false,
                    foreColor: '#e2e8f0',
                    toolbar: { show: false }
                },
                stroke: { width: [0, 0, 3], curve: 'smooth' },
                plotOptions: { bar: { columnWidth: '60%' } },
                colors: ['#a0aec0', '#f1c40f', '#27ae60'], // Grau, Gelb, Grün
                xaxis: {
                    categories: categories,
                    title: { text: 'Jahre', style: { color: '#9ca3af' } },
                    labels: {
                        formatter: (val) => {
                            if (typeof val !== 'string') return ''; // KORREKTUR: Sicherheitsprüfung, um den Fehler zu verhindern.
                            return (parseInt(val.replace('Jahr ', '')) % 5 === 0 || val === 'Jahr 1') ? val.replace('Jahr ', '') : '';
                        }
                    }
                },
                yaxis: {
                    title: { text: 'Vermögen in €', style: { color: '#9ca3af' } },
                    labels: { formatter: (val) => `${(val / 1000).toFixed(0)}k` }
                },
                dataLabels: { enabled: false },
                tooltip: {
                    theme: 'dark',
                    shared: true,
                    intersect: false,
                    y: { formatter: (val) => `${val.toLocaleString('de-DE')} €` }
                },
                legend: { position: 'top', horizontalAlign: 'center' },
                grid: { borderColor: '#4a5568' }
            };

            container.innerHTML = ''; // Clear previous chart
            const chart = new ApexCharts(container, options);
            chart.render();
        };

        // Initial render
        renderChart();

        // Event-Listener für alle Eingabefelder
        const debouncedRender = _.debounce(renderChart, 300);
        [startwertInput, sparrateInput, dauerInput, renditeInput, kestToggle].forEach(input => {
            input.addEventListener('input', debouncedRender);
        });
    }

    _renderRechtsschutzChart() {
        const container = document.getElementById('rechtsschutz-chart-container');
        if (!container) return;

        container.innerHTML = ''; // Clear previous chart

        const options = {
            series: [40, 25, 20, 15],
            chart: {
                type: 'donut',
                height: 250,
                foreColor: '#e2e8f0'
            },
            labels: ['Schadenersatz (z.B. Verkehr)', 'Vertragsstreitigkeiten', 'Arbeitsrecht', 'Wohnen & Miete'],
            colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Häufigste',
                                formatter: () => 'Konflikte'
                            }
                        }
                    }
                }
            },
            dataLabels: {
                enabled: false
            },
            legend: { show: false },
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
        };

        const chart = new ApexCharts(container, options);
        chart.render();
    }

    _renderHaushaltChart() {
        const container = document.getElementById('haushalt-chart-container');
        if (!container) return;
        container.innerHTML = '';

        const options = {
            series: [35, 25, 20, 10, 10],
            chart: { type: 'donut', height: 250, foreColor: '#e2e8f0' },
            labels: ['Wasserschäden', 'Einbruch/Diebstahl', 'Brandschäden', 'Glasschäden', 'Sonstige Schäden'],
            colors: ['#3b82f6', '#ef4444', '#f59e0b', '#6b7280'],
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Häufigste',
                                formatter: () => 'Schäden'
                            }
                        }
                    }
                }
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }]
        };

        const chart = new ApexCharts(container, options);
        chart.render();
    }

    _renderEigenheimChart() {
        const container = document.getElementById('eigenheim-chart-container');
        if (!container) return;
        container.innerHTML = '';

        const options = {
            series: [40, 30, 20, 5, 5],
            chart: { type: 'donut', height: 250, foreColor: '#e2e8f0' },
            labels: ['Wasserschäden', 'Sturmschäden', 'Brandschäden', 'Glasschäden', 'Sonstige Schäden'],
            colors: ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b'],
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Häufigste',
                                formatter: () => 'Gefahren'
                            }
                        }
                    }
                }
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }]
        };

        const chart = new ApexCharts(container, options);
        chart.render();
    }

    _initPensionsrechner() {
        const berechnenBtn = document.getElementById('pr-berechnen-btn');
        const resetBtn = document.getElementById('pr-reset-btn');
        const inputSections = document.getElementById('pr-input-sections');
        const auswertungSection = document.getElementById('pr-auswertung');

        if (!berechnenBtn || !resetBtn || !inputSections || !auswertungSection) return;

        // Remove old listener to prevent duplicates
        const newBtn = berechnenBtn.cloneNode(true);
        berechnenBtn.parentNode.replaceChild(newBtn, berechnenBtn);

        const resetView = () => {
            inputSections.classList.remove('collapsed');
            auswertungSection.style.display = 'none';
            newBtn.style.display = 'inline-flex';
        };

        resetBtn.addEventListener('click', resetView);

        newBtn.addEventListener('click', () => {
            const anfangsEinkommen = parseFloat(document.getElementById("pr-einkommen").value) || 0;
            const karriereSteigerung = (parseInt(document.getElementById("pr-karriere").value) || 0) / 100;
            const geburtsdatum = new Date(document.getElementById("pr-geburtsdatum").value);
            const pensionsalter = parseInt(document.getElementById("pr-pensionsalter").value) || 65;
            
            // KORREKTUR: Dynamische Berechnung des letzten Einkommens
            const heute = new Date();
            const alter = heute.getFullYear() - geburtsdatum.getFullYear();
            const verbleibendeJahre = pensionsalter - alter;
            
            // Zinseszinsformel für das Gehalt
            const letztesBruttoEinkommen = anfangsEinkommen * Math.pow(1 + karriereSteigerung, verbleibendeJahre);

            // einfache Annahmen
            const nettoFaktor = 1.326; // Annäherung für Brutto -> Netto x14
            const pensionsersatzrate = 0.74; // Annäherung für die Pensionshöhe
            const nettoLetzteinkommen = letztesBruttoEinkommen * nettoFaktor;
            const nettoPension = nettoLetzteinkommen * pensionsersatzrate;
            const luecke = nettoLetzteinkommen - nettoPension;

            document.getElementById("pr-pAntritt").innerText = "01.01.2061";
            document.getElementById("pr-pAlter").innerText = `${pensionsalter} Jahre`;
            document.getElementById("pr-pKarriere").innerText = (karriereSteigerung * 100) + " %";
            document.getElementById("pr-pLetzte").innerText = nettoLetzteinkommen.toFixed(0) + " €";
            document.getElementById("pr-pPension").innerText = nettoPension.toFixed(0) + " €";
            document.getElementById("pr-pLuecke").innerText = luecke.toFixed(0) + " €";

            // Balken-Diagramm
            const total = nettoLetzteinkommen;
            const pensionPct = (nettoPension / total) * 100;
            const gapPct = (luecke / total) * 100;
            document.getElementById("pr-barPension").style.width = pensionPct + "%";
            document.getElementById("pr-barGap").style.width = gapPct + "%";
            document.getElementById("pr-auswertung").style.display = "block";
            newBtn.style.display = 'none'; // Hide the calculate button

            // NEU: Klappe die Eingabefelder nach der Berechnung ein.
            inputSections.classList.add('collapsed');
        });
    }

    _initVorsorgerechner() {
        const berechnenBtn = document.getElementById('vr-berechnen-btn');
        if (!berechnenBtn) return;

        const berechnen = () => {
            const entnahme = parseFloat(document.getElementById("vr-entnahme").value) || 0;
            const dauer = parseInt(document.getElementById("vr-dauer").value) || 0;
            const zinsEntnahme = (parseFloat(document.getElementById("vr-zinsEntnahme").value) || 0) / 100;
            const zinsSparen = (parseFloat(document.getElementById("vr-zinsSparen").value) || 0) / 100;
            const startKapital = parseFloat(document.getElementById("vr-startKapital").value) || 0;

            // Kapitalbedarf berechnen
            const monate = dauer * 12;
            const i = zinsEntnahme / 12;
            const kapitalBedarf = entnahme * (1 - Math.pow(1 + i, -monate)) / i;

            // Sparrate berechnen (Annahme: 25 Jahre Sparphase)
            const sparJahre = 25;
            const m = sparJahre * 12;
            const j = zinsSparen / 12;
            const sparrate = (kapitalBedarf - startKapital) * j / (Math.pow(1 + j, m) - 1);

            // Ausgabe
            const formatCurrency = (val) => val.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
            document.getElementById("vr-kapital").innerText = formatCurrency(kapitalBedarf);
            document.getElementById("vr-monatl").innerText = formatCurrency(entnahme);
            document.getElementById("vr-sparrate").innerText = formatCurrency(sparrate);

            // Chart-Daten generieren
            const years = [...Array(sparJahre + dauer + 1).keys()];
            let values = [];
            let saldo = startKapital;
            for (let y = 0; y <= sparJahre; y++) {
                saldo = saldo * (1 + zinsSparen) + sparrate * 12;
                values.push(saldo);
            }
            for (let y = 1; y <= dauer; y++) {
                saldo = saldo * (1 + zinsEntnahme) - entnahme * 12;
                values.push(Math.max(saldo, 0));
            }

            // ApexChart rendern
            const chartContainer = document.getElementById('vr-chart-container');
            chartContainer.innerHTML = '';
            const options = {
                series: [{ name: "Kapitalverlauf", data: values }],
                chart: { type: 'area', height: 350, foreColor: '#e2e8f0', toolbar: { show: false }, zoom: { enabled: false } },
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 2 },
                fill: {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.7,
                        opacityTo: 0.2,
                        stops: [0, 100]
                    }
                },
                // NEU: Farben für Anspar- und Entnahmephase
                colors: ['#22c55e'], // Startet mit Grün
                annotations: {
                    xaxis: [{
                        x: sparJahre,
                        borderColor: '#FFD700',
                        label: {
                            borderColor: '#FFD700',
                            style: { color: '#111', background: '#FFD700', },
                            text: 'Pensionsantritt'
                        }
                    }]
                },
                xaxis: {
                    categories: years,
                    title: { text: 'Jahre', style: { color: '#9ca3af' } },
                    labels: { formatter: (val) => (parseInt(val) % 5 === 0) ? val : '' }
                },
                yaxis: {
                    title: { text: 'Kapital in €', style: { color: '#9ca3af' } },
                    labels: { formatter: (val) => `${(val / 1000).toFixed(0)}k` }
                },
                tooltip: { theme: 'dark', y: { formatter: (val) => `${val.toLocaleString('de-DE')} €` } },
                grid: { borderColor: '#4a5568', strokeDashArray: 4 }
            };
            const chart = new ApexCharts(chartContainer, options);
            chart.render();
        };

        berechnenBtn.onclick = berechnen;
        berechnen(); // Initial render
    }

    async _renderBeraterVorstellung() {
        const container = document.getElementById('beratung-slide-berater-vorstellung');
        if (!container) return;

        container.innerHTML = '<div class="loader-white mx-auto"></div>';

        const beraterName = this.beratungData.mitarbeitername;
        // KORREKTUR: Greife auf den korrekten Spalten-Key für den Namen zu, anstatt auf 'm.Name',
        // da die Rohdaten aus der DB kryptische Keys verwenden (z.B. 'lA2R').
        const nameKey = COLUMN_MAPS.mitarbeiter?.Name;
        const berater = nameKey 
            ? db.mitarbeiter.find(m => m && m[nameKey] && m[nameKey].toLowerCase() === beraterName.toLowerCase())
            : null;

        if (!berater) {
            container.innerHTML = `<p class="text-center text-xl">Informationen zum Berater "${this._escapeHtml(beraterName)}" konnten nicht geladen werden.</p>`;
            return;
        }

        // KORREKTUR: Karrierestufe und Büro sind Link-Felder. Wir müssen den `display_value` aus dem verknüpften Objekt extrahieren.
        const karrierestufeLink = berater[COLUMN_MAPS.mitarbeiter.Karrierestufe];
        const karrierestufe = (Array.isArray(karrierestufeLink) && karrierestufeLink[0]) ? karrierestufeLink[0].display_value : 'Berater';

        const bueroLink = berater[COLUMN_MAPS.mitarbeiter.Buero];
        const buero = (Array.isArray(bueroLink) && bueroLink[0]) ? bueroLink[0].display_value : 'Hauptzentrale';


        const textZuMir = berater[COLUMN_MAPS.mitarbeiter.TextZuMir] || 'Ihr Experte für eine sichere finanzielle Zukunft.';
        const bildUrlRaw = berater[COLUMN_MAPS.mitarbeiter.Bild]?.[0];

        const hatVA = berater[COLUMN_MAPS.mitarbeiter.VA] === true;
        const hatVB = berater[COLUMN_MAPS.mitarbeiter.VB] === true;
        const hatImmo = berater[COLUMN_MAPS.mitarbeiter.Immobilienexperte] === true;

        let bildHtml = '<div class="w-64 h-64 bg-skt-blue-light rounded-full flex items-center justify-center"><i class="fas fa-user fa-5x text-white"></i></div>';
        if (bildUrlRaw) {
            const finalBildUrl = await getSeaTableDownloadLink(bildUrlRaw);
            if (finalBildUrl) {
                bildHtml = `<img src="${finalBildUrl}" alt="Portrait von ${this._escapeHtml(berater[nameKey])}" class="w-64 h-64 rounded-full object-cover shadow-2xl border-4 border-white">`;
            }
        }

        const createSiegel = (text, icon) => `
            <div class="flex flex-col items-center text-center">
                <div class="w-24 h-24 rounded-full bg-accent-gold text-skt-blue flex items-center justify-center shadow-lg mb-2 border-4 border-skt-blue-light">
                    <i class="fas ${icon} fa-3x"></i>
                </div>
                <p class="font-semibold">${text}</p>
            </div>
        `;

        let siegelHtml = '<div class="flex justify-center gap-8 mt-8">';
        if (hatVA) siegelHtml += createSiegel('Versicherungsagent', 'fa-shield-alt');
        if (hatVB) siegelHtml += createSiegel('Vermögensberater', 'fa-piggy-bank');
        if (hatImmo) siegelHtml += createSiegel('Immobilienexperte', 'fa-home');
        siegelHtml += '</div>';

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                <div class="md:col-span-2 text-left">
                    <h2 class="text-5xl font-bold mb-1">${this._escapeHtml(berater[nameKey])}</h2>
                    <p class="text-gold font-bold text-xl mb-2">${karrierestufe}</p>
                    <p class="text-lg text-gray-300 mb-6"><i class="fas fa-map-marker-alt mr-2"></i>${this._escapeHtml(buero)}</p>
                    <div class="prose prose-lg text-white max-w-none">
                        ${textZuMir}
                    </div>
                    ${(hatVA || hatVB || hatImmo) ? siegelHtml : ''}
                </div>
                <div class="flex justify-center md:justify-end">
                    ${bildHtml}
                </div>
            </div>
        `;
    }

    
    // NEU: Rendert die sortierbare Agenda-Liste.
    _renderAgenda() {
        if (!this.agendaContainer) return;
        this.agendaContainer.innerHTML = '';
        
        const updateRanks = () => {
            this.agendaContainer.querySelectorAll('.agenda-item').forEach((item, index) => {
                item.classList.remove('rank-1', 'rank-2', 'rank-3');
                if (index === 0) item.classList.add('rank-1');
                else if (index === 1) item.classList.add('rank-2');
                else if (index === 2) item.classList.add('rank-3');
            });
        };

        this.beratungData.kategorien.forEach((kategorie, index) => {
            const item = document.createElement('div');
            item.className = 'agenda-item flex items-center justify-between';
            item.dataset.kategorie = kategorie;
            item.innerHTML = `<span>${this._escapeHtml(kategorie)}</span><i class="fas fa-grip-vertical text-gray-400"></i>`;
            this.agendaContainer.appendChild(item);
        });

        updateRanks(); // Set initial ranks

        if (this.beratungData.kategorien.length > 0) {
            // KORREKTUR: Nach dem Sortieren die Ränge neu zuweisen.
            new Sortable(this.agendaContainer, { animation: 150, handle: '.fa-grip-vertical', onEnd: updateRanks });
        }
    }

    _renderAbschluss() {
        const abschlussSlide = this.slides.find(s => s.id === 'beratung-slide-abschluss');
        if (abschlussSlide) {
            this.slides.forEach(s => s.classList.add('hidden'));
            abschlussSlide.classList.remove('hidden');
            this._saveBeratung();
        }
    }

    _renderKategorien() {
        this.kategorienContainer.innerHTML = '';
        const kategorienContainer = document.getElementById('beratung-kategorien-container');
        if (!kategorienContainer) return;
        kategorienContainer.innerHTML = '';
        const produktauswahlMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'produktauswahl');
        const kategorienColumnMeta = produktauswahlMeta?.columns.find(c => c.name === 'Kategorien');

        if (!kategorienColumnMeta || !kategorienColumnMeta.data?.options) {
            return;
        }

        kategorienColumnMeta.data.options.forEach(kat => {
            const item = document.createElement('div');
            const iconClass = { 'Investment': 'fa-chart-line', 'Immobilien': 'fa-home', 'Recht': 'fa-gavel', 'Hab & Gut': 'fa-shield-alt', 'Gesundheit': 'fa-heartbeat', 'Körper & Existenz': 'fa-user-shield', 'Haftpflicht': 'fa-umbrella', 'KFZ': 'fa-car', 'Finanzierung': 'fa-coins', 'Strom & Gas': 'fa-bolt' }[kat.name] || 'fa-question-circle';
            item.className = 'kategorie-item p-4 rounded-lg text-center font-semibold text-lg cursor-pointer flex flex-col items-center justify-center gap-2';
            item.dataset.kategorie = kat.name;
            item.innerHTML = `<i class="fas ${iconClass} fa-2x"></i><span>${this._escapeHtml(kat.name)}</span>`;
            item.addEventListener('click', () => item.classList.toggle('selected'));
            kategorienContainer.appendChild(item);
        });
    }

    _showLoadingOverlay(show, texts = [], durationPerText = 1500) {
        if (!this.loadingOverlay || !this.loadingText) return;
    
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
            this.loadingOverlay.classList.add('flex');
            let textIndex = 0;
            const updateText = () => {
                if (textIndex < texts.length) {
                    this.loadingText.style.opacity = 0;
                    setTimeout(() => {
                        this.loadingText.textContent = texts[textIndex];
                        this.loadingText.style.opacity = 1;
                        textIndex++;
                    }, 500); // Fade-in time
                }
            };
    
            updateText();
            this.loadingInterval = setInterval(updateText, durationPerText);

        } else {
            if (this.loadingInterval) clearInterval(this.loadingInterval);
            this.loadingOverlay.classList.add('hidden');
            this.loadingOverlay.classList.remove('flex');
        }
    }

    // NEU: Dedizierte Funktion zur Aktualisierung der Navigations-Buttons
    _updateNavButtons() {
        const isMitarbeiternameValid = this.mitarbeiternameInput.value.trim() !== '';
        const isKundennameValid = this.kundennameInput.value.trim() !== '';
        let canProceed = true;
        if (this.currentSlideId === 'beratung-slide-mitarbeitername' && !isMitarbeiternameValid) canProceed = false;
        if (this.currentSlideId === 'beratung-slide-kundenname' && !isKundennameValid) canProceed = false;

        this.nextBtn.disabled = !canProceed;
        this.nextBtn.classList.toggle('opacity-50', !canProceed);
        this.nextBtn.classList.toggle('cursor-not-allowed', !canProceed);
        this.backBtn.classList.toggle('hidden', this.history.length === 0);
    }

    async _saveBeratung() {
        beratungLog('Speichere Beratung...');
        this.navContainer.classList.add('hidden');
        const dauerInSekunden = Math.round((new Date() - this.beratungData.startTime) / 1000);

        // KORREKTUR: Die Dauer muss im Format "HH:MM:SS" an die API gesendet werden.
        const stunden = Math.floor(dauerInSekunden / 3600).toString().padStart(2, '0');
        const minuten = Math.floor((dauerInSekunden % 3600) / 60).toString().padStart(2, '0');
        const sekunden = (dauerInSekunden % 60).toString().padStart(2, '0');
        const formatierteDauer = `${stunden}:${minuten}:${sekunden}`;
        beratungLog(`Berechnete Dauer: ${dauerInSekunden}s, formatiert als: ${formatierteDauer}`);

        const rowData = {
            [COLUMN_MAPS.beratung.Kunde]: this.beratungData.kundenname,
            [COLUMN_MAPS.beratung.Mitarbeiter]: this.beratungData.mitarbeiterId ? [this.beratungData.mitarbeiterId] : this.beratungData.mitarbeitername,
            [COLUMN_MAPS.beratung.Datum]: this.beratungData.startTime.toISOString(),
            [COLUMN_MAPS.beratung.Dauer]: formatierteDauer,
            [COLUMN_MAPS.beratung.Kategorien]: this.beratungData.kategorien.join(', '),
            [COLUMN_MAPS.beratung.Prioritaeten]: this.beratungData.agenda.join(', '),
        };
        const success = await genericAddRowWithLinks('Beratung', rowData, ['Mitarbeiter']);
        if (success) {
            beratungLog('Beratung erfolgreich gespeichert.');
            setTimeout(() => { window.location.href = window.location.pathname; }, 2000); // KORREKTUR: Sicherer Weg, um zur Startseite zurückzukehren.
        } else {
            alert('Fehler beim Speichern der Beratung.');
            this.navContainer.classList.remove('hidden');
        }
    }
}

// KORREKTUR: Die `prose`-Klassen von Tailwind benötigen eine Basiskonfiguration.
// Da wir Tailwind über CDN laden, fügen wir hier eine einfache Konfiguration hinzu.
tailwind.config = { theme: { extend: { typography: (theme) => ({}), } } }


// --- INITIALISIERUNG ---
async function initialize() {
    beratungLog('Initialisiere Standalone-Beratungs-Ansicht...');
    const rootEl = document.getElementById('beratung-root'); // KORREKTUR: `let` statt `const`, da der Inhalt neu zugewiesen wird.
    rootEl.innerHTML = '<div class="loader-white mx-auto"></div><p class="mt-4">Lade Modul...</p>';
    
    await getSeaTableAccessToken();
    if (!seaTableAccessToken) return;

    // KORREKTUR: Die Metadaten müssen geladen werden, damit die Spaltennamen (z.B. "Kategorien")
    // den Spalten-IDs (z.B. "fP8y") zugeordnet werden können.
    COLUMN_MAPS = await fetchColumnMaps();
    
    // KORREKTUR: Lade alle notwendigen Daten parallel, um die Ladezeit zu verkürzen.
    const [produktauswahl, mitarbeiter, gesellschaften, produkte] = await Promise.all([
        seaTableQuery('Produktauswahl'),
        seaTableQuery('Mitarbeiter'),
        seaTableQuery('Gesellschaften'),
        seaTableQuery('Produkte') // NEU
    ]);
    db.produktauswahl = produktauswahl;
    db.mitarbeiter = mitarbeiter;
    // NEU: Gib die geladenen Mitarbeiterdaten in der Konsole aus.
    beratungLog('Mitarbeiter-Tabelle geladen:', mitarbeiter);

    db.gesellschaften = gesellschaften;
    // NEU: Detailliertes Logging für die Gesellschaften-Daten
    console.log('%c[DEBUG] %cGeladene Rohdaten für \'Gesellschaften\':', 'color: #e67e22; font-weight: bold;', 'color: black;');
    console.log(JSON.parse(JSON.stringify(gesellschaften)));

    db.produkte = produkte; // NEU

    // --- NEU: Detailliertes Logging beim Start ---
    beratungLog('Starte Zuordnungs-Analyse...');
    const produktauswahlMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'produktauswahl');
    if (produktauswahlMeta) {
        const kategorienColumn = produktauswahlMeta.columns.find(c => c.name === 'Kategorien');
        if (kategorienColumn && kategorienColumn.data?.options) {
            console.log('%cFolgende Kategorien gefunden:', 'font-weight: bold; font-size: 1.2em; color: #8e44ad;');
            const kategorienKey = kategorienColumn.key;

            kategorienColumn.data.options.forEach(katOption => {
                console.log(`%c--- Kategorie: ${katOption.name} ---`, 'font-weight: bold; color: #2980b9;');
                
                // KORREKTUR: Die Logik muss die Verknüpfung zur Produkte-Tabelle auflösen.
                // 1. Finde die Einträge in der Zuordnungstabelle 'Produktauswahl'.
                const produktauswahlEintraege = db.produktauswahl.filter(p => Array.isArray(p[kategorienKey]) && p[kategorienKey].includes(katOption.id));
                // 2. Extrahiere die IDs der verknüpften Produkte.
                const produktLinkKey = COLUMN_MAPS.produktauswahl['Produkt'];
                const produktIds = new Set(produktauswahlEintraege.map(e => e[produktLinkKey]?.[0]?.row_id).filter(Boolean));
                // 3. Finde die tatsächlichen Produkte in der 'produkte'-Tabelle.
                const produkteInKategorie = db.produkte.filter(p => produktIds.has(p._id));

                console.log(`  Produkte (${produkteInKategorie.length}):`);
                // KORREKTUR: Greife auf die Spalten der 'produkte'-Tabelle zu.
                produkteInKategorie.forEach(p => console.log(`    - ${p[COLUMN_MAPS.produkte['Produkt']] || 'Unbenannt'}`));

                
                // KORREKTUR: Logge die Besonderheiten für jedes Produkt in der Kategorie
                produkteInKategorie.forEach(p => {
                    const productName = p[COLUMN_MAPS.produkte['Produkt']];
                    const besonderheitenColumnName = BESONDERHEITEN_MAP[productName];
                    if (besonderheitenColumnName) {
                        const besonderheitenColumn = produktauswahlMeta.columns.find(c => c.name === besonderheitenColumnName);
                        if (besonderheitenColumn && besonderheitenColumn.data?.options) {
                            console.log(`    Besonderheiten für "${productName}": ${besonderheitenColumn.data.options.map(o => o.name).join(', ')}`);
                        }
                    }
                });
            });
        }
    }

    // --- DEBUG-Ausgabe für Metadaten ---
    beratungLog('Gebe Metadaten für angeforderte Tabellen aus...');
    const beratungMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'beratung');
    console.log('--- METADATEN: Produktauswahl ---');
    console.log(JSON.parse(JSON.stringify(produktauswahlMeta || 'Nicht gefunden')));
    console.log('--- METADATEN: Beratung ---');
    console.log(JSON.parse(JSON.stringify(beratungMeta || 'Nicht gefunden')));
    // --- Ende DEBUG-Ausgabe ---

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
    await beratungView.init(null); // KORREKTUR: init() muss aufgerufen werden
}

document.addEventListener("DOMContentLoaded", initialize);