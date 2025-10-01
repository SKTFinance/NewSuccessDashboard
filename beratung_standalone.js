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
        this.slides.forEach(s => {
            s.classList.remove('active');
        });

        const activeSlide = this.slides.find(s => s.id === slideId);
        if (activeSlide) {
            activeSlide.classList.add('active');

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
            }

            // NEU: Prüfe, ob es sich um das "3-Konten-Modell" handelt
            if (slideId === 'beratung-slide-special-FLV-Dreikontenmodell') {
                this._initThreeAccountsModel();
                this._renderCompoundInterestChart();
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
    }

    async _navigateNext() {
        const currentSlideId = this.currentSlideId;
        this.history.push(currentSlideId); // Aktuelle Seite zur History hinzufügen

        
        
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
            { name: 'Immobilieneigentum', img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80' },
            { name: 'Finanzielle Freiheit', img: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1000&q=80' },
            { name: 'Absicherung im Alter', img: 'https://images.unsplash.com/photo-1616587360496-7c563a6d1253?auto=format&fit=crop&w=1000&q=80' },
            { name: 'Reisen', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=80' },
            { name: 'Auto', img: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=1000&q=80' },
            { name: 'Notpolster', img: 'https://images.unsplash.com/photo-1604594878145-565556455b13?auto=format&fit=crop&w=1000&q=80' },
            { name: 'Luxus', img: 'https://images.unsplash.com/photo-1505846995431-373035999315?auto=format&fit=crop&w=1000&q=80' },
        ];

        container.innerHTML = goals.map(goal => `
            <div class="kategorie-item goal-card relative rounded-xl overflow-hidden cursor-pointer aspect-w-1 aspect-h-1 group" data-kategorie="${this._escapeHtml(goal.name)}">
                <img src="${goal.img}" alt="${goal.name}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110">
                <div class="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all duration-300"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                    <h3 class="text-white text-2xl font-bold text-center shadow-text">${goal.name}</h3>
                </div>
                <div class="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/30 flex items-center justify-center opacity-0 group-[.selected]:opacity-100 transition-opacity duration-300">
                    <i class="fas fa-check text-white text-xl"></i>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.goal-card').forEach(card => {
            card.addEventListener('click', () => card.classList.toggle('selected'));
        });
    }

    _initThreeAccountsModel() {
        const container = document.getElementById('three-accounts-model-container');
        const nextBtn = document.getElementById('three-accounts-next-step-btn');
        if (!container || !nextBtn) return;

        const steps = [
            // KORREKTUR: Die Text-Schritte werden wieder eingefügt.
            () => this._animateContent('content-kurzfristig', `<p>z.B. Girokonto, <span class="text-skt-red-accent font-semibold">kaum Zinsen</span>, <span class="text-skt-green-accent font-semibold">sehr flexibel</span></p>`),
            () => this._animateContent('content-mittelfristig', `<p>z.B. Fondsdepot, <span class="text-skt-green-accent font-semibold">7-9% Rendite</span>, <span class="text-skt-red-accent font-semibold">3-5% Kosten</span>, <span class="text-skt-red-accent font-semibold">27,5% KESt</span></p>`),
            () => this._animateContent('content-langfristig', `<p>z.B. FLV, <span class="text-skt-green-accent font-semibold">7-9% Rendite</span>, <span class="text-skt-red-accent font-semibold">4% Vers. Steuer</span>, <span class="text-skt-red-accent font-semibold">ca. 10% Kosten</span>, <span class="text-skt-green-accent font-semibold">KEINE KESt</span></p>`),
            // Der letzte Schritt animiert die Vertragsgrafik.
            () => this._animateContent('content-langfristig', `
                <div class="flex items-center justify-center gap-4 mt-4">
                    <div class="text-right"><p class="font-semibold text-skt-red-accent">-4%<br>Versicherungssteuer</p></div>
                    <i class="fas fa-arrow-right text-skt-red-accent fa-2x"></i>
                    <div class="contract-box">
                        <i class="fas fa-piggy-bank fa-2x"></i>
                        <p>Vertrag</p>
                    </div>
                    <i class="fas fa-arrow-right text-skt-green-accent fa-2x"></i>
                    <div class="text-left"><p class="font-semibold text-skt-green-accent">-keine<br>Kapitalertragssteuer</p></div>
                </div>
            `, true)
        ];

        let currentStep = 0;
        // Reset view
        container.querySelectorAll('.timeline-content').forEach(el => el.innerHTML = '');

        const executeStep = () => {
            if (currentStep < steps.length) {
                steps[currentStep]();
                currentStep++;
                if (currentStep === steps.length) {
                    nextBtn.innerHTML = 'Verstanden <i class="fas fa-check"></i>';
                }
            } else {
                // Alle Schritte durchlaufen, zum nächsten Haupt-Slide navigieren
                this._navigateNext();
            }
        };

        // Event-Listener neu zuweisen, um alte zu entfernen
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        newNextBtn.addEventListener('click', executeStep);
        document.getElementById('three-accounts-next-step-btn').innerHTML = 'Nächster Schritt <i class="fas fa-arrow-down"></i>';
    }

    _animateContent(containerId, html, append = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const content = document.createElement('div');
        content.className = 'step-content';
        content.innerHTML = html;

        if (append) {
            container.appendChild(content);
        } else {
            container.innerHTML = '';
            container.appendChild(content);
        }

        // Trigger animation
        setTimeout(() => content.classList.add('visible'), 50);
    }


    _renderCompoundInterestChart() {
        const container = document.getElementById('chart-bars-container');
        if (!container) return;

        const monthlySavings = 200;
        const years = 35;
        const annualReturn = 0.07; // 7%

        const n = years * 12; // number of periods (months)
        const r = annualReturn / 12; // monthly interest rate
        const totalInvested = monthlySavings * n;

        // 1. Girokonto (kaum Wachstum)
        const giroEndValue = totalInvested;

        // 2. Fondsdepot
        const fondsdepotFutureValue = monthlySavings * (Math.pow(1 + r, n) - 1) / r * (1 + r);
        const fondsdepotProfit = fondsdepotFutureValue - totalInvested;
        const kestTax = fondsdepotProfit * 0.275;
        const fondsdepotEndValue = fondsdepotFutureValue - kestTax;

        // 3. FLV
        const insuranceTax = totalInvested * 0.04;
        // Effektiv wird jeden Monat etwas weniger investiert.
        const effectiveMonthlySavingsFLV = monthlySavings * (1 - 0.04);
        const flvEndValue = effectiveMonthlySavingsFLV * (Math.pow(1 + r, n) - 1) / r * (1 + r);

        const values = {
            giro: { total: giroEndValue },
            fondsdepot: { total: fondsdepotEndValue, invested: totalInvested, tax: kestTax },
            flv: { total: flvEndValue, invested: totalInvested - insuranceTax, tax: insuranceTax }
        };

        const maxValue = Math.max(values.giro.total, values.fondsdepot.total, values.flv.total);

        const createBar = (label, data, colorClass) => {
            const totalHeightPercent = (data.total / maxValue) * 100;
            // KORREKTUR: Die Höhe der Segmente muss relativ zur Gesamthöhe der Säule (data.total) sein, nicht zum Maximalwert des Charts.
            const investedSegmentPercent = data.invested ? (data.invested / data.total) * 100 : 0;
            const profitSegmentPercent = data.invested ? ((data.total - data.invested) / data.total) * 100 : 0;

            return `
                <div class="chart-bar-wrapper">
                    <div class="chart-bar ${colorClass}" style="height: 0%;" data-height="${totalHeightPercent}">
                        <div class="chart-segment-invested" style="height: ${investedSegmentPercent}%;"></div>
                        <div class="chart-segment-profit" style="height: ${profitSegmentPercent}%;"></div>
                        <div class="chart-value">${Math.round(data.total / 1000)} T€</div>
                    </div>
                    <div class="chart-label">${label}</div>
                    ${data.tax ? `<div class="chart-tax-label">-${Math.round(data.tax / 1000)} T€ Steuer</div>` : ''}
                </div>
            `;
        };

        container.innerHTML = `
            ${createBar('Girokonto', { total: values.giro.total, invested: values.giro.total }, 'bar-blue')}
            ${createBar('Fondsdepot', { total: values.fondsdepot.total, invested: values.fondsdepot.invested }, 'bar-yellow')}
            ${createBar('FLV', { total: values.flv.total, invested: values.flv.invested }, 'bar-green')}
        `;

        // Animate bars into view
        setTimeout(() => {
            container.querySelectorAll('.chart-bar').forEach(bar => {
                bar.style.height = `${bar.dataset.height}%`;
            });
        }, 100);
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
                bildHtml = `<img src="${finalBildUrl}" alt="Portrait von ${this._escapeHtml(berater.Name)}" class="w-64 h-64 rounded-full object-cover shadow-2xl border-4 border-white">`;
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
                    <h2 class="text-5xl font-bold mb-1">${this._escapeHtml(berater.Name)}</h2>
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

        this.beratungData.kategorien.forEach(kategorie => {
            const item = document.createElement('div');
            // KORREKTUR: Fügt ein Handle-Icon für besseres Drag-and-Drop-Feedback hinzu.
            item.className = 'agenda-item p-4 bg-white/10 rounded-lg text-lg font-semibold cursor-grab flex items-center justify-between';
            item.textContent = kategorie;
            item.dataset.kategorie = kategorie;
            item.innerHTML = `<span>${this._escapeHtml(kategorie)}</span><i class="fas fa-grip-vertical text-gray-400"></i>`;
            this.agendaContainer.appendChild(item);
        });

        if (this.beratungData.kategorien.length > 0) {
            new Sortable(this.agendaContainer, { animation: 150, handle: '.fa-grip-vertical' });
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