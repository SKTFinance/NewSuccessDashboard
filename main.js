// --- KONSTANTEN ---
const SEATABLE_API_TOKEN = "b148f4c735d193f77841ce4e4ddb2bb8bc2e446b";
const SEATABLE_APP_ACCESS_TOKEN_URL =
  "https://cloud.seatable.io/api/v2.1/dtable/app-access-token/";
const SEATABLE_DTABLE_UUID = "5b374b51-789c-4aac-a12f-02574f8f4855";
// Cache-Konstanten: Ändere die Version, um alle Caches zu invalidieren.
const CACHE_VERSION = "v1.1";
const CACHE_PREFIX = `skt-dashboard-cache-${CACHE_VERSION}-`;

let COLUMN_MAPS = {}; // Wird dynamisch gefüllt
// HINWEIS: Dies sollte dynamisch von der API geladen werden.
// Für die Entwicklung wird es hier hartcodiert, um die Logik zu implementieren.
const CHECKIN_COLUMN_MAP_FALLBACK = {
    "Datum": "0000",
    "Leiter": "aaaa",
    "Mitarbeiter": "bbbb",
    "TermineEingetragen": "cccc",
    "PositiverKontakt": "dddd",
    "ZieleDran": "eeee",
    "SeminarAnwesend": "ffff",
    "RecruitingTermine": "gggg",
    "AktuelleErfolge": "hhhh",
    "TodosErledigt": "iiii",
    "Motivation": "jjjj",
    "Stimmung": "kkkk",
    "Todos": "llll"
};
// --- GLOBALE VARIABLEN ---
let seaTableAccessToken = null;
let apiGatewayUrl = null;
let METADATA = {};
let db = {
  mitarbeiter: [],
  karriereplan: [],
  einarbeitungsschritte: [],
  umsatz: [],
  termine: [],
  monatsplanung: [],
  infoplanung: [],
  einarbeitung: [],
  gesellschaften: [],
  produkte: [],
  "pg": [],
  checkin: [],
  bürostandorte: [],
};
let totalEhResults = []; // NEU: Globale Variable für die vorgeladenen Gesamtumsätze

let personalData = {};
let teamData = {};
let structureData = {};
let authenticatedUserData = {}; // The user who is logged in
let currentlyViewedUserData = {}; // The user whose dashboard is currently shown
let viewHistory = [];

let currentPlanningView = "team";
let currentLeadershipViewMode = "list";
let isSuperuserView = false;
let isMoneyView = false;
let currentView = "dashboard";
let potentialViewInstance = null;
let umsatzViewInstance = null;
let auswertungViewInstance = null;
let strukturbaumViewInstance = null;
let pgTagebuchViewInstance = null;
let stimmungsDashboardViewInstance = null;
let wettbewerbViewInstance = null; // NEU
let bildschirmViewInstance = null; // NEU
let datenschutzViewInstance = null; // NEU
let pendingAppointmentFilter = null;
let pendingAppointmentViewMode = null;
let pendingAppointmentScope = null;
let pendingAppointmentGroupFilter = null; // NEU
let pendingPgIdToOpen = null; // NEU
let HIERARCHY_CACHE = null;

// --- NEU: Gekapselte Instanzen für jede Ansicht ---
let appointmentsViewInstance = null;
let timeTravelDate = null; // NEU
let currentOnboardingSubView = "leader-list"; // Wird von der Einarbeitungslogik verwaltet

// --- DOM-ELEMENTE ---
const dom = {
  welcomeHeader: document.getElementById("welcome-header"),
  userPosition: document.getElementById("user-position"),
  statusMessage: document.getElementById("status-message"),
  statusText: document.getElementById("status-text"),
  dashboardSections: document.getElementById("dashboard-sections"),
  employeeView: document.getElementById("employee-view"),
  leadershipView: document.getElementById("leadership-view"),
  teamMembersContainer: document.getElementById("team-members-container"),
  passiveMembersSection: document.getElementById("passive-members-section"),
  leadershipViewTitle: document.getElementById("leadership-view-title"),
  leadershipViewCount: document.getElementById("leadership-view-count"),
  leadershipViewModeToggle: document.getElementById(
    "leadership-view-mode-toggle"
  ),
  fortschrittKreisKarriere: document.getElementById("progress-circle-career"),
  careerProgressPercentage: document.getElementById(
    "career-progress-percentage"
  ),
  progressToNextText: document.getElementById("progress-to-next-text"),
  currentEhDisplay: document.getElementById("current-eh-display"),
  nextMilestone: document.getElementById("next-milestone"),
  weeklyProgressContainer: document.getElementById("weekly-progress-container"),
  ehProgressCircle: document.getElementById("progress-circle-eh"),
  prognosisCircleEh: document.getElementById("prognosis-circle-eh"),
  segmentDividersEh: document.getElementById("segment-dividers-eh"),
  ehCenterCurrent: document.getElementById("eh-center-current"),
  ehCenterUnitLabel: document.getElementById("eh-center-unit-label"),
  ehSollUnitLabel: document.getElementById("eh-soll-unit-label"),
  ehCenterGoal: document.getElementById("eh-center-goal"),
  ehSollValue: document.getElementById("eh-soll-value"),
  etCurrentDisplay: document.getElementById("et-current"),
  etGoalDisplay: document.getElementById("et-goal"),
  appointmentsText: document.getElementById("appointments-text"),
  appointmentsVereinbartBar: document.getElementById(
    "appointments-vereinbart-bar"
  ),
  appointmentsGehaltenBar: document.getElementById("appointments-gehalten-bar"),
  employeeCountDisplay: document.getElementById("employee-count-display"),
  employeeSlotsContainer: document.getElementById("employee-slots-container"),
  nextCareerGoalLabel: document.getElementById("next-career-goal-label"),
  employeeGoalStatus: document.getElementById("employee-goal-status"),
  interviewsProgressBar: document.getElementById("interviews-progress-bar"),
  userDropdownSelect: document.getElementById("user-dropdown-select"),
  userSelectError: document.getElementById("user-select-error"),
  tierCardsContainer: document.getElementById("tier-cards-container"),
  tierCards: [
    document.getElementById("tier-1-card"),
    document.getElementById("tier-2-card"),
    document.getElementById("tier-3-card"),
    document.getElementById("tier-gst-card"),
  ],
  tierProgressBars: [
    document.getElementById("tier-1-progress"),
    document.getElementById("tier-2-progress"),
    document.getElementById("tier-3-progress"),
    document.getElementById("tier-gst-progress"),
  ],
  settingsBtn: document.getElementById("settings-btn"),
  settingsMenu: document.getElementById("settings-menu"),
  clearCacheBtn: document.getElementById("clear-cache-btn"),
  superuserBtn: document.getElementById("superuser-btn"),
  backButton: document.getElementById("back-button"),
  moneyViewBtn: document.getElementById("money-view-btn"),
  monthlyPlanningTitle: document.getElementById("monthly-planning-title"),
  monthlyPlanningView: document.getElementById("monthly-planning-view"),
  planningViewToggle: document.getElementById("planning-view-toggle"),
  teamViewBtn: document.getElementById("team-view-btn"),
  personalViewBtn: document.getElementById("personal-view-btn"),
  strukturViewBtn: document.getElementById("struktur-view-btn"),
  gridViewBtn: document.getElementById("grid-view-btn"),
  listViewBtn: document.getElementById("list-view-btn"),
  mainDashboardView: document.getElementById("main-dashboard-view"),
  einarbeitungView: document.getElementById("einarbeitung-view"),
  einarbeitungBtn: document.getElementById("einarbeitung-btn"),
  einarbeitungBanner: document.getElementById("einarbeitung-banner"),
  dashboardHeaderBtn: document.getElementById("dashboard-header-btn"),
  appointmentsHeaderBtn: document.getElementById("appointments-header-btn"),
  potentialHeaderBtn: document.getElementById("potential-header-btn"),
  umsatzHeaderBtn: document.getElementById("umsatz-header-btn"),
  auswertungHeaderBtn: document.getElementById("auswertung-header-btn"),
  pgTagebuchHeaderBtn: document.getElementById('pg-tagebuch-header-btn'),
  strukturbaumHeaderBtn: document.getElementById("strukturbaum-header-btn"),
  wettbewerbHeaderBtn: document.getElementById("wettbewerb-header-btn"), // NEU
  auswertungView: document.getElementById("auswertung-view"),
  datenschutzView: document.getElementById("datenschutz-view"), // NEU
  umsatzView: document.getElementById("umsatz-view"),
  potentialView: document.getElementById("potential-view"),
  appointmentsView: document.getElementById("appointments-view"),
  pgTagebuchView: document.getElementById('pg-tagebuch-view'),
  stimmungsDashboardView: document.getElementById('stimmungs-dashboard-view'),
  einarbeitungTitle: document.getElementById("einarbeitung-title"),
  traineeOnboardingView: document.getElementById("trainee-onboarding-view"),
  wettbewerbView: document.getElementById("wettbewerb-view"), // NEU
  leaderOnboardingView: document.getElementById("leader-onboarding-view"),
  pgTagebuchView: document.getElementById('pg-tagebuch-view'),
  stimmungsDashboardView: document.getElementById('stimmungs-dashboard-view'),
  strukturbaumView: document.getElementById("strukturbaum-view"),
  grundseminarStepsContainer: document.getElementById(
    "grundseminar-steps-container"
  ),
  aufbauseminarStepsContainer: document.getElementById(
    "aufbauseminar-steps-container"
  ),
  grundseminarProgress: document.getElementById("grundseminar-progress"),
  aufbauseminarProgress: document.getElementById("aufbauseminar-progress"),
  grundseminarDateMarkers: document.getElementById("grundseminar-date-markers"),
  aufbauseminarDateMarkers: document.getElementById(
    "aufbauseminar-date-markers"
  ),
  hinweisModal: document.getElementById("hinweis-modal"),
  hinweisModalTitle: document.getElementById("hinweis-modal-title"),
  hinweisModalContent: document.getElementById("hinweis-modal-content"),
  closeHinweisModalBtn: document.getElementById("close-hinweis-modal-btn"),
  closeIosModalBtn: document.getElementById("close-ios-modal-btn"),
  iosInstructionsModal: document.getElementById("ios-instructions-modal"),
  aiAssistantBtn: document.getElementById("ai-assistant-btn"),
  leaderPersonalGoalContainer: document.getElementById(
    "leader-personal-goal-container"
  ),
  editUserBtn: document.getElementById("edit-user-btn"),
  editUserModal: document.getElementById("edit-user-modal"),
  editUserForm: document.getElementById("edit-user-form"),
  cancelEditUserBtn: document.getElementById("cancel-edit-user-btn"),
  cancelEditUserBtn2: document.getElementById("cancel-edit-user-btn-2"),
  saveUserBtn: document.getElementById("save-user-btn"),
  addNewUserBtn: document.getElementById("add-new-user-btn"),
  addUserModal: document.getElementById("add-user-modal"),
  addUserForm: document.getElementById("add-user-form"),
  cancelAddUserBtn: document.getElementById("cancel-add-user-btn"),
  cancelAddUserBtn2: document.getElementById("cancel-add-user-btn-2"),
  saveNewUserBtn: document.getElementById("save-new-user-btn"),
  planningBtn: document.getElementById("planning-btn"),
  planningModal: document.getElementById("planning-modal"),
  planningForm: document.getElementById("planning-form"),
  savePlanningBtn: document.getElementById("save-planning-btn"),
  cancelPlanningBtn: document.getElementById("cancel-planning-btn"),
  pqqView: document.getElementById('pqq-view'),
  pqqIndicator: document.getElementById('pqq-indicator'),
  pqqValueDisplay: document.getElementById('pqq-value-display'),
  pqqChevron: document.getElementById('pqq-chevron'),
  pqqDetailsContainer: document.getElementById('pqq-details-container'),
  pqqEhIndicator: document.getElementById('pqq-eh-indicator'),
  pqqEhValueDisplay: document.getElementById('pqq-eh-value-display'),
  pqqEtIndicator: document.getElementById('pqq-et-indicator'),
  pqqEtValueDisplay: document.getElementById('pqq-et-value-display'),
  nextInfoDate: document.getElementById("next-info-date"),
  // NEU: Zeitreise
  timeTravelBtn: document.getElementById('time-travel-btn'),
  timeTravelModal: document.getElementById('time-travel-modal'),
  timeTravelForm: document.getElementById('time-travel-form'),
  cancelTimeTravelBtn: document.getElementById('cancel-time-travel-btn'),
  cancelTimeTravelBtn2: document.getElementById('cancel-time-travel-btn-2'),
  startTimeTravelBtn: document.getElementById('start-time-travel-btn'),
  timeTravelBanner: document.getElementById('time-travel-banner'),
  timeTravelDateDisplay: document.getElementById('time-travel-date-display'),
  resetTimeTravelBtn: document.getElementById('reset-time-travel-btn'),
  // NEU: "Mehr"-Menü
  datenschutzHeaderBtn: document.getElementById('datenschutz-header-btn'),
  moreToolsBtn: document.getElementById('more-tools-btn'),
  moreToolsMenu: document.getElementById('more-tools-menu'),
  wettbewerbMenuItem: document.getElementById('wettbewerb-menu-item'), // NEU
};

// --- SEATABLE API FUNKTIONEN ---

async function getSeaTableAccessToken() {
  try {
    const url = `${SEATABLE_APP_ACCESS_TOKEN_URL}?dtable_uuid=${SEATABLE_DTABLE_UUID}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Token ${SEATABLE_API_TOKEN}` },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    seaTableAccessToken = data.access_token;
    apiGatewayUrl = data.dtable_server;
    // console.log("SeaTable App Access Token and API Gateway URL obtained.");
  } catch (error) {
    console.error("Error getting SeaTable access token:", error);
    setStatus("Fehler bei der Verbindung zur Datenbank.", true);
  }
}

async function fetchColumnMaps() {
  if (!seaTableAccessToken || !apiGatewayUrl) {
    console.error(
      "Cannot fetch column maps without access token and gateway URL."
    );
    return {};
  }
  try {
    const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/metadata/`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${seaTableAccessToken}` },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const newColumnMaps = {};
    if (data && data.metadata && data.metadata.tables) {
      METADATA.tables = data.metadata.tables;
      data.metadata.tables.forEach((table) => {
        const tableNameLower = table.name.toLowerCase();
        newColumnMaps[tableNameLower] = {};
        table.columns.forEach((col) => {
          newColumnMaps[tableNameLower][col.name] = col.key;
        });
      });
    }
    // console.log("Dynamically fetched column maps:", newColumnMaps);
    return newColumnMaps;
  } catch (error) {
    console.error("Error fetching column maps:", error);
    setStatus("Fehler beim Laden der Datenbankstruktur.", true);
    return {};
  }
}

async function seaTableDeleteRow(tableName, rowId) {
    if (!seaTableAccessToken || !apiGatewayUrl) {
        console.error("Cannot delete row without access token and gateway URL.");
        return false;
    }
    try {
        const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/`;
        const body = {
            table_name: tableName,
            row_ids: [rowId]
        };
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${seaTableAccessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return response.ok;
    } catch (error) {
        console.error(`Error deleting row from table ${tableName}:`, error);
        return false;
    }
}

async function seaTableSqlQuery(sql, convertLinks = true) {
  let retries = 5;
  let wait = 2000; // Start with a 2-second wait
  while (retries > 0) {
    if (!seaTableAccessToken || !apiGatewayUrl) {
      console.error(
        "Cannot run SQL query without access token and gateway URL."
      );
      return [];
    }
    try {
      const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/sql/`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${seaTableAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, convert_link_id: convertLinks }),
      });
      if (response.status === 429) throw new Error("RateLimit");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            errorData.error_message || JSON.stringify(errorData)
          }`
        );
      }
      const data = await response.json();
      // Für SELECT gibt es 'results', für INSERT/UPDATE nicht.
      // Wir geben das ganze Objekt zurück, damit der Aufrufer 'success' prüfen kann.
      // Wenn 'results' existiert, geben wir es zurück, ansonsten null, um Fehler von Erfolg (leeres Array) zu unterscheiden.
      if (data.results) {
          return data.results;
      } else if (data.success) {
          return []; // Leeres Array signalisiert einen erfolgreichen Schreibvorgang ohne Ergebnis-Set.
      }
      throw new Error(`Unexpected API response: ${JSON.stringify(data)}`);
    } catch (error) {
      if (error.message === "RateLimit") {
        retries--;
        if (retries === 0) {
          console.error(
            `SQL query failed after multiple retries due to rate limiting: ${sql}`
          );
          setStatus(
            `API-Limit erreicht. Daten konnten nicht geladen werden.`,
            true
          );
          return null;
        }
        console.warn(`SQL query rate limited. Retrying in ${wait}ms...`);
        await delay(wait);
        wait *= 2;
      } else {
        console.error("Error executing SeaTable SQL query:", error);
        setStatus(`Fehler bei der SQL-Abfrage.`, true);
        return null;
      }
    }
  }
  return [];
}

async function seaTableQuery(tableName) {
  let retries = 5;
  let wait = 2000; // Start with a 2-second wait
  while (retries > 0) {
    if (!seaTableAccessToken || !apiGatewayUrl) {
      console.error("Cannot fetch table without access token and gateway URL.");
      return [];
    }
    try {
      let allRows = [];
      let start = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/?table_name=${encodeURIComponent(
          tableName
        )}&start=${start}&limit=${limit}&convert_link_id=true`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${seaTableAccessToken}` },
        });
        if (response.status === 429) throw new Error("RateLimit");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        allRows = allRows.concat(data.rows);
        hasMore = data.rows.length >= limit;
        start += limit;
      }
      return allRows;
    } catch (error) {
      if (error.message === "RateLimit") {
        retries--;
        if (retries <= 0) {
          console.error(
            `Failed to fetch table ${tableName} after multiple retries due to rate limiting.`
          );
          setStatus(
            `API-Limit erreicht. Daten konnten nicht geladen werden.`,
            true
          );
          return [];
        }
        console.warn(
          `Rate limit hit for ${tableName}. Retrying in ${wait}ms...`
        );
        await delay(wait);
        wait *= 2;
      } else {
        console.error(`Error fetching data from table ${tableName}:`, error);
        setStatus(`Fehler beim Laden der Tabelle: ${tableName}.`, true);
        return [];
      }
    }
  }
  return [];
}

async function seaTableGetUploadLink() {
    if (!seaTableAccessToken || !apiGatewayUrl) {
        console.error("Cannot get upload link without access token and gateway URL.");
        return null;
    }
    try {
        const log = (message, ...data) => pgLog(`[API-GetUploadLink] ${message}`, ...data);
        log('Starte Abruf des App-Upload-Links...');
        if (!apiGatewayUrl) {
            log("!!! FEHLER: API Gateway URL fehlt.");
            return null;
        }

        const baseUrl = new URL(apiGatewayUrl).origin;
        const url = `${baseUrl}/api/v2.1/dtable/app-upload-link/?dtable_uuid=${SEATABLE_DTABLE_UUID}`;
        log(`Sende GET-Anfrage an: ${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Token ${SEATABLE_API_TOKEN}` }
        });
        log(`Antwort-Status: ${response.status}`);
        const responseText = await response.text();
        log('Antwort-Text vom Server:', responseText);

        if (!response.ok) {
            log(`!!! FEHLER: HTTP-Fehler!`, responseText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
        }
        
        const data = JSON.parse(responseText);
        log('Erfolgreiche Antwort erhalten:', data);
        // Erwartet: { upload_link, parent_path, path }
        if (!data.path) {
            log('!!! WARNUNG: Die Server-Antwort enthält keinen "path". Upload wird wahrscheinlich fehlschlagen.');
        }
        return data;
    } catch (error) {
        pgLog(`!!! KRITISCHER FEHLER beim Abrufen des Upload-Links:`, error);
        console.error("Error getting SeaTable upload link:", error);
        return null;
    }
}

async function seaTableUploadFile(uploadLink, file, parentDir) {
    const log = (message, ...data) => pgLog(`[API-UploadFile] ${message}`, ...data);
    log(`Starte Upload für Datei: ${file.name} in Verzeichnis: ${parentDir}`);
    try {
        const formData = new FormData();
        formData.append('parent_dir', parentDir);
        formData.append('file', file, file.name);
        log('FormData erstellt:', { parent_dir: parentDir, filename: file.name, size: file.size });

        const response = await fetch(uploadLink, {
            method: 'POST',
            body: formData
        });
        log(`Antwort-Status vom Upload-Server: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            log(`!!! FEHLER: Upload fehlgeschlagen.`, errorText);
            throw new Error(`Datei-Upload fehlgeschlagen: ${response.status} ${errorText}`);
        }

        log('Datei erfolgreich hochgeladen (Status 2xx).');
        return true;
    } catch (error) {
        log(`!!! KRITISCHER FEHLER beim Datei-Upload:`, error);
        console.error("Fehler beim Hochladen der Datei zu SeaTable:", error);
        return false;
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
        log(`Sende GET-Anfrage an: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Token ${SEATABLE_API_TOKEN}` }
        });
        log(`Antwort-Status: ${response.status}`);
        if (!response.ok) {
            const errorText = await response.text();
            log(`!!! FEHLER: HTTP-Fehler!`, { status: response.status, text: errorText });
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        log('Erfolgreiche Antwort erhalten:', data);

        return data.download_link;
    } catch (error) {
        log('!!! KRITISCHER FEHLER beim Abrufen des Download-Links:', error);
        console.error("Error getting SeaTable download link:", error);
        return null;
    }
}

async function seaTableUpdateRow(tableName, rowId, rowData) {
  const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
  if (!tableMap) {
    console.error(`[HYBRID-UPDATE] No column map found for table: ${tableName}`);
    return false;
  }

  const tableMeta = METADATA.tables.find( (t) => t.name.toLowerCase() === tableName.toLowerCase() );
  if (!tableMeta) {
    console.error(`[HYBRID-UPDATE] No table metadata found for: ${tableName}`);
    return false;
  }

  let allUpdatesSucceeded = true;

  for (const key in rowData) {
    if (Object.hasOwnProperty.call(rowData, key)) {
      const value = rowData[key];
      const colName = Object.keys(tableMap).find( (name) => tableMap[name] === key );

      if (!colName || colName === "_id") continue;

      const colMeta = tableMeta.columns.find(c => c.key === key);

      if (colMeta && colMeta.type === 'link') {
        const linkRowId = value && value[0] ? value[0] : null;
        const success = await updateSingleLink(tableName, rowId, colName, linkRowId ? [linkRowId] : []);
        if (!success) {
          console.error(`[API-LINK-UPDATE] Failed to update field: ${colName}`);
          allUpdatesSucceeded = false;
          break;
        }
      } else {
        let formattedValue;
        if (value === null || value === undefined || value === '') {
            formattedValue = "NULL";
        } else if (colMeta && colMeta.type === 'date') {
            const formattedDate = String(value).replace('T', ' ');
            formattedValue = `'${escapeSql(formattedDate)}'`;
        } else if (colMeta && colMeta.type === 'number') { const numValue = parseFloat(value); formattedValue = isNaN(numValue) ? "NULL" : numValue; }
        else if (typeof value === "boolean") formattedValue = value ? "true" : "false";
        else formattedValue = `'${escapeSql(String(value))}'`;

        const sql = `UPDATE \`${tableName}\` SET \`${colName}\` = ${formattedValue} WHERE \`_id\` = '${rowId}'`;
        const result = await seaTableSqlQuery(sql, false);
        if (result === null) {
          console.error(`[SQL-UPDATE] Failed to update field: ${colName}`);
          allUpdatesSucceeded = false;
          break;
        }
      }
    }
  }
  return allUpdatesSucceeded ? rowId : false;
}

async function seaTableUpdateLinkField(terminRowId, mitarbeiterRowId) {
  if (!seaTableAccessToken || !apiGatewayUrl) return false;
  try {
    const termineTableMeta = METADATA.tables.find((t) => t.name === "Termine");
    const mitarbeiterTableMeta = METADATA.tables.find((t) => t.name === "Mitarbeiter");
    if (!termineTableMeta || !mitarbeiterTableMeta) throw new Error("Could not find 'Termine' or 'Mitarbeiter' table in metadata.");

    const linkColumnMeta = termineTableMeta.columns.find((c) => c.name === "Mitarbeiter_ID");
    if (!linkColumnMeta || !linkColumnMeta.data || !linkColumnMeta.data.link_id) throw new Error("Could not find 'link_id' for 'Mitarbeiter_ID' column.");

    const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/links/`;
    const body = {
      table_id: termineTableMeta._id,
      other_table_id: mitarbeiterTableMeta._id,
      link_id: linkColumnMeta.data.link_id,
      other_rows_ids_map: {
        [terminRowId]: mitarbeiterRowId ? [mitarbeiterRowId] : [],
      },
    };

    console.log("[API-LINK-UPDATE] PUT /links Payload:", JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${seaTableAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Link update failed: ${response.status} ${errorText}`);
    }
    console.log("[API-LINK-UPDATE] Link updated successfully.");
    return true;
  } catch (error) {
    console.error("Error updating link field:", error);
    return false;
  }
}

async function seaTableAddRow(tableName, rowData) {
  // Neuer, effizienter Ansatz basierend auf dem Skript des Benutzers:
  // 1. Daten für die Verknüpfung (Mitarbeiter_ID) von den restlichen Daten trennen.
  // 2. Spalten-Keys in Spalten-NAMEN umwandeln, da der /rows Endpunkt Namen erwartet.
  // 3. Eine neue Zeile mit den umgewandelten Daten erstellen.
  // 4. Die Verknüpfung in einem separaten Schritt über die Links-API setzen.
  console.log("[ADD-ROW-NEW] Starting new add-row process.");

  if (!seaTableAccessToken || !apiGatewayUrl) {
    console.error("Cannot add row without access token and gateway URL.");
    return false;
  }

  // --- SCHRITT 1: Daten vorbereiten (Link trennen, Keys in Namen umwandeln) ---
  const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
  if (!tableMap) {
      console.error(`[ADD-ROW-NEW] Column map for table '${tableName}' not found.`);
      return false;
  }
  const tableMeta = METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
  const linkColumns = tableMeta ? tableMeta.columns.filter(c => c.type === 'link') : [];

  const linkData = {};
  const rowDataForCreation = { ...rowData };

  linkColumns.forEach(col => {
      if (rowDataForCreation[col.key]) {
          linkData[col.name] = rowDataForCreation[col.key][0]; // Store by name for updateSingleLink
          delete rowDataForCreation[col.key];
      }
  });

  // KORREKTUR: Der 'rows' Endpunkt erwartet Spalten-NAMEN, nicht Spalten-Keys.
  // Wir müssen die Keys (z.B. '0000') in Namen (z.B. 'Terminpartner') umwandeln.
  const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));

  const rowDataWithNames = {};
  for (const key in rowDataForCreation) {
      const name = reversedMap[key];
      if (name) {
          // API erwartet `null` für leere Felder, nicht `undefined`
          const value = rowDataForCreation[key];
          rowDataWithNames[name] = (value === undefined || value === '') ? null : value;
      } else if (key !== '_id') {
          console.warn(`[ADD-ROW-NEW] No column name found for key: ${key}`);
      }
  }

  let newRowId = null;

  // --- SCHRITT 2: Zeile mit den meisten Daten anlegen ---
  try {
    // Wir verwenden den "Append rows" (plural) Endpunkt, wie im Skript des Benutzers.
    const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/`;
    const body = { table_name: tableName, rows: [rowDataWithNames] }; // KORREKTUR: rowDataWithNames verwenden

    console.log(`[ADD-ROW-NEW] Step 1: Creating row. POST to ${url}`);
    console.log(`[ADD-ROW-NEW] Step 1 Body:`, JSON.parse(JSON.stringify(body)));

    const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${seaTableAccessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const responseText = await response.text();
    console.log(`[ADD-ROW-NEW] Step 1 Response Status: ${response.status}`);
    console.log(`[ADD-ROW-NEW] Step 1 Response Body:`, responseText);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    if (!result || !result.row_ids || result.row_ids.length === 0) {
      // Falls die API einen 200 OK mit einer Fehlermeldung zurückgibt (z.B. bei falschem Spaltennamen)
      const errorMessage = result.error_message || "API did not return a valid new row ID in 'row_ids' array.";
      throw new Error(errorMessage);
    }
    // KORREKTUR: Die API gibt ein Array von Objekten zurück, wir brauchen die _id Eigenschaft daraus.
    // Dein Skript hat dies korrekt gezeigt: `data.row_ids[0]._id`
    newRowId = result.row_ids[0]?._id;
    if (!newRowId) {
      throw new Error("API response for new row is malformed, missing _id in row_ids[0].");
    }
    console.log(`[ADD-ROW-NEW] Step 1 Success: Created row with _id: ${newRowId}`);
  } catch (error) {
    console.error("[ADD-ROW-NEW] Step 1 FAILED: Could not create initial row.", error);
    return false;
  }

  // --- SCHRITT 3: Verknüpfungen setzen ---
  for (const colName in linkData) {
    if (linkData[colName]) {
        console.log(`[ADD-ROW-NEW] Step 2: Linking ${colName} ${linkData[colName]} to new row ${newRowId}.`);
        const linkSuccess = await updateSingleLink(tableName, newRowId, colName, [linkData[colName]]);
        if (!linkSuccess) {
            console.error(`[ADD-ROW-NEW] Step 2 FAILED: Could not link ${colName} to the new row.`);
            return false; // Fehler, wenn die Verknüpfung fehlschlägt.
        }
        console.log(`[ADD-ROW-NEW] Step 2 Success: ${colName} linked.`);
    }
  }

  console.log(`[ADD-ROW-NEW] Process finished successfully. Returning new row ID: ${newRowId}`);
  return newRowId;
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
        
        console.log(`[API-LINK-UPDATE] Updating link for ${linkColumnName}. Payload:`, body);
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

async function seaTableUpdateUmsatzRow(tableName, rowId, rowData) {
    umsatzLog("[UPDATE-UMSATZ-SQL] Starting SQL-based update process.");
    if (!seaTableAccessToken || !apiGatewayUrl) return false;

    const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
    if (!tableMap) {
        console.error(`[UPDATE-UMSATZ-SQL] No column map for table: ${tableName}`);
        return false;
    }

    const linkColumnKeys = [
        COLUMN_MAPS.umsatz.Mitarbeiter_ID,
        COLUMN_MAPS.umsatz.Gesellschaft_ID,
        COLUMN_MAPS.umsatz.Produkt_ID
    ];

    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));
    let allUpdatesSucceeded = true;

    for (const key in rowData) {
        if (!Object.prototype.hasOwnProperty.call(rowData, key)) continue;

        const value = rowData[key];
        const colName = reversedMap[key];

        if (!colName || colName === '_id') continue;

        if (linkColumnKeys.includes(key)) {
            const linkRowId = value && value[0] ? value[0] : null;
            const success = await updateSingleLink(tableName, rowId, colName, linkRowId ? [linkRowId] : []);
            if (!success) { allUpdatesSucceeded = false; break; }
        } else {
            const colMeta = METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase())?.columns.find(c => c.key === key);
            let formattedValue;
            if (value === null || value === undefined || value === '') { formattedValue = "NULL"; }
            else if (colMeta && colMeta.type === 'number') { const numValue = parseFloat(value); formattedValue = isNaN(numValue) ? "NULL" : numValue; }
            else if (typeof value === 'boolean') { formattedValue = value ? "true" : "false"; }
            else { formattedValue = `'${escapeSql(String(value))}'`; }

            const sql = `UPDATE \`${tableName}\` SET \`${colName}\` = ${formattedValue} WHERE \`_id\` = '${rowId}'`;
            const result = await seaTableSqlQuery(sql, false);
            if (result === null) { allUpdatesSucceeded = false; break; }
        }
    }
    return allUpdatesSucceeded;
}

async function seaTableAddUmsatzRow(tableName, rowData) {
    umsatzLog("[ADD-UMSATZ] Starting add-umsatz process.");
    if (!seaTableAccessToken || !apiGatewayUrl) return false;

    const linkColumns = {
        Mitarbeiter_ID: COLUMN_MAPS.umsatz.Mitarbeiter_ID,
        Gesellschaft_ID: COLUMN_MAPS.umsatz.Gesellschaft_ID,
        Produkt_ID: COLUMN_MAPS.umsatz.Produkt_ID
    };
    const linkData = {};
    const rowDataForCreation = { ...rowData };
    for (const name in linkColumns) {
        const colKey = linkColumns[name];
        if (Object.prototype.hasOwnProperty.call(rowDataForCreation, colKey)) {
            linkData[name] = rowDataForCreation[colKey]?.[0] || null;
            delete rowDataForCreation[colKey];
        }
    }

    const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));
    const rowDataWithNames = {};
    for (const key in rowDataForCreation) {
        const name = reversedMap[key];
        if (name) rowDataWithNames[name] = (rowDataForCreation[key] === undefined || rowDataForCreation[key] === '') ? null : rowDataForCreation[key];
    }

    let newRowId = null;
    try {
        const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/`;
        const body = { table_name: tableName, rows: [rowDataWithNames] };
        const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${seaTableAccessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const result = await response.json();
        if (!response.ok || !result.row_ids || result.row_ids.length === 0) {
            throw new Error(`Create failed: ${result.error_message || 'No row ID returned'}`);
        }
        newRowId = result.row_ids[0]?._id;
        if (!newRowId) throw new Error("Could not get new row ID");
    } catch (error) {
        console.error("[ADD-UMSATZ] Step 1 FAILED:", error);
        return false;
    }

    let allLinksSuccess = true;
    for (const colName in linkData) {
        if (linkData[colName]) {
            const success = await updateSingleLink(tableName, newRowId, colName, [linkData[colName]]);
            if (!success) {
                allLinksSuccess = false;
                umsatzLog(`[ADD-UMSATZ] Link creation for ${colName} failed.`);
                break;
            }
        }
    }

    return allLinksSuccess;
}
// --- DATA NORMALIZATION & MAPPING ---

async function seaTableUpdateTermin(rowId, rowData) {
    const tableName = 'Termine';
    const terminLog = (message, ...data) => console.log(`%c[UpdateTermin] %c${message}`, 'color: #4f46e5; font-weight: bold;', 'color: black;', ...data);
    terminLog(`Starte Update für Termin ID: ${rowId}`);

    const tableMap = COLUMN_MAPS.termine;
    if (!tableMap) {
        terminLog('!!! FEHLER: Spalten-Map für Termine nicht gefunden.');
        return false;
    }
    const tableMeta = METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
    if (!tableMeta) {
        terminLog('!!! FEHLER: Metadaten für Termine nicht gefunden.');
        return false;
    }
    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));

    const linkColumnKeys = [
        tableMap.Mitarbeiter_ID,
        tableMap.Eingeladener
    ].filter(Boolean);

    const dataUpdates = {};
    const linkUpdates = {};

    // 1. Trenne Link-Daten von anderen Daten
    for (const key in rowData) {
        if (linkColumnKeys.includes(key)) {
            linkUpdates[key] = rowData[key];
        } else {
            dataUpdates[key] = rowData[key];
        }
    }
    terminLog('Getrennte Daten:', { dataUpdates, linkUpdates });

    // 2. Aktualisiere Nicht-Link-Daten mit einer einzigen SQL-Abfrage
    const setClauses = [];
    for (const key in dataUpdates) {
        const value = dataUpdates[key];
        const colName = reversedMap[key];
        if (!colName || colName === '_id') continue;

        const colMeta = tableMeta.columns.find(c => c.key === key);
        let formattedValue;
        if (value === null || value === undefined || value === '') {
            formattedValue = "NULL";
        } else if (colMeta && colMeta.type === 'date') {
            const formattedDate = String(value).replace('T', ' ');
            formattedValue = `'${escapeSql(formattedDate)}'`;
        } else if (colMeta && (colMeta.type === 'number' || colMeta.type === 'duration')) {
            const numValue = parseFloat(value);
            formattedValue = isNaN(numValue) ? "NULL" : numValue;
        } else if (typeof value === "boolean") {
            formattedValue = value ? "true" : "false";
        } else {
            formattedValue = `'${escapeSql(String(value))}'`;
        }
        setClauses.push(`\`${colName}\` = ${formattedValue}`);
    }

    if (setClauses.length > 0) {
        const sql = `UPDATE \`${tableName}\` SET ${setClauses.join(', ')} WHERE \`_id\` = '${rowId}'`;
        terminLog('Führe SQL-Update für Datenfelder aus:', sql);
        const result = await seaTableSqlQuery(sql, false);
        if (result === null) {
            terminLog('!!! FEHLER: SQL-Update fehlgeschlagen.');
            return false;
        }
        terminLog('SQL-Update erfolgreich.');
    }

    // 3. Aktualisiere Link-Daten separat am Ende
    for (const key in linkUpdates) {
        const colName = reversedMap[key];
        const linkRowId = linkUpdates[key] && linkUpdates[key][0] ? linkUpdates[key][0] : null;
        terminLog(`Aktualisiere Link-Feld '${colName}' mit ID: ${linkRowId}`);
        const success = await updateSingleLink(tableName, rowId, colName, linkRowId ? [linkRowId] : []);
        if (!success) {
            terminLog(`!!! FEHLER: Update für Link-Feld '${colName}' fehlgeschlagen.`);
            return false;
        }
        terminLog(`Link-Feld '${colName}' erfolgreich aktualisiert.`);
    }

    terminLog(`Update für Termin ID ${rowId} erfolgreich abgeschlossen.`);
    return rowId;
}

async function seaTableAddTermin(rowData) {
    const tableName = 'Termine';
    const terminLog = (message, ...data) => console.log(`%c[AddTermin] %c${message}`, 'color: #4f46e5; font-weight: bold;', 'color: black;', ...data);
    terminLog('Starte Anlegen eines neuen Termins.');

    const tableMap = COLUMN_MAPS.termine;
    if (!tableMap) {
        terminLog('!!! FEHLER: Spalten-Map für Termine nicht gefunden.');
        return false;
    }
    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));

    const linkColumnKeys = [
        tableMap.Mitarbeiter_ID,
        tableMap.Eingeladener
    ].filter(Boolean);

    const rowDataForCreation = {};
    const linkUpdates = {};

    // 1. Trenne Link-Daten von anderen Daten und konvertiere Keys zu Namen
    for (const key in rowData) {
        const colName = reversedMap[key];
        if (!colName || colName === '_id') continue;

        if (linkColumnKeys.includes(key)) {
            linkUpdates[colName] = rowData[key];
        } else {
            const value = rowData[key];
            rowDataForCreation[colName] = (value === undefined || value === '') ? null : value;
        }
    }
    terminLog('Getrennte Daten:', { rowDataForCreation, linkUpdates });

    // 2. Zeile mit den meisten Daten anlegen
    let newRowId = null;
    try {
        const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/`;
        const body = { table_name: tableName, rows: [rowDataForCreation] };
        terminLog('Schritt 1: Erstelle Zeile mit Body:', body);
        terminLog('Schritt 1: Erstelle Zeile mit Body:', body);
        const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${seaTableAccessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const result = await response.json();
        if (!response.ok || !result.row_ids || result.row_ids.length === 0) {
            throw new Error(`Create failed: ${result.error_message || 'No row ID returned'}`);
        }
        newRowId = result.row_ids[0]?._id;
        if (!newRowId) throw new Error("Could not get new row ID");
        terminLog(`Schritt 1 erfolgreich: Neue Zeile mit ID ${newRowId} erstellt.`);
    } catch (error) {
        terminLog('!!! FEHLER: Schritt 1 (Zeile erstellen) fehlgeschlagen.', error);
        return false;
    }

    // 3. Aktualisiere Link-Daten separat am Ende
    for (const colName in linkUpdates) {
        const linkRowId = linkUpdates[colName] && linkUpdates[colName][0] ? linkUpdates[colName][0] : null;
        if (linkRowId) {
            terminLog(`Schritt 2: Aktualisiere Link-Feld '${colName}' mit ID: ${linkRowId}`);
            const success = await updateSingleLink(tableName, newRowId, colName, [linkRowId]);
            if (!success) {
                terminLog(`!!! FEHLER: Update für Link-Feld '${colName}' fehlgeschlagen.`);
                // Hier könnte man überlegen, die gerade erstellte Zeile wieder zu löschen.
                return false;
            }
            terminLog(`Link-Feld '${colName}' erfolgreich aktualisiert.`);
        }
    }

    terminLog(`Anlegen des Termins mit ID ${newRowId} erfolgreich abgeschlossen.`);
    return newRowId;
}

// NEU: Generische Funktion zum Hinzufügen einer Zeile, die von `addPlanningRowToDatabase` verwendet wird.
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

function normalizeAllData() {
  const tableNames = Object.keys(db).filter((name) => COLUMN_MAPS[name]);

  for (const tableName of tableNames) {
    const tableMeta = METADATA.tables.find(
      (t) => t.name.toLowerCase() === tableName
    );
    if (!tableMeta) continue;

    if (Array.isArray(db[tableName])) {
      db[tableName] = db[tableName].map((row) => {
        const newRow = { ...row };
        for (const colName in COLUMN_MAPS[tableName]) {
          const colKey = COLUMN_MAPS[tableName][colName];
          const colMeta = tableMeta.columns.find((c) => c.key === colKey);
          let value = row[colKey];

          if (value !== undefined && value !== null) {
            // Intelligente Normalisierung basierend auf Spaltentyp
            if (colMeta && colMeta.type === "link") {
              let id = null,
                displayValue = null;
              if (Array.isArray(value) && value.length > 0 && value[0]) {
                id = value[0].row_id;
                displayValue = value[0].display_value;
              } else if (
                typeof value === "object" &&
                !Array.isArray(value) &&
                value &&
                value.row_id
              ) {
                id = value.row_id;
                displayValue = value.display_value;
              }

              if (colName === "Karrierestufe") {
                value = displayValue;
              } else {
                // Default für Links wie Werber
                value = id;
              }
            } else if (colMeta && colMeta.type === "single-select") {
              const option = colMeta.data.options.find(
                (opt) => opt.id === value
              );
              value = option ? option.name : value;
            } else if (
              colMeta &&
              (colMeta.type === "link-formula" || colMeta.type === "lookup") &&
              Array.isArray(value) &&
              value.length > 0 &&
              typeof value[0] === "object" &&
              value[0] !== null
            ) {
              value = value[0].display_value;
            }
          }
          newRow[colName] = value;
        }
        return newRow;
      });
    }
  }
}

function mapSqlResults(results, tableName) {
  const tableNameLower = tableName.toLowerCase();
  if (!COLUMN_MAPS[tableNameLower]) return results;
  // KORREKTUR: tableMeta muss hier im Scope definiert werden, um auf die Metadaten zugreifen zu können.
  const tableMeta = METADATA.tables.find(
    (t) => t.name.toLowerCase() === tableNameLower
  );
  const reversedMap = Object.entries(COLUMN_MAPS[tableNameLower]).reduce(
    (acc, [name, key]) => {
      acc[key] = name;
      return acc;
    },
    {}
  );

  return results.map((row) => {
    const newRow = {};
    for (const key in row) {
      const name = reversedMap[key] || key;
      let value = row[key];

      // KORREKTUR: Konvertiert Single-Select-IDs (z.B. für Status) in Text-Werte
      // Diese Logik war vorher fehlerhaft, da tableMeta nicht im Scope war.
      if (tableMeta) {
        const colMeta = tableMeta.columns.find((c) => c.key === key);
        if (colMeta && colMeta.type === "single-select" && value !== null) {
          const option = colMeta.data.options.find((opt) => opt.id === value);
          value = option ? option.name : value;
        }
      }
      newRow[name] = value;
    }
    return newRow;
  });
}

async function loadAllData() {
  HIERARCHY_CACHE = null; // Hierarchie-Cache bei jedem Neuladen invalidieren
  setStatus("Lade Datenbank-Zugang...");
  await getSeaTableAccessToken();
  if (!seaTableAccessToken) return false;

  // Lade Spalten-Mappings aus Cache oder API
  let cachedColumnMaps = loadFromCache("column_maps", 60);
  if (cachedColumnMaps) {
    // console.log("Lade Spalten-Mappings aus dem Cache.");
    COLUMN_MAPS = cachedColumnMaps.maps;
    METADATA.tables = cachedColumnMaps.meta;
  } else {
    // console.log("Lade Spalten-Mappings von der API.");
    COLUMN_MAPS = await fetchColumnMaps();
    if (Object.keys(COLUMN_MAPS).length === 0) return false;
    saveToCache("column_maps", { maps: COLUMN_MAPS, meta: METADATA.tables });
    console.log('Geladene Tabellen-Metadaten:', METADATA.tables); // NEU: Log für Tabellenstruktur
  }

  // NEU: Füge die Fallback-Map für Checkin hinzu, falls sie nicht von der API kommt.
  if (!COLUMN_MAPS.checkin) {
    COLUMN_MAPS.checkin = CHECKIN_COLUMN_MAP_FALLBACK;
  }

  setStatus("Lade Stammdaten...");
  const tablesToLoad = [
    "Mitarbeiter",
    "Karriereplan",
    "Einarbeitungsschritte",
    "Monatsplanung",
    "Infoplanung",
    "Termine",
    "Einarbeitung",
    "Gesellschaften",
    "Produkte",
    "PG",
    "Bürostandorte",
    "Checkin",
    "Umsatz", // NEU: Umsatzdaten global laden, um Hinweise im Kalender zu ermöglichen
  ];

  console.log('%c[DATENLADEN] %cStarte das Laden der Stammdaten...', 'color: #17a2b8; font-weight: bold;', 'color: black;');
  console.time('[DATENLADEN] Gesamtladezeit Stammdaten');

  for (const tableName of tablesToLoad) {
    const key = tableName.toLowerCase();
    let cachedData = loadFromCache(key, 60); // Cache für 60 Minuten

    if (cachedData) {
      console.log(`%c[DATENLADEN] %cLade '${tableName}' aus dem Cache.`, 'color: #17a2b8; font-weight: bold;', 'color: black;');
      db[key] = cachedData;
    } else {
      console.time(`[DATENLADEN] API-Ladezeit für '${tableName}'`);
      console.log(`%c[DATENLADEN] %cLade '${tableName}' von der API...`, 'color: #17a2b8; font-weight: bold;', 'color: black;');
      const apiData = await seaTableQuery(tableName);
      console.timeEnd(`[DATENLADEN] API-Ladezeit für '${tableName}'`);
      if (apiData && apiData.length > 0) {
        db[key] = apiData;
        saveToCache(key, apiData);
        console.log(`%c[DATENLADEN] %c'${tableName}' geladen und gecached (${apiData.length} Zeilen).`, 'color: #17a2b8; font-weight: bold;', 'color: black;');
      } else {
        // Wenn die API-Abfrage (trotz Retries) fehlschlägt, ist das kritisch.
        if (tableName === "Mitarbeiter") {
          setStatus(
            `Kritischer Fehler: Mitarbeiterdaten konnten nicht geladen werden.`,
            true
          );
          return false; // Stoppe die Initialisierung
        }
        // NEU: Logge den Fehler nicht, wenn die Checkin-Tabelle nicht existiert.
        // Dies ermöglicht eine sanfte Einführung der Funktion, ohne dass die DB sofort angepasst werden muss.
        if (tableName !== 'Checkin') {
            console.error(`Konnte '${tableName}' nicht von der API laden.`);
        }
      }
    }
    if (key === 'checkin') {
        console.log(`%c[DATENLADEN-DEBUG] %cInhalt der Tabelle 'Checkin':`, 'color: #d4af37; font-weight: bold;', 'color: black;', db[key]);
    }
  }
  console.timeEnd('[DATENLADEN] Gesamtladezeit Stammdaten');

  normalizeAllData();
  // console.log("Stammdaten geladen und zwischengespeichert.");
  return true;
}

// --- HILFSFUNKTIONEN ---
function _escapeHtml(str) {
    if (typeof str !== 'string') {
        return '';
    }
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function saveToCache(key, data) {
  try {
    const item = {
      timestamp: new Date().getTime(),
      data: data,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (e) {
    console.error("Fehler beim Speichern im Cache", e);
  }
}

function loadFromCache(key, maxAgeMinutes = 60) {
  try {
    const itemStr = localStorage.getItem(CACHE_PREFIX + key);
    if (!itemStr) return null;
    const item = JSON.parse(itemStr);
    const now = new Date().getTime();
    if (now - item.timestamp > maxAgeMinutes * 60 * 1000) return null;
    return item.data;
  } catch (e) {
    return null;
  }
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function getCurrentDate() {
    // Gibt entweder das Zeitreise-Datum oder das aktuelle Datum zurück
    return timeTravelDate ? new Date(timeTravelDate) : new Date();
}

function setStatus(msg, isError = false) {
  dom.statusText.textContent = msg;
  dom.statusMessage.style.color = isError ? "var(--color-accent-red)" : "";
  dom.statusMessage.style.display = msg ? "flex" : "none";
  const loader = dom.statusMessage.querySelector(".loader");
  if (loader) loader.style.display = isError ? "none" : "block";
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

async function getPrimaryKeyColumnName(tableName, forceRefresh = false) {
    const log = (message, ...data) => console.log(`%c[PK-Finder] %c${message}`, 'color: #007bff; font-weight: bold;', 'color: black;', ...data);
    log(`Suche Primärschlüssel für Tabelle: '${tableName}'. Force-Refresh: ${forceRefresh}`);

    if (forceRefresh) {
        log(`[CACHE-REFRESH] Metadaten-Cache wird aktualisiert...`);
        localStorage.removeItem(CACHE_PREFIX + 'column_maps');
        COLUMN_MAPS = await fetchColumnMaps();
        if (Object.keys(COLUMN_MAPS).length > 0) {
            saveToCache("column_maps", { maps: COLUMN_MAPS, meta: METADATA.tables });
            log(`[CACHE-REFRESH] Neue Metadaten geladen und gespeichert.`);
        } else {
            log(`[CACHE-REFRESH] !!! FEHLER: Neue Metadaten konnten nicht geladen werden.`);
            return null;
        }
    }

    if (!METADATA || !METADATA.tables) {
        log("!!! FEHLER: Metadaten sind nicht verfügbar.");
        return null;
    }

    log(`Verfügbare Tabellen in Metadaten:`, METADATA.tables.map(t => t.name));

    const tableMeta = METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());

    if (!tableMeta) {
        if (!forceRefresh) {
            log(`Tabelle '${tableName}' nicht in Metadaten gefunden. Versuche es mit Cache-Refresh...`);
            return await getPrimaryKeyColumnName(tableName, true);
        } else {
            log(`!!! FEHLER: Tabelle '${tableName}' auch nach Refresh nicht in Metadaten gefunden.`);
            return null;
        }
    }
    
    log(`Metadaten für Tabelle '${tableName}' gefunden:`, tableMeta);

    // KORREKTUR: Suche die Spalte, die explizit als Primärschlüssel markiert ist.
    const primaryKeyColumn = tableMeta.columns.find(c => c.is_primary === true);

    if (primaryKeyColumn) {
        log(`Primärschlüssel via 'is_primary' gefunden: '${primaryKeyColumn.name}'`);
        return primaryKeyColumn.name;
    }

    // Fallback für den Fall, dass 'is_primary' nicht gesetzt ist: Nimm die erste Spalte.
    const firstColumn = tableMeta.columns[0];
    if (firstColumn) {
        log(`WARNUNG: Kein Primärschlüssel mit 'is_primary=true' gefunden. Fallback auf die erste Spalte: '${firstColumn.name}'.`);
        return firstColumn.name;
    }
    
    log(`!!! FEHLER: Kein Primärschlüssel in Tabelle '${tableName}' gefunden.`);
    return null;
}
function findRowById(tableName, id) {
  return db[tableName.toLowerCase()].find((row) => row._id === id);
}

// NEU: Funktion, um die Hierarchie nach oben zu durchlaufen
function getAncestors(userId, levels = 3) {
    const ancestors = [];
    let currentUser = findRowById('mitarbeiter', userId);
    let currentLevel = 0;
    while (currentUser && currentUser.Werber && currentLevel < levels) {
        const manager = findRowById('mitarbeiter', currentUser.Werber);
        if (manager && manager.Status !== 'Ausgeschieden') {
            ancestors.push(manager);
            currentUser = manager;
            currentLevel++;
        } else {
            // Stop if manager not found or is inactive
            break;
        }
    }
    return ancestors;
}
function escapeSql(str) {
  if (typeof str !== "string") return str;
  return str.replace(/'/g, "''");
}

// KORREKTUR: Neue Hilfsfunktion, um die Timeline-Navigation für verschiedene Monate zu ermöglichen.
function getMonthlyCycleDatesForDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    let currentMonth = d.getMonth();
    let currentYear = d.getFullYear();
    let thisMonthCycleStart = _findCycleStartForMonth(currentYear, currentMonth);
    let startDate, endDate;

    // Diese Logik stellt sicher, dass wir immer den Zyklus bekommen, in den das `date` fällt.
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

// --- NEU: UI-Einstellungen im LocalStorage speichern/laden ---
function getUiSettings() {
    try {
        const settings = localStorage.getItem('skt-ui-settings');
        return settings ? JSON.parse(settings) : {};
    } catch (e) { return {}; }
}
function saveUiSetting(key, value) {
    const settings = getUiSettings();
    settings[key] = value;
    localStorage.setItem('skt-ui-settings', JSON.stringify(settings));
}
function loadUiSetting(key, defaultValue) {
    const settings = getUiSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
}

// NEU: Generische Funktion für das Bestätigungs-Modal
async function showConfirmationModal(text, title = 'Bestätigung', okText = 'Bestätigen', cancelText = 'Abbrechen') {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById('confirm-modal');
        const confirmOkBtn = document.getElementById('confirm-modal-ok-btn');
        const confirmCancelBtn = document.getElementById('confirm-modal-cancel-btn');
        const titleEl = document.getElementById('confirm-modal-title');
        const textEl = document.getElementById('confirm-modal-text');

        if (!confirmModal || !confirmOkBtn || !confirmCancelBtn || !titleEl || !textEl) {
            console.error('Bestätigungs-Modal-Elemente nicht gefunden. Fallback auf window.confirm.');
            resolve(window.confirm(text));
            return;
        }

        titleEl.textContent = title;
        textEl.textContent = text;
        confirmOkBtn.textContent = okText;
        confirmCancelBtn.textContent = cancelText;

        const handleOk = () => { cleanup(); resolve(true); };
        const handleCancel = () => { cleanup(); resolve(false); };

        const cleanup = () => {
            confirmModal.classList.remove('visible');
            document.body.classList.remove('modal-open');
            document.documentElement.classList.remove('modal-open');
            confirmOkBtn.removeEventListener('click', handleOk);
            confirmCancelBtn.removeEventListener('click', handleCancel);
        };

        confirmOkBtn.addEventListener('click', handleOk, { once: true });
        confirmCancelBtn.addEventListener('click', handleCancel, { once: true });

        confirmModal.classList.add('visible');
        document.body.classList.add('modal-open');
        document.documentElement.classList.add('modal-open');
    });
}

function _findCycleStartForMonth(year, month) {
    const date = new Date(year, month, 1);
    while (date.getDay() !== 4) { // Thursday
        date.setDate(date.getDate() + 1);
    }
    if (date.getDate() <= 2) {
        date.setDate(date.getDate() + 7);
    }
    return date;
}

function getMonthlyCycleDates() {
  const today = getCurrentDate();
  today.setHours(0, 0, 0, 0);

  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let thisMonthCycleStart = _findCycleStartForMonth(currentYear, currentMonth);
  let startDate, endDate;

  if (today < thisMonthCycleStart) {
    let prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    let prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    startDate = _findCycleStartForMonth(prevYear, prevMonth);
    endDate = new Date(thisMonthCycleStart);
    endDate.setDate(endDate.getDate() - 1);
  } else {
    let nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    let nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    startDate = thisMonthCycleStart;
    let nextMonthCycleStart = _findCycleStartForMonth(nextYear, nextMonth);
    endDate = new Date(nextMonthCycleStart);
    endDate.setDate(endDate.getDate() - 1);
  }
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
}
function isDateValidInfoabend(dateToCheck) {
    // Klonen, um das Original nicht zu verändern
    const checkDate = new Date(dateToCheck);
    checkDate.setHours(12, 0, 0, 0); // Zeit auf Mittag setzen, um Zeitzonenprobleme zu vermeiden

    if (checkDate.getDay() !== 3) { // Muss ein Mittwoch sein (Sonntag=0, Mittwoch=3)
        return false;
    }
    const referenceDate = new Date('2025-09-17T12:00:00Z'); // Referenz-Infoabend, ebenfalls auf Mittag gesetzt
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffInMs = checkDate.getTime() - referenceDate.getTime();
    const diffInDays = Math.round(diffInMs / msPerDay);

    // Die Differenz in Tagen muss durch 21 (3 Wochen) teilbar sein.
    return diffInDays % 21 === 0;
}

function updateUiForUserRoles() {
    const user = authenticatedUserData;
    if (!user || !user.Name) return;

    // Wettbewerb visibility
    const wettbewerbAllowedUsers = ["Jason Schreiber", "Samuel Königslehner"];
    const showWettbewerb = wettbewerbAllowedUsers.includes(user.Name.trim());

    if (dom.wettbewerbHeaderBtn) {
        // The button should be `hidden sm:flex` for authorized users.
        // For unauthorized users, it should just be `hidden`. So we toggle `sm:flex`.
        dom.wettbewerbHeaderBtn.classList.toggle('sm:flex', showWettbewerb);
    }
    if (dom.wettbewerbMenuItem) {
        dom.wettbewerbMenuItem.classList.toggle('hidden', !showWettbewerb);
    }

    // Stimmungsdashboard visibility
    const hasStimmungsAccess = user.Checkin === true || String(user.Checkin).toLowerCase() === 'true';
    const stimmungsDashboardHeaderBtn = document.getElementById('stimmungs-dashboard-header-btn');
    if (stimmungsDashboardHeaderBtn) {
        stimmungsDashboardHeaderBtn.classList.toggle('hidden', !hasStimmungsAccess);
    }
}

function getPreviousMonthlyCycleDates() {
    const { startDate: currentCycleStart } = getMonthlyCycleDates();

    const endDate = new Date(currentCycleStart);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);

    let searchMonth = currentCycleStart.getMonth() - 1;
    let searchYear = currentCycleStart.getFullYear();
    if (searchMonth < 0) {
        searchMonth = 11;
        searchYear -= 1;
    }

    const startDate = _findCycleStartForMonth(searchYear, searchMonth);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
}
function getWeeklyCycleDates() {
    const today = getCurrentDate();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // Sunday = 0, ..., Thursday = 4, ...

    // Finde den letzten Donnerstag. Donnerstag ist Tag 4.
    const diff = dayOfWeek - 4;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - diff);

    // Wenn der berechnete Start in der Zukunft liegt (z.B. heute ist Di, diff=-2, start=heute+2),
    // bedeutet das, die aktuelle Woche hat letzte Woche begonnen.
    if (startDate > today) {
        startDate.setDate(startDate.getDate() - 7);
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // 6 Tage nach Donnerstag ist Mittwoch
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
}
function animateValue(element, start, end, duration, formatAsCurrency = false) {
  if (!element) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = progress * (end - start) + start;
    const displayValue = Math.round(value);

    element.textContent = formatAsCurrency
      ? displayValue.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      : displayValue.toLocaleString("de-DE", { maximumFractionDigits: 0 });
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}
function updateCircleProgress(circleElement, radius, percentage) {
  if (!circleElement) return;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.min(percentage, 100) / 100) * circumference;
  circleElement.style.strokeDasharray = `${circumference} ${circumference}`;
  circleElement.style.strokeDashoffset = offset;
}

// --- DATENBERECHNUNGS-LOGIK (UMGESTELLT AUF SQL) ---

/*
 * HINWEIS ZUM AUFBAU DER 'TERMINE' DATENBANK:
 * Es gibt 2 wichtige Spalten: `Kategorie` und `Status`.
 *
 * KATEGORIEN:
 * - AT: Analysetermin (erster Schritt)
 * - BT: Beratungstermin (folgt auf AT)
 * - ST: Servicetermin (folgt auf BT)
 * - ET: Einstellungstermin
 *
 * STATUS-LOGIK FÜR ZÄHLUNG:
 *
 * AT (Analysetermin):
 * - Gehalten: Status ist 'Gehalten'.
 * - Ausgemacht: Status ist 'Ausgemacht' ODER 'Gehalten'.
 *
 * ET (Einstellungstermin):
 * - Gehalten: Status ist 'Gehalten', 'Weiterer ET', 'Info Eingeladen', 'Info Bestätigt', 'Info Anwesend', 'Wird Mitarbeiter'.
 * - Ausgemacht: Status ist 'Ausgemacht' ODER einer der 'Gehalten'-Stati.
 *   (Wird aktuell nicht separat in den KPIs ausgewiesen, aber die Logik ist so definiert).
 */

async function fetchBulkDashboardData(mitarbeiterIds) {
  if (!mitarbeiterIds || mitarbeiterIds.length === 0) return [];

  const users = mitarbeiterIds
    .map((id) => findRowById("mitarbeiter", id))
    .filter(Boolean);
  if (users.length === 0) return [];

  const { startDate, endDate } = getMonthlyCycleDates();
  const startDateIso = startDate.toISOString().split("T")[0];
  const endDateIso = endDate.toISOString().split("T")[0];
  const currentMonthName = startDate.toLocaleString("de-DE", { month: "long" });
  const currentYear = startDate.getFullYear();

  // NEU: Finde den nächsten Infoabend, um die korrekten Plandaten zu laden.
  const nextInfoDateForPlan = findNextInfoDateAfter(getCurrentDate());
  const nextInfoDateStringForPlan = nextInfoDateForPlan.toISOString().split('T')[0];

  // Plandaten (EH) aus dem vorgeladenen und normalisierten Cache laden.
  const planResults = db.monatsplanung.filter(
    (p) => p.Monat === currentMonthName && p.Jahr === currentYear
  );
  // NEU: Lade die ET-Plandaten aus der neuen Infoplanung-Tabelle.
  const infoPlanResults = db.infoplanung.filter(p => p.Informationsabend && p.Informationsabend.startsWith(nextInfoDateStringForPlan));
  // Termindaten für den aktuellen Monatszyklus laden (für ATs)
  const termineImMonat = db.termine.filter((t) => {
    if (!t.Datum) return false;
    const terminDate = new Date(t.Datum);
    return terminDate >= startDate && terminDate <= endDate;
  });

  // NEU: Capitalbank-ID für den Filter holen
  const capitalbank = db.gesellschaften.find(g => g.Gesellschaft === 'Capitalbank');
  const capitalbankId = capitalbank ? capitalbank._id : null;
  let capitalbankFilter = '';
  const dashboardLog = (message, ...data) => console.log(`%c[DASHBOARD_DATA_DEBUG] %c${message}`, 'color: #007bff; font-weight: bold;', 'color: black;', ...data);
  dashboardLog(`Lade Monats-EH für ${users.length} Mitarbeiter...`);

  // Lade alle relevanten Umsätze und filtere in JS, um SQL-Probleme zu umgehen.
  const userNames = users.map(u => u.Name).filter(Boolean);
  const userNamesSql = userNames.map(name => `'${escapeSql(name)}'`).join(',');

  const ehQuery = `SELECT Mitarbeiter_ID, Gesellschaft_ID, EH FROM Umsatz WHERE Datum >= '${startDateIso}' AND Datum <= '${endDateIso}' AND Mitarbeiter_ID IN (${userNamesSql})`;
  dashboardLog('Sende Abfrage für Monats-EH:', ehQuery);
  const ehResultRaw = await seaTableSqlQuery(ehQuery, true);
  const allEhRows = mapSqlResults(ehResultRaw || [], "Umsatz");
  dashboardLog(`Habe ${allEhRows.length} Umsatz-Zeilen für den Monat erhalten.`);

  // Für die Standard-EH-Anzeige werden ALLE Umsätze gezählt. Die Filterung für die Geld-Ansicht
  // geschieht in der `calculateAllStructureEarnings`-Funktion, die für die Euro-Werte zuständig ist.
  const ehByMitarbeiter = _.groupBy(allEhRows, row => row.Mitarbeiter_ID?.[0]?.row_id);
  const ehResults = Object.entries(ehByMitarbeiter).map(([mitarbeiterId, umsaetze]) => {
      const totalEh = umsaetze.reduce((sum, u) => sum + (u.EH || 0), 0);
      return {
          Mitarbeiter_ID: [{ row_id: mitarbeiterId }],
          ehIst: totalEh
      };
  });
  dashboardLog('Aggregierte Monats-EH (ungefiltert):', ehResults);
  
  // Definitionen für Termin-Status
  // "Gehalten" zählt nur Termine mit Status 'Gehalten'.
  const AT_STATUS_GEHALTEN = ["Gehalten"];
  const AT_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten"];
  // KORREKTUR: Falsche Status für "gehaltene" ETs entfernt (z.B. Storno, Ausgemacht).
  const ET_STATUS_GEHALTEN = ["Gehalten", "Info Eingeladen", "Weiterer ET", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];
  // NEU: Definition für ausgemachte ETs, die "Ausgemacht" und alle "Gehalten"-Stati umfasst.
  const ET_STATUS_AUSGEMACHT = ["Ausgemacht", ...ET_STATUS_GEHALTEN].filter(s => s !== 'Storno');

  return users.map((user) => {
    // 1. Plandaten und EH-Daten holen
    const plan = planResults.find((p) => p.Mitarbeiter_ID === user._id) || {};
    // NEU: ET-Plan aus der Infoplanung holen.
    const infoPlan = infoPlanResults.find(p => p.Mitarbeiter_ID === user._id) || {};
    const eh =
      ehResults.find(
        (e) =>
          e.Mitarbeiter_ID &&
          Array.isArray(e.Mitarbeiter_ID) &&
          e.Mitarbeiter_ID[0] &&
          e.Mitarbeiter_ID[0].row_id === user._id
      ) || {};
    const totalEh =
      totalEhResults.find(
        (te) =>
          te.Mitarbeiter_ID &&
          Array.isArray(te.Mitarbeiter_ID) &&
          te.Mitarbeiter_ID[0] &&
          te.Mitarbeiter_ID[0].row_id === user._id
      ) || {};
    // Termindaten aus dem Cache nach Benutzer filtern.
    const userTermineImMonat = termineImMonat.filter((t) => t.Mitarbeiter_ID === user._id);

    // 2. ATs für den aktuellen Monat berechnen
    let atIst = 0, atVereinbart = 0;
    userTermineImMonat.forEach((t) => {
        // NEU: Ein Termin zählt als Analysetermin, wenn es ein AT ist,
        // oder ein ST mit einer Umsatzprognose > 1 EH.
        const isAnalysisAppointment = t.Kategorie === "AT" || (t.Kategorie === "ST" && t.Umsatzprognose > 1);

        if (isAnalysisAppointment) {
          if (AT_STATUS_GEHALTEN.includes(t.Status)) atIst++;
          if (AT_STATUS_AUSGEMACHT.includes(t.Status)) atVereinbart++;
        }
    });

    // 3. ETs für den nächsten Infoabend berechnen
    const nextInfoDate = findNextInfoDateAfter(getCurrentDate());
    const nextInfoDateString = nextInfoDate.toISOString().split('T')[0];
    
    const etAusgemacht = db.termine.filter(t => 
        t.Mitarbeiter_ID === user._id &&
        t.Kategorie === 'ET' &&
        t.Infoabend && t.Infoabend.startsWith(nextInfoDateString) &&
        ET_STATUS_AUSGEMACHT.includes(t.Status)
    ).length;

    const ehZiel = plan["EH_Ziel"] || 0,
      etZiel = infoPlan["ET_Ziel"] || 0, // KORREKTUR: ET-Ziel aus der Infoplanung nehmen
      ehIst = eh.ehIst || 0;
    const atSoll =
      user.EHproATQuote && ehZiel > 0
        ? Math.round(ehZiel / user.EHproATQuote)
        : 0;
    const totalCurrentEh = totalEh.totalEh || 0;
    // NEU: Zähle Termine in der Vergangenheit mit Status "Ausgemacht"
    const today = new Date(getCurrentDate()); // KORREKTUR: Kopie erstellen, um Seiteneffekte zu vermeiden.
    today.setHours(0, 0, 0, 0);
    const outstandingAppointmentsCount = db.termine.filter(t =>
        t.Mitarbeiter_ID === user._id &&
        t.Status === 'Ausgemacht' &&
        t.Datum && new Date(t.Datum) < today &&
        t.Absage !== true // NEU: Stornierte Termine ausschließen
    ).length;
    const anzahlGeworbenerMA = db.mitarbeiter.filter( // KORREKTUR: Zähle nur aktive Mitarbeiter
      (m) => m.Werber === user._id && m.Status !== 'Ausgeschieden'
    ).length;
    const position = user.Karrierestufe || "";

    return {
      id: user._id,
      name: user.Name,
      position,
      ehGoal: ehZiel,
      ehCurrent: ehIst,
      etGoal: etZiel,
      etCurrent: etAusgemacht,
      atGoal: atSoll,
      atCurrent: atIst,
      atVereinbart,
      totalCurrentEh,
      outstandingAppointmentsCount,
      recruitedEmployees: anzahlGeworbenerMA,
      isTrainee:
        position.toLowerCase().includes("trainee") ||
        (position.toLowerCase().includes("ga") && position.length < 5),
      isLeader:
        !position.toLowerCase().includes("trainee") &&
        (!position.toLowerCase().includes("ga") || position.length >= 5),
    };
  });
}

async function fetchDashboardDataWithSql(mitarbeiterId) {
  const results = await fetchBulkDashboardData([mitarbeiterId]);
  return results[0] || {};
}

function isUserLeader(user) {
  if (!user || !user.Karrierestufe) return false;

  const stage = db.karriereplan.find(p => p.Stufe === user.Karrierestufe);
  
  // Wenn die Stufe nicht im Karriereplan gefunden wird oder keine Hierarchie hat, ist es keine Führungskraft.
  if (!stage || typeof stage.Hierarchie !== 'number') {
      return false;
  }

  // Eine Führungskraft ist jeder mit Hierarchie-Level von JGST (Level 3) oder höher.
  // Trainees, GAs und T-Stufen haben niedrigere Level und werden hier korrekt ausgeschlossen.
  const JUNIOR_GST_HIERARCHIE_LEVEL = 3; 
  return stage.Hierarchie >= JUNIOR_GST_HIERARCHIE_LEVEL;
}

function buildHierarchy() {
  if (HIERARCHY_CACHE) return HIERARCHY_CACHE;

  const hierarchy = {};
  const nameToIdMap = {};
  const allUsers = db.mitarbeiter;

  allUsers.forEach((u) => {
    if (u._id) {
      hierarchy[u._id] = { user: u, children: [] };
      if (u.Name) nameToIdMap[u.Name] = u._id;
    }
  });

  allUsers.forEach((u) => {
    const userName = u.Name || "Unbekannt";
    const werberValue = u.Werber; // Benutze die normalisierte 'Werber' Eigenschaft

    if (!werberValue) return; // Mitarbeiter hat keinen Werber

    let managerId = null;

    if (hierarchy[werberValue]) {
      // Fall 1: Werber ist eine gültige _id
      managerId = werberValue;
    } else if (nameToIdMap[werberValue]) {
      // Fall 2: Werber ist ein Name (als Fallback)
      managerId = nameToIdMap[werberValue];
    }

    if (managerId && hierarchy[managerId]) {
      hierarchy[managerId].children.push(u._id);
    }
  });

  HIERARCHY_CACHE = hierarchy;
  return hierarchy;
}

function getSubordinates(leaderId, type) {
  // 'gruppe' or 'struktur'
  const leader = findRowById("mitarbeiter", leaderId);
  if (!leader) return [];

  const hierarchy = buildHierarchy();
  const subordinates = [];

  if (type === "gruppe") {
    // NEU: Zeitreise-Filter
    if (timeTravelDate) {
      const leaderStartDate = new Date(leader.Startdatum);
      if (leaderStartDate > timeTravelDate) return []; // Wenn der Leiter selbst noch nicht da war, hat er keine Gruppe.
    }
    const queue = [...(hierarchy[leaderId]?.children || [])];
    const visited = new Set(queue);
    while (queue.length > 0) {
      const currentId = queue.shift();
      const user = findRowById("mitarbeiter", currentId);
      if (!user) continue;

      // NEU: Zeitreise-Filter
      if (timeTravelDate && user.Startdatum) {
        const userStartDate = new Date(user.Startdatum);
        if (userStartDate > timeTravelDate) continue; // Mitarbeiter war zu dem Zeitpunkt noch nicht da.
      }

      if (!isUserLeader(user)) {
        // Ist ein Trainee
        subordinates.push(user);
        const node = hierarchy[currentId];
        if (node) {
          node.children.forEach((childId) => {
            if (!visited.has(childId)) {
              queue.push(childId);
              visited.add(childId);
            }
          });
        }
      }
      // Wenn es eine Führungskraft ist, wird der Pfad hier nicht weiter verfolgt.
    }
  } else if (type === "struktur") {
    const leaderHierarchyLevel =
      db.karriereplan.find((k) => k.Stufe === leader.Karrierestufe)
        ?.Hierarchie || 99;
    
    // NEU: Zeitreise-Filter
    if (timeTravelDate) {
      const leaderStartDate = new Date(leader.Startdatum);
      if (leaderStartDate > timeTravelDate) return []; // Wenn der Leiter selbst noch nicht da war, hat er keine Struktur.
    }
    const queue = [...(hierarchy[leaderId]?.children || [])];
    const visited = new Set(queue);

    while (queue.length > 0) {
      const currentId = queue.shift();
      const user = findRowById("mitarbeiter", currentId);
      if (!user) continue;

      // NEU: Zeitreise-Filter
      if (timeTravelDate && user.Startdatum) {
        const userStartDate = new Date(user.Startdatum);
        if (userStartDate > timeTravelDate) continue; // Mitarbeiter war zu dem Zeitpunkt noch nicht da.
      }

      // Nur Führungskräfte für die Strukturansicht berücksichtigen
      if (isUserLeader(user)) {
        const userHierarchyLevel =
          db.karriereplan.find((k) => k.Stufe === user.Karrierestufe)
            ?.Hierarchie || 0;

        // Füge den Benutzer hinzu, wenn seine Hierarchiestufe strikt niedriger ist als die des Betrachters.
        // Dies behandelt den "Gleichstand"-Fall (z.B. GST unter GST).
        if (userHierarchyLevel < leaderHierarchyLevel) {
          subordinates.push(user);
        }
      }

      // Immer die gesamte Struktur durchlaufen, um alle relevanten Führungskräfte in der Downline zu finden,
      // auch wenn der aktuelle Benutzer nicht hinzugefügt wurde.
      const node = hierarchy[currentId];
      if (node) {
        node.children.forEach((childId) => {
          if (!visited.has(childId)) {
            queue.push(childId);
            visited.add(childId);
          }
        });
      }
    }
  }

  return subordinates.filter(m => m.Status !== 'Ausgeschieden');
}

function getAllSubordinatesRecursive(leaderId, hierarchy = buildHierarchy()) {const subordinates = [];
  // NEU: Zeitreise-Filter
  const leader = findRowById("mitarbeiter", leaderId);
  if (timeTravelDate && leader && leader.Startdatum) {
    const leaderStartDate = new Date(leader.Startdatum);
    if (leaderStartDate > timeTravelDate) return [];
  }

  const queue = [...(hierarchy[leaderId]?.children || [])]; // Use provided hierarchy
  const visited = new Set(queue);

  while (queue.length > 0) {
    const currentId = queue.shift();
    const current = hierarchy[currentId];
    if (!current) continue;

    // NEU: Zeitreise-Filter
    if (timeTravelDate && current.user.Startdatum) {
      const userStartDate = new Date(current.user.Startdatum);
      if (userStartDate > timeTravelDate) continue;
    }

    subordinates.push(current.user);
    current.children.forEach((childId) => {
      if (!visited.has(childId)) {
        queue.push(childId);
        visited.add(childId);
      }
    });
  }
  return subordinates.filter(m => m.Status !== 'Ausgeschieden');
}

async function calculateGroupOrStructureData(
  leaderId,
  type = "gruppe",
  fullDataStore // This parameter contains pre-fetched data including earnings.
) {
  const leaderUser = findRowById("mitarbeiter", leaderId);
  if (!leaderUser) return { members: [] };

  const subordinates = (type === 'gruppe') ? getSubordinates(leaderId, "gruppe") : getAllSubordinatesRecursive(leaderId);
  const membersForCalculation = [leaderUser, ...subordinates];
  const memberIdsForCalc = membersForCalculation.map(m => m._id);

  // KORREKTUR: Anstatt die Daten neu zu laden (was die Verdienste verlieren würde),
  // verwenden wir den `fullDataStore`, der bereits alle benötigten Daten inklusive Verdienste enthält.
  const dataForCalc = fullDataStore.filter(d => new Set(memberIdsForCalc).has(d.id));

  // Die Summen für die Gruppe berechnen.
  const aggregatedData = dataForCalc.reduce((acc, member) => {
      acc.ehGoal += (member.ehGoal || 0);
      acc.ehCurrent += (member.ehCurrent || 0);
      // KORREKTUR: Ziel-Verdienst wird jetzt korrekt übergeben
      acc.etGoal += (member.etGoal || 0);
      acc.etCurrent += (member.etCurrent || 0);
      acc.atGoal += (member.atGoal || 0);
      acc.atCurrent += (member.atCurrent || 0);
      acc.atVereinbart += (member.atVereinbart || 0);
      acc.outstandingAppointmentsCount += (member.outstandingAppointmentsCount || 0);
      return acc;
  }, {
      ehGoal: 0, ehCurrent: 0, etGoal: 0, etCurrent: 0,
      atGoal: 0, atCurrent: 0, atVereinbart: 0, outstandingAppointmentsCount: 0
  });

  // Der Gesamtverdienst der Gruppe/Struktur ist der Verdienst der Führungskraft,
  // da dieser bereits die Differenzprovisionen für die jeweilige Downline enthält.
  const leaderData = dataForCalc.find((d) => d.id === leaderId);
  const totalEarnings = leaderData
    ? leaderData.earnings
    : { personal: 0, group: 0, structure: 0 };

  // NEU: Ziel-Verdienst durchreichen
  const totalTargetEarnings = leaderData
    ? leaderData.targetEarnings
    : { personal: 0, group: 0, structure: 0 };

  // KORREKTUR: Die `members`-Eigenschaft muss die Daten der unterstellten Mitarbeiter enthalten,
  // damit die aufrufende Funktion (z.B. renderTeamMemberCards) darauf zugreifen kann.
  // Für die "Gesamtansicht" (die `calculateGesamtansichtData` aufruft) wollen wir die unterstellten
  let memberData;
  const cacheKey = `subordinate-data-${leaderId}-${type}`;

  if (type === 'struktur' && fullDataStore) { // KORREKTUR: Stelle sicher, dass fullDataStore vorhanden ist.
      const subordinateLeaders = subordinates.filter(isUserLeader);
      const subordinateLeaderIds = subordinateLeaders.map(leader => leader._id);
      
      // OPTIMIERUNG: Anstatt für jede FK einzeln die Gruppendaten zu berechnen,
      // filtern wir die benötigten Daten aus dem `fullDataStore` und berechnen die Gruppen im Frontend.
      // NEU: Wir holen auch die Daten der Unter-Untergebenen (Enkelkinder) für den Cache.
      const allGroupMemberIds = new Set(); // IDs der FKs und ihrer direkten Teams
      const allGrandchildIds = new Set(); // IDs der Teams der unterstellten FKs

      subordinateLeaderIds.forEach(subLeaderId => {
          allGroupMemberIds.add(subLeaderId);
          const groupMembers = getSubordinates(subLeaderId, 'gruppe');
          groupMembers.forEach(member => allGroupMemberIds.add(member._id));

          // Sammle die IDs der Untergebenen der untergebenen FKs für den Cache
          const grandchildren = getSubordinates(subLeaderId, 'gruppe');
          grandchildren.forEach(gc => allGrandchildIds.add(gc._id));
      });

      // KORREKTUR: Nicht neu laden, sondern den bereits angereicherten `fullDataStore` verwenden.
      const groupDataForDisplay = fullDataStore.filter(d => allGroupMemberIds.has(d.id));

      memberData = subordinateLeaders.map(leader => {
          const groupMembers = [leader, ...getSubordinates(leader._id, 'gruppe')];
          const groupMemberIds = new Set(groupMembers.map(m => m._id));
          
          const groupData = groupDataForDisplay.filter(d => groupMemberIds.has(d.id));
          
          const aggregatedGroupData = groupData.reduce((acc, member) => {
              acc.ehGoal += (member.ehGoal || 0); // KORREKTUR: ehGoal wurde fälschlicherweise nicht aggregiert
              acc.ehCurrent += (member.ehCurrent || 0);
              acc.etGoal += (member.etGoal || 0);
              acc.etCurrent += (member.etCurrent || 0);
              acc.atGoal += (member.atGoal || 0);
              acc.atCurrent += (member.atCurrent || 0);
              acc.atVereinbart += (member.atVereinbart || 0);
              acc.outstandingAppointmentsCount += (member.outstandingAppointmentsCount || 0);
              // Die 'earnings' werden pro Karte aus den Daten der jeweiligen FK geholt
              if (member.id === leader._id) {
                  acc.earnings = member.earnings;
              }
              return acc;
          }, { ehGoal: 0, ehCurrent: 0, etGoal: 0, etCurrent: 0, atGoal: 0, atCurrent: 0, atVereinbart: 0, earnings: { personal: 0, group: 0, structure: 0 }, outstandingAppointmentsCount: 0 });
          
          // NEU: Füge die FK selbst zur Mitgliederliste hinzu, damit sie beim Ausklappen erscheint.
          const leaderDataForCard = groupDataForDisplay.find(d => d.id === leader._id);
          return { ...aggregatedGroupData, id: leader._id, name: leader.Name, position: leader.Karrierestufe, originalPosition: leader.Karrierestufe, leaderName: leader.Name, members: [leaderDataForCard, ...groupDataForDisplay.filter(d => groupMemberIds.has(d.id) && d.id !== leader._id)] };
      });

      // NEU: Lade und cache die Daten der "Enkelkinder" im Hintergrund.
      if (allGrandchildIds.size > 0) {
          fetchBulkDashboardData(Array.from(allGrandchildIds))
              .then(grandchildData => saveToCache(`subordinate-data-${leaderId}-grandchildren`, grandchildData));
      }
  } else { // 'gruppe' (für die Gruppenansicht oder die unterste Ebene der Gesamtansicht)
      memberData = dataForCalc.filter(d =>
          new Set(subordinates.map(m => m._id)).has(d.id)
      );
  }

  return {
    id: leaderId, // KORREKTUR: Füge die ID der Führungskraft zum Ergebnisobjekt hinzu.
    ehGoal: aggregatedData.ehGoal,
    ehCurrent: aggregatedData.ehCurrent,
    etGoal: aggregatedData.etGoal,
    etCurrent: aggregatedData.etCurrent,
    atGoal: aggregatedData.atGoal,
    atCurrent: aggregatedData.atCurrent,
    atVereinbart: aggregatedData.atVereinbart,
    outstandingAppointmentsCount: aggregatedData.outstandingAppointmentsCount,
    targetEarnings: totalTargetEarnings,
    earnings: totalEarnings,
    members: memberData,
  };
}

async function getSubordinateDataWithCache(leaderId) {
    const cacheKey = `subordinate-data-${leaderId}-grandchildren`;
    const cachedData = loadFromCache(cacheKey, 60); // Cache für 60 Minuten
    if (cachedData) {
        return cachedData;
    }

    // Fallback: Wenn nicht im Cache, lade die Daten frisch.
    const subordinates = getSubordinates(leaderId, 'gruppe');
    if (subordinates.length === 0) return [];

    const subordinateIds = subordinates.map(s => s._id);
    const subordinateData = await fetchBulkDashboardData(subordinateIds);
    return subordinateData;
}

async function calculateGesamtansichtData() {
  const führungskräfte = db.mitarbeiter.filter(
    (m) => m.Karrierestufe && !m.Karrierestufe.toLowerCase().includes("trainee") && m.Status !== 'Ausgeschieden'
  );
  const geschäftsstelleRows = db.mitarbeiter.filter(
    (m) => m.Name && m.Name.toLowerCase().startsWith("geschäftsstelle")
  );
  const allMemberIds = new Set([
    ...führungskräfte.map((fk) => fk._id),
    ...geschäftsstelleRows.map((gs) => gs._id),
  ]);

  // NEU: Sammle IDs aller Untergebenen aller Führungskräfte für einen einzigen, großen API-Aufruf.
  const allSubordinateIds = new Set();
  führungskräfte.forEach(fk => {
      const subordinates = getSubordinates(fk._id, 'gruppe');
      subordinates.forEach(sub => allSubordinateIds.add(sub._id));
  });
  allSubordinateIds.forEach(id => allMemberIds.add(id)); // Füge sie zu den Haupt-IDs hinzu

  const { startDate, endDate } = getMonthlyCycleDates();
  const [allMemberData, earningsMap] = await Promise.all([
    fetchBulkDashboardData(Array.from(allMemberIds)),
    calculateAllStructureEarnings(Array.from(allMemberIds), startDate, endDate),
  ]);
  const targetEarningsMap = await calculateAllStructureTargetEarnings(Array.from(allMemberIds), allMemberData);

  // KORREKTUR: Die Deklaration von augmentedMemberData wurde verschoben, um den "Cannot declare a const variable twice" Fehler zu beheben.
  const augmentedMemberData = allMemberData.map((data) => ({
    ...data,
    earnings: earningsMap[data.id] || { personal: 0, group: 0, structure: 0 },
    targetEarnings: targetEarningsMap[data.id] || { personal: 0, group: 0, structure: 0 },
  }));

  // KORREKTUR: Dieser Block muss nach der Deklaration von augmentedMemberData kommen.
  führungskräfte.forEach(fk => {
      const subordinates = getSubordinates(fk._id, 'gruppe');
      const subordinateIds = new Set(subordinates.map(s => s._id));
      const dataForCache = augmentedMemberData.filter(d => subordinateIds.has(d.id));
      saveToCache(`subordinate-data-${fk._id}-grandchildren`, dataForCache);
  });


  // OPTIMIERUNG: Anstatt `calculateGroupOrStructureData` für jede FK einzeln aufzurufen,
  // berechnen wir die Gruppendaten direkt aus dem bereits geladenen `augmentedMemberData`.
  const allGroupData = führungskräfte.map(leader => {
      const groupMembers = [leader, ...getSubordinates(leader._id, 'gruppe')];
      const groupMemberIds = new Set(groupMembers.map(m => m._id));
      
      const groupDataForCalc = augmentedMemberData.filter(d => groupMemberIds.has(d.id));
      
      const aggregatedGroupData = groupDataForCalc.reduce((acc, member) => {
          acc.ehGoal += (member.ehGoal || 0);
          acc.ehCurrent += (member.ehCurrent || 0);
          acc.etGoal += (member.etGoal || 0);
          acc.etCurrent += (member.etCurrent || 0);
          acc.atGoal += (member.atGoal || 0);
          acc.atCurrent += (member.atCurrent || 0);
          acc.atVereinbart += (member.atVereinbart || 0);
          acc.outstandingAppointmentsCount += (member.outstandingAppointmentsCount || 0);
          return acc;
      }, { ehGoal: 0, ehCurrent: 0, etGoal: 0, etCurrent: 0, atGoal: 0, atCurrent: 0, atVereinbart: 0, outstandingAppointmentsCount: 0 });

      const leaderData = augmentedMemberData.find(d => d.id === leader._id);
      return { ...aggregatedGroupData, id: leader._id, earnings: leaderData?.earnings };
  });


  const totalData = allGroupData.reduce((acc, group) => {
      acc.ehGoal += group.ehGoal || 0;
      acc.ehCurrent += group.ehCurrent || 0;
      acc.etGoal += group.etGoal || 0;
      acc.etCurrent += group.etCurrent || 0;
      acc.atGoal += group.atGoal || 0;
      acc.atCurrent += group.atCurrent || 0;
      acc.atVereinbart += group.atVereinbart || 0;
      acc.earnings += group.earnings?.group || 0;
      return acc;
  }, { ehGoal: 0, ehCurrent: 0, etGoal: 0, etCurrent: 0, atGoal: 0, atCurrent: 0, atVereinbart: 0, earnings: 0 });

  // KORREKTUR: Die `members` Eigenschaft von `totalData` sollte die Daten der Führungskräfte selbst enthalten,
  // angereichert mit ihren jeweiligen Gruppensummen. Die `members` Eigenschaft *innerhalb* jedes
  // Führungskraft-Objekts enthält dann die Daten ihrer unterstellten Mitarbeiter.
  totalData.members = allGroupData.map(groupData => {
    const leader = führungskräfte.find(fk => fk._id === groupData.id);
    if (!leader) return null;

    return {
        ...groupData, // Enthält bereits ehGoal, ehCurrent, etc. für die Gruppe UND die 'members' (Untergebene)
        id: leader._id,
        name: leader.Name,
        position: leader.Karrierestufe,
    };
  }).filter(Boolean); // Entfernt null-Einträge, falls ein Leader nicht gefunden wurde.

  totalData.earnings = totalData.members.reduce(
    (sum, m) => sum + (m.earnings?.structure || 0),
    0
  );
  totalData.targetEarnings = totalData.members.reduce(
    (sum, m) => sum + (m.targetEarnings?.structure || 0),
    0
  );
  return totalData;
}

function drawSegmentDividers() {
  const { startDate, endDate } = getMonthlyCycleDates();
  clearChildren(dom.segmentDividersEh);
  const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const totalWeeks = Math.ceil(totalDays / 7);

  for (let i = 1; i < totalWeeks; i++) {
    const angle = i * (360 / totalWeeks);
    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );

    const innerRadius = 35;
    const strokeWidth = 4;
    const innerEdgeRadius = innerRadius - strokeWidth / 2;
    const outerEdgeRadius = innerRadius + strokeWidth / 2;

    const x1 = 50 + innerEdgeRadius * Math.cos((angle * Math.PI) / 180);
    const y1 = 50 + innerEdgeRadius * Math.sin((angle * Math.PI) / 180);
    const x2 = 50 + outerEdgeRadius * Math.cos((angle * Math.PI) / 180);
    const y2 = 50 + outerEdgeRadius * Math.sin((angle * Math.PI) / 180);

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);

    dom.segmentDividersEh.appendChild(line);
  }
}

// --- UI FUNKTIONEN ---
function updateWeeklyProgress() {
            const { startDate, endDate } = getMonthlyCycleDates();
            const today = new Date();
            clearChildren(dom.weeklyProgressContainer);

            const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
            const daysInAWeek = 7;
            const totalWeeks = Math.ceil(totalDays / daysInAWeek);
            const dateOptions = { day: '2-digit', month: '2-digit' };

            const createDivider = (left) => {
                const d = document.createElement('div');
                d.className = 'start-end-divider'; d.style.left = left;
                dom.weeklyProgressContainer.appendChild(d);
            };
            const createLabel = (left, text, transform) => {
                const l = document.createElement('div');
                l.className = 'centered-date-label'; l.style.left = left;
                l.style.transform = transform; l.textContent = text;
                dom.weeklyProgressContainer.appendChild(l);
            };
            
            createDivider('0%');
            createLabel('0%', startDate.toLocaleDateString('de-DE', dateOptions), 'translateX(-50%)');

            for (let i = 0; i < totalWeeks; i++) {
                const weekStart = new Date(startDate.getTime() + i * daysInAWeek * 24 * 60 * 60 * 1000);
                const weekEnd = new Date(weekStart.getTime() + daysInAWeek * 24 * 60 * 60 * 1000);
                let progress = 0;
                if (today >= weekEnd) progress = 100;
                else if (today >= weekStart && today < weekEnd) {
                    const daysPassed = (today - weekStart) / (1000 * 60 * 60 * 24);
                    progress = (daysPassed / daysInAWeek) * 100;
                }
                const weekDiv = document.createElement('div');
                weekDiv.className = 'flex-1 h-full relative p-2 flex flex-col items-center z-20';
                weekDiv.innerHTML = `<div class="w-full bg-skt-grey-medium h-2 rounded-full overflow-hidden"><div class="h-full bg-skt-green-accent rounded-full transition-all duration-500" style="width: ${Math.min(progress, 100)}%;"></div></div>`;
                dom.weeklyProgressContainer.appendChild(weekDiv);
            }

            const weeksDivs = dom.weeklyProgressContainer.querySelectorAll('.flex-1');
            weeksDivs.forEach((div, i) => {
                if (i === weeksDivs.length - 1) return;
                const pos = `${(i + 1) * (100 / weeksDivs.length)}%`;
                const weekDivider = document.createElement('div');
                weekDivider.className = 'week-divider'; weekDivider.style.left = pos;
                dom.weeklyProgressContainer.appendChild(weekDivider);
                const wednesday = new Date(startDate.getTime() + i * daysInAWeek * 24 * 60 * 60 * 1000);
                wednesday.setDate(wednesday.getDate() + (3 - wednesday.getDay() + 7) % 7);
                createLabel(pos, wednesday.toLocaleDateString('de-DE', dateOptions), 'translateX(-50%)');
            });
            
            const endDivider = document.createElement('div');
            endDivider.className = 'start-end-divider'; endDivider.style.right = '0%';
            dom.weeklyProgressContainer.appendChild(endDivider);
            createLabel('100%', endDate.toLocaleDateString('de-DE', dateOptions), 'translateX(-50%)');
        }

 function updateHeaderAnimation(data) {
     const videoContainer = document.getElementById('header-animation-container');
     // KORREKTUR: Führe die Funktion nur aus, wenn der Video-Container sichtbar ist (d.h. nicht auf Mobilgeräten).
     if (!videoContainer || videoContainer.offsetParent === null) {
        return;
     }
     const video = document.getElementById('header-animation-video');
     const source = document.getElementById('header-animation-source');
     if (!video || !source) return;
     let videoSrc = './Normal.mp4'; // Standard-Video
     const shouldLoop = false; // Kein Video soll sich wiederholen.
 
     const ehCurrent = data.ehCurrent || 0;
     const ehGoal = data.ehGoal || 0;
     const etCurrent = data.etCurrent || 0;
     const etGoal = data.etGoal || 0;
 
     // NEU: EH-Soll für den aktuellen Tag berechnen
     const { startDate, endDate } = getMonthlyCycleDates();
     const today = getCurrentDate();
     const totalDaysInCycle = (endDate - startDate) / (1000 * 60 * 60 * 24);
     const daysPassedInCycle = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
     const timeElapsedPercentage = totalDaysInCycle > 0 ? (daysPassedInCycle / totalDaysInCycle) * 100 : 0;
     const ehSoll = Math.round((ehGoal || 0) * (timeElapsedPercentage / 100));
 
     // Logik für die Videoauswahl mit korrekter Priorisierung
     // Priorität 1 (höchste): EH-Soll für den Tag erreicht
     if (ehGoal > 0 && ehCurrent >= ehSoll) {
         videoSrc = './Pokal.mp4';
     } 
     // Priorität 2: EH-Ziel < 30% (überschreibt ET-Bedingung)
     else if (ehGoal > 0 && (ehCurrent / ehGoal) < 0.3) {
         videoSrc = './EHbitte.mp4';
     } 
     // Priorität 3: ET-Ziel < 30%
     else if (etGoal > 0 && (etCurrent / etGoal) < 0.3) {
         videoSrc = './ETswanted.mp4';
     }
 
     // NEU: Dynamische Zuweisung der Filter-Klassen
     video.classList.remove('video-filter-normal', 'video-filter-eh-et', 'video-filter-pokal');
     if (videoSrc === './Normal.mp4') { video.classList.add('video-filter-normal'); } 
     else if (videoSrc === './EHbitte.mp4' || videoSrc === './ETswanted.mp4') { video.classList.add('video-filter-eh-et'); } 
     else if (videoSrc === './Pokal.mp4') { video.classList.add('video-filter-pokal'); }
 
     video.loop = shouldLoop;
     if (source.getAttribute('src') !== videoSrc) {
         source.setAttribute('src', videoSrc);
         video.load();
     }
 }
function updateMonthlyPlanningView(data) {
  updateWeeklyProgress();

  // Gemeinsame Zeitberechnung für die Soll-Werte
  const { startDate, endDate } = getMonthlyCycleDates();
  const today = getCurrentDate();
  const totalDaysInCycle = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const daysPassedInCycle = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
  const timeElapsedPercentage = totalDaysInCycle > 0 ? (daysPassedInCycle / totalDaysInCycle) * 100 : 0;
  
  if (isMoneyView) {
    let earningsToShow = 0;
    let earningsGoal = 0;

    if (data.earnings) {
      if (currentPlanningView === "team" && !isSuperuserView) {
        earningsToShow = (data.earnings.personal || 0) + (data.earnings.group || 0);
        earningsGoal = (data.targetEarnings.personal || 0) + (data.targetEarnings.group || 0);
      } else if (isSuperuserView) {
        earningsToShow = data.earnings;
        earningsGoal = data.targetEarnings;
      } else if (currentPlanningView === "personal") {
        earningsToShow = data.earnings.personal;
        earningsGoal = data.targetEarnings.personal;
      } else if (currentPlanningView === "struktur") {
        earningsToShow = data.earnings.structure;
        earningsGoal = data.targetEarnings.structure;
      }
    }

    // NEU: 15% Abzug auf alle angezeigten Euro-Beträge anwenden
    animateValue(dom.ehCenterCurrent, 0, (earningsToShow || 0) * 0.85, 1000, true);
    dom.ehCenterGoal.textContent = ((earningsGoal || 0) * 0.85).toLocaleString("de-DE", { maximumFractionDigits: 0 });
    dom.ehCenterUnitLabel.textContent = "Ist €";
    dom.ehSollUnitLabel.textContent = "Soll €";

    // Die prozentuale Erreichung bleibt gleich, da Ist und Soll gleichermaßen reduziert werden.
    const moneyPercentage = earningsGoal > 0 ? (earningsToShow / earningsGoal) * 100 : 0;
    updateCircleProgress(dom.ehProgressCircle, 45, moneyPercentage);

    updateCircleProgress(dom.prognosisCircleEh, 35, timeElapsedPercentage);

    const sollValue = Math.round(earningsGoal * (timeElapsedPercentage / 100));
    animateValue(dom.ehSollValue, 0, sollValue * 0.85, 1000, true);

    // Segmente in Geld-Ansicht ausblenden, da sie auf Wochen basieren
    clearChildren(dom.segmentDividersEh);
  } else {
    animateValue(dom.ehCenterCurrent, 0, data.ehCurrent || 0, 1000);
    dom.ehCenterGoal.textContent = (data.ehGoal || 0).toLocaleString("de-DE", {
      maximumFractionDigits: 0,
    });
    dom.ehCenterUnitLabel.textContent = "Ist Einheiten";
    dom.ehSollUnitLabel.textContent = "Soll Einheiten";

    const ehPercentage =
      data.ehGoal > 0 ? (data.ehCurrent / data.ehGoal) * 100 : 0;
    updateCircleProgress(dom.ehProgressCircle, 45, ehPercentage);

    updateCircleProgress(dom.prognosisCircleEh, 35, timeElapsedPercentage);

    const sollValue = Math.round((data.ehGoal || 0) * (timeElapsedPercentage / 100));
    animateValue(dom.ehSollValue, 0, sollValue, 1000);
    drawSegmentDividers();
  }

  // UPDATE: Zeitbasiertes Soll für Analysetermine mit 50% Minimum berechnen
  const effectiveTimePercentageForAT = Math.max(50, timeElapsedPercentage);
  const atSollTimeBased = Math.round((data.atGoal || 0) * (effectiveTimePercentageForAT / 100));

  dom.appointmentsText.textContent = `${data.atCurrent || 0} / ${data.atVereinbart || 0} / ${atSollTimeBased}`;
  const vereinbartPercent =
    data.atGoal > 0 ? (data.atVereinbart / data.atGoal) * 100 : 0;
  const gehaltenPercent =
    data.atGoal > 0 ? (data.atCurrent / data.atGoal) * 100 : 0;
  dom.appointmentsVereinbartBar.style.width = `${Math.min(
    vereinbartPercent,
    100
  )}%`;
  dom.appointmentsGehaltenBar.style.width = `${Math.min(
    gehaltenPercent,
    100
  )}%`;
  animateValue(dom.etCurrentDisplay, 0, data.etCurrent || 0, 1000, false);
  dom.etGoalDisplay.textContent = (data.etGoal || 0).toLocaleString("de-DE");
  const etPercent = data.etGoal > 0 ? (data.etCurrent / data.etGoal) * 100 : 0;
  if (dom.interviewsProgressBar)
    dom.interviewsProgressBar.style.width = `${Math.min(etPercent, 100)}%`;

}

function updateEmployeeCareerView() {
  const user = currentlyViewedUserData;
  const { totalCurrentEh, recruitedEmployees, position } = personalData;
  const promotionRaceDate = user.Befoerderungsdatum;

  animateValue(dom.currentEhDisplay, 0, totalCurrentEh, 1500);

  const isTrainee = position && position.toLowerCase().includes('trainee');
  const isGst = position && position.toLowerCase().includes('geschäftsstellenleiter');

  // KORREKTUR: Tier-Karten für GST ausblenden
  if (dom.tierCardsContainer) {
    dom.tierCardsContainer.classList.toggle('hidden', isGst);
  }

  // Sonderlogik für Trainee-Rennen zum GST
  if (isTrainee && promotionRaceDate) {
      const targetDate = new Date(promotionRaceDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      dom.nextMilestone.innerHTML = `Chancenseminar am <span class="text-skt-blue font-semibold">${targetDate}</span>`;
      const ehNeeded = 4000; // Festes Ziel für GST
      const progressEh = ehNeeded > 0 ? (totalCurrentEh / ehNeeded) * 100 : 0;
      dom.careerProgressPercentage.textContent = `${Math.min(progressEh, 100).toFixed(1)}%`;
      dom.progressToNextText.textContent = `Fortschritt zum GST`;
      updateCircleProgress(dom.fortschrittKreisKarriere, 40, progressEh);
      const maNeeded = 3;
      dom.nextCareerGoalLabel.textContent = 'Nächstes Karriereziel GST';
      dom.employeeCountDisplay.textContent = `${recruitedEmployees} / ${maNeeded} MA`;
      dom.employeeGoalStatus.textContent = `Zeit bis: ${targetDate}`;
      dom.employeeCountDisplay.classList.remove('hidden');
      dom.employeeSlotsContainer.classList.remove('hidden');
      dom.employeeGoalStatus.classList.remove('text-skt-red-accent', 'font-bold');
      dom.employeeGoalStatus.classList.add('text-skt-blue-light');
      clearChildren(dom.employeeSlotsContainer);
      for (let i = 0; i < maNeeded; i++) {
          const slot = document.createElement("div");
          slot.className = `employee-slot ${i < recruitedEmployees ? "filled" : ""}`;
          dom.employeeSlotsContainer.appendChild(slot);
      }
  } 
  // Sonderlogik für GST-Rennen zum BL
  else if (isGst && promotionRaceDate) {
      const targetDate = new Date(promotionRaceDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      dom.nextMilestone.innerHTML = `Ziel BL am <span class="text-skt-blue font-semibold">${targetDate}</span>`;
      const blStage = db.karriereplan.find(k => k.Stufe.toLowerCase().includes('bezirksleiter'));
      const ehNeeded = blStage ? blStage.Kriterium_EH : 12000; // Fallback
      const progressEh = ehNeeded > 0 ? (totalCurrentEh / ehNeeded) * 100 : 0;
      dom.careerProgressPercentage.textContent = `${Math.min(progressEh, 100).toFixed(1)}%`;
      dom.progressToNextText.textContent = `Fortschritt zum BL`;
      updateCircleProgress(dom.fortschrittKreisKarriere, 40, progressEh);
      const maNeeded = 6;
      dom.nextCareerGoalLabel.textContent = 'Nächstes Karriereziel BL';
      dom.employeeCountDisplay.textContent = `${recruitedEmployees} / ${maNeeded} MA`;
      dom.employeeGoalStatus.textContent = `Zeit bis: ${targetDate}`;
      dom.employeeCountDisplay.classList.remove('hidden');
      dom.employeeSlotsContainer.classList.remove('hidden');
      dom.employeeGoalStatus.classList.remove('text-skt-red-accent', 'font-bold');
      dom.employeeGoalStatus.classList.add('text-skt-blue-light');
      clearChildren(dom.employeeSlotsContainer);
      for (let i = 0; i < maNeeded; i++) {
          const slot = document.createElement("div");
          slot.className = `employee-slot ${i < recruitedEmployees ? "filled" : ""}`;
          dom.employeeSlotsContainer.appendChild(slot);
      }
  }
  // Standard-Logik
  else {
      dom.nextCareerGoalLabel.textContent = 'Nächstes Karriereziel';
      const currentStage = db.karriereplan.find((k) => k.Stufe === position);
      if (!currentStage) { console.error("Aktuelle Karrierestufe nicht im Karriereplan gefunden:", position); return; }
      const nextStage = db.karriereplan.filter((k) => k.Hierarchie > currentStage.Hierarchie).sort((a, b) => a.Hierarchie - b.Hierarchie)[0];
      if (nextStage) {
          let milestoneText = `Nächster Meilenstein: <span class="text-skt-blue font-semibold">${nextStage.Stufe}</span>`;
          dom.nextMilestone.innerHTML = milestoneText;
          const ehNeeded = nextStage.Kriterium_EH || 0;
          const progressEh = ehNeeded > 0 ? (totalCurrentEh / ehNeeded) * 100 : 0;
          dom.careerProgressPercentage.textContent = `${Math.min(progressEh, 100).toFixed(1)}%`;
          dom.progressToNextText.textContent = `Fortschritt zum ${nextStage.Stufe}`;
          updateCircleProgress(dom.fortschrittKreisKarriere, 40, progressEh);
          const maNeeded = nextStage.Kriterium_MA || 0;
          if (promotionRaceDate) {
              const targetDate = new Date(promotionRaceDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
              dom.employeeGoalStatus.textContent = `Zeit bis: ${targetDate}`;
              dom.employeeGoalStatus.classList.remove('text-skt-red-accent', 'font-bold');
              dom.employeeGoalStatus.classList.add('text-skt-blue-light');
              dom.employeeCountDisplay.textContent = `${recruitedEmployees} / ${maNeeded} MA`;
              dom.employeeCountDisplay.classList.remove('hidden');
              dom.employeeSlotsContainer.classList.remove('hidden');
              clearChildren(dom.employeeSlotsContainer);
              for (let i = 0; i < maNeeded; i++) {
                  const slot = document.createElement("div");
                  slot.className = `employee-slot ${i < recruitedEmployees ? "filled" : ""}`;
                  dom.employeeSlotsContainer.appendChild(slot);
              }
          } else {
              dom.employeeGoalStatus.textContent = `nächsten Karriere Schritt mit FK klären!`;
              dom.employeeGoalStatus.classList.remove('text-skt-blue-light');
              dom.employeeGoalStatus.classList.add('text-skt-red-accent', 'font-bold');
              dom.employeeCountDisplay.classList.add('hidden');
              dom.employeeSlotsContainer.classList.add('hidden');
              clearChildren(dom.employeeSlotsContainer);
          }
      } else {
          dom.nextMilestone.innerHTML = "Höchste Stufe erreicht!";
          dom.careerProgressPercentage.textContent = "100%";
          updateCircleProgress(dom.fortschrittKreisKarriere, 40, 100);
      }
  }

  const careerPlanTiers = db.karriereplan
    .filter(
      (p) =>
        p.Stufe &&
        (p.Stufe.toLowerCase().includes("trainee") ||
          p.Stufe.toLowerCase().includes("jgst"))
    )
    .sort((a, b) => a.Hierarchie - b.Hierarchie);
  let currentTierIndex = -1;
  for (let i = careerPlanTiers.length - 1; i >= 0; i--) {
    if (totalCurrentEh >= careerPlanTiers[i].Kriterium_EH) {
      currentTierIndex = i;
      break;
    }
  }
  dom.tierCards.forEach((card, i) => {
    if (i < careerPlanTiers.length) {
      card.querySelector("h3").textContent = careerPlanTiers[i].Stufe;
      card.querySelector("p").textContent = `${(
        careerPlanTiers[i].Kriterium_EH || 0
      ).toLocaleString("de-DE")} EH`;
      card.classList.toggle("active", i === currentTierIndex);
      let progress = 0;
      if (i < currentTierIndex) {
        progress = 100;
      } else if (i === currentTierIndex) {
        const tierStart = careerPlanTiers[i].Kriterium_EH || 0;
        const nextTierGoal =
          i + 1 < careerPlanTiers.length
            ? careerPlanTiers[i + 1].Kriterium_EH || 0
            : tierStart;
        if (nextTierGoal > tierStart) {
          progress =
            ((totalCurrentEh - tierStart) / (nextTierGoal - tierStart)) * 100;
        } else {
          progress = totalCurrentEh >= tierStart ? 100 : 0;
        }
      }
      dom.tierProgressBars[i].style.width = `${Math.min(progress, 100)}%`;
    }
  });
}

function updateLeadershipView() {
  if (currentPlanningView === "personal" && !isSuperuserView) {
    dom.leadershipView.classList.add("hidden");
    return;
  }
  dom.leadershipView.classList.remove("hidden");
  let data, title;
  if (isSuperuserView) {
    data = personalData;
    title = "Führungskräfte-Übersicht";
  } else if (currentPlanningView === "struktur") {
    data = structureData;
    title = "Struktur-Übersicht";
  } else {
    data = teamData;
    title = "Gruppen-Übersicht";
  }
  dom.leadershipViewTitle.textContent = title;

  // KORREKTUR: Füge eine Sicherheitsprüfung hinzu, um den Fehler abzufangen.
  // Stellt sicher, dass 'data' und 'data.members' existieren, bevor darauf zugegriffen wird.
  const members = data?.members || [];
  dom.leadershipViewCount.textContent = `Du hast ${members.length} aktive Mitarbeiter in deiner Gruppe.`;
  renderTeamMemberCards(members);

}

function renderTeamMemberCards(members) {
  clearChildren(dom.teamMembersContainer);
  clearChildren(dom.passiveMembersSection);
  dom.teamMembersContainer.className = "mt-6";
  if (!members || members.length === 0) {
    dom.teamMembersContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">Keine Mitarbeiter in dieser Ansicht.</p>`;
    return;
  }
  // KORREKTUR: Ein Mitarbeiter ist nur aktiv, wenn sein EH-Ziel > 0 ist.
  const activeMembers = members.filter((m) => (m.ehGoal || 0) > 0);
  const passiveMembers = members.filter((m) => !(m.ehGoal > 0));
  const { startDate, endDate } = getMonthlyCycleDates();
  const totalDaysInCycle = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const daysPassedInCycle = Math.max(
    0,
    (new Date() - startDate) / (1000 * 60 * 60 * 24)
  );
  if (currentLeadershipViewMode === "grid") {
    dom.teamMembersContainer.className =
      "mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
    activeMembers.forEach((member) => {
      const card = createMemberCardGrid(
        member,
        totalDaysInCycle,
        daysPassedInCycle
      );
      dom.teamMembersContainer.appendChild(card);
    });
  } else {
    dom.teamMembersContainer.className = "mt-6 space-y-4";
    activeMembers.forEach((member) => {
      const card = createMemberCardList(
        member,
        totalDaysInCycle,
        daysPassedInCycle
      );
      dom.teamMembersContainer.appendChild(card);
    });
  }
  if (passiveMembers.length > 0) {
    const details = document.createElement("details");
    details.className = "bg-white rounded-xl shadow-lg";
    const summary = document.createElement("summary");
    summary.className = "p-4 font-semibold text-skt-blue cursor-pointer flex justify-between items-center";
    summary.innerHTML = `
        <span>Passive Mitarbeiter (${passiveMembers.length}) anzeigen</span>
        <i class="fas fa-chevron-down transition-transform duration-300"></i>
    `;
    details.appendChild(summary);

    const container = document.createElement("div");
    // NEU: Scrollbar hinzufügen, wenn die Liste zu lang wird
    container.className = "p-4 pt-0 space-y-3 max-h-96 overflow-y-auto";

    passiveMembers.forEach((member) => {
      const passiveCard = document.createElement("div");
      passiveCard.className =
        "p-3 bg-skt-grey-light rounded-lg cursor-pointer hover:bg-gray-200 transition-colors";
      passiveCard.innerHTML = `<div><p class="font-bold text-skt-blue">${member.name}</p><p class="text-sm text-skt-blue-light">${member.position}</p></div>`;
      passiveCard.dataset.userid = member.id;
      passiveCard.addEventListener("click", (e) => {
        const userId = e.currentTarget.dataset.userid;
        if (userId) fetchAndRenderDashboard(userId);
      });
      container.appendChild(passiveCard);
    });
    details.appendChild(container);

    // Sorge dafür, dass sich der Pfeil dreht
    details.addEventListener('toggle', () => {
        const icon = summary.querySelector('.fa-chevron-down');
        if (icon) {
            icon.classList.toggle('rotate-180', details.open);
        }
    });
    dom.passiveMembersSection.appendChild(details);
  }
}

function createMemberCardGrid(member, totalDaysInCycle, daysPassedInCycle) {
    // NEU: Berechnungen für alle Fortschrittsbalken und die Soll-Markierung
    const timeElapsedPercentage = totalDaysInCycle > 0 ? (daysPassedInCycle / totalDaysInCycle) * 100 : 0;
    const atSollIndicatorPercentage = Math.max(50, timeElapsedPercentage); // NEU: AT-Soll-Indikator startet bei 50%
    
    // NEU: Eigene Soll-Berechnung für ET basierend auf dem 3-Wochen-Infoabend-Zyklus
    const today = getCurrentDate();
    const nextInfoDate = findNextInfoDateAfter(today);
    const previousInfoDate = new Date(nextInfoDate.getTime() - 21 * 24 * 60 * 60 * 1000);
    const totalDaysInETCycle = 21;
    const daysPassedInETCycle = (today.getTime() - previousInfoDate.getTime()) / (1000 * 60 * 60 * 24);
    const etTimeElapsedPercentage = Math.max(0, Math.min(100, (daysPassedInETCycle / totalDaysInETCycle) * 100));
    const ehPercentage = member.ehGoal > 0 ? (member.ehCurrent / member.ehGoal) * 100 : 0;
    const etPercentage = member.etGoal > 0 ? (member.etCurrent / member.etGoal * 100) : 0;
    const atPercentage = member.atGoal > 0 ? (member.atVereinbart / member.atGoal) * 100 : 0;
    const ehColorClass = getProgressColorClass(member.ehCurrent, member.ehGoal, totalDaysInCycle, daysPassedInCycle);
    // ENTFERNT: Prognose wird nicht mehr angezeigt.

    // NEU: Indikator für offene Statusänderungen
    let outstandingAppointmentsHtml = '';
    if (member.outstandingAppointmentsCount > 0) {
        outstandingAppointmentsHtml = `
            <div class="flex items-center gap-1 text-skt-red-accent font-semibold" data-tooltip="Anzahl der Termine in der Vergangenheit mit Status 'Ausgemacht'">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${member.outstandingAppointmentsCount}</span>
            </div>
        `;
    }
    const ehValue = isMoneyView ? (member.earnings?.structure || 0) * 0.85 : member.ehCurrent; // NEU: 15% Abzug
    const ehGoal = isMoneyView ? 0 : member.ehGoal;
    const ehUnit = isMoneyView ? "Verdienst" : "Einheiten";
    const ehDisplayValue = isMoneyView ?
        ehValue.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : // This part is for money view
        `${ehValue.toLocaleString("de-DE", {
            maximumFractionDigits: 0,
          })} / ${ehGoal.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg transition-shadow hover:shadow-xl flex flex-col';
    const summary = document.createElement('div');
    summary.className = 'p-4 cursor-pointer flex-grow';
    
    const pos = member.position || "";
    let positionHtml = '';
    if (pos && !pos.toLowerCase().includes("trainee")) {
        positionHtml = `<p class="text-sm text-skt-blue-light">${member.originalPosition || member.position}</p>`;
    }

    // KORREKTUR: Der Fortschrittskreis wird durch drei Fortschrittsbalken ersetzt.
    summary.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="min-w-0">
                <p class="font-bold text-skt-blue text-lg break-words">${member.leaderName || member.name}</p>
                ${positionHtml}
            </div>
            <div class="flex items-center space-x-3">
                 ${outstandingAppointmentsHtml}
                 <button data-userid="${member.id}" class="calendar-view-btn text-skt-blue-light hover:text-skt-blue-main transition-colors" title="Termine anzeigen"><i class="fas fa-calendar-alt"></i></button>
                 <i class="fas fa-chevron-down chevron-icon text-skt-blue-light"></i>
            </div>
        </div>
        
        <div class="mt-4 px-2 flex flex-col items-center space-y-4">
            <!-- EH Circle -->
            <div class="flex flex-col items-center justify-center">
                <div class="relative w-28 h-28">
                    <svg class="team-progress-circle w-full h-full" viewBox="0 0 100 100">
                        <circle class="bg-circle" cx="50" cy="50" r="40"></circle>
                        <circle class="progress-arc" cx="50" cy="50" r="40" style="stroke-dasharray: 251.2, 251.2; stroke-dashoffset: ${251.2 - (Math.min(ehPercentage, 100) / 100) * 251.2}; stroke: ${getProgressColorHex(member.ehCurrent, member.ehGoal, totalDaysInCycle, daysPassedInCycle)};"></circle>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span class="text-xl font-bold text-skt-blue">${member.ehCurrent.toLocaleString('de-DE', {maximumFractionDigits: 0})}</span>
                        <div class="h-px w-10 bg-skt-grey-medium my-0.5"></div>
                        <span class="text-sm text-skt-blue-light">${member.ehGoal.toLocaleString('de-DE', {maximumFractionDigits: 0})}</span>
                    </div>
                </div>
                <p class="text-xs text-skt-blue-light mt-1">${ehUnit}</p>
            </div>

            <!-- AT and ET Bars -->
            <div class="w-full space-y-4 flex flex-col justify-center">
                ${isMoneyView ? `
                    <div>
                        <p class="text-skt-blue-light text-xs">${ehUnit}</p>
                        <p class="font-semibold text-skt-blue text-lg">${ehDisplayValue}</p>
                    </div>
                ` : `
                <!-- AT Bar -->
                <div>
                    <div class="flex justify-between items-baseline text-xs">
                        <p class="text-skt-blue-light">AT Termine (Ausgem.)</p>
                        <p class="font-semibold text-skt-blue">${member.atVereinbart} / ${member.atGoal}</p>
                    </div>
                    <div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden mt-1 relative">
                        <div class="h-full bg-skt-yellow-accent" style="width: ${Math.min(atPercentage, 100)}%;"></div>
                        <div class="absolute top-[-2px] h-4 w-[2px] ml-[-1px] bg-skt-red-accent" style="left: ${atSollIndicatorPercentage}%;" data-tooltip="Soll-Fortschritt"></div>
                    </div>
                </div>
                <!-- ET Bar -->
                <div>
                    <div class="flex justify-between items-baseline text-xs">
                        <p class="text-skt-blue-light">ET Termine</p>
                        <p class="font-semibold text-skt-blue">${member.etCurrent} / ${member.etGoal}</p>
                    </div>
                    <div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden mt-1 relative">
                        <div class="h-full bg-skt-green-accent" style="width: ${Math.min(etPercentage, 100)}%;"></div>
                        <div class="absolute top-[-2px] h-4 w-[2px] ml-[-1px] bg-skt-red-accent" style="left: ${etTimeElapsedPercentage}%;" data-tooltip="Soll-Fortschritt"></div>
                    </div>
                </div>
                `}
            </div>
        </div>
    `;

    const details = document.createElement('div');
    details.className = 'team-member-details px-4';
    details.innerHTML = `
        <div class="details-grid grid grid-cols-1 gap-4">
            <div class="text-center">
                <p class="text-sm font-semibold text-skt-blue mb-1">Analysetermine</p>
                <p class="text-md font-bold text-skt-blue">${member.atCurrent} / ${member.atVereinbart} / ${member.atGoal}</p>
                <p class="text-xs text-gray-500 mb-2">Gehalten / Vereinbart / Soll</p>
                <div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden relative">
                    <div class="h-full bg-skt-blue-accent absolute top-0 left-0 transition-all duration-700 ease-out" style="width: ${Math.min(member.atGoal > 0 ? (member.atVereinbart / member.atGoal) * 100 : 0, 100)}%;"></div>
                    <div class="h-full bg-skt-green-accent absolute top-0 left-0 transition-all duration-700 ease-out" style="width: ${Math.min(member.atGoal > 0 ? (member.atCurrent / member.atGoal) * 100 : 0, 100)}%;"></div>
                </div>
            </div>
        </div>`;

    card.appendChild(summary);
    card.appendChild(details);
    
    // KORREKTUR: Die Ausklapp-Funktion nur für Führungskräfte aktivieren.
    // Trainees in der Gruppenansicht haben keine unterstellten Mitarbeiter, die angezeigt werden könnten.
    const isLeader = member.position && !member.position.toLowerCase().includes('trainee');
    summary.addEventListener('click', (e) => {
        if (e.target.closest('.calendar-view-btn')) return; // Klick auf Kalender-Button ignorieren
        if (isLeader && e.target.closest('.chevron-icon')) {
            details.classList.toggle('open');
            summary.classList.toggle('open');
            return;
        }
        // NEU: Wenn die aktuelle Ansicht 'struktur' ist, wechsle zur 'team'-Ansicht des angeklickten Mitarbeiters.
        if (currentPlanningView === 'struktur') {
            saveUiSetting('dashboardPlanningView', 'team');
            fetchAndRenderDashboard(member.id);
        } else {
            fetchAndRenderDashboard(member.id);
        }
    });
    const calendarBtnGrid = summary.querySelector('.calendar-view-btn');
    if (calendarBtnGrid) {
        calendarBtnGrid.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = e.currentTarget.dataset.userid;
            if (userId) {
                const clickedUser = findRowById("mitarbeiter", userId);
                if (!clickedUser) return;

                const isClickedUserLeader = isUserLeader(clickedUser);

                pendingAppointmentViewMode = 'table';
                pendingAppointmentScope = 'structure';

                if (isClickedUserLeader) {
                    pendingAppointmentGroupFilter = userId;
                    pendingAppointmentFilter = null;
                } else {
                    pendingAppointmentFilter = clickedUser.Name;
                    pendingAppointmentGroupFilter = null;
                }
                switchView('appointments');
            }
        });
    }

    if (!isLeader) {
        summary.querySelector('.chevron-icon').classList.add('hidden'); // Pfeil für Trainees ausblenden
    }

    // KORREKTUR: Logik zum Laden der Untergebenen nur für Führungskräfte hinzufügen.
    if (isLeader) {
        summary.addEventListener('click', async (e) => {
            if (e.target.closest('.switch-view-btn')) return;
            if (details.classList.contains('open') && !details.dataset.loaded) {
                await renderSubordinatesForLeader(member.id, details);
            }
        });
    }
    return card;
}

function createMemberCardList(member, totalDaysInCycle, daysPassedInCycle) {
    // ENTFERNT: Prognose wird nicht mehr angezeigt.
    
    // NEU: Indikator für offene Statusänderungen
    let outstandingAppointmentsHtml = '';
    if (member.outstandingAppointmentsCount > 0) {
        outstandingAppointmentsHtml = `
            <div class="flex items-center gap-1 text-skt-red-accent font-semibold" data-tooltip="Anzahl der Termine in der Vergangenheit mit Status 'Ausgemacht'">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${member.outstandingAppointmentsCount}</span>
            </div>
        `;
    }
    const etPercentage =
        member.etGoal > 0 ? (member.etCurrent / member.etGoal) * 100 : 0;

    const ehValue = isMoneyView ? (member.earnings?.structure || 0) * 0.85 : member.ehCurrent; // NEU: 15% Abzug
    const ehGoal = isMoneyView ? 0 : member.ehGoal;
    const ehUnit = isMoneyView ? "Verdienst" : "Einheiten (EH)";
    const ehDisplayValue = isMoneyView
        ? ehValue.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        })
        : ehValue.toLocaleString("de-DE", { maximumFractionDigits: 0 });
    const ehGoalDisplay = isMoneyView
        ? ""
        : `/ ${ehGoal.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;

    const ehPercentage =
        member.ehGoal > 0 ? (member.ehCurrent / member.ehGoal) * 100 : 0;
    const ehColorClass = getProgressColorClass(
        member.ehCurrent,
        member.ehGoal,
        totalDaysInCycle,
        daysPassedInCycle
    );
    const card = document.createElement("div");
    card.className =
        "bg-white rounded-xl shadow-lg transition-shadow hover:shadow-xl";
    const summary = document.createElement("div");
    summary.className = "p-4 cursor-pointer";
    const pos = member.position || "";
    const positionHtml =
        pos && !pos.toLowerCase().includes("trainee")
        ? `<p class="text-sm text-skt-blue-light">${
            member.originalPosition || member.position
            }</p>`
        : "";

    // NEU: Berechnungen für Soll-Markierung und AT-Balken
    const timeElapsedPercentage = totalDaysInCycle > 0 ? (daysPassedInCycle / totalDaysInCycle) * 100 : 0;
    const atSollIndicatorPercentage = Math.max(50, timeElapsedPercentage); // NEU: AT-Soll-Indikator startet bei 50%
    
    // NEU: Eigene Soll-Berechnung für ET basierend auf dem 3-Wochen-Infoabend-Zyklus
    const today = getCurrentDate();
    const nextInfoDate = findNextInfoDateAfter(today);
    const previousInfoDate = new Date(nextInfoDate.getTime() - 21 * 24 * 60 * 60 * 1000);
    const totalDaysInETCycle = 21;
    const daysPassedInETCycle = (today.getTime() - previousInfoDate.getTime()) / (1000 * 60 * 60 * 24);
    const etTimeElapsedPercentage = Math.max(0, Math.min(100, (daysPassedInETCycle / totalDaysInETCycle) * 100));
    const atPercentage = member.atGoal > 0 ? (member.atVereinbart / member.atGoal) * 100 : 0;

    summary.innerHTML = `<div class="flex justify-between items-start gap-2"><div class="min-w-0"><p class="font-bold text-skt-blue text-lg break-words">${
        member.leaderName || member.name
    }</p>${positionHtml}</div><div class="flex items-center space-x-3 flex-shrink-0">${outstandingAppointmentsHtml}<button data-userid="${member.id}" class="calendar-view-btn text-skt-blue-light hover:text-skt-blue-main transition-colors" title="Termine anzeigen"><i class="fas fa-calendar-alt"></i></button><i class="fas fa-chevron-down chevron-icon text-skt-blue-light"></i></div></div><div class="mt-2"><div class="flex justify-between items-baseline"><p class="text-xs text-skt-blue-light">${ehUnit}</p><p class="text-xs font-semibold text-skt-blue">${ehDisplayValue} ${ehGoalDisplay}</p></div>${
        !isMoneyView
        ? `<div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden mt-1 relative">
            <div class="h-full ${ehColorClass}" style="width: ${Math.min(ehPercentage, 100)}%;"></div>
            <div class="absolute top-[-2px] h-4 w-[2px] ml-[-1px] bg-skt-red-accent" style="left: ${timeElapsedPercentage}%;" data-tooltip="Soll-Fortschritt"></div>
           </div>`
        : ""
    }</div>
    <div class="mt-2">
        <div class="flex justify-between items-baseline">
            <p class="text-xs text-skt-blue-light">AT Termine (Ausgem.)</p>
            <p class="text-xs font-semibold text-skt-blue">${member.atVereinbart} / ${member.atGoal}</p>
        </div>
        <div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden mt-1 relative">
            <div class="h-full bg-skt-yellow-accent" style="width: ${Math.min(atPercentage, 100)}%;"></div>
            <div class="absolute top-[-2px] h-4 w-[2px] ml-[-1px] bg-skt-red-accent" style="left: ${atSollIndicatorPercentage}%;" data-tooltip="Soll-Fortschritt"></div>
        </div>
    </div><div class="mt-2"><div class="flex justify-between items-baseline"><p class="text-xs text-skt-blue-light">ET Termine</p><p class="text-xs font-semibold text-skt-blue">${
        member.etCurrent
    } / ${
        member.etGoal
    }</p></div><div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden mt-1 relative">
        <div class="h-full bg-skt-green-accent" style="width: ${Math.min(etPercentage, 100)}%;"></div>
        <div class="absolute top-[-2px] h-4 w-[2px] ml-[-1px] bg-skt-red-accent" style="left: ${etTimeElapsedPercentage}%;" data-tooltip="Soll-Fortschritt"></div>
    </div></div>`;
    const details = document.createElement("div");
    details.className = "team-member-details px-4";
    details.innerHTML = `<div class="details-grid grid grid-cols-1 gap-4"><div class="text-center"><p class="text-sm font-semibold text-skt-blue mb-1">Analysetermine</p><p class="text-md font-bold text-skt-blue">${
        member.atCurrent
    } / ${member.atVereinbart} / ${
        member.atGoal
    }</p><p class="text-xs text-gray-500 mb-2">Gehalten / Vereinbart / Soll</p><div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden relative"><div class="h-full bg-skt-blue-accent absolute top-0 left-0 transition-all duration-700 ease-out" style="width: ${Math.min(
        member.atGoal > 0 ? (member.atVereinbart / member.atGoal) * 100 : 0,
        100
    )}%;"></div><div class="h-full bg-skt-green-accent absolute top-0 left-0 transition-all duration-700 ease-out" style="width: ${Math.min(
        member.atGoal > 0 ? (member.atCurrent / member.atGoal) * 100 : 0,
        100
    )}%;"></div></div></div></div>`;
    card.appendChild(summary);
    card.appendChild(details);

    // KORREKTUR: Die Ausklapp-Funktion nur für Führungskräfte aktivieren.
    const isLeader = member.position && !member.position.toLowerCase().includes('trainee');
    summary.addEventListener('click', (e) => {
        if (e.target.closest('.calendar-view-btn')) return; // Klick auf Kalender-Button ignorieren
        if (isLeader && e.target.closest('.chevron-icon')) {
            details.classList.toggle('open');
            summary.classList.toggle('open');
            return;
        }
        // NEU: Wenn die aktuelle Ansicht 'struktur' ist, wechsle zur 'team'-Ansicht des angeklickten Mitarbeiters.
        if (currentPlanningView === 'struktur') {
            saveUiSetting('dashboardPlanningView', 'team');
            fetchAndRenderDashboard(member.id);
        } else {
            fetchAndRenderDashboard(member.id);
        }
    });

    // KORREKTUR: Logik zum Laden der Untergebenen nur für Führungskräfte hinzufügen.
    if (isLeader) {
        summary.addEventListener('click', async (e) => {
            if (e.target.closest('.calendar-view-btn')) return;
            if (details.classList.contains('open') && !details.dataset.loaded) {
                await renderSubordinatesForLeader(member.id, details);
            }
        });
    } else {
        summary.querySelector('.chevron-icon').classList.add('hidden'); // Pfeil für Trainees ausblenden
    }

    // NEU: Event-Listener für den Kalender-Button
    const calendarBtnList = summary.querySelector('.calendar-view-btn');
    if (calendarBtnList) {
        calendarBtnList.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = e.currentTarget.dataset.userid;
            if (userId) {
                const clickedUser = findRowById("mitarbeiter", userId);
                if (!clickedUser) return;

                const isClickedUserLeader = isUserLeader(clickedUser);

                pendingAppointmentViewMode = 'table';
                pendingAppointmentScope = 'structure';

                if (isClickedUserLeader) {
                    pendingAppointmentGroupFilter = userId;
                    pendingAppointmentFilter = null;
                } else {
                    pendingAppointmentFilter = clickedUser.Name;
                    pendingAppointmentGroupFilter = null;
                }
                switchView('appointments');
            }
        });
    }
    return card;
}

function findNextInfoDateAfter(startDate) {
    // Referenzpunkt ist ein Mittwoch, der ein Infotag ist.
    const referenceDate = new Date('2025-09-17T00:00:00Z');
    const calculationStartDate = new Date(startDate);
    calculationStartDate.setUTCHours(0, 0, 0, 0);

    const msPerDay = 24 * 60 * 60 * 1000;
    const cycleLengthDays = 21; // 3 Wochen

    // Differenz in Tagen zwischen dem Startdatum des Mitarbeiters und dem Referenzdatum berechnen
    const diffInMs = calculationStartDate.getTime() - referenceDate.getTime();
    const diffInDays = Math.round(diffInMs / msPerDay);

    // Berechnen, wie viele Tage es bis zum nächsten Infotag im Zyklus sind.
    const daysIntoCycle = ((diffInDays % cycleLengthDays) + cycleLengthDays) % cycleLengthDays;
    const daysUntilNext = (cycleLengthDays - daysIntoCycle) % cycleLengthDays;

    const nextInfoDate = new Date(calculationStartDate.getTime() + daysUntilNext * msPerDay);
    return nextInfoDate;
}

function fetchNextInfoDate() {
    const nextInfoDateObj = findNextInfoDateAfter(getCurrentDate());
    return nextInfoDateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function updateBackButtonVisibility() {
  // Der Zurück-Button wird angezeigt, wenn ein anderer User als der eingeloggte
  // angezeigt wird, oder wenn die Superuser-Gesamtansicht aktiv ist.
  const isViewingAnotherUser = authenticatedUserData?._id !== currentlyViewedUserData?._id;
  const shouldShow = isViewingAnotherUser || isSuperuserView;
  dom.backButton.classList.toggle("hidden", !shouldShow);
}

// --- MAIN LOGIC ---

async function fetchAndRenderDashboard(mitarbeiterId) {
  window.scrollTo(0, 0);
  // NEU: Prüfung auf automatische Beförderung, BEVOR die restlichen Daten berechnet werden.
  // Dies stellt sicher, dass alle folgenden Berechnungen auf der korrekten Karrierestufe basieren.
  const promotionOccurred = await applyAutomaticPromotionToDatabase(mitarbeiterId);
  if (promotionOccurred) {
      // Wenn eine Beförderung stattgefunden hat, wurde das Dashboard bereits neu geladen.
      return;
  }
  setStatus("Lade & verarbeite Daten...");
  dom.dashboardSections.classList.add("opacity-0");

  const user = findRowById("mitarbeiter", mitarbeiterId);
  if (!user) {
    setStatus(`Benutzer mit ID ${mitarbeiterId} nicht gefunden.`, true);
    return;
  }

  // --- OPTIMIERTER DATENABRUF ---
  // 1. Hole alle relevanten Mitarbeiter-IDs (sich selbst + gesamte Downline)
  const allDownline = getAllSubordinatesRecursive(mitarbeiterId);
  const allRelevantIds = [mitarbeiterId, ...allDownline.map((u) => u._id)];

  // 2. Führe EINEN gebündelten Datenabruf für alle relevanten Mitarbeiter aus
  const { startDate, endDate } = getMonthlyCycleDates();
  const [fullDataStore, earningsMap] = await Promise.all([
    fetchBulkDashboardData(allRelevantIds),
    calculateAllStructureEarnings(allRelevantIds, startDate, endDate),
  ]);

  const targetEarningsMap = await calculateAllStructureTargetEarnings(allRelevantIds, fullDataStore);

  const augmentedDataStore = fullDataStore.map((data) => ({
    ...data,
    earnings: earningsMap[data.id] || { personal: 0, group: 0, structure: 0 },
    targetEarnings: targetEarningsMap[data.id] || { personal: 0, group: 0, structure: 0 },
  }));

  // Definiere die Führungskräfte im aktuellen Kontext, um deren Untergebenen-Daten zu cachen.
  const führungskräfte = [user, ...allDownline].filter(isUserLeader);
  // Speichere die Daten der Untergebenen für jede FK im Cache für schnelles Ausklappen.
  führungskräfte.forEach(fk => {
      const subordinates = getSubordinates(fk._id, 'gruppe');
      const subordinateIds = new Set(subordinates.map(s => s._id));
      const dataForCache = augmentedDataStore.filter(d => subordinateIds.has(d.id));
      // KORREKTUR: Der Cache-Key muss mit dem in `getSubordinateDataWithCache` übereinstimmen.
      saveToCache(`subordinate-data-${fk._id}-grandchildren`, dataForCache);
  });





  // --- ENDE OPTIMIERTER DATENABRUF ---

  personalData = augmentedDataStore.find((d) => d.id === mitarbeiterId) || {};
  await checkAndApplyAutomaticPromotion(
    mitarbeiterId,
    personalData.totalCurrentEh
  );

  // NEU: Header-Animation basierend auf den Leistungsdaten aktualisieren
  updateHeaderAnimation(personalData);

  currentlyViewedUserData = user;
  dom.welcomeHeader.textContent = `Willkommen, ${user.Name}`;
  dom.userPosition.textContent = user.Karrierestufe;

  // KORREKTUR: Setze den aktiven Zustand der Ansichts-Buttons basierend auf der geladenen Einstellung.
  currentLeadershipViewMode = loadUiSetting('leadershipViewMode', 'list');
  dom.gridViewBtn.classList.toggle('active', currentLeadershipViewMode === 'grid');
  dom.listViewBtn.classList.toggle('active', currentLeadershipViewMode === 'list');

  // KORREKTUR: Verwende die robustere isUserLeader-Funktion, um zu bestimmen, ob die Führungsansicht angezeigt werden soll.
  const isLeader = isUserLeader(user);
  // NEU: Lade die bevorzugte Ansicht aus dem Speicher

  // NEU: "Neuen Nutzer anlegen"-Button nur für Führungskräfte anzeigen
  dom.addNewUserBtn.classList.toggle('hidden', !isLeader);

  currentPlanningView = loadUiSetting('dashboardPlanningView', isLeader ? 'team' : 'personal');
  if (!isLeader) {
      currentPlanningView = 'personal'; // Erzwinge persönliche Ansicht für Nicht-Führungskräfte
  }
  if (isLeader) {
    // OPTIMIERUNG: Berechne teamData direkt aus dem vorgeladenen Datenspeicher,
    // anstatt eine weitere (redundante) API-Abfrage in calculateGroupOrStructureData auszulösen.
    const groupMembers = [user, ...getSubordinates(mitarbeiterId, 'gruppe')];
    const groupMemberIds = new Set(groupMembers.map(m => m._id));
    const groupDataForCalc = augmentedDataStore.filter(d => groupMemberIds.has(d.id));

    const aggregatedGroupData = groupDataForCalc.reduce((acc, member) => {
        acc.ehGoal += (member.ehGoal || 0);
        acc.ehCurrent += (member.ehCurrent || 0);
        acc.etGoal += (member.etGoal || 0);
        acc.etCurrent += (member.etCurrent || 0);
        acc.atGoal += (member.atGoal || 0);
        acc.atCurrent += (member.atCurrent || 0);
        acc.atVereinbart += (member.atVereinbart || 0);
        acc.outstandingAppointmentsCount += (member.outstandingAppointmentsCount || 0);
        return acc;
    }, { ehGoal: 0, ehCurrent: 0, etGoal: 0, etCurrent: 0, atGoal: 0, atCurrent: 0, atVereinbart: 0, outstandingAppointmentsCount: 0, targetEarnings: 0 });

    teamData = { ...aggregatedGroupData, id: mitarbeiterId, earnings: personalData.earnings, targetEarnings: personalData.targetEarnings, members: groupDataForCalc.filter(d => d.id !== mitarbeiterId) };

    structureData = await calculateGroupOrStructureData(
      mitarbeiterId,
      "struktur",
      augmentedDataStore
    );

    // NEU: Eigene Gruppe zur Strukturansicht hinzufügen, damit sie als erste Karte erscheint.
    const ownGroupCardData = {
        ...teamData, // Enthält bereits die aggregierten Werte für die Gruppe
        id: user._id,
        name: user.Name,
        position: user.Karrierestufe,
        originalPosition: user.Karrierestufe,
        leaderName: user.Name, // Für die Kartenanzeige
        // WICHTIG: Die 'members' Eigenschaft für den Drilldown muss die volle Liste inkl. Leader enthalten.
        members: groupDataForCalc 
    };
    // Füge die eigene Gruppe an den Anfang der Liste der Strukturkarten.
    structureData.members.unshift(ownGroupCardData);

  }

  // NEU: UI für den Planning-View-Toggle basierend auf der geladenen Einstellung aktualisieren
  dom.teamViewBtn.classList.toggle("active", currentPlanningView === "team");
  dom.personalViewBtn.classList.toggle("active", currentPlanningView === "personal");
  // KORREKTUR: Zugriff auf das neue Element im Einstellungsmenü
  const stimmungsDashboardSettingsItem = document.getElementById('stimmungs-dashboard-settings-item');
  dom.strukturViewBtn.classList.toggle("active", currentPlanningView === "struktur");

  // NEU: Titel und Daten basierend auf der geladenen Ansicht setzen
  const viewTitles = { team: 'Gruppen-Übersicht', struktur: 'Struktur-Übersicht', personal: 'Deine Monatsplanung' };
  dom.monthlyPlanningTitle.textContent = viewTitles[currentPlanningView] || 'Deine Monatsplanung';

  let dataForPlanningView;
  switch(currentPlanningView) {
      case 'team': dataForPlanningView = teamData; break;
      case 'struktur': dataForPlanningView = structureData; break;
      default: dataForPlanningView = personalData;
  }
  updateMonthlyPlanningView(dataForPlanningView);

  // NEU: Sichtbarkeit der Sektionen basierend auf der Ansicht steuern
  if (isLeader) {
      dom.leadershipView.classList.remove('hidden');
      updateLeadershipView();
      dom.employeeView.classList.toggle('hidden', currentPlanningView !== 'personal');
      if (currentPlanningView === 'personal') updateEmployeeCareerView();
  } else {
      dom.leadershipView.classList.add('hidden');
      dom.employeeView.classList.remove('hidden');
      updateEmployeeCareerView();
  }
  dom.planningViewToggle.classList.toggle("hidden", !isLeader);
  // KORREKTUR: Banner nur für Trainees OHNE Einheiten anzeigen.
  const showEinarbeitungBanner = !isLeader && (!personalData.totalCurrentEh || personalData.totalCurrentEh === 0);
  dom.einarbeitungBanner.classList.toggle("hidden", !showEinarbeitungBanner);

  // NEU: Monatsplanung für Trainees ohne EH ausblenden/blurren
  const monthlyPlanningSection = document.getElementById('monthly-planning-view');
  monthlyPlanningSection.classList.toggle('blurred-section-overlay', showEinarbeitungBanner);
  

  dom.nextInfoDate.textContent = `Nächstes Info: ${fetchNextInfoDate()}`;
  await calculateAndRenderPQQForCurrentView();
  setStatus("");
  dom.dashboardSections.classList.remove("hidden");
  setTimeout(() => dom.dashboardSections.classList.remove("opacity-0"), 50);
  updateBackButtonVisibility();

  // NEU: Zeitreise-Banner anzeigen
  if (timeTravelDate) {
      dom.timeTravelBanner.classList.remove('hidden');
      const displayDate = new Date(timeTravelDate);
      dom.timeTravelDateDisplay.textContent = displayDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
  } else {
      dom.timeTravelBanner.classList.add('hidden');
  }

  // NEU: Banner für kritische Einarbeitungsschritte anzeigen
  if (isUserLeader(user)) {
      checkAndRenderCriticalOnboardingBanner();
  } else {
      const banner = document.getElementById('critical-onboarding-banner');
      if (banner) banner.classList.add('hidden');
  }
}

async function renderSuperuserView() {
  isSuperuserView = true;
  // KORREKTUR: Sicherheitsprüfung hierher verschoben.
  if (!isUserLeader(authenticatedUserData)) {
    alert("Du hast keine Berechtigung für diese Ansicht.");
    isSuperuserView = false; // Zurücksetzen, um UI-Fehler zu vermeiden
    return;
  }

  setStatus("Lade Gesamtansicht...");
  dom.dashboardSections.classList.add("opacity-0");

  const gesamtData = await calculateGesamtansichtData();
  personalData = gesamtData;

  dom.monthlyPlanningTitle.textContent = "Gesamtansicht";
  updateMonthlyPlanningView(gesamtData);

  currentPlanningView = "team";
  updateLeadershipView();

  dom.employeeView.classList.add("hidden");
  dom.leadershipView.classList.remove("hidden");
  dom.planningViewToggle.classList.add("hidden");

  setStatus("");
  dom.dashboardSections.classList.remove("hidden");
  setTimeout(() => dom.dashboardSections.classList.remove("opacity-0"), 50);
  updateBackButtonVisibility();
}

// --- Einarbeitung (Onboarding) Logic ---
async function checkAndRenderCriticalOnboardingBanner() {
    const banner = document.getElementById('critical-onboarding-banner');
    const listContainer = document.getElementById('critical-onboarding-list');
    if (!banner || !listContainer) return;

    // We only care about trainees in the leader's group for this banner
    const trainees = getSubordinates(currentlyViewedUserData._id, 'gruppe');
    if (trainees.length === 0) {
        banner.classList.add('hidden');
        return;
    }

    const progressPromises = trainees.map(trainee => 
        getOnboardingProgressForTrainee(trainee._id).then(progress => ({
            name: trainee.Name,
            id: trainee._id,
            hasOverdueCriticalStep: progress.hasOverdueCriticalStep
        }))
    );

    const results = await Promise.all(progressPromises);
    const usersWithOverdueSteps = results.filter(r => r.hasOverdueCriticalStep);

    if (usersWithOverdueSteps.length > 0) {
        listContainer.innerHTML = '';
        usersWithOverdueSteps.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'bg-red-200 p-2 rounded-md flex justify-between items-center cursor-pointer hover:bg-red-300 transition-colors';
            userElement.innerHTML = `
                <span class="font-semibold">${user.name}</span>
                <i class="fas fa-arrow-right"></i>
            `;
            userElement.addEventListener('click', () => {
                switchView('einarbeitung');
                showTraineeDetailView(user.id);
            });
            listContainer.appendChild(userElement);
        });
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

async function fetchAndRenderOnboarding(mitarbeiterId) {
  const user = findRowById("mitarbeiter", mitarbeiterId);
  if (!user) return;

  // NEU: Toggle-Element holen und Sichtbarkeit steuern
  const scopeToggle = document.getElementById('onboarding-scope-toggle');

  const position = user.Karrierestufe || "";
  const isTrainee = position.toLowerCase().includes("trainee");

  if (isTrainee) {
    dom.einarbeitungTitle.textContent = "Dein Einarbeitungsplan";
    if (scopeToggle) scopeToggle.classList.add('hidden'); // Toggle für Trainees ausblenden
    dom.leaderOnboardingView.classList.add("hidden");
    dom.traineeOnboardingView.classList.remove("hidden");
    await renderTraineeOnboardingView(mitarbeiterId);
  } else {
    // NEU: Logik für den Toggle
    if (scopeToggle) scopeToggle.classList.remove('hidden');

    // NEU: Lade die bevorzugte Ansicht aus dem Speicher
    const scope = loadUiSetting('onboardingScope', 'group');

    dom.einarbeitungTitle.textContent = `Einarbeitung: ${scope === 'group' ? 'Gruppen' : 'Struktur'}-Übersicht`;
    dom.traineeOnboardingView.classList.add("hidden");
    dom.leaderOnboardingView.classList.remove("hidden");

    let teamMembers;
    if (scope === 'structure') { // KORREKTUR: `scope` statt `currentOnboardingScope` verwenden
        const allSubordinates = getAllSubordinatesRecursive(mitarbeiterId);
        // Filtere nur die Trainees/GAs heraus
        teamMembers = allSubordinates.filter(member => !isUserLeader(member));
    } else { // scope === 'group'
        teamMembers = getSubordinates(mitarbeiterId, "gruppe");
    }
    teamMembers = teamMembers.filter(member => member && member.Startdatum);

    // NEU: UI des Toggles aktualisieren
    document.getElementById('onboarding-group-btn').classList.toggle('active', scope === 'group');
    document.getElementById('onboarding-structure-btn').classList.toggle('active', scope === 'structure');

    await renderLeaderOnboardingView(teamMembers);
  }
}

async function renderLeaderOnboardingView(teamMembers) {
  clearChildren(dom.leaderOnboardingView);
  dom.leaderOnboardingView.innerHTML = `<div class="loader mx-auto"></div>`;

  if (teamMembers.length === 0) {
    dom.leaderOnboardingView.innerHTML = `<p class="text-center text-gray-500">Keiner deiner Mitarbeiter befindet sich aktuell in der Einarbeitung.</p>`;
    return;
  }

  const container = document.createElement("div");
  container.className = "space-y-4";

  const progressPromises = teamMembers.map((member) =>
    getOnboardingProgressForTrainee(member._id).then((data) => ({ member, data }))
  );
  const results = await Promise.all(progressPromises);

  // Trenne die Mitarbeiter in "in Ausbildung" und "abgeschlossen".
  const inProgressTrainees = results.filter(r => r.data.percentage < 100 && r.data.totalSteps > 0);
  const completedTrainees = results.filter(r => r.data.percentage >= 100 && r.data.totalSteps > 0);

  // Rendere die Mitarbeiter, die noch in Ausbildung sind.
  inProgressTrainees.forEach(({ member, data: progressData }) => {
    const card = document.createElement("div");
    card.className = "bg-skt-grey-light p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-colors";
    card.dataset.traineeId = member._id;
    
    const warningIcon = progressData.hasOverdueCriticalStep
        ? '<i class="fas fa-exclamation-triangle text-skt-red-accent ml-2" title="Kritischer Schritt überfällig!"></i>'
        : '';

    card.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <p class="font-bold text-skt-blue flex items-center">${member.Name}${warningIcon}</p>
            <p class="font-semibold text-skt-blue-light">${progressData.percentage.toFixed(0)}%</p>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-4 shadow-inner relative">
            <div class="bg-skt-red-accent h-4 rounded-full absolute top-0 left-0 transition-all duration-700 ease-out" style="width: ${progressData.sollPercentage.toFixed(0)}%; z-index: 1;" data-tooltip="Soll-Fortschritt"></div>
            <div class="bg-skt-green-accent h-4 rounded-full absolute top-0 left-0 transition-all duration-700 ease-out" style="width: ${progressData.percentage.toFixed(0)}%; z-index: 2;" data-tooltip="Ist-Fortschritt"></div>
        </div>
    `;
    card.addEventListener("click", () => showTraineeDetailView(member._id));
    container.appendChild(card);
  });

  // Erstelle den einklappbaren Bereich für abgeschlossene Mitarbeiter.
  if (completedTrainees.length > 0) {
    const details = document.createElement("details");
    details.className = "bg-green-50 border border-green-200 rounded-xl shadow-lg mt-6";
    
    const summary = document.createElement("summary");
    summary.className = "p-4 font-semibold text-skt-green-accent cursor-pointer flex justify-between items-center";
    summary.innerHTML = `
        <span><i class="fas fa-check-circle mr-2"></i>Abgeschlossene Einarbeitungen (${completedTrainees.length})</span>
        <i class="fas fa-chevron-down transition-transform duration-300"></i>
    `;
    details.appendChild(summary);

    const completedContainer = document.createElement("div");
    completedContainer.className = "p-4 pt-0 space-y-3 max-h-96 overflow-y-auto";

    completedTrainees.forEach(({ member }) => {
      const completedCard = document.createElement("div");
      completedCard.className = "p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-100 transition-colors flex justify-between items-center";
      completedCard.dataset.traineeId = member._id;
      completedCard.innerHTML = `
          <div>
              <p class="font-bold text-skt-blue">${member.Name}</p>
              <p class="text-sm text-gray-500">Einarbeitung abgeschlossen</p>
          </div>
          <i class="fas fa-eye text-skt-blue-light"></i>
      `;
      completedCard.addEventListener("click", () => showTraineeDetailView(member._id));
      completedContainer.appendChild(completedCard);
    });

    details.appendChild(completedContainer);
    container.appendChild(details);

    // Sorge dafür, dass sich der Pfeil dreht
    details.addEventListener('toggle', () => {
        const icon = summary.querySelector('.fa-chevron-down');
        if (icon) {
            icon.classList.toggle('rotate-180', details.open);
        }
    });
  }

  clearChildren(dom.leaderOnboardingView);
  if (container.children.length === 0) {
    dom.leaderOnboardingView.innerHTML = `<p class="text-center text-gray-500">Keiner deiner Mitarbeiter befindet sich aktuell in der Einarbeitung.</p>`;
  } else {
    dom.leaderOnboardingView.appendChild(container);
  }
}

async function getOnboardingProgressForTrainee(traineeId) {
  const user = findRowById("mitarbeiter", traineeId);
  if (!user || !user.Name)
    return { percentage: 0, sollPercentage: 0, totalSteps: 0, hasOverdueCriticalStep: false }; // NEU

  // Daten aus dem Cache verwenden statt einer neuen SQL-Abfrage
  const userEinarbeitung = db.einarbeitung.filter(e => e.Mitarbeiter_ID === traineeId);

  const allSteps = db.einarbeitungsschritte;

  // NEU: Bestimme, welche Schritte für den aktuellen Betrachter sichtbar sind.
  // Führungskräfte sehen alle Schritte, Trainees sehen keine "versteckten" Schritte.
  const viewerIsLeader = isUserLeader(authenticatedUserData);
  const isOwnView = authenticatedUserData._id === traineeId;
  const isEditable = viewerIsLeader && !isOwnView;
  const visibleSteps = !isEditable
    ? allSteps.filter((step) => step.Kategorie !== "Versteckt")
    : allSteps;

  if (visibleSteps.length === 0)
    return { percentage: 0, sollPercentage: 0, totalSteps: 0, hasOverdueCriticalStep: false }; // NEU

  const completedStepIds = new Set(
    userEinarbeitung.map((e) => e["Schritt_ID"])
  );
  const completedSteps = visibleSteps.filter((s) =>
    completedStepIds.has(s._id)
  ).length;
  const percentage = visibleSteps.length > 0 ? (completedSteps / visibleSteps.length) * 100 : 0;

  const userStartDate = user.Startdatum;
  let sollPercentage = 0;
  let hasOverdueCriticalStep = false; // NEU
  if (userStartDate) {
    const startDate = new Date(userStartDate);
    const today = getCurrentDate();
    today.setHours(0, 0, 0, 0); // KORREKTUR: Auf Mitternacht setzen für konsistenten Vergleich

    const dueStepsCount = visibleSteps.filter(step => {
        let dueDate;
        if (step.Schritt && step.Schritt.toLowerCase().includes("infoabend")) {
            dueDate = findNextInfoDateAfter(startDate);
        } else {
            dueDate = new Date(startDate);
            dueDate.setDate(startDate.getDate() + (step.Tag || 0));
        }
        dueDate.setHours(23, 59, 59, 999); // KORREKTUR: Ein Schritt ist am Ende des Fälligkeitstages überfällig.

        // NEU: Prüfung auf kritische, überfällige Schritte
        const isOverdue = dueDate < today && !completedStepIds.has(step._id);
        if (isOverdue && step.Kritisch === true) {
            hasOverdueCriticalStep = true;
        }

        return dueDate <= today;
    }).length;

    sollPercentage = visibleSteps.length > 0 ? (dueStepsCount / visibleSteps.length) * 100 : 0;
  }

  return { percentage, sollPercentage, totalSteps: visibleSteps.length, hasOverdueCriticalStep }; // NEU
}

async function showTraineeDetailView(traineeId) {
  dom.leaderOnboardingView.classList.add("hidden");
  dom.traineeOnboardingView.classList.remove("hidden");
  const traineeName =
    findRowById("mitarbeiter", traineeId)?.Name || "Unbekannt";
  dom.einarbeitungTitle.textContent = `Einarbeitungsplan: ${traineeName}`;

  dom.grundseminarStepsContainer.innerHTML = `<div class="loader mx-auto mt-4"></div>`;
  dom.aufbauseminarStepsContainer.innerHTML = ``;
  document
    .getElementById("onboarding-progress-container")
    .classList.add("hidden");

  await renderTraineeOnboardingView(traineeId);

  currentOnboardingSubView = "trainee-detail";
  updateBackButtonVisibility();
}

async function renderTraineeOnboardingView(
  mitarbeiterId,
  forceShowAllCompleted = false
) {
  const user = findRowById("mitarbeiter", mitarbeiterId);
  if (!user || !user.Startdatum || !user.Name) {
    dom.traineeOnboardingView.innerHTML = `<p class="text-center text-red-500">Für diesen Mitarbeiter sind nicht alle Daten (Startdatum/Name) hinterlegt.</p>`;
    return;
  }

  const viewerIsLeader = isUserLeader(authenticatedUserData);
  const isOwnView = authenticatedUserData._id === mitarbeiterId;
  const isEditable = viewerIsLeader && !isOwnView;
  
  let allSteps = db.einarbeitungsschritte;
  if (!isEditable) { // Trainees sehen keine versteckten Schritte
    allSteps = allSteps.filter((step) => step.Kategorie !== "Versteckt");
  }
  allSteps.sort((a, b) => a.Tag - b.Tag);

  // Daten aus dem Cache verwenden statt einer neuen SQL-Abfrage
  const userEinarbeitung = db.einarbeitung.filter(e => e.Mitarbeiter_ID === mitarbeiterId);

  const completedStepIds = new Set(
    userEinarbeitung.map((e) => e["Schritt_ID"])
  );

  const startDate = new Date(user.Startdatum);

  const processedSteps = allSteps.map((step) => {
    let dueDate;
    if (step.Schritt && step.Schritt.toLowerCase().includes("infoabend")) {
      dueDate = findNextInfoDateAfter(startDate);
    } else {
      dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + (step.Tag || 0));
    }
    return { ...step, dueDate, completed: completedStepIds.has(step._id) };
  });

  const aufbauStartIndex = processedSteps.findIndex((step) =>
    step.Schritt.toLowerCase().includes("aufbauseminar")
  );
  let grundseminarSteps =
    aufbauStartIndex !== -1
      ? processedSteps.slice(0, aufbauStartIndex)
      : processedSteps;
  let aufbauseminarSteps =
    aufbauStartIndex !== -1 ? processedSteps.slice(aufbauStartIndex) : [];

  // NEU: Prüfen, ob das Grundseminar abgeschlossen ist.
  const grundseminarCompleted = grundseminarSteps.every(step => step.completed);

  const progressData = await getOnboardingProgressForTrainee(mitarbeiterId);
  const progressContainer = document.getElementById(
    "onboarding-progress-container"
  );
  progressContainer.classList.remove("hidden");
  document.getElementById(
    "onboarding-progress-bar"
  ).style.width = `${progressData.percentage}%`;
  document.getElementById(
    "onboarding-progress-text"
  ).textContent = `${progressData.percentage.toFixed(0)}%`;
  document.getElementById(
    "onboarding-soll-bar"
  ).style.width = `${progressData.sollPercentage}%`;

  renderTimelineSection(
    dom.grundseminarStepsContainer,
    dom.grundseminarProgress,
    dom.grundseminarDateMarkers,
    grundseminarSteps,
    isEditable,
    mitarbeiterId
  );
  renderTimelineSection(
    dom.aufbauseminarStepsContainer,
    dom.aufbauseminarProgress,
    dom.aufbauseminarDateMarkers,
    aufbauseminarSteps,
    isEditable, // KORREKTUR: Bearbeitung immer erlauben, wenn die Berechtigung da ist.
    mitarbeiterId
  );

  // NEU: Button zum Abschließen der Einarbeitung für Führungskräfte anzeigen
  const actionsContainer = document.getElementById('onboarding-actions-container');
  if (actionsContainer) {
      actionsContainer.classList.toggle('hidden', !isEditable);
      if (isEditable) {
          const completeBtn = actionsContainer.querySelector('#complete-onboarding-btn');
          // Klonen, um alte Listener zu entfernen und neue sicher hinzuzufügen
          const newCompleteBtn = completeBtn.cloneNode(true);
          completeBtn.parentNode.replaceChild(newCompleteBtn, completeBtn);

          newCompleteBtn.addEventListener('click', async () => {
              const confirmed = await showConfirmationModal(
                  `Möchten Sie die Einarbeitung für ${user.Name} wirklich abschließen? Alle offenen Schritte werden als erledigt markiert.`,
                  'Einarbeitung abschließen?',
                  'Ja, abschließen'
              );
              if (confirmed) {
                  newCompleteBtn.disabled = true;
                  newCompleteBtn.innerHTML = '<div class="loader-small mx-auto"></div>';

                  // Finde alle Schritte, die für diesen Mitarbeiter noch nicht erledigt sind.
                  const completedStepIds = new Set(db.einarbeitung.filter(e => e.Mitarbeiter_ID === mitarbeiterId).map(e => e.Schritt_ID));
                  const allStepsForUser = db.einarbeitungsschritte;
                  const stepsToComplete = allStepsForUser.filter(step => !completedStepIds.has(step._id));

                  if (stepsToComplete.length > 0) {
                      const addPromises = stepsToComplete.map(step => addOnboardingEntry(mitarbeiterId, step._id));
                      const results = await Promise.all(addPromises);

                      if (results.every(res => res === true)) {
                          alert('Einarbeitung erfolgreich abgeschlossen. Alle offenen Schritte wurden als erledigt markiert.');
                          // Cache leeren und Daten neu laden, um die Änderungen zu übernehmen
                          localStorage.removeItem(CACHE_PREFIX + 'einarbeitung');
                          db.einarbeitung = await seaTableQuery('Einarbeitung');
                          normalizeAllData();
                          // Zurück zur Leader-Ansicht
                          fetchAndRenderOnboarding(authenticatedUserData._id);
                      } else {
                          alert('Ein Fehler ist beim Abschließen der Einarbeitung aufgetreten.');
                      }
                  } else {
                      alert('Die Einarbeitung war bereits vollständig abgeschlossen.');
                  }
                  // KORREKTUR: Setze den Button-Zustand immer zurück, egal was passiert.
                  // Die Ansicht wird bei Erfolg ohnehin neu geladen.
                  newCompleteBtn.disabled = false;
                  newCompleteBtn.innerHTML = '<i class="fas fa-power-off mr-2"></i>Einarbeitung abschließen';
              }
          });
      }
  }
}

function renderTimelineSection(
  container,
  progressElement,
  dateMarkerContainer,
  steps,
  isEditable = false,
  traineeId = null
) {
  clearChildren(container);

  // NEU: Logik zum Ausbluren des Aufbauseminars
  // KORREKTUR: Die Freischaltung erfolgt jetzt zeitbasiert, nicht mehr nach Fortschritt.
  const isAufbauseminar = container.id.includes('aufbauseminar');
  let isLocked = false;
  if (isAufbauseminar && steps.length > 0) {
      const today = getCurrentDate();
      today.setHours(0, 0, 0, 0);
      const aufbauStartDate = new Date(steps[0].dueDate);
      isLocked = today < aufbauStartDate;
  }

  if (isLocked) {
      // KORREKTUR: Wendet den Blur-Effekt auf den Container an und platziert das Overlay daneben,
      // anstatt es zu verschachteln.
      const parentWrapper = container.parentElement; // Das ist <div class="timeline-wrapper ...">
      parentWrapper.classList.add('aufbauseminar-locked-wrapper'); // Fügt position:relative hinzu
      container.classList.add('aufbauseminar-blurred-content'); // Wendet den Blur-Effekt an
      const overlay = document.createElement('div');
      overlay.innerHTML = `<i class="fas fa-lock text-3xl text-skt-blue-light mb-2"></i><p class="font-semibold text-skt-blue">Wird nach Abschluss des Grundseminars freigeschaltet.</p>`;
      overlay.className = 'aufbauseminar-locked-overlay';
      parentWrapper.insertBefore(overlay, container.nextSibling); // Fügt das Overlay als Geschwisterelement ein
      
      // KORREKTUR: Blende den Zeitstrahl und die Datumsmarkierungen aus, wenn der Abschnitt gesperrt ist.
      if (progressElement) progressElement.style.height = "0%";
      if (dateMarkerContainer) clearChildren(dateMarkerContainer);
      return;
  }
  container.parentElement.classList.remove('aufbauseminar-blurred');

  if (steps.length === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-500 mt-4">Für diesen Abschnitt sind keine Schritte vorhanden.</p>';
    if (progressElement) progressElement.style.height = "0%";
    if (dateMarkerContainer) clearChildren(dateMarkerContainer);
    return;
  }

  const sectionStartDate = steps[0].dueDate;
  const sectionEndDate = steps[steps.length - 1].dueDate;
  const todayForProgress = new Date(); // Use a separate 'today' for progress calculation to not affect the step loop

  const totalDuration = sectionEndDate.getTime() - sectionStartDate.getTime();
  const elapsedDuration = todayForProgress.getTime() - sectionStartDate.getTime();
  
  let timeProgressPercent = 0;
  if (totalDuration > 0) {
      timeProgressPercent = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
  } else if (todayForProgress >= sectionStartDate) {
      timeProgressPercent = 100;
  }

  if (progressElement) {
    progressElement.style.height = `${timeProgressPercent}%`;
  }

  if (dateMarkerContainer) {
    renderDateMarkers(dateMarkerContainer, sectionStartDate, sectionEndDate);
  }

  const today = getCurrentDate();
  today.setHours(0, 0, 0, 0);

  steps.forEach((step, index) => {
    const stepEl = document.createElement("div");
    const stepType = step.Kategorie
      ? step.Kategorie.toLowerCase().trim()
      : "other";
    const isMajor = stepType === "meilenstein" || stepType === "seminar";

    // NEU: PDF-Download-Icon für Führungskräfte
    let pdfIconHtml = '';
    if (isEditable && step.PDF && Array.isArray(step.PDF) && step.PDF.length > 0 && step.PDF[0].url) {
        const pdfPath = step.PDF[0].url;
        // KORREKTUR: Verwende einen Button anstelle eines <a>-Tags, um den Download dynamisch auszulösen.
        pdfIconHtml = `
            <button type="button" class="pdf-download-btn text-skt-red-accent hover:text-red-700 transition-colors" data-pdf-path="${pdfPath}" title="PDF herunterladen">
                <i class="fas fa-file-pdf fa-lg"></i>
            </button>
        `;
    }

    let checkboxHtml = '';
    if (isEditable) {
        // KORREKTUR: Die Checkbox wird jetzt als runder Button unten rechts positioniert.
        checkboxHtml = `
            <button class="onboarding-step-toggle absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 ${step.completed ? 'bg-skt-green-accent text-white' : 'bg-white text-gray-400'}" data-step-id="${step._id}" data-trainee-id="${traineeId}" title="Status ändern">
                <i class="fas fa-check"></i>
            </button>
        `;
    }

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    let statusClass = step.completed
      ? "completed"
      : step.dueDate < threeDaysAgo // KORREKTUR: Erst nach 3 Tagen als "due" markieren
      ? "due"
      : "future";

    // NEU: Prüfen, ob ein kritischer Schritt überfällig ist und Icon separat erstellen
    const isCriticalOverdue = statusClass === 'due' && step.Kritisch === true;
    const warningIconHtml = isCriticalOverdue
        ? `<i class="fas fa-exclamation-triangle text-skt-red-accent fa-lg" title="Kritischer Schritt überfällig!"></i>`
        : '';
    let titleHtml = `<p class="timeline-title">${step.Schritt}</p>`;

    let iconClass = "fa-question";
    switch (stepType) {
      case "seminar":
        iconClass = "fa-book";
        break;
      case "persönliches gespräch":
        iconClass = "fa-users";
        break;
      case "meilenstein":
        iconClass = "fa-star";
        break;
      case "hausübung":
        iconClass = "fa-pencil-alt";
        break;
      case "versteckt":
        iconClass = "fa-user-shield";
        break;
      default:
        iconClass = "fa-question";
        break;
    }

    stepEl.className = `timeline-item ${statusClass} ${stepType.replace(/\s/g, '')} ${
      isMajor ? "timeline-item-major" : "timeline-item-minor"
    }`;
    stepEl.style.animationDelay = `${index * 0.1}s`;

    const formattedDate = step.dueDate.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    stepEl.innerHTML = `
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <div class="timeline-icon-inline">
                                <i class="fas ${iconClass}"></i>
                            </div>
                            <div class="timeline-info">
                                ${titleHtml}
                                <p class="timeline-duedate">Fällig bis: ${formattedDate}</p>
                            </div>
                            <div class="flex items-center gap-4">
                                ${warningIconHtml}
                                ${pdfIconHtml}
                            </div>
                        </div>
                    </div>
                `;

    // Klick-Listener aufteilen: Klick auf Checkbox ändert Status, Klick auf Rest öffnet Modal.
    const contentArea = stepEl.querySelector(".timeline-content");
    contentArea.addEventListener("click", (e) => {
        // Verhindert, dass das Modal aufgeht, wenn auf einen Button geklickt wird.
        if (e.target.closest('.onboarding-step-toggle') || e.target.closest('.pdf-download-btn')) {
            return;
        }
        // ...
        const contentToShow = isEditable ? (step.Tipps || "Keine Tipps verfügbar.") : (step.Hinweis || "Kein Hinweis verfügbar.");
        // NEU: Titel dynamisch setzen, je nachdem, ob es die Trainee- oder Führungskraft-Ansicht ist.
        dom.hinweisModalTitle.textContent = isEditable ? "Tipps für die Führungskraft" : "Was dich erwartet 👀";
        dom.hinweisModalContent.innerHTML = marked.parse(contentToShow);
        dom.hinweisModal.classList.add("visible");
        document.body.classList.add("modal-open");
        document.documentElement.classList.add("modal-open");
    });

    // Füge den Checkbox-Button außerhalb des klickbaren Bereichs hinzu
    const header = stepEl.querySelector('.timeline-header');
    header.insertAdjacentHTML('afterend', checkboxHtml);

    // KORREKTUR: Der Event-Listener muss direkt hier auf den neu erstellten Button gesetzt werden.
    if (isEditable) {
        const toggleBtn = stepEl.querySelector('.onboarding-step-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', handleOnboardingStepToggle);
        }
        // NEU: Event-Listener für den PDF-Download-Button
        const pdfDownloadBtn = stepEl.querySelector('.pdf-download-btn');
        if (pdfDownloadBtn) {
            pdfDownloadBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const button = e.currentTarget;
                const icon = button.querySelector('i');
                icon.classList.remove('fa-file-pdf');
                icon.classList.add('fa-spinner', 'fa-spin');
                button.disabled = true;

                const filePath = button.dataset.pdfPath;
                const downloadLink = await getSeaTableDownloadLink(filePath);
                if (downloadLink) {
                    window.open(downloadLink, '_blank');
                } else {
                    alert('Fehler: Der Download-Link konnte nicht erstellt werden.');
                }
                icon.classList.remove('fa-spinner', 'fa-spin');
                icon.classList.add('fa-file-pdf');
                button.disabled = false;
            });
        }
    }
    container.appendChild(stepEl);
  });
}

function renderDateMarkers(container, startDate, endDate) {
  clearChildren(container);
  const totalDuration = endDate.getTime() - startDate.getTime();
  if (totalDuration <= 0) return;

  const today = new Date();
  const elapsedDuration = today.getTime() - startDate.getTime();
  const timeProgressPercent = Math.max(
    0,
    Math.min(100, (elapsedDuration / totalDuration) * 100)
  );

  // Start- und Enddatum Marker
  const createMarker = (date, topPercent, customClass = "") => {
    const marker = document.createElement("div");
    marker.className = `timeline-date-marker ${customClass}`;
    marker.style.top = `${topPercent}%`;
    marker.textContent = date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    });
    container.appendChild(marker);
  };

  createMarker(startDate, 0, "timeline-date-marker-start");
  createMarker(endDate, 100, "timeline-date-marker-end");

  // "Heute" Marker
  if (today >= startDate && today <= endDate) {
    const todayMarker = document.createElement("div");
    todayMarker.className = "timeline-today-marker";
    todayMarker.style.top = `${timeProgressPercent}%`;
    todayMarker.dataset.tooltip = "Heute";
    container.appendChild(todayMarker);
  }
}

async function handleOnboardingStepToggle(event) {
    const checkboxElement = event.currentTarget;
    // KORREKTUR: `classList.contains('bg-skt-green-accent')` ist die zuverlässigere Prüfung, ob der Button "checked" ist.
    const isCurrentlyCompleted = checkboxElement.classList.contains('bg-skt-green-accent');
    const stepId = checkboxElement.dataset.stepId;
    const traineeId = checkboxElement.dataset.traineeId;

    // UI sofort aktualisieren und Interaktion sperren
    checkboxElement.style.pointerEvents = 'none';
    checkboxElement.style.opacity = '0.5';

    let success = false;
    if (!isCurrentlyCompleted) { // If it's not currently completed, we want to add an entry.
        success = await addOnboardingEntry(traineeId, stepId);
    } else {
        // KORREKTUR: Die ID des zu löschenden Eintrags muss zuerst gefunden werden.
        const entryToDelete = db.einarbeitung.find(e => e.Mitarbeiter_ID === traineeId && e.Schritt_ID === stepId);
        if (entryToDelete) {
            success = await removeOnboardingEntry(traineeId, stepId);
        } else {
            success = true; // Wenn kein Eintrag zum Löschen da ist, betrachten wir es als "erfolgreich".
        }
    }

    if (success) {
        localStorage.removeItem(CACHE_PREFIX + 'einarbeitung');
        db.einarbeitung = await seaTableQuery('Einarbeitung'); // Nur Einarbeitungsdaten neu laden
        normalizeAllData();
        await renderTraineeOnboardingView(traineeId);
        // NEU: Nach der Aktualisierung prüfen, ob der Banner für kritische Schritte
        // ausgeblendet werden muss, falls der letzte kritische Schritt erledigt wurde.
        // Dies stellt sicher, dass die Dashboard-Ansicht konsistent ist.
        await checkAndRenderCriticalOnboardingBanner();
    } else {
        alert('Fehler beim Aktualisieren des Schritts.');
        // UI-Änderung bei Fehler rückgängig machen
        checkboxElement.style.pointerEvents = 'auto';
        checkboxElement.style.opacity = '1';
    }
}

async function addOnboardingEntry(traineeId, stepId) {
    const log = (message, ...data) => console.log(`%c[AddOnboarding] %c${message}`, 'color: #28a745; font-weight: bold;', 'color: black;', ...data);
    log(`Starte Prozess für Trainee: ${traineeId}, Schritt: ${stepId}`);

    const trainee = findRowById('mitarbeiter', traineeId);
    const step = findRowById('einarbeitungsschritte', stepId);

    if (!trainee || !step) {
        log("!!! FEHLER: Trainee oder Schritt in der DB nicht gefunden.", { trainee, step });
        return false;
    }
    log("Trainee und Schritt gefunden:", { traineeName: trainee.Name, stepName: step.Schritt });

    const primaryKeyColName = await getPrimaryKeyColumnName('Einarbeitung');
    if (!primaryKeyColName) {
        log("!!! FEHLER: Primärschlüssel für Tabelle 'Einarbeitung' konnte nicht ermittelt werden.");
        return false;
    }
    
    // KORREKTUR: Prüfe den Typ des Primärschlüssels, bevor ein Wert gesetzt wird.
    const tableMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'einarbeitung');
    const primaryKeyColMeta = tableMeta.columns.find(c => c.name === primaryKeyColName);

    // Per User-Request: Spalte 'Wann_erledigt' verwenden.
    const wannErledigtKey = COLUMN_MAPS.einarbeitung.Wann_erledigt;
    if (!wannErledigtKey) {
        log(`!!! FEHLER: Spalte 'Wann_erledigt' nicht in den COLUMN_MAPS für 'Einarbeitung' gefunden. Verfügbare Spalten:`, Object.keys(COLUMN_MAPS.einarbeitung));
        if (COLUMN_MAPS.einarbeitung.Datum) {
            log("Fallback auf Spalte 'Datum' wird verwendet.");
        } else {
            return false;
        }
    }

    const rowData = {
        [COLUMN_MAPS.einarbeitung.Mitarbeiter_ID]: [traineeId],
        [COLUMN_MAPS.einarbeitung.Schritt_ID]: [stepId],
        [wannErledigtKey || COLUMN_MAPS.einarbeitung.Datum]: new Date().toISOString().split('T')[0],
    };

    // Nur wenn der Primärschlüssel ein beschreibbares Textfeld ist, wird ein Wert generiert.
    // Ist es eine Formel oder ein anderer Typ, überlassen wir das Setzen des Werts SeaTable.
    if (primaryKeyColMeta && primaryKeyColMeta.type === 'text') {
        const primaryKeyColKey = COLUMN_MAPS.einarbeitung[primaryKeyColName];
        if (!primaryKeyColKey) {
            log(`!!! FEHLER: Spalten-Key für Primärschlüssel '${primaryKeyColName}' nicht gefunden.`);
            return false;
        }
        log(`Primärschlüssel '${primaryKeyColName}' (Key: ${primaryKeyColKey}) ist Text. Wert wird generiert.`);
        const entryName = `${trainee.Name} - ${step.Schritt}`;
        rowData[primaryKeyColKey] = entryName;
    } else {
        log(`Primärschlüssel '${primaryKeyColName}' ist nicht vom Typ 'text' (Typ: ${primaryKeyColMeta?.type}). Wert wird nicht explizit gesetzt.`);
    }

    log("Row-Data für API-Aufruf vorbereitet:", JSON.parse(JSON.stringify(rowData)));
    return await genericAddRowWithLinks('Einarbeitung', rowData, ['Mitarbeiter_ID', 'Schritt_ID']);
}

async function removeOnboardingEntry(traineeId, stepId) {
    const entryToDelete = db.einarbeitung.find(e => 
        e.Mitarbeiter_ID === traineeId && 
        e.Schritt_ID === stepId
    );

    if (entryToDelete) {
        return await seaTableDeleteRow('Einarbeitung', entryToDelete._id);
    }
    console.warn('Could not find onboarding entry to delete.');
    return false;
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

function getWeekDates(date = new Date()) {
    const current = new Date(date.getTime()); // KORREKTUR: Erstelle eine saubere Kopie des Datums, um Seiteneffekte zu vermeiden.
    current.setHours(0, 0, 0, 0); // Zeit zurücksetzen, um konsistente Berechnungen zu gewährleisten.
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday is the first day of the week
    const startDate = new Date(current.setDate(diff));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
}

function getMonthDates(date = new Date()) {
    const current = new Date(date);
    const startDate = new Date(current.getFullYear(), current.getMonth(), 1);
    const endDate = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate, endDate };
}

// --- Appointments View Logic (integriert in main.js) ---

const appointmentsLog = (message, ...data) => console.log(`%c[Appointments] %c${message}`, 'color: #4f46e5; font-weight: bold;', 'color: black;', ...data);
class AppointmentsView {
    constructor() {
        // Der Konstruktor ist absichtlich schlank. DOM-Elemente werden in init() geholt.
        this.listContainer = null;
        this.statsChartTitle = null;
        this.statsPieChartContainer = null;
        this.statsPieChartLegend = null;
        this.statsByEmployeeBtn = null;
        // NEU: DOM-Elemente für die neue Statistik-Sektion
        this.statsScopeFilter = null;
        // NEU: Gruppenfilter-Elemente
        this.groupFilterContainer = null;
        this.groupFilterBtn = null;
        this.groupFilterPanel = null;
        this.statsCategoryFilterBtn = null;
        this.statsCategoryFilterPanel = null;
        this.statsMonthTimeline = null; // Timeline-Ansicht
        this.statsTimelineView = null;
        this.statsViewTimelineBtn = null;
        // NEU: Wochenkalender-Ansicht
        this.statsWeekView = null;
        this.statsViewWeekBtn = null;
        this.weekNavPrevBtn = null;
        this.weekNavNextBtn = null;
        this.weekPeriodDisplay = null;
        this.weekCalendarScopeSelect = null;
        this.weekCalendarViewModeSelect = null;
        this.weekCalendarUserSelectContainer = null;
        this.weekCalendarUserSelect = null;
        this.weekCalendarBody = null;
        this.weekCalendarHeader = null;
        this.statsPeriodDisplay = null; // Beibehalten für die Wochenanzeige
        this.statsNavPrevBtn = null;    // Beibehalten für die Navigation
        this.statsNavNextBtn = null;    // Beibehalten für die Navigation
        this.statsViewTableBtn = null;
        this.statsViewInfoBtn = null; // NEU

        this.statsTableView = null;
        this.naechstesInfoView = null; // NEU
        this.infoabendDateSelect = null;
        this.statsTableView = null;
        this.statsByStatusBtn = null;
        this.outstandingAppointmentsSection = null;
        this.statsTableSortConfig = {
            column: 'Datum', // KORREKTUR: Standard-Sortierung ist aufsteigend (älteste zuerst)
            direction: 'asc'
        };
        this.outstandingAppointmentsList = null;
        this.prognosisDetailsContainer = null;
        this.recruitingTab = null;
        this.startDateInput = null;
        this.endDateInput = null;
        this.modal = null;
        this.statsCurrentDate = null; // Datum zur Steuerung der Ansicht
        this.form = null;
        this.searchInput = null;
        this.showCancelledCheckbox = null;
        // NEU: Gekapselte Analyse-Ansicht
        this.detailsContainer = null;
        this.toggleDetailsCheckbox = null;
        this.calendarWeekStartDate = null;
        this.showPastToggle = null;
        this.initialized = false;
        this.currentUserId = null;
        this.allAppointments = []; // All appointments fetched for the 3-month range
        this.searchFilteredAppointments = []; // Appointments filtered by search text
        this.dateAndSearchFilteredAppointments = []; // Appointments filtered by search text AND date range
        this.currentTab = 'umsatz';
        this.downline = [];
        this.sortColumn = 'Datum';
        this.sortDirection = 'desc';
        this.filterText = '';
        this.statsChartMode = 'employee';
        this.weekCalendarSlotHeight = 40; // Default slot height in pixels
        this.showCancelled = false;
        // NEU: Sortierkonfiguration für die Infoabend-Tabelle
        this.infoabendSortConfig = {
            column: 'Terminpartner', direction: 'asc'
        };
    }

    // NEU: Methode zum Initialisieren der globalen Modal-Elemente und Listener
    _initSharedElementsAndListeners() {
        this.modal = document.getElementById('appointment-modal');
        this.form = document.getElementById('appointment-form');
        if (!this.modal || !this.form) {
            appointmentsLog('!!! FEHLER: Termin-Modal-Elemente nicht im DOM gefunden.');
            return;
        }
        document.getElementById('close-appointment-modal-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-appointment-btn').addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.closeModal(); });

        // NEU: Listener für das BT-Folge-Modal
        this.btFollowUpModal = document.getElementById('bt-follow-up-modal');
        this.btFollowUpForm = document.getElementById('bt-follow-up-form');
        document.getElementById('cancel-bt-follow-up-btn').addEventListener('click', () => {
            // KORREKTUR: Body-Scroll wieder aktivieren, wenn das Modal geschlossen wird.
            document.body.classList.remove('modal-open');
            // KORREKTUR: Bei "Später entscheiden" wird das Modal geschlossen, OHNE den Status des AT zu ändern.
            // Die fetchAndRender() Funktion wird nicht aufgerufen, der alte Zustand bleibt.
            this.btFollowUpModal.classList.remove('visible');
            // KORREKTUR: Body-Scroll wieder aktivieren, wenn das Modal geschlossen wird.
            document.documentElement.classList.remove('modal-open');

        });
        this.btFollowUpModal.querySelectorAll('input[name="bt_follow_up_action"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this._toggleBtFollowUpSections(e.target.value);
            });
        });
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Event Listener für den Absage-Toggle im Modal, um das Grund-Feld sofort anzuzeigen/auszublenden.
        const cancellationToggle = this.form.querySelector('#appointment-cancellation');
        const cancellationReasonContainer = this.form.querySelector('#appointment-cancellation-reason-container');
        if (cancellationToggle && cancellationReasonContainer) {
            cancellationToggle.addEventListener('change', () => {
                cancellationReasonContainer.classList.toggle('hidden', !cancellationToggle.checked);
            });
        }

        // NEU: Event-Listener, der auf Änderungen der Kategorie reagiert.
        const categorySelect = this.form.querySelector('#appointment-category');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => this._handleCategoryChange(e.target.value));
        }

        // NEU: Listener für das BT-Folge-Formular
        if (this.btFollowUpForm) {
            this.btFollowUpForm.addEventListener('submit', (e) => this._handleBtFollowUpSubmit(e));
        }
    }
    // Hilfsmethode, um DOM-Elemente zu holen, wird von init() aufgerufen.
    _getDomElements() {
        this.statsChartTitle = document.getElementById('stats-chart-title');
        this.statsPieChartContainer = document.getElementById('stats-pie-chart-container');
        this.statsPieChartLegend = document.getElementById('stats-pie-chart-legend');
        this.statsByEmployeeBtn = document.getElementById('stats-by-employee-btn');
        this.statsScopeFilter = document.getElementById('appointments-scope-filter');
        // NEU: Gruppenfilter
        this.groupFilterContainer = document.getElementById('appointments-group-filter-container');
        this.groupFilterBtn = document.getElementById('appointments-group-filter-btn');
        this.groupFilterPanel = document.getElementById('appointments-group-filter-panel');

        this.statsCategoryFilterBtn = document.getElementById('stats-category-filter-btn');
        this.statsCategoryFilterPanel = document.getElementById('stats-category-filter-panel');
        this.statsMonthTimeline = document.getElementById('stats-month-timeline');
        this.statsPeriodDisplay = document.getElementById('stats-period-display');
        this.statsNavPrevBtn = document.getElementById('stats-nav-prev-btn');
        this.statsNavNextBtn = document.getElementById('stats-nav-next-btn');
        this.statsViewTimelineBtn = document.getElementById('stats-view-timeline-btn');
        this.statsViewWeekBtn = document.getElementById('stats-view-week-btn');
        this.statsViewTableBtn = document.getElementById('stats-view-table-btn');
        this.statsViewInfoBtn = document.getElementById('stats-view-info-btn'); // NEU
        this.statsTimelineView = document.getElementById('stats-timeline-view');
        this.statsWeekView = document.getElementById('stats-week-view');
        this.statsTableView = document.getElementById('stats-table-view');
        this.naechstesInfoView = document.getElementById('naechstes-info-view'); // NEU
        this.infoabendDateSelect = document.getElementById('infoabend-date-select');
        this.infoabendShowCancelled = document.getElementById('infoabend-show-cancelled');
        this.infoabendListContainer = document.getElementById('infoabend-list-container');
        this.funnelChartContainer = document.getElementById('funnel-chart-container');
        this.mainFilterContainer = document.getElementById('appointments-main-filter-container');
        this.analysisContainer = document.getElementById('analysis-container'); // NEU
        this.statsByStatusBtn = document.getElementById('stats-by-status-btn');
        this.outstandingAppointmentsSection = document.getElementById('outstanding-appointments-section');
        this.outstandingAppointmentsList = document.getElementById('outstanding-appointments-list');
        this.prognosisDetailsContainer = document.getElementById('prognosis-details-container');
        this.startDateInput = document.getElementById('appointments-start-date');
        this.endDateInput = document.getElementById('appointments-end-date');
        this.searchInput = document.getElementById('appointments-search-filter');
        // NEU: Gekapselte Analyse-Ansicht
        this.toggleAnalysisBtn = document.getElementById('toggle-analysis-visibility-btn');
        this.analysisContent = document.getElementById('analysis-content');
        this.statsViewPane = document.getElementById('stats-view-pane');
        this.heatmapViewPane = document.getElementById('heatmap-view-pane');
        this.statsTab = document.getElementById('analysis-stats-tab');
        this.heatmapTab = document.getElementById('analysis-heatmap-tab');
        this.heatmapGrid = document.getElementById('heatmap-grid');
        // NEU: Wochenkalender
        this.weekNavPrevBtn = document.getElementById('week-nav-prev-btn');
        this.weekNavNextBtn = document.getElementById('week-nav-next-btn');
        this.weekPeriodDisplay = document.getElementById('week-period-display');
        this.weekCalendarViewModeSelect = document.getElementById('week-calendar-view-mode-select');
        this.weekCalendarUserSelectContainer = document.getElementById('week-calendar-user-select-container');
        this.weekCalendarUserSelect = document.getElementById('week-calendar-user-select');
        this.weekCalendarBody = document.getElementById('week-calendar-body');
        this.weekCalendarHeader = document.getElementById('week-calendar-header');
        // NEU: Zoom-Buttons
        this.weekZoomInBtn = document.getElementById('week-zoom-in-btn');
        this.weekZoomOutBtn = document.getElementById('week-zoom-out-btn');
        return this.statsPieChartContainer && this.prognosisDetailsContainer && this.startDateInput && this.endDateInput && this.searchInput && this.toggleAnalysisBtn && this.analysisContent && this.statsViewPane && this.heatmapViewPane && this.statsTab && this.heatmapTab && this.heatmapGrid && this.statsScopeFilter && this.statsCategoryFilterBtn && this.statsCategoryFilterPanel && this.statsMonthTimeline && this.statsPeriodDisplay && this.statsNavPrevBtn && this.statsNavNextBtn && this.outstandingAppointmentsSection && this.outstandingAppointmentsList && this.statsViewTimelineBtn && this.statsViewTableBtn && this.statsTimelineView && this.statsTableView && this.statsViewInfoBtn && this.naechstesInfoView && this.groupFilterContainer && this.mainFilterContainer && this.analysisContainer && this.statsWeekView && this.weekCalendarViewModeSelect && this.weekZoomInBtn && this.weekZoomOutBtn;
    }

    async init(userId) {
        appointmentsLog(`Modul wird initialisiert für User-ID: ${userId}`);
        this.currentUserId = userId;
        
        if (!this._getDomElements()) {
            appointmentsLog('!!! FEHLER: Benötigte DOM-Elemente für die Termin-Ansicht wurden nicht gefunden.');
            return;
        }

        // NEU: Startdatum für die Statistik-Ansicht initialisieren
        this.statsCurrentDate = getCurrentDate();
        this.statsCurrentDate.setHours(0, 0, 0, 0);
        // NEU: Lade die gespeicherte Slot-Höhe oder verwende den Standardwert
        this.weekCalendarSlotHeight = loadUiSetting('weekCalendarSlotHeight', 40);
        // NEU: Kalender auf die aktuelle Woche initialisieren
        const today = getCurrentDate();
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        this.calendarWeekStartDate = new Date(startOfWeek.setDate(diff));
        this.calendarWeekStartDate.setHours(0, 0, 0, 0);

        // KORREKTUR: Standard-Datum auf aktuellen Umsatzmonat (Geschäftszyklus) setzen
        const { startDate, endDate } = getMonthlyCycleDates();
        this.startDateInput.value = startDate.toISOString().split('T')[0];
        this.endDateInput.value = endDate.toISOString().split('T')[0];

        this.downline = SKT_APP.getAllSubordinatesRecursive(this.currentUserId);

        // KORREKTUR: Das zweite Dropdown wird jetzt ausgeblendet, da es nicht mehr benötigt wird.
        if (this.weekCalendarViewModeSelect) this.weekCalendarViewModeSelect.parentElement.classList.add('hidden');

        // KORREKTUR: Das Haupt-Dropdown wird jetzt dynamisch befüllt, um "Kalender von..." zu integrieren.
        const isLeader = SKT_APP.isUserLeader(SKT_APP.authenticatedUserData);
        const savedScope = loadUiSetting('appointmentsScope', isLeader ? 'group' : 'personal');
        this.statsScopeFilter.innerHTML = '';
        const scopeOptions = [
            { value: 'personal', text: 'Meine Termine' },
            { value: 'group', text: 'Meine Gruppe' },
            { value: 'structure', text: 'Meine Struktur' },
            { value: 'user_select', text: 'Kalender von...' }
        ];
        scopeOptions.forEach(opt => {
            if (opt.value === 'personal' || opt.value === 'user_select' || isLeader) {
                this.statsScopeFilter.add(new Option(opt.text, opt.value));
            }
        });
        this.statsScopeFilter.value = savedScope;

        this.statsScopeFilter.classList.toggle('hidden', !isLeader); // isLeader ist bereits oben deklariert
        
        // KORREKTUR: Logik überarbeitet, um zuerst den Scope zu bestimmen und dann die UI zu aktualisieren
        // 1. Bestimme den finalen Scope (aus Pending-Wert oder aus LocalStorage)
        if (pendingAppointmentScope) {
            this.statsScopeFilter.value = pendingAppointmentScope;
            pendingAppointmentScope = null;
        } else {
            this.statsScopeFilter.value = loadUiSetting('appointmentsScope', isLeader ? 'group' : 'personal');
        }
        const finalScope = this.statsScopeFilter.value;
        
        // 2. Aktualisiere die UI basierend auf dem finalen Scope
        this.groupFilterContainer.classList.toggle('hidden', !isLeader || finalScope !== 'structure');
        if (isLeader && finalScope === 'structure') {
            this._populateGroupFilter(true);
            // Prüfe, ob eine Gruppe aus einer anderen Ansicht vorausgewählt werden soll.
            if (pendingAppointmentGroupFilter) {
                this.groupFilterPanel.querySelectorAll('input:checked').forEach(cb => cb.checked = false);
                const checkbox = this.groupFilterPanel.querySelector(`input[value="${pendingAppointmentGroupFilter}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
                pendingAppointmentGroupFilter = null;
            }
        }
        // KORREKTUR: Zeige das "Benutzer auswählen"-Dropdown, wenn "Kalender von..." ausgewählt ist.
        if (this.weekCalendarUserSelectContainer) {
            this.weekCalendarUserSelectContainer.classList.toggle('hidden', finalScope !== 'user_select');
        }

        // 3. Verarbeite andere Pending-Werte
        if (pendingAppointmentFilter) {
            this.filterText = pendingAppointmentFilter;
            if (this.searchInput) {
                this.searchInput.value = pendingAppointmentFilter;
            }
            pendingAppointmentFilter = null;
        } else {
            this.filterText = '';
            if (this.searchInput) this.searchInput.value = '';
        }

        if (pendingAppointmentViewMode) {
            this._switchStatsView(pendingAppointmentViewMode);
            pendingAppointmentViewMode = null;

        }
        this._populateCategoryFilter(); // KORREKTUR: Reihenfolge getauscht

        // Die Event-Listener müssen bei jeder Initialisierung neu gesetzt werden,
        // da der HTML-Inhalt der Ansicht dynamisch neu geladen wird.
        this.setupEventListeners();
        const user = SKT_APP.findRowById('mitarbeiter', this.currentUserId);
        if (user) {
            const titleElement = document.getElementById('appointments-title'); // Titel wird jetzt dynamischer
            if (titleElement) {
                titleElement.textContent = `Terminübersicht`;
            }

        }

        await this.fetchAndRender();
    }


    async fetchAndRender() {
        appointmentsLog('--- START: fetchAndRender ---');
        try { // KORREKTUR: Kopie erstellen, um Seiteneffekte zu vermeiden.
            const scope = this.statsScopeFilter.value;
            let userIds = new Set();

            // NEU: Logik zur Sammlung von Benutzer-IDs basierend auf Scope und Gruppenfilter.
            // 'user_select' muss zuerst behandelt werden, da es alle potenziellen Benutzer für den Wochenkalender laden muss.
            if (scope === 'user_select') {
                const me = SKT_APP.authenticatedUserData;
                const myStructure = SKT_APP.getAllSubordinatesRecursive(me._id);
                const manager = me.Werber ? SKT_APP.findRowById('mitarbeiter', me.Werber) : null;
                userIds.add(me._id);
                myStructure.forEach(u => userIds.add(u._id));
                if (manager && manager.Status !== 'Ausgeschieden') {
                    userIds.add(manager._id);
                }
            } else if (scope === 'structure') {
                // NEU: Stelle sicher, dass die eigenen Termine immer in der Strukturansicht enthalten sind.
                userIds.add(this.currentUserId);
                const selectedLeaderIds = Array.from(this.groupFilterPanel.querySelectorAll('input:checked')).map(cb => cb.value);
                if (selectedLeaderIds.length > 0) {
                    // Wenn bestimmte Gruppen ausgewählt sind, nur deren Mitglieder laden
                    selectedLeaderIds.forEach(leaderId => {
                        userIds.add(leaderId);
                        SKT_APP.getSubordinates(leaderId, 'gruppe').forEach(u => userIds.add(u._id));
                    });
                } else {
                    // Wenn keine Gruppe ausgewählt ist, die gesamte Struktur laden
                    this.downline.forEach(u => userIds.add(u._id));
                }
            } else if (scope === 'group') {
                userIds.add(this.currentUserId);
                SKT_APP.getSubordinates(this.currentUserId, 'gruppe').forEach(u => userIds.add(u._id));
            } else { // personal
                userIds.add(this.currentUserId);
            }

            // Fallback, falls die Logik oben fehlschlägt
            if (userIds.size === 0) {
                switch (scope) {
                    case 'personal': userIds.add(this.currentUserId); break;
                    case 'group': userIds.add(this.currentUserId); SKT_APP.getSubordinates(this.currentUserId, 'gruppe').forEach(u => userIds.add(u._id)); break;
                    case 'structure':
                    const structureUserIds = [this.currentUserId, ...this.downline.map(u => u._id)];
                    structureUserIds.forEach(id => userIds.add(id));
                    break;
                }
            }

            if (userIds.size === 0) {
                this.allAppointments = [];
                this.render();
                return;
            }

            const userNames = Array.from(userIds).map(id => SKT_APP.findRowById('mitarbeiter', id)?.Name).filter(Boolean);
            appointmentsLog(`2. Lade Termine für ${userNames.length} Mitarbeiter (Scope: ${scope})`);
            
            const promises = [];
            const allFetchedAppointments = [];

            // NEUE LOGIK V2: Um das Limit der IN-Klausel und das 10k-Zeilen-Limit zu umgehen,
            // werden die Abfragen nach Benutzern aufgeteilt.
            const userNamesArray = Array.from(userNames);
            const chunkSize = 50; // 50 Benutzer pro Abfrage

            // NEU: Bestimme den gesamten benötigten Datumsbereich, um sowohl den Filter als auch den Kalender abzudecken.
            const { startDate: cycleStartDate, endDate: cycleEndDate } = getMonthlyCycleDates();
            const filterStartDate = new Date(this.startDateInput.value);
            const filterEndDate = new Date(this.endDateInput.value);
            const overallStartDate = new Date(Math.min(cycleStartDate, filterStartDate));
            const overallEndDate = new Date(Math.max(cycleEndDate, filterEndDate));
            const overallStartDateIso = overallStartDate.toISOString().split('T')[0];
            const overallEndDateIso = overallEndDate.toISOString().split('T')[0];
            
            // KORREKTUR: `userAppointments` war nicht definiert. Filtere die global geladenen Termine nach den relevanten Benutzern.
            // KORREKTUR: Auch Termine, bei denen der Benutzer eingeladen ist, müssen berücksichtigt werden.
            const userAppointments = db.termine.filter(t => userIds.has(t.Mitarbeiter_ID) || userIds.has(t.Eingeladener));
            // 5. Find outstanding appointments that might be outside the date range
            const today = new Date(getCurrentDate());
            today.setHours(0, 0, 0, 0);
            const outstandingAppointments = userAppointments.filter(t => {
                if (!t.Datum || t.Status !== 'Ausgemacht' || t.Absage === true) return false;
                const terminDate = new Date(t.Datum);
                return terminDate < today;
            });

            // 6. Combine, deduplicate, and sort
            const combinedAppointments = _.uniqBy([...userAppointments, ...outstandingAppointments], '_id');
            this.allAppointments = combinedAppointments.sort((a, b) => new Date(b.Datum) - new Date(a.Datum));

            appointmentsLog('6. Rufe render() auf, um die Termine anzuzeigen.');
            this.render();
        } catch (error) {
            appointmentsLog('!!! FEHLER in fetchAndRender !!!', error);
            const errorHtml = `<div class="text-center py-16"><i class="fas fa-exclamation-triangle fa-4x text-red-400 mb-4"></i><h3 class="text-xl font-semibold text-skt-blue">Ein Fehler ist aufgetreten</h3><p class="text-gray-500 mt-2">${error.message}</p></div>`;
            
            // Display error in the currently active view container
            if (this.statsTimelineView && !this.statsTimelineView.classList.contains('hidden')) {
                this.statsTimelineView.innerHTML = errorHtml;
            } else if (this.statsWeekView && !this.statsWeekView.classList.contains('hidden')) {
                this.statsWeekView.innerHTML = errorHtml;
            } else if (this.statsTableView && !this.statsTableView.classList.contains('hidden')) {
                this.statsTableView.innerHTML = errorHtml;
            } else if (this.naechstesInfoView && !this.naechstesInfoView.classList.contains('hidden')) {
                this.naechstesInfoView.innerHTML = errorHtml;
            } else {
                // Fallback if no view is active (should not happen)
                if (this.statsTimelineView) this.statsTimelineView.innerHTML = errorHtml;
                console.error("Could not find an active view to display the error in.");
            }
        }
        appointmentsLog('--- ENDE: fetchAndRender ---');
    }

    render() {
        appointmentsLog('--- START: render ---');

        // 1. Filter by search text
        this.searchFilteredAppointments = this.allAppointments.filter(t => {
            if (this.filterText) {
                const searchText = this.filterText.toLowerCase();
                const partner = (t.Terminpartner || '').toLowerCase();
                const mitarbeiterName = findRowById('mitarbeiter', t.Mitarbeiter_ID)?.Name || '';
                const mitarbeiter = mitarbeiterName.toLowerCase();
                if (!partner.includes(searchText) && !mitarbeiter.includes(searchText)) {
                    return false;
                }
            }
            return true;
        });

        // 2. Filter by date
        const filterStartDate = new Date(this.startDateInput.value);
        filterStartDate.setHours(0, 0, 0, 0);
        const filterEndDate = new Date(this.endDateInput.value);
        filterEndDate.setHours(23, 59, 59, 999);

        this.dateAndSearchFilteredAppointments = this.searchFilteredAppointments.filter(t => {
            if (t.Datum) {
                const terminDate = new Date(t.Datum);
                return terminDate >= filterStartDate && terminDate <= filterEndDate;
            }
            return false;
        });

        this._renderAppointmentStats(this.dateAndSearchFilteredAppointments);
        this._renderOutstandingAppointments();
        this._renderStatsChart();
        this._renderPrognosisDetails();
        this._setupCategoryFilterButtons(); // NEU: Stellt sicher, dass die Buttons im Filter-Panel vorhanden sind.
        this._renderHeatmap();
        // NEU: Wenn die Info-Ansicht aktiv ist, muss sie ebenfalls neu gerendert werden,
        // da sie vom Haupt-Scope-Filter abhängt.
        if (this.naechstesInfoView && !this.naechstesInfoView.classList.contains('hidden')) {
            this.renderNaechstesInfo();
        }
    }

    setupEventListeners() {
        // KORREKTUR: Filter-Änderungen rufen nur noch render() auf, nicht mehr fetchAndRender().
        // KORREKTUR VOM 25.07: Muss fetchAndRender aufrufen, damit auch Zeiträume außerhalb des initialen 3-Monats-Fensters geladen werden.
        const debouncedFetchAndRender = _.debounce(() => this.fetchAndRender(), 350);
        this.startDateInput.addEventListener('change', debouncedFetchAndRender);
        this.endDateInput.addEventListener('change', debouncedFetchAndRender);
        this.searchInput.addEventListener('input', _.debounce(e => {
            this.filterText = e.target.value; this.render();
        }, 350));
        // KORREKTUR: Navigation für Timeline
        this.statsNavPrevBtn.addEventListener('click', () => this._navigateStats(-1));
        this.statsNavNextBtn.addEventListener('click', () => this._navigateStats(1));
        this.statsPeriodDisplay.addEventListener('click', () => this._scrollToTodayInTimeline());
        this.statsViewInfoBtn.addEventListener('click', () => this._switchStatsView('info')); // NEU

        // NEU: Event Listener für den dynamischen Skalierungseffekt beim Scrollen
        this.statsMonthTimeline.addEventListener('scroll', _.throttle(() => {
            this._updateCardScales();
        }, 50));
        
        this.statsViewTimelineBtn.addEventListener('click', () => this._switchStatsView('timeline'));
        this.statsViewWeekBtn.addEventListener('click', () => this._switchStatsView('week'));
        this.statsViewTableBtn.addEventListener('click', () => this._switchStatsView('table'));

        // NEU: Event Listener für das Dropdown
        this.statsCategoryFilterBtn.addEventListener('click', (e) => {
            // KORREKTUR: Der Hauptbutton öffnet/schließt nur noch das Menü.
            e.stopPropagation();
            this.statsCategoryFilterPanel.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!this.statsCategoryFilterPanel.classList.contains('hidden') && !this.statsCategoryFilterPanel.contains(e.target) && !this.statsCategoryFilterBtn.contains(e.target)) {
                this.statsCategoryFilterPanel.classList.add('hidden');
                this._renderAppointmentStats(); // Filter anwenden
            }
        });
        
        // NEU: Erweiterter Event-Listener für den Scope-Filter
        this.statsScopeFilter.addEventListener('change', () => {
            const scope = this.statsScopeFilter.value;
            saveUiSetting('appointmentsScope', scope); // Einstellung speichern
            // KORREKTUR: Gruppenfilter nur bei 'structure' anzeigen und neu befüllen.
            const isLeader = SKT_APP.isUserLeader(SKT_APP.authenticatedUserData);
            this.groupFilterContainer.classList.toggle('hidden', !isLeader || scope !== 'structure');
            if (isLeader && scope === 'structure') {
                this._populateGroupFilter(true);
            }
            // NEU: Wenn "Kalender von..." ausgewählt wird, zur Wochenansicht wechseln.
            if (scope === 'user_select') {
                this._switchStatsView('week');
            }
            
            // KORREKTUR: Zeige das "Benutzer auswählen"-Dropdown, wenn "Kalender von..." ausgewählt ist.
            if (this.weekCalendarUserSelectContainer) {
                this.weekCalendarUserSelectContainer.classList.toggle('hidden', scope !== 'user_select');
            }
            this.fetchAndRender(); // Daten bei jeder Änderung neu laden
        });

        if (this.showCancelledToggle) this.showCancelledToggle.addEventListener('change', () => this.render());

        // KORREKTUR: Event-Listener für die Statistik-Chart-Umschaltung wiederhergestellt
        this.statsByEmployeeBtn.addEventListener('click', () => { this.statsChartMode = 'employee'; this._updateStatsToggleButtons(); this._renderStatsChart(); });
        this.statsByStatusBtn.addEventListener('click', () => { this.statsChartMode = 'status'; this._updateStatsToggleButtons(); this._renderStatsChart(); });

        // Listener für den "Neuen Termin anlegen" Button, der sich in der dynamisch geladenen appointments.html befindet.
        document.getElementById('add-appointment-btn-stats').addEventListener('click', () => this.openModal());

        // Event Listener für den Analyse-Container und die Tabs
        this.toggleAnalysisBtn.addEventListener('click', () => this._toggleCollapsible(this.analysisContent, this.toggleAnalysisBtn));
        this.statsTab.addEventListener('click', () => this._switchAnalysisTab('stats'));
        this.heatmapTab.addEventListener('click', () => this._switchAnalysisTab('heatmap'));

        // NEU: Event-Listener für die "Nächstes Info"-Ansicht
        this.infoabendDateSelect.addEventListener('change', () => this.renderNaechstesInfo());
        this.infoabendShowCancelled.addEventListener('change', () => this.renderNaechstesInfo());

        // NEU: Event-Listener für den Wochenkalender (einmalig hier setzen)
        this.weekNavPrevBtn.addEventListener('click', () => this._navigateWeekCalendar(-7));
        this.weekNavNextBtn.addEventListener('click', () => this._navigateWeekCalendar(7));
        this.weekPeriodDisplay.addEventListener('click', () => this._resetWeekCalendarToToday());
        // Der `weekCalendarViewModeSelect` wird nicht mehr verwendet, der Listener ist am Haupt-Scope-Filter.
        this.weekCalendarUserSelect.addEventListener('change', () => this._renderWeekCalendar());

        // NEU: Event-Listener für Zoom-Buttons
        this.weekZoomInBtn.addEventListener('click', () => this._zoomWeekCalendar(5));
        this.weekZoomOutBtn.addEventListener('click', () => this._zoomWeekCalendar(-5));
    }

    _updateStatusDropdown(category, currentStatus = null) {
        const statusSelect = this.form.querySelector('#appointment-status');
        const oldValue = currentStatus || statusSelect.value;
        statusSelect.innerHTML = '';

        const terminMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'termine');
        const allStatuses = terminMeta.columns.find(c => c.name === 'Status').data.options.map(o => o.name);
      //GROSSBUCHSTABEN! Also Weiterer ET, Weiterer BT, Offen, Verschoben usw.
        const baseStati = ['Ausgemacht', 'Gehalten', 'Verschoben', 'Offen'];
        let allowedStati = [...baseStati];

        if (category === 'BT') {
            allowedStati.push('Weiterer BT');
        } else if (category === 'ET') {
            allowedStati.push('Weiterer ET', 'Info Eingeladen', 'Info Bestätigt', 'Info Anwesend', 'Wird Mitarbeiter');
        } else if (category === 'Immo') {
            allowedStati.push('AV Termin', 'Besichtigung', 'Kredittermin');
        }
        
        // KORREKTUR: Der Status "Storno" wird nicht mehr zur Auswahl angeboten, da dies über die "Absage"-Checkbox gehandhabt wird.
        const finalStati = allStatuses.filter(s => allowedStati.includes(s));
        finalStati.forEach(stat => statusSelect.add(new Option(stat, stat)));

        if (finalStati.includes(oldValue)) {
            statusSelect.value = oldValue;
        }
    }

    _navigateStats(months) {
        const newDate = new Date(this.statsCurrentDate);
        newDate.setDate(1); // Springe zum Ersten des Monats, um Fehler bei Monatslängen zu vermeiden
        newDate.setMonth(newDate.getMonth() + months);
        this.statsCurrentDate = newDate;
        // KORREKTUR: Rendert die Ansicht für den neuen Monat neu, anstatt nur zu scrollen.
        this._renderAppointmentStats(this.dateAndSearchFilteredAppointments);
    }

    _resetStatsToToday() {
        this.statsCurrentDate = getCurrentDate();
        this._renderAppointmentStats();
    }

    _updateCardScales() {
        const timelineRect = this.statsMonthTimeline.getBoundingClientRect();
        const timelineCenter = timelineRect.left + timelineRect.width / 2;
        this.statsMonthTimeline.querySelectorAll('.day-card').forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(timelineCenter - cardCenter);
            const scale = Math.max(0.8, 1 - (distance / timelineRect.width) * 0.6);
            card.style.transform = `scale(${scale})`;
        });
    }

    _getCenterCard() {
        const timelineRect = this.statsMonthTimeline.getBoundingClientRect();
        const timelineCenter = timelineRect.left + timelineRect.width / 2;
        let closestCard = null;
        let smallestDistance = Infinity;
        this.statsMonthTimeline.querySelectorAll('.day-card').forEach(card => {
            const cardCenter = card.getBoundingClientRect().left + card.getBoundingClientRect().width / 2;
            const distance = Math.abs(timelineCenter - cardCenter);
            if (distance < smallestDistance) { smallestDistance = distance; closestCard = card; }
        });
        return closestCard;
    }


    _scrollToTodayInTimeline() {
        const todayEl = this.statsMonthTimeline.querySelector('.is-today');
        if (todayEl) todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    _switchStatsView(view) {
        this.statsTimelineView.classList.toggle('hidden', view !== 'timeline');
        this.statsWeekView.classList.toggle('hidden', view !== 'week');
        this.statsTableView.classList.toggle('hidden', view !== 'table');
        this.naechstesInfoView.classList.toggle('hidden', view !== 'info');

        // NEU: Hauptfilter-Maske ausblenden, wenn die Info-Ansicht aktiv ist.
        if (this.mainFilterContainer) {
            this.mainFilterContainer.classList.toggle('hidden', view === 'info' || view === 'week');
        }

        // NEU: Analyse-Container ausblenden, wenn die Info-Ansicht aktiv ist.
        if (this.analysisContainer) {
            this.analysisContainer.classList.toggle('hidden', view === 'info' || view === 'week');
        }

        this.statsViewTimelineBtn.classList.toggle('active', view === 'timeline');
        this.statsViewWeekBtn.classList.toggle('active', view === 'week');
        this.statsViewTableBtn.classList.toggle('active', view === 'table');
        this.statsViewInfoBtn.classList.toggle('active', view === 'info');

        // NEU: "Kalender von..."-Option nur in der Wochenansicht anzeigen.
        const userSelectOption = this.statsScopeFilter.querySelector('option[value="user_select"]');
        if (userSelectOption) {
            userSelectOption.hidden = (view !== 'week');
        }

        // Wenn die Ansicht gewechselt wird und "Kalender von..." ausgewählt war, auf "Meine Termine" zurücksetzen.
        if (view !== 'week' && this.statsScopeFilter.value === 'user_select') {
            this.statsScopeFilter.value = 'personal';
            this.statsScopeFilter.dispatchEvent(new Event('change')); // Stellt sicher, dass die Daten neu geladen werden.
        }

        if (view === 'info') {
            this.renderNaechstesInfo(true); // true to repopulate dates
        } else if (view === 'week') {
            this._populateWeekCalendarViewModeSelect();
            this._populateWeekCalendarUserSelect();
            this._handleViewModeChange(); // Setzt die initiale Sichtbarkeit und rendert den Kalender

            // Event-Listener für den neuen Kalender
            this.weekNavPrevBtn.addEventListener('click', () => this._navigateWeekCalendar(-7));
            this.weekNavNextBtn.addEventListener('click', () => this._navigateWeekCalendar(7));
            this.weekPeriodDisplay.addEventListener('click', () => this._resetWeekCalendarToToday());
            this.weekCalendarViewModeSelect.addEventListener('change', () => this._handleViewModeChange());
            this.weekCalendarUserSelect.addEventListener('change', () => this._renderWeekCalendar());
        }
    }

    // NEU: Hilfsfunktion, die auf Änderungen im Haupt-Kalender-Dropdown reagiert.
    _handleViewModeChange() {
        const selectedMode = this.weekCalendarViewModeSelect.value;
        saveUiSetting('weekCalendarViewMode', selectedMode); // Präferenz speichern

        const showUserSelect = selectedMode === 'user_select';
        this.weekCalendarUserSelectContainer.classList.toggle('hidden', !showUserSelect);

        // Kalender nach jeder Änderung neu rendern
            this._renderWeekCalendar();
    }


    _populateCategoryFilter() {
        const terminMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'termine');
        if (!terminMeta) return;

        const categoryColumn = terminMeta.columns.find(c => c.name === 'Kategorie');
        if (!categoryColumn || !categoryColumn.data || !categoryColumn.data.options) return;

        this.statsCategoryFilterPanel.innerHTML = '';
        const categories = categoryColumn.data.options.map(o => o.name);
        
        const relevantCategories = ['AT', 'BT', 'ST', 'ET', 'Immo', 'NT'];
        const specialCategories = ['PG', 'Sonstiges'];

        const createCheckbox = (label, value, isChecked = false) => {
            const wrapper = document.createElement('label');
            wrapper.className = 'flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'h-5 w-5 rounded border-gray-300 text-skt-blue focus:ring-skt-blue-light';
            checkbox.value = value;
            checkbox.checked = isChecked; // KORREKTUR: Der Event-Listener muss über die Instanz aufgerufen werden, um den korrekten Kontext sicherzustellen.
            checkbox.addEventListener('change', () => {
                appointmentsViewInstance._renderAppointmentStats(appointmentsViewInstance.dateAndSearchFilteredAppointments);
            });
            const span = document.createElement('span');
            span.textContent = label;
            wrapper.appendChild(checkbox);
            wrapper.appendChild(span);
            this.statsCategoryFilterPanel.appendChild(wrapper);        };

        categories.filter(cat => [...relevantCategories, ...specialCategories].includes(cat)).forEach(cat => {
            const isDefaultVisible = relevantCategories.includes(cat);
            createCheckbox(cat, cat, isDefaultVisible);
        });

        // Buttons für "Alle auswählen" und "Alle entfernen" wurden entfernt.
        // NEU: "Abgesagte einblenden" Toggle hier hinzufügen
        const togglesWrapper = document.createElement('div');
        togglesWrapper.className = 'border-t border-gray-200 mt-4 pt-4 space-y-3';
        togglesWrapper.innerHTML = `
            <label for="appointments-show-cancelled" class="flex items-center space-x-3 cursor-pointer">
                <div class="toggle-switch">
                    <input type="checkbox" id="appointments-show-cancelled" class="sr-only peer">
                    <div class="toggle-slider"></div>
                </div>
                <span class="text-sm font-medium text-gray-700">Abgesagte einblenden</span>
            </label>
            <label for="appointments-show-held" class="flex items-center space-x-3 cursor-pointer">
                <div class="toggle-switch">
                    <input type="checkbox" id="appointments-show-held" class="sr-only peer">
                    <div class="toggle-slider"></div>
                </div>
                <span class="text-sm font-medium text-gray-700">Gehaltene anzeigen</span>
            </label>
        `;
        this.statsCategoryFilterPanel.appendChild(togglesWrapper);
        
        // KORREKTUR: Der Event-Listener wird direkt hier gesetzt, um sicherzustellen, dass er immer existiert.
        const cancelledToggle = document.getElementById('appointments-show-cancelled');
        if (cancelledToggle) cancelledToggle.addEventListener('change', () => {
            // KORREKTUR: Der Aufruf muss über die Instanz erfolgen.
            appointmentsViewInstance._renderAppointmentStats(appointmentsViewInstance.dateAndSearchFilteredAppointments);
        });

        const heldToggle = document.getElementById('appointments-show-held');
        if (heldToggle) heldToggle.addEventListener('change', () => appointmentsViewInstance._renderAppointmentStats(appointmentsViewInstance.dateAndSearchFilteredAppointments));

        const headerWrapper = document.createElement('div');
        headerWrapper.className = 'flex justify-between items-center mb-2';
        headerWrapper.innerHTML = `<h4 class="font-semibold text-skt-blue">Kategorien</h4>`;

        this.statsCategoryFilterPanel.insertBefore(headerWrapper, this.statsCategoryFilterPanel.firstChild);
    }
    _setupCategoryFilterButtons() {
        // NEU: Buttons für "Alle auswählen" und "Alle entfernen" mit verbessertem Design.
        const headerWrapper = this.statsCategoryFilterPanel.querySelector('.flex.justify-between.items-center');
        if (!headerWrapper || headerWrapper.querySelector('#select-all-cats')) return; // Verhindert doppeltes Hinzufügen

        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'flex items-center gap-2';
        actionsWrapper.innerHTML = `
            <button id="deselect-all-cats" class="p-1.5 h-7 w-7 flex items-center justify-center bg-red-100 text-skt-red-accent rounded-md hover:bg-red-200 transition-colors" title="Alle entfernen">
                <i class="fas fa-times"></i>
            </button>
            <button id="select-all-cats" class="p-1.5 h-7 w-7 flex items-center justify-center bg-green-100 text-skt-green-accent rounded-md hover:bg-green-200 transition-colors" title="Alle auswählen">
                <i class="fas fa-check"></i>
            </button>
        `;
        headerWrapper.appendChild(actionsWrapper);
        document.getElementById('select-all-cats').addEventListener('click', () => { this.statsCategoryFilterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true); this._renderAppointmentStats(); });
        document.getElementById('deselect-all-cats').addEventListener('click', () => { this.statsCategoryFilterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false); this._renderAppointmentStats(); });
    }

    // NEU: Funktion zum Befüllen des Gruppen-Filters
    _populateGroupFilter(show = true) { // KORREKTUR: Event-Listener für das Dropdown hier neu initialisieren
        this.groupFilterPanel.innerHTML = '';
        if (!show) return;
        
        // KORREKTUR: Die eigene Gruppe zur Auswahl hinzufügen, wenn man eine Führungskraft ist.
        let leaders = SKT_APP.getSubordinates(this.currentUserId, 'struktur');
        const currentUser = SKT_APP.findRowById('mitarbeiter', this.currentUserId);
        if (SKT_APP.isUserLeader(currentUser)) {
            if (!leaders.some(l => l._id === currentUser._id)) {
                leaders.unshift(currentUser);
            }
        }

        if (!leaders || leaders.length === 0) {
            this.groupFilterPanel.innerHTML = '<p class="text-xs text-gray-500 p-2">Keine Gruppen in deiner Struktur.</p>';
            return;
        }

        const createCheckbox = (label, value, isChecked = false) => {
            const wrapper = document.createElement('label');
            wrapper.className = 'flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'h-5 w-5 rounded border-gray-300 text-skt-blue focus:ring-skt-blue-light';
            checkbox.value = value;
            checkbox.checked = isChecked;
            checkbox.addEventListener('change', () => {
                this.fetchAndRender(); // Daten bei Änderung neu laden
            });
            const span = document.createElement('span');
            span.textContent = label;
            wrapper.appendChild(checkbox);
            wrapper.appendChild(span);
            this.groupFilterPanel.appendChild(wrapper);
        };

        leaders.forEach(leader => createCheckbox(leader.Name, leader._id, false)); // Standardmäßig nicht ausgewählt

        const headerWrapper = document.createElement('div');
        headerWrapper.className = 'flex justify-between items-center mb-2';
        headerWrapper.innerHTML = `
            <h4 class="font-semibold text-skt-blue">Gruppen</h4>
            <div class="flex items-center gap-2">
                <button id="deselect-all-groups" class="p-1.5 h-7 w-7 flex items-center justify-center bg-red-100 text-skt-red-accent rounded-md hover:bg-red-200 transition-colors" title="Alle entfernen">
                    <i class="fas fa-times"></i>
                </button>
                <button id="select-all-groups" class="p-1.5 h-7 w-7 flex items-center justify-center bg-green-100 text-skt-green-accent rounded-md hover:bg-green-200 transition-colors" title="Alle auswählen">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;
        this.groupFilterPanel.insertBefore(headerWrapper, this.groupFilterPanel.firstChild);

        // NEU: Event-Listener für die neuen Buttons
        document.getElementById('select-all-groups').addEventListener('click', () => { this.groupFilterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true); this.fetchAndRender(); });
        document.getElementById('deselect-all-groups').addEventListener('click', () => { this.groupFilterPanel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false); this.fetchAndRender(); });

        // KORREKTUR: Event-Listener für das Dropdown-Menü werden hier neu initialisiert,
        // um sicherzustellen, dass sie auch nach einem Ansichtswechsel funktionieren.
        const groupFilterBtn = document.getElementById('appointments-group-filter-btn');
        const groupFilterPanel = document.getElementById('appointments-group-filter-panel');
        if (groupFilterBtn && groupFilterPanel) {
            groupFilterBtn.onclick = (e) => { e.stopPropagation(); groupFilterPanel.classList.toggle('hidden'); };
            // NEU: Klick-Listener für das Schließen und Anwenden des Filters
            document.addEventListener('click', (e) => {
                if (!groupFilterPanel.classList.contains('hidden') && !groupFilterPanel.contains(e.target) && !groupFilterBtn.contains(e.target)) {
                    groupFilterPanel.classList.add('hidden');
                    this.fetchAndRender(); // Filter anwenden
                }
            });
        }
    }

    // NEU: Funktion zum Berechnen und Anzeigen der Termin-Statistiken
    _renderAppointmentStats() {
        // KORREKTUR: Diese Funktion filtert jetzt die Daten für jede Ansicht (Tabelle, Timeline, Woche)
        // selbst aus dem Pool der `searchFilteredAppointments`, anstatt vor-gefilterte Daten zu erhalten.
        // Dies stellt sicher, dass jede Ansicht immer auf den vollständigen, relevanten Datenpool zugreifen kann.
        const today = getCurrentDate();
        // KORREKTUR: Verwende die neue Hilfsfunktion, um den Zyklus für das navigierbare Datum zu erhalten.
        const { startDate: cycleStartDate, endDate: cycleEndDate } = getMonthlyCycleDatesForDate(this.statsCurrentDate);
        this.statsPeriodDisplay.textContent = cycleStartDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
        this._updateCategoryButtonText();
        // KORREKTUR: Die 'scope'-Variable muss hier definiert werden, damit sie in der Funktion verfügbar ist.
        const scope = this.statsScopeFilter.value;

        // --- Filter-Einstellungen ---
        // KORREKTUR: Der Button existiert nicht mehr, der Wert wird aus dem dynamisch erstellten Element gelesen.
        const showCancelledToggle = document.getElementById('appointments-show-cancelled');
        const showCancelled = showCancelledToggle ? showCancelledToggle.checked : false;
        const showHeldToggle = document.getElementById('appointments-show-held');
        const showHeld = showHeldToggle ? showHeldToggle.checked : false;
        const todayForFilter = new Date(today);
        todayForFilter.setHours(0, 0, 0, 0);

        // --- Gemeinsame Filterfunktionen ---
        const selectedCategories = this.statsCategoryFilterPanel
            ? Array.from(this.statsCategoryFilterPanel.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
            : [];
        this._updateCategoryButtonText();
        const categoryFilter = t => selectedCategories.length > 0 ? selectedCategories.includes(t.Kategorie) && t.Datum : true;
        const cancelledFilter = t => showCancelled || (t.Absage !== true && t.Status !== 'Storno');
        const heldStatuses = ['Gehalten', 'Info Eingeladen', 'Info Bestätigt', 'Info Anwesend'];
        const heldFilter = t => showHeld || !heldStatuses.includes(t.Status);

        // --- Daten für die Tabellenansicht vorbereiten ---
        const filterStartDate = new Date(this.startDateInput.value);
        const filterEndDate = new Date(this.endDateInput.value);
        const appointmentsForTableWithRecurrence = this._generateRecurringAppointments(this.searchFilteredAppointments, filterStartDate, filterEndDate);
        let finalAppointmentsForTable = appointmentsForTableWithRecurrence
            .filter(t => {
                if (!t.Datum) return false;
                const terminDate = new Date(t.Datum);
                return terminDate >= filterStartDate && terminDate <= filterEndDate;
            })
            .filter(categoryFilter)
            .filter(cancelledFilter)
            .filter(heldFilter);
        // --- Table View Logic ---
        const sortedAppointments = this._sortStatsTableData(finalAppointmentsForTable);
        this._renderStatsTable(sortedAppointments);

        // --- Daten für Wochenkalender vorbereiten ---
        const weekStart = new Date(this.calendarWeekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const appointmentsForWeekWithRecurrence = this._generateRecurringAppointments(this.searchFilteredAppointments, weekStart, weekEnd);
        const appointmentsForWeek = appointmentsForWeekWithRecurrence.filter(t => {
            if (!t.Datum) return false;
            const terminDate = new Date(t.Datum);
            return terminDate >= weekStart && terminDate <= weekEnd;
        })
        .filter(categoryFilter)
        .filter(cancelledFilter)
        .filter(heldFilter);
        this._renderWeekCalendar(appointmentsForWeek);

        // --- Calendar View Logic ---
        // KORREKTUR: Die Timeline ignoriert die vor-gefilterten `appointmentsToRender` und filtert
        // stattdessen `this.searchFilteredAppointments` (nur nach Text gefiltert) nach dem Zyklusdatum.
        const appointmentsForTimelineWithRecurrence = this._generateRecurringAppointments(this.searchFilteredAppointments, cycleStartDate, cycleEndDate);
        const calendarAppointments = appointmentsForTimelineWithRecurrence
            .filter(categoryFilter)
            .filter(cancelledFilter)
            .filter(heldFilter)
            .filter(t => {
                if (!t.Datum) return false;
                const terminDate = new Date(t.Datum);
                return terminDate >= cycleStartDate && terminDate <= cycleEndDate;
            });
        const appointmentsByDay = _.groupBy(calendarAppointments, t => t.Datum ? t.Datum.split(/ |T/)[0] : null);

        this.statsMonthTimeline.innerHTML = '';

        const categoryColors = {
            'AT': 'bg-skt-green-accent',
            'BT': 'bg-skt-blue-accent',
            'ST': 'bg-skt-red-accent',
            'ET': 'bg-accent-gold',
            'Immo': 'bg-accent-immo',
            'NT': 'bg-accent-purple',
            'default': 'bg-skt-grey-medium'
        };

        // KORREKTUR: Die Kalenderansicht erstreckt sich immer über den gesamten Umsatzmonat.
        const viewStartDate = cycleStartDate;
        const viewEndDate = cycleEndDate;

        const toLocalISOString = (date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        for (let d = new Date(viewStartDate); d <= viewEndDate; d.setDate(d.getDate() + 1)) {
            const dateString = toLocalISOString(d);
            
            let appointmentsForDay = (appointmentsByDay[dateString] || []);
            appointmentsForDay.sort((a,b) => new Date(a.Datum) - new Date(b.Datum));

            const isToday = d.toDateString() === today.toDateString();

            const dayCard = document.createElement('div');
            dayCard.className = `day-card flex-shrink-0 w-72 h-full bg-white rounded-xl p-3 flex flex-col border-2 ${isToday ? 'border-skt-blue' : 'border-gray-200'}`; dayCard.dataset.date = dateString;
            if (isToday) dayCard.classList.add('is-today');

            let appointmentsHtml = '';
            if (appointmentsForDay.length > 0) {
                appointmentsHtml = appointmentsForDay.map(termin => { // KORREKTUR: Der Mitarbeitername wird jetzt aus dem gecachten `db.mitarbeiter` geholt,
                    // da `t.Mitarbeiter_ID` nach der Normalisierung nur noch die ID enthält.
                    const mitarbeiterName = findRowById('mitarbeiter', termin.Mitarbeiter_ID)?.Name || 'N/A';
                    const terminTime = termin.Datum ? new Date(termin.Datum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';

                    // KORREKTUR: Verwende die neue, robustere Farb-Logik
                    const { border: statusColorClass } = this._getAppointmentColorClasses(termin);
                    const categoryPillColor = categoryColors[termin.Kategorie] || 'bg-gray-400';

                    // KORREKTUR: Logik für "+1"-Icon mit normalisierten Daten
                    const ownerId = termin.Mitarbeiter_ID;
                    const inviteeId = termin.Eingeladener;
                    // KORREKTUR: +1 nur in der persönlichen Ansicht anzeigen
                    let isInvitee = false;
                    if (scope === 'personal') {
                        isInvitee = inviteeId === this.currentUserId && ownerId !== this.currentUserId;
                    }
                    const inviteeHtml = isInvitee ? `<span class="ml-2 text-xs font-bold text-white bg-skt-blue rounded-full h-5 w-5 inline-flex items-center justify-center" title="Du bist eingeladen">+1</span>` : '';

                    return `<div class="rounded-lg shadow-sm bg-white text-skt-blue text-xs mb-1.5 flex overflow-hidden border border-gray-200 border-l-4 ${statusColorClass}" data-id="${termin._id}">
                                <div class="flex-shrink-0 ${categoryPillColor} text-white font-bold flex items-center justify-center p-2 w-12 text-center">${termin.Kategorie}</div>
                                <div class="flex-grow p-2 min-w-0 cursor-pointer"><p class="font-bold truncate flex items-center">${termin.Terminpartner || 'Unbekannt'}${inviteeHtml}</p><p class="text-gray-500">${mitarbeiterName}</p></div>
                                <div class="add-to-calendar-btn flex flex-col items-center justify-center flex-shrink-0 p-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" data-termin-id="${termin._id}" title="Zum Kalender hinzufügen">
                                    <span class="font-semibold">${terminTime}</span>
                                    <i class="fas fa-calendar-plus text-gray-400 mt-1"></i>
                                </div>
                            </div>`;
                }).join('');
            } else {
                appointmentsHtml = '<div class="flex-grow flex items-center justify-center text-xs text-gray-400">Keine Termine</div>';
            }

            dayCard.innerHTML = `
                <div class="font-bold text-skt-blue mb-3">${d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
                <div class="flex-grow overflow-y-auto space-y-2 pr-1">${appointmentsHtml}</div>
            `;
            dayCard.querySelectorAll('[data-id]').forEach(el => {
                el.addEventListener('click', (e) => {
                    if (e.target.closest('.add-to-calendar-btn')) return;
                    this.openModal(this.allAppointments.find(t => t._id === e.currentTarget.dataset.id));
                });
            });
            dayCard.querySelectorAll('.add-to-calendar-btn').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); this._addToCalendar(e.currentTarget.dataset.terminId); }));
            this.statsMonthTimeline.appendChild(dayCard);
        }

        setTimeout(() => {
            // KORREKTUR: Scrolle nach dem Rendern immer zum heutigen Tag.
            this._scrollToTodayInTimeline('auto');
            this._updateCardScales();
        }, 150);
    }
    
    // NEU: Hilfsfunktion, die auf Änderungen im Haupt-Kalender-Dropdown reagiert.
    _handleViewModeChange() {
        // Kalender nach jeder Änderung neu rendern
        this._renderAppointmentStats();
    }

    // NEU: Hilfsfunktion zur Berechnung von überlappenden Terminen für einen Tag
    _calculateOverlaps(dayAppointments) {
        // 1. Events mit Start/End-Zeitstempel erstellen und sortieren
        const events = dayAppointments.map((termin, index) => ({
            id: index,
            termin,
            start: new Date(termin.Datum).getTime(),
            end: new Date(termin.Datum).getTime() + (termin.Dauer || 3600) * 1000,
            column: -1,
            max_cols: 1
        })).sort((a, b) => a.start - b.start);

        if (events.length === 0) return [];

        const processedEvents = [];

        // 2. Events gierig in Spalten platzieren
        for (const event of events) {
            let col = 0;
            while (true) {
                const collidingEvent = processedEvents.find(
                    p => p.column === col && event.start < p.end && event.end > p.start
                );
                if (!collidingEvent) {
                    event.column = col;
                    break;
                }
                col++;
            }
            processedEvents.push(event);
        }

        // 3. Maximale Anzahl an Spalten für jede Überlappungsgruppe bestimmen
        for (const event of events) {
            let max_cols = 0;
            for (const other of events) {
                if (event.start < other.end && event.end > other.start) {
                    max_cols = Math.max(max_cols, other.column + 1);
                }
            }
            event.max_cols = max_cols;
        }

        // 4. Finale Layout-Informationen zurückgeben
        return events.map(e => ({
            termin: e.termin,
            column: e.column,
            totalColumns: e.max_cols
        }));
    }

    // NEU: Funktion zum Generieren von wiederkehrenden Terminen für die Anzeige
    _generateRecurringAppointments(appointments, startDate, endDate) {
        const recurringAppointments = [];
        appointments.forEach(originalAppointment => {
            if (originalAppointment.Wiederholung && originalAppointment.Datum) {
                const recurrenceRule = originalAppointment.Wiederholung;
                let currentDate = new Date(originalAppointment.Datum);
    
                while (currentDate <= endDate) {
                    // Gehe zum nächsten Vorkommen
                    switch (recurrenceRule) {
                        case 'täglich':
                            currentDate.setDate(currentDate.getDate() + 1);
                            break;
                        case 'wöchentlich':
                            currentDate.setDate(currentDate.getDate() + 7);
                            break;
                        case 'zweiwöchentlich':
                            currentDate.setDate(currentDate.getDate() + 14);
                            break;
                        case 'monatlich':
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            break;
                        default:
                            // Ungültige Regel, Schleife abbrechen
                            currentDate = new Date(endDate.getTime() + 1);
                            continue;
                    }
    
                    if (currentDate >= startDate && currentDate <= endDate) {
                        const newAppointment = { ...originalAppointment };
                        newAppointment.Datum = currentDate.toISOString();
                        // Eindeutige ID für den virtuellen Termin, um Schlüsselkonflikte zu vermeiden, aber Original-ID behalten
                        newAppointment._id = `${originalAppointment._id}-recur-${currentDate.getTime()}`;
                        newAppointment.originalId = originalAppointment._id;
                        newAppointment.isRecurringInstance = true;
                        recurringAppointments.push(newAppointment);
                    }
                }
            }
        });
        return [...appointments, ...recurringAppointments];
    }

    // NEU: Funktion zum Ändern des Kalender-Zooms
    _zoomWeekCalendar(delta) {
        this.weekCalendarSlotHeight = Math.max(10, this.weekCalendarSlotHeight + delta); // Mindesthöhe 10px
        saveUiSetting('weekCalendarSlotHeight', this.weekCalendarSlotHeight); // NEU: Zoom-Level speichern
        this._renderWeekCalendar();
    }


    // NEU: Funktion zum Erstellen und Herunterladen einer .ics-Datei
    _populateWeekCalendarViewModeSelect() {
        let select = this.weekCalendarViewModeSelect;
        if (!select) return;

        select.innerHTML = "";
        const options = [
            { value: 'personal', text: 'Meine Termine' },
            { value: 'group', text: 'Meine Gruppe' },
            { value: 'structure', text: 'Meine Struktur' },
            { value: 'user_select', text: 'Kalender von...' }
        ];

        const isLeader = SKT_APP.isUserLeader(SKT_APP.authenticatedUserData)

        options.forEach(opt => {
            // Gruppen-/Strukturansicht nur für Führungskräfte
            if (opt.value === 'personal' || opt.value === 'user_select' || isLeader) {
                select.add(new Option(opt.text, opt.value));
            }
        })

        // Gespeicherte Ansicht wiederherstellen oder Standard setzen
        const savedMode = loadUiSetting('weekCalendarViewMode', 'personal');
        if (Array.from(select.options).some(opt => opt.value === savedMode)) {
            select.value = savedMode;
        } else {
            select.value = 'personal';
        }
    }    

    async _populateWeekCalendarUserSelect() {
         const select = this.weekCalendarUserSelect;
         if (!select) return;
 
         const currentVal = select.value; // Wert merken
         select.innerHTML = '';
 
         // Lade den eingeloggten Benutzer, seine Struktur und seinen direkten Vorgesetzten
         const me = SKT_APP.authenticatedUserData;
         const myStructure = await SKT_APP.getAllSubordinatesRecursive(me._id);
         const manager = me.Werber ? SKT_APP.findRowById('mitarbeiter', me.Werber) : null;
 

         const userSet = new Set([me, ...myStructure]);
         if (manager && manager.Status !== 'Ausgeschieden') {

             userSet.add(manager);
         }
 

         Array.from(userSet)
             .sort((a, b) => a.Name.localeCompare(b.Name))
             .forEach(user => {
                 select.add(new Option(user.Name, user._id));
             });
 
         // Gespeicherten Wert wiederherstellen oder Standard setzen
         
         if (Array.from(select.options).some(opt => opt.value === currentVal)) {
             select.value = currentVal;
         } else {
             select.value = me._id; // Standardmäßig den eingeloggten Benutzer auswählen
         }
    }

    // KORREKTUR: Komplette Neugestaltung der Kalender-Render-Logik
    _renderWeekCalendar(appointmentsToRender) {
        if (!this.weekCalendarBody || this.statsWeekView.classList.contains('hidden')) return;
        const slotHeight = this.weekCalendarSlotHeight; // NEU

        const viewMode = this.statsScopeFilter.value;
        let userIds = new Set();
        // ... (Logik zur Sammlung von userIds bleibt gleich) ...

        const weekStart = new Date(this.calendarWeekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        this.weekPeriodDisplay.textContent = `${weekStart.toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit'})} - ${weekEnd.toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit', year:'numeric'})}`;

        // NEU: Filterlogik aus der Timeline-Ansicht übernehmen
        const showCancelledToggle = document.getElementById('appointments-show-cancelled');
        const showCancelled = showCancelledToggle ? showCancelledToggle.checked : false;
        const showHeldToggle = document.getElementById('appointments-show-held');
        const showHeld = showHeldToggle ? showHeldToggle.checked : false;
        const selectedCategories = Array.from(this.statsCategoryFilterPanel.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        
        // KORREKTUR: Die Filterung nach Benutzern wird entfernt. `this.allAppointments` ist bereits
        // durch `fetchAndRender` korrekt auf den ausgewählten Scope (Struktur, Gruppe, etc.) gefiltert.
        // KORREKTUR: Verwende die bereits gefilterte Liste, die an die Funktion übergeben wird.
        let appointmentsForWeek = appointmentsToRender.filter(t => {
            if (!t.Datum) return false;
            const terminDate = new Date(t.Datum);
            const isInCategory = selectedCategories.length > 0 ? selectedCategories.includes(t.Kategorie) : true;
            const isCancelledOk = showCancelled || (t.Absage !== true && t.Status !== 'Storno');
            const heldStatuses = ['Gehalten', 'Info Eingeladen', 'Info Bestätigt', 'Info Anwesend'];
            const isHeldOk = showHeld || !heldStatuses.includes(t.Status);
            return terminDate >= weekStart && terminDate <= weekEnd && isInCategory && isCancelledOk && isHeldOk;
        });

        // NEU: Zusätzlicher Filter für den "Kalender von..." Modus.
        // In diesem Modus enthält `this.allAppointments` mehr Daten als angezeigt werden sollen.
        if (viewMode === 'user_select') {
            const selectedUserId = this.weekCalendarUserSelect.value;
            if (selectedUserId) {
                appointmentsForWeek = appointmentsForWeek.filter(t => t.Mitarbeiter_ID === selectedUserId || t.Eingeladener === selectedUserId);
            }
        }
        
        // Group appointments by day index (0=Mon, 1=Tue, ...)
        const appointmentsByDay = Array.from({ length: 7 }, () => []);
        appointmentsForWeek.forEach(termin => {
            const dayIndex = new Date(termin.Datum).getDay() === 0 ? 6 : new Date(termin.Datum).getDay() - 1;
            if (dayIndex >= 0 && dayIndex < 7) {
                appointmentsByDay[dayIndex].push(termin);
            }
        });

        this.weekCalendarHeader.innerHTML = '';
        this.weekCalendarBody.innerHTML = '';

        // --- Render Header ---
        const headerGrid = document.createElement('div');
        headerGrid.className = 'week-calendar-header-grid';
        headerGrid.innerHTML += `<div class="p-2 border-b border-gray-200"></div>`; // Empty corner
        const headerDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
        const today = getCurrentDate();
        headerDays.forEach((day, i) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const isToday = dayDate.toDateString() === today.toDateString();
            headerGrid.innerHTML += `<div class="p-2 text-center font-semibold text-skt-blue-light border-r border-b border-gray-200 text-sm ${isToday ? 'bg-blue-100' : ''}">${day} <span class="font-normal text-gray-500">${dayDate.getDate()}.</span></div>`;
        });
        this.weekCalendarHeader.appendChild(headerGrid);

        // --- Render Body ---
        const bodyContainer = document.createElement('div');
        bodyContainer.className = 'relative'; // Main container for positioning
        bodyContainer.style.height = `${36 * slotHeight}px`; // NEU: Dynamische Höhe

        // Render time labels and grid lines in the background
        const gridAndTimes = document.createElement('div');
        gridAndTimes.className = 'absolute inset-0';
        
        const timeColumn = document.createElement('div');
        timeColumn.className = 'absolute top-0 left-0 w-[60px] h-full';
        for (let hour = 6; hour < 24; hour++) {
            const timeLabelCell = document.createElement('div');
            timeLabelCell.className = 'relative text-right text-xs text-gray-400'; // KORREKTUR: h-[80px] entfernt
            timeLabelCell.style.height = `${2 * slotHeight}px`; // NEU: Dynamische Höhe
            timeLabelCell.innerHTML = `<span class="week-calendar-time-label">${String(hour).padStart(2, '0')}:00</span>`;
            timeColumn.appendChild(timeLabelCell);
        }
        gridAndTimes.appendChild(timeColumn);

        const dayGrid = document.createElement('div');
        dayGrid.className = 'absolute top-0 left-[60px] right-0 bottom-0 grid grid-cols-7';
        for (let i = 0; i < 7; i++) {
            const dayCol = document.createElement('div');
            // KORREKTUR: dayCol wird selbst zu einem Grid-Container für die Zeit-Slots, was robuster ist.
            dayCol.className = 'week-calendar-day-col grid';
            dayCol.style.gridTemplateRows = `repeat(36, ${slotHeight}px)`;
            for (let j = 0; j < 36; j++) {
                const slot = document.createElement('div');
                slot.className = 'border-t border-dotted border-gray-200';
                if (j % 2 === 0) slot.classList.replace('border-dotted', 'border-solid');
                dayCol.appendChild(slot);
            }
            dayGrid.appendChild(dayCol);
        }
        gridAndTimes.appendChild(dayGrid);
        bodyContainer.appendChild(gridAndTimes);

        // --- Render Appointments on top ---
        const hintLog = (message, ...data) => console.log(`%c[Hint] %c${message}`, 'color: #9b59b6; font-weight: bold;', 'color: black;', ...data);
        const appointmentsContainer = document.createElement('div');
        appointmentsContainer.className = 'absolute top-0 left-[60px] right-0 bottom-0 grid grid-cols-7';
        
        appointmentsByDay.forEach((dayAppointments, dayIndex) => {
            if (dayAppointments.length === 0) return;

            const dayColumnContainer = document.createElement('div');
            dayColumnContainer.className = 'relative h-full'; // Container for one day's appointments
            dayColumnContainer.style.gridColumn = `${parseInt(dayIndex) + 1} / span 1`;

            const layoutData = this._calculateOverlaps(dayAppointments);

            layoutData.forEach(layoutInfo => {
                const termin = layoutInfo.termin;
                const terminDate = new Date(termin.Datum);
                const startHour = terminDate.getHours();
                const startMinute = terminDate.getMinutes();

                if (startHour < 6) return;

                const durationMinutes = termin.Dauer ? termin.Dauer / 60 : 60;
                const startOffsetMinutes = (startHour - 6) * 60 + startMinute;
                
                const top = (startOffsetMinutes / 30) * slotHeight; // NEU: Dynamische Höhe
                const height = Math.max(slotHeight, (durationMinutes / 30) * slotHeight); // NEU: Dynamische Höhe

                const width = 100 / layoutInfo.totalColumns;
                const left = layoutInfo.column * width; // KORREKTUR: Der Mitarbeitername wird jetzt aus dem gecachten `db.mitarbeiter` geholt.

                const terminEl = document.createElement('a');
                terminEl.href = '#';
                terminEl.dataset.id = termin._id;
                const { border, bg, text } = this._getAppointmentColorClasses(termin, 'category');

                const ownerId = termin.Mitarbeiter_ID;
                const inviteeId = termin.Eingeladener;
                let isInvitee = false;
                if (viewMode === 'personal') {
                    if (inviteeId === this.currentUserId && ownerId !== this.currentUserId) isInvitee = true;
                } else if (viewMode === 'user_select') {
                    const selectedUserId = this.weekCalendarUserSelect.value;
                    if (inviteeId === selectedUserId && ownerId !== selectedUserId) isInvitee = true;
                }
                const inviteeIcon = isInvitee ? '<i class="fas fa-user-plus fa-xs ml-1" title="Du bist eingeladen"></i>' : '';
                const terminTime = terminDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

                terminEl.className = `week-calendar-appointment p-2 rounded-md flex flex-col ${bg} ${text} ${border}`;
                terminEl.style.top = `${top}px`;
                terminEl.style.height = `${height - 2}px`; // -2 for a small gap
                terminEl.style.left = `calc(${left}% + 2px)`;
                terminEl.style.width = `calc(${width}% - 4px)`;

                // NEU: Füge Klassen hinzu, um die Sichtbarkeit von Inhalten basierend auf der Höhe zu steuern
                if (height < 60) terminEl.classList.add('content-priority-low'); // Uhrzeit ausblenden
                if (height < 40) terminEl.classList.add('content-priority-medium'); // Mitarbeitername ausblenden

                terminEl.innerHTML = `
                    <strong class="text-sm font-bold truncate appointment-customer-name">${termin.Terminpartner || 'Unbekannt'}</strong>
                    <span class="text-xs opacity-90 appointment-time">${terminTime}</span>
                    <span class="text-xs opacity-90 truncate mt-auto appointment-employee-name">${findRowById('mitarbeiter', termin.Mitarbeiter_ID)?.Name || ''} ${inviteeIcon}</span>
                `;
                // NEU: Hinweise für zugeordnete Umsätze oder PG-Einträge hinzufügen
                this._renderAppointmentHints(termin, terminEl);
                terminEl.addEventListener('click', (e) => { e.preventDefault(); this.openModal(this.allAppointments.find(t => t._id === e.currentTarget.dataset.id)); });
                dayColumnContainer.appendChild(terminEl);
            });
            appointmentsContainer.appendChild(dayColumnContainer);
        });

        bodyContainer.appendChild(appointmentsContainer);
        this.weekCalendarBody.appendChild(bodyContainer);
    }

    // NEU: Fügt kontextbezogene Hinweise zu einem Termin-Element im Kalender hinzu.
    _renderAppointmentHints(termin, terminEl) {
        const hintLog = (message, ...data) => console.log(`%c[Hint] %c${message}`, 'color: #9b59b6; font-weight: bold;', 'color: black;', ...data);
        // KORREKTUR: Der Banner für zugeordnete Umsätze wurde auf Wunsch des Kunden entfernt.
        // Der Code wird auskommentiert, falls die Funktion reaktiviert werden soll.
        /* if (termin.Kategorie === 'BT' && termin.Terminpartner) { ... } */

        // Hinweis für zugehörige PG-Einträge
        if (termin.Kategorie === 'PG') {
            hintLog(`Prüfe auf PG-Eintrag für PG-Termin:`, termin);
            let personId = null;
            if (termin.Eingeladener && termin.Eingeladener[0]) {
                personId = termin.Eingeladener[0].row_id;
                hintLog(`Suche über 'Eingeladener'-Feld. Person-ID: ${personId}`);
            } else if (termin.Terminpartner) {
                const partnerUser = db.mitarbeiter.find(m => m.Name.toLowerCase() === termin.Terminpartner.toLowerCase());
                if (partnerUser) {
                    personId = partnerUser._id;
                    hintLog(`Suche über 'Terminpartner'-Feld. Partner als Mitarbeiter gefunden: ${partnerUser.Name}, ID: ${personId}`);
                } else {
                    hintLog(`'Terminpartner' ${termin.Terminpartner} ist kein bekannter Mitarbeiter.`);
                }
            }

            if (personId) {
                const terminDateString = new Date(termin.Datum).toISOString().split('T')[0];
                hintLog(`Suche PG-Eintrag für Person-ID ${personId} am Datum ${terminDateString}`);
                // KORREKTUR: Robusterer Abgleich, der sowohl normalisierte (string) als auch nicht-normalisierte (link-Objekt) Daten für pg.Mitarbeiter handhabt.
                const relatedPg = db.pg.find(pg => {
                    const pgMitarbeiterId = pg.Mitarbeiter?.[0]?.row_id || pg.Mitarbeiter;
                    const isMatch = pgMitarbeiterId === personId && pg.Datum && pg.Datum.startsWith(terminDateString);
                    if (isMatch) {
                        hintLog(`Gefunden: passender PG-Eintrag`, pg);
                    }
                    return isMatch;
                });
                if (relatedPg) {
                    hintLog(`PG-Eintrag gefunden. Rendere Hinweis.`);
                    const pgHint = document.createElement('div');
                    pgHint.className = 'mt-2 p-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 cursor-pointer hover:bg-blue-100';
                    pgHint.innerHTML = `<i class="fas fa-comments mr-1"></i> Zum PG-Eintrag springen`; // KORREKTUR: Setze eine globale Variable und rufe dann switchView auf.
                    pgHint.addEventListener('click', (e) => {
                        e.preventDefault(); e.stopPropagation();
                        pendingPgIdToOpen = relatedPg._id;
                        switchView('pg-tagebuch');
                    });
                    terminEl.appendChild(pgHint);
                } else {
                    hintLog(`Kein passender PG-Eintrag gefunden.`);
                }
            } else {
                hintLog(`Keine Person-ID für die Suche nach PG-Eintrag gefunden.`);
            }
        }
    }

    _navigateWeekCalendar(days) {
        // KORREKTUR V2: Erstelle zuerst eine saubere Kopie des Datums.
        // Modifiziere dann die Kopie und weise sie zu. Dies verhindert den "Doppelsprung"-Fehler zuverlässig,
        // da das Originalobjekt (`this.calendarWeekStartDate`) nicht mehr verändert wird, bevor das neue Datum erstellt wird.
        const newDate = new Date(this.calendarWeekStartDate);
        newDate.setDate(newDate.getDate() + days);
        this.calendarWeekStartDate = newDate;
        this._renderAppointmentStats();
    }

    _resetWeekCalendarToToday() {
        const today = new Date(getCurrentDate()); // KORREKTUR: Kopie erstellen, um Seiteneffekte zu vermeiden.
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        this.calendarWeekStartDate = monday;
        this.calendarWeekStartDate.setHours(0, 0, 0, 0);
        this._renderAppointmentStats();
    }

    _escapeIcsString(str) {
        // HINWEIS: Diese Funktion wurde aus der vorherigen Version übernommen und scheint korrekt zu sein.
        // Sie maskiert Sonderzeichen für das ICS-Format.
        if (!str) return '';
        return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    }

    _addToCalendar(terminId) {
        const icsLog = (message, ...data) => console.log(`%c[iCal] %c${message}`, 'color: #9b59b6; font-weight: bold;', 'color: black;', ...data);
        icsLog(`Erstelle iCal für Termin-ID: ${terminId}`);
        const termin = this.allAppointments.find(t => t._id === terminId);
        if (!termin) {
            icsLog('!!! FEHLER: Termin nicht gefunden.');
            alert('Termin nicht gefunden.');
            return;
        }

        const startDate = new Date(termin.Datum);
        // NEU: Dauer aus dem Termin verwenden, Fallback auf 1 Stunde
        const durationInSeconds = termin.Dauer || 3600;
        const endDate = new Date(startDate.getTime() + durationInSeconds * 1000);

        const toIcsDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        // NEU: Eingeladenen als Teilnehmer hinzufügen
        let attendeeIcs = '';
        icsLog('Suche nach Eingeladenem im Termin-Objekt:', termin);
        const inviteeLink = termin.Eingeladener;
        if (inviteeLink && Array.isArray(inviteeLink) && inviteeLink.length > 0) {
            const inviteeId = inviteeLink[0].row_id;
            icsLog(`Eingeladener gefunden. Row-ID: ${inviteeId}`);
            const inviteeUser = SKT_APP.findRowById('mitarbeiter', inviteeId);
            icsLog('Gefundener Mitarbeiter-Datensatz für Eingeladenen:', inviteeUser);
            if (inviteeUser && inviteeUser.Email) {
                attendeeIcs = `ATTENDEE;CN="${this._escapeIcsString(inviteeUser.Name)}";ROLE=REQ-PARTICIPANT:mailto:${inviteeUser.Email}`;
                icsLog(`E-Mail gefunden: ${inviteeUser.Email}. Erstellter ATTENDEE-String:`, attendeeIcs);
            } else {
                icsLog(`Keine E-Mail für den eingeladenen Benutzer (${inviteeUser?.Name}) gefunden.`);
            }
        } else {
            icsLog('Kein oder ungültiges "Eingeladener"-Feld im Termin gefunden.');
        }

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//SKT Success Dashboard//DE',
            'METHOD:REQUEST', // NEU: Fügt die Methode hinzu, um eine Einladung zu signalisieren.
            'BEGIN:VEVENT',
            `UID:${termin._id}@skt-dashboard.app`,
            `DTSTAMP:${toIcsDate(new Date())}`,
            `DTSTART:${toIcsDate(startDate)}`,
            `DTEND:${toIcsDate(endDate)}`,
            `SUMMARY:${this._escapeIcsString((() => {
                let summary = `${termin.Kategorie} ${termin.Terminpartner || 'Unbekannt'}`;
                const terminOwnerId = termin.Mitarbeiter_ID?.[0]?.row_id || termin.Mitarbeiter_ID;
                if (terminOwnerId && terminOwnerId !== SKT_APP.authenticatedUserData._id) {
                    const ownerName = termin.Mitarbeiter_ID?.[0]?.display_value || SKT_APP.findRowById('mitarbeiter', terminOwnerId)?.Name || 'Unbekannt';
                    summary += ` (${ownerName})`;
                }
                return summary;
            })())}`,
            `LOCATION:${this._escapeIcsString(termin.Ort)}`,
            `DESCRIPTION:Mitarbeiter: ${this._escapeIcsString(termin.Mitarbeiter_ID?.[0]?.display_value || 'N/A')}\\nStatus: ${this._escapeIcsString(termin.Status)}\\nHinweis: ${this._escapeIcsString(termin.Hinweis || '')}`,
            attendeeIcs,
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(Boolean).join('\r\n');

        icsLog('Finaler iCal Inhalt:', icsContent);

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Termin_${termin.Terminpartner || 'Unbekannt'}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    _updateCategoryButtonText() {
        const selectedCheckboxes = this.statsCategoryFilterPanel.querySelectorAll('input[type="checkbox"]:checked');
        const selectedCategories = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (selectedCategories.length === 0) {
            this.statsCategoryFilterBtn.textContent = 'Keine Auswahl';
        } else if (selectedCategories.length === this.statsCategoryFilterPanel.querySelectorAll('input[type="checkbox"]').length) {
            this.statsCategoryFilterBtn.textContent = 'Filter (Alle)';
        } else if (selectedCategories.length === 1) {
            this.statsCategoryFilterBtn.textContent = `Filter (nur ${selectedCategories[0]})`;
        } else {
            this.statsCategoryFilterBtn.textContent = `Filter (${selectedCategories.length} Kat.)`;
        }
    }
    _renderStatsTable(appointments) {
        const container = document.getElementById('stats-table-container');
        container.innerHTML = '';

        if (appointments.length === 0) {
            container.innerHTML = `<div class="text-center py-8 text-gray-500">Keine Termine für die aktuelle Auswahl.</div>`;
            return;
        }

        const table = document.createElement('table');
        table.className = 'appointments-table';

        const columns = [
            { key: 'Datum', label: 'Datum' },
            { key: 'Terminpartner', label: 'Terminpartner' },
            { key: 'Kategorie', label: 'Kategorie' },
            { key: 'Status', label: 'Status' },
            { key: 'Mitarbeiter_ID', label: 'Mitarbeiter' },
        ];

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr>${columns.map(c => {
            let iconHtml = '<i class="fas fa-sort sort-icon"></i>';
            if (this.statsTableSortConfig.column === c.key) {
                iconHtml = this.statsTableSortConfig.direction === 'asc' 
                    ? '<i class="fas fa-sort-up sort-icon active"></i>' 
                    : '<i class="fas fa-sort-down sort-icon active"></i>';
            }
            return `<th data-sort-key="${c.key}">${c.label} ${iconHtml}</th>`;
        }).join('')}</tr>`;

        thead.querySelectorAll('th').forEach(th => {
            th.addEventListener('click', () => this._handleStatsTableSort(th.dataset.sortKey));
        });
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        appointments.forEach(termin => {
            const tr = document.createElement('tr');
            tr.className = 'cursor-pointer';
            tr.dataset.id = termin._id; // KORREKTUR: Randfarbe basierend auf Status, nicht Kategorie
            const { border: statusColorClass, text: statusTextColorClass } = this._getAppointmentColorClasses(termin);
            tr.className = `border-l-8 ${statusColorClass} cursor-pointer`;
            
            // KORREKTUR: Mitarbeitername wird über die ID aus der DB geholt, da die Daten normalisiert sind.
            const mitarbeiterName = findRowById('mitarbeiter', termin.Mitarbeiter_ID)?.Name || 'N/A';

            // NEU: Logik für "+1"-Icon, identisch zur Kalenderansicht
            const ownerId = termin.Mitarbeiter_ID;
            const inviteeId = termin.Eingeladener;
            // NEU: +1 wird angezeigt, wenn der aktuell angezeigte Benutzer der Eingeladene ist, aber nicht der Besitzer.
            const isInvitee = inviteeId === this.currentUserId && ownerId !== this.currentUserId;
            let inviteeHtml = '';
            if (isInvitee) {
                inviteeHtml = `<span class="ml-2 text-xs font-bold text-white bg-skt-blue rounded-full h-5 w-5 inline-flex items-center justify-center" title="Du bist eingeladen">+1</span>`;
            }

            tr.innerHTML = `
                <td>${new Date(termin.Datum).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td><div class="flex items-center">${termin.Terminpartner || '-'}${inviteeHtml}</div></td>
                <td>${termin.Kategorie || '-'}</td>
                <td><span class="${statusTextColorClass}">${termin.Status || '-'}</span></td>
                <td>${mitarbeiterName}</td>
            `;
            tr.addEventListener('click', () => this.openModal(termin));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    }

    _handleStatsTableSort(columnKey) {
        if (this.statsTableSortConfig.column === columnKey) {
            this.statsTableSortConfig.direction = this.statsTableSortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.statsTableSortConfig.column = columnKey;
            // KORREKTUR: Bei Klick auf eine neue Spalte immer aufsteigend sortieren.
            this.statsTableSortConfig.direction = 'asc';
        }
        this.render();
    }

    _sortStatsTableData(appointments) {
        const { column, direction } = this.statsTableSortConfig;
        const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
        
        // KORREKTUR: Robuste Sortierung, die Datums- und Textfelder korrekt behandelt.
        return appointments.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (column === 'Mitarbeiter_ID') {
                valA = a.Mitarbeiter_ID?.[0]?.display_value || '';
                valB = b.Mitarbeiter_ID?.[0]?.display_value || '';
            }

            let comparison = 0;
            if (column === 'Datum') {
                comparison = new Date(valA || 0) - new Date(valB || 0);
            } else {
                comparison = collator.compare(String(valA || ''), String(valB || ''));
            }

            return direction === 'asc' ? comparison : -comparison;
        });
    }

    _renderOutstandingAppointments() {
        const today = new Date(getCurrentDate()); // KORREKTUR: Kopie erstellen, um Seiteneffekte zu vermeiden.
        today.setHours(0, 0, 0, 0);

        // KORREKTUR: Filtere von `searchFilteredAppointments`, um die Datumsfilter zu ignorieren und Diskrepanzen zu beheben.
        const outstanding = this.searchFilteredAppointments.filter(t => {
            if (!t.Datum || t.Status !== 'Ausgemacht' || t.Absage === true) return false; // NEU: Stornierte Termine ausschließen
            const terminDate = new Date(t.Datum);
            return terminDate < today;
        });

        if (outstanding.length === 0) {
            this.outstandingAppointmentsSection.classList.add('hidden');
            return;
        }

        this.outstandingAppointmentsSection.classList.remove('hidden');
        this.outstandingAppointmentsList.innerHTML = '';

        outstanding.forEach(termin => {
            const item = document.createElement('div');
            item.className = 'bg-yellow-200 p-2 rounded-md flex justify-between items-center cursor-pointer hover:bg-yellow-300';
            item.dataset.id = termin._id;
            // KORREKTUR: Mitarbeitername wird über die ID aus der DB geholt, da die Daten normalisiert sind.
            const mitarbeiterName = findRowById('mitarbeiter', termin.Mitarbeiter_ID)?.Name || 'N/A';
            const terminDate = new Date(termin.Datum).toLocaleDateString('de-DE');
            item.innerHTML = `<p class="text-sm"><span class="font-bold">${termin.Terminpartner}</span> bei ${mitarbeiterName} am ${terminDate}</p><i class="fas fa-edit ml-2"></i>`;
            item.addEventListener('click', () => this.openModal(termin));
            this.outstandingAppointmentsList.appendChild(item);
        });
    }


    _handleSort(columnKey) {
        if (this.sortColumn === columnKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = columnKey;
            this.sortDirection = 'asc';
        }
        this.render();
    }

    _getAppointmentColorClasses(termin, mode = 'status') {
        // Tailwind JIT compiler needs to see the full class names, so we can't construct them dynamically.
        // We define them fully here.
        const baseColors = {
            red:    { border: 'border-skt-red-accent',   bg: 'bg-red-100',   text: 'text-red-800' },
            green:  { border: 'border-skt-green-accent', bg: 'bg-green-100', text: 'text-green-800' },
            blue:   { border: 'border-skt-blue-accent',  bg: 'bg-blue-100',  text: 'text-blue-800' },
            gold:   { border: 'border-accent-gold',      bg: 'bg-yellow-100',text: 'text-yellow-800' },
            yellow: { border: 'border-skt-yellow-accent',bg: 'bg-yellow-100',text: 'text-yellow-800' },
            purple: { border: 'border-accent-purple',    bg: 'bg-purple-100',text: 'text-purple-800' },
            immo:   { border: 'border-immo-accent',      bg: 'bg-teal-100',  text: 'text-teal-800' },
            grey:   { border: 'border-skt-grey-medium',  bg: 'bg-gray-100',  text: 'text-gray-800' },
            default:{ border: 'border-gray-300',         bg: 'bg-gray-100',  text: 'text-gray-800' }
        };

        if (termin.Absage === true || termin.Status === 'Storno') {
            return baseColors.red;
        }

        if (mode === 'category') {
            switch (termin.Kategorie) {
                case 'AT': return baseColors.green;
                case 'BT': return baseColors.blue;
                case 'ST': return baseColors.red;
                case 'ET': return baseColors.gold;
                case 'Immo': return baseColors.immo;
                case 'NT': return baseColors.purple;
                case 'PG':
                case 'Sonstiges':
                default: return baseColors.grey;
            }
        } else { // Default mode is 'status'
            if (termin.Kategorie === 'Immo') return baseColors.immo;
            switch (termin.Status) {
                case 'Ausgemacht': return baseColors.green;
                case 'Verschoben':
                case 'Offen': return baseColors.red;
                case 'Weiterer BT':
                case 'Weiterer ET': return baseColors.blue;
                case 'Wird Mitarbeiter': return baseColors.gold;
                case 'Info Eingeladen': return baseColors.yellow;
                case 'Info Bestätigt':
                case 'Info Anwesend': return baseColors.purple;
                case 'Gehalten': return baseColors.grey;
                default: return baseColors.default;
            }
        }
    }

    // --- NEU: Methoden für "Nächstes Info", hierher verschoben ---
    async renderNaechstesInfo(repopulateDates = false) {
        if (repopulateDates) {
            // KORREKTUR: Setzt das Datum standardmäßig auf den nächsten Infoabend.
            const nextInfoDate = findNextInfoDateAfter(getCurrentDate());
            this.infoabendDateSelect.value = nextInfoDate.toISOString().split('T')[0];
        }
        this.infoabendListContainer.innerHTML = '<div class="loader mx-auto"></div>';
        const selectedDate = this.infoabendDateSelect.value;
        const scope = this.statsScopeFilter.value; // NEU: Der Scope wird vom Haupt-Dropdown der Termin-Ansicht übernommen.

        let userIds = new Set([this.currentUserId]);
        if (scope === 'group') getSubordinates(this.currentUserId, 'gruppe').forEach(u => userIds.add(u._id));
        else if (scope === 'structure') this.downline.forEach(u => userIds.add(u._id));

        const allETs = db.termine.filter(t => t.Kategorie === 'ET');
        
        // NEU: Erst alle Termine für den Infoabend holen, dann filtern
        const allTermineForInfoabend = allETs.filter(t => {
            const userMatch = userIds.has(t.Mitarbeiter_ID);
            const dateMatch = t.Infoabend && t.Infoabend.startsWith(selectedDate);
            return userMatch && dateMatch;
        });

        const showCancelled = this.infoabendShowCancelled.checked;
        let filteredTermineForDisplay = allTermineForInfoabend.filter(t => {
            return showCancelled || (t.Status !== 'Storno' && !t.Absage);
        });

        this.renderInfoabendTable(filteredTermineForDisplay);
        // NEU: Übergebe die komplette Liste an die Trichter-Funktion für die Quotenberechnung
        this.renderFunnelChart(allTermineForInfoabend);
    }

    renderInfoabendTable(termine) {
         this.infoabendListContainer.innerHTML = '';
         if (termine.length === 0) {
             this.infoabendListContainer.innerHTML = '<p class="text-center text-gray-500">Keine Bewerber für diesen Infoabend gefunden.</p>';
             return;
         }
 
         const sortConfig = this.infoabendSortConfig;
         const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
         termine.sort((a, b) => {
             let valA, valB;
             if (sortConfig.column === 'Mitarbeiter') {
                 valA = db.mitarbeiter.find(m => m._id === a.Mitarbeiter_ID)?.Name || '';
                 valB = db.mitarbeiter.find(m => m._id === b.Mitarbeiter_ID)?.Name || '';
             } else {
                 valA = a[sortConfig.column];
                 valB = b[sortConfig.column];
             }
             let comparison = collator.compare(String(valA), String(valB));
             return sortConfig.direction === 'asc' ? comparison : -comparison;
         });
 
         const tableWrapper = document.createElement('div');
         tableWrapper.className = 'overflow-x-auto';
 
         const table = document.createElement('table');
         table.className = 'appointments-table';
         const headers = [
             { key: 'Terminpartner', label: 'Bewerber' }, { key: 'Status', label: 'Status' },
             { key: 'Mitarbeiter', label: 'Mitarbeiter' }, { key: 'Hinweis', label: 'Hinweis' }
         ];
         table.innerHTML = `<thead><tr>${headers.map(h => {
             const icon = sortConfig.column === h.key ? (sortConfig.direction === 'asc' ? '<i class="fas fa-sort-up sort-icon active"></i>' : '<i class="fas fa-sort-down sort-icon active"></i>') : '<i class="fas fa-sort sort-icon"></i>';
             return `<th data-sort-key="${h.key}">${h.label} ${icon}</th>`;
         }).join('')}</tr></thead>`;
 
         const tbody = document.createElement('tbody');
         termine.forEach(t => {
             const tr = document.createElement('tr');
             // NEU: Zeilen nach Status einfärben
             const { border: statusBorderClass, text: statusTextColorClass } = this._getAppointmentColorClasses(t);
             tr.className = `border-l-8 ${statusBorderClass} cursor-pointer`;
             tr.dataset.id = t._id;
 
             const mitarbeiter = db.mitarbeiter.find(m => m._id === t.Mitarbeiter_ID);
             
             tr.innerHTML = `<td>${t.Terminpartner}</td><td><span class="${statusTextColorClass}">${t.Status}</span></td><td>${mitarbeiter?.Name || '-'}</td><td>${t.Hinweis || '-'}</td>`;
             tr.addEventListener('click', () => {
                 const terminToEdit = termine.find(term => term._id === t._id);
                 if (terminToEdit) {
                     this.openModal(terminToEdit);
                 }
             });
             tbody.appendChild(tr);
         });
         table.appendChild(tbody);
         table.querySelectorAll('thead th').forEach(th => th.addEventListener('click', e => this._handleInfoabendTableSort(e.currentTarget.dataset.sortKey)));
         tableWrapper.appendChild(table);
         this.infoabendListContainer.appendChild(tableWrapper);
    }

    _handleInfoabendTableSort(key) {
        const config = this.infoabendSortConfig;
        if (config.column === key) {
            config.direction = config.direction === 'asc' ? 'desc' : 'asc';
        } else {
            config.column = key;
            config.direction = 'asc';
        }
        this.renderNaechstesInfo();
    }

    renderFunnelChart(termine) {
        this.funnelChartContainer.innerHTML = '';
        const quotasContainer = document.getElementById('funnel-quotas-container');
        if (quotasContainer) quotasContainer.innerHTML = '';

        // Filter out cancelled appointments for the funnel display
        const displayTermine = termine.filter(t => t.Status !== 'Storno' && !t.Absage);

        const stats = {
            'Ausgemacht': displayTermine.length,
            'Gehalten': displayTermine.filter(t => t.Status === 'Gehalten').length,
            'Eingeladen': displayTermine.filter(t => t.Status === 'Info Eingeladen').length,
            'Bestätigt': displayTermine.filter(t => t.Status === 'Info Bestätigt').length,
            'Anwesend': displayTermine.filter(t => t.Status === 'Info Anwesend').length,
            'Wird Mitarbeiter': displayTermine.filter(t => t.Status === 'Wird Mitarbeiter').length,
        };

        const funnelSteps = [
            { label: 'ET Ausgemacht', value: stats.Ausgemacht, color: '#043C64', textColor: 'white' },
            { label: 'ET Gehalten', value: stats.Gehalten, color: '#0a5a8e', textColor: 'white' },
            { label: 'Info Eingeladen', value: stats.Eingeladen, color: '#1c75b5', textColor: 'white' },
            { label: 'Info Bestätigt', value: stats.Bestätigt, color: '#38bdf8', textColor: 'white' },
            { label: 'Info Anwesend', value: stats.Anwesend, color: '#7dd3fc', textColor: 'var(--color-skt-blue)' },
            { label: 'Wird Mitarbeiter', value: stats['Wird Mitarbeiter'], color: '#e0f2fe', textColor: 'var(--color-skt-blue)' }
        ];

        const funnelContainer = document.createElement('div');
        funnelContainer.className = 'funnel-container-animated';
        const maxValue = funnelSteps[0]?.value || 0;

        funnelSteps.forEach(step => {
            const percentage = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
            const stepEl = document.createElement('div');
            stepEl.className = 'funnel-step-animated';
            stepEl.style.backgroundColor = step.color;
            if (step.textColor) stepEl.style.color = step.textColor;
            setTimeout(() => { stepEl.style.width = `${Math.max(20, percentage)}%`; }, 100);
            stepEl.innerHTML = `<span class="funnel-label">${step.label}</span><span class="funnel-value">${step.value}</span>`;
            funnelContainer.appendChild(stepEl);
        });
        this.funnelChartContainer.appendChild(funnelContainer);

        // --- NEU: Quotenberechnung ---
        if (quotasContainer) {
            const totalAusgemacht = termine.length; // Use the full list for total
            const totalGehalten = termine.filter(t => t.Status === 'Gehalten').length;
            const totalWirdMitarbeiter = termine.filter(t => t.Status === 'Wird Mitarbeiter').length;
            const totalStorniert = termine.filter(t => t.Status === 'Storno' || t.Absage === true).length;

            const quoteGehaltenZuWM = totalGehalten > 0 ? (totalWirdMitarbeiter / totalGehalten) * 100 : 0;
            const quoteAusgemachtZuWM = totalAusgemacht > 0 ? (totalWirdMitarbeiter / totalAusgemacht) * 100 : 0;
            const quoteStorno = totalAusgemacht > 0 ? (totalStorniert / totalAusgemacht) * 100 : 0;

            const createQuotaCard = (title, value) => `
                <div class="bg-gray-100 p-3 rounded-lg shadow-inner">
                    <p class="text-sm font-semibold text-skt-blue-light">${title}</p>
                    <p class="text-2xl font-bold text-skt-blue mt-1">${value.toFixed(0)}%</p>
                </div>
            `;

            quotasContainer.innerHTML = 
                createQuotaCard('ET Gehalten -> WM', quoteGehaltenZuWM) +
                createQuotaCard('ET Ausgemacht -> WM', quoteAusgemachtZuWM) +
                createQuotaCard('Stornoquote', quoteStorno);
        }
    }

    _renderPrognosisDetails() {
        const container = this.prognosisDetailsContainer;
        if (!container) return;
        
        // KORREKTUR: Stelle sicher, dass die Sektion immer sichtbar ist.
        const prognosisSection = document.getElementById('prognosis-section');
        if (prognosisSection) prognosisSection.classList.remove('hidden'); // Entfernt die 'hidden' Klasse


        // NEU: Logik zur Gruppierung nach Führungskraft
        const employeeToGroupMap = new Map();
        const leaders = db.mitarbeiter.filter(m => SKT_APP.isUserLeader(m));
        leaders.forEach(leader => {
            employeeToGroupMap.set(leader._id, leader.Name); // Der Leiter gehört zu seiner eigenen Gruppe
            const groupMembers = SKT_APP.getSubordinates(leader._id, 'gruppe');
            groupMembers.forEach(member => employeeToGroupMap.set(member._id, leader.Name));
        });

        const prognosisByGroup = {};
        this.dateAndSearchFilteredAppointments
            .filter(t => t.Kategorie === 'BT' && t.Status !== 'Storno' && t.Absage !== true && t.Umsatzprognose > 0)
            .forEach(t => {
                const employeeId = t.Mitarbeiter_ID?.[0]?.row_id;
                if (!employeeId) return;
                const groupName = employeeToGroupMap.get(employeeId) || 'Ohne Gruppe';
                prognosisByGroup[groupName] = (prognosisByGroup[groupName] || 0) + t.Umsatzprognose;
            });

        // NEU: Gesamtprognose berechnen und Titel aktualisieren
        const totalPrognosis = Object.values(prognosisByGroup).reduce((sum, val) => sum + val, 0);
        const titleElement = document.querySelector('#prognosis-section h3');
        if (titleElement) {
            titleElement.textContent = `Umsatzprognose (${totalPrognosis.toLocaleString('de-DE')} EH)`;
        }

        const sortedPrognosis = Object.entries(prognosisByGroup)
            .sort(([, a], [, b]) => b - a);

        if (sortedPrognosis.length === 0) {
            container.innerHTML = `<div class="h-full flex items-center justify-center text-gray-500">Keine offenen Prognosen vorhanden.</div>`;
            return;
        }

        const list = document.createElement('div');
        list.className = 'space-y-2';
        sortedPrognosis.forEach(([name, value]) => {
            const item = document.createElement('div');
            item.className = 'prognosis-item flex justify-between items-center';
            item.innerHTML = `<span class="font-semibold text-skt-blue text-sm">${name}</span><span class="font-bold text-skt-green-accent">${value.toLocaleString('de-DE')} EH</span>`;
            list.appendChild(item);
        });
        container.appendChild(list);
    }

    _toggleStatsVisibility() {
        this.statsContent.classList.toggle('collapsed');
        this.toggleStatsBtn.classList.toggle('collapsed');
    }

    _updateStatsToggleButtons() {
        this.statsByEmployeeBtn.classList.toggle('active', this.statsChartMode === 'employee');
        this.statsByStatusBtn.classList.toggle('active', this.statsChartMode === 'status');
    }

    _renderStatsChart() {
        let data;

        if (this.statsChartMode === 'employee') {
            this.statsChartTitle.textContent = 'Termine nach Mitarbeiter';
            const statsByMitarbeiter = {};
            this.dateAndSearchFilteredAppointments.forEach(t => { // KORREKTUR: Mitarbeitername wird jetzt aus der DB nachgeschlagen.
                const name = findRowById('mitarbeiter', t.Mitarbeiter_ID)?.Name || 'Unbekannt';
                statsByMitarbeiter[name] = (statsByMitarbeiter[name] || 0) + 1;
            });
            data = Object.entries(statsByMitarbeiter).map(([label, value], index) => ({
                label,
                value,
                color: this._getColorForIndex(index)
            }));
        } else { // 'status'
            this.statsChartTitle.textContent = 'Termine nach Status';
            const statsByStatus = {};
            this.dateAndSearchFilteredAppointments.forEach(t => {
                const status = t.Status || 'Unbekannt';
                statsByStatus[status] = (statsByStatus[status] || 0) + 1;
            });
            data = Object.entries(statsByStatus).map(([label, value]) => ({
                label,
                value,
                color: this._getHexColorForStatus(label)
            }));
        }

        data.sort((a, b) => b.value - a.value);
        this._createPieChart(data);
    }

    _getColorForIndex(index) {
        const colors = ['#002147', '#f97316', '#3b82f6', '#27ae60', '#8e44ad', '#f1c40f', '#FF6347', '#d4af37', '#043C64', '#c7c7c7'];
        return colors[index % colors.length];
    }

    _getHexColorForStatus(status) {
        const hexColorMap = {
            'Storno': '#FF6347',
            'Gehalten': '#27ae60',
            'Ausgemacht': '#c7c7c7',
            'weiterer BT': '#c7c7c7',
            'weiterer ET': '#c7c7c7',
            'Verschoben': '#f97316',
            'offen': '#f97316',
            'Info Eingeladen': '#f1c40f',
            'Info Bestätigt': '#3b82f6',
            'Info Anwesend': '#8e44ad',
            'Wird Mitarbeiter': '#d4af37',
            'default': '#9ca3af'
        };
        return hexColorMap[status] || hexColorMap['default'];
    }

    _createPieChart(data) {
        const pieContainer = this.statsPieChartContainer;
        const legendContainer = this.statsPieChartLegend;
        pieContainer.innerHTML = '';
        legendContainer.innerHTML = '';

        if (data.length === 0 || data.every(d => d.value === 0)) {
            pieContainer.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500">Keine Daten für Diagramm</div>`;
            return;
        }

        const totalValue = data.reduce((sum, item) => sum + item.value, 0);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('viewBox', '0 0 64 64');
        svg.classList.add('pie-chart-svg');

        let accumulatedPercentage = 0;
        data.forEach(item => {
            const percentage = (item.value / totalValue) * 100;
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', '32');
            circle.setAttribute('cy', '32');
            circle.setAttribute('r', '16');
            circle.style.stroke = item.color;
            circle.style.strokeDasharray = `${percentage} 100`;
            circle.style.strokeDashoffset = -accumulatedPercentage;
            svg.appendChild(circle);
            accumulatedPercentage += percentage;

            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-color-dot" style="background-color: ${item.color};"></div>
                <div class="legend-label" title="${item.label}">${item.label}</div>
                <div class="legend-value">${item.value}</div>
            `;
            legendContainer.appendChild(legendItem);
        });

        pieContainer.appendChild(svg);
    }

    toggleConditionalFields(category) {
        this.form.querySelector('#appointment-prognose-container').classList.toggle('hidden', !['BT', 'ST'].includes(category));
        this.form.querySelector('#appointment-infoabend-container').classList.toggle('hidden', category !== 'ET');

        // NEU: Logik für das Empfehlungsfeld
        const referralsSingleContainer = this.form.querySelector('#appointment-referrals-container-single');
        const referralsPairedContainer = this.form.querySelector('#appointment-referrals-container-paired');

        if (['AT', 'NT'].includes(category)) {
            // Zeige Empfehlungen im Haupt-Grid an
            referralsSingleContainer.classList.remove('hidden');
            referralsPairedContainer.classList.add('hidden');
        } else if (category === 'ET') {
            // Blende beide Empfehlungsfelder aus
            referralsSingleContainer.classList.add('hidden');
            referralsPairedContainer.classList.add('hidden');
        } else { // BT, ST, Immo
            // Zeige Empfehlungen neben der Prognose an
            referralsSingleContainer.classList.add('hidden');
            referralsPairedContainer.classList.remove('hidden');
        }
    }

    openModal(termin = null) {
        appointmentsLog('--- START: openModal ---', termin ? `Editing term ID: ${termin?._id}` : 'Creating new term');
        const hintsContainer = this.modal.querySelector('#appointment-modal-hints');
        hintsContainer.innerHTML = '';
        hintsContainer.classList.add('hidden');


        // NEU: Logik für wiederkehrende Termine
        let dateForForm = termin ? termin.Datum : null;
        let isRecurring = false;
        if (termin && termin.isRecurringInstance) {
            isRecurring = true;
            const originalTermin = this.allAppointments.find(t => t._id === termin.originalId);
            if (originalTermin) {
                // Bearbeite immer die Serie, nicht die einzelne Instanz
                termin = originalTermin;
            }
        }

        try {
            this.form.reset();
            const title = this.modal.querySelector('#appointment-modal-title');
            const idInput = this.modal.querySelector('#appointment-id');
            const userSelect = this.modal.querySelector('#appointment-user');
            const inviteeSelect = this.modal.querySelector('#appointment-invitee');
            const categorySelect = this.modal.querySelector('#appointment-category');
            appointmentsLog('Modal elements found.');

            // NEU: Logik für Dropdowns überarbeitet, um 3 Ebenen Vorgesetzte einzuschließen
            const currentUserForDropdowns = SKT_APP.currentlyViewedUserData;
            const downlineForDropdowns = SKT_APP.getAllSubordinatesRecursive(currentUserForDropdowns._id);
            const ancestors = getAncestors(currentUserForDropdowns._id, 3);

            const availableUsersSet = new Set([currentUserForDropdowns, ...downlineForDropdowns, ...ancestors]);
            const sortedAvailableUsers = Array.from(availableUsersSet)
                .filter(Boolean) // Filtert eventuelle null/undefined-Einträge
                .sort((a, b) => a.Name.localeCompare(b.Name));

            // Beide Dropdowns mit der gleichen Benutzerliste befüllen
            userSelect.innerHTML = '';
            sortedAvailableUsers.forEach(u => userSelect.add(new Option(u.Name, u._id)));

            inviteeSelect.innerHTML = '<option value="">-- Kein --</option>';
            sortedAvailableUsers.forEach(u => inviteeSelect.add(new Option(u.Name, u._id)));

            appointmentsLog('User dropdowns populated.');

            if (!METADATA || !METADATA.tables) {
                throw new Error("METADATA or METADATA.tables is not available.");
            }
            const terminMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'termine');
            if (!terminMeta) {
                throw new Error("Could not find metadata for table 'Termine'.");
            }
            appointmentsLog('Found metadata for Termine table.');

            const categoryColumn = terminMeta.columns.find(c => c.name === 'Kategorie');
            if (!categoryColumn || !categoryColumn.data || !categoryColumn.data.options) throw new Error("Could not find 'Kategorie' options in metadata.");
            const categories = categoryColumn.data.options.map(o => o.name);

            categorySelect.innerHTML = '';
            categories.forEach(cat => categorySelect.add(new Option(cat, cat)));
            appointmentsLog('Category dropdown populated.');

            if (termin) { // Edit mode
                appointmentsLog('Entering edit mode for termin:', termin);
                // NEU: Logik für Hinweise im Modal
                this._renderModalHints(termin, hintsContainer);
                title.textContent = 'Termin bearbeiten';
                idInput.value = termin._id; // KORREKTUR: Robusterer Zugriff auf die ID, da sie nach der Normalisierung ein String sein kann.
                const mitarbeiterId = Array.isArray(termin.Mitarbeiter_ID) ? termin.Mitarbeiter_ID?.[0]?.row_id : termin.Mitarbeiter_ID;
                if (mitarbeiterId) {
                    // Stelle sicher, dass die Option existiert, bevor du sie setzt
                    if (userSelect.querySelector(`option[value="${mitarbeiterId}"]`)) {
                        userSelect.value = mitarbeiterId;
                    } else {
                        const mitarbeiterName = termin.Mitarbeiter_ID?.[0]?.display_value || 'Unbekannter Mitarbeiter';
                        userSelect.add(new Option(mitarbeiterName, mitarbeiterId));
                        userSelect.value = mitarbeiterId;
                        console.warn(`Mitarbeiter ${mitarbeiterName} (${mitarbeiterId}) war nicht im Dropdown und wurde temporär hinzugefügt.`);
                    }
                }
                
                // KORREKTUR: `datetime-local` erwartet das Format YYYY-MM-DDTHH:mm
                // `toISOString()` konvertiert in UTC, was zu Zeitzonenfehlern führt.
                // Wir müssen das Datum manuell in das korrekte lokale Format umwandeln.
                if (dateForForm) {
                    const localDate = new Date(dateForForm);
                    // Wir ziehen den Zeitzonen-Offset ab, um die "echte" lokale Zeit zu bekommen, die dann korrekt als String formatiert wird.
                    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
                    this.form.querySelector('#appointment-date').value = localDate.toISOString().slice(0, 16);
                } else {
                    this.form.querySelector('#appointment-date').value = '';
                }
                categorySelect.value = termin.Kategorie || '';
                // NEU: Neue Felder befüllen
                this.form.querySelector('#appointment-location').value = termin.Ort || '';
                // KORREKTUR: Dauer von Sekunden in Minuten umrechnen
                const durationInSeconds = termin.Dauer;
                if (durationInSeconds) {
                    this.form.querySelector('#appointment-duration').value = Math.round(durationInSeconds / 60);
                } else {
                    this.form.querySelector('#appointment-duration').value = '';
                }
                // KORREKTUR: Robusterer Zugriff auf die ID, da sie nach der Normalisierung ein String sein kann.
                const inviteeId = Array.isArray(termin.Eingeladener) ? termin.Eingeladener?.[0]?.row_id : termin.Eingeladener;
                if (inviteeId) {
                    inviteeSelect.value = inviteeId;
                } else {
                    inviteeSelect.value = '';
                }
                this.form.querySelector('#appointment-partner').value = termin.Terminpartner || '';
                this.form.querySelector('#appointment-prognose').value = termin.Umsatzprognose || '';
                // NEU: Wert in beide Empfehlungsfelder schreiben
                this.form.querySelector('#appointment-referrals-single').value = termin.Empfehlungen || '';
                this.form.querySelector('#appointment-referrals-paired').value = termin.Empfehlungen || '';

                this.form.querySelector('#appointment-note').value = termin.Hinweis || '';
                this.form.querySelector('#appointment-cancellation').checked = termin.Absage || false;
                this.form.querySelector('#appointment-cancellation-reason').value = termin.Absagegrund || '';
                // NEU: Wiederholungs-Dropdown befüllen
                this.form.querySelector('#appointment-recurrence').value = termin.Wiederholung || '';
                this.form.querySelector('#appointment-infoabend-date').value = termin.Infoabend ? termin.Infoabend.split('T')[0] : '';

                this._updateStatusDropdown(termin.Kategorie, termin.Status);
                this.toggleConditionalFields(termin.Kategorie, false);

            } else { // Add mode
                appointmentsLog('Entering add mode.');
                title.textContent = 'Termin anlegen';
                idInput.value = '';
                userSelect.value = this.currentUserId;
                // KORREKTUR: `toISOString()` konvertiert in UTC. Um die korrekte lokale Zeit zu erhalten,
                // muss der Zeitzonen-Offset manuell korrigiert werden, bevor der String erzeugt wird.
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                this.form.querySelector('#appointment-date').value = now.toISOString().slice(0, 16);

                // NEU: Neue Felder leeren
                this.form.querySelector('#appointment-location').value = '';
                this.form.querySelector('#appointment-duration').value = '';
                inviteeSelect.value = '';

                // KORREKTUR: Veraltete `currentTab`-Logik entfernt.
                // Die Logik wird jetzt durch den neuen Event-Listener in `_handleCategoryChange` gesteuert.
                // Wir rufen die Funktion hier einmal auf, um den initialen Zustand zu setzen.
                this._handleCategoryChange(categorySelect.value);
            }

            this.form.querySelector('#appointment-cancellation-reason-container').classList.toggle('hidden', !this.form.querySelector('#appointment-cancellation').checked);
            
            // NEU: Wiederholungs-Container basierend auf der Kategorie ein-/ausblenden
            const recurrenceContainer = this.form.querySelector('#appointment-recurrence-container');
            if (recurrenceContainer) {
                recurrenceContainer.classList.toggle('hidden', !['Sonstiges', 'PG'].includes(categorySelect.value));
            }
            
            this.modal.classList.add('visible');
            document.body.classList.add('modal-open');
            appointmentsLog('Modal is now visible.');

        } catch (error) {
            appointmentsLog('!!! ERROR in openModal !!!', error);
            alert('Ein Fehler ist beim Öffnen des Formulars aufgetreten. Details siehe Konsole.');
        }
        appointmentsLog('--- END: openModal ---');
    }

    _renderModalHints(termin, container) {
        const hintLog = (message, ...data) => console.log(`%c[ModalHint] %c${message}`, 'color: #9b59b6; font-weight: bold;', 'color: black;', ...data);
        let hintsFound = false;
        container.innerHTML = '';

        // Hinweis für zugeordnete Umsätze bei BT-Terminen
        if (termin.Kategorie === 'BT' && termin.Terminpartner) {
            const partnerName = termin.Terminpartner;
            hintLog(`Prüfe auf Umsatz für BT mit Partner: '${partnerName}'`);
            const terminDate = new Date(termin.Datum);
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            const searchStart = new Date(terminDate.getTime() - oneWeek);
            const searchEnd = new Date(terminDate.getTime() + oneWeek);
            const relatedSales = db.umsatz.filter(sale =>
                sale.Kunde && partnerName && sale.Kunde.trim().toLowerCase() === partnerName.trim().toLowerCase() &&
                sale.Datum && new Date(sale.Datum) >= searchStart && new Date(sale.Datum) <= searchEnd
            );

            if (relatedSales.length > 0) {
                hintsFound = true;
                let salesHtml = '<strong>Zugeordneter Umsatz:</strong><ul class="list-disc list-inside pl-2 mt-1 text-sm">';
                relatedSales.forEach(sale => {
                    // KORREKTUR: Produktnamen über die ID aus db.produkte nachschlagen.
                    const produkt = db.produkte.find(p => p._id === sale.Produkt_ID);
                    const productName = produkt ? produkt.Produkt : 'Unbekannt';                    salesHtml += `<li>${(sale.EH || 0).toFixed(2)} EH - ${productName} am ${new Date(sale.Datum).toLocaleDateString('de-DE')}</li>`;
                });
                salesHtml += '</ul>';
                const hintEl = document.createElement('div');
                hintEl.className = 'p-3 bg-green-50 border border-green-200 rounded-lg text-green-800';
                hintEl.innerHTML = salesHtml;
                container.appendChild(hintEl);
            }
        }

        // Hinweis für zugehörige PG-Einträge
        if (termin.Kategorie === 'PG') {
            hintLog(`Prüfe auf PG-Eintrag für PG-Termin:`, termin);
            let personId = null;
            if (termin.Eingeladener && termin.Eingeladener[0]) {
                personId = termin.Eingeladener[0].row_id;
            } else if (termin.Terminpartner) {
                const partnerUser = db.mitarbeiter.find(m => m.Name.toLowerCase() === termin.Terminpartner.toLowerCase());
                if (partnerUser) personId = partnerUser._id;
            }

            if (personId) {
                const terminDateString = new Date(termin.Datum).toISOString().split('T')[0];
                const relatedPg = db.pg.find(pg => {
                    const pgMitarbeiterId = pg.Mitarbeiter?.[0]?.row_id || pg.Mitarbeiter;
                    return pgMitarbeiterId === personId && pg.Datum && pg.Datum.startsWith(terminDateString);
                });
                if (relatedPg) {
                    hintsFound = true;
                    const hintEl = document.createElement('div');
                    hintEl.className = 'p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 cursor-pointer hover:bg-blue-100'; // KORREKTUR: Setze eine globale Variable und rufe dann switchView auf.
                    hintEl.innerHTML = `<i class="fas fa-comments mr-2"></i>Es existiert ein PG-Eintrag für diesen Tag. Klicke hier, um ihn zu öffnen.`;
                    hintEl.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.closeModal();
                        pendingPgIdToOpen = relatedPg._id;
                        switchView('pg-tagebuch');
                    });
                    container.appendChild(hintEl);
                }
            }
        }

        if (hintsFound) {
            container.classList.remove('hidden');
        }
    }

    closeModal() {
        this.modal.classList.remove('visible');
        document.body.classList.remove('modal-open');

        // Setzt den Speicher-Button zuverlässig in den Standardzustand zurück, wenn das Modal geschlossen wird.
        const saveBtn = document.getElementById('save-appointment-btn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.querySelector('#save-btn-text').textContent = 'Speichern';
            saveBtn.querySelector('#save-btn-text').classList.remove('hidden');
            saveBtn.querySelector('.loader-small').classList.add('hidden');
            saveBtn.classList.remove('bg-skt-green-accent');
            saveBtn.classList.add('bg-skt-blue', 'hover:bg-skt-blue-light');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        appointmentsLog('--- START: handleFormSubmit ---');
        const saveBtn = document.getElementById('save-appointment-btn');
        const saveBtnText = saveBtn.querySelector('#save-btn-text');
        const saveBtnLoader = saveBtn.querySelector('.loader-small');

        saveBtn.disabled = true;
        saveBtnText.classList.add('hidden');
        saveBtnLoader.classList.remove('hidden');

        try {
            const rowId = this.form.querySelector('#appointment-id').value;
            const isNewAppointment = !rowId;
            const isCancellation = this.form.querySelector('#appointment-cancellation').checked;

            // NEU: Prüfen, ob ein AT auf "Gehalten" gesetzt wird
            const originalTermin = isNewAppointment ? null : this.allAppointments.find(t => t._id === rowId);
            const newStatus = this.form.querySelector('#appointment-status').value;
            const newCategory = this.form.querySelector('#appointment-category').value;
            const isAtGehalten = 
                !isNewAppointment && 
                originalTermin.Kategorie === 'AT' && 
                newStatus === 'Gehalten' && 
                originalTermin.Status !== 'Gehalten';
            // Log individual form values
            const mitarbeiterId = this.form.querySelector('#appointment-user').value;
            const datum = this.form.querySelector('#appointment-date').value;
            const kategorie = this.form.querySelector('#appointment-category').value;
            const status = this.form.querySelector('#appointment-status').value;
            const terminpartner = this.form.querySelector('#appointment-partner').value;
            const location = this.form.querySelector('#appointment-location').value;
            const duration = this.form.querySelector('#appointment-duration').value;
            const inviteeId = this.form.querySelector('#appointment-invitee').value;
            const prognoseRaw = this.form.querySelector('#appointment-prognose').value;
            // NEU: Wert aus dem sichtbaren Empfehlungsfeld lesen
            const empfehlungenRaw = this.form.querySelector('#appointment-referrals-container-single').classList.contains('hidden')
                ? this.form.querySelector('#appointment-referrals-paired').value
                : this.form.querySelector('#appointment-referrals-single').value;
            const hinweis = this.form.querySelector('#appointment-note').value;
            const absagegrund = this.form.querySelector('#appointment-cancellation-reason').value;
            const infoabend = this.form.querySelector('#appointment-infoabend-date').value;
            const wiederholung = this.form.querySelector('#appointment-recurrence').value;

            // NEU: Validierung für Dauer
            if (!duration || parseInt(duration) <= 0) {
                alert('Bitte geben Sie eine gültige Dauer für den Termin an (größer als 0 Minuten).');
                saveBtn.disabled = false;
                saveBtnText.classList.remove('hidden');
                saveBtnLoader.classList.add('hidden');
                this.form.querySelector('#appointment-duration').focus();
                return;
            }

            // NEU: Validierung für Absagegrund
            if (isCancellation && !absagegrund.trim()) {
                alert('Bitte geben Sie einen Absagegrund an.');
                saveBtn.disabled = false;
                saveBtnText.classList.remove('hidden');
                saveBtnLoader.classList.add('hidden');
                this.form.querySelector('#appointment-cancellation-reason').focus();
                return;
            }
            
            // NEU: Validierung für Infoabend-Datum
            if (kategorie === 'ET' && infoabend) {
                const infoabendDate = new Date(infoabend);
                if (!isDateValidInfoabend(infoabendDate)) {
                    alert('Das ausgewählte Datum ist kein gültiger Infoabend-Termin. Infoabende finden alle 3 Wochen an einem Mittwoch statt.');
                    // Reset save button state
                    saveBtn.disabled = false;
                    saveBtnText.classList.remove('hidden');
                    saveBtnLoader.classList.add('hidden');
                    return; // Stop submission
                }
            }

            // NEU: Duplikatsprüfung beim Anlegen eines neuen Termins
            if (isNewAppointment && terminpartner) {
                const newAppointmentDate = new Date(datum).toISOString().split('T')[0]; // Nur das Datum vergleichen

                const potentialDuplicate = this.allAppointments.find(t => {
                    // KORREKTUR: Robusterer Zugriff auf die Mitarbeiter-ID, da sie normalisiert sein kann oder nicht.
                    const existingMitarbeiterId = t.Mitarbeiter_ID?.[0]?.row_id || t.Mitarbeiter_ID;
                    const existingDate = t.Datum ? new Date(t.Datum).toISOString().split('T')[0] : null;

                    return t.Terminpartner && t.Terminpartner.toLowerCase() === terminpartner.toLowerCase() &&
                           existingMitarbeiterId === mitarbeiterId &&
                           existingDate === newAppointmentDate;
                });

                if (potentialDuplicate) {
                    const confirmed = await showConfirmationModal(
                        `Es existiert bereits ein Termin für "${terminpartner}" an diesem Tag. Möchten Sie den Termin trotzdem anlegen?`,
                        'Doppelter Termin?',
                        'Ja, trotzdem anlegen',
                        'Abbrechen'
                    );
                    if (!confirmed) {
                        saveBtn.disabled = false; saveBtnText.classList.remove('hidden'); saveBtnLoader.classList.add('hidden');
                        return; // Stop the submission
                    }


                }
            }
            
            const terminMap = SKT_APP.COLUMN_MAPS.termine;
            const rowData = {
                [terminMap.Mitarbeiter_ID]: [mitarbeiterId],
                [terminMap.Datum]: datum,
                [terminMap.Kategorie]: kategorie,
                [terminMap.Status]: status,
                [terminMap.Terminpartner]: terminpartner,
                [terminMap.Umsatzprognose]: parseFloat(prognoseRaw) || null,
                [terminMap.Empfehlungen]: parseInt(empfehlungenRaw) || null,
                [terminMap.Hinweis]: hinweis,
                [terminMap.Absage]: isCancellation,
                [terminMap.Absagegrund]: isCancellation ? absagegrund : '',
                [terminMap.Infoabend]: kategorie === 'ET' ? infoabend : null,
                [terminMap.Wiederholung]: wiederholung || null,
            };

            // NEU: Neue Felder sicher hinzufügen, um Fehler bei veraltetem Cache zu vermeiden
            if (terminMap.Ort) {
                rowData[terminMap.Ort] = location || null;
            } else { appointmentsLog('WARNUNG: Spalte "Ort" nicht in COLUMN_MAPS gefunden. Feld wird nicht gespeichert.'); }
            if (terminMap.Dauer) {
                const durationInMinutes = parseInt(duration);
                if (!isNaN(durationInMinutes) && durationInMinutes > 0) {
                    rowData[terminMap.Dauer] = durationInMinutes * 60; // In Sekunden umrechnen
                } else {
                    rowData[terminMap.Dauer] = null;
                }
            } else { appointmentsLog('WARNUNG: Spalte "Dauer" nicht in COLUMN_MAPS gefunden. Feld wird nicht gespeichert.'); }
            if (terminMap.Eingeladener) {
                rowData[terminMap.Eingeladener] = inviteeId ? [inviteeId] : null;
            } else { appointmentsLog('WARNUNG: Spalte "Eingeladener" nicht in COLUMN_MAPS gefunden. Feld wird nicht gespeichert.'); }

            const terminId = rowId 
                ? await SKT_APP.seaTableUpdateTermin(rowId, rowData)
                : await SKT_APP.seaTableAddTermin(rowData);

            appointmentsLog(`API call finished. Termin ID: ${terminId}`);

            if (terminId) {
                appointmentsLog('API call successful. Showing success message and refreshing.');
                
                // KORREKTUR: Cache für Termine invalidieren und neu laden, damit neue Termine sofort sichtbar sind.
                localStorage.removeItem(CACHE_PREFIX + 'termine');
                db.termine = await seaTableQuery('Termine');
                normalizeAllData(); // Wichtig, um die neuen Daten zu normalisieren
                appointmentsLog('Termin-Cache invalidiert und Daten neu geladen.');
                
                // NEU: iCal-Download-Logik
                const downloadIcalCheckbox = this.form.querySelector('#appointment-download-ical');
                if (downloadIcalCheckbox.checked && isNewAppointment) {
                    // Wir müssen die Daten neu laden, damit der neue Termin in `this.allAppointments` ist.
                    await this.fetchAndRender();
                    this._addToCalendar(terminId);
                } else {
                    // Wenn kein Download, einfach nur neu laden.
                    await this.fetchAndRender();
                }

                saveBtnText.textContent = 'Gespeichert!';
                saveBtnLoader.classList.add('hidden');
                saveBtnText.classList.remove('hidden');
                saveBtn.classList.remove('bg-skt-blue', 'hover:bg-skt-blue-light');
                saveBtn.classList.add('bg-skt-green-accent');

                if (isAtGehalten) {
                    this._openBtFollowUpModal(originalTermin);
                    return;
                }
                setTimeout(() => this.closeModal(), 1500);

            } else {
                appointmentsLog('!!! FEHLER: API call was not successful.');
                console.error('Fehler beim Speichern des Termins. API-Aufruf war nicht erfolgreich. Überprüfe die Netzwerk-Antwort in den Entwicklertools für mehr Details.');
                saveBtn.disabled = false;
                saveBtnText.classList.remove('hidden');
                saveBtnLoader.classList.add('hidden');
            }
        } catch (error) {
            appointmentsLog('!!! CRITICAL ERROR in handleFormSubmit !!!', error);
            console.error('Ein kritischer Fehler ist aufgetreten. Details siehe Konsole.', error);
            saveBtn.disabled = false;
            saveBtnText.classList.remove('hidden');
            saveBtnLoader.classList.add('hidden');
        }
    }

    // NEU: Funktion zum Öffnen des BT-Folge-Modals
    _openBtFollowUpModal(originalAt) {
        this.closeModal(); // Schließe das Haupt-Terminmodal
        // KORREKTUR: Body-Scroll sperren, wenn das Modal geöffnet wird.
        document.body.classList.add('modal-open');

        this.btFollowUpForm.reset();
        this.btFollowUpForm.querySelector('#bt-follow-up-original-at-id').value = originalAt._id;
        this.btFollowUpForm.querySelector('#bt-follow-up-partner-name').value = originalAt.Terminpartner;
        this.btFollowUpForm.querySelector('#bt-follow-up-owner-id').value = originalAt.Mitarbeiter_ID?.[0]?.row_id || originalAt.Mitarbeiter_ID;
        
        // NEU: Speichere die ID des ursprünglichen ATs im Modal-Element, um sie bei "Abbrechen" zu verwenden.
        this.btFollowUpModal.dataset.originalAtId = originalAt._id;
        // NEU: Produkt-Auswahl befüllen
        const produkteContainer = this.btFollowUpForm.querySelector('#bt-follow-up-produkte-container');
        produkteContainer.innerHTML = '';
        const produkteDisplayKey = 'Produkt';
        const produkteToExclude = ['FLV Erhöhung', 'Einmalerlag', 'FLV Einmalerlag', 'Strom', 'Gas'];
        
        const filteredProdukte = db.produkte.filter(p => !produkteToExclude.includes(p[produkteDisplayKey]));

        filteredProdukte.forEach(p => {
            const produktName = p[produkteDisplayKey] || p.Name;
            const checkboxWrapper = document.createElement('label');
            checkboxWrapper.className = 'flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-200 cursor-pointer';
            checkboxWrapper.innerHTML = `
                <input type="checkbox" name="bt_follow_up_produkt" value="${produktName}" class="h-4 w-4 rounded border-gray-300 text-skt-blue focus:ring-skt-blue-light">
                <span class="text-sm text-gray-700">${produktName}</span>
            `;
            produkteContainer.appendChild(checkboxWrapper);
        });

        this._toggleBtFollowUpSections(null); // Blendet beide Sektionen initial aus
        this.btFollowUpModal.classList.add('visible');
    }

    // NEU: Funktion zum Ein-/Ausblenden der Sektionen im Folge-Modal
    _toggleBtFollowUpSections(action) {
        document.getElementById('bt-follow-up-plan-bt-container').classList.toggle('hidden', action !== 'plan_bt');
        document.getElementById('bt-follow-up-no-bt-container').classList.toggle('hidden', action !== 'no_bt');
    }
    // NEU: Funktion zum Verarbeiten des BT-Folge-Formulars
    async _handleBtFollowUpSubmit(e) {
        e.preventDefault();
        const saveBtn = this.btFollowUpForm.querySelector('#save-bt-follow-up-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Speichern...';

        const originalAtId = this.btFollowUpForm.querySelector('#bt-follow-up-original-at-id').value;
        const selectedAction = this.btFollowUpForm.querySelector('input[name="bt_follow_up_action"]:checked')?.value;
        const btDate = this.btFollowUpForm.querySelector('#bt-follow-up-date').value;
        const noBtReason = this.btFollowUpForm.querySelector('#bt-follow-up-no-bt-reason').value;

        if (!selectedAction || (selectedAction === 'plan_bt' && !btDate) || (selectedAction === 'no_bt' && !noBtReason)) {
            alert('Bitte wähle eine Aktion und fülle die entsprechenden Felder aus.');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Aktion speichern';
            return;
        }

        let success = true;

        if (selectedAction === 'plan_bt') {
            // Neuen BT-Termin anlegen
            const partnerName = this.btFollowUpForm.querySelector('#bt-follow-up-partner-name').value;
            const ownerId = this.btFollowUpForm.querySelector('#bt-follow-up-owner-id').value;
            const selectedProdukte = Array.from(this.btFollowUpForm.querySelectorAll('input[name="bt_follow_up_produkt"]:checked')).map(cb => cb.value);
            const prognose = parseFloat(this.btFollowUpForm.querySelector('#bt-follow-up-prognose').value) || null;
            const notiz = this.btFollowUpForm.querySelector('#bt-follow-up-notiz').value;
            const produkteText = selectedProdukte.length > 0 ? `Geplante Produkte: ${selectedProdukte.join(', ')}` : '';

            const rowData = {
                [SKT_APP.COLUMN_MAPS.termine.Mitarbeiter_ID]: [ownerId],
                [SKT_APP.COLUMN_MAPS.termine.Datum]: btDate,
                [SKT_APP.COLUMN_MAPS.termine.Kategorie]: 'BT',
                [SKT_APP.COLUMN_MAPS.termine.Status]: 'Ausgemacht',
                [SKT_APP.COLUMN_MAPS.termine.Terminpartner]: partnerName,
                [SKT_APP.COLUMN_MAPS.termine.Umsatzprognose]: prognose,
                [SKT_APP.COLUMN_MAPS.termine.Hinweis]: `${produkteText}\n${notiz}`.trim(),
            };
            success = await SKT_APP.seaTableAddRow('Termine', rowData);
        } else if (selectedAction === 'no_bt') {
            // Grund im ursprünglichen AT speichern
            // NEU: Status auf "Gehalten" setzen, da die Aktion jetzt abgeschlossen ist.
            const rowData = {
                [SKT_APP.COLUMN_MAPS.termine.Status]: 'Gehalten',
                [SKT_APP.COLUMN_MAPS.termine.Hinweis]: `Kein BT, Grund: ${noBtReason}`
            };
            success = await SKT_APP.seaTableUpdateRow('Termine', originalAtId, rowData);
        }

        // NEU: Wenn eine Aktion (BT planen oder Kein BT) erfolgreich war, setze den Status des ursprünglichen AT auf "Gehalten".
        if (success && selectedAction === 'plan_bt') {
            const updateAtStatusData = { [SKT_APP.COLUMN_MAPS.termine.Status]: 'Gehalten' };
            await SKT_APP.seaTableUpdateRow('Termine', originalAtId, updateAtStatusData);
        }

        if (success) {
            await this.fetchAndRender();
            // KORREKTUR: Body-Scroll wieder aktivieren, wenn das Modal geschlossen wird.
            document.body.classList.remove('modal-open');
            // KORREKTUR: Body-Scroll wieder aktivieren, wenn das Modal geschlossen wird.
            document.documentElement.classList.remove('modal-open');
            this.btFollowUpModal.classList.remove('visible');
        } else {
            alert('Ein Fehler ist aufgetreten. Die Aktion konnte nicht gespeichert werden.');
        }

        saveBtn.disabled = false;
        saveBtn.textContent = 'Aktion speichern';
    }



    // NEU: Generische Funktion zum Ein-/Ausklappen von Sektionen
    _toggleCollapsible(contentElement, buttonElement) {
        contentElement.classList.toggle('collapsed');
        buttonElement.classList.toggle('collapsed');
    }

    // NEU: Methode zum Umschalten der Analyse-Tabs
    _switchAnalysisTab(tabName) {
        this.statsViewPane.classList.toggle('hidden', tabName !== 'stats');
        this.heatmapViewPane.classList.toggle('hidden', tabName !== 'heatmap');
        const activeClass = 'border-skt-blue text-skt-blue';
        const inactiveClass = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
        this.statsTab.className = `analysis-tab whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base ${tabName === 'stats' ? activeClass : inactiveClass}`;
        this.heatmapTab.className = `analysis-tab whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base ${tabName === 'heatmap' ? activeClass : inactiveClass}`;
    }

    // NEU: Eigene Methode, um auf Kategorie-Änderungen zu reagieren.
    _handleCategoryChange(newCategory) {
        // Status-Dropdown aktualisieren
        this._updateStatusDropdown(newCategory);
        // Bedingte Felder ein-/ausblenden
        this.toggleConditionalFields(newCategory);
        // Wenn die neue Kategorie "ET" ist, das Datum für den nächsten Infoabend setzen.
        if (newCategory === 'ET') {
            this.form.querySelector('#appointment-infoabend-date').value = findNextInfoDateAfter(getCurrentDate()).toISOString().split('T')[0];
        }

        // NEU: Wiederholungs-Container ein-/ausblenden
        const recurrenceContainer = this.form.querySelector('#appointment-recurrence-container');
        if (recurrenceContainer) {
            recurrenceContainer.classList.toggle('hidden', !['Sonstiges', 'PG'].includes(newCategory));
        }
    }

    // NEU: Methode zum Rendern der Heatmap
    _renderHeatmap() {
        if (!this.heatmapGrid) return;
        this.heatmapGrid.innerHTML = '';

        const { startDate, endDate } = SKT_APP.getMonthlyCycleDates();
        const appointmentsByDay = _.groupBy(this.dateAndSearchFilteredAppointments, t => t.Datum ? t.Datum.split('T')[0] : null);
        
        const counts = Object.values(appointmentsByDay).map(arr => arr.length).filter(c => c > 0);
        const minAppointments = Math.min(...counts, 1);
        const maxAppointments = Math.max(...counts, 1);
        const range = maxAppointments - minAppointments;

        // Leere Zellen für die Tage vor dem Zyklusstart hinzufügen, um an Montag auszurichten
        const firstDayOfWeek = (startDate.getDay() === 0) ? 6 : startDate.getDay() - 1; // 0=Monday, 6=Sunday
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'bg-skt-grey-light rounded'; // Unsichtbare Füllzelle
            this.heatmapGrid.appendChild(emptyCell);
        }

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            // KORREKTUR: `toISOString()` konvertiert in UTC, was zu einem "off-by-one" Fehler führt.
            // Wir erstellen den YYYY-MM-DD String manuell, um die lokale Zeitzone beizubehalten.
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const day = currentDate.getDate().toString().padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            const count = appointmentsByDay[dateString]?.length || 0;
            
            const cell = document.createElement('div');
            cell.className = `h-12 w-full rounded flex items-center justify-center text-xs font-bold transition-colors`;
            
            // NEU: Farbverlauf Logik
            if (count === 0) {
                cell.classList.add('bg-gray-100', 'text-gray-400'); // Farblos für Tage ohne Termine
            } else {
                cell.classList.add('cursor-pointer');
                
                // Farbverlauf von Rot (wenige Termine) zu Grün (viele Termine) in den Thementönen
                const startH = 9, startS = 85, startL = 60; // Gedämpftes Rot, basierend auf --color-accent-red
                const endH = 145, endS = 60, endL = 42;     // Gedämpftes Grün, basierend auf --color-accent-green
                const ratio = range > 0 ? (count - minAppointments) / range : 1; // Skaliert von min bis max
                const h = startH + (endH - startH) * ratio;
                const s = startS + (endS - startS) * ratio;
                const l = startL + (endL - startL) * ratio;

                cell.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
                cell.style.color = 'white';
                cell.addEventListener('click', (e) => { e.stopPropagation(); this._showAppointmentsForDay(dateString); });
            }

            cell.dataset.tooltip = `${currentDate.toLocaleDateString('de-DE')}: ${count} Termin(e)`;
            cell.textContent = String(currentDate.getDate()).padStart(2, '0');
            this.heatmapGrid.appendChild(cell);

            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    // NEU: Methode zum Rendern des Kalenders
    _renderCalendar() {
        if (!this.calendarDaysGrid) return;
        this.calendarDaysGrid.innerHTML = '';
        const appointmentsByDay = _.groupBy(this.searchFilteredAppointments, t => t.Datum ? t.Datum.split('T')[0] : null);

        // Wochenanzeige aktualisieren
        const weekStart = new Date(this.calendarWeekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        this.calendarWeekDisplay.textContent = 
            `${weekStart.toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit'})} - ${weekEnd.toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit', year:'numeric'})}`;

        for (let i = 0; i < 7; i++) { // Immer 7 Tage für eine Woche
            const day = new Date(this.calendarWeekStartDate);
            day.setDate(this.calendarWeekStartDate.getDate() + i);
            const dateString = day.toISOString().split('T')[0];
            
            const cell = document.createElement('div');
            cell.className = `p-1 border-t border-r border-gray-200 min-h-[120px] text-left align-top bg-white`;
            
            cell.innerHTML = `<div class="font-bold text-xs mb-1">${day.getDate()}</div>`;

            const appointmentsForDay = (appointmentsByDay[dateString] || []).sort((a, b) => new Date(a.Datum) - new Date(b.Datum));
            if (appointmentsForDay.length > 0) {
                const appointmentsContainer = document.createElement('div');
                appointmentsContainer.className = 'space-y-1';
                appointmentsForDay.forEach(termin => {
                    const terminEl = document.createElement('div');
                    terminEl.dataset.id = termin._id;
                    const statusColorClass = this._getStatusColorClass(termin).replace('border-l-4', '').replace('border-', 'bg-');
                    terminEl.className = `text-xs p-1 rounded text-white truncate cursor-pointer ${statusColorClass}`;
                    terminEl.textContent = `${new Date(termin.Datum).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})} ${termin.Terminpartner}`;
                    terminEl.dataset.tooltip = `${termin.Terminpartner} (${termin.Status})`;
                    terminEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const clickedTermin = this.searchFilteredAppointments.find(t => t._id === e.currentTarget.dataset.id);
                        if (clickedTermin) this.openModal(clickedTermin);
                    });
                    appointmentsContainer.appendChild(terminEl);
                });
                cell.appendChild(appointmentsContainer);
            }
            this.calendarDaysGrid.appendChild(cell);
        }
    }

    _showAppointmentsForDay(dateString) {
        const appointmentsForDay = this.searchFilteredAppointments.filter(t => t.Datum && t.Datum.startsWith(dateString));
        if (appointmentsForDay.length === 0) return;

        const formattedDate = new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        dom.hinweisModalTitle.textContent = `Termine am ${formattedDate}`;

        const contentHtml = appointmentsForDay.map(termin => {
            const mitarbeiterName = termin.Mitarbeiter_ID?.[0]?.display_value || 'N/A';
            return `
                <div class="p-2 border-b border-gray-200 last:border-b-0">
                    <p class="font-semibold text-skt-blue">${termin.Terminpartner}</p>
                    <p class="text-sm text-gray-600">Mitarbeiter: ${mitarbeiterName}</p>
                    <p class="text-xs text-gray-500">Kategorie: ${termin.Kategorie}</p>
                </div>
            `;
        }).join('');

        dom.hinweisModalContent.innerHTML = `<div class="space-y-1">${contentHtml}</div>`;
        dom.hinweisModal.classList.add('visible');
        document.body.classList.add('modal-open');
        document.documentElement.classList.add('modal-open');
    }
}

async function loadAndInitAppointmentsView() {
  const container = dom.appointmentsView;
  console.log('%c[Loader] %cLoading/Re-loading appointments view...', 'color: orange; font-weight: bold;', 'color: black;');

  try {
    // Schritt 1: Lade IMMER das HTML neu, um sicherzustellen, dass es aktuell ist und Caching-Probleme vermieden werden.
    console.log('%c[Loader] %cFetching ./appointments.html...', 'color: orange; font-weight: bold;', 'color: black;');
    const response = await fetch("./appointments.html");
    if (!response.ok) throw new Error(`Die Datei 'appointments.html' konnte nicht gefunden werden (HTTP-Status: ${response.status}).`);
    const html = await response.text();
    if (!html.includes('id="appointments-module-root"')) {
        throw new Error("Falscher Inhalt für die Termin-Seite geladen.");
    }
    container.innerHTML = html;
    console.log('%c[Loader] %cAppointments HTML injected.', 'color: orange; font-weight: bold;', 'color: black;');

    // Schritt 2: Die View-Instanz erstellen (falls noch nicht geschehen)
    if (!appointmentsViewInstance) {
        console.log('%c[Loader] %cCreating new AppointmentsView instance...', 'color: orange; font-weight: bold;', 'color: black;');
        appointmentsViewInstance = new AppointmentsView();
    }
    
    console.log('%c[Loader] %cInitializing appointments view instance...', 'color: orange; font-weight: bold;', 'color: black;');
    await appointmentsViewInstance.init(currentlyViewedUserData._id);
  } catch (error) {
    console.error("Fehler beim Laden der Termin-Ansicht:", error);
    container.innerHTML = `<div class="text-center p-8 bg-red-50 rounded-lg border border-red-200"><i class="fas fa-exclamation-triangle fa-3x text-red-400 mb-4"></i><h3 class="text-xl font-bold text-skt-blue">Fehler beim Laden</h3><p class="text-red-600 mt-2">${error.message}</p><p class="text-gray-500 mt-4">Bitte stelle sicher, dass die Datei 'appointments.html' im selben Verzeichnis wie 'index.html' liegt.</p></div>`;
  }
}

// --- Potential View Logic ---
const potentialLog = (message, ...data) => console.log(`%c[Potential] %c${message}`, 'color: #27ae60; font-weight: bold;', 'color: black;', ...data);

class PotentialView {
    constructor() {
        this.listContainer = null;
        this.modal = null;
        this.form = null;
        this.scheduleModal = null;
        this.scheduleForm = null;
        this.searchInput = null;
        this.scopeFilter = null;

        this.initialized = false;
        this.currentUserId = null;
        this.allPotentials = [];
        this.downline = [];
        this.filterText = '';
    }

    _getDomElements() {
        this.listContainer = document.getElementById('potential-list-container');
        this.modal = document.getElementById('potential-modal');
        this.form = document.getElementById('potential-form');
        this.scheduleModal = document.getElementById('schedule-modal');
        this.scheduleForm = document.getElementById('schedule-form');
        this.searchInput = document.getElementById('potential-search-filter');
        this.scopeFilter = document.getElementById('potential-scope-filter');
        this.statusFilter = document.getElementById('potential-status-filter'); // NEU
        // NEU: Zusätzliche Elemente für Robustheit
        this.addBtn = document.getElementById('add-potential-btn');
        this.downloadBtn = document.getElementById('download-template-btn');
        this.importBtn = document.getElementById('import-excel-btn');
        this.fileInput = document.getElementById('potential-import-input');
        return this.listContainer && this.modal && this.form && this.scheduleModal && this.scheduleForm && this.searchInput && this.scopeFilter && this.statusFilter && this.addBtn && this.downloadBtn && this.importBtn && this.fileInput;
    }

    async init(userId) {
        potentialLog(`Modul wird initialisiert für User-ID: ${userId}`);
        this.currentUserId = userId;
        this.downline = SKT_APP.getAllSubordinatesRecursive(this.currentUserId);

        if (!this._getDomElements()) {
            potentialLog('!!! FEHLER: Benötigte DOM-Elemente für die Potential-Ansicht wurden nicht gefunden.');
            return;
        }

        // NEU: Gib die verfügbaren Spaltennamen aus, um bei der Fehlersuche zu helfen.
        console.log('Verfügbare Spalten in der "Termine" Tabelle:', SKT_APP.COLUMN_MAPS.termine);

        this.downline.sort((a, b) => a.Name.localeCompare(b.Name));
        this.scopeFilter.classList.toggle('hidden', !SKT_APP.isUserLeader(SKT_APP.authenticatedUserData));

        // Die Event-Listener müssen bei jeder Initialisierung neu gesetzt werden,
        // da der HTML-Inhalt der Ansicht dynamisch neu geladen wird.
        this.setupEventListeners();
        await this.fetchAndRender();
    }

    async fetchAndRender() {
        this.listContainer.innerHTML = '<div class="loader mx-auto"></div>';
        try {
            const scope = this.scopeFilter.value;
            let userIds = new Set();
            switch (scope) {
                case 'personal':
                    userIds.add(this.currentUserId);
                    break;
                case 'group':
                    userIds.add(this.currentUserId);
                    SKT_APP.getSubordinates(this.currentUserId, 'gruppe').forEach(u => userIds.add(u._id));
                    break;
                case 'structure':
                    // KORREKTUR: Lade nur die eigene Struktur, nicht alle Mitarbeiter.
                    userIds.add(this.currentUserId);
                    this.downline.forEach(u => userIds.add(u._id));
                    break;
            }

            const userNames = Array.from(userIds).map(id => SKT_APP.findRowById('mitarbeiter', id)?.Name).filter(Boolean);
            if (userNames.length === 0) { this.allPotentials = []; this.render(); return; }
            const userNamesSql = userNames.map(name => `'${SKT_APP.escapeSql(name)}'`).join(',');

            const query = `SELECT * FROM \`Termine\` WHERE \`Datum\` IS NULL AND \`Mitarbeiter_ID\` IN (${userNamesSql})`;
            potentialLog('Sende SQL-Abfrage für Potentiale...');
            const potentialsRaw = await SKT_APP.seaTableSqlQuery(query, true);
            this.allPotentials = SKT_APP.mapSqlResults(potentialsRaw, 'Termine');
            potentialLog(`${this.allPotentials.length} Potentiale geladen.`);
            this.render();
        } catch (error) {
            potentialLog('!!! FEHLER in fetchAndRender !!!', error);
            this.listContainer.innerHTML = `<div class="text-center py-16"><i class="fas fa-exclamation-triangle fa-4x text-red-400 mb-4"></i><h3 class="text-xl font-semibold text-skt-blue">Ein Fehler ist aufgetreten</h3><p class="text-gray-500 mt-2">${error.message}</p></div>`;
        }
    }

    render() {
        this.listContainer.innerHTML = '';
        const statusFilterValue = this.statusFilter.value;

        let filteredPotentials = this.allPotentials.filter(p => {
            // Filter 1: Suchtext
            if (this.filterText) {
                const searchText = this.filterText.toLowerCase();
                const partner = (p.Terminpartner || '').toLowerCase();
                const mitarbeiter = (p.Mitarbeiter_ID?.[0]?.display_value || '').toLowerCase();
                if (!partner.includes(searchText) && !mitarbeiter.includes(searchText)) {
                    return false;
                }
            }
            // Filter 2: Status "Kontaktiert"
            if (statusFilterValue !== 'all') {
                const potentialStatus = p.Kontaktiert || null;
                if (statusFilterValue === 'null') {
                    if (potentialStatus !== null) return false;
                } else {
                    if (potentialStatus !== statusFilterValue) return false;
                }
            }
            return true;
        });

        if (filteredPotentials.length === 0) {
            this.listContainer.innerHTML = `<div class="text-center py-16"><i class="fas fa-user-slash fa-4x text-skt-grey-medium mb-4"></i><h3 class="text-xl font-semibold text-skt-blue">Keine Potentiale gefunden</h3><p class="text-gray-500 mt-2">Lege neue Kontakte an, um sie hier zu bearbeiten.</p></div>`;
            return;
        }

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'overflow-x-auto';

        const table = document.createElement('table');
        table.className = 'appointments-table';
        table.innerHTML = `<thead><tr><th>Terminpartner</th><th>Mitarbeiter</th><th>Kontakt</th><th>Kontaktiert</th><th>Aktion</th></tr></thead>`;
        const tbody = document.createElement('tbody');

        filteredPotentials.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = 'cursor-pointer';
            tr.dataset.id = p._id;
            const mitarbeiterName = p.Mitarbeiter_ID?.[0]?.display_value || 'N/A';
            const kontaktiertStatus = p.Kontaktiert || '-';
            tr.innerHTML = `
                <td><p class="font-bold">${p.Terminpartner || '-'}</p></td>
                <td>${mitarbeiterName}</td>
                <td>
                    <p>${p.Telefonnummer || '-'}</p>
                    <p class="text-xs text-gray-500">${p.Email || '-'}</p>
                </td>
                <td><span class="px-2 py-1 text-xs font-semibold rounded-full bg-skt-grey-medium text-skt-blue-light">${kontaktiertStatus}</span></td>
                <td><button class="text-skt-blue hover:underline">Bearbeiten</button></td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        this.listContainer.appendChild(tableWrapper);

        this.listContainer.querySelectorAll('tbody tr').forEach(tr => {
            tr.addEventListener('click', () => {
                const potential = this.allPotentials.find(p => p._id === tr.dataset.id);
                if (potential) this.openModal(potential);
            });
        });
    }

    setupEventListeners() {
        this.addBtn.addEventListener('click', () => this.openModal());
        this.downloadBtn.addEventListener('click', () => this.downloadExcelTemplate());
        
        this.importBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        
        this.scopeFilter.addEventListener('change', () => this.fetchAndRender());
        this.statusFilter.addEventListener('change', () => this.render()); // NEU

        this.searchInput.addEventListener('input', _.debounce(e => {
            this.filterText = e.target.value;
            this.render();
        }, 300));

        // Main Modal
        this.form.addEventListener('submit', e => this.handleFormSubmit(e));
        document.getElementById('close-potential-modal-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-potential-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('schedule-appointment-btn').addEventListener('click', () => {
            const potentialId = this.form.querySelector('#potential-id').value;
            const potential = this.allPotentials.find(p => p._id === potentialId);
            if (potential) this.openScheduleModal(potential);
        });

        // Schedule Modal
        this.scheduleForm.addEventListener('submit', e => this.handleScheduleSubmit(e));
        document.getElementById('close-schedule-modal-btn').addEventListener('click', () => this.closeScheduleModal());
        document.getElementById('cancel-schedule-btn').addEventListener('click', () => this.closeScheduleModal());
    }

    openModal(potential = null) {
        this.form.reset();
        const title = this.modal.querySelector('#potential-modal-title');
        const idInput = this.form.querySelector('#potential-id');
        const userSelect = this.form.querySelector('#potential-user');

        const allRelevantUsers = [SKT_APP.authenticatedUserData, ...this.downline].filter(Boolean);
        userSelect.innerHTML = '';
        allRelevantUsers.forEach(u => userSelect.add(new Option(u.Name, u._id)));

        if (potential) {
            title.textContent = 'Kontakt bearbeiten';
            idInput.value = potential._id;
            this.form.querySelector('#potential-partner').value = potential.Terminpartner || '';
            const user = allRelevantUsers.find(u => u.Name === potential.Mitarbeiter_ID?.[0]?.display_value);
            if (user) userSelect.value = user._id;
            this.form.querySelector('#potential-phone').value = potential.Telefonnummer || '';
            this.form.querySelector('#potential-email').value = potential.Email || '';
            this.form.querySelector('#potential-rating-kunde').value = potential.Rating_Kunde || '';
            this.form.querySelector('#potential-rating-ma').value = potential.Rating_MA || '';
            this.form.querySelector('#potential-rating-nt').value = potential.Rating_NT || '';
            this.form.querySelector('#potential-kontaktiert').value = potential.Kontaktiert || '';
            this.form.querySelector('#potential-note').value = potential.Hinweis || '';
        } else {
            title.textContent = 'Neuen Kontakt anlegen';
            idInput.value = '';
            userSelect.value = this.currentUserId;
        }
        this.modal.classList.add('visible');
    }

    closeModal() {
        this.modal.classList.remove('visible');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const saveBtn = this.form.querySelector('#save-potential-btn');
        saveBtn.disabled = true;
        saveBtn.querySelector('.loader-small').classList.remove('hidden');
        saveBtn.querySelector('#save-potential-btn-text').textContent = '';

        // KORREKTUR: Logik vereinheitlicht, um die wiederhergestellte Update-Funktion zu nutzen.
        const rowId = this.form.querySelector('#potential-id').value;

        const rowData = {
            [SKT_APP.COLUMN_MAPS.termine.Terminpartner]: this.form.querySelector('#potential-partner').value,
            [SKT_APP.COLUMN_MAPS.termine.Mitarbeiter_ID]: [this.form.querySelector('#potential-user').value],
            [SKT_APP.COLUMN_MAPS.termine.Telefonnummer]: this.form.querySelector('#potential-phone').value || '',
            [SKT_APP.COLUMN_MAPS.termine.Email]: this.form.querySelector('#potential-email').value || '',
            [SKT_APP.COLUMN_MAPS.termine.Rating_Kunde]: parseFloat(this.form.querySelector('#potential-rating-kunde').value) || null,
            [SKT_APP.COLUMN_MAPS.termine.Rating_MA]: parseFloat(this.form.querySelector('#potential-rating-ma').value) || null,
            [SKT_APP.COLUMN_MAPS.termine.Rating_NT]: parseFloat(this.form.querySelector('#potential-rating-nt').value) || null,
            [SKT_APP.COLUMN_MAPS.termine.Kontaktiert]: this.form.querySelector('#potential-kontaktiert').value || null,
            [SKT_APP.COLUMN_MAPS.termine.Hinweis]: this.form.querySelector('#potential-note').value || '',
            [SKT_APP.COLUMN_MAPS.termine.Datum]: null, // Wichtig für Potentiale
        };

        const success = rowId
            ? await SKT_APP.seaTableUpdateRow('Termine', rowId, rowData)
            : await SKT_APP.seaTableAddRow('Termine', rowData);

        if (success) {
            this.closeModal();
            await this.fetchAndRender();
        } else {
            alert('Fehler beim Speichern des Kontakts.');
        }

        saveBtn.disabled = false;
        saveBtn.querySelector('.loader-small').classList.add('hidden');
        saveBtn.querySelector('#save-potential-btn-text').textContent = 'Speichern';
    }

    openScheduleModal(potential) {
        this.scheduleForm.reset();
        this.scheduleForm.querySelector('#schedule-potential-id').value = potential._id;

        const categorySelect = this.scheduleForm.querySelector('#schedule-category');
        // KORREKTUR: Das Datumsfeld wird dynamisch auf datetime-local umgestellt.
        const dateInput = this.scheduleForm.querySelector('#schedule-date');
        if (dateInput) {
            dateInput.type = 'datetime-local';
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            dateInput.value = now.toISOString().slice(0, 16);
        }
        const statusSelect = this.scheduleForm.querySelector('#schedule-status');
        categorySelect.innerHTML = '';
        statusSelect.innerHTML = '';

        const terminMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'termine');
        const categoryColumn = terminMeta.columns.find(c => c.name === 'Kategorie');
        const statusColumn = terminMeta.columns.find(c => c.name === 'Status');

        categoryColumn.data.options.forEach(o => categorySelect.add(new Option(o.name, o.name)));
        statusColumn.data.options.forEach(o => statusSelect.add(new Option(o.name, o.name)));

        this.scheduleModal.classList.add('visible');
    }

    closeScheduleModal() {
        this.scheduleModal.classList.remove('visible');
    }

    async handleScheduleSubmit(e) {
        e.preventDefault();
        const rowId = this.scheduleForm.querySelector('#schedule-potential-id').value;
        const datum = this.scheduleForm.querySelector('#schedule-date').value;
        const kategorie = this.scheduleForm.querySelector('#schedule-category').value;
        const status = this.scheduleForm.querySelector('#schedule-status').value;

        // Neuer Ansatz: Direkte SQL-Abfrage für das Update.
        // Das ist oft robuster für spezifische Updates, wenn die API sich unerwartet verhält.
        const sql = `UPDATE \`Termine\` SET \`Datum\` = '${datum}', \`Kategorie\` = '${kategorie}', \`Status\` = '${status}' WHERE \`_id\` = '${rowId}'`;
        
        let success = false;
        try {
            potentialLog(`[SCHEDULE] Versuche Termin zu speichern für rowId: ${rowId}`);
            potentialLog(`[SCHEDULE] Sende folgende SQL-Abfrage:`, sql);

            const result = await SKT_APP.seaTableSqlQuery(sql, false);
            
            // seaTableSqlQuery gibt bei erfolgreichem UPDATE ein leeres Array zurück.
            // Bei einem Fehler gibt es `null` zurück.
            if (result !== null) {
                potentialLog(`[SCHEDULE] SQL Update erfolgreich.`);
                success = true;
            } else {
                throw new Error("SQL Update API call returned null.");
            }

        } catch (error) {
            console.error("[Potential Schedule] FAILED to update row via SQL.", error);
        }

        if (success) {
            // WICHTIG: Die gecachten Daten müssen manuell aktualisiert werden,
            // da wir nicht die ganze Tabelle neu laden.
            const terminIndex = db.termine.findIndex(t => t._id === rowId);
            if (terminIndex > -1) {
                db.termine[terminIndex].Datum = datum;
                db.termine[terminIndex].Kategorie = kategorie;
                db.termine[terminIndex].Status = status;
                console.log('[CACHE-UPDATE] Termin im lokalen Cache aktualisiert.');
            }

            this.closeScheduleModal();
            this.closeModal();
            await this.fetchAndRender();
        } else {
            alert('Fehler beim Speichern des Termins. Details in der Konsole.');
        }
    }

    downloadExcelTemplate() {
        potentialLog('Excel-Vorlage wird heruntergeladen...');
        
        // Diese Header müssen den Spaltennamen in SeaTable entsprechen,
        // die später beim Import verwendet werden. Für die Vorlage verwenden wir benutzerfreundliche Namen.
        const headers = [
            "Terminpartner",
            "Telefonnummer",
            "Email",
            "Rating_Kunde",
            "Rating_MA",
            "Rating_NT",
            "Hinweis",
            "Kontaktiert"
        ];

        // CSV-Inhalt erstellen. Wichtig: UTF-8 BOM für korrekte Darstellung von Umlauten in Excel.
        const csvContent = "\uFEFF" + headers.join(';') + "\n";

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "potential_vorlage.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        // NEU: Ladebildschirm anzeigen
        this.listContainer.innerHTML = `
            <div class="text-center py-16">
                <div class="loader mx-auto"></div>
                <h3 class="text-xl font-semibold text-skt-blue mt-4">Importiere Daten...</h3>
                <p class="text-gray-500 mt-2">Dies kann einen Moment dauern. Bitte schließe das Fenster nicht.</p>
            </div>`;

        potentialLog(`Importiere Datei: ${file.name}`, file);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                potentialLog('Dateiinhalt:', text);
                const rows = text.split('\n').slice(1); // Header überspringen
                const potentialsToCreate = [];
                const headers = text.split('\n')[0].trim().replace(/\r/g, "").split(';');
                potentialLog('Gelesene Header:', headers);

                const columnMapping = {
                    "Terminpartner": "Terminpartner",
                    "Telefonnummer": "Telefonnummer",
                    "Email": "Email",
                    "Rating_Kunde": "Rating_Kunde",
                    "Rating_MA": "Rating_MA",
                    "Rating_NT": "Rating_NT",
                    "Hinweis": "Hinweis",
                    // "Kontaktiert": "Status" // Falsches Mapping, das zu Fehlern führt. Wird entfernt.
                };

                for (const [i, row] of rows.entries()) {
                    if (row.trim() === '') continue;
                    const values = row.trim().split(';');
                    const potential = {};
                    headers.forEach((header, index) => {
                        const dbColumn = columnMapping[header];
                        if (dbColumn) {
                            potential[dbColumn] = values[index]?.trim() || null;
                        }
                    });
                    potentialLog(`Geparstes Potential aus Zeile ${i + 2}:`, JSON.parse(JSON.stringify(potential)));
                    potentialsToCreate.push(potential);
                }

                if (potentialsToCreate.length > 0) {
                    potentialLog(`Gefunden: ${potentialsToCreate.length} Potentiale zum Importieren.`);
                    const successCount = await this.bulkAddPotentials(potentialsToCreate);
                    if (successCount > 0) {
                        alert(`${successCount} von ${potentialsToCreate.length} Kontakten erfolgreich importiert!`);
                        await this.fetchAndRender();
                    } else {
                        alert('Fehler beim Importieren der Kontakte. Es wurden keine Kontakte importiert.');
                        await this.fetchAndRender();
                    }
                } else {
                    alert('Keine gültigen Kontakte in der Datei gefunden.');
                    await this.fetchAndRender();
                }
            } catch (error) {
                potentialLog('!!! FEHLER beim Verarbeiten der Datei !!!', error);
                alert('Ein Fehler ist beim Lesen der Datei aufgetreten. Bitte stelle sicher, dass sie korrekt formatiert ist.');
                await this.fetchAndRender();
            }
        };
        reader.onerror = async () => {
            potentialLog('!!! FEHLER beim Lesen der Datei !!!', reader.error);
            alert('Die Datei konnte nicht gelesen werden.');
            await this.fetchAndRender();
        };
        reader.readAsText(file, 'UTF-8');
        event.target.value = ''; // File-Input zurücksetzen
    }

    async bulkAddPotentials(potentials) {
        potentialLog('Füge Potentiale einzeln hinzu, um Verknüpfungen zu setzen...');
        let successCount = 0;
        for (const [i, potential] of potentials.entries()) {
            const rowData = {
                [SKT_APP.COLUMN_MAPS.termine.Terminpartner]: potential.Terminpartner,
                [SKT_APP.COLUMN_MAPS.termine.Mitarbeiter_ID]: [this.currentUserId],
                [SKT_APP.COLUMN_MAPS.termine.Telefonnummer]: potential.Telefonnummer,
                [SKT_APP.COLUMN_MAPS.termine.Email]: potential.Email,
                [SKT_APP.COLUMN_MAPS.termine.Rating_Kunde]: parseFloat(potential.Rating_Kunde) || null,
                [SKT_APP.COLUMN_MAPS.termine.Rating_MA]: parseFloat(potential.Rating_MA) || null,
                [SKT_APP.COLUMN_MAPS.termine.Rating_NT]: parseFloat(potential.Rating_NT) || null,
                // [SKT_APP.COLUMN_MAPS.termine.Status]: potential.Status, // Falsches Feld, wird entfernt.
                [SKT_APP.COLUMN_MAPS.termine.Kontaktiert]: null, // Wird wie gewünscht standardmäßig leer gelassen.
                [SKT_APP.COLUMN_MAPS.termine.Hinweis]: potential.Hinweis,
                [SKT_APP.COLUMN_MAPS.termine.Datum]: null,
            };
            potentialLog(`[Import Zeile ${i + 1}] Sende folgende Daten an die API:`, JSON.parse(JSON.stringify(rowData)));
            const success = await SKT_APP.seaTableAddRow('Termine', rowData);
            potentialLog(`[Import Zeile ${i + 1}] API-Aufruf erfolgreich: ${success}`);
            if (success) successCount++; // seaTableAddRow gibt true/false zurück
        }
        potentialLog(`${successCount} von ${potentials.length} Potentialen erfolgreich importiert.`);
        return successCount;
    }
}

async function loadAndInitPotentialView() {
    const container = dom.potentialView;
    console.log('%c[Loader] %cLoading/Re-loading potential view...', 'color: orange; font-weight: bold;', 'color: black;');
    try {
        const response = await fetch("./potential.html");
        if (!response.ok) throw new Error(`Die Datei 'potential.html' konnte nicht gefunden werden.`);
        container.innerHTML = await response.text();

        if (!potentialViewInstance) {
            potentialViewInstance = new PotentialView();
        }
        await potentialViewInstance.init(authenticatedUserData._id);
    } catch (error) {
        console.error("Fehler beim Laden der Potential-Ansicht:", error);
        container.innerHTML = `<div class="text-center p-8 bg-red-50 rounded-lg border border-red-200"><h3 class="text-xl font-bold text-skt-blue">Fehler beim Laden</h3><p class="text-red-600 mt-2">${error.message}</p></div>`;
    }
}

const umsatzLog = (message, ...data) => console.log(`%c[Umsatz] %c${message}`, 'color: #f97316; font-weight: bold;', 'color: black;', ...data);

class UmsatzView {
    constructor() {
        this.listContainer = null;
        this.modal = null;
        this.form = null;
        this.scopeFilter = null;
        this.searchInput = null;
        this.startDateInput = null;
        this.endDateInput = null;

        this.initialized = false;
        this.currentUserId = null;
        this.allUmsaetze = [];
        this.downline = [];
        this.sortColumn = 'Datum';
        this.sortDirection = 'desc';
        this.filterText = '';
        this.lastSavedUmsatz = null;
    }

    _getDomElements() {
        this.listContainer = document.getElementById('umsatz-list-container');
        this.modal = document.getElementById('umsatz-modal');
        this.form = document.getElementById('umsatz-form');
        this.scopeFilter = document.getElementById('umsatz-scope-filter');
        this.searchInput = document.getElementById('umsatz-search-filter');
        this.startDateInput = document.getElementById('umsatz-start-date');
        this.endDateInput = document.getElementById('umsatz-end-date');
        return this.listContainer && this.modal && this.form && this.scopeFilter && this.searchInput && this.startDateInput && this.endDateInput;
    }

    async init(userId) {
        umsatzLog(`Modul wird initialisiert für User-ID: ${userId}`);
        this.currentUserId = userId;

        umsatzLog('Geladene Metadaten:', SKT_APP.METADATA);


        if (!this._getDomElements()) {
            umsatzLog('!!! FEHLER: Benötigte DOM-Elemente für die Umsatz-Ansicht wurden nicht gefunden.');
            return;
        }

        // KORREKTUR: Standardmäßig die letzten 3 Umsatzmonate anzeigen.
        // 1. Enddatum ist das Ende des aktuellen Zyklus.
        const { endDate } = SKT_APP.getMonthlyCycleDates();
        // 2. Startdatum ist der Beginn des Zyklus von vor 2 Monaten. 
        // KORREKTUR: Erstelle eine Kopie des Datums, bevor `setMonth` aufgerufen wird, um eine Mutation des Originalobjekts zu verhindern.
        const { startDate: currentCycleStart } = SKT_APP.getMonthlyCycleDates(); 
        const startDateCopy = new Date(currentCycleStart);
        const twoMonthsAgo = new Date(startDateCopy.setMonth(startDateCopy.getMonth() - 2));
        this.startDateInput.value = twoMonthsAgo.toISOString().split('T')[0];
        this.endDateInput.value = endDate.toISOString().split('T')[0];

        this.downline = SKT_APP.getAllSubordinatesRecursive(this.currentUserId);
        this.scopeFilter.classList.toggle('hidden', !SKT_APP.isUserLeader(SKT_APP.authenticatedUserData));

        // Die Event-Listener müssen bei jeder Initialisierung neu gesetzt werden,
        // da der HTML-Inhalt der Ansicht dynamisch neu geladen wird.
        this.setupEventListeners();
        await this.fetchAndRender();
    }

    async fetchAndRender() {
        this.listContainer.innerHTML = '<div class="loader mx-auto"></div>';
        try {
            let userIds = new Set();
            // NEU: Alisa sieht alle Umsätze
            if (SKT_APP.authenticatedUserData.Name === 'Alisa Kloimstein') {
                db.mitarbeiter.filter(m => m.Status !== 'Ausgeschieden').forEach(u => userIds.add(u._id));
            } else {
                const scope = this.scopeFilter.value;
                userIds.add(this.currentUserId);
                if (scope === 'group') SKT_APP.getSubordinates(this.currentUserId, 'gruppe').forEach(u => userIds.add(u._id));
                else if (scope === 'structure') this.downline.forEach(u => userIds.add(u._id));
            }

            const startDateIso = this.startDateInput.value;
            const endDateIso = this.endDateInput.value;

            const userNamesSql = Array.from(userIds).map(id => `'${SKT_APP.findRowById('mitarbeiter', id)?.Name}'`).filter(Boolean).join(',');
            const query = `SELECT * FROM \`Umsatz\` WHERE \`Mitarbeiter_ID\` IN (${userNamesSql}) AND \`Datum\` >= '${startDateIso}' AND \`Datum\` <= '${endDateIso}' ORDER BY \`Datum\` DESC`;
            
            const umsaetzeRaw = await SKT_APP.seaTableSqlQuery(query, true);
            if (umsaetzeRaw && umsaetzeRaw.length > 0) umsatzLog('Roh-Daten für einen Umsatz:', umsaetzeRaw[0]);
            this.allUmsaetze = SKT_APP.mapSqlResults(umsaetzeRaw, 'Umsatz');
            if (this.allUmsaetze && this.allUmsaetze.length > 0) umsatzLog('Gemappte Daten für einen Umsatz:', this.allUmsaetze[0]);
            this.render();
        } catch (error) {
            umsatzLog('!!! FEHLER in fetchAndRender !!!', error);
        }
    }

    render() {
        let filteredData = this.allUmsaetze.filter(u => {
            if (this.filterText) {
                const searchText = this.filterText.toLowerCase();
                return (u.Kunde || '').toLowerCase().includes(searchText) ||
                       (u.Mitarbeiter_ID?.[0]?.display_value || '').toLowerCase().includes(searchText);
            }
            return true;
        });

        filteredData.sort((a, b) => {
            let valA = a[this.sortColumn];
            let valB = b[this.sortColumn];
            if (this.sortColumn === 'Mitarbeiter_ID' || this.sortColumn === 'Gesellschaft_ID' || this.sortColumn === 'Produkt_ID') {
                valA = valA?.[0]?.display_value || '';
                valB = valB?.[0]?.display_value || '';
            }
            const comparison = new Intl.Collator('de').compare(valA, valB);
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        this.listContainer.innerHTML = '';
        if (filteredData.length === 0) {
            this.listContainer.innerHTML = `<p class="text-center text-gray-500">Keine Umsätze gefunden.</p>`;
            return;
        }

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'overflow-x-auto';

        const table = document.createElement('table');
        table.className = 'appointments-table';
        const headers = [
            { key: 'Kunde', label: 'Kunde' }, 
            { key: 'Mitarbeiter_ID', label: 'Mitarbeiter' },
            { key: 'EH', label: 'EH' }, 
            { key: 'Gesellschaft_ID', label: 'Gesellschaft' },
            { key: 'Produkt_ID', label: 'Produkt' },
            { key: 'Status_OK', label: 'Status' },
            { key: 'Hinweis_BO', label: 'Hinweis BO' }
        ];
        table.innerHTML = `<thead><tr>${headers.map(h => `<th data-sort-key="${h.key}">${h.label} <i class="fas fa-sort sort-icon"></i></th>`).join('')}</tr></thead>`;
        const tbody = document.createElement('tbody');
        filteredData.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = 'cursor-pointer';
            tr.dataset.id = u._id;
            const statusOkHtml = u.Status_OK 
                ? '<i class="fas fa-check-circle text-skt-green-accent text-lg"></i>' 
                : '<i class="fas fa-times-circle text-skt-red-accent text-lg"></i>';
            tr.innerHTML = `
                <td>${u.Kunde || '-'}</td>
                <td>${u.Mitarbeiter_ID?.[0]?.display_value || '-'}</td>
                <td>${u.EH || '-'}</td>
                <td>${u.Gesellschaft_ID?.[0]?.display_value || '-'}</td>
                <td>${u.Produkt_ID?.[0]?.display_value || '-'}</td>
                <td class="text-center">${statusOkHtml}</td>
                <td>${u.Hinweis_BO || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        this.listContainer.appendChild(tableWrapper);

        table.querySelectorAll('thead th').forEach(th => th.addEventListener('click', e => this._handleSort(e.currentTarget.dataset.sortKey)));
        table.querySelectorAll('tbody tr').forEach(tr => tr.addEventListener('click', e => this.openModal(this.allUmsaetze.find(u => u._id === e.currentTarget.dataset.id))));
    }

    _handleSort(key) {
        if (this.sortColumn === key) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        else { this.sortColumn = key; this.sortDirection = 'desc'; }
        this.render();
    }

    setupEventListeners() {
        document.getElementById('add-umsatz-btn').addEventListener('click', () => this.openModal());
        this.scopeFilter.addEventListener('change', () => this.fetchAndRender());
        this.searchInput.addEventListener('input', _.debounce(e => { this.filterText = e.target.value; this.render(); }, 300));
        const debouncedFetch = _.debounce(() => this.fetchAndRender(), 300);
        this.startDateInput.addEventListener('change', debouncedFetch);
        this.endDateInput.addEventListener('change', debouncedFetch);
        this.form.addEventListener('submit', e => this.handleFormSubmit(e));
        document.getElementById('add-umsatz-row-btn').addEventListener('click', () => this.addUmsatzRow());
        document.getElementById('close-umsatz-modal-btn').addEventListener('click', () => this.modal.classList.remove('visible'));
        document.getElementById('cancel-umsatz-btn').addEventListener('click', () => this.modal.classList.remove('visible'));
        document.getElementById('delete-umsatz-btn').addEventListener('click', () => this.handleDelete());
    }

    openModal(umsatz = null) {
        this.form.reset();
        const umsatzRowsContainer = document.getElementById('umsatz-rows-container');
        umsatzRowsContainer.innerHTML = ''; // Leere alte Zeilen
        const idInput = this.form.querySelector('#umsatz-id');
        const title = this.modal.querySelector('#umsatz-modal-title');
        
        // KORREKTUR: "Status OK"-Feld nur für Alisa Kloimstein änderbar machen
        const boFields = this.form.querySelector('#umsatz-bo-fields');
        const statusOkCheckbox = this.form.querySelector('#umsatz-status-ok');
        statusOkCheckbox.disabled = SKT_APP.authenticatedUserData.Name !== 'Alisa Kloimstein';

        const deleteBtn = this.form.querySelector('#delete-umsatz-btn');

        this.form.querySelector('#save-umsatz-btn').disabled = false;
        this.form.querySelector('#save-umsatz-btn').textContent = 'Speichern';

        // KORREKTUR: Mitarbeiter-Auswahl für Alisa Kloimstein anpassen
        let usersForDropdown;
        if (SKT_APP.authenticatedUserData.Name === 'Alisa Kloimstein') {
            // Alisa sieht alle aktiven Mitarbeiter
            usersForDropdown = [...db.mitarbeiter.filter(m => m.Status !== 'Ausgeschieden')];
        } else {
            // Andere Benutzer sehen ihre eigene Struktur
            usersForDropdown = [SKT_APP.authenticatedUserData, ...this.downline].filter(Boolean);
        }
        usersForDropdown.sort((a, b) => a.Name.localeCompare(b.Name));

        const mitarbeiterSelect = this.form.querySelector('#umsatz-mitarbeiter');
        mitarbeiterSelect.innerHTML = '';
        usersForDropdown.forEach(u => mitarbeiterSelect.add(new Option(u.Name, u._id)));

        title.textContent = umsatz ? 'Umsatz bearbeiten' : 'Umsatz hinzufügen';
        if (umsatz) {
            this.lastSavedUmsatz = null; // Clear pre-fill cache when editing
            idInput.value = umsatz._id;
            this.form.querySelector('#umsatz-kunde').value = umsatz.Kunde || '';
            this.form.querySelector('#umsatz-hinweis-bo').value = umsatz.Hinweis_BO || '';
            this.form.querySelector('#umsatz-status-ok').checked = umsatz.Status_OK || false;
            
            mitarbeiterSelect.value = umsatz?.Mitarbeiter_ID?.[0]?.row_id;

            this.addUmsatzRow({
                Produkt_ID: umsatz?.Produkt_ID?.[0]?.row_id,
                Gesellschaft_ID: umsatz?.Gesellschaft_ID?.[0]?.row_id,
                EH: umsatz.EH
            });

            boFields.classList.remove('hidden');
            deleteBtn.classList.remove('hidden');
            document.getElementById('add-umsatz-row-btn').classList.add('hidden');
        } else {
            idInput.value = '';
            boFields.classList.add('hidden');
            deleteBtn.classList.add('hidden');
            document.getElementById('add-umsatz-row-btn').classList.remove('hidden');

            if (this.lastSavedUmsatz) {
                umsatzLog('Fülle Formular mit zuletzt gespeicherten Daten.', this.lastSavedUmsatz);
                this.form.querySelector('#umsatz-kunde').value = this.lastSavedUmsatz.Kunde;
                mitarbeiterSelect.value = this.lastSavedUmsatz.Mitarbeiter_ID;
                this.addUmsatzRow(); // Füge eine leere Zeile hinzu
            } else {
                mitarbeiterSelect.value = this.currentUserId;
                this.addUmsatzRow(); // Füge eine leere Zeile hinzu
            }
        }
        this.modal.classList.add('visible');
    }

    addUmsatzRow(data = {}) {
        const container = document.getElementById('umsatz-rows-container');
        const row = document.createElement('div');
        row.className = 'relative p-3 bg-skt-grey-light rounded-lg border border-gray-200 umsatz-row';
        
        const getDisplayColumnKey = (tableName, colName) => {
            const tableMeta = SKT_APP.METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
            const displayColumn = tableMeta?.columns.find(c => c.name === colName);
            return displayColumn?.key || '0000';
        };

        // KORREKTUR: Löschen-Button oben rechts positionieren, wenn ein neuer Umsatz angelegt wird.
        const deleteButtonHtml = document.getElementById('umsatz-id').value 
            ? '' 
            : `<button type="button" class="delete-umsatz-row-btn absolute -top-2 -right-2 text-red-500 hover:text-red-700 h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-red-100 transition-all" title="Zeile entfernen"><i class="fas fa-times-circle"></i></button>`;

        const gesellschaftenDisplayKey = getDisplayColumnKey('Gesellschaften', 'Gesellschaft');
        const produkteDisplayKey = getDisplayColumnKey('Produkte', 'Produkt');

        row.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-7 gap-x-4 gap-y-2">
                <div class="sm:col-span-3"><label class="block text-xs font-medium text-gray-600">Produkt</label><select class="modern-select umsatz-produkt" required></select></div>
                <div class="sm:col-span-3"><label class="block text-xs font-medium text-gray-600">Gesellschaft</label><select class="modern-select umsatz-gesellschaft" required></select></div>
                <div class="sm:col-span-1"><label class="block text-xs font-medium text-gray-600">EH</label><input type="number" step="0.01" class="modern-input umsatz-eh" required></div>
            </div>
            ${deleteButtonHtml}
        `;
        container.appendChild(row);

        const produktSelect = row.querySelector('.umsatz-produkt');
        const gesellschaftSelect = row.querySelector('.umsatz-gesellschaft');
        const ehInput = row.querySelector('.umsatz-eh');

        const populateSelect = (select, data, displayKey, selectedValue) => {
            select.innerHTML = '<option value="">-- Bitte wählen --</option>';
            data.forEach(item => select.add(new Option(item[displayKey] || '', item._id)));
            if (selectedValue) select.value = selectedValue;
        };

        populateSelect(produktSelect, db.produkte, produkteDisplayKey, data.Produkt_ID);
        populateSelect(gesellschaftSelect, db.gesellschaften, gesellschaftenDisplayKey, data.Gesellschaft_ID);
        ehInput.value = data.EH || '';

        // NEU: Event-Listener für den neuen Löschen-Button
        const deleteBtn = row.querySelector('.delete-umsatz-row-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                row.remove();
            });
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        if (this.timerInterval) clearInterval(this.timerInterval);
        // NEU: Validierung, um EH=0 zu verhindern, bevor die Anfrage gesendet wird.
        const umsatzRowsForValidation = this.form.querySelectorAll('.umsatz-row');
        for (const row of umsatzRowsForValidation) {
            const ehInput = row.querySelector('.umsatz-eh');
            const eh = parseFloat(ehInput.value);

            if (isNaN(eh) || eh === 0) {
                alert('Der Wert für Einheiten (EH) muss eine Zahl sein und darf nicht 0 sein. Bitte korrigieren Sie die Eingabe.');
                ehInput.focus(); // Setzt den Fokus auf das problematische Feld
                return; // Bricht die Funktion ab, es wird nichts gespeichert.
            }
        }

        const saveBtn = this.form.querySelector('#save-umsatz-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Speichern...';

        const rowId = this.form.querySelector('#umsatz-id').value;
        const isEdit = !!rowId;

        const kunde = this.form.querySelector('#umsatz-kunde').value.trim();
        const mitarbeiterId = this.form.querySelector('#umsatz-mitarbeiter').value;
        const hinweisBO = this.form.querySelector('#umsatz-hinweis-bo').value;
        const statusOK = this.form.querySelector('#umsatz-status-ok').checked;

        const umsatzRows = this.form.querySelectorAll('.umsatz-row');
        let allSuccess = true;

        for (const row of umsatzRows) {
            const produktId = row.querySelector('.umsatz-produkt').value;
            const gesellschaftId = row.querySelector('.umsatz-gesellschaft').value.trim();
            const eh = parseFloat(row.querySelector('.umsatz-eh').value) || null;

            if (!produktId || !gesellschaftId || !eh) {
                allSuccess = false;
                break;
            }

            const rowData = {
                [COLUMN_MAPS.umsatz.Kunde]: kunde,
                [COLUMN_MAPS.umsatz.EH]: eh,
                [COLUMN_MAPS.umsatz.Mitarbeiter_ID]: [mitarbeiterId],
                [COLUMN_MAPS.umsatz.Gesellschaft_ID]: [gesellschaftId],
                [COLUMN_MAPS.umsatz.Produkt_ID]: [produktId],
                [COLUMN_MAPS.umsatz.Hinweis_BO]: hinweisBO,
                [COLUMN_MAPS.umsatz.Status_OK]: statusOK,
            };

            if (!isEdit) rowData[COLUMN_MAPS.umsatz.Datum] = new Date().toISOString().split('T')[0];

            const success = isEdit
                ? await seaTableUpdateUmsatzRow('Umsatz', rowId, rowData)
                : await seaTableAddUmsatzRow('Umsatz', rowData);

            if (!success) allSuccess = false;
        }

        if (allSuccess) {
            // Cache für Gesamt-EH leeren, da sich die Daten geändert haben.
            localStorage.removeItem(CACHE_PREFIX + 'total-eh-results');
            umsatzLog('Cache für Gesamt-EH geleert.');

            saveBtn.textContent = 'Gespeichert!';
            saveBtn.classList.remove('hover:bg-green-700');
            saveBtn.classList.add('bg-skt-green-accent');

            if (!isEdit) {
                this.lastSavedUmsatz = { Kunde: kunde, Mitarbeiter_ID: mitarbeiterId };
            } else { // Im Edit-Modus Cache leeren
                this.lastSavedUmsatz = null;
            }

            await this.fetchAndRender();
            setTimeout(() => {
                this.modal.classList.remove('visible');
                saveBtn.textContent = 'Speichern';
                saveBtn.disabled = false;
            }, 1500);
        } else {
            alert('Fehler beim Speichern.');
            saveBtn.textContent = 'Speichern';
            saveBtn.disabled = false;
        }
    }

    async handleDelete() {
        const rowId = this.form.querySelector('#umsatz-id').value;
        if (!rowId) return;

        // KORREKTUR: Benutzerdefiniertes Modal anstelle von confirm() verwenden
        const confirmModal = document.getElementById('confirm-modal');
        const confirmOkBtn = document.getElementById('confirm-modal-ok-btn');
        const confirmCancelBtn = document.getElementById('confirm-modal-cancel-btn');
        document.getElementById('confirm-modal-text').textContent = 'Möchten Sie diesen Umsatz wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.';

        confirmModal.classList.add('visible');

        const handleOk = async () => {
            const success = await seaTableDeleteRow('Umsatz', rowId);
            if (success) {
                localStorage.removeItem(CACHE_PREFIX + 'total-eh-results-v2'); // KORREKTUR: Korrekten Cache-Key verwenden
                umsatzLog('Cache für Gesamt-EH geleert.');
                this.modal.classList.remove('visible');
                await this.fetchAndRender();
            } else {
                alert('Fehler beim Löschen des Umsatzes.');
            }
            cleanup();
        };

        const cleanup = () => {
            confirmModal.classList.remove('visible');
            confirmOkBtn.removeEventListener('click', handleOk);
            confirmCancelBtn.removeEventListener('click', cleanup);
        };

        confirmOkBtn.addEventListener('click', handleOk, { once: true });
        confirmCancelBtn.addEventListener('click', cleanup, { once: true });
    }
}

async function loadAndInitUmsatzView() {
    const container = dom.umsatzView;
    try {
        const response = await fetch("./umsatz.html");
        if (!response.ok) throw new Error(`Die Datei 'umsatz.html' konnte nicht gefunden werden.`);
        container.innerHTML = await response.text();
        if (!umsatzViewInstance) umsatzViewInstance = new UmsatzView();
        await umsatzViewInstance.init(authenticatedUserData._id);
    } catch (error) {
        console.error("Fehler beim Laden der Umsatz-Ansicht:", error);
    }
}

const auswertungLog = (message, ...data) => console.log(`%c[Auswertung] %c${message}`, 'color: #d4af37; font-weight: bold;', 'color: black;', ...data);

class AuswertungView {
    constructor() {
        this.initialized = false;
        this.currentUserId = null;
        this.downline = [];
        this.currentTab = 'rangliste'; // Wird in init() aus dem Speicher geladen
        this.currentFkRennlisteScope = 'group'; // NEU
        this.currentRanglisteTimespan = 'monat'; // NEU
        this.currentAktivitaetenTimespan = 'woche';
        this.sortConfig = {
            rangliste: { column: 'eh', direction: 'desc' },
            aktivitaeten: { column: 'atGehalten', direction: 'desc' },
            fkRennliste: { column: 'eh', direction: 'desc' },
            infoabend: { column: 'Terminpartner', direction: 'asc' }
        };
    }

    _getDomElements() {
        this.ranglisteTab = document.getElementById('rangliste-tab');
        this.aktivitaetenTab = document.getElementById('aktivitaeten-tab');
        this.fkRennlisteTab = document.getElementById('fk-rennliste-tab');
        this.ranglisteView = document.getElementById('rangliste-view');
        this.ranglisteListContainer = document.getElementById('rangliste-list-container'); // NEU
        this.ranglisteWocheBtn = document.getElementById('rangliste-woche-btn'); // NEU
        this.ranglisteMonatBtn = document.getElementById('rangliste-monat-btn'); // NEU
        this.aktivitaetenView = document.getElementById('aktivitaeten-view');
        this.aktivitaetenListContainer = document.getElementById('aktivitaeten-list-container');
        this.aktivitaetenRoleFilter = document.getElementById('aktivitaeten-role-filter');
        this.aktivitaetenDateRangeHint = document.getElementById('aktivitaeten-date-range-hint');
        this.aktivitaetenStructureFilter = document.getElementById('aktivitaeten-structure-filter'); // NEU
        this.fkRennlisteStructureFilter = document.getElementById('fk-rennliste-structure-filter'); // NEU
        this.fkRennlisteScopeToggle = document.getElementById('fk-rennliste-scope-toggle'); // NEU
        this.fkRennlisteGroupBtn = document.getElementById('fk-rennliste-group-btn'); // NEU
        this.fkRennlisteStructureBtn = document.getElementById('fk-rennliste-structure-btn'); // NEU
        this.fkRennlisteView = document.getElementById('fk-rennliste-view');
        this.naechstesInfoView = document.getElementById('naechstes-info-view');
        this.planungenTab = document.getElementById('planungen-tab'); // NEU
        this.planungenView = document.getElementById('planungen-view'); // NEU
        return this.ranglisteTab && this.aktivitaetenTab && this.fkRennlisteTab && this.planungenTab && this.ranglisteView && this.aktivitaetenView && this.fkRennlisteView && this.planungenView;
    }

    _getHierarchyForGroup(groupName) {
        // Handle special, combined groups first
        if (groupName === 'Trainee & GA') return 0; // Lowest hierarchy, always at the bottom

        // Find the corresponding career plan entry.
        // This is robust against trailing spaces.
        const trimmedGroupName = groupName.trim();
        const plan = db.karriereplan.find(p => p.Stufe === trimmedGroupName);

        if (plan && typeof plan.Hierarchie === 'number') {
            return plan.Hierarchie;
        }

        // Fallback for gendered names like "Landesdirektor:in" if "Landesdirektor" is in the plan
        const baseName = trimmedGroupName.split(':')[0];
        if (baseName !== trimmedGroupName) {
            const basePlan = db.karriereplan.find(p => p.Stufe === baseName);
            if (basePlan && typeof basePlan.Hierarchie === 'number') {
                return basePlan.Hierarchie;
            }
        }
        return -1; // Ranks without hierarchy value will be at the very bottom
    }

    async init(userId) {
        auswertungLog(`Modul wird initialisiert für User-ID: ${userId}`);
        this.currentUserId = userId;
        this.downline = SKT_APP.getAllSubordinatesRecursive(this.currentUserId);

        // NEU: Gespeicherte Einstellungen laden
        this.currentTab = loadUiSetting('auswertungTab', 'rangliste');
        this.currentAktivitaetenTimespan = loadUiSetting('aktivitaetenTimespan', 'woche');
        this.currentAktivitaetenRole = loadUiSetting('aktivitaetenRole', 'individual');
        this.currentRanglisteTimespan = loadUiSetting('ranglisteTimespan', 'monat'); // NEU

        if (!this._getDomElements()) {
            auswertungLog('!!! FEHLER: Benötigte DOM-Elemente wurden nicht gefunden.');
            return;
        }

        const isLeader = SKT_APP.isUserLeader(SKT_APP.authenticatedUserData);
        if (isLeader) {
            this.aktivitaetenStructureFilter.classList.remove('hidden');
            this.fkRennlisteStructureFilter.classList.remove('hidden');
        }

        // NEU: UI basierend auf geladenen Einstellungen aktualisieren
        document.querySelectorAll('.aktivitaeten-timespan-btn').forEach(b => b.classList.toggle('active', b.dataset.timespan === this.currentAktivitaetenTimespan));
        this.aktivitaetenRoleFilter.value = this.currentAktivitaetenRole;
        // NEU: UI für Rangliste-Toggle aktualisieren
        this.ranglisteWocheBtn.classList.toggle('active', this.currentRanglisteTimespan === 'woche');
        this.ranglisteMonatBtn.classList.toggle('active', this.currentRanglisteTimespan === 'monat');

        // NEU: Scope für FK-Rennliste laden und UI aktualisieren
        this.currentFkRennlisteScope = loadUiSetting('fkRennlisteScope', 'group');

        // Die Event-Listener müssen bei jeder Initialisierung neu gesetzt werden,
        // da der HTML-Inhalt der Ansicht dynamisch neu geladen wird.
        this.setupEventListeners();
        this.updateTabs();
        await this.renderCurrentView();
    }

    setupEventListeners() {
        document.querySelectorAll('.auswertung-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentTab = e.currentTarget.dataset.view;
                saveUiSetting('auswertungTab', this.currentTab); // NEU
                this.updateTabs();
                this.renderCurrentView();
            });
        });

        // NEU: Event Listener für Rangliste-Zeitraum
        document.querySelectorAll('.rangliste-timespan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentRanglisteTimespan = e.currentTarget.dataset.timespan;
                saveUiSetting('ranglisteTimespan', this.currentRanglisteTimespan);
                document.querySelectorAll('.rangliste-timespan-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderRangliste();
            });
        });

        document.querySelectorAll('.aktivitaeten-timespan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentAktivitaetenTimespan = e.currentTarget.dataset.timespan;
                saveUiSetting('aktivitaetenTimespan', this.currentAktivitaetenTimespan); // NEU
                document.querySelectorAll('.aktivitaeten-timespan-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderAktivitaeten();
            });
        });

        this.aktivitaetenRoleFilter.addEventListener('change', () => {
            this.currentAktivitaetenRole = this.aktivitaetenRoleFilter.value;
            saveUiSetting('aktivitaetenRole', this.currentAktivitaetenRole); // NEU
            this.renderAktivitaeten();
        });
        // NEU: Event Listener für Struktur-Filter
        if (this.aktivitaetenStructureFilter) {
            this.aktivitaetenStructureFilter.addEventListener('change', () => this.renderAktivitaeten());
        }
        this.fkRennlisteStructureFilter.addEventListener('change', () => this.renderFkRennliste());

        // NEU: Event Listener für FK Rennliste Scope
        if (this.fkRennlisteGroupBtn) {
            this.fkRennlisteGroupBtn.addEventListener('click', () => {
                if (this.currentFkRennlisteScope === 'group') return;
                this.currentFkRennlisteScope = 'group';
                saveUiSetting('fkRennlisteScope', 'group'); // NEU
                this.fkRennlisteGroupBtn.classList.add('active');
                this.fkRennlisteStructureBtn.classList.remove('active');
                this.renderFkRennliste();
            });
            this.fkRennlisteStructureBtn.addEventListener('click', () => {
                if (this.currentFkRennlisteScope === 'structure') return;
                this.currentFkRennlisteScope = 'structure';
                saveUiSetting('fkRennlisteScope', 'structure'); // NEU
                this.fkRennlisteStructureBtn.classList.add('active');
                this.fkRennlisteGroupBtn.classList.remove('active');
                this.renderFkRennliste();
            });
        }
    }

    _handleSort(viewType, key) {
        const config = this.sortConfig[viewType];
        if (config.column === key) {
            config.direction = config.direction === 'asc' ? 'desc' : 'asc';
        } else {
            config.column = key;
            config.direction = 'asc';
        }
        this.renderCurrentView();
    }

    updateTabs() {
        document.querySelectorAll('.auswertung-tab').forEach(tab => {
            const isActive = tab.dataset.view === this.currentTab;
            tab.className = `auswertung-tab whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${isActive ? 'border-skt-blue text-skt-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`;
        });
        document.querySelectorAll('.auswertung-view-content').forEach(view => {
            view.classList.toggle('hidden', view.id !== `${this.currentTab}-view`);
        });
    }

    async renderCurrentView() {
        switch (this.currentTab) {
            case 'rangliste':
                await this.renderRangliste();
                break;
            case 'aktivitaeten':
                await this.renderAktivitaeten();
                break;
            case 'fk-rennliste':
                await this.renderFkRennliste();
                break;
            case 'planungen':
                await this.renderPlanungen();
                break;
        }
    }

    async renderRangliste() {
        this.ranglisteListContainer.innerHTML = '<div class="loader mx-auto"></div>';
        const { startDate, endDate } = this.currentRanglisteTimespan === 'woche'
            ? getWeeklyCycleDates()
            : getMonthlyCycleDates();
        const startDateIso = startDate.toISOString().split('T')[0];
        const endDateIso = endDate.toISOString().split('T')[0];

        const ranglisteLog = (message, ...data) => console.log(`%c[RANGLISTE_DEBUG] %c${message}`, 'color: #d4af37; font-weight: bold;', 'color: black;', ...data);

        const capitalbank = db.gesellschaften.find(g => g.Gesellschaft === 'Capitalbank');
        const capitalbankId = capitalbank ? capitalbank._id : null;
        ranglisteLog(`Capitalbank ID: ${capitalbankId}`);

        const query = `SELECT Mitarbeiter_ID, Gesellschaft_ID, EH FROM Umsatz WHERE Datum >= '${startDateIso}' AND Datum <= '${endDateIso}'`;
        ranglisteLog('Lade alle Umsätze für Rangliste...', query);
        const allUmsatzRowsRaw = await seaTableSqlQuery(query, true);
        const allUmsatzRows = mapSqlResults(allUmsatzRowsRaw || [], 'Umsatz');
        ranglisteLog(`Habe ${allUmsatzRows.length} Umsatz-Zeilen für Rangliste erhalten.`);

        const filteredRows = allUmsatzRows.filter(row => {
            if (!capitalbankId) return true;
            const gesellschaftLinks = row.Gesellschaft_ID;
            if (!gesellschaftLinks || !Array.isArray(gesellschaftLinks) || gesellschaftLinks.length === 0) return true;
            const hasCapitalbank = gesellschaftLinks.some(link => link.row_id === capitalbankId);
            if (hasCapitalbank) {
                ranglisteLog(`FILTERED OUT (Rangliste): Umsatz für ${row.Mitarbeiter_ID?.[0]?.display_value} mit Capitalbank.`, row);
            }
            return !hasCapitalbank;
        });

        const umsatzByMitarbeiter = _.groupBy(filteredRows, row => row.Mitarbeiter_ID?.[0]?.row_id);
        const activeUsersData = Object.entries(umsatzByMitarbeiter)
            .map(([mitarbeiterId, umsaetze]) => ({ Mitarbeiter_ID: [{ row_id: mitarbeiterId, display_value: umsaetze[0].Mitarbeiter_ID[0].display_value }], TotalEH: umsaetze.reduce((sum, u) => sum + (u.EH || 0), 0) }))
            .filter(u => u.TotalEH >= 1);

        const enrichedUsers = activeUsersData.map(u => {
            const mitarbeiterName = u.Mitarbeiter_ID?.[0]?.display_value;
            if (!mitarbeiterName) {
                return null; // Ungültigen Datensatz überspringen
            }
            const mitarbeiter = db.mitarbeiter.find(m => m.Name === mitarbeiterName);
            if (!mitarbeiter || mitarbeiter.Status === 'Ausgeschieden') return null;
            const werber = mitarbeiter ? db.mitarbeiter.find(m => m._id === mitarbeiter.Werber) : null;
            return {
                name: mitarbeiter?.Name || 'Unbekannt',
                rang: mitarbeiter?.Karrierestufe || 'N/A',
                eh: u.TotalEH,
            };
        }).filter(Boolean); // Entfernt alle null-Einträge

        // ANPASSUNG: Logik zur Gruppierung von Trainee/GA Rängen
        const getRankGroup = (rank) => {
            const rankStr = String(rank || '').trim();
            const lowerRank = rankStr.toLowerCase();
            if (lowerRank.includes('trainee') || (lowerRank.includes('ga') && lowerRank.length < 5)) {
                return 'Trainee & GA';
            }
            return rankStr;
        };

        const groupedByRank = _.groupBy(enrichedUsers, user => getRankGroup(user.rang || 'N/A'));

        const allGroupNames = Object.keys(groupedByRank);
        // NEUE SORTIERUNG basierend auf Hierarchie
        allGroupNames.sort((a, b) => {
            const hierarchyA = this._getHierarchyForGroup(a);
            const hierarchyB = this._getHierarchyForGroup(b);
            if (hierarchyB !== hierarchyA) {
                return hierarchyB - hierarchyA; // Descending by hierarchy
            }
            return a.localeCompare(b); // Alphabetical for same-level ranks
        });
        const displayGroups = allGroupNames;
        
        const sortConfig = this.sortConfig.rangliste;
        const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });

        this.ranglisteListContainer.innerHTML = '';
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'overflow-x-auto';
        const table = document.createElement('table');
        table.className = 'appointments-table';
        const headers = [
            { key: 'name', label: 'Name' },
            { key: 'eh', label: 'Einheiten' },
        ];
        table.innerHTML = `<thead><tr>${headers.map(h => {
            const icon = sortConfig.column === h.key ? (sortConfig.direction === 'asc' ? '<i class="fas fa-sort-up sort-icon active"></i>' : '<i class="fas fa-sort-down sort-icon active"></i>') : '<i class="fas fa-sort sort-icon"></i>';
            return `<th data-sort-key="${h.key}">${h.label} ${icon}</th>`;
        }).join('')}</tr></thead>`;

        const tbody = document.createElement('tbody');

        // ANPASSUNG: Iteriere über die sortierten Anzeigegruppen
        for (const groupName of displayGroups) {
            if (groupedByRank[groupName]) {
                const usersInRank = groupedByRank[groupName];
                usersInRank.sort((a, b) => {
                    let valA = a[sortConfig.column];
                    let valB = b[sortConfig.column];
                    let comparison = 0;
                    if (typeof valA === 'number' && typeof valB === 'number') {
                        comparison = valA - valB;
                    } else {
                        comparison = collator.compare(String(valA), String(valB));
                    }
                    return sortConfig.direction === 'asc' ? comparison : -comparison;
                });

                // Füge Gruppen-Header-Zeile hinzu
                const groupHeaderRow = document.createElement('tr');
                groupHeaderRow.innerHTML = `<td colspan="${headers.length}" class="bg-skt-grey-light font-bold text-skt-blue text-lg py-3">${groupName}</td>`;
                tbody.appendChild(groupHeaderRow);

                // Füge Benutzer-Zeilen hinzu
                usersInRank.forEach(user => {
                    const userRow = document.createElement('tr');
                    userRow.innerHTML = `<td>${user.name}</td><td>${user.eh.toFixed(2)}</td>`;
                    tbody.appendChild(userRow);
                });
            }
        }
        table.appendChild(tbody);
        table.querySelectorAll('thead th').forEach(th => th.addEventListener('click', e => this._handleSort('rangliste', e.currentTarget.dataset.sortKey)));
        tableWrapper.appendChild(table);
        this.ranglisteListContainer.appendChild(tableWrapper);
    }

    async renderAktivitaeten() {
        this.aktivitaetenListContainer.innerHTML = '<div class="loader mx-auto"></div>';

        const { startDate, endDate } = this.currentAktivitaetenTimespan === 'woche'
            ? getWeeklyCycleDates()
            : getMonthlyCycleDates();

        // NEU: Zeitbasierte Berechnung für Soll-Werte
        const { startDate: monthStartDateForSoll, endDate: monthEndDateForSoll } = getMonthlyCycleDates();
        const todayForSoll = getCurrentDate();
        const totalDaysInCycleForSoll = (monthEndDateForSoll - monthStartDateForSoll) / (1000 * 60 * 60 * 24);
        const daysPassedInCycleForSoll = Math.max(0, (todayForSoll - monthStartDateForSoll) / (1000 * 60 * 60 * 24));
        const timeElapsedPercentageForSoll = totalDaysInCycleForSoll > 0 ? (daysPassedInCycleForSoll / totalDaysInCycleForSoll) * 100 : 0;
        const effectiveTimePercentageForSoll = Math.max(50, timeElapsedPercentageForSoll);

        this.aktivitaetenDateRangeHint.textContent = `Zeitraum: ${startDate.toLocaleDateString('de-DE')} - ${endDate.toLocaleDateString('de-DE')}`;

        const startDateIso = startDate.toISOString().split('T')[0];
        const endDateIso = endDate.toISOString().split('T')[0];

        // KORREKTUR: Verwende die vorgeladenen und vollständigen Termindaten aus `db.termine`,
        // um das 10k-Zeilen-Limit von SQL-Abfragen zu umgehen und Datenkonsistenz sicherzustellen.
        let termineData = db.termine.filter(t => {
            if (!t.Datum) return false;
            const terminDate = new Date(t.Datum);
            return terminDate >= startDate && terminDate <= endDate;
        });
        // KORREKTUR: Abgesagte/stornierte Termine aus der Zählung ausschließen.
        termineData = termineData.filter(t => t.Absage !== true && t.Status !== 'Storno');

        // KORREKTUR: Verwende die exakt gleiche Zähl-Logik wie auf dem Dashboard für Konsistenz.
        const AT_STATUS_GEHALTEN = ["Gehalten"];
        const AT_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten"];
        const ET_STATUS_GEHALTEN = ["Gehalten", "Weiterer ET", "Info Eingeladen", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];
        const ET_STATUS_AUSGEMACHT = ["Ausgemacht", ...ET_STATUS_GEHALTEN];

        const { startDate: monthStartDate } = getMonthlyCycleDates();
        const currentMonthName = monthStartDate.toLocaleString("de-DE", { month: "long" });
        const currentYear = monthStartDate.getFullYear();
        const planResults = db.monatsplanung.filter(p => p.Monat === currentMonthName && p.Jahr === currentYear);

        const statsByMitarbeiter = {};

        termineData.forEach(t => {
            const mitarbeiterId = t.Mitarbeiter_ID;
            if (!mitarbeiterId) return;

            if (!statsByMitarbeiter[mitarbeiterId]) {
                statsByMitarbeiter[mitarbeiterId] = { atAusgemacht: 0, atGehalten: 0, etAusgemacht: 0, etGehalten: 0, atSoll: 0 };
            }

            const isAnalysisAppointment = t.Kategorie === "AT" || (t.Kategorie === "ST" && t.Umsatzprognose > 1);
            if (isAnalysisAppointment) {
                if (AT_STATUS_AUSGEMACHT.includes(t.Status)) statsByMitarbeiter[mitarbeiterId].atAusgemacht++;
                if (AT_STATUS_GEHALTEN.includes(t.Status)) statsByMitarbeiter[mitarbeiterId].atGehalten++;
            } else if (t.Kategorie === 'ET') {
                if (ET_STATUS_AUSGEMACHT.includes(t.Status)) statsByMitarbeiter[mitarbeiterId].etAusgemacht++;
                if (ET_STATUS_GEHALTEN.includes(t.Status)) statsByMitarbeiter[mitarbeiterId].etGehalten++;
            }
        });

        // NEU: EH-Daten für den Zeitraum laden
        const capitalbank = db.gesellschaften.find(g => g.Gesellschaft === 'Capitalbank');
        const capitalbankId = capitalbank ? capitalbank._id : null;
        const umsatzQuery = `SELECT Mitarbeiter_ID, Gesellschaft_ID, EH FROM Umsatz WHERE Datum >= '${startDateIso}' AND Datum <= '${endDateIso}'`;
        const allUmsatzRowsRaw = await seaTableSqlQuery(umsatzQuery, true);
        const allUmsatzRows = mapSqlResults(allUmsatzRowsRaw || [], 'Umsatz');

        const filteredUmsatzRows = allUmsatzRows.filter(row => {
            if (!capitalbankId) return true;
            const gesellschaftLinks = row.Gesellschaft_ID;
            if (!gesellschaftLinks || !Array.isArray(gesellschaftLinks) || gesellschaftLinks.length === 0) return true;
            return !gesellschaftLinks.some(link => link.row_id === capitalbankId);
        });

        const ehByMitarbeiter = _.groupBy(filteredUmsatzRows, row => row.Mitarbeiter_ID?.[0]?.row_id);
        const ehData = Object.entries(ehByMitarbeiter).reduce((acc, [mitarbeiterId, umsaetze]) => {
            acc[mitarbeiterId] = umsaetze.reduce((sum, u) => sum + (u.EH || 0), 0);
            return acc;
        }, {});

        let allActiveUsers = db.mitarbeiter.filter(m => m.Status !== 'Ausgeschieden');

        // NEU: Filter by structure if selected
        if (this.aktivitaetenStructureFilter.value === 'mine') {
            const myStructureIds = new Set([this.currentUserId, ...this.downline.map(u => u._id)]);
            allActiveUsers = allActiveUsers.filter(u => myStructureIds.has(u._id));
        }

        const allEnrichedUsers = allActiveUsers.map(mitarbeiter => {
            const mitarbeiterId = mitarbeiter._id;
            const stats = statsByMitarbeiter[mitarbeiterId] || { atAusgemacht: 0, atGehalten: 0, etAusgemacht: 0, etGehalten: 0 };
            const plan = planResults.find(p => p.Mitarbeiter_ID === mitarbeiterId);
            const ehZiel = plan?.EH_Ziel || 0;
            const atTotalGoal = mitarbeiter.EHproATQuote && ehZiel > 0 ? Math.round(ehZiel / mitarbeiter.EHproATQuote) : 0;
            const eh = ehData[mitarbeiterId] || 0; // NEU
            return { id: mitarbeiterId, name: mitarbeiter.Name, rang: mitarbeiter.Karrierestufe || 'N/A', atTotalGoal, eh, ...stats };
        });

        const filterValue = this.aktivitaetenRoleFilter.value;
        const isLeaderFunc = (rank) => {
            const rankStr = String(rank || '').trim().toLowerCase();
            return !rankStr.includes('trainee') && !(rankStr.includes('ga') && rankStr.length < 5);
        };

        let usersToDisplay = [];
        if (filterValue === 'leader') {
            const leaders = allActiveUsers.filter(u => isLeaderFunc(u.Karrierestufe));
            usersToDisplay = leaders.map(leader => {
                const groupMembers = [leader, ...getSubordinates(leader._id, 'gruppe')];
                const groupMemberIds = new Set(groupMembers.map(m => m._id));
                const groupMemberData = allEnrichedUsers.filter(u => groupMemberIds.has(u.id));

                const aggregatedStats = groupMemberData.reduce((acc, member) => {
                    acc.atAusgemacht += member.atAusgemacht;
                    acc.atGehalten += member.atGehalten;
                    acc.etAusgemacht += member.etAusgemacht;
                    acc.etGehalten += member.etGehalten;
                    acc.atTotalGoal += member.atTotalGoal;
                    acc.eh += member.eh; // NEU
                    return acc;
                }, { atAusgemacht: 0, atGehalten: 0, etAusgemacht: 0, etGehalten: 0, atTotalGoal: 0, eh: 0 });

                aggregatedStats.atSoll = Math.round(aggregatedStats.atTotalGoal * (effectiveTimePercentageForSoll / 100));

                return { name: leader.Name, rang: leader.Karrierestufe || 'N/A', ...aggregatedStats };
            });
        } else {
            usersToDisplay = allEnrichedUsers.map(user => ({
                ...user,
                atSoll: Math.round(user.atTotalGoal * (effectiveTimePercentageForSoll / 100))
            }));
        }

        const sortConfig = this.sortConfig.aktivitaeten;
        const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });

        // Sort all users directly, removing the grouping logic
        usersToDisplay.sort((a, b) => {
            let valA = a[sortConfig.column];
            let valB = b[sortConfig.column];
            let comparison = 0;

            if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = (valA || 0) - (valB || 0);
            } else {
                comparison = collator.compare(String(valA || ''), String(valB || ''));
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        this.aktivitaetenListContainer.innerHTML = '';

        if (usersToDisplay.length === 0) {
            this.aktivitaetenListContainer.innerHTML = `<p class="text-center text-gray-500 py-8">Keine Aktivitäten im ausgewählten Zeitraum gefunden.</p>`;
            return;
        }

        // Create a single table for the filtered users
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'overflow-x-auto';

        const table = document.createElement('table');
        table.className = 'appointments-table';

        // Add 'rang' to headers to retain the information
        const headers = [
            { key: 'name', label: 'Name' },
            { key: 'rang', label: 'Rang' },
            { key: 'eh', label: 'EH' }, // NEU
            { key: 'atSoll', label: 'AT Soll' },
            { key: 'atAusgemacht', label: 'AT Ausgem.' },
            { key: 'atGehalten', label: 'AT Gehalt.' },
            { key: 'etAusgemacht', label: 'ET Ausgem.' },
            { key: 'etGehalten', label: 'ET Gehalt.' },
        ];

        table.innerHTML = `<thead><tr>${headers.map(h => {
            const icon = sortConfig.column === h.key ? (sortConfig.direction === 'asc' ? '<i class="fas fa-sort-up sort-icon active"></i>' : '<i class="fas fa-sort-down sort-icon active"></i>') : '<i class="fas fa-sort sort-icon"></i>';
            return `<th data-sort-key="${h.key}">${h.label} ${icon}</th>`;
        }).join('')}</tr></thead>`;

        const tbody = document.createElement('tbody');
        usersToDisplay.forEach(user => {
            tbody.innerHTML += `<tr><td>${user.name}</td><td>${user.rang}</td><td>${(user.eh || 0).toFixed(2)}</td><td>${user.atSoll}</td><td>${user.atAusgemacht}</td><td>${user.atGehalten}</td><td>${user.etAusgemacht}</td><td>${user.etGehalten}</td></tr>`;
        });
        table.appendChild(tbody);
        table.querySelectorAll('thead th').forEach(th => th.addEventListener('click', e => this._handleSort('aktivitaeten', e.currentTarget.dataset.sortKey)));
        
        tableWrapper.appendChild(table);
        this.aktivitaetenListContainer.appendChild(tableWrapper);
    }

    async renderFkRennliste() {
        const container = document.getElementById('fk-rennliste-container');
        if (!container) return;
        container.innerHTML = '<div class="loader mx-auto"></div>';

        let leaders = db.mitarbeiter.filter(m => isUserLeader(m) && m.Status !== 'Ausgeschieden');

        // NEU: Filter by structure if selected
        if (this.fkRennlisteStructureFilter.value === 'mine') {
            const myStructureIds = new Set([this.currentUserId, ...this.downline.map(u => u._id)]);
            leaders = leaders.filter(l => myStructureIds.has(l._id));
        }
        const { startDate, endDate } = getMonthlyCycleDates();

        // NEU: Zeitbasierte Berechnung für Soll-Werte
        const { startDate: monthStartDateForSoll, endDate: monthEndDateForSoll } = getMonthlyCycleDates();
        const todayForSoll = getCurrentDate();
        const totalDaysInCycleForSoll = (monthEndDateForSoll - monthStartDateForSoll) / (1000 * 60 * 60 * 24);
        const daysPassedInCycleForSoll = Math.max(0, (todayForSoll - monthStartDateForSoll) / (1000 * 60 * 60 * 24));
        const timeElapsedPercentageForSoll = totalDaysInCycleForSoll > 0 ? (daysPassedInCycleForSoll / totalDaysInCycleForSoll) * 100 : 0;
        const effectiveTimePercentageForSoll = Math.max(50, timeElapsedPercentageForSoll);
        const currentMonthName = monthStartDateForSoll.toLocaleString("de-DE", { month: "long" });
        const currentYear = monthStartDateForSoll.getFullYear();
        const planResults = db.monatsplanung.filter(p => p.Monat === currentMonthName && p.Jahr === currentYear);

        const startDateIso = startDate.toISOString().split('T')[0];
        const endDateIso = endDate.toISOString().split('T')[0];

        // 1. Lade alle EH-Daten für den Zeitraum
        // KORREKTUR: Capitalbank-Filter hinzufügen.
        const capitalbank = db.gesellschaften.find(g => g.Gesellschaft === 'Capitalbank');
        const capitalbankId = capitalbank ? capitalbank._id : null;
        let capitalbankFilter = '';
        if (capitalbankId) {
            capitalbankFilter = ` AND NOT (\`Gesellschaft_ID\` IS NOT NULL AND \`Gesellschaft_ID\` LIKE '%${capitalbankId}%')`;
        }
        const ehQuery = `SELECT \`Mitarbeiter_ID\`, SUM(\`EH\`) AS \`ehIst\` FROM \`Umsatz\` WHERE \`Datum\` >= '${startDateIso}' AND \`Datum\` <= '${endDateIso}'${capitalbankFilter} GROUP BY \`Mitarbeiter_ID\``;
        const ehResultRaw = await seaTableSqlQuery(ehQuery, true); // KORREKTUR: convert_link_id auf true setzen, um konsistente Datenobjekte zu erhalten.
        const ehResults = mapSqlResults(ehResultRaw || [], "Umsatz");

        // 2. Lade alle relevanten Termindaten für den Zeitraum
        // KORREKTUR: Verwende die vorgeladenen und vollständigen Termindaten aus `db.termine`,
        // um das 10k-Zeilen-Limit von SQL-Abfragen zu umgehen und Datenkonsistenz sicherzustellen.
        let termineResults = db.termine.filter(t => {
            if (!t.Datum) return false;
            const terminDate = new Date(t.Datum);
            return terminDate >= startDate && terminDate <= endDate;
        });
        // KORREKTUR: Abgesagte/stornierte Termine aus der Zählung ausschließen.
        termineResults = termineResults.filter(t => t.Absage !== true && t.Status !== 'Storno');
        // KORREKTUR: Verwende die exakt gleiche Zähl-Logik wie auf dem Dashboard für Konsistenz.
        const AT_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten"];
        const ET_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten", "Info Eingeladen", "Weiterer ET", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];

        // 3. Gruppiere Daten nach Mitarbeiter für schnellen Zugriff
        // KORREKTUR: Greife auf die `row_id` aus dem verknüpften Objekt zu, das durch `convert_link_id=true` zurückgegeben wird.
        const ehByMitarbeiter = _.keyBy(ehResults.map(e => ({ id: e.Mitarbeiter_ID?.[0]?.row_id, eh: e.ehIst })), 'id');
        const termineByMitarbeiter = _.groupBy(termineResults, 'Mitarbeiter_ID'); // KORREKTUR: Nach der Normalisierung ist dies eine direkte ID.

        // 4. Berechne die Strukturdaten für jede Führungskraft
        const structureDataList = leaders.map(leader => {
            // NEU: Wähle Mitglieder basierend auf dem Scope-Toggle
            const structureScope = this.currentFkRennlisteScope === 'structure';
            const membersForCalc = structureScope ? [leader, ...getAllSubordinatesRecursive(leader._id)] : [leader, ...getSubordinates(leader._id, 'gruppe')];
            
            let eh = 0;
            let at = 0;
            let et = 0;
            let atTotalGoal = 0;
            let etTotalGoal = 0; // NEU: ET-Soll

            for (const member of membersForCalc) {
                eh += ehByMitarbeiter[member._id]?.eh || 0;

                const memberTermine = termineByMitarbeiter[member._id] || [];
                memberTermine.forEach(t => {
                    const isAnalysisAppointment = t.Kategorie === "AT" || (t.Kategorie === "ST" && t.Umsatzprognose > 1);
                    if (isAnalysisAppointment && AT_STATUS_AUSGEMACHT.includes(t.Status)) {
                        at++;
                    } else if (t.Kategorie === "ET" && ET_STATUS_AUSGEMACHT.includes(t.Status)) {
                        et++;
                    }
                });

                const plan = planResults.find(p => p.Mitarbeiter_ID === member._id);
                const ehZiel = plan?.EH_Ziel || 0;
                atTotalGoal += member.EHproATQuote && ehZiel > 0 ? Math.round(ehZiel / member.EHproATQuote) : 0;
                etTotalGoal += plan?.ET_Ziel || 0;
            }
            
            const atSoll = Math.round(atTotalGoal * (effectiveTimePercentageForSoll / 100));

            return {
                name: leader.Name,
                rang: leader.Karrierestufe,
                eh: eh,
                at: at,
                atSoll: atSoll,
                et: et,
                etSoll: etTotalGoal // NEU
            };
        });

        const sortConfig = this.sortConfig.fkRennliste;
        const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
        structureDataList.sort((a, b) => {
            let valA = a[sortConfig.column];
            let valB = b[sortConfig.column];
            let comparison = 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else {
                comparison = collator.compare(String(valA || ''), String(valB || '')); // Fehlerbehebung: Fallback für undefined
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'overflow-x-auto';

        const table = document.createElement('table');
        table.className = 'appointments-table';
        // ANPASSUNG: Spalten für Name und Rang hinzugefügt
        const headers = [
            { key: 'name', label: 'Führungskraft' }, { key: 'rang', label: 'Rangstufe' },
            { key: 'eh', label: 'Gesamt EH' }, { key: 'atSoll', label: 'AT Soll' }, { key: 'at', label: 'Gesamt ATs' }, { key: 'etSoll', label: 'ET Soll' },
            { key: 'et', label: 'Gesamt ETs' } // NEU: ET Soll hinzugefügt
        ];
        table.innerHTML = `<thead><tr>${headers.map(h => {
            const icon = sortConfig.column === h.key ? (sortConfig.direction === 'asc' ? '<i class="fas fa-sort-up sort-icon active"></i>' : '<i class="fas fa-sort-down sort-icon active"></i>') : '<i class="fas fa-sort sort-icon"></i>';
            return `<th data-sort-key="${h.key}">${h.label} ${icon}</th>`;
        }).join('')}</tr></thead>`;
        const tbody = document.createElement('tbody');
        structureDataList.forEach(s => {
            tbody.innerHTML += `<tr><td>${s.name}</td><td>${s.rang}</td><td>${s.eh.toFixed(2)}</td><td>${s.atSoll}</td><td>${s.at}</td><td>${s.etSoll}</td><td>${s.et}</td></tr>`;
        });
        table.appendChild(tbody);
        table.querySelectorAll('thead th').forEach(th => th.addEventListener('click', e => this._handleSort('fkRennliste', e.currentTarget.dataset.sortKey)));
        tableWrapper.appendChild(table);        
        container.innerHTML = '';
        container.appendChild(tableWrapper);
    }

    async logPQQCalculationForUser(userId, forMonth, forYear) {
        const pqqLog = (message, ...data) => console.log(`%c[PQQ_Drilldown] %c${message}`, 'color: #d4af37; font-weight: bold;', 'color: black;', ...data);
        const user = findRowById('mitarbeiter', userId);
        if (!user) {
            pqqLog(`User with ID ${userId} not found.`);
            return;
        }
        pqqLog(`--- PQQ-Berechnung für: ${user.Name} (für ${forMonth + 1}/${forYear}) ---`);

        // 1. Get previous month's dates
        const prevMonthDate = new Date(forYear, forMonth, 1);
        prevMonthDate.setDate(0); // Go to last day of previous month
        const prevMonthName = prevMonthDate.toLocaleString("de-DE", { month: "long" });
        const prevYear = prevMonthDate.getFullYear();
        const prevMonthStartDate = new Date(prevYear, prevMonthDate.getMonth(), 1);
        const prevMonthEndDate = new Date(prevYear, prevMonthDate.getMonth() + 1, 0);
        const prevStartDateIso = prevMonthStartDate.toISOString().split('T')[0];
        const prevEndDateIso = prevMonthEndDate.toISOString().split('T')[0];
        pqqLog(`Berechnungszeitraum (Vormonat): ${prevStartDateIso} bis ${prevEndDateIso}`);

        // 2. Get planning data from cache
        const plan = db.monatsplanung.find(p => 
            p.Mitarbeiter_ID === userId &&
            p.Monat === prevMonthName &&
            p.Jahr === prevYear
        );

        if (!plan) {
            pqqLog(`Keine Plandaten für ${user.Name} im ${prevMonthName} ${prevYear} gefunden.`);
            alert(`Für ${user.Name} wurden keine Plandaten im ${prevMonthName} ${prevYear} gefunden. PQQ kann nicht berechnet werden.`);
            return;
        }

        const ursprungszielEH = plan?.Ursprungsziel_EH || 0;
        const ursprungszielET = plan?.Ursprungsziel_ET || 0;
        pqqLog(`Plandaten (Ursprungsziel):`, { EH: ursprungszielEH, ET: ursprungszielET });

        // 3. Get actual data for previous month via SQL
        const mitarbeiterNameSql = `'${escapeSql(user.Name)}'`;

        const ehQuery = `SELECT SUM(EH) as totalEH FROM Umsatz WHERE Mitarbeiter_ID = ${mitarbeiterNameSql} AND Datum >= '${prevStartDateIso}' AND Datum <= '${prevEndDateIso}'`;
        const etQuery = `SELECT Status FROM Termine WHERE Mitarbeiter_ID = ${mitarbeiterNameSql} AND Kategorie = 'ET' AND Datum >= '${prevStartDateIso}' AND Datum <= '${prevEndDateIso}'`;

        const [ehResultRaw, etResultRaw] = await Promise.all([ seaTableSqlQuery(ehQuery, true), seaTableSqlQuery(etQuery, true) ]);

        const totalEH = ehResultRaw?.[0]?.totalEH || 0;
        const ET_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten", "Weiterer ET", "Info Eingeladen", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];
        const totalETAusgemacht = etResultRaw.filter(t => ET_STATUS_AUSGEMACHT.includes(t.Status)).length;
        pqqLog(`Ist-Werte (Vormonat):`, { EH: totalEH, ET_Ausgemacht: totalETAusgemacht });

        // 4. Calculate PQQ parts
        const ehQuote = (ursprungszielEH > 0) ? (totalEH / ursprungszielEH) : (ursprungszielEH === 0 ? 1 : 0);
        pqqLog(`EH-Quote Berechnung: ${totalEH} (Ist) / ${ursprungszielEH} (Ziel) = ${ehQuote.toFixed(4)}`);
        const etQuote = (ursprungszielET > 0) ? (totalETAusgemacht / ursprungszielET) : (ursprungszielET === 0 ? 1 : 0);
        pqqLog(`ET-Quote Berechnung: ${totalETAusgemacht} (Ist) / ${ursprungszielET} (Ziel) = ${etQuote.toFixed(4)}`);
        const pqq = ((ehQuote + etQuote) / 2) * 100;
        pqqLog(`Gesamt-PQQ: ((${ehQuote.toFixed(4)} + ${etQuote.toFixed(4)}) / 2) * 100 = ${pqq.toFixed(2)}%`);
        alert(`PQQ-Berechnung für ${user.Name}:\n\nEH-Quote: ${(ehQuote * 100).toFixed(0)}% (${totalEH} Ist / ${ursprungszielEH} Ziel)\nET-Quote: ${(etQuote * 100).toFixed(0)}% (${totalETAusgemacht} Ist / ${ursprungszielET} Ziel)\n\nGesamt-PQQ: ${pqq.toFixed(0)}%\n\n(Details in der Entwicklerkonsole)`);
    }

    async renderPlanungen() {
        auswertungLog('Render Planungen View');
        const viewContainer = document.getElementById('planungen-view');
        if (!viewContainer) return;
        const listContainer = viewContainer.querySelector('#planungen-list-container');
        listContainer.innerHTML = '<div class="loader mx-auto"></div>';

        const monthSelect = viewContainer.querySelector('#planungen-month-select');
        const yearSelect = viewContainer.querySelector('#planungen-year-select');

        if (monthSelect.options.length === 0) {
            const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
            months.forEach((month, index) => monthSelect.add(new Option(month, index)));
            const currentYear = new Date().getFullYear();
            for (let i = currentYear + 1; i >= 2020; i--) {
                yearSelect.add(new Option(i, i));
            }
            const today = new Date();
            monthSelect.value = today.getMonth();
            yearSelect.value = today.getFullYear();

            monthSelect.addEventListener('change', () => this.renderPlanungen());
            yearSelect.addEventListener('change', () => this.renderPlanungen());
        }

        const selectedMonth = parseInt(monthSelect.value);
        const selectedYear = parseInt(yearSelect.value);
        const selectedMonthName = monthSelect.options[selectedMonth].text;

        const infoPlanForMonth = db.infoplanung.filter(p => new Date(p.Informationsabend).getFullYear() === selectedYear && new Date(p.Informationsabend).toLocaleString('de-DE', { month: 'long' }) === selectedMonthName);
        const allActiveUsers = db.mitarbeiter.filter(m => m.Status !== 'Ausgeschieden');
        const plansForMonth = db.monatsplanung.filter(p => p.Monat === selectedMonthName && p.Jahr === selectedYear);
        const plansByUserId = _.keyBy(plansForMonth, 'Mitarbeiter_ID');
        const infoPlansByUserId = _.keyBy(infoPlanForMonth, 'Mitarbeiter_ID');

        const pqqDataMap = await this.calculatePQQForUserList(allActiveUsers.map(u => u._id), selectedMonth, selectedYear, infoPlansByUserId);

        const combinedData = allActiveUsers.map(user => {
            const plan = plansByUserId[user._id];
            return {
                id: user._id,
                name: user.Name,
                werberId: user.Werber,
                ehGoal: plan?.EH_Ziel ?? 0, // KORREKTUR: ET-Ziel wird jetzt aus der Infoplanung geholt.
                ursprungsEhGoal: plan?.Ursprungsziel_EH ?? 0,
                etGoal: infoPlansByUserId[user._id]?.ET_Ziel ?? 0, // KORREKTUR: ET-Ziel wird jetzt aus der Infoplanung geholt.
                pqq: pqqDataMap[user._id] ?? 0,
                hasPlan: !!plan
            };
        });
        const usersById = _.keyBy(combinedData, 'id');

        const leaders = allActiveUsers.filter(u => isUserLeader(u) && u.Status !== 'Ausgeschieden').sort((a, b) => a.Name.localeCompare(b.Name));
        listContainer.innerHTML = '';

        const activeGroups = [];
        const passiveGroups = [];

        leaders.forEach(leader => {
            const subordinates = getSubordinates(leader._id, 'gruppe');
            const groupMemberIds = new Set([leader._id, ...subordinates.map(s => s._id)]);
            
            const groupMembersData = Array.from(groupMemberIds).map(id => usersById[id]).filter(Boolean);

            if (groupMembersData.length === 0) return;

            // A group is passive if every member has 0 for both EH and ET goals.
            const isGroupPassive = groupMembersData.every(m => m.ehGoal === 0 && m.etGoal === 0);

            const groupSums = groupMembersData.reduce((acc, member) => {
                acc.ehGoal += member.ehGoal;
                acc.etGoal += member.etGoal;
                acc.ursprungsEhGoal += member.ursprungsEhGoal;
                return acc;
            }, { ehGoal: 0, etGoal: 0, ursprungsEhGoal: 0 });

            const groupObject = {
                leader: leader,
                members: groupMembersData.sort((a,b) => a.name.localeCompare(b.name)),
                isPassive: isGroupPassive,
                sums: groupSums
            };

            if (isGroupPassive) {
                passiveGroups.push(groupObject);
            } else {
                activeGroups.push(groupObject);
            }
        });

        const headerHtml = `
            <div class="grid grid-cols-7 gap-4 items-center py-2 px-4 bg-gray-100 rounded-t-md sticky top-0 z-10">
                <div class="col-span-2 font-bold">Name</div>
                <div class="text-center font-bold">ET Ziel</div>
                <div class="text-center font-bold">Ursprungs-EH</div>
                <div class="text-center font-bold">Ziel-EH</div>
                <div class="text-center font-bold">Plan-Änd.</div>
                <div class="text-center font-bold">PQQ</div>
            </div>`;

        const renderUserRow = (user) => {
            const pqq = user.pqq || 0;
            const pqqColor = pqq > 120 ? 'text-skt-green-accent' : pqq >= 80 ? 'text-skt-yellow-accent' : 'text-skt-red-accent';
            
            const ehGoalClass = user.ehGoal === 0 ? 'zero-goal' : '';
            const etGoalClass = user.etGoal === 0 ? 'zero-goal' : '';
            const ursprungsEhGoalClass = user.ursprungsEhGoal === 0 ? 'zero-goal' : '';

            let planChangeHtml = '-';
            let planChangeColor = '';
            if (user.ursprungsEhGoal > 0) {
                const planChangePercent = (user.ehGoal / user.ursprungsEhGoal) * 100;
                planChangeColor = planChangePercent >= 100 ? 'text-skt-green-accent' : 'text-skt-red-accent';
                planChangeHtml = `${planChangePercent.toFixed(0)}%`;
            } else if (user.ehGoal > 0) {
                planChangeColor = 'text-skt-green-accent';
                planChangeHtml = 'Neu';
            }

            return `
                <div class="grid grid-cols-7 gap-4 items-center py-2 px-4 cursor-pointer hover:bg-gray-100 rounded-md" data-userid="${user.id}">
                    <div class="col-span-2 font-semibold text-skt-blue">${user.name}</div>
                    <div class="text-center ${etGoalClass}">${user.etGoal}</div>
                    <div class="text-center ${ursprungsEhGoalClass}">${user.ursprungsEhGoal}</div>
                    <div class="text-center ${ehGoalClass}">${user.ehGoal}</div>
                    <div class="text-center font-bold ${planChangeColor}">${planChangeHtml}</div>
                    <div class="text-center font-bold ${pqqColor}">${pqq.toFixed(0)}%</div>
                </div>
            `;
        };
        
        const renderGroup = (group) => {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'mb-8';

            let sumPlanChangeHtml = '-';
            let sumPlanChangeColorClass = 'text-white';
            if (group.sums.ursprungsEhGoal > 0) {
                const sumPlanChangePercent = (group.sums.ehGoal / group.sums.ursprungsEhGoal) * 100;
                sumPlanChangeColorClass = sumPlanChangePercent >= 100 ? 'text-green-400' : 'text-red-400';
                sumPlanChangeHtml = `${sumPlanChangePercent.toFixed(0)}%`;
            } else if (group.sums.ehGoal > 0) {
                sumPlanChangeColorClass = 'text-green-400';
                sumPlanChangeHtml = 'Neu';
            }

            const sumRowHtml = `
                <div class="grid grid-cols-7 gap-4 items-center py-2 px-4 bg-skt-blue-light text-white rounded-b-md">
                    <div class="col-span-2 font-bold">SUMME</div>
                    <div class="text-center font-bold">${group.sums.etGoal}</div>
                    <div class="text-center font-bold">${group.sums.ursprungsEhGoal}</div>
                    <div class="text-center font-bold">${group.sums.ehGoal}</div>
                    <div class="text-center font-bold ${sumPlanChangeColorClass}">${sumPlanChangeHtml}</div>
                    <div class="text-center font-bold"></div>
                </div>
            `;

            let groupHtml = `<h4 class="text-xl font-bold text-skt-blue mb-2">${group.leader.Name}</h4>`;
            groupHtml += '<div class="bg-white rounded-lg shadow">';
            groupHtml += headerHtml;
            group.members.forEach(member => {
                groupHtml += renderUserRow(member);
            });
            groupHtml += sumRowHtml;
            groupHtml += '</div>';
            groupContainer.innerHTML = groupHtml;
            return groupContainer;
        };

        activeGroups.forEach(group => {
            listContainer.appendChild(renderGroup(group));
        });

        if (passiveGroups.length > 0) {
            const passiveSection = document.createElement('div');
            passiveSection.className = 'mt-12';
            passiveSection.innerHTML = `<h3 class="text-2xl font-bold text-skt-blue mb-4 border-t pt-4">Passive Gruppen (ohne Planung)</h3>`;
            passiveGroups.forEach(group => {
                passiveSection.appendChild(renderGroup(group));
            });
            listContainer.appendChild(passiveSection);
        }

        listContainer.querySelectorAll('[data-userid]').forEach(row => { // Make it async
            row.addEventListener('click', async () => {
                const userId = row.dataset.userid;
                await this.logPQQCalculationForUser(userId, selectedMonth, selectedYear);
                openPlanningModal({ // Then open the modal
                    userId: userId,
                    monthName: selectedMonthName,
                    year: selectedYear,
                });
            });
        });
    }

    async calculatePQQForUserList(userIds, forMonth, forYear, preloadedInfoPlans = null) {
        const pqqLog = (message, ...data) => console.log(`%c[PQQ_List_Calc] %c${message}`, 'color: #d4af37; font-weight: bold;', 'color: black;', ...data);
        const pqqDataMap = {};
        if (!userIds || userIds.length === 0) return pqqDataMap;

        const prevMonthDate = new Date(forYear, forMonth, 1);
        prevMonthDate.setDate(0);
        const prevMonthName = prevMonthDate.toLocaleString("de-DE", { month: "long" });
        const prevYear = prevMonthDate.getFullYear();
        const prevMonthStartDate = new Date(prevYear, prevMonthDate.getMonth(), 1);
        const prevMonthEndDate = new Date(prevYear, prevMonthDate.getMonth() + 1, 0);
        const prevStartDateIso = prevMonthStartDate.toISOString().split('T')[0];
        const prevEndDateIso = prevMonthEndDate.toISOString().split('T')[0];

        const relevantPlans = db.monatsplanung.filter(p => userIds.includes(p.Mitarbeiter_ID) && p.Monat === prevMonthName && p.Jahr === prevYear);
        const relevantInfoPlans = preloadedInfoPlans ? Object.values(preloadedInfoPlans) : db.infoplanung.filter(p => userIds.includes(p.Mitarbeiter_ID) && new Date(p.Informationsabend).getFullYear() === prevYear && new Date(p.Informationsabend).getMonth() === prevMonthDate.getMonth());

        const plansByUserId = _.keyBy(relevantPlans, 'Mitarbeiter_ID');
        const infoPlansByUserId = _.keyBy(relevantInfoPlans, 'Mitarbeiter_ID');

        const mitarbeiterNames = userIds.map(id => findRowById('mitarbeiter', id)?.Name).filter(Boolean);
        if (mitarbeiterNames.length === 0) return pqqDataMap;
        const mitarbeiterNamesSql = mitarbeiterNames.map(name => `'${escapeSql(name)}'`).join(',');

        const ehQuery = `SELECT Mitarbeiter_ID, SUM(EH) as totalEH FROM Umsatz WHERE Mitarbeiter_ID IN (${mitarbeiterNamesSql}) AND Datum >= '${prevStartDateIso}' AND Datum <= '${prevEndDateIso}' GROUP BY Mitarbeiter_ID`;
        const etQuery = `SELECT Mitarbeiter_ID, Status FROM Termine WHERE Mitarbeiter_ID IN (${mitarbeiterNamesSql}) AND Kategorie = 'ET' AND Datum >= '${prevStartDateIso}' AND Datum <= '${prevEndDateIso}'`;

        const [ehResultsRaw, etResultsRaw] = await Promise.all([seaTableSqlQuery(ehQuery, true), seaTableSqlQuery(etQuery, true)]);

        const ehByMitarbeiterId = _.keyBy(mapSqlResults(ehResultsRaw, 'Umsatz').map(r => ({ id: r.Mitarbeiter_ID[0].row_id, totalEH: r.totalEH })), 'id');
        const etByMitarbeiterId = _.groupBy(mapSqlResults(etResultsRaw, 'Termine'), r => r.Mitarbeiter_ID[0].row_id);

        const ET_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten", "Weiterer ET", "Info Eingeladen", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];
        userIds.forEach(userId => {
            const plan = plansByUserId[userId];
            const infoPlan = infoPlansByUserId[userId];
            const ursprungszielEH = plan?.Ursprungsziel_EH || 0;
            const ursprungszielET = infoPlan?.Ursprungsziel_ET || 0;
            const totalEH = ehByMitarbeiterId[userId]?.totalEH || 0;
            const userEts = etByMitarbeiterId[userId] || [];
            const totalETAusgemacht = userEts.filter(t => ET_STATUS_AUSGEMACHT.includes(t.Status)).length;

            // KORREKTUR: Formel ist Ist / Ziel
            const ehQuote = (ursprungszielEH > 0) ? (totalEH / ursprungszielEH) : (ursprungszielEH === 0 ? 1 : 0);

            // KORREKTUR: Formel ist Ist / Ziel
            const etQuote = (ursprungszielET > 0) ? (totalETAusgemacht / ursprungszielET) : (totalETAusgemacht === 0 ? 1 : 0);
            pqqDataMap[userId] = ((ehQuote + etQuote) / 2) * 100;
        });

        return pqqDataMap;
    }
}

async function loadAndInitAuswertungView() {
    const container = dom.auswertungView;
    try {
        const response = await fetch("./auswertung.html");
        if (!response.ok) throw new Error(`Die Datei 'auswertung.html' konnte nicht gefunden werden.`);
        container.innerHTML = await response.text();
        if (!auswertungViewInstance) auswertungViewInstance = new AuswertungView();
        await auswertungViewInstance.init(authenticatedUserData._id);
    } catch (error) {
        console.error("Fehler beim Laden der Auswertungs-Ansicht:", error);
    }
}

class BildschirmView {
    constructor() {
        this.initialized = false;
        this.refreshInterval = null;
        this.zoomLevels = [1, 0.9, 0.8, 0.7, 0.6];
        this.currentZoomIndex = 0;
        // NEU: Slideshow-Properties
        this.slideshowInterval = null;
        this.slides = [];
        this.currentSlideIndex = 0;
    }

    _getDomElements() {
        // KORREKTUR: Elemente für die Diashow holen
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
        this.startSlideshow(); // NEU
        this.initialized = true;
    }

    _getWeeklyDates() {
        // KORREKTUR: Die Wochenberechnung muss von Donnerstag bis Mittwoch erfolgen,
        // identisch zur Logik in `getWeeklyCycleDates`.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay(); // Sunday = 0, ..., Thursday = 4, ...

        // Finde den letzten Donnerstag. Donnerstag ist Tag 4.
        const diff = dayOfWeek - 4;
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - diff);

        // Wenn der berechnete Start in der Zukunft liegt (z.B. heute ist Di, diff=-2, start=heute+2),
        // bedeutet das, die aktuelle Woche hat letzte Woche begonnen.
        if (startDate > today) {
            startDate.setDate(startDate.getDate() - 7);
        }

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // 6 Tage nach Donnerstag ist Mittwoch
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

            const monthStartDateIso = monthStartDate.toISOString().split('T')[0];
            const monthEndDateIso = monthEndDate.toISOString().split('T')[0];
            const weekStartDateIso = weekStartDate.toISOString().split('T')[0];
            const weekEndDateIso = weekEndDate.toISOString().split('T')[0];

            // Helper function to build and run a query
            const getRanking = async (dateFilter, table, aggregation, categoryFilter = "") => {
                const query = `SELECT Mitarbeiter_ID, ${aggregation} as value FROM \`${table}\` WHERE ${dateFilter} ${categoryFilter} GROUP BY Mitarbeiter_ID ORDER BY value DESC LIMIT 3`;
                const resultRaw = await seaTableSqlQuery(query, true);
                const results = mapSqlResults(resultRaw || [], table);
                return results.map(item => {
                    const mitarbeiter = findRowById('mitarbeiter', item.Mitarbeiter_ID?.[0]?.row_id);
                    if (!mitarbeiter || mitarbeiter.Status === 'Ausgeschieden') return null;
                    return { name: mitarbeiter.Name, value: item.value };
                }).filter(Boolean);
            };

            const etCategoryFilter = "AND Kategorie = 'ET' AND (Absage IS NULL OR Absage = false) AND Status != 'Storno'";

            // Execute all 4 queries in parallel
            const [
                wochenEhRanking,
                wochenEtRanking,
                monatsEhRanking,
                monatsEtRanking
            ] = await Promise.all([
                getRanking(`Datum >= '${weekStartDateIso}' AND Datum <= '${weekEndDateIso}'`, 'Umsatz', 'SUM(EH)'),
                getRanking(`Datum >= '${weekStartDateIso}' AND Datum <= '${weekEndDateIso}'`, 'Termine', 'COUNT(_id)', etCategoryFilter),
                getRanking(`Datum >= '${monthStartDateIso}' AND Datum <= '${monthEndDateIso}'`, 'Umsatz', 'SUM(EH)'),
                getRanking(`Datum >= '${monthStartDateIso}' AND Datum <= '${monthEndDateIso}'`, 'Termine', 'COUNT(_id)', etCategoryFilter)
            ]);

            // NEU: Slides erstellen und befüllen
            const rankings = [
                { title: '<i class="fas fa-bolt mr-3 text-yellow-400"></i>Wochenbeste Eigen-EH', data: wochenEhRanking, unit: 'EH' },
                { title: '<i class="fas fa-user-plus mr-3 text-blue-400"></i>Wochenbeste Recruiter (ETs)', data: wochenEtRanking, unit: 'ETs' },
                { title: '<i class="fas fa-crown mr-3 text-gold"></i>Monatsbeste Eigen-EH', data: monatsEhRanking, unit: 'EH' },
                { title: '<i class="fas fa-trophy mr-3 text-yellow-300"></i>Monatsbeste Recruiter (ETs)', data: monatsEtRanking, unit: 'ETs' }
            ];

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
            displayData.push(null); // Platzhalter für leere Felder hinzufügen
        }

        displayData.forEach((item, index) => {
            const rank = index + 1;
            let icon = '';
            if (rank === 1) icon = '<i class="fas fa-crown text-gold mr-3"></i>';
            else if (rank === 2) icon = '<i class="fas fa-medal text-gray-300 mr-3"></i>';
            else if (rank === 3) icon = '<i class="fas fa-award text-yellow-600 mr-3"></i>';

            const itemEl = document.createElement('div');
            itemEl.className = `leaderboard-item ${!item ? 'leaderboard-item-empty' : ''}`;

            if (item) {
                itemEl.innerHTML = `
                    <div class="flex items-center">
                        ${icon}
                        <span>${item.name}</span>
                    </div>
                    <span class="font-bold text-lg">${item.value.toLocaleString('de-DE', { maximumFractionDigits: unit === 'EH' ? 2 : 0 })} ${unit}</span>
                `;
            } else {
                itemEl.innerHTML = `
                    <div class="flex items-center opacity-50">
                        ${icon}
                        <span>-</span>
                    </div>
                    <span class="font-bold text-lg opacity-50">-</span>
                `;
            }
            container.appendChild(itemEl);
        });
    }

    async refreshDataAndRender() {
        console.log('[Bildschirm] Geplante Aktualisierung: Lade neue Ranglisten-Daten von der API...');
        // This function now just calls the main fetching function.
        await this.fetchAndRenderRankings();
    }

    startScheduledDataRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);

        const refreshTimes = ['10:00', '12:00', '15:00', '18:00', '20:00', '22:00'];
        let lastRefreshTime = null;

        const checkAndRefresh = async () => {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            if (refreshTimes.includes(currentTime) && lastRefreshTime !== currentTime) {
                console.log(`[Bildschirm] Geplante Aktualisierung um ${currentTime} wird ausgeführt.`);
                lastRefreshTime = currentTime;
                await this.refreshDataAndRender();
            }
        };

        // Check every minute
        this.refreshInterval = setInterval(checkAndRefresh, 60 * 1000);
        console.log('[Bildschirm] Geplante Aktualisierung eingerichtet für:', refreshTimes);
    }

    // NEU: Slideshow-Logik
    startSlideshow() {
        if (this.slideshowInterval) clearInterval(this.slideshowInterval);
        if (this.slides.length === 0) return;

        this.currentSlideIndex = -1; // Start at -1 to show the first slide immediately
        this._showNextSlide();

        this.slideshowInterval = setInterval(() => this._showNextSlide(), 7000);
    }

    _showNextSlide() {
        if (this.slides.length === 0) return;

        // Hide current slide
        if (this.currentSlideIndex >= 0) {
            this.slides[this.currentSlideIndex].classList.remove('active');
        }

        // Increment index
        this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;

        // Show next slide
        this.slides[this.currentSlideIndex].classList.add('active');
        
        // Reset and start progress bar animation
        this.progressBar.classList.remove('progress-bar-animate');
        void this.progressBar.offsetWidth; // Trick to restart CSS animation
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

async function initializeBildschirmView() {
    console.log('[Bildschirm] Initialisiere Bildschirm-Ansicht...');
    // Hide other main containers
    document.getElementById('user-select-screen').classList.add('hidden');
    document.getElementById('dashboard-content').classList.add('hidden');

    const container = document.getElementById('bildschirm-view');
    container.classList.remove('hidden');

    // Load basic data needed for the view
    setStatus("Lade Bildschirm-Daten...");
    await getSeaTableAccessToken();
    if (!seaTableAccessToken) return false;

    let cachedColumnMaps = loadFromCache("column_maps", 60);
    if (cachedColumnMaps) {
        COLUMN_MAPS = cachedColumnMaps.maps;
        METADATA.tables = cachedColumnMaps.meta;
    } else {
        COLUMN_MAPS = await fetchColumnMaps();
        if (Object.keys(COLUMN_MAPS).length > 0) {
            saveToCache("column_maps", { maps: COLUMN_MAPS, meta: METADATA.tables });
        }
    }
    
    // We only need Mitarbeiter for mapping IDs to names.
    const tablesToLoad = ["Mitarbeiter"];
    for (const tableName of tablesToLoad) {
        const key = tableName.toLowerCase();
        db[key] = await seaTableQuery(tableName); // Load fresh to ensure new employees are included
        saveToCache(key, db[key]); // Cache für andere Ansichten aktualisieren
    }
    normalizeAllData();
    setStatus("");

    try {
        const response = await fetch("./bildschirm.html");
        if (!response.ok) throw new Error(`Die Datei 'bildschirm.html' konnte nicht gefunden werden.`);
        container.innerHTML = await response.text();

        if (!bildschirmViewInstance) {
            bildschirmViewInstance = new BildschirmView();
        }
        await bildschirmViewInstance.init();
    } catch (error) {
        console.error("[Bildschirm] Fehler beim Laden der Ansicht:", error);
        container.innerHTML = `<div class="text-center p-8 bg-red-900 text-white rounded-lg"><h3 class="text-xl font-bold">Fehler beim Laden</h3><p class="mt-2">${error.message}</p></div>`;
    }
}

// --- INITIALISIERUNG & EVENT LISTENERS ---

function setupEventListeners() {
  // --- Dropdown Menu Logic ---
  function closeSettingsMenu() {
    if (dom.settingsMenu.classList.contains("visible")) {
      dom.settingsMenu.classList.remove("visible");
      dom.settingsMenu.addEventListener(
        "transitionend",
        () => {
          // KORREKTUR: Prüfen, ob die Klasse noch da ist, bevor sie entfernt wird, um Race Conditions zu vermeiden.
          if (dom.settingsMenu.classList.contains("visible") === false) {
            dom.settingsMenu.classList.add("hidden");
          }
        },
        { once: true }
      );
    }
  }
  // NEU: Funktion für "Mehr"-Menü
  function closeMoreToolsMenu() {
    if (dom.moreToolsMenu.classList.contains("visible")) {
      dom.moreToolsMenu.classList.remove("visible");
      dom.moreToolsMenu.addEventListener(
        "transitionend",
        () => {
          if (dom.moreToolsMenu.classList.contains("visible") === false) {
            dom.moreToolsMenu.classList.add("hidden");
          }
        },
        { once: true }
      );
    }
  }

  dom.settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMoreToolsMenu(); // Schließt das andere Menü, falls offen

    if (dom.settingsMenu.classList.contains("hidden")) {
      dom.settingsMenu.classList.remove("hidden");
      setTimeout(() => dom.settingsMenu.classList.add("visible"), 10);
    } else {
      closeSettingsMenu();
    }
  });

  // NEU: Event Listener für "Mehr"-Menü
  dom.moreToolsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSettingsMenu(); // Schließt das andere Menü, falls offen
    if (dom.moreToolsMenu.classList.contains("hidden")) {
      dom.moreToolsMenu.classList.remove("hidden");
      setTimeout(() => dom.moreToolsMenu.classList.add("visible"), 10);
    } else {
      closeMoreToolsMenu();
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !dom.settingsMenu.contains(e.target) &&
      !dom.settingsBtn.contains(e.target)
    ) {
      closeSettingsMenu();
    }
    // NEU: "Mehr"-Menü schließen bei Klick daneben
    if (!dom.moreToolsMenu.contains(e.target) && !dom.moreToolsBtn.contains(e.target)) {
      closeMoreToolsMenu();
    }
  });

  // --- User Login ---
  dom.userDropdownSelect.addEventListener("change", () => {
    document.getElementById("password-container").classList.remove("hidden");
    document.getElementById("start-dashboard-btn").classList.remove("hidden");
    document.getElementById("password-input").focus();
  });

  document
    .getElementById("start-dashboard-btn")
    .addEventListener("click", async () => {
      const selectedUserId = dom.userDropdownSelect.value;
      const enteredPassword = document.getElementById("password-input").value;

      if (!selectedUserId) {
        dom.userSelectError.textContent = "Bitte einen Benutzer wählen.";
        return;
      }

      const user = findRowById("mitarbeiter", selectedUserId);

      if (user && user.PWD === enteredPassword) {
        localStorage.setItem("loggedInUserId", selectedUserId);
        authenticatedUserData = user;
        updateUiForUserRoles();
        
        // KORREKTUR: Prüfe die Datenschutzzustimmung direkt nach dem Login.
        if (authenticatedUserData && !authenticatedUserData.Datenschutz) {
            document.getElementById("user-select-screen").classList.add("hidden");
            document.getElementById("dashboard-content").classList.remove("hidden");
            await showPrivacyConsentView();
        } else {
            viewHistory = [selectedUserId];
            document.getElementById("user-select-screen").classList.add("hidden");
            document.getElementById("dashboard-content").classList.remove("hidden");
            await fetchAndRenderDashboard(selectedUserId);
        }
      } else {
        dom.userSelectError.textContent =
          "Falsches Passwort oder Benutzer nicht gefunden.";
      }
    });

  document.getElementById("password-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter")
      document.getElementById("start-dashboard-btn").click();
  });

  // --- Menu Actions ---
  dom.clearCacheBtn.addEventListener("click", () => {
    closeSettingsMenu();
    localStorage.clear(); // Löscht alles, inkl. Cache und Login-Status
    location.reload();
  });

  dom.moneyViewBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    closeSettingsMenu();
    isMoneyView = !isMoneyView;
    dom.moneyViewBtn.innerHTML = isMoneyView
      ? `<i class="fas fa-chart-pie w-5 mr-2"></i>EH-Ansicht`
      : `<i class="fas fa-euro-sign w-5 mr-2"></i>Geld-Ansicht`;

    const currentUser = viewHistory[viewHistory.length - 1];
    if (isSuperuserView) {
      await renderSuperuserView();
    } else if (currentUser) {
      await fetchAndRenderDashboard(currentUser);
    }
  });

  // NEU: Event Listeners für die "Mehr"-Menüpunkte
  const setupMenuItem = (menuItemId, buttonId) => {
      const menuItem = document.getElementById(menuItemId);
      const button = document.getElementById(buttonId);
      if (menuItem && button) {
          menuItem.addEventListener('click', (e) => {
              e.preventDefault();
              closeMoreToolsMenu();
              button.click();
          });
      }
  };
  setupMenuItem('pg-tagebuch-menu-item', 'pg-tagebuch-header-btn');
  setupMenuItem('potential-menu-item', 'potential-header-btn');
  setupMenuItem('auswertung-menu-item', 'auswertung-header-btn');
  setupMenuItem('strukturbaum-menu-item', 'strukturbaum-header-btn');
  setupMenuItem('wettbewerb-menu-item', 'wettbewerb-header-btn'); // NEU
  setupMenuItem('ai-assistant-menu-item', 'ai-assistant-btn');
  dom.superuserBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    closeSettingsMenu();
    // KORREKTUR: Die Sicherheitsprüfung findet jetzt in `renderSuperuserView` statt.
    if (!isUserLeader(authenticatedUserData)) {
      alert("Du hast keine Berechtigung für diese Ansicht.");
      return;
    }
    await renderSuperuserView(); // Die Funktion selbst prüft die Berechtigung.
  });

  dom.editUserBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeSettingsMenu();
    openEditUserModal();
  });

  // --- Main Navigation ---
  dom.backButton.addEventListener("click", async () => {
    // Die einzige Funktion des Zurück-Buttons ist es, zum Dashboard des
    // eingeloggten Benutzers zurückzukehren.
    if (authenticatedUserData?._id) {
        isSuperuserView = false; // Stellt sicher, dass die Superuser-Ansicht beendet wird.
        viewHistory = [authenticatedUserData._id]; // Setzt die Ansichts-Historie zurück.
        // KORREKTUR: Zuerst die Ansicht auf das Dashboard umschalten, damit der Lade-Indikator sichtbar ist.
        switchView('dashboard');
        // Dann die Daten für den eingeloggten Benutzer laden und das Dashboard neu rendern.
        await fetchAndRenderDashboard(authenticatedUserData._id);
    }
  });

  // --- View Toggles ---
  dom.personalViewBtn.addEventListener("click", () => {
    currentPlanningView = "personal";
    saveUiSetting('dashboardPlanningView', currentPlanningView);
    dom.personalViewBtn.classList.add("active");
    dom.teamViewBtn.classList.remove("active");
    dom.strukturViewBtn.classList.remove("active");
    dom.monthlyPlanningTitle.textContent = "Deine Monatsplanung";
    updateMonthlyPlanningView(personalData);
    updateLeadershipView();
    calculateAndRenderPQQForCurrentView();
    // NEU: Zeige die persönliche Karriere-Ansicht für Führungskräfte an
    dom.employeeView.classList.remove('hidden');
    updateEmployeeCareerView();
  });
  dom.teamViewBtn.addEventListener("click", () => {
    currentPlanningView = "team";
    saveUiSetting('dashboardPlanningView', currentPlanningView);
    dom.teamViewBtn.classList.add("active");
    dom.personalViewBtn.classList.remove("active");
    dom.strukturViewBtn.classList.remove("active");
    dom.monthlyPlanningTitle.textContent = "Gruppen-Übersicht";
    updateMonthlyPlanningView(teamData);
    updateLeadershipView();
    calculateAndRenderPQQForCurrentView();
    // NEU: Blende die persönliche Karriere-Ansicht aus
    dom.employeeView.classList.add('hidden');
  });
  dom.strukturViewBtn.addEventListener("click", () => {
    currentPlanningView = "struktur";
    saveUiSetting('dashboardPlanningView', currentPlanningView);
    dom.strukturViewBtn.classList.add("active");
    dom.teamViewBtn.classList.remove("active");
    dom.personalViewBtn.classList.remove("active");
    dom.monthlyPlanningTitle.textContent = "Struktur-Übersicht";
    updateMonthlyPlanningView(structureData);
    updateLeadershipView();
    calculateAndRenderPQQForCurrentView();
    // NEU: Blende die persönliche Karriere-Ansicht aus
    dom.employeeView.classList.add('hidden');
  });

  dom.gridViewBtn.addEventListener("click", () => {
    if (currentLeadershipViewMode === "grid") return;
    currentLeadershipViewMode = "grid";
    saveUiSetting('leadershipViewMode', currentLeadershipViewMode);
    dom.gridViewBtn.classList.add("active");
    dom.listViewBtn.classList.remove("active");
    updateLeadershipView();
  });

  dom.listViewBtn.addEventListener("click", () => {
    if (currentLeadershipViewMode === "list") return;
    currentLeadershipViewMode = "list";
    saveUiSetting('leadershipViewMode', currentLeadershipViewMode);
    dom.listViewBtn.classList.add("active");
    dom.gridViewBtn.classList.remove("active");
    updateLeadershipView();
  });

  // --- Onboarding Navigation ---
  dom.einarbeitungBtn.addEventListener("click", () => {
    switchView("einarbeitung");
    fetchAndRenderOnboarding(authenticatedUserData._id);
  });
  dom.einarbeitungBanner.addEventListener("click", () => {
    switchView("einarbeitung");
    fetchAndRenderOnboarding(authenticatedUserData._id);
  });

  dom.dashboardHeaderBtn.addEventListener('click', () => {
    switchView('dashboard');
  });

  dom.appointmentsHeaderBtn.addEventListener("click", () => {
    // NEU
    switchView("appointments");
  });

  dom.pgTagebuchHeaderBtn.addEventListener('click', () => {
    switchView('pg-tagebuch');
  });

  dom.potentialHeaderBtn.addEventListener("click", () => {
    // NEU
    switchView("potential");
  });

  dom.umsatzHeaderBtn.addEventListener("click", () => {
    // NEU
    switchView("umsatz");
  });

  dom.auswertungHeaderBtn.addEventListener("click", () => {
    switchView("auswertung");
  });
  // KORREKTUR: Listener für den neuen Menüpunkt in den Einstellungen
  dom.wettbewerbHeaderBtn.addEventListener("click", () => {
    // NEU
    switchView("wettbewerb");
  });

  document.getElementById('stimmungs-dashboard-header-btn').addEventListener('click', () => switchView('stimmungs-dashboard'));

  dom.strukturbaumHeaderBtn.addEventListener("click", () => {
    // NEU
    switchView("strukturbaum");
  });

  dom.datenschutzHeaderBtn.addEventListener('click', () => {
    switchView('datenschutz');
  });

  // --- Modal Controls ---
  dom.closeHinweisModalBtn.addEventListener("click", () => {
    dom.hinweisModal.classList.remove("visible");
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
  });
  dom.hinweisModal.addEventListener("click", (e) => {
    if (e.target === dom.hinweisModal) {
      dom.hinweisModal.classList.remove("visible");
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    }
  });

  // NEU: Event-Listener für das Video anstelle des AI-Buttons
  const headerAnimationContainer = document.getElementById('header-animation-container');
  if (headerAnimationContainer) {
      headerAnimationContainer.addEventListener('click', handleAIAssistantClick);
  }

  dom.editUserForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveUserData();
  });
  dom.cancelEditUserBtn.addEventListener("click", closeEditUserModal);
  dom.cancelEditUserBtn2.addEventListener("click", closeEditUserModal);

  dom.addNewUserBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeSettingsMenu();
    openAddUserModal();
  });
  dom.addUserForm.addEventListener("submit", (e) => { e.preventDefault(); saveNewUser(); });
  dom.cancelAddUserBtn.addEventListener("click", closeAddUserModal);
  dom.cancelAddUserBtn2.addEventListener("click", closeAddUserModal);

  dom.planningBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeSettingsMenu();
    openPlanningModal();
  });
  dom.planningForm.addEventListener("submit", (e) => { e.preventDefault(); savePlanningData(); });
  dom.cancelPlanningBtn.addEventListener("click", closePlanningModal);
  document.getElementById('cancel-planning-btn-2').addEventListener('click', closePlanningModal);

  dom.pqqView.addEventListener('click', () => {
      dom.pqqDetailsContainer.classList.toggle('collapsed');
      dom.pqqView.classList.toggle('expanded');
  });

  // NEU: Zeitreise Event Listeners
  dom.timeTravelBtn.addEventListener('click', (e) => { e.preventDefault(); closeSettingsMenu(); openTimeTravelModal(); });
  dom.cancelTimeTravelBtn.addEventListener('click', closeTimeTravelModal);
  dom.cancelTimeTravelBtn2.addEventListener('click', closeTimeTravelModal);
  dom.timeTravelForm.addEventListener('submit', (e) => { e.preventDefault(); handleTimeTravelSubmit(); });
  dom.resetTimeTravelBtn.addEventListener('click', resetTimeTravel);

  // NEU: Event Listeners für Einarbeitungs-Scope-Toggle
  const onboardingGroupBtn = document.getElementById('onboarding-group-btn');
  const onboardingStructureBtn = document.getElementById('onboarding-structure-btn');

  if (onboardingGroupBtn && onboardingStructureBtn) {
      onboardingGroupBtn.addEventListener('click', () => {
          const scope = 'group';
          if (loadUiSetting('onboardingScope', 'group') === scope) return;
          saveUiSetting('onboardingScope', scope);
          onboardingGroupBtn.classList.add('active');
          onboardingStructureBtn.classList.remove('active');
          fetchAndRenderOnboarding(authenticatedUserData._id);
      });

      onboardingStructureBtn.addEventListener('click', () => {
          const scope = 'structure';
          if (loadUiSetting('onboardingScope', 'group') === scope) return;
          saveUiSetting('onboardingScope', scope);
          onboardingStructureBtn.classList.add('active');
          onboardingGroupBtn.classList.remove('active');
          fetchAndRenderOnboarding(authenticatedUserData._id);
      });
  }
}

// --- NEU: Swipe-to-Back-Funktionalität ---
function setupSwipeToBack() {
    let touchstartX = 0;
    let touchendX = 0;
    let touchstartTime = 0;

    const gestureZone = document.body;

    gestureZone.addEventListener('touchstart', function(event) {
        // Starte die Geste nur, wenn der Touch am linken Bildschirmrand beginnt
        if (event.touches[0].clientX < 50) {
            touchstartX = event.changedTouches[0].screenX;
            touchstartTime = new Date().getTime();
        } else {
            touchstartX = 0; // Setze zurück, wenn nicht am Rand gestartet
        }
    }, { passive: true });

    gestureZone.addEventListener('touchend', function(event) {
        if (touchstartX === 0) return; // Geste wurde nicht am Rand gestartet

        touchendX = event.changedTouches[0].screenX;
        const elapsedTime = new Date().getTime() - touchstartTime;

        handleSwipeGesture();
        touchstartX = 0; // Reset
    }, { passive: true });

    function handleSwipeGesture() {
        const swipeDistance = touchendX - touchstartX;
        // Prüfe auf eine ausreichend lange und schnelle Wischgeste nach rechts
        if (swipeDistance > 100) {
            // Nur auslösen, wenn der Zurück-Button sichtbar ist
            if (dom.backButton && !dom.backButton.classList.contains('hidden')) {
                console.log('Swipe-to-back detected, triggering back button click.');
                dom.backButton.click();
            }
        }
    }
}


async function loadAndCacheTotalEh() {
    const totalEhCacheKey = 'total-eh-results-v2'; // Neuer Cache-Key, um alte Formate zu invalidieren
    let cachedResults = loadFromCache(totalEhCacheKey, 240); // Cache für 4 Stunden. HINWEIS: Manuelles Löschen des Caches kann für Tests nötig sein.

    if (cachedResults) {
        console.log('%c[DATENLADEN] %cGesamt-EH aus dem Cache geladen.', 'color: #17a2b8; font-weight: bold;', 'color: black;');
        totalEhResults = cachedResults; // Die gecachten Daten sind bereits im richtigen Format
        return true;
    }

    console.log(`%c[DATENLADEN] %cGesamte Umsatz-Tabelle wird von der API geladen (langsame, aber stabile Abfrage)...`, 'color: #17a2b8; font-weight: bold;', 'color: red;');
    console.time('[DATENLADEN] Dauer für Gesamt-Umsatz-Tabellenabfrage');
    const allUmsatzRowsRaw = await seaTableQuery('Umsatz');
    console.timeEnd('[DATENLADEN] Dauer für Gesamt-Umsatz-Tabellenabfrage');

    if (!allUmsatzRowsRaw) {
        console.error('[DATENLADEN] Die Abfrage der Umsatz-Tabelle ist fehlgeschlagen.');
        setStatus("Kritischer Fehler: Die Umsatzdaten konnten nicht geladen werden.", true);
        return false;
    }

    // KORREKTUR: Capitalbank-Umsätze vor der Aggregation herausfiltern.
    const capitalbank = db.gesellschaften.find(g => g.Gesellschaft === 'Capitalbank');
    const capitalbankId = capitalbank ? capitalbank._id : null;

    const filteredUmsatzRows = allUmsatzRowsRaw.filter(row => {
        if (!capitalbankId) return true;
        const gesellschaftIdLink = row[COLUMN_MAPS.umsatz.Gesellschaft_ID];
        if (!gesellschaftIdLink || !Array.isArray(gesellschaftIdLink) || gesellschaftIdLink.length === 0) {
            return true; // Umsätze ohne Gesellschaft behalten
        }
        return !gesellschaftIdLink.some(link => link.row_id === capitalbankId);
    });

    const umsatzByMitarbeiter = _.groupBy(filteredUmsatzRows, row => row[COLUMN_MAPS.umsatz.Mitarbeiter_ID]?.[0]?.row_id);
    const calculatedResults = Object.entries(umsatzByMitarbeiter).map(([mitarbeiterId, umsaetze]) => {
        const totalEh = umsaetze.reduce((sum, u) => sum + (u[COLUMN_MAPS.umsatz.EH] || 0), 0);
        return { Mitarbeiter_ID: [{ row_id: mitarbeiterId }], totalEh: totalEh };
    });
    
    if (calculatedResults) {
        saveToCache(totalEhCacheKey, calculatedResults);
        console.log('%c[DATENLADEN] %cGesamt-EH geladen und im Cache gespeichert.', 'color: #17a2b8; font-weight: bold;', 'color: black;');
        totalEhResults = calculatedResults;
        return true;
    } else {
        console.error('[DATENLADEN] Die Abfrage für Gesamt-EH ist fehlgeschlagen und hat null zurückgegeben.');
        setStatus("Kritischer Fehler: Die Gesamtumsätze konnten nicht geladen werden. Bitte versuchen Sie es später erneut.", true);
        return false; // Signal failure
    }
}

let isInitializing = false;
async function initializeDashboard() {
  // NEU: Routing für die Bildschirm-Ansicht
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'bildschirm') {
      initializeBildschirmView();
      return;
  }

  if (isInitializing) {
    console.warn("Initialisierung bereits im Gange. Überspringe.");
    return;
  }
  isInitializing = true;

  // NEU: Zeitreise-Datum aus dem Speicher laden
  const storedTimeTravelDate = localStorage.getItem('timeTravelDate');
  if (storedTimeTravelDate) {
      timeTravelDate = new Date(storedTimeTravelDate);
  }

  // KORREKTUR: Lade UI-Einstellungen, bevor die Daten geladen werden.
  currentLeadershipViewMode = loadUiSetting('leadershipViewMode', 'list');

  const dataLoaded = await loadAllData();

  if (!dataLoaded) {
    setStatus("Initialisierung fehlgeschlagen. Bitte Seite neu laden.", true);
    isInitializing = false;
    return;
  }
  if (!COLUMN_MAPS.checkin) {
    console.error("Spalten-Map für 'Checkin' nicht gefunden. Funktion ist deaktiviert.");
    isInitializing = false;
    return;
  }

  // NEU: Logge die Metadaten für die Checkin-Tabelle, um die Struktur zu überprüfen.
  const checkinTableMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'checkin');
  if (checkinTableMeta) {
      console.log('%c[Checkin-Setup] %cMetadaten für Tabelle "Checkin":', 'color: #17a2b8; font-weight: bold;', 'color: black;', checkinTableMeta);
  } else {
      console.warn('[Checkin-Setup] Keine Metadaten für Tabelle "Checkin" in der Datenbank gefunden. Es wird die Fallback-Struktur verwendet.');
  }

  // NEU: Lade die Gesamt-EH-Daten, BEVOR das Dashboard gerendert wird.
  setStatus("Lade Gesamtumsätze (dies kann einen Moment dauern)...");
  const totalEhLoaded = await loadAndCacheTotalEh();

  // NEU: Instanz der AppointmentsView erstellen und Modal-Listener initialisieren
  appointmentsViewInstance = new AppointmentsView();
  appointmentsViewInstance._initSharedElementsAndListeners();

  if (!totalEhLoaded) {
      // loadAndCacheTotalEh setzt bereits die Fehlermeldung
      isInitializing = false;
      return;
  }

  // KORREKTUR: Im Zeitreise-Modus nur Mitarbeiter anzeigen, die zu diesem Zeitpunkt schon da waren.
  let usersForLogin = db.mitarbeiter.filter((m) => m.Name && m.Status !== 'Ausgeschieden');
  if (timeTravelDate) {
      usersForLogin = usersForLogin.filter(m => {
          if (!m.Startdatum) return false;
          return new Date(m.Startdatum) <= timeTravelDate;
      });
  }
  usersForLogin.sort((a, b) => a.Name.localeCompare(b.Name));
  usersForLogin.forEach((user) => {
    const option = document.createElement("option");
    option.value = user._id;
    option.textContent = user.Name;
    dom.userDropdownSelect.appendChild(option);
  });

  const loggedInUserId = localStorage.getItem("loggedInUserId");
  if (loggedInUserId && findRowById("mitarbeiter", loggedInUserId)) {
    authenticatedUserData = findRowById("mitarbeiter", loggedInUserId);
    updateUiForUserRoles();
    
    // NEU: Prüfe die Datenschutzzustimmung, BEVOR das Dashboard geladen wird.
    if (authenticatedUserData && !authenticatedUserData.Datenschutz) {
        document.getElementById("user-select-screen").classList.add("hidden");
        document.getElementById("dashboard-content").classList.remove("hidden");
        await showPrivacyConsentView();
    } else if (authenticatedUserData.Checkin) {
        const todayString = new Date().toISOString().split('T')[0];
        const lastCheckin = localStorage.getItem(`lastCheckin-${authenticatedUserData._id}`);
        if (lastCheckin !== todayString) {
            document.getElementById("user-select-screen").classList.add("hidden");
            document.getElementById("dashboard-content").classList.remove("hidden");
            await openCheckinModal();
        } else {
            await proceedToDashboard(loggedInUserId);
        }
    } else {
        await proceedToDashboard(loggedInUserId);
    }


  } else {
    document.getElementById("user-select-screen").classList.remove("hidden");
    document.getElementById("user-select-screen").classList.add("flex");
    setStatus("");
  }
  setupEventListeners();
  setupSwipeToBack(); // NEU: Swipe-Geste initialisieren
  isInitializing = false;
}
async function proceedToDashboard(userId) {
    viewHistory = [userId];
    document.getElementById("user-select-screen").classList.add("hidden");
    document.getElementById("dashboard-content").classList.remove("hidden");
    switchView('dashboard');
    await fetchAndRenderDashboard(userId);
}


async function showPrivacyConsentView() {
    // Alle anderen Ansichten ausblenden und nur die Datenschutz-Ansicht anzeigen
    Object.values(dom).forEach(el => {
        if (el && el.id && el.id.endsWith('-view') && el.id !== 'datenschutz-view') {
            el.classList.add('hidden');
        }
    });
    dom.datenschutzView.classList.remove('hidden');

    // Header-Buttons deaktivieren, außer Logout
    const headerButtons = document.querySelectorAll('header button');
    headerButtons.forEach(btn => {
        if (btn.id !== 'settings-btn' && btn.id !== 'clear-cache-btn') {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    });
    await loadAndInitDatenschutzView();
}

async function renderSubordinatesForLeader(leaderId, container) {
    container.innerHTML = '<div class="loader mx-auto my-4"></div>';
    
    // KORREKTUR: Finde die Daten der Führungskraft aus der bereits gerenderten Ansicht.
    const viewData = (currentPlanningView === 'struktur') ? structureData : teamData;
    const leaderCardData = viewData.members.find(m => m.id === leaderId);
    
    // KORREKTUR: Greife auf die 'members'-Eigenschaft zu, die die FK selbst + ihre MA enthält.
    const subordinateData = leaderCardData?.members || await getSubordinateDataWithCache(leaderId);

    if (subordinateData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">Diese Führungskraft hat keine direkten Mitarbeiter in der Gruppe.</p>';
        return;
    }

    // NEU: Zeitberechnungen für die Soll-Markierungen
    const { startDate, endDate } = getMonthlyCycleDates();
    const totalDaysInCycle = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const today = getCurrentDate();
    const daysPassedInCycle = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
    const timeElapsedPercentage = totalDaysInCycle > 0 ? (daysPassedInCycle / totalDaysInCycle) * 100 : 0;

    const nextInfoDate = findNextInfoDateAfter(today);
    const previousInfoDate = new Date(nextInfoDate.getTime() - 21 * 24 * 60 * 60 * 1000);
    const totalDaysInETCycle = 21;
    const daysPassedInETCycle = (today.getTime() - previousInfoDate.getTime()) / (1000 * 60 * 60 * 24);
    const etTimeElapsedPercentage = Math.max(0, Math.min(100, (daysPassedInETCycle / totalDaysInETCycle) * 100));

    // KORREKTUR: Filtere Mitarbeiter heraus, die kein EH-Ziel haben (passive MA), aber behalte die FK selbst immer drin.
    const activeSubordinates = subordinateData.filter(member => member.id === leaderId || (member.ehGoal || 0) > 0);
    container.dataset.loaded = "true";

    if (activeSubordinates.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">Diese Führungskraft hat keine aktiven Mitarbeiter in der Gruppe.</p>';
        return;
    }

    const listHtml = activeSubordinates.map(member => {
        const ehPercentage = member.ehGoal > 0 ? (member.ehCurrent / member.ehGoal * 100) : 0;
        const etPercentage = member.etGoal > 0 ? (member.etCurrent / member.etGoal * 100) : 0;
        // KORREKTUR: Verwende 'atVereinbart' für die Anzeige, um konsistent mit der Haupt-Dashboard-Karte zu sein.
        const atPercentage = member.atGoal > 0 ? (member.atVereinbart / member.atGoal * 100) : 0;

        return `
            <div class="p-3 border-t border-gray-200">
                <p class="font-semibold text-skt-blue">${member.name}</p>
                <div class="mt-2 space-y-2 text-xs">
                    <div>
                        <div class="flex justify-between"><span class="text-gray-600">EH</span><span>${member.ehCurrent} / ${member.ehGoal}</span></div>
                    <div class="w-full bg-gray-200 h-2 rounded-full relative">
                        <div class="bg-skt-green-accent h-2 rounded-full" style="width: ${Math.min(ehPercentage, 100)}%;"></div>
                        <div class="absolute top-[-2px] h-3 w-[2px] ml-[-1px] bg-skt-red-accent" style="left: ${timeElapsedPercentage}%;" data-tooltip="Soll-Fortschritt"></div>
                    </div>
                    </div>
            <div>
                <div class="flex justify-between"><span class="text-gray-600">AT</span><span>${member.atVereinbart} / ${member.atGoal}</span></div>
                <div class="w-full bg-gray-200 h-2 rounded-full relative">
                    <div class="bg-accent-gold h-2 rounded-full" style="width: ${Math.min(atPercentage, 100)}%;"></div>
                    <div class="absolute top-[-2px] h-3 w-[2px] ml-[-1px] bg-skt-red-accent" style="left: ${timeElapsedPercentage}%;" data-tooltip="Soll-Fortschritt"></div>
                </div>
            </div>
                <div>
                    <div class="flex justify-between"><span class="text-gray-600">ET</span><span>${member.etCurrent} / ${member.etGoal}</span></div>
                    <div class="w-full bg-gray-200 h-2 rounded-full relative">
                        <div class="bg-skt-blue-accent h-2 rounded-full" style="width: ${Math.min(etPercentage, 100)}%;"></div>
                        <div class="absolute top-[-2px] h-3 w-[2px] ml-[-1px] bg-skt-red-accent" style="left: ${etTimeElapsedPercentage}%;" data-tooltip="Soll-Fortschritt"></div>
                    </div>
                </div>
                </div>
            </div>
        `;
    }).join('');

    // NEU: Füge eine maximale Höhe und eine Scroll-Funktion hinzu
    container.innerHTML = `<div class="space-y-2 max-h-80 overflow-y-auto">${listHtml}</div>`;
}

function getProgressColorClass(current, goal, totalDays, daysPassed) {
  if (goal <= 0) return "bg-skt-grey-medium";
  const progressRatio = current / goal;
  if (progressRatio >= 1) return "bg-skt-green-accent";
  if (daysPassed <= 0) return "bg-skt-green-accent";

  const timeRatio = daysPassed / totalDays;

  if (progressRatio >= timeRatio) return "bg-skt-green-accent";
  if (progressRatio >= timeRatio * 0.75) return "bg-skt-yellow-accent";
  return "bg-skt-red-accent";
}

function getProgressColorHex(current, goal, totalDays, daysPassed) {
  if (goal <= 0) return "var(--color-skt-grey-medium)";
  const progressRatio = current / goal;
  if (progressRatio >= 1) return "var(--color-accent-green)";
  if (daysPassed <= 0) return "var(--color-accent-green)";

  const timeRatio = daysPassed / totalDays;

  if (progressRatio >= timeRatio) return "var(--color-accent-green)";
  if (progressRatio >= timeRatio * 0.75) return "var(--color-accent-yellow)";
  return "var(--color-accent-red)";
}

function getVerdienstForPosition(position) {
  const plan = db.karriereplan.find((p) => p.Stufe === position);
  if (!plan || !plan.Verdienst) return 0;

  let verdienstValue = plan.Verdienst;
  // Macht die Funktion robust, falls der Wert als Text mit Komma oder €-Symbol gespeichert ist.
  if (typeof verdienstValue === "string") {
    verdienstValue = verdienstValue.replace(/€/g, "").trim().replace(",", ".");
  }

  const rate = parseFloat(verdienstValue);
  return isNaN(rate) ? 0 : rate;
}

async function calculateAllStructureEarnings(memberIds, startDate, endDate) {
    const earningsLog = (message, ...data) => console.log(`%c[EARNINGS_DEBUG] %c${message}`, 'color: #f97316; font-weight: bold;', 'color: black;', ...data);
    const earningsMap = {};
    if (memberIds.length === 0) return earningsMap;

    const startDateIso = startDate.toISOString().split("T")[0];
    const endDateIso = endDate.toISOString().split("T")[0];

    const capitalbank = db.gesellschaften.find(g => g.Gesellschaft === 'Capitalbank');
    const capitalbankId = capitalbank ? capitalbank._id : null;
    earningsLog(`Capitalbank ID: ${capitalbankId}`);

    const memberNames = memberIds.map(id => findRowById('mitarbeiter', id)?.Name).filter(Boolean);
    if (memberNames.length === 0) {
        earningsLog('Keine gültigen Mitarbeiter für die Abfrage gefunden.');
        return earningsMap;
    }
    const memberNamesSql = memberNames.map(name => `'${escapeSql(name)}'`).join(',');

    const allTurnoverQuery = `SELECT Mitarbeiter_ID, Gesellschaft_ID, EH FROM Umsatz WHERE Datum >= '${startDateIso}' AND Datum <= '${endDateIso}' AND Mitarbeiter_ID IN (${memberNamesSql})`;
    earningsLog('Lade alle Umsätze für den Zeitraum...', allTurnoverQuery);
    const allTurnoverRowsRaw = await seaTableSqlQuery(allTurnoverQuery, true);
    if (!allTurnoverRowsRaw) {
        earningsLog('!!! FEHLER: Konnte keine Umsatzdaten laden.');
        return earningsMap;
    }
    const allTurnoverRows = mapSqlResults(allTurnoverRowsRaw, "Umsatz");
    earningsLog(`Habe ${allTurnoverRows.length} Umsatz-Zeilen vom Server erhalten.`);

    const filteredTurnoverRows = allTurnoverRows.filter(row => {
        if (!capitalbankId) return true;
        const gesellschaftLinks = row.Gesellschaft_ID;
        if (!gesellschaftLinks || !Array.isArray(gesellschaftLinks) || gesellschaftLinks.length === 0) return true;
        const hasCapitalbank = gesellschaftLinks.some(link => link.row_id === capitalbankId);
        if (hasCapitalbank) {
            earningsLog(`FILTERED OUT (Verdienst): Umsatz für ${row.Mitarbeiter_ID?.[0]?.display_value} mit Capitalbank (EH: ${row.EH})`, row);
        }
        return !hasCapitalbank;
    });
    earningsLog(`${filteredTurnoverRows.length} Umsatz-Zeilen nach Filterung übrig.`);

    const turnoverByMitarbeiter = _.groupBy(filteredTurnoverRows, row => row.Mitarbeiter_ID?.[0]?.row_id);
    const allTurnovers = Object.entries(turnoverByMitarbeiter).map(([mitarbeiterId, umsaetze]) => ({
        Mitarbeiter_ID: [{ row_id: mitarbeiterId }],
        turnover: umsaetze.reduce((sum, u) => sum + (u.EH || 0), 0)
    }));
    earningsLog('Aggregierte Umsätze pro Mitarbeiter:', allTurnovers);

    const getTurnoverForMember = (memberId) => {
        const result = allTurnovers.find(
            (s) =>
            s.Mitarbeiter_ID &&
            Array.isArray(s.Mitarbeiter_ID) &&
            s.Mitarbeiter_ID[0] &&
            s.Mitarbeiter_ID[0].row_id === memberId
        );
        return result?.turnover || 0;
    };
    const hierarchy = buildHierarchy();

    for (const leaderId of memberIds) {
        const leader = findRowById("mitarbeiter", leaderId);
        if (!leader || !leader.Name) {
            earningsMap[leaderId] = { personal: 0, group: 0, structure: 0 };
            continue;
        }

        if (leader.Status === 'Ausgeschieden') {
            earningsMap[leaderId] = { personal: 0, group: 0, structure: 0 };
            continue;
        }

        const leaderRate = getVerdienstForPosition(leader.Karrierestufe);

        const leaderTurnover = getTurnoverForMember(leaderId);
        const personalEarnings = leaderTurnover * leaderRate;

        let groupEarnings = 0;
        let structureEarnings = personalEarnings;

        // NEU: Logik, um inaktive Führungskräfte zu "überspringen" und deren
        // direkte Untergebene für die Provisionsberechnung an die nächsthöhere aktive FK zu hängen.
        const subordinatesToProcess = [];
        const queue = [...(hierarchy[leaderId]?.children || [])];
        const visited = new Set(queue);

        while (queue.length > 0) {
            const currentId = queue.shift();
            const user = findRowById("mitarbeiter", currentId);
            if (!user) continue;

            if (user.Status !== 'Ausgeschieden') {
                subordinatesToProcess.push(user);
            } else {
                // Inaktiver Mitarbeiter: Füge dessen Kinder zur Warteschlange hinzu,
                // um sie als direkte Untergebene des aktuellen Leaders zu behandeln.
                const node = hierarchy[currentId];
                if (node) {
                    node.children.forEach(childId => {
                        if (!visited.has(childId)) {
                            queue.push(childId);
                            visited.add(childId);
                        }
                    });
                }
            }
        }

        if (subordinatesToProcess.length > 0) {
            // Placeholder for potential future logging
        }

        subordinatesToProcess.forEach((sub, index) => {
            const subRate = getVerdienstForPosition(sub.Karrierestufe);
            const differentialRate = leaderRate - subRate;

            if (differentialRate > 0) {
                const subAndHisTeam = [sub, ...getAllSubordinatesRecursive(sub._id, hierarchy)]
                    .filter(m => m.Status !== 'Ausgeschieden');

                const subStructureTurnover = subAndHisTeam.reduce(
                    (total, currentMember) => {
                        const memberTurnover = getTurnoverForMember(currentMember._id);
                        return total + memberTurnover;
                    }, 0
                );

                if (subStructureTurnover > 0) {
                    const differentialEarning = subStructureTurnover * differentialRate;

                    structureEarnings += differentialEarning;

                    if (!isUserLeader(sub)) {
                        groupEarnings += differentialEarning;
                    }
                }
            }
        });

        earningsMap[leaderId] = {
            personal: personalEarnings,
            group: groupEarnings,
            structure: structureEarnings,
        };
    }
    return earningsMap;
}

async function calculateAllStructureTargetEarnings(memberIds, fullDataStore) {
    const targetEarningsMap = {};
    if (memberIds.length === 0) return targetEarningsMap;

    const hierarchy = buildHierarchy();

    const getTargetEhForMember = (memberId) => {
        const memberData = fullDataStore.find(d => d.id === memberId);
        return memberData?.ehGoal || 0;
    };

    for (const leaderId of memberIds) {
        const leader = findRowById("mitarbeiter", leaderId);
        if (!leader || !leader.Name || leader.Status === 'Ausgeschieden') {
            targetEarningsMap[leaderId] = { personal: 0, group: 0, structure: 0 };
            continue;
        }

        const leaderRate = getVerdienstForPosition(leader.Karrierestufe);
        const leaderTargetEh = getTargetEhForMember(leaderId);
        const personalTargetEarnings = leaderTargetEh * leaderRate;

        let groupTargetEarnings = 0;
        let structureTargetEarnings = personalTargetEarnings;

        const subordinatesToProcess = [];
        const queue = [...(hierarchy[leaderId]?.children || [])];
        const visited = new Set(queue);

        while (queue.length > 0) {
            const currentId = queue.shift();
            const user = findRowById("mitarbeiter", currentId);
            if (!user) continue;

            if (user.Status !== 'Ausgeschieden') {
                subordinatesToProcess.push(user);
            } else {
                const node = hierarchy[currentId];
                if (node) {
                    node.children.forEach(childId => {
                        if (!visited.has(childId)) {
                            queue.push(childId);
                            visited.add(childId);
                        }
                    });
                }
            }
        }

        subordinatesToProcess.forEach(sub => {
            const subRate = getVerdienstForPosition(sub.Karrierestufe);
            const differentialRate = leaderRate - subRate;

            if (differentialRate > 0) {
                const subAndHisTeam = [sub, ...getAllSubordinatesRecursive(sub._id, hierarchy)]
                    .filter(m => m.Status !== 'Ausgeschieden');

                const subStructureTargetEh = subAndHisTeam.reduce(
                    (total, currentMember) => {
                        const memberTargetEh = getTargetEhForMember(currentMember._id);
                        return total + memberTargetEh;
                    }, 0
                );

                if (subStructureTargetEh > 0) {
                    const differentialTargetEarning = subStructureTargetEh * differentialRate;
                    structureTargetEarnings += differentialTargetEarning;

                    if (!isUserLeader(sub)) {
                        groupTargetEarnings += differentialTargetEarning;
                    }
                }
            }
        });

        targetEarningsMap[leaderId] = {
            personal: personalTargetEarnings,
            group: groupTargetEarnings,
            structure: structureTargetEarnings,
        };
    }
    return targetEarningsMap;
}

async function checkAndApplyAutomaticPromotion(mitarbeiterId, totalEh) {
  const user = findRowById("mitarbeiter", mitarbeiterId);
  if (!user || !user.Karrierestufe) return;
  const recruitedEmployees = db.mitarbeiter.filter(
    (m) => m.Werber === mitarbeiterId
  ).length;

  const currentStage = db.karriereplan.find(
    (p) => p.Stufe === user.Karrierestufe
  );
  if (!currentStage) return;

  const nextStage = db.karriereplan
    .filter((p) => p.Hierarchie > currentStage.Hierarchie)
    .sort((a, b) => a.Hierarchie - b.Hierarchie)[0];

  if (nextStage && nextStage.AutomatischeBefoerderung) {
    if (
      totalEh >= nextStage.Kriterium_EH &&
      recruitedEmployees >= nextStage.Kriterium_MA
    ) {
      const userInDb = db.mitarbeiter.find((u) => u._id === mitarbeiterId);
      if (userInDb && userInDb.Karrierestufe !== nextStage.Stufe) {
        userInDb.Karrierestufe = nextStage.Stufe;
        console.log(
          `Mitarbeiter ${user.Name} wurde automatisch zu ${nextStage.Stufe} befördert (visuell).`
        );
      }
    }
  }
}

async function applyAutomaticPromotionToDatabase(mitarbeiterId) {
    const user = findRowById("mitarbeiter", mitarbeiterId);
    if (!user || !user.Karrierestufe) {
        return false;
    }

    // 1. Lade die aktuellen Gesamt-EH des Mitarbeiters direkt aus der Datenbank.
    const totalEhQuery = `SELECT \`Mitarbeiter_ID\`, SUM(\`EH\`) AS \`totalEh\` FROM \`Umsatz\` GROUP BY \`Mitarbeiter_ID\``;
    const totalEhResultsRaw = await seaTableSqlQuery(totalEhQuery, false);
    const totalEhResults = mapSqlResults(totalEhResultsRaw || [], "Umsatz");
    const userEhData = totalEhResults.find(
        (te) =>
          te.Mitarbeiter_ID &&
          Array.isArray(te.Mitarbeiter_ID) &&
          te.Mitarbeiter_ID[0] &&
          te.Mitarbeiter_ID[0].row_id === mitarbeiterId
      ) || {};
    const totalEh = userEhData.totalEh || 0;

    const recruitedEmployees = db.mitarbeiter.filter(m => m.Werber === mitarbeiterId).length;

    const currentStage = db.karriereplan.find(p => p.Stufe === user.Karrierestufe);
    if (!currentStage) {
        console.warn(`[PROMOTION_DB] Aktuelle Karrierestufe '${user.Karrierestufe}' für ${user.Name} nicht im Karriereplan gefunden.`);
        return false;
    }

    // 2. Finde die höchste erreichbare Stufe, für die die Kriterien erfüllt sind.
    const promotableStages = db.karriereplan
        .filter(p => p.Hierarchie > currentStage.Hierarchie && p.AutomatischeBefoerderung)
        .sort((a, b) => b.Hierarchie - a.Hierarchie); // Absteigend sortieren, um die höchste zuerst zu prüfen.

    for (const nextStage of promotableStages) {
        if (totalEh >= nextStage.Kriterium_EH && recruitedEmployees >= nextStage.Kriterium_MA) {
            console.log(`[PROMOTION_DB] Mitarbeiter ${user.Name} erfüllt die Kriterien für ${nextStage.Stufe}.`);

            // 3. Finde den Spaltennamen für "Karrierestufe" dynamisch.
            const karrierestufeKey = COLUMN_MAPS.mitarbeiter.Karrierestufe;
            const tableMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'mitarbeiter');
            const karrierestufeCol = tableMeta.columns.find(c => c.key === karrierestufeKey);
            if (!karrierestufeCol) {
                console.error(`[PROMOTION_DB] Metadaten für Spalte 'Karrierestufe' nicht gefunden.`);
                return false;
            }
            const karrierestufeColName = karrierestufeCol.name;

            // 4. Aktualisiere das Verknüpfungsfeld über die dedizierte Link-Update-Funktion,
            // da ein direkter SQL-Update für Link-Spalten den "type mismatch"-Fehler verursacht.
            console.log(`[PROMOTION_DB] Aktualisiere Verknüpfung für ${karrierestufeColName} zu ${nextStage.Stufe} (${nextStage._id})`);
            const success = await updateSingleLink(
                'Mitarbeiter',          // baseTableName
                mitarbeiterId,          // baseRowId
                karrierestufeColName,   // linkColumnName
                [nextStage._id]         // otherRowIds
            );

            if (success) {
                console.log(`[PROMOTION_DB] ${user.Name} erfolgreich zu ${nextStage.Stufe} befördert.`);
                localStorage.removeItem(CACHE_PREFIX + 'mitarbeiter'); // Cache leeren
                await loadAllData(); // Alle Daten neu laden
                await fetchAndRenderDashboard(mitarbeiterId); // Dashboard neu rendern
                return true; // Signalisiert, dass eine Beförderung stattgefunden hat.
            } else {
                console.error(`[PROMOTION_DB] API-Update zur Beförderung von ${user.Name} ist fehlgeschlagen.`);
                return false;
            }
        }
    }
    return false; // Keine Beförderung durchgeführt.
}

async function handleAIAssistantClick() {
  dom.hinweisModalTitle.textContent = "Frag den Adler";
  dom.hinweisModalContent.innerHTML = '<div class="loader mx-auto"></div>';
  dom.hinweisModal.classList.add("visible");
  document.body.classList.add("modal-open");

  const {
    name,
    position,
    ehCurrent,
    ehGoal,
    atCurrent,
    atGoal,
    etCurrent,
    etGoal,
  } = personalData;

  const userPrompt = `
                Analysiere die folgenden Leistungsdaten für ${name} (${position}) und gib eine prägnante, motivierende Zusammenfassung sowie 2-3 konkrete, umsetzbare Tipps.
                - Aktuelle Einheiten (EH): ${ehCurrent} von ${ehGoal} geplant.
                - Aktuelle Analysetermine (AT): ${atCurrent} von ${atGoal} geplant.
                - Aktuelle Einstellungstermine (ET): ${etCurrent} von ${etGoal} geplant.
                
                Gib die Antwort auf Deutsch, direkt formuliert an den Mitarbeiter (Du-Form). Formatiere die Zusammenfassung als normalen Absatz (<p>). Formatiere die Tipps als nummerierte Liste (<ol><li>Tipp 1</li>...</ol>). Verwende <strong> für Schlüsselwörter.
            `;

  const systemPrompt =
    "Du bist ein erfahrener und motivierender Vertriebscoach. Deine Antworten sind immer positiv, konstruktiv und auf den Punkt gebracht.";

  try {
    const apiKey = "AIzaSyAUnqTaKJ1B7mvltFTWvHcz4szfA1YDFek";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok)
      throw new Error(
        `API-Anfrage fehlgeschlagen mit Status: ${response.status}`
      );

    const result = await response.json();
    const candidate = result.candidates?.[0];

    if (candidate && candidate.content?.parts?.[0]?.text) {
      dom.hinweisModalContent.innerHTML = candidate.content.parts[0].text;
    } else {
      throw new Error("Unerwartete Antwortstruktur von der API.");
    }
  } catch (error) {
    console.error("Fehler bei der Gemini-API-Anfrage:", error);
    dom.hinweisModalContent.textContent =
      "Der KI-Assistent ist im Moment leider nicht verfügbar. Bitte versuchen Sie es später erneut.";
  }
}

function _renderSinglePQQGauge(indicatorEl, valueDisplayEl, value) {
    if (!indicatorEl || !valueDisplayEl) {
        console.warn('[PQQ_RENDER] Gauge-Elemente nicht gefunden.');
        return;
    }
    const pqqClamped = Math.max(60, Math.min(value, 140));
    const indicatorPosition = ((pqqClamped - 60) / (140 - 60)) * 100;
    indicatorEl.style.left = `${indicatorPosition}%`;
    valueDisplayEl.style.left = `${indicatorPosition}%`;
    valueDisplayEl.textContent = `${value.toFixed(0)}%`;
}

async function calculateAndRenderPQQ(mitarbeiterId) {
    const pqqLog = (message, ...data) => console.log(`%c[PQQ_CALC] %c${message}`, 'color: #d4af37; font-weight: bold;', 'color: black;', ...data);
    pqqLog('Starte PQQ-Berechnung...');

    // 1. Get previous month's dates
    const { startDate, endDate } = getPreviousMonthlyCycleDates();
    const startDateIso = startDate.toISOString().split('T')[0];
    const endDateIso = endDate.toISOString().split('T')[0];
    const prevMonthName = startDate.toLocaleString("de-DE", { month: "long" });
    const prevYear = startDate.getFullYear();
    pqqLog(`Berechnungszeitraum: ${startDateIso} bis ${endDateIso}`);

    // 2. Get planning data from cache
    const plan = db.monatsplanung.find(p => 
        p.Mitarbeiter_ID === mitarbeiterId &&
        p.Monat === prevMonthName &&
        p.Jahr === prevYear
    );

    if (!plan) {
        pqqLog('Keine Plandaten für den Vormonat gefunden. PQQ-Ansicht wird ausgeblendet.');
        dom.pqqView.classList.add('hidden');
        return;
    }
    dom.pqqView.classList.remove('hidden');

    const ursprungszielEH = plan?.Ursprungsziel_EH || 0;
    const ursprungszielET = plan?.Ursprungsziel_ET || 0;
    pqqLog(`Plandaten gefunden: EH-Ziel=${ursprungszielEH}, ET-Ziel=${ursprungszielET}`);

    // 3. Get actual data for previous month via SQL
    const mitarbeiterName = findRowById('mitarbeiter', mitarbeiterId)?.Name;
    if (!mitarbeiterName) return;
    const mitarbeiterNameSql = `'${escapeSql(mitarbeiterName)}'`;

    const ehQuery = `SELECT SUM(EH) as totalEH FROM Umsatz WHERE Mitarbeiter_ID = ${mitarbeiterNameSql} AND Datum >= '${startDateIso}' AND Datum <= '${endDateIso}'`;
    const etQuery = `SELECT Status FROM Termine WHERE Mitarbeiter_ID = ${mitarbeiterNameSql} AND Kategorie = 'ET' AND Datum >= '${startDateIso}' AND Datum <= '${endDateIso}'`;

    const [ehResultRaw, etResultRaw] = await Promise.all([
        seaTableSqlQuery(ehQuery, true),
        seaTableSqlQuery(etQuery, true)
    ]);

    const totalEH = ehResultRaw?.[0]?.totalEH || 0;
    const ET_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten", "Weiterer ET", "Info Eingeladen", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];
    const totalETAusgemacht = etResultRaw.filter(t => ET_STATUS_AUSGEMACHT.includes(t.Status)).length;
    pqqLog(`Ist-Werte ermittelt: Total EH=${totalEH}, Total ET Ausgemacht=${totalETAusgemacht}`);

    // 4. Calculate PQQ parts
    let ehQuote = 0;
    if (totalEH > 0) {
        ehQuote = ursprungszielEH / totalEH;
    } else if (ursprungszielEH === 0) { // Ziel 0, Ist 0 -> 100% Zielerreichung
        ehQuote = 1;
    }

    let etQuote = 0;
    if (totalETAusgemacht > 0) {
        etQuote = ursprungszielET / totalETAusgemacht;
    } else if (ursprungszielET === 0) { // Ziel 0, Ist 0 -> 100% Zielerreichung
        etQuote = 1;
    }

    const pqq = ((ehQuote + etQuote) / 2) * 100;
    pqqLog(`Einzelquoten berechnet: EH-Quote=${(ehQuote * 100).toFixed(2)}%, ET-Quote=${(etQuote * 100).toFixed(2)}%`);
    pqqLog(`Gesamt-PQQ berechnet: ${pqq.toFixed(2)}%`);

    // 5. Render gauges
    _renderSinglePQQGauge(dom.pqqIndicator, dom.pqqValueDisplay, pqq);
    _renderSinglePQQGauge(dom.pqqEhIndicator, dom.pqqEhValueDisplay, ehQuote * 100);
    _renderSinglePQQGauge(dom.pqqEtIndicator, dom.pqqEtValueDisplay, etQuote * 100);
    pqqLog('Alle Gauges gerendert.');
}

// NEU: Berechnet und rendert die PQQ basierend auf der aktuellen Ansicht (Persönlich, Gruppe, Struktur)
async function calculateAndRenderPQQForCurrentView() {
    const pqqLog = (message, ...data) => console.log(`%c[PQQ_VIEW] %c${message}`, 'color: #d4af37; font-weight: bold;', 'color: black;', ...data);
    pqqLog('Starte PQQ-Berechnung für aktuelle Ansicht...');

    // --- Caching Logic ---
    const { startDate: prevMonthStartDate } = getPreviousMonthlyCycleDates();
    const cachePeriodKey = `${prevMonthStartDate.getFullYear()}-${prevMonthStartDate.getMonth()}`;
    let scopeKey;
    if (isSuperuserView) {
        scopeKey = 'superuser';
    } else {
        scopeKey = `${currentlyViewedUserData._id}-${currentPlanningView}`;
    }
    const cacheKey = `pqq-${cachePeriodKey}-${scopeKey}`;
    const maxAgeMinutes = 30 * 24 * 60; // Cache für 30 Tage

    const cachedPQQ = loadFromCache(cacheKey, maxAgeMinutes);
    if (cachedPQQ) {
        pqqLog(`PQQ-Daten aus dem Cache geladen für Key: ${cacheKey}`);
        dom.pqqView.classList.remove('hidden');
        _renderSinglePQQGauge(dom.pqqIndicator, dom.pqqValueDisplay, cachedPQQ.pqq);
        _renderSinglePQQGauge(dom.pqqEhIndicator, dom.pqqEhValueDisplay, cachedPQQ.ehQuote * 100);
        _renderSinglePQQGauge(dom.pqqEtIndicator, dom.pqqEtValueDisplay, cachedPQQ.etQuote * 100);
        pqqLog('Alle Gauges aus dem Cache gerendert.');
        return; // Berechnung hier beenden, da Daten aus dem Cache kamen
    }
    pqqLog(`Keine gültigen PQQ-Daten im Cache gefunden für Key: ${cacheKey}. Führe Neuberechnung durch.`);

    let userIds = [];
    const currentUser = currentlyViewedUserData;
    const isLeader = currentUser && currentUser.Karrierestufe ? !currentUser.Karrierestufe.toLowerCase().includes("trainee") : false;

    // 1. Bestimme die relevanten Mitarbeiter-IDs basierend auf der aktuellen Ansicht
    if (isSuperuserView) {
        userIds = db.mitarbeiter.filter(m => m.Name && !m.Name.toLowerCase().startsWith("geschäftsstelle")).map(m => m._id);
        pqqLog(`Superuser-Ansicht. Berechne PQQ für ${userIds.length} Mitarbeiter.`);
    } else if (!isLeader) {
        userIds = [currentUser._id];
        pqqLog(`Trainee-Ansicht. Berechne PQQ für: ${currentUser.Name}`);
    } else {
        switch (currentPlanningView) {
            case 'personal':
                userIds = [currentUser._id];
                pqqLog(`Führungskraft-Ansicht (Persönlich). Berechne PQQ für: ${currentUser.Name}`);
                break;
            case 'team':
                const teamMembers = getSubordinates(currentUser._id, 'gruppe');
                userIds = [currentUser._id, ...teamMembers.map(u => u._id)];
                pqqLog(`Führungskraft-Ansicht (Gruppe). Berechne PQQ für ${userIds.length} Mitarbeiter.`);
                break;
            case 'struktur':
                const structureMembers = getAllSubordinatesRecursive(currentUser._id);
                userIds = [currentUser._id, ...structureMembers.map(u => u._id)];
                pqqLog(`Führungskraft-Ansicht (Struktur). Berechne PQQ für ${userIds.length} Mitarbeiter.`);
                break;
            default:
                userIds = [currentUser._id];
                pqqLog(`Unbekannte Ansicht, Fallback auf Persönlich für: ${currentUser.Name}`);
        }
    }

    if (userIds.length === 0) {
        pqqLog('Keine Mitarbeiter-IDs für die Berechnung gefunden. Blende PQQ aus.');
        dom.pqqView.classList.add('hidden');
        return;
    }

    // 2. Hole Plandaten für den Vormonat
    const { startDate, endDate } = getPreviousMonthlyCycleDates();
    const startDateIso = startDate.toISOString().split('T')[0];
    const endDateIso = endDate.toISOString().split('T')[0];
    const prevMonthName = startDate.toLocaleString("de-DE", { month: "long" });
    const prevYear = startDate.getFullYear();
    pqqLog(`PQQ-Zeitraum: ${startDateIso} bis ${endDateIso} (${prevMonthName} ${prevYear})`);
    pqqLog('Suche Plandaten in `db.monatsplanung` (insgesamt ' + db.monatsplanung.length + ' Einträge).');
    const relevantInfoPlans = db.infoplanung.filter(p => userIds.includes(p.Mitarbeiter_ID) && new Date(p.Informationsabend).getFullYear() === prevYear && new Date(p.Informationsabend).getMonth() === startDate.getMonth());
    const relevantPlans = db.monatsplanung.filter(p =>
        userIds.includes(p.Mitarbeiter_ID) &&
        p.Monat === prevMonthName &&
        p.Jahr === prevYear
    );

    if (relevantPlans.length === 0 && relevantInfoPlans.length === 0) {
        pqqLog('FEHLER: Keine Plandaten für den Vormonat in der ausgewählten Ansicht gefunden. PQQ-Ansicht wird ausgeblendet.');
        const usersWithPlans = new Set(db.monatsplanung.filter(p => p.Monat === prevMonthName && p.Jahr === prevYear).map(p => p.Mitarbeiter_ID));
        const usersWithoutPlans = userIds.filter(id => !usersWithPlans.has(id));
        pqqLog('Mitarbeiter in der Ansicht, für die kein Plan gefunden wurde:', usersWithoutPlans.map(id => findRowById('mitarbeiter', id)?.Name || `ID: ${id}`));
        dom.pqqView.classList.add('hidden');
        return;
    }

    dom.pqqView.classList.remove('hidden');
    const totalUrsprungszielEH = relevantPlans.reduce((sum, p) => sum + (p.Ursprungsziel_EH || 0), 0);
    const totalUrsprungszielET = relevantInfoPlans.reduce((sum, p) => sum + (p.Ursprungsziel_ET || 0), 0);
    pqqLog(`Plandaten gefunden (${relevantPlans.length} Einträge): Gesamt-EH-Ziel=${totalUrsprungszielEH}, Gesamt-ET-Ziel=${totalUrsprungszielET}`);

    // 3. Hole Ist-Daten für den Vormonat
    const mitarbeiterNames = userIds.map(id => findRowById('mitarbeiter', id)?.Name).filter(Boolean);
    if (mitarbeiterNames.length === 0) {
        pqqLog('Keine gültigen Mitarbeiter für die SQL-Abfrage gefunden.');
        dom.pqqView.classList.add('hidden');
        return;
    }
    const mitarbeiterNamesSql = mitarbeiterNames.map(name => `'${escapeSql(name)}'`).join(',');

    const ET_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten", "Weiterer ET", "Info Eingeladen", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];
    const etStatusSql = ET_STATUS_AUSGEMACHT.map(s => `'${escapeSql(s)}'`).join(',');

    const ehQuery = `SELECT SUM(EH) as totalEH FROM Umsatz WHERE Mitarbeiter_ID IN (${mitarbeiterNamesSql}) AND Datum >= '${startDateIso}' AND Datum <= '${endDateIso}'`;
    const etQuery = `SELECT _id FROM Termine WHERE Mitarbeiter_ID IN (${mitarbeiterNamesSql}) AND Kategorie = 'ET' AND Datum >= '${startDateIso}' AND Datum <= '${endDateIso}' AND Status IN (${etStatusSql})`;

    // NEU: Zusätzliches Logging für SQL-Abfragen und Kriterien
    pqqLog('Sende SQL-Abfrage für IST-EH:', ehQuery);
    pqqLog('Sende SQL-Abfrage für IST-ET (direkt gefiltert):', etQuery);

    const [ehResultRaw, etResultRaw] = await Promise.all([
        seaTableSqlQuery(ehQuery, true),
        seaTableSqlQuery(etQuery, true)
    ]);

    const totalEH = ehResultRaw?.[0]?.totalEH || 0;
    const totalETAusgemacht = etResultRaw ? etResultRaw.length : 0;
    pqqLog(`Ist-Werte ermittelt: Total EH=${totalEH}, Total ET Ausgemacht=${totalETAusgemacht}`);

    // 4. Berechne PQQ-Teile
    // KORREKTUR: Formel ist Ist / Ziel
    const ehQuote = (totalUrsprungszielEH > 0) ? (totalEH / totalUrsprungszielEH) : (totalUrsprungszielEH === 0 ? 1 : 0);

    // KORREKTUR: Formel ist Ist / Ziel
    const etQuote = (totalUrsprungszielET > 0) ? (totalETAusgemacht / totalUrsprungszielET) : (totalUrsprungszielET === 0 ? 1 : 0);

    const pqq = ((ehQuote + etQuote) / 2) * 100;
    pqqLog(`Einzelquoten berechnet: EH-Quote=${(ehQuote * 100).toFixed(2)}%, ET-Quote=${(etQuote * 100).toFixed(2)}%`);
    pqqLog(`Gesamt-PQQ berechnet: ${pqq.toFixed(2)}%`);

    // NEU: PQQ-Daten im Cache speichern
    const pqqDataToCache = {
        pqq: pqq,
        ehQuote: ehQuote,
        etQuote: etQuote
    };
    saveToCache(cacheKey, pqqDataToCache);
    pqqLog('PQQ-Daten im Cache gespeichert.', pqqDataToCache);

    // 5. Rendere die Gauges
    _renderSinglePQQGauge(dom.pqqIndicator, dom.pqqValueDisplay, pqq);
    _renderSinglePQQGauge(dom.pqqEhIndicator, dom.pqqEhValueDisplay, ehQuote * 100);
    _renderSinglePQQGauge(dom.pqqEtIndicator, dom.pqqEtValueDisplay, etQuote * 100);
    pqqLog('Alle Gauges gerendert.');
}

// --- NEU: Strukturbaum View Logic ---
const strukturbaumLog = (message, ...data) => console.log(`%c[Strukturbaum] %c${message}`, 'color: #8e44ad; font-weight: bold;', 'color: black;', ...data);

class StrukturbaumView {
    constructor() {
        this.container = null;
        this.kpiToggle = null;
        this.zoomInBtn = null;
        this.zoomOutBtn = null;
        this.zoomLevelDisplay = null;
        this.initialized = false;
        this.currentUserId = null;
        this.zoomLevel = 1;
        this.zoomStep = 0.1;
    }

    _getDomElements() {
        this.container = document.getElementById('strukturbaum-container');
        this.kpiToggle = document.getElementById('strukturbaum-kpi-toggle');
        this.zoomInBtn = document.getElementById('strukturbaum-zoom-in-btn');
        this.zoomOutBtn = document.getElementById('strukturbaum-zoom-out-btn');
        this.zoomLevelDisplay = document.getElementById('strukturbaum-zoom-level');
        return this.container && this.kpiToggle && this.zoomInBtn && this.zoomOutBtn && this.zoomLevelDisplay;
    }

    async init(userId) {
        strukturbaumLog(`Modul wird initialisiert für User-ID: ${userId}`);
        this.currentUserId = userId;

        if (!this._getDomElements()) {
            strukturbaumLog('!!! FEHLER: Container für Strukturbaum nicht gefunden.');
            return;
        }

        await this.render();
    }

    async render() {
        this.container.innerHTML = '<div class="loader mx-auto"></div>';

        const hierarchy = buildHierarchy();
        const rootNode = hierarchy[this.currentUserId];
        if (!rootNode) {
            this.container.innerHTML = '<p>Startknoten nicht gefunden.</p>';
            return;
        }

        // --- Caching Logic ---
        const { startDate: currentCycleStart } = getMonthlyCycleDates();
        const { startDate: prevCycleStart } = getPreviousMonthlyCycleDates();
        const kpiPeriodKey = `${currentCycleStart.getFullYear()}-${currentCycleStart.getMonth()}`;
        const pqqPeriodKey = `${prevCycleStart.getFullYear()}-${prevCycleStart.getMonth()}`;
        const cacheKey = `strukturbaum-data-${this.currentUserId}-${kpiPeriodKey}-${pqqPeriodKey}`;
        const maxAgeMinutes = 60; // Cache for 1 hour

        let dataMap = loadFromCache(cacheKey, maxAgeMinutes);

        if (dataMap) {
            strukturbaumLog('Daten für den Baum aus dem Cache geladen.', dataMap);
        } else {
            const allUserIdsInTree = [this.currentUserId, ...getAllSubordinatesRecursive(this.currentUserId).map(u => u._id)];
            strukturbaumLog(`Lade Daten für ${allUserIdsInTree.length} Mitarbeiter im Baum...`);
            strukturbaumLog(`Keine gültigen Daten im Cache für Key: ${cacheKey}. Führe Neuberechnung durch.`);
            dataMap = await this.getBulkDataForTree(allUserIdsInTree);
            saveToCache(cacheKey, dataMap);
            strukturbaumLog('Alle Daten für den Baum geladen und im Cache gespeichert.', dataMap);
        }
        // --- End Caching Logic ---

        const treeHtml = this.buildHtmlTree(rootNode, hierarchy, dataMap);
        this.container.innerHTML = treeHtml;
        this.setupNodeEventListeners();
        this._updateZoom();
        this._updateContainerSize(); // Initial size calculation
    }

    buildHtmlTree(node, hierarchy, dataMap) {
        if (!node || !node.user) return '';

        // Generate the HTML for all children first.
        // This will be a string of `<li>...</li>` elements, as this function returns either an `<li>` string or a concatenated string of `<li>`s.
        let childrenLis = '';
        if (node.children && node.children.length > 0) {
            childrenLis = node.children
                .map(childId => this.buildHtmlTree(hierarchy[childId], hierarchy, dataMap))
                .join('');
        }

        // If the current node is inactive, don't render it. Just pass up the `<li>` elements of its children.
        // This effectively re-parents the active children to the current node's parent.
        if (node.user.Status === 'Ausgeschieden') {
            return childrenLis;
        }

        // If the current node is active, wrap it in an `<li>` and its children in a `<ul>`.
        const childrenUl = childrenLis ? `<ul>${childrenLis}</ul>` : '';
        const hasActiveChildren = !!childrenLis;

        return `
            <li>
                ${this.createNodeHtml(node.user, dataMap[node.user._id] || { kpi: {}, pqq: 0 }, hasActiveChildren)}
                ${childrenUl}
            </li>
        `;
    }

    createNodeHtml(user, data, hasChildren) {
        const pqqColor = this.getPqqColor(data.pqq);
        const kpi = data.kpi || {};

        return `
            <div class="strukturbaum-node" data-userid="${user._id}" style="background-color: ${pqqColor};">
                <p class="node-name">${user.Name}</p>
                <p class="node-position">${user.Karrierestufe || 'N/A'}</p>
                <div class="node-actions">
                    ${hasChildren ? `<button class="toggle-children-btn" title="Struktur ein-/ausklappen"><i class="fas fa-sitemap"></i></button>` : ''}
                </div>
                <div class="node-kpis">
                    <div><strong>EH:</strong> ${kpi.ehCurrent || 0} / ${kpi.ehGoal || 0}</div>
                    <div><strong>ET:</strong> ${kpi.etCurrent || 0} / ${kpi.etGoal || 0}</div>
                </div>
            </div>
        `;
    }

    setupNodeEventListeners() {
        this.kpiToggle.addEventListener('change', (e) => {
            this.container.classList.toggle('kpis-visible', e.currentTarget.checked);
        });
        this.container.querySelectorAll('.toggle-children-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const li = e.currentTarget.closest('li');
                const childrenUl = li.querySelector('ul');
                if (childrenUl) {
                    childrenUl.classList.toggle('collapsed');
                    this._updateContainerSize();
                }
            });
        });

        this.zoomInBtn.addEventListener('click', () => {
            this.zoomLevel += this.zoomStep;
            this._updateZoom();
            this._updateContainerSize();
        });
        this.zoomOutBtn.addEventListener('click', () => {
            this.zoomLevel -= this.zoomStep;
            this._updateZoom();
            this._updateContainerSize();
        });
    }

    getPqqColor(pqq) {
        if (pqq > 120) return 'var(--color-accent-green)';
        if (pqq >= 80) return 'var(--color-accent-yellow)';
        if (pqq > 0) return 'var(--color-accent-red)';
        return '#ffffff'; // Weiß, wenn keine PQQ vorhanden
    }

    _updateZoom() {
        // Clamp zoom level between 50% and 200%
        this.zoomLevel = Math.max(0.5, Math.min(this.zoomLevel, 2));
        this.container.style.transform = `scale(${this.zoomLevel})`;
        this.zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
    
    _updateContainerSize() {
        // Use a timeout to allow the DOM to update after toggling the class.
        // The transition duration for `ul` is 0.5s.
        setTimeout(() => {
            const allNodes = this.container.querySelectorAll('.strukturbaum-node');
            if (allNodes.length === 0) {
                this.container.style.minHeight = 'auto';
                this.container.style.minWidth = 'auto';
                return;
            }
    
            let lowestBottom = 0;
            let minLeft = Infinity;
            let maxRight = -Infinity;

            const containerTop = this.container.getBoundingClientRect().top;
    
            allNodes.forEach(node => {
                // Check if the node is visible (not inside a collapsed ul)
                if (node.offsetParent !== null) {
                    const nodeRect = node.getBoundingClientRect();
                    lowestBottom = Math.max(lowestBottom, nodeRect.bottom);
                    minLeft = Math.min(minLeft, nodeRect.left);
                    maxRight = Math.max(maxRight, nodeRect.right);
                }
            });
    
            const requiredHeight = lowestBottom - containerTop;
            const unscaledHeight = (requiredHeight / this.zoomLevel) + 40; // 40px padding
            this.container.style.minHeight = `${unscaledHeight}px`;

            const requiredWidth = maxRight - minLeft;
            const unscaledWidth = (requiredWidth / this.zoomLevel) + 40; // 40px padding
            this.container.style.minWidth = `${unscaledWidth}px`;
        }, 600); // Increased timeout slightly for safety
    }

    async getBulkDataForTree(userIds) {
        const dataMap = {};
        userIds.forEach(id => dataMap[id] = { kpi: {}, pqq: 0 });

        // 1. Get personal KPI Data (current month) for all users in the tree
        const kpiData = await fetchBulkDashboardData(userIds);
        const kpiDataById = _.keyBy(kpiData, 'id');

        // 2. Iterate and calculate final KPIs for each user (personal or aggregated group values)
        for (const userId of userIds) {
            const user = findRowById('mitarbeiter', userId);
            if (!user) continue;

            if (isUserLeader(user)) {
                // For leaders, calculate aggregated group values
                const groupMembers = [user, ...getSubordinates(userId, 'gruppe')];
                const groupMemberIds = new Set(groupMembers.map(m => m._id));
                
                let ehCurrent = 0, ehGoal = 0, etCurrent = 0, etGoal = 0;
                groupMemberIds.forEach(id => {
                    const memberKpi = kpiDataById[id];
                    if (memberKpi) {
                        ehCurrent += memberKpi.ehCurrent || 0;
                        ehGoal += memberKpi.ehGoal || 0;
                        etCurrent += memberKpi.etCurrent || 0;
                        etGoal += memberKpi.etGoal || 0;
                    }
                });
                dataMap[userId].kpi = { ehCurrent, ehGoal, etCurrent, etGoal };
            } else {
                // For non-leaders, use their personal values
                const personalKpi = kpiDataById[userId] || {};
                dataMap[userId].kpi = { ehCurrent: personalKpi.ehCurrent || 0, ehGoal: personalKpi.ehGoal || 0, etCurrent: personalKpi.etCurrent || 0, etGoal: personalKpi.etGoal || 0 };
            }
        }

        // 3. Get PQQ Data (previous month)
        const { startDate: prevStart, endDate: prevEnd } = getPreviousMonthlyCycleDates();
        const prevStartDateIso = prevStart.toISOString().split('T')[0];
        const prevEndDateIso = prevEnd.toISOString().split('T')[0];
        const prevMonthName = prevStart.toLocaleString("de-DE", { month: "long" });
        const prevYear = prevStart.getFullYear();

        const allNames = userIds.map(id => findRowById('mitarbeiter', id)?.Name).filter(Boolean);
        const allNamesSql = allNames.map(name => `'${escapeSql(name)}'`).join(',');

        const ehQuery = `SELECT Mitarbeiter_ID, SUM(EH) as totalEH FROM Umsatz WHERE Mitarbeiter_ID IN (${allNamesSql}) AND Datum >= '${prevStartDateIso}' AND Datum <= '${prevEndDateIso}' GROUP BY Mitarbeiter_ID`;
        const etQuery = `SELECT Mitarbeiter_ID, Status FROM Termine WHERE Mitarbeiter_ID IN (${allNamesSql}) AND Kategorie = 'ET' AND Datum >= '${prevStartDateIso}' AND Datum <= '${prevEndDateIso}'`;

        const [ehResultsRaw, etResultsRaw] = await Promise.all([
            seaTableSqlQuery(ehQuery, true),
            seaTableSqlQuery(etQuery, true)
        ]);

        const ehByMitarbeiter = _.groupBy(mapSqlResults(ehResultsRaw, 'Umsatz'), r => r.Mitarbeiter_ID[0].display_value);
        const etByMitarbeiter = _.groupBy(mapSqlResults(etResultsRaw, 'Termine'), r => r.Mitarbeiter_ID[0].display_value);
        const plans = db.monatsplanung.filter(p => p.Monat === prevMonthName && p.Jahr === prevYear);

        for (const userId of userIds) {
            const user = findRowById('mitarbeiter', userId);
            if (!user) continue;

            let idsForPqqCalc = [userId];
            if (isUserLeader(user)) {
                const groupMembers = getSubordinates(userId, 'gruppe');
                idsForPqqCalc.push(...groupMembers.map(m => m._id));
            }

            const pqq = await this.calculatePQQForIds(idsForPqqCalc, plans, ehByMitarbeiter, etByMitarbeiter);
            if (dataMap[userId]) {
                dataMap[userId].pqq = pqq;
            }
        }

        return dataMap;
    }

    async calculatePQQForIds(userIds, allPlans, allEh, allEt) {
        const ET_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten", "Weiterer ET", "Info Eingeladen", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];

        let totalUrsprungszielEH = 0;
        let totalUrsprungszielET = 0;
        let totalActualEH = 0;
        let totalActualET = 0;

        for (const id of userIds) {
            const user = findRowById('mitarbeiter', id);
            if (!user) continue;

            const plan = allPlans.find(p => p.Mitarbeiter_ID === id);
            totalUrsprungszielEH += plan?.Ursprungsziel_EH || 0;
            totalUrsprungszielET += plan?.Ursprungsziel_ET || 0;

            totalActualEH += allEh[user.Name]?.[0]?.totalEH || 0;
            const userEts = allEt[user.Name] || [];
            totalActualET += userEts.filter(t => ET_STATUS_AUSGEMACHT.includes(t.Status)).length;
        }

        let ehQuote = 0;
        if (totalActualEH > 0) ehQuote = totalUrsprungszielEH / totalActualEH;
        else if (totalUrsprungszielEH === 0) ehQuote = 1;

        let etQuote = 0;
        if (totalActualET > 0) etQuote = totalUrsprungszielET / totalActualET;
        else if (totalUrsprungszielET === 0) etQuote = 1;

        return ((ehQuote + etQuote) / 2) * 100;
    }
}

async function loadAndInitStrukturbaumView() {
    const container = dom.strukturbaumView;
    try {
        const response = await fetch("./strukturbaum.html");
        if (!response.ok) throw new Error(`Die Datei 'strukturbaum.html' konnte nicht gefunden werden.`);
        container.innerHTML = await response.text();
        if (!strukturbaumViewInstance) strukturbaumViewInstance = new StrukturbaumView();
        await strukturbaumViewInstance.init(authenticatedUserData._id);
    } catch (error) {
        console.error("Fehler beim Laden der Strukturbaum-Ansicht:", error);
        container.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}

// --- PG-Tagebuch View Logic ---
const pgLog = (message, ...data) => console.log(`%c[PG-Tagebuch] %c${message}`, 'color: #3498db; font-weight: bold;', 'color: black;', ...data);

class PGTagebuchView {
    constructor() {
        this.initialized = false;
        this.currentUserId = null;
        this.allPgs = [];
        this.currentPgId = null;
        this.timerStartTime = null;
        this.timerInterval = null;
        this.filterText = '';
        this.quill = null;
        this.signaturePad = null;
        this.pendingImageFile = null;
        this.pendingDrawingDataUrl = null;
        this.imageDeleted = false; // NEU
        this.drawingDeleted = false; // NEU
        this.aufgabenContainer = null; // NEU: Referenz auf den Aufgaben-Container
    }

    _getDomElements() {
        this.listContainer = document.getElementById('pg-list-container');
        this.editorContainer = document.getElementById('pg-editor-container');
        this.welcomeView = document.getElementById('pg-welcome-view');
        this.editorView = document.getElementById('pg-editor-view');
        this.form = document.getElementById('pg-form');
        this.newEntryBtn = document.getElementById('pg-new-entry-btn');
        this.searchInput = document.getElementById('pg-search-input');
        this.searchContainer = document.getElementById('pg-search-container');
        // NEU: Zusätzliche Elemente
        this.timerDisplay = document.getElementById('pg-timer');
        this.editorContainer = document.getElementById('pg-text-editor-container');
        this.imagePreviewContainer = document.getElementById('pg-image-preview-container');
        this.uploadImageBtn = document.getElementById('pg-upload-image-btn');
        this.imageInput = document.getElementById('pg-image-input');
        this.drawingPreviewContainer = document.getElementById('pg-drawing-preview-container');
        this.openDrawingBtn = document.getElementById('pg-open-drawing-btn');
        this.drawingModal = document.getElementById('drawing-modal');
        this.drawingCanvas = document.getElementById('drawing-canvas');
        // NEU: Löschen-Buttons
        this.deleteImageBtn = document.getElementById('pg-delete-image-btn');
        this.deleteDrawingBtn = document.getElementById('pg-delete-drawing-btn');
        this.aufgabenContainer = document.getElementById('pg-aufgaben-container');

        return this.listContainer && this.editorContainer && this.form && this.newEntryBtn && this.searchInput && this.searchContainer && this.deleteImageBtn && this.deleteDrawingBtn;
    }

    async init(userId) {
        pgLog(`Modul wird initialisiert für User-ID: ${userId}`);
        this.currentUserId = userId;

        if (!this._getDomElements()) {
            pgLog('!!! FEHLER: Benötigte DOM-Elemente wurden nicht gefunden.');
            return;
        }
        
        // Quill Editor initialisieren
        if (this.editorContainer && !this.quill) {
            // KORREKTUR: Initialisiere Quill direkt auf dem Container,
            // um das Höhenproblem zu beheben.
            this.quill = new Quill('#pg-text-editor-container', {
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }]
                    ]
                },
                theme: 'snow'
            });
        }

        // Die Event-Listener müssen bei jeder Initialisierung neu gesetzt werden,
        // da der HTML-Inhalt der Ansicht dynamisch neu geladen wird.
        this.setupEventListeners();
        await this.fetchAndRender();
    }

    async fetchAndRender() {
        this.listContainer.innerHTML = '<div class="loader mx-auto"></div>';
        const currentUserId = this.currentUserId;
        const mySubordinateIds = new Set(SKT_APP.getAllSubordinatesRecursive(this.currentUserId).map(u => u._id));

        this.allPgs = db['pg'].filter(pg => {
            // Ein PG-Eintrag ist sichtbar, wenn der aktuelle Benutzer:
            // 1. Der Leiter des Gesprächs ist.
            // 2. Der Mitarbeiter im Gespräch ist.
            // 3. Ein Vorgesetzter ist und der Mitarbeiter im Gespräch zu seiner Struktur gehört.
            return pg.Leiter === currentUserId || 
                   pg.Mitarbeiter === currentUserId || 
                   mySubordinateIds.has(pg.Mitarbeiter);
        });

        this.allPgs.sort((a, b) => new Date(b.Datum) - new Date(a.Datum));
        pgLog(`${this.allPgs.length} PGs geladen.`);
        this.renderList();
        this.renderEditor(null); // Startansicht anzeigen
    }

    renderList() {
        this.listContainer.innerHTML = '';

        if (this.allPgs.length === 0) {
            this.searchContainer.classList.add('hidden');
            this.listContainer.innerHTML = '<p class="text-center text-gray-500">Keine Gespräche gefunden.</p>';
            return;
        }
        this.searchContainer.classList.remove('hidden');

        let pgsToRender = this.allPgs;
        if (this.filterText) {
            const searchText = this.filterText.toLowerCase();
            pgsToRender = this.allPgs.filter(pg => {
                const title = (pg.Titel || '').toLowerCase();
                const leiterName = (SKT_APP.findRowById('mitarbeiter', pg.Leiter)?.Name || '').toLowerCase();
                const mitarbeiterName = (SKT_APP.findRowById('mitarbeiter', pg.Mitarbeiter)?.Name || '').toLowerCase();
                return title.includes(searchText) || leiterName.includes(searchText) || mitarbeiterName.includes(searchText);
            });
        }

        if (pgsToRender.length === 0) {
            this.listContainer.innerHTML = '<p class="text-center text-gray-500">Keine passenden Gespräche gefunden.</p>';
            return;
        }

        pgsToRender.forEach(pg => {
            const otherPersonId = pg.Leiter === this.currentUserId ? pg.Mitarbeiter : pg.Leiter;
            const otherPerson = SKT_APP.findRowById('mitarbeiter', otherPersonId);
            const otherPersonName = otherPerson ? otherPerson.Name : 'Unbekannt';

            const item = document.createElement('div');
            item.className = `p-3 rounded-lg cursor-pointer transition-colors duration-200 ${pg._id === this.currentPgId ? 'bg-skt-blue text-white' : 'hover:bg-skt-grey-light'}`;
            item.dataset.id = pg._id;
            item.innerHTML = `
                <p class="font-semibold truncate">${pg.Titel || 'Unbenanntes Gespräch'}</p>
                <p class="text-sm ${pg._id === this.currentPgId ? 'text-gray-300' : 'text-gray-500'}">
                    ${otherPersonName} • ${new Date(pg.Datum).toLocaleDateString('de-DE')}
                </p>
            `;
            item.addEventListener('click', () => this.renderEditor(pg._id));
            this.listContainer.appendChild(item);
        });
    }

    renderEditor(pgId) {
        this.currentPgId = pgId;
        if (this.timerInterval) clearInterval(this.timerInterval);
        // Warnhinweis standardmäßig ausblenden
        document.getElementById('pg-warning-message').classList.add('hidden');

        this.renderList(); // Liste neu rendern, um die Auswahl zu markieren

        this.welcomeView.classList.toggle('hidden', pgId !== null);
        this.editorView.classList.toggle('hidden', pgId === null);
        if (pgId === null) {
            this.timerStartTime = null;
            return;
        }
    this.imageDeleted = false;
    this.drawingDeleted = false;
    this.pendingImageFile = null;
    this.pendingDrawingDataUrl = null;

        const pg = this.allPgs.find(p => p._id === pgId);
        if (!pg) { // This can happen if a new entry is being created
            if (!pgId.startsWith('new-')) pgLog(`PG mit ID ${pgId} nicht gefunden.`);
            this.welcomeView.classList.remove('hidden');
            this.editorView.classList.add('hidden');
            return;
        }

        this.timerStartTime = Date.now(); // Timer starten

        this.form.querySelector('#pg-id').value = pg._id;
        this._setupTimer(pg);
        this.form.querySelector('#pg-titel').value = pg.Titel || '';
        
        // Editor-Inhalt setzen
        const textContent = pg.Text || '';
        // Prüfen, ob der Inhalt Markdown ist (enthält **, *, # etc.) oder HTML
        const isMarkdown = /(\*\*|__|\*|_|#|`)/.test(textContent) && !/<[a-z][\s\S]*>/i.test(textContent);
        let htmlContent;
        if (isMarkdown) {
            htmlContent = marked.parse(textContent, { sanitize: false });
        } else {
            // KORREKTUR: Auch bestehender HTML-Inhalt wird über den sicheren Konverter geladen.
            htmlContent = textContent;
        }
        const delta = this.quill.clipboard.convert(htmlContent);
        this.quill.setContents(delta, 'silent');

        this._displayPreview('image', pg.Bild?.[0]?.url);
        this._displayPreview('drawing', pg.Zeichnung?.[0]?.url);
        this._renderAufgaben(pg.Aufgaben || '');

        // Leiter-Feld (fest) befüllen
        const leiterNameP = this.form.querySelector('#pg-leiter-name');
        const leiter = SKT_APP.findRowById('mitarbeiter', pg.Leiter);
        leiterNameP.textContent = leiter ? leiter.Name : 'Unbekannt';

        // Mitarbeiter-Dropdown mit der eigenen Struktur befüllen
        const mitarbeiterSelect = this.form.querySelector('#pg-mitarbeiter');
        const subordinates = SKT_APP.getAllSubordinatesRecursive(this.currentUserId);
        const allSelectableUsers = [SKT_APP.authenticatedUserData, ...subordinates].sort((a, b) => a.Name.localeCompare(b.Name));
        
        mitarbeiterSelect.innerHTML = '';
        allSelectableUsers.forEach(u => {
            mitarbeiterSelect.add(new Option(u.Name, u._id));
        });

        mitarbeiterSelect.value = pg.Mitarbeiter;

        this.form.querySelector('#pg-delete-btn').classList.remove('hidden');
    }

    openNewEntryForm() {
        this.currentPgId = `new-${Date.now()}`; // Temporäre ID für die Auswahl
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerStartTime = Date.now(); // Timer starten
        this.renderList();

        this.imageDeleted = false;
        this.drawingDeleted = false;
        this.pendingImageFile = null;
        this.pendingDrawingDataUrl = null;

        this.welcomeView.classList.add('hidden');
        this.editorView.classList.remove('hidden');
        this.form.reset();
        this.form.querySelector('#pg-id').value = '';
        this._setupTimer(null);

        // Leiter-Feld (fest) befüllen
        const leiterNameP = this.form.querySelector('#pg-leiter-name');
        leiterNameP.textContent = SKT_APP.authenticatedUserData.Name;

        // Mitarbeiter-Dropdown mit der eigenen Struktur befüllen und vorauswählen
        const mitarbeiterSelect = this.form.querySelector('#pg-mitarbeiter');
        const subordinates = SKT_APP.getAllSubordinatesRecursive(this.currentUserId);
        const allSelectableUsers = [SKT_APP.authenticatedUserData, ...subordinates].sort((a, b) => a.Name.localeCompare(b.Name));
        
        mitarbeiterSelect.innerHTML = '';
        allSelectableUsers.forEach(u => {
            mitarbeiterSelect.add(new Option(u.Name, u._id));
        });

        // Den aktuell im Dashboard angesehenen Mitarbeiter vorauswählen
        mitarbeiterSelect.value = SKT_APP.currentlyViewedUserData._id;

        // Warnhinweis anzeigen, wenn man ein Gespräch mit sich selbst anlegt
        const warningMessage = document.getElementById('pg-warning-message');
        if (SKT_APP.currentlyViewedUserData._id === this.currentUserId) {
            warningMessage.classList.remove('hidden');
        } else {
            warningMessage.classList.add('hidden');
        }

        // NEU: Formatierter Standardtext für Gesprächsnotizen
        const defaultText = `**Ziel:** Ursachen verstehen, gemeinsam Lösungen entwickeln, Entwicklung starten.

**Ablauf:**
1.  **Offene Bestandsaufnahme (10 Min)**
    *   Wie zufrieden bist du mit deiner letzten Woche?
    *   Was hat gut funktioniert, was nicht?
2.  **Ursachenanalyse (15 Min)**
    *   Quoten, Termine, Aktivitäten durchsprechen.
    *   Gemeinsame Bewertung: Was sind die größten Hebel?
3.  **Zielklärung & Motivation (10 Min)**
    *   Welches Hauptziel für nächste Woche ist realistisch und motivierend?
4.  **Lösungsentwicklung (15 Min)**
    *   2–3 konkrete Maßnahmen festlegen.
    *   Rollenspiel oder Praxisbeispiele einbauen.
5.  **Unterstützung sichern (5 Min)**
    *   Was kann ich tun, um dir zu helfen?
    *   abfragen wann man den GP erreichen kann
6.  **Motivation & Verabschiedung (5 Min)**
    *   Positiver Ausblick, Termin fürs nächste Gespräch setzen.`;
        const htmlContent = marked.parse(defaultText, { sanitize: false });
        const delta = this.quill.clipboard.convert(htmlContent);
        this.quill.setContents(delta, 'silent');
        this._displayPreview('image', null);
        this._displayPreview('drawing', null);

        // KORREKTUR: Standardvorlage vereinfacht, um Parsing-Fehler zu vermeiden.
        const defaultAufgaben = `Prio 1 ToDos:\n- \n- \n- \n\nSonstige ToDos:\n- \n- \n- `;
        this._renderAufgaben(defaultAufgaben);

        this.form.querySelector('#pg-delete-btn').classList.add('hidden');
    }

    setupEventListeners() {
        this.newEntryBtn.addEventListener('click', () => this.openNewEntryForm());
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.form.querySelector('#pg-delete-btn').addEventListener('click', () => this.handleDelete());

        this.searchInput.addEventListener('input', _.debounce(() => {
            this.filterText = this.searchInput.value;
            this.renderList();
        }, 300));

        // Event Listener für den Warnhinweis
        const mitarbeiterSelect = this.form.querySelector('#pg-mitarbeiter');
        const warningMessage = document.getElementById('pg-warning-message');
        mitarbeiterSelect.addEventListener('change', () => {
            if (mitarbeiterSelect.value === this.currentUserId) {
                warningMessage.classList.remove('hidden');
            } else {
                warningMessage.classList.add('hidden');
            }
        });

        // NEU: Event-Listener für Bild- und Zeichen-Buttons
        this.uploadImageBtn.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this._handleImageSelect(e));
        this.openDrawingBtn.addEventListener('click', () => this._openDrawingModal());
        // NEU: Listener für Löschen-Buttons
        this.deleteImageBtn.addEventListener('click', () => this._deleteAttachment('image'));
        this.deleteDrawingBtn.addEventListener('click', () => this._deleteAttachment('drawing'));
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        if (this.timerInterval) clearInterval(this.timerInterval);
        const saveBtn = this.form.querySelector('#pg-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Speichern...';

        const rowId = this.form.querySelector('#pg-id').value;
        const isNew = !rowId;

        const existingPg = isNew ? null : this.allPgs.find(p => p._id === rowId);
        let totalMinutes = existingPg?.Dauer ? (existingPg.Dauer / 60) : 0;

        if (this.timerStartTime) {
            const elapsedMs = Date.now() - this.timerStartTime;
            const elapsedMinutes = Math.round(elapsedMs / 60000);
            totalMinutes += elapsedMinutes;
        }

        const dateValue = existingPg ? new Date(existingPg.Datum).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // NEU: Upload-Logik
        const imageUploadPromise = this.pendingImageFile
            ? this._uploadFile(this.pendingImageFile)
            : Promise.resolve(null);

        const drawingUploadPromise = this.pendingDrawingDataUrl
            ? this._uploadFile(this._dataURLtoFile(this.pendingDrawingDataUrl, 'zeichnung.png'))
            : Promise.resolve(null);

        const [imageObject, drawingObject] = await Promise.all([imageUploadPromise, drawingUploadPromise]);

        const rowData = { // KORREKTUR: Spalten-Keys statt Property-Namen verwenden
            [COLUMN_MAPS.pg.Leiter]: [this.currentUserId],
            [COLUMN_MAPS.pg.Mitarbeiter]: [this.form.querySelector('#pg-mitarbeiter').value],
            [COLUMN_MAPS.pg.Datum]: dateValue,
            [COLUMN_MAPS.pg.Titel]: this.form.querySelector('#pg-titel').value,
            [COLUMN_MAPS.pg.Text]: this.quill.root.innerHTML,
            [COLUMN_MAPS.pg.Aufgaben]: this._serializeAufgaben(),
            [COLUMN_MAPS.pg.Dauer]: totalMinutes * 60 // KORREKTUR: Dauer in Sekunden speichern
        };

        if (imageObject) {
            rowData[COLUMN_MAPS.pg.Bild] = [imageObject];
        } else if (this.imageDeleted) {
            rowData[COLUMN_MAPS.pg.Bild] = null;
        }
        if (drawingObject) {
            rowData[COLUMN_MAPS.pg.Zeichnung] = [drawingObject];
        } else if (this.drawingDeleted) {
            rowData[COLUMN_MAPS.pg.Zeichnung] = null;
        }

        pgLog('Daten werden gespeichert:', JSON.parse(JSON.stringify(rowData)));

        const success = await addOrUpdatePgEntry(isNew ? null : rowId, rowData); // rowData enthält jetzt Keys

        if (success) {
            localStorage.removeItem(CACHE_PREFIX + 'pg');
            await loadAllData();
            await this.fetchAndRender();
        } else {
            alert('Fehler beim Speichern des Gesprächs.');
        }

        saveBtn.disabled = false;
        saveBtn.textContent = 'Speichern';
    }

    async handleDelete() {
        const rowId = this.form.querySelector('#pg-id').value;
        if (!rowId) return;

        const confirmed = await showConfirmationModal('Möchten Sie dieses Gespräch wirklich löschen?', 'Löschen bestätigen', 'Ja, löschen');
        if (confirmed) {
            const success = await seaTableDeleteRow('PG', rowId);
            if (success) {
                localStorage.removeItem(CACHE_PREFIX + 'pg');
                await loadAllData();
                await this.fetchAndRender();
            } else {
                alert('Fehler beim Löschen.');
            }
        }
    }

    _setupTimer(pg) {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const initialDuration = pg ? (pg.Dauer || 0) : 0; // in seconds

        const updateTimer = () => {
            const elapsedSeconds = this.timerStartTime ? Math.floor((Date.now() - this.timerStartTime) / 1000) : 0;
            const totalSeconds = initialDuration + elapsedSeconds;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            this.timerDisplay.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        updateTimer(); // Initial call
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    _handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        this.pendingImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            this._displayPreview('image', e.target.result);
        };
        reader.readAsDataURL(file);
    }

    _openDrawingModal() {
        this.drawingModal.classList.add('visible');
        const canvas = this.drawingCanvas;
        // Resize canvas to fit container
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);

        this.signaturePad = new SignaturePad(canvas, {
            penColor: document.getElementById('drawing-color').value
        });

        document.getElementById('drawing-color').onchange = (e) => { this.signaturePad.penColor = e.target.value; };
        document.getElementById('drawing-pen-width').oninput = (e) => { this.signaturePad.minWidth = e.target.value; this.signaturePad.maxWidth = e.target.value; };
        document.getElementById('drawing-clear-btn').onclick = () => { this.signaturePad.clear(); };
        document.getElementById('drawing-save-btn').onclick = () => this._saveDrawing();
        // NEU: Event-Listener für den Undo-Button
        document.getElementById('drawing-undo-btn').onclick = () => {
            const data = this.signaturePad.toData();
            if (data && data.length > 0) {
                data.pop(); // Entfernt die letzte Aktion
                this.signaturePad.fromData(data);
            }
        };
    }

    _saveDrawing() {
        if (this.signaturePad.isEmpty()) {
            alert("Bitte zeichnen Sie zuerst etwas.");
            return;
        }
        this.pendingDrawingDataUrl = this.signaturePad.toDataURL('image/png');
        this._displayPreview('drawing', this.pendingDrawingDataUrl);
        this.drawingModal.classList.remove('visible');
        this.signaturePad.off();
        this.signaturePad = null;
    }

    _displayPreview(type, url) {
        const log = (message, ...data) => pgLog(`[PG-DisplayPreview] ${message}`, ...data);
        log(`Zeige Vorschau für Typ '${type}' mit URL:`, url);

        const container = type === 'image' ? this.imagePreviewContainer : this.drawingPreviewContainer;
        const deleteBtn = type === 'image' ? this.deleteImageBtn : this.deleteDrawingBtn;

        // Clear only the preview content (span or img)
        const previewContent = container.querySelector('span, img');
        if (previewContent) previewContent.remove();

        if (url) {
            const img = document.createElement('img');
            let finalSrc = '';
            // KORREKTUR: Die URL aus der DB ist relativ, wir brauchen die Basis-URL des Servers.
            if (url.startsWith('http')) {
                finalSrc = url; // Already a full URL from the DB
                log(`URL ist bereits absolut: ${finalSrc}`);
            } else if (url.startsWith('data:')) {
                finalSrc = url; // Data URL for a pending upload
                log(`URL ist eine data-URL.`);
            } else {
                const baseUrl = new URL(apiGatewayUrl).origin;
                finalSrc = baseUrl + url; // Relative path, needs base URL
                log(`URL ist relativ. Konstruierte finale URL: ${finalSrc}`);
            }
            img.src = finalSrc;
            img.className = 'w-full h-full object-contain';
            container.prepend(img);
            deleteBtn.classList.remove('hidden');
        } else {
            log('Keine URL vorhanden, zeige Platzhalter.');
            const span = document.createElement('span');
            span.className = 'text-gray-500';
            span.textContent = 'Vorschau';
            container.prepend(span);
            deleteBtn.classList.add('hidden');
        }
    }

    async _uploadFile(file) {
        const log = (message, ...data) => pgLog(`[PG-UploadFile] ${message}`, ...data);
        if (!file) return null;
        log(`Starte Upload-Prozess für Datei: ${file.name}`);

        // Schritt 1: Upload-Link und Pfad vom Server holen.
        log('Schritt 1: Rufe Upload-Link und Pfad ab...');
        const uploadLinkData = await seaTableGetUploadLink();
        if (!uploadLinkData || !uploadLinkData.upload_link || !uploadLinkData.parent_path || !uploadLinkData.path) {
            log('!!! FEHLER: Ungültige Antwort von seaTableGetUploadLink. "path" fehlt!', uploadLinkData);
            alert('Fehler: Upload-Link oder Upload-Verzeichnis/Pfad konnte nicht vom Server abgerufen werden.');
            return null;
        }
        log('Schritt 1 erfolgreich. Link-Daten:', uploadLinkData);

        // Schritt 2: Datei hochladen.
        log('Schritt 2: Lade Datei zum Server hoch...');
        const success = await seaTableUploadFile(uploadLinkData.upload_link, file, uploadLinkData.parent_path);
        
        // Schritt 3: Ergebnis auswerten.
        log('Schritt 3: Werte Upload-Ergebnis aus...');
        if (success) {
            const relativePath = uploadLinkData.path;
            log(`Schritt 3 erfolgreich. Relativer Pfad ist: ${relativePath}`);
            return { url: relativePath, name: file.name, size: file.size };
        } else {
            log('!!! FEHLER: seaTableUploadFile meldete einen Fehler.');
            alert('Fehler beim Hochladen der Datei.');
            return null;
        }
    }

    _dataURLtoFile(dataurl, filename) {
        let arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    // NEU: Methode zum Löschen von Anhängen
    _deleteAttachment(type) {
        pgLog(`Lösche Anhang vom Typ: ${type}`);
        if (type === 'image') {
            this.pendingImageFile = null;
            this.imageDeleted = true;
            this._displayPreview('image', null);
        } else if (type === 'drawing') {
            this.pendingDrawingDataUrl = null;
            this.drawingDeleted = true;
            this._displayPreview('drawing', null);
        }
    }

    // NEU: Rendert die interaktive To-Do-Liste aus einem Text-String
    _renderAufgaben(text) {
        const container = this.form.querySelector('#pg-aufgaben-container');
        container.innerHTML = ''; // Clear previous content
        const lines = text.split('\n');

        lines.forEach(line => {
            const trimmedLine = line.trim();
            // Check for todo items: "- [x] text", "- [ ] text", or "- text"
            if (trimmedLine.startsWith('-')) {
                const isChecked = trimmedLine.startsWith('- [x]');
                const isUnchecked = trimmedLine.startsWith('- [ ]');
                
                let todoText = '';
                if (isChecked) todoText = line.substring(line.indexOf('] ') + 2);
                else if (isUnchecked) todoText = line.substring(line.indexOf('] ') + 2);
                else todoText = line.substring(line.indexOf('-') + 1).trim();

                const todoItem = document.createElement('div');
                todoItem.className = 'flex items-center gap-2 my-1 pg-todo-item group';
                todoItem.innerHTML = `
                    <input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-skt-blue focus:ring-skt-blue-light pg-todo-checkbox" ${isChecked ? 'checked' : ''}>
                    <input type="text" class="flex-grow bg-transparent border-b border-gray-200 focus:outline-none focus:border-skt-blue pg-todo-text" value="${_escapeHtml(todoText)}">
                    <button type="button" class="text-gray-400 hover:text-red-500 pg-todo-delete-btn opacity-0 group-hover:opacity-100 transition-opacity" title="Löschen"><i class="fas fa-times"></i></button>
                `;
                container.appendChild(todoItem);
                todoItem.querySelector('.pg-todo-delete-btn').addEventListener('click', () => todoItem.remove());
            } else { // It's a heading or an empty line
                const otherItem = document.createElement('div');
                if (line.trim() === '') {
                    otherItem.className = 'py-1 pg-empty-line';
                    otherItem.innerHTML = '&nbsp;'; // Keep empty lines for spacing
                    container.appendChild(otherItem);
                } else {
                    // KORREKTUR: Überschriften sind jetzt editierbare Input-Felder
                    otherItem.className = 'py-1 pg-heading-item group';
                    otherItem.innerHTML = `
                        <input type="text" class="w-full bg-transparent font-bold text-skt-blue mt-2 border-b border-transparent focus:outline-none focus:border-skt-blue pg-heading-text" value="${_escapeHtml(line)}">
                    `;
                    container.appendChild(otherItem);
                }
            }
        });

        // Add a button to add new todos
        const addTodoBtn = document.createElement('button');
        addTodoBtn.type = 'button';
        addTodoBtn.className = 'mt-2 text-skt-blue hover:underline text-sm';
        addTodoBtn.innerHTML = '<i class="fas fa-plus mr-1"></i> Aufgabe hinzufügen';
        addTodoBtn.addEventListener('click', () => {
            const todoItem = document.createElement('div');
            todoItem.className = 'flex items-center gap-2 my-1 pg-todo-item group';
            todoItem.innerHTML = `
                <input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-skt-blue focus:ring-skt-blue-light pg-todo-checkbox">
                <input type="text" class="flex-grow bg-transparent border-b border-gray-200 focus:outline-none focus:border-skt-blue pg-todo-text" value="">
                <button type="button" class="text-gray-400 hover:text-red-500 pg-todo-delete-btn opacity-0 group-hover:opacity-100 transition-opacity" title="Löschen"><i class="fas fa-times"></i></button>
            `;
            container.insertBefore(todoItem, addTodoBtn);
            todoItem.querySelector('.pg-todo-delete-btn').addEventListener('click', () => todoItem.remove());
            todoItem.querySelector('.pg-todo-text').focus();
        });
        container.appendChild(addTodoBtn);
    }
 
    // NEU: Serialisiert die interaktive To-Do-Liste zurück in einen Text-String
    _serializeAufgaben() {
        const container = this.form.querySelector('#pg-aufgaben-container');
        const lines = [];
        Array.from(container.children).forEach(child => {
            if (child.classList.contains('pg-todo-item')) {
                const checkbox = child.querySelector('.pg-todo-checkbox');
                const textInput = child.querySelector('.pg-todo-text');
                const marker = checkbox.checked ? '- [x]' : '- [ ]';
                lines.push(`${marker} ${textInput.value}`);
            } else if (child.classList.contains('pg-heading-item')) {
                const textInput = child.querySelector('.pg-heading-text');
                lines.push(textInput.value);
            } else if (child.classList.contains('pg-empty-line')) {
                lines.push('');
            }
            // Ignore the button container
        });
        return lines.join('\n');
    }
}

async function loadAndInitPGTagebuchView() {
    const container = dom.pgTagebuchView;
    try {
        const response = await fetch("./pg-tagebuch.html");
        if (!response.ok) throw new Error(`Die Datei 'pg-tagebuch.html' konnte nicht gefunden werden.`);
        container.innerHTML = await response.text();
        if (!pgTagebuchViewInstance) pgTagebuchViewInstance = new PGTagebuchView();
        await pgTagebuchViewInstance.init(authenticatedUserData._id);
        // NEU: Prüfe, ob ein bestimmtes PG geöffnet werden soll.
        if (pendingPgIdToOpen) {
            pgTagebuchViewInstance.renderEditor(pendingPgIdToOpen);
            pendingPgIdToOpen = null; // Variable zurücksetzen
        }
    } catch (error) {
        console.error("Fehler beim Laden der PG-Tagebuch-Ansicht:", error);
    }
}

async function addOrUpdatePgEntry(rowId, rowDataWithKeys) {
    const tableName = 'PG';
    const linkColumnNames = ['Leiter', 'Mitarbeiter'];

    if (rowId) { // Update-Logik
        pgLog(`[UPDATE-PG] Aktualisiere PG-Eintrag mit ID: ${rowId}`);
        const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
        const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));
        const tableMeta = METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());

        const fileColumnsData = {};
        const otherColumnsData = {};

        // 1. Trenne Dateispalten von anderen Spalten
        for (const key in rowDataWithKeys) {
            if (!Object.prototype.hasOwnProperty.call(rowDataWithKeys, key)) continue;
            const colMeta = tableMeta.columns.find(c => c.key === key);
            const colName = reversedMap[key];
            if (colMeta && colMeta.type === 'file' && colName) {
                fileColumnsData[colName] = rowDataWithKeys[key];
            } else {
                otherColumnsData[key] = rowDataWithKeys[key];
            }
        }

        let allUpdatesSucceeded = true;

        // 2. Aktualisiere Nicht-Datei-Spalten (und Verknüpfungen) mit der SQL-Logik
        for (const key in otherColumnsData) {
            if (!Object.prototype.hasOwnProperty.call(otherColumnsData, key)) continue;
            const value = otherColumnsData[key];
            const colName = reversedMap[key];
            if (!colName || colName === '_id') continue;

            if (linkColumnNames.includes(colName)) {
                const linkRowId = value && value[0] ? value[0] : null;
                if (!(await updateSingleLink(tableName, rowId, colName, linkRowId ? [linkRowId] : []))) { allUpdatesSucceeded = false; break; }
            } else {
                const colMeta = tableMeta.columns.find(c => c.key === key);
                let formattedValue;
                if (value === null || value === undefined || value === '') { formattedValue = "NULL"; }
                else if (colMeta && (colMeta.type === 'number' || colMeta.type === 'duration')) { const numValue = parseFloat(value); formattedValue = isNaN(numValue) ? "NULL" : numValue; }
                else if (typeof value === 'boolean') { formattedValue = value ? "true" : "false"; }
                else { formattedValue = `'${escapeSql(String(value))}'`; }
                
                const sql = `UPDATE \`${tableName}\` SET \`${colName}\` = ${formattedValue} WHERE \`_id\` = '${rowId}'`;
                if (await seaTableSqlQuery(sql, false) === null) { allUpdatesSucceeded = false; break; }
            }
        }

        if (!allUpdatesSucceeded) {
            pgLog(`[UPDATE-PG] Fehler beim Aktualisieren von Nicht-Datei-Spalten. Breche ab.`);
            return false;
        }

        // 3. Aktualisiere Dateispalten mit einem separaten REST-API-Aufruf
        if (Object.keys(fileColumnsData).length > 0) {
            pgLog(`[UPDATE-PG] Aktualisiere Dateispalten via REST API:`, fileColumnsData);
            const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/`;
            const body = { table_name: tableName, row_id: rowId, row: fileColumnsData };
            const response = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${seaTableAccessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!response.ok) {
                console.error('[UPDATE-PG] Fehler beim Aktualisieren der Dateispalten:', await response.text());
                allUpdatesSucceeded = false;
            }
        }

        return allUpdatesSucceeded;

    } else { // Add-Logik, die Verknüpfungen korrekt behandelt
        pgLog(`[ADD-PG] Erstelle neuen PG-Eintrag.`);
        // Wir verwenden die generische Funktion, die zuerst die Zeile erstellt und dann die Links setzt.
        return await genericAddRowWithLinks(tableName, rowDataWithKeys, linkColumnNames);
    }
}

function parseDurationToMinutes(durationString) {
    if (!durationString || !durationString.includes(':')) return 0;
    const parts = durationString.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return (hours * 60) + minutes;
}

function formatMinutesToDuration(totalMinutes) {
    if (isNaN(totalMinutes) || totalMinutes < 0) return '0:00';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

async function seaTableUpdateCheckinRow(rowId, rowData) {
    const tableName = 'Checkin';
    const checkinLog = (message, ...data) => console.log(`%c[Checkin-Update] %c${message}`, 'color: #1abc9c; font-weight: bold;', 'color: black;', ...data);
    checkinLog(`Starte Update für Checkin ID: ${rowId}`);

    const tableMap = COLUMN_MAPS.checkin;
    if (!tableMap) {
        checkinLog('!!! FEHLER: Spalten-Map für Checkin nicht gefunden.');
        return false;
    }
    const tableMeta = METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
    if (!tableMeta) {
        checkinLog('!!! FEHLER: Metadaten für Checkin nicht gefunden.');
        return false;
    }
    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));

    // KORREKTUR: Zurück zum bewährten SQL-Update-Ansatz, der in anderen Teilen der App (z.B. Termine) zuverlässig funktioniert.
    // Dies bündelt alle Datenänderungen in einer einzigen Anfrage und vermeidet Rate-Limiting.
    const dataUpdates = {};
    const linkUpdates = {};
    const linkColumnKeys = [tableMap.Mitarbeiter].filter(Boolean);

    for (const key in rowData) {
        if (!Object.prototype.hasOwnProperty.call(rowData, key)) continue;
        if (linkColumnKeys.includes(key)) {
            linkUpdates[key] = rowData[key];
        } else {
            dataUpdates[key] = rowData[key];
        }
    }
    checkinLog('Getrennte Daten für SQL-Update:', { dataUpdates, linkUpdates });

    // 1. Aktualisiere Nicht-Link-Daten mit einer einzigen SQL-Abfrage
    const setClauses = [];
    for (const key in dataUpdates) {
        const value = dataUpdates[key];
        const colName = reversedMap[key];
        if (!colName || colName === '_id') continue;

        const colMeta = tableMeta.columns.find(c => c.key === key);
        let formattedValue;

        // Explizite Behandlung für die verschiedenen Feldtypen, um die Logik zu vereinheitlichen.
        if (value === null || value === undefined) {
            formattedValue = "NULL";
        } else if (key === tableMap.Stimmung) {
            // 'Stimmung' wird immer als Zahl behandelt.
            const numValue = parseFloat(value);
            formattedValue = isNaN(numValue) ? "NULL" : numValue;
        } else {
            // Alle anderen Felder (Motivation, Todos, und die 'x'-Felder) werden als Text behandelt.
            // Ein leerer String wird als leerer String gespeichert, nicht als NULL.
            formattedValue = `'${escapeSql(String(value))}'`;
        }
        setClauses.push(`\`${colName}\` = ${formattedValue}`);
    }

    if (setClauses.length > 0) {
        const sql = `UPDATE \`${tableName}\` SET ${setClauses.join(', ')} WHERE \`_id\` = '${rowId}'`;
        checkinLog('Führe SQL-Update für Datenfelder aus:', sql);
        const result = await seaTableSqlQuery(sql, false);
        if (result === null) {
            checkinLog('!!! FEHLER: SQL-Update fehlgeschlagen.');
            return false;
        }
        checkinLog('SQL-Update erfolgreich.');
    }

    // 2. Aktualisiere Link-Daten separat am Ende
    for (const key in linkUpdates) {
        const colName = reversedMap[key];
        const linkRowId = linkUpdates[key] && linkUpdates[key][0] ? linkUpdates[key][0] : null;
        if (!(await updateSingleLink(tableName, rowId, colName, linkRowId ? [linkRowId] : []))) {
            checkinLog(`!!! FEHLER: Update für Link-Feld '${colName}' fehlgeschlagen.`);
            return false;
        }
    }

    checkinLog(`Update für Checkin ID ${rowId} erfolgreich abgeschlossen.`);
    return rowId;
}

async function addOrUpdateCheckinEntry(rowId, rowDataWithKeys) {
    const tableName = 'Checkin';
    const checkinLog = (message, ...data) => console.log(`%c[Checkin-Save] %c${message}`, 'color: #1abc9c; font-weight: bold;', 'color: black;', ...data);

    if (!seaTableAccessToken || !apiGatewayUrl) {
        checkinLog('!!! FEHLER: Kein Access Token oder Gateway URL vorhanden.');
        return false;
    }

    if (rowId) {
        checkinLog(`Aktualisiere Checkin-Eintrag mit ID: ${rowId}`, JSON.parse(JSON.stringify(rowDataWithKeys)));
        // KORREKTUR: Die Update-Logik wird direkt hier implementiert, um Fehlerquellen zu minimieren
        // und sicherzustellen, dass alle Felder in einer einzigen Transaktion aktualisiert werden.
        const tableMap = COLUMN_MAPS.checkin;
        if (!tableMap) { checkinLog('!!! FEHLER: Spalten-Map für Checkin nicht gefunden.'); return false; }
        const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));

        const setClauses = [];
        for (const key in rowDataWithKeys) {
            if (!Object.prototype.hasOwnProperty.call(rowDataWithKeys, key)) continue;
            
            // Link-Spalten werden beim Bearbeiten nicht geändert und hier übersprungen.
            if (key === tableMap.Mitarbeiter) continue;

            const value = rowDataWithKeys[key];
            const colName = reversedMap[key];
            if (!colName || colName === '_id') continue;

            let formattedValue;
            if (value === null || value === undefined) {
                formattedValue = "NULL";
            } else if (key === tableMap.Stimmung) {
                const numValue = parseFloat(value);
                formattedValue = isNaN(numValue) ? "NULL" : numValue;
            } else {
                // Alle anderen Felder (Motivation, Todos, und die 'x'-Checkboxen) werden als Text behandelt.
                formattedValue = `'${escapeSql(String(value))}'`;
            }
            setClauses.push(`\`${colName}\` = ${formattedValue}`);
        }

        if (setClauses.length > 0) {
            const sql = `UPDATE \`${tableName}\` SET ${setClauses.join(', ')} WHERE \`_id\` = '${rowId}'`;
            checkinLog('Führe SQL-Update aus:', sql);
            const result = await seaTableSqlQuery(sql, false);
            if (result === null) {
                checkinLog('!!! FEHLER: SQL-Update fehlgeschlagen.');
                return false;
            }
        }
        checkinLog(`Update für Checkin ID ${rowId} erfolgreich abgeschlossen.`);
        return true;

    } else {
        checkinLog(`Erstelle neuen Checkin-Eintrag mit Daten:`, JSON.parse(JSON.stringify(rowDataWithKeys)));
        // The generic function is robust for creating new rows with links.
        // The only link column for a check-in is 'Mitarbeiter'.
        return await genericAddRowWithLinks(tableName, rowDataWithKeys, ['Mitarbeiter']);
    }
}
async function openCheckinModal(isEditMode = false) {
    const modal = document.getElementById('checkin-modal');
    const form = document.getElementById('checkin-form');
    const matrixContainer = document.getElementById('checkin-matrix-container');
    const stimmungSlider = document.getElementById('checkin-stimmung');
    const stimmungValue = document.getElementById('checkin-stimmung-value');
    const todosContainer = document.getElementById('checkin-todos-container');

    // KORREKTUR: Setze den Speicher-Button zurück, falls er vom letzten Speichervorgang noch im "Laden"-Zustand ist.
    const saveBtn = document.getElementById('save-checkin-btn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Check-in abschließen';
    }

    if (!modal || !form || !matrixContainer || !stimmungSlider || !stimmungValue) {
        console.error('Check-in Modal-Elemente nicht gefunden.');
        // Fallback: Dashboard normal laden, um den Benutzer nicht zu blockieren.
        await proceedToDashboard(authenticatedUserData._id);
        return;
    }

    const checkinLog = (message, ...data) => console.log(`%c[Checkin-Modal] %c${message}`, 'color: #1abc9c; font-weight: bold;', 'color: black;', ...data);
    checkinLog(`Modal wird geöffnet. isEditMode: ${isEditMode}`);

    // NEU: Daten für den Bearbeitungsmodus abrufen
    const todayString = new Date().toISOString().split('T')[0];
    // KORREKTUR: Die Unterscheidung zwischen Leiter- und Team-Check-in wird jetzt über das 'Stimmung'-Feld getroffen.
    // Ein Haupteintrag hat immer eine Stimmung, ein reiner Matrix-Eintrag für ein Teammitglied nicht.
    const leaderCheckin = isEditMode ? db.checkin.find(c => 
        c.Mitarbeiter === authenticatedUserData._id && 
        c.Datum && c.Datum.startsWith(todayString) && 
        (c.Stimmung !== undefined && c.Stimmung !== null) // Haupteintrag hat eine Stimmung
    ) : null;
    checkinLog('Heutiger Check-in des Leiters:', leaderCheckin);

    const teamCheckins = isEditMode ? db.checkin.filter(c => 
        getSubordinates(authenticatedUserData._id, 'gruppe').map(u => u._id).includes(c.Mitarbeiter) && 
        c.Datum && c.Datum.startsWith(todayString) && 
        (c.Stimmung === undefined || c.Stimmung === null) // Team-Eintrag hat keine Stimmung
    ) : [];
    const teamCheckinsById = _.keyBy(teamCheckins, 'Mitarbeiter');
    checkinLog(`Heutige Check-ins des Teams (${teamCheckins.length} gefunden):`, JSON.parse(JSON.stringify(teamCheckins)));
    checkinLog('Team Check-ins nach ID:', JSON.parse(JSON.stringify(teamCheckinsById)));

    // 1. Allgemeine Felder vorbereiten
    form.reset();
    document.getElementById('checkin-motivation').value = leaderCheckin?.Motivation || '';
    stimmungSlider.value = leaderCheckin?.Stimmung || 5;
    stimmungSlider.dispatchEvent(new Event('input')); // Slider-UI aktualisieren

    // 2. To-Do-Liste initialisieren
    const renderCheckinTodos = (text) => {
        todosContainer.innerHTML = '';
        const lines = text.split('\n');
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('-')) {
                const todoItem = document.createElement('div');
                todoItem.className = 'flex items-center gap-2 my-1 pg-todo-item group';
                todoItem.innerHTML = `
                    <input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-skt-blue focus:ring-skt-blue-light pg-todo-checkbox" disabled>
                    <input type="text" class="flex-grow bg-transparent border-b border-gray-200 focus:outline-none focus:border-skt-blue pg-todo-text" value="${_escapeHtml(line.substring(1).trim())}">
                    <button type="button" class="text-gray-400 hover:text-red-500 pg-todo-delete-btn opacity-0 group-hover:opacity-100 transition-opacity" title="Löschen"><i class="fas fa-times"></i></button>
                `;
                todosContainer.appendChild(todoItem);
                todoItem.querySelector('.pg-todo-delete-btn').addEventListener('click', () => todoItem.remove());
            } else {
                const otherItem = document.createElement('div');
                otherItem.className = 'py-1 pg-heading-item group';
                otherItem.innerHTML = `<input type="text" class="w-full bg-transparent font-bold text-skt-blue mt-2 border-b border-transparent focus:outline-none focus:border-skt-blue pg-heading-text" value="${_escapeHtml(line)}">`;
                todosContainer.appendChild(otherItem);
            }
        });
        const addTodoBtn = document.createElement('button');
        addTodoBtn.type = 'button';
        addTodoBtn.className = 'mt-2 text-skt-blue hover:underline text-sm';
        addTodoBtn.innerHTML = '<i class="fas fa-plus mr-1"></i> Aufgabe hinzufügen';
        addTodoBtn.addEventListener('click', () => {
            const todoItem = document.createElement('div');
            todoItem.className = 'flex items-center gap-2 my-1 pg-todo-item group';
            todoItem.innerHTML = `
                <input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-skt-blue focus:ring-skt-blue-light pg-todo-checkbox" disabled>
                <input type="text" class="flex-grow bg-transparent border-b border-gray-200 focus:outline-none focus:border-skt-blue pg-todo-text" value="">
                <button type="button" class="text-gray-400 hover:text-red-500 pg-todo-delete-btn opacity-0 group-hover:opacity-100 transition-opacity" title="Löschen"><i class="fas fa-times"></i></button>
            `;
            todosContainer.insertBefore(todoItem, addTodoBtn);
            todoItem.querySelector('.pg-todo-delete-btn').addEventListener('click', () => todoItem.remove());
            todoItem.querySelector('.pg-todo-text').focus();
        });
        todosContainer.appendChild(addTodoBtn);
    };
    renderCheckinTodos(leaderCheckin?.Todos || "Top 3 To-Dos:\n- \n- \n- ");

    // 3. Stimmungs-Slider-Listener
    stimmungSlider.addEventListener('input', () => {
        const percent = (stimmungSlider.value - stimmungSlider.min) / (stimmungSlider.max - stimmungSlider.min);
        stimmungValue.textContent = stimmungSlider.value;
        stimmungValue.style.left = `calc(${percent * 100}% + (${8 - percent * 16}px))`;
    });

    // 4. Team-Matrix erstellen
    matrixContainer.innerHTML = '<div class="loader mx-auto"></div>';
    // KORREKTUR: Füge den Leiter selbst zur Liste hinzu, damit er auch seine eigenen Punkte abhaken kann.
    const subordinates = getSubordinates(authenticatedUserData._id, 'gruppe');
    const teamForMatrix = [authenticatedUserData, ...subordinates];
    if (teamForMatrix.length === 0) {
        matrixContainer.innerHTML = '<p class="text-center text-gray-500">Du hast keine Teammitglieder für den Check-in.</p>';
    } else {
        const questions = [
            { label: 'Termine eingetragen?', key: 'TermineEingetragen' },
            { label: 'Positiver Kontakt?', key: 'PositiverKontakt' },
            { label: 'An Zielen dran?', key: 'ZieleDran' },
            { label: 'Seminar anwesend?', key: 'SeminarAnwesend' },
            { label: 'Recruiting Termine?', key: 'RecruitingTermine' },
            { label: 'Akt. Erfolge?', key: 'AktuelleErfolge' },
            { label: 'PG-Todos erledigt?', key: 'TodosErledigt' }
        ];

        const table = document.createElement('table');
        table.className = 'w-full border-collapse';
        
        const thead = document.createElement('thead');
        let headerHtml = '<tr class="bg-skt-grey-light"><th class="p-2 text-left font-semibold text-skt-blue">Mitarbeiter</th>';
        questions.forEach(q => {
            headerHtml += `<th class="p-2 text-center font-semibold text-skt-blue text-xs whitespace-nowrap">${q.label}</th>`;
        });
        headerHtml += '</tr>';
        thead.innerHTML = headerHtml;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        teamForMatrix.forEach(ma => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-200 checkin-matrix-row';
            tr.dataset.mitarbeiterId = ma._id;

            const isLeaderRow = ma._id === authenticatedUserData._id;
            const existingCheckinForMA = isLeaderRow ? leaderCheckin : teamCheckinsById[ma._id];

            let rowHtml = `<td class="p-3 font-bold text-skt-blue">${ma.Name}</td>`;
            questions.forEach(q => {
                const isChecked = existingCheckinForMA && existingCheckinForMA[q.key] === 'x';
                rowHtml += `<td class="p-2 text-center">
                                <div class="custom-checkbox inline-block ${isChecked ? 'checked' : ''}">
                                    <input type="checkbox" data-key="${q.key}" class="hidden" ${isChecked ? 'checked' : ''}>
                                    <div class="custom-checkbox-tick"></div>
                                </div>
                            </td>`;
            });
            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        matrixContainer.innerHTML = '';
        matrixContainer.appendChild(table);

        matrixContainer.querySelectorAll('.custom-checkbox').forEach(box => {
            box.addEventListener('click', () => {
                box.classList.toggle('checked');
                const input = box.querySelector('input');
                input.checked = !input.checked;
            });
        });
    }

    // 5. Formular-Submit-Handler
    form.onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('save-checkin-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<div class="loader-small mx-auto"></div>';

        const serializeTodos = () => { // This function is defined here to have access to `todosContainer`
            const lines = [];
            Array.from(todosContainer.children).forEach(child => {
                if (child.classList.contains('pg-todo-item')) {
                    const textInput = child.querySelector('.pg-todo-text');
                    if (textInput) {
                        lines.push(`- ${textInput.value}`);
                    }
                } else if (child.classList.contains('pg-heading-item')) {
                    const textInput = child.querySelector('.pg-heading-text');
                    if (textInput) lines.push(textInput.value);
                } else if (child.classList.contains('pg-empty-line')) {
                    lines.push('');
                }
            });
            return lines.join('\n');
        };

        const dateString = new Date().toISOString().split('T')[0];
        const leiterId = authenticatedUserData._id;
        const motivation = document.getElementById('checkin-motivation').value;
        const stimmung = parseInt(document.getElementById('checkin-stimmung').value, 10);
        const todos = serializeTodos();

        // Prepare leader's full entry
        const leaderEntryData = {
            [COLUMN_MAPS.checkin.Datum]: dateString, // KORREKTUR: 'Leiter' gibt es nicht, es ist ein 'Mitarbeiter'-Link zum Leiter selbst
            [COLUMN_MAPS.checkin.Mitarbeiter]: [leiterId],
            [COLUMN_MAPS.checkin.Motivation]: motivation,
            [COLUMN_MAPS.checkin.Stimmung]: stimmung,
            [COLUMN_MAPS.checkin.Todos]: todos,
        };

        const entriesToSave = [];

        // Matrix entries for each person (including leader)
        document.querySelectorAll('.checkin-matrix-row').forEach(row => {
            const mitarbeiterId = row.dataset.mitarbeiterId;
            checkinLog(`Verarbeite Matrix-Zeile für Mitarbeiter-ID: ${mitarbeiterId}`);
            const matrixBooleans = {};
            row.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                const key = COLUMN_MAPS.checkin[checkbox.dataset.key];
                matrixBooleans[key] = checkbox.checked ? 'x' : '';
            });
            checkinLog(`Gelesene Checkbox-Daten für ${mitarbeiterId}:`, matrixBooleans);

            if (mitarbeiterId === leiterId) {
                // Dies ist die Zeile des Leiters, füge die Boolean-Werte zum Haupteintrag hinzu.
                Object.assign(leaderEntryData, matrixBooleans);
            } else {
                // Dies ist ein unterstellter Mitarbeiter, erstelle einen separaten Eintrag.
                const subordinateCheckin = teamCheckinsById[mitarbeiterId];
                const subordinateRowId = subordinateCheckin ? subordinateCheckin._id : null;
                const matrixEntry = {
                    rowId: subordinateRowId,
                    data: {
                        [COLUMN_MAPS.checkin.Datum]: dateString,
                        [COLUMN_MAPS.checkin.Mitarbeiter]: [mitarbeiterId],
                        ...matrixBooleans
                    }
                };
                entriesToSave.push(matrixEntry);
            }
        });

        // Add the fully prepared leader entry to the list of entries to save
        const leaderRowId = leaderCheckin ? leaderCheckin._id : null;
        entriesToSave.unshift({ rowId: leaderRowId, data: leaderEntryData }); // Add to the beginning

        checkinLog(`Bereite Speicherung von ${entriesToSave.length} Check-in Einträgen vor...`, JSON.parse(JSON.stringify(entriesToSave)));

        // Sequentially save all entries
        let allSuccess = true;
        for (const entry of entriesToSave) {
            const result = await addOrUpdateCheckinEntry(entry.rowId, entry.data);
            if (!result) {
                allSuccess = false;
                checkinLog(`!!! FEHLER beim Speichern des Eintrags für rowId ${entry.rowId || 'NEU'}. Breche ab.`);
                break; // Stop on first error
            }
        }

        if (allSuccess) {
            localStorage.setItem(`lastCheckin-${leiterId}`, dateString);
            
            // NEU: Lade Checkin-Daten neu, damit der "Bearbeiten"-Button sofort erscheint.
            console.log('[Checkin-Save] Lade Checkin-Daten neu, um die Ansicht zu aktualisieren...');
            localStorage.removeItem(CACHE_PREFIX + 'checkin');
            db.checkin = await seaTableQuery('Checkin');
            normalizeAllData();
            console.log('[Checkin-Save] Checkin-Daten erfolgreich neu geladen.');

            modal.classList.remove('visible');
            document.body.classList.remove('modal-open');
            document.documentElement.classList.remove('modal-open'); // KORREKTUR: Auch vom HTML-Element entfernen

            // KORREKTUR: Leite zur korrekten Ansicht zurück (Stimmungsdashboard oder Haupt-Dashboard).
            if (currentView === 'stimmungs-dashboard') {
                // Wenn wir vom Stimmungsdashboard kamen, dorthin zurückkehren.
                switchView('stimmungs-dashboard'); // Dies lädt die Ansicht mit den neuen Daten neu.
            } else {
                // Standardverhalten: Zum Haupt-Dashboard gehen.
                await proceedToDashboard(leiterId);
            }
        } else {
            alert('Fehler beim Speichern des Check-ins.');
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Check-in abschließen';
        }
    };

    // 6. Modal anzeigen
    modal.classList.add('visible');
    document.body.classList.add('modal-open');
}



// --- User Data Editing Modal ---
function openEditUserModal() {
    const user = currentlyViewedUserData;
    // Populate standard fields
    document.getElementById('edit-name').value = user.Name || '';
    document.getElementById('edit-pwd').value = user.PWD || '';
    document.getElementById('edit-eh-quote').value = user.EHproATQuote || 0;
    document.getElementById('edit-start-date').value = user.Startdatum?.split('T')[0] || '';
    document.getElementById('edit-birthday').value = user.Geburtstag?.split('T')[0] || '';
    document.getElementById('edit-promotion-date').value = user.Befoerderungsdatum?.split('T')[0] || '';

    // Handle ausscheiden logic
    const ausgeschiedenCheckbox = document.getElementById('edit-ausgeschieden');
    const ausscheideFieldsContainer = document.getElementById('ausscheide-fields-container');
    
    // KORREKTUR: Explizite Prüfung auf `true`, da der Wert aus der DB ein Boolean ist.
    ausgeschiedenCheckbox.checked = user.Status === 'Ausgeschieden' || user.Ausgeschieden === true;
    document.getElementById('edit-ausscheidetag').value = user.Ausscheidetag?.split('T')[0] || '';
    document.getElementById('edit-ausscheidegrund').value = user.Ausscheidegrund || '';

    ausscheideFieldsContainer.classList.toggle('hidden', !ausgeschiedenCheckbox.checked);

    // Add event listener to toggle visibility
    ausgeschiedenCheckbox.addEventListener('change', (e) => {
        ausscheideFieldsContainer.classList.toggle('hidden', !e.target.checked);
    });

    // NEU: Handle Check-in logic
    const checkinContainer = document.getElementById('edit-checkin-container');
    const checkinCheckbox = document.getElementById('edit-checkin-enabled');
    
    // Checkbox nur für Führungskräfte anzeigen und den Status des bearbeiteten Benutzers setzen
    if (isUserLeader(authenticatedUserData)) {
        checkinContainer.classList.remove('hidden');
        checkinContainer.classList.add('flex');
        checkinCheckbox.checked = user.Checkin === true;
    } else {
        checkinContainer.classList.add('hidden');
        checkinContainer.classList.remove('flex');
    }

    dom.editUserModal.classList.add('visible');
    document.body.classList.add('modal-open');
}

function closeEditUserModal() {
  dom.editUserModal.classList.remove("visible");
  document.body.classList.remove("modal-open");
}

async function saveUserData() {
  dom.saveUserBtn.textContent = "Speichern...";
  dom.saveUserBtn.disabled = true;
  const user = currentlyViewedUserData;

  const isAusgeschieden = document.getElementById('edit-ausgeschieden').checked;
  const ausscheidetag = document.getElementById('edit-ausscheidetag').value;
  const ausscheidegrund = document.getElementById('edit-ausscheidegrund').value;

  if (isAusgeschieden && (!ausscheidetag || !ausscheidegrund)) {
      alert('Wenn ein Mitarbeiter ausgeschieden ist, müssen Ausscheidedatum und -grund angegeben werden.');
      dom.saveUserBtn.textContent = "Speichern";
      dom.saveUserBtn.disabled = false;
      return;
  }

  const dataToUpdate = {
      Name: document.getElementById('edit-name').value,
      // NEU: Passwort auf 'byebye' setzen, wenn der Mitarbeiter ausgeschieden ist.
      PWD: isAusgeschieden ? 'byebye' : document.getElementById('edit-pwd').value,
      EHproATQuote: parseFloat(document.getElementById('edit-eh-quote').value) || 0,
      Startdatum: document.getElementById('edit-start-date').value || null,
      Geburtstag: document.getElementById('edit-birthday').value || null,
      Befoerderungsdatum: document.getElementById('edit-promotion-date').value || null,
      Ausgeschieden: isAusgeschieden,
      Ausscheidetag: isAusgeschieden ? ausscheidetag : null,
      Ausscheidegrund: isAusgeschieden ? ausscheidegrund : null,
  };

  // NEU: Check-in Status nur hinzufügen, wenn die Checkbox sichtbar war (d.h. von einer FK bearbeitet)
  const checkinContainer = document.getElementById('edit-checkin-container');
  if (checkinContainer && !checkinContainer.classList.contains('hidden')) {
      // Annahme: Die Spalte in der DB heißt 'Checkin' und ist vom Typ Boolean (Checkbox).
      dataToUpdate.Checkin = document.getElementById('edit-checkin-enabled').checked;
  }

  const mitarbeiterTableMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'mitarbeiter');
  const setClauses = [];

  for (const keyName in dataToUpdate) {
      const value = dataToUpdate[keyName];
      const colKey = COLUMN_MAPS.mitarbeiter[keyName];
      if (!colKey) continue;
      const colMeta = mitarbeiterTableMeta.columns.find(c => c.key === colKey);
      if (!colMeta) continue;

      const colName = colMeta.name;
      let formattedValue;
      if (value === null || value === undefined) formattedValue = "NULL";
      else if (colMeta.type === 'number') formattedValue = parseFloat(value) || 0;
      else if (colMeta.type === 'checkbox') formattedValue = value ? "true" : "false";
      else formattedValue = `'${escapeSql(String(value))}'`;
      
      setClauses.push(`\`${colName}\` = ${formattedValue}`);
  }

  // NEU: Status explizit und separat behandeln, um Fehler zu isolieren und zu loggen.
  const statusColName = 'Status'; // Annahme: Spaltenname ist 'Status'
  if (COLUMN_MAPS.mitarbeiter[statusColName]) {
      const statusValue = isAusgeschieden ? 'Ausgeschieden' : 'Aktiv';
      console.log(`[SAVE-USER] Status-Update: Setze '${statusColName}' auf '${statusValue}'.`);
      setClauses.push(`\`${statusColName}\` = '${escapeSql(statusValue)}'`);
  } else {
      console.error(`[SAVE-USER] Fehler: Die Spalte '${statusColName}' wurde in den COLUMN_MAPS nicht gefunden. Status wird nicht aktualisiert.`);
  }

  const sql = `UPDATE \`Mitarbeiter\` SET ${setClauses.join(', ')} WHERE \`_id\` = '${user._id}'`;
  console.log(`[SAVE-USER] Führe SQL-Update aus: ${sql}`);
  const result = await seaTableSqlQuery(sql, false);

  if (result !== null) {
    closeEditUserModal();
    setStatus("Daten werden neu geladen...");
    localStorage.removeItem(CACHE_PREFIX + 'mitarbeiter');
    await loadAllData();
    await fetchAndRenderDashboard(user._id);
  }

  dom.saveUserBtn.textContent = "Speichern";
  dom.saveUserBtn.disabled = false;
}

async function addUserToDatabase(tableName, rowData) {
    console.log("[ADD-USER-DB] Starting add user to database process.");
    if (!seaTableAccessToken || !apiGatewayUrl) return false;

    const linkColumns = {
        Werber: COLUMN_MAPS.mitarbeiter.Werber,
        Karrierestufe: COLUMN_MAPS.mitarbeiter.Karrierestufe,
        Buero: COLUMN_MAPS.mitarbeiter.Buero
    };
    const linkData = {};
    const rowDataForCreation = { ...rowData };
    for (const name in linkColumns) {
        const colKey = linkColumns[name];
        if (Object.prototype.hasOwnProperty.call(rowDataForCreation, colKey)) {
            linkData[name] = rowDataForCreation[colKey]?.[0] || null;
            delete rowDataForCreation[colKey];
        }
    }

    const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));
    const rowDataWithNames = {};
    for (const key in rowDataForCreation) {
        const name = reversedMap[key];
        if (name) rowDataWithNames[name] = (rowDataForCreation[key] === undefined || rowDataForCreation[key] === '') ? null : rowDataForCreation[key];
    }

    let newRowId = null;
    try {
        const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/`;
        const body = { table_name: tableName, rows: [rowDataWithNames] };
        const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${seaTableAccessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const result = await response.json();
        if (!response.ok || !result.row_ids || result.row_ids.length === 0) throw new Error(`Create failed: ${result.error_message || 'No row ID returned'}`);
        newRowId = result.row_ids[0]?._id;
        if (!newRowId) throw new Error("Could not get new row ID");
    } catch (error) {
        console.error("[ADD-USER-DB] Step 1 FAILED:", error);
        return false;
    }

    for (const colName in linkData) {
        if (linkData[colName] && !(await updateSingleLink(tableName, newRowId, colName, [linkData[colName]]))) return false;
    }
    return true;
}

// --- Add New User Modal ---
function openAddUserModal() {
    dom.addUserForm.reset();
    const werberSelect = document.getElementById('add-werber');
    const bueroSelect = document.getElementById('add-buero');
    clearChildren(werberSelect);
    clearChildren(bueroSelect);

    // KORREKTUR: Werber-Auswahl auf die eigene Struktur begrenzen.
    const structureUsers = [authenticatedUserData, ...getAllSubordinatesRecursive(authenticatedUserData._id)];
    structureUsers.sort((a, b) => a.Name.localeCompare(b.Name));
    structureUsers.forEach(user => {
        werberSelect.add(new Option(user.Name, user._id));
    });

    if (db.bürostandorte) {
        const bueros = [...db.bürostandorte].sort((a, b) => (a.Büro || '').localeCompare(b.Büro || ''));
        bueros.forEach(buero => {
            // Annahme: Die Anzeigespalte in der "Bürostandorte"-Tabelle heißt "Büro".
            bueroSelect.add(new Option(buero.Büro, buero._id));
        });
    }

    dom.addUserModal.classList.add('visible');
    document.body.classList.add('modal-open');
}

function closeAddUserModal() {
    dom.addUserModal.classList.remove('visible');
    document.body.classList.remove('modal-open');
}

async function saveNewUser() {
    const saveBtn = dom.saveNewUserBtn;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Wird angelegt...';

    const traineeI = db.karriereplan.find(p => p.Stufe === 'Trainee I');
    if (!traineeI) {
        alert('Karrierestufe "Trainee I" nicht gefunden. Nutzer kann nicht angelegt werden.');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Nutzer anlegen';
        return;
    }

    if (!COLUMN_MAPS.mitarbeiter.Buero) {
        alert('Spalte "Buero" konnte in der Datenbank nicht gefunden werden. Bitte Konfiguration prüfen.');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Nutzer anlegen';
        return;
    }

    const startDate = findNextInfoDateAfter(new Date());

    const rowData = {
        [COLUMN_MAPS.mitarbeiter.Name]: document.getElementById('add-name').value,
        [COLUMN_MAPS.mitarbeiter.PWD]: document.getElementById('add-pwd').value,
        [COLUMN_MAPS.mitarbeiter.Geburtstag]: document.getElementById('add-birthday').value || null,
        [COLUMN_MAPS.mitarbeiter.Startdatum]: startDate.toISOString().split('T')[0],
        [COLUMN_MAPS.mitarbeiter.Werber]: [document.getElementById('add-werber').value],
        [COLUMN_MAPS.mitarbeiter.Buero]: [document.getElementById('add-buero').value],
        [COLUMN_MAPS.mitarbeiter.Karrierestufe]: [traineeI._id],
        [COLUMN_MAPS.mitarbeiter.Status]: 'Aktiv',
    };

    const success = await addUserToDatabase('Mitarbeiter', rowData);

    if (success) {
        saveBtn.textContent = 'Angelegt!';
        localStorage.removeItem(CACHE_PREFIX + 'mitarbeiter');
        await loadAllData();
        // Optional: Dropdown im Login-Screen aktualisieren
        // ...
        setTimeout(() => {
            closeAddUserModal();
            saveBtn.disabled = false;
            saveBtn.textContent = 'Nutzer anlegen';
        }, 1500);
    } else {
        alert('Fehler beim Anlegen des Nutzers.');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Nutzer anlegen';
    }
}

// --- Planning Modal Logic ---
function openPlanningModal(preselectOptions = null) {
    dom.planningForm.reset();
    const userSelect = document.getElementById('planning-user-select');
    const monthSelect = document.getElementById('planning-month-select');
    const yearInput = document.getElementById('planning-year-input');

    clearChildren(userSelect);
    clearChildren(monthSelect);

    const structureUsers = [authenticatedUserData, ...getAllSubordinatesRecursive(authenticatedUserData._id)];
    structureUsers.sort((a, b) => a.Name.localeCompare(b.Name));
    structureUsers.forEach(user => {
        userSelect.add(new Option(user.Name, user._id));
    });

    // NEU: Standardmäßig den aktuell angesehenen Mitarbeiter auswählen
    if (userSelect.querySelector(`[value="${currentlyViewedUserData._id}"]`)) userSelect.value = currentlyViewedUserData._id;

    const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    months.forEach((month) => {
        monthSelect.add(new Option(month, month));
    });

    if (preselectOptions) {
        userSelect.value = preselectOptions.userId;
        monthSelect.value = preselectOptions.monthName;
        yearInput.value = preselectOptions.year;
    } else {
        const today = getCurrentDate();
        monthSelect.value = months[today.getMonth()];
        yearInput.value = today.getFullYear();
        // NEU: Standardmäßig den aktuell angesehenen Mitarbeiter auswählen
        if (userSelect.querySelector(`[value="${currentlyViewedUserData._id}"]`)) userSelect.value = currentlyViewedUserData._id;
    }

    // Initial load for the first user in the list
    if (structureUsers.length > 0 || preselectOptions) {
        loadPlanningDataForSelection();
    }

    dom.planningModal.classList.add('visible');
    document.body.classList.add('modal-open');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('planning-user-select')?.addEventListener('change', loadPlanningDataForSelection);
    document.getElementById('planning-month-select')?.addEventListener('change', loadPlanningDataForSelection);
    document.getElementById('planning-year-input')?.addEventListener('change', loadPlanningDataForSelection);
});
function loadPlanningDataForSelection() {
    const userId = document.getElementById('planning-user-select').value;
    const monthName = document.getElementById('planning-month-select').value;
    const year = parseInt(document.getElementById('planning-year-input').value);
    const ehInput = document.getElementById('planning-eh-goal');
    const etInput = document.getElementById('planning-et-goal');
    const infoabendInput = document.getElementById('planning-infoabend-date'); // NEU

    // NEU: Immer das nächste Infoabend-Datum berechnen und im (deaktivierten) Feld anzeigen.
    const nextInfoDate = findNextInfoDateAfter(getCurrentDate());
    const nextInfoDateString = nextInfoDate.toISOString().split('T')[0];
    infoabendInput.value = nextInfoDateString;

    const infoPlan = db.infoplanung.find(p => p.Mitarbeiter_ID === userId && p.Informationsabend && p.Informationsabend.startsWith(nextInfoDateString));
    const existingPlan = db.monatsplanung.find(p =>
        p.Mitarbeiter_ID === userId &&
        p.Monat === monthName &&
        p.Jahr === year
    );

    ehInput.value = existingPlan?.EH_Ziel || 0;
    // KORREKTUR: Lade das ET-Ziel aus der Infoplanung, nicht aus der Monatsplanung
    etInput.value = infoPlan?.ET_Ziel || 0;
}

function closePlanningModal() {
    dom.planningModal.classList.remove('visible');
    document.body.classList.remove('modal-open');
}

async function savePlanningData() {
    dom.savePlanningBtn.disabled = true;
    dom.savePlanningBtn.textContent = 'Speichern...';

    const userId = document.getElementById('planning-user-select').value;
    const ehGoal = parseFloat(document.getElementById('planning-eh-goal').value) || 0;
    const etGoal = parseInt(document.getElementById('planning-et-goal').value) || 0;
    const monthName = document.getElementById('planning-month-select').value;
    const year = parseInt(document.getElementById('planning-year-input').value);
    const nextInfoDateIso = document.getElementById('planning-infoabend-date').value;

    const existingInfoPlan = db.infoplanung.find(p => p.Mitarbeiter_ID === userId && p.Informationsabend && p.Informationsabend.startsWith(nextInfoDateIso));
    const existingPlan = db.monatsplanung.find(p =>
        p.Mitarbeiter_ID === userId &&
        p.Monat === monthName &&
        p.Jahr === year
    );

    let infoPlanSuccess = false;
    if (existingInfoPlan) {
        const sql = `UPDATE \`Infoplanung\` SET \`ET_Ziel\` = ${etGoal} WHERE \`_id\` = '${existingInfoPlan._id}'`;
        infoPlanSuccess = await seaTableSqlQuery(sql, false) !== null;
    }
    // KORREKTUR: Wenn kein Info-Plan existiert, einen neuen anlegen.
    else {
        const infoPlanRowData = {
            [COLUMN_MAPS.infoplanung.Informationsabend]: nextInfoDateIso,
            [COLUMN_MAPS.infoplanung.ET_Ziel]: etGoal,
            [COLUMN_MAPS.infoplanung.Mitarbeiter_ID]: [userId],
        };
        infoPlanSuccess = await addPlanningRowToDatabase('Infoplanung', infoPlanRowData, 'Mitarbeiter_ID');
    }

    let success = false;
    if (existingPlan) {
        // Update existing plan
        // KORREKTUR: ET_Ziel wird nicht mehr in der Monatsplanung gespeichert.
        const sql = `UPDATE \`Monatsplanung\` SET \`EH_Ziel\` = ${ehGoal} WHERE \`_id\` = '${existingPlan._id}'`;
        const result = await seaTableSqlQuery(sql, false);
        success = result !== null;
    } else {
        // Create new plan
        const rowData = {
            [COLUMN_MAPS.monatsplanung.Monat]: monthName,
            [COLUMN_MAPS.monatsplanung.Jahr]: year,
            [COLUMN_MAPS.monatsplanung.EH_Ziel]: ehGoal,
            [COLUMN_MAPS.monatsplanung.Mitarbeiter_ID]: [userId],
        };
        success = await addPlanningRowToDatabase('Monatsplanung', rowData, 'Mitarbeiter_ID');
    }

    if (success && infoPlanSuccess) {
        localStorage.removeItem(CACHE_PREFIX + 'monatsplanung');
        localStorage.removeItem(CACHE_PREFIX + 'infoplanung'); // NEU: Auch Infoplanung-Cache leeren
        await loadAllData();
        await fetchAndRenderDashboard(currentlyViewedUserData._id);
        closePlanningModal();
    } else {
        alert('Fehler beim Speichern der Plandaten.');
    }

    dom.savePlanningBtn.disabled = false;
    dom.savePlanningBtn.textContent = 'Speichern';
}

async function addPlanningRowToDatabase(tableName, rowData, linkField) {
    const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));

    // Trenne die ID für die Verknüpfung von den restlichen Daten.
    const rowDataForCreation = { ...rowData };
    const linkId = rowDataForCreation[tableMap[linkField]]?.[0]; // Sicherer Zugriff
    if (linkId) {
        delete rowDataForCreation[tableMap[linkField]];
    }

    // Wandle die Spalten-Keys (z.B. '0000') in Spalten-Namen (z.B. 'Monat') um.
    const rowDataWithNames = {};
    for (const key in rowDataForCreation) {
        const name = reversedMap[key];
        if (name) rowDataWithNames[name] = (rowDataForCreation[key] === undefined || rowDataForCreation[key] === '') ? null : rowDataForCreation[key];
    }

    // Erstelle die neue Zeile und setze danach die Verknüpfung.
    const newRowId = await genericSeaTableAddRow(tableName, rowDataWithNames);
    if (!newRowId) return false;
    const success = await updateSingleLink(tableName, newRowId, linkField, [linkId]);
    return success;
}

// --- NEU: Zeitreise-Funktionen ---
function openTimeTravelModal() {
    const monthSelect = document.getElementById('time-travel-month-select');
    const yearSelect = document.getElementById('time-travel-year-select');
    clearChildren(monthSelect);
    clearChildren(yearSelect);

    const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    months.forEach((month, index) => {
        monthSelect.add(new Option(month, index));
    });

    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 2020; i--) {
        yearSelect.add(new Option(i, i));
    }

    const displayDate = getCurrentDate();
    monthSelect.value = displayDate.getMonth();
    yearSelect.value = displayDate.getFullYear();

    dom.timeTravelModal.classList.add('visible');
    document.body.classList.add('modal-open');
}

function closeTimeTravelModal() {
    dom.timeTravelModal.classList.remove('visible');
    document.body.classList.remove('modal-open');
}

function handleTimeTravelSubmit() {
    const month = document.getElementById('time-travel-month-select').value;
    const year = document.getElementById('time-travel-year-select').value;

    // Setze das Datum auf den 15. des Monats, um Zeitzonenprobleme zu vermeiden
    const newDate = new Date(year, month, 15);
    localStorage.setItem('timeTravelDate', newDate.toISOString());
    
    closeTimeTravelModal();
    location.reload();
}

function resetTimeTravel() {
    localStorage.removeItem('timeTravelDate');
    location.reload();
}
class WettbewerbView {
    constructor() {
        this.initialized = false;
        this.slideshowInterval = null;
        this.countdownInterval = null;
        this.currentSlide = 0;
    }

    _getDomElements() {
        this.slideshowContainer = document.getElementById('wettbewerb-slideshow-container');
        this.slideshowDots = document.getElementById('slideshow-dots');
        this.slideshowPrev = document.getElementById('slideshow-prev');
        this.slideshowNext = document.getElementById('slideshow-next');
        this.challengeSection = document.getElementById('wettbewerb-challenge-section');
        this.chartSection = document.getElementById('wettbewerb-chart-section');
        this.chartContainer = document.getElementById('challenge-chart-container');
        this.qualifiedList = document.getElementById('qualified-list');
        this.contenderList = document.getElementById('contender-list');
        return this.slideshowContainer && this.challengeSection && this.chartSection && this.qualifiedList && this.contenderList;
    }

    async init() {
        if (!this._getDomElements()) {
            console.error('[Wettbewerb] Benötigte DOM-Elemente nicht gefunden.');
            return;
        }
        this.setupSlideshow();
        this.setupCountdown();
        await this.fetchAndRender();
        this.initialized = true;
    }

    setupSlideshow() {
        this.images = [
            { src: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=2574&auto=format&fit=crop', alt: 'Paris, Frankreich' },
            { src: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2094&auto=format&fit=crop', alt: 'Tokio, Asien' },
            { src: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?q=80&w=2070&auto=format&fit=crop', alt: 'New York, Amerika' },
            { src: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?q=80&w=2072&auto=format&fit=crop', alt: 'Safari in Afrika' },
            { src: 'https://images.unsplash.com/photo-1513026705753-bc3fffca8bf4?q=80&w=2070&auto=format&fit=crop', alt: 'Santorini, Europa' }
        ];

        // Preload images to prevent white flash
        this.images.forEach(imgData => {
            const img = new Image();
            img.src = imgData.src;
        });

        this.slideshowContainer.innerHTML = ''; // Clear previous content
        this.slideshowDots.innerHTML = '';

        this.images.forEach((img, index) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.style.backgroundImage = `url("${img.src}")`;
            slide.dataset.index = index;
            this.slideshowContainer.appendChild(slide);

            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.dataset.index = index;
            this.slideshowDots.appendChild(dot);
        });

        this.slides = this.slideshowContainer.querySelectorAll('.slide');
        this.dots = this.slideshowDots.querySelectorAll('.dot');

        // NEU: Verhindert die Einblend-Animation für das erste Bild, um ein "Aufblitzen" zu vermeiden.
        this.slideshowContainer.classList.add('no-transition');
        this.slideshowPrev.addEventListener('click', () => this.showSlide(this.currentSlide - 1));
        this.slideshowNext.addEventListener('click', () => this.showSlide(this.currentSlide + 1));
        this.dots.forEach(dot => dot.addEventListener('click', (e) => this.showSlide(parseInt(e.target.dataset.index))));

        this.showSlide(0);
        this.startAutoplay();
        // Entfernt die Klasse nach einer kurzen Verzögerung, um Animationen für die folgenden Bilder zu ermöglichen.
        setTimeout(() => this.slideshowContainer.classList.remove('no-transition'), 100);
    }

    showSlide(index) {
        if (this.slides.length === 0) return;
        this.currentSlide = (index + this.slides.length) % this.slides.length;

        this.slides.forEach(slide => slide.classList.remove('active'));
        this.dots.forEach(dot => dot.classList.remove('active'));

        this.slides[this.currentSlide].classList.add('active');
        this.dots[this.currentSlide].classList.add('active');

        // NEU: Caption aktualisieren
        const captionEl = document.getElementById('slideshow-caption');
        if (captionEl && this.images) {
            captionEl.textContent = this.images[this.currentSlide].alt;
        }

        this.resetAutoplay();
    }

    startAutoplay() {
        this.slideshowInterval = setInterval(() => this.showSlide(this.currentSlide + 1), 5000);
    }

    resetAutoplay() {
        clearInterval(this.slideshowInterval);
        this.startAutoplay();
    }

    setupCountdown() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        const countdownEl = document.getElementById('countdown-timer');
        if (!countdownEl) return;

        const deadline = new Date('2026-01-07T00:00:00').getTime();

        const update = () => {
            const now = new Date().getTime();
            const distance = deadline - now;

            if (distance < 0) {
                countdownEl.textContent = "Der Wettbewerb ist beendet!";
                clearInterval(this.countdownInterval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownEl.textContent = `${days}T ${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}Min ${seconds.toString().padStart(2, '0')}Sek`;
        };

        update();
        this.countdownInterval = setInterval(update, 1000);
    }

    async fetchAndRender() {
        const currentUser = authenticatedUserData;
        const isLeader = isUserLeader(currentUser);
        const jgstHierarchie = db.karriereplan.find(p => p.Stufe === 'JGST')?.Hierarchie || 3;
        const userHierarchie = db.karriereplan.find(p => p.Stufe === currentUser.Karrierestufe)?.Hierarchie || 0;

        if (isLeader && userHierarchie >= jgstHierarchie) {
            this.challengeSection.classList.remove('hidden');
            this.chartSection.classList.remove('hidden');

            const qualifyingSubordinates = await this.getQualifyingSubordinates(currentUser._id);
            this.renderChallengeChart(qualifyingSubordinates.length);
        }

        await this.renderCompanionList();
    }

    async getQualifyingSubordinates(leaderId) {
        const directSubordinates = getSubordinates(leaderId, 'gruppe');
        if (directSubordinates.length === 0) return [];

        // Calculate date range for the last 2 sales months
        const { startDate: currentCycleStart } = getMonthlyCycleDates();
        const prevCycleStart = new Date(currentCycleStart);
        prevCycleStart.setMonth(prevCycleStart.getMonth() - 2);
        const { startDate: twoMonthsAgoStart } = getMonthlyCycleDatesForDate(prevCycleStart);
        const { endDate: currentCycleEnd } = getMonthlyCycleDates();

        const startDateIso = twoMonthsAgoStart.toISOString().split('T')[0];
        const endDateIso = currentCycleEnd.toISOString().split('T')[0];

        const subordinateIds = directSubordinates.map(s => `'${s._id}'`).join(',');
        const subordinateNames = directSubordinates.map(s => `'${escapeSql(s.Name)}'`).join(',');

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

    renderChallengeChart(count) {
        const progress = Math.min(count, 4);
        const progressPercent = (progress / 4) * 100;

        const pathData = "M 20 150 Q 150 150 150 80 T 280 20";
        const stopLabels = ['1. MA', '2. MA', '3. MA', '4. MA'];

        const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempPath.setAttribute('d', pathData);
        const pathLength = tempPath.getTotalLength();

        const progressLength = pathLength * (progressPercent / 100);
        const planePos = tempPath.getPointAtLength(progressLength);
        
        // Calculate plane angle
        const p1 = tempPath.getPointAtLength(Math.max(0, progressLength - 1));
        const p2 = planePos;
        const planeAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

        let stopsHtml = '';
        for (let i = 1; i <= 4; i++) {
            const stopPercent = (i / 4) * 100;
            const stopLength = pathLength * (stopPercent / 100);
            const pos = tempPath.getPointAtLength(stopLength);
            const isReached = progress >= i;

            stopsHtml += `
                <g class="flight-stop ${isReached ? 'reached' : ''}" transform="translate(${pos.x}, ${pos.y})">
                    <circle cx="0" cy="0" r="12"></circle>
                    <text x="0" y="1" class="stop-number">${i}</text>
                </g>
                <text x="${pos.x}" y="${pos.y + 25}" class="stop-label">${stopLabels[i-1]}</text>
            `;
        }

        // NEU: "Ziel!"-Text am Ende des Pfades hinzufügen
        const finalPos = tempPath.getPointAtLength(pathLength);
        stopsHtml += `
            <g transform="translate(${finalPos.x}, ${finalPos.y})">
                <text class="stop-label" style="font-size: 1.2rem; fill: var(--color-accent-gold); transform: translate(15px, 5px);" text-anchor="start">Ziel! ☀️</text>
            </g>
        `;

        this.chartContainer.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 300 180" preserveAspectRatio="xMidYNone meet">
                <defs>
                    <linearGradient id="flightProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#38bdf8" />
                        <stop offset="100%" stop-color="#a78bfa" />
                    </linearGradient>
                </defs>
                <path d="${pathData}" class="flight-path-track" fill="none" />
                <path d="${pathData}" class="flight-path-progress" fill="none" stroke="url(#flightProgressGradient)" stroke-dasharray="${pathLength}" stroke-dashoffset="${pathLength}" />
                ${stopsHtml}
                <g class="plane-wrapper" style="transform: translate(${planePos.x}px, ${planePos.y}px) rotate(${planeAngle}deg);">
                    <text class="plane-icon" x="0" y="0">✈️</text>
                </g>
            </svg>
        `;

        // Animate progress bar after rendering
        setTimeout(() => {
            const progressPath = this.chartContainer.querySelector('.flight-path-progress');
            if (progressPath) {
                progressPath.style.strokeDashoffset = pathLength - progressLength;
            }
        }, 100);

        // NEU: Text-Bereich füllen
        const textContainer = document.getElementById('challenge-text-container');
        if (textContainer) {
            const deadline = new Date('2026-01-07');
            const today = new Date();
            
            let infoabendeCount = 0;
            let currentDate = new Date(today);
            while(currentDate <= deadline) {
                if (isDateValidInfoabend(currentDate)) {
                    infoabendeCount++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const remainingMitarbeiter = Math.max(0, 4 - count);
            const remainingETs = remainingMitarbeiter * 10;
            const weeksRemaining = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7);
            const etsPerWeek = weeksRemaining > 0 ? (remainingETs / weeksRemaining).toFixed(1) : 0;

            textContainer.innerHTML = `
                <div class="p-4 bg-skt-grey-light rounded-lg"><p class="font-semibold text-skt-blue"><i class="fas fa-bullseye mr-2 text-skt-blue-main"></i>1 qualifizierter MA = 10 Einstellungstermine (Ø)</p></div>
                <div class="p-4 bg-skt-grey-light rounded-lg"><p class="font-semibold text-skt-blue"><i class="fas fa-calendar-check mr-2 text-skt-blue-main"></i><span class="font-bold text-skt-blue-main">${infoabendeCount}</span> Infoabende bis zum 07.01.2026</p></div>
                <div class="p-4 bg-skt-grey-light rounded-lg"><p class="font-semibold text-skt-blue"><i class="fas fa-chart-line mr-2 text-skt-blue-main"></i>Du benötigst im Schnitt noch <span class="font-bold text-skt-blue-main">${etsPerWeek}</span> ETs pro Woche!</p></div>
            `;
        }
    }

    async renderCompanionList() {
        this.qualifiedList.innerHTML = '<div class="loader mx-auto"></div>';
        this.contenderList.innerHTML = '<div class="loader mx-auto"></div>';

        const leaders = db.mitarbeiter.filter(m => isUserLeader(m) && m.Status !== 'Ausgeschieden');
        const qualified = [];
        const contenders = [];

        for (const leader of leaders) {
            const qualifyingSubs = await this.getQualifyingSubordinates(leader._id);
            const count = qualifyingSubs.length;
            const subNames = qualifyingSubs.map(s => s.Name); // NEU

            if (count >= 4) {
                qualified.push({ name: leader.Name, count: count, subNames }); // NEU: subNames hinzufügen
            } else if (count >= 2 && count <= 3) {
                contenders.push({ name: leader.Name, count: count, subNames }); // NEU: subNames hinzufügen
            }
        }

        this.renderCompanionGroup(this.qualifiedList, qualified.sort((a,b) => b.count - a.count), false);
        this.renderCompanionGroup(this.contenderList, contenders.sort((a,b) => b.count - a.count), true);
    }

    renderCompanionGroup(container, list, isContender) {
        container.innerHTML = '';
        if (list.length === 0) {
            container.innerHTML = `<p class="text-gray-500">${isContender ? 'Noch keine Anwärter.' : 'Noch niemand qualifiziert.'}</p>`;
            return;
        }

        list.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = `flex items-center justify-between p-3 rounded-lg ${isContender ? 'contender-item' : 'bg-green-50'}`;
            // NEU: Tooltip mit den Namen der qualifizierten Mitarbeiter
            const subNamesList = item.subNames.join(', ');
            itemEl.title = `Qualifizierte Mitarbeiter: ${subNamesList || 'Keine'}`;
            itemEl.innerHTML = `
                <span class="font-bold ${isContender ? 'text-gray-600' : 'text-skt-blue'}">${item.name}</span>
                <span class="font-semibold ${isContender ? 'text-gray-500' : 'text-skt-green-accent'}">${item.count} MA</span>
            `;
            container.appendChild(itemEl);
        });
    }
}

async function loadAndInitWettbewerbView() {
    const container = dom.wettbewerbView;
    try {
        const response = await fetch("./wettbewerb.html");
        if (!response.ok) throw new Error(`Die Datei 'wettbewerb.html' konnte nicht gefunden werden.`);
        container.innerHTML = await response.text();
        if (!wettbewerbViewInstance) wettbewerbViewInstance = new WettbewerbView();
        await wettbewerbViewInstance.init();
    } catch (error) {
        console.error("Fehler beim Laden der Wettbewerb-Ansicht:", error);
        container.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}

// --- START ---
document.addEventListener("DOMContentLoaded", initializeDashboard);

function switchView(viewName) {
  currentView = viewName;
  dom.mainDashboardView.classList.toggle("hidden", viewName !== "dashboard");
  dom.einarbeitungView.classList.toggle("hidden", viewName !== "einarbeitung");
  dom.appointmentsView.classList.toggle("hidden", viewName !== "appointments");
  dom.potentialView.classList.toggle("hidden", viewName !== "potential");
  dom.datenschutzView.classList.toggle("hidden", viewName !== "datenschutz");
  dom.umsatzView.classList.toggle("hidden", viewName !== "umsatz");
  dom.auswertungView.classList.toggle("hidden", viewName !== "auswertung");
  dom.strukturbaumView.classList.toggle("hidden", viewName !== "strukturbaum");
  dom.pgTagebuchView.classList.toggle('hidden', viewName !== 'pg-tagebuch');
  dom.wettbewerbView.classList.toggle('hidden', viewName !== 'wettbewerb'); // NEU
  dom.stimmungsDashboardView.classList.toggle('hidden', viewName !== 'stimmungs-dashboard');
  document.getElementById('bildschirm-view').classList.add('hidden'); // Sicherstellen, dass die Bildschirm-Ansicht immer ausgeblendet ist
  updateBackButtonVisibility();

  // NEU: Logik für goldenen Rahmen um den aktiven Button/Menüpunkt
  const viewButtonMap = {
      'dashboard': [dom.dashboardHeaderBtn],
      'einarbeitung': [dom.einarbeitungBtn],
      'appointments': [dom.appointmentsHeaderBtn],
      'umsatz': [dom.umsatzHeaderBtn],
      'pg-tagebuch': [dom.pgTagebuchHeaderBtn, document.getElementById('pg-tagebuch-menu-item')],
      'potential': [dom.potentialHeaderBtn, document.getElementById('potential-menu-item')],
      'auswertung': [dom.auswertungHeaderBtn, document.getElementById('auswertung-menu-item')],
      'wettbewerb': [dom.wettbewerbHeaderBtn, document.getElementById('wettbewerb-menu-item')], // NEU
      'strukturbaum': [dom.strukturbaumHeaderBtn, document.getElementById('strukturbaum-menu-item')],
      'stimmungs-dashboard': [document.getElementById('stimmungs-dashboard-header-btn')],
      'datenschutz': [dom.datenschutzHeaderBtn],
  };

  // Alle aktiven Stile entfernen
  Object.values(viewButtonMap).flat().forEach(el => {
      if (el) el.classList.remove('active-view-button', 'active-menu-item');
  });

  // Aktiven Stil für die aktuelle Ansicht setzen
  const currentElements = viewButtonMap[viewName];
  if (currentElements) {
      currentElements.forEach(el => {
          if (el) el.classList.add(el.tagName === 'BUTTON' ? 'active-view-button' : 'active-menu-item');
      });
  }

  // KORREKTUR: Sicherheitsprüfung für die Umsatz-Ansicht hinzugefügt.
  if (viewName === 'umsatz' && !isUserLeader(authenticatedUserData)) {
      alert('Du hast keine Berechtigung für diese Ansicht.');
      switchView('dashboard');
      return;
  }

  // KORREKTUR: Sicherheitsprüfung wiederhergestellt.
  if (viewName === 'auswertung' && !isUserLeader(authenticatedUserData)) {
      alert('Du hast keine Berechtigung für diese Ansicht.');
      switchView('dashboard'); // KORREKTUR: Sicherheitsprüfung für Stimmungsdashboard
      return;
  }
  // KORREKTUR: Sicherheitsprüfung für Stimmungsdashboard, die explizit auf `true` prüft.
  const hasStimmungsAccess = authenticatedUserData.Checkin === true || String(authenticatedUserData.Checkin).toLowerCase() === 'true';
  if (viewName === 'stimmungs-dashboard' && !hasStimmungsAccess) {
      alert('Du hast keine Berechtigung für diese Ansicht.');
      switchView('dashboard');
      return;
  }

  if (viewName === "appointments") {
    loadAndInitAppointmentsView();
  } else if (viewName === "potential") {
    loadAndInitPotentialView();
  } else if (viewName === "umsatz") {
    loadAndInitUmsatzView();
  } else if (viewName === "auswertung") {
    loadAndInitAuswertungView();
  } else if (viewName === "strukturbaum") {
    loadAndInitStrukturbaumView();
  } else if (viewName === "datenschutz") {
    loadAndInitDatenschutzView();
  } else if (viewName === 'pg-tagebuch') {
    loadAndInitPGTagebuchView();
  } else if (viewName === 'stimmungs-dashboard') {
    loadAndInitStimmungsDashboardView();
  } else if (viewName === 'wettbewerb') { // NEU
    const wettbewerbAllowedUsers = ["Jason Schreiber", "Samuel Königslehner"];
    if (!authenticatedUserData || !wettbewerbAllowedUsers.includes(authenticatedUserData.Name.trim())) {
        alert('Du hast keine Berechtigung für diese Ansicht.');
        switchView('dashboard');
        return;
    }
      loadAndInitWettbewerbView();
  }
}

class DatenschutzView {
    constructor() {
        this.initialized = false;
    }

    async init() {
        const hasConsented = authenticatedUserData.Datenschutz === true;

        const consentInteractionContainer = document.getElementById('consent-interaction-container');
        const consentGivenContainer = document.getElementById('consent-given-container');

        if (consentInteractionContainer && consentGivenContainer) {
            consentInteractionContainer.classList.toggle('hidden', hasConsented);
            consentGivenContainer.classList.toggle('hidden', !hasConsented);
        }

        // Event-Listener nur einrichten, wenn die Zustimmung noch aussteht.
        if (!hasConsented) {
            this.setupEventListeners();
        }
        this.initialized = true;
    }

    setupEventListeners() {
        const consentPersonal = document.getElementById('consent-personal-data');
        const consentCustomer = document.getElementById('consent-customer-data');
        const acceptBtn = document.getElementById('accept-privacy-policy-btn');

        const checkConsents = () => {
            acceptBtn.disabled = !(consentPersonal.checked && consentCustomer.checked);
        };

        consentPersonal.addEventListener('change', checkConsents);
        consentCustomer.addEventListener('change', checkConsents);

        acceptBtn.addEventListener('click', async () => {
            acceptBtn.disabled = true;
            acceptBtn.textContent = 'Speichere...';

            const sql = `UPDATE \`Mitarbeiter\` SET \`Datenschutz\` = true WHERE _id = '${authenticatedUserData._id}'`;
            const result = await seaTableSqlQuery(sql, false);

            if (result !== null) {
                // 1. Lokalen Zustand aktualisieren
                const userInDb = findRowById('mitarbeiter', authenticatedUserData._id);
                if (userInDb) {
                    userInDb.Datenschutz = true;
                }
                authenticatedUserData.Datenschutz = true;
                localStorage.removeItem(CACHE_PREFIX + 'mitarbeiter');
                
                // 2. Dashboard neu laden und Ansicht wechseln.
                // Diese Funktion kümmert sich um alles Weitere, inkl. dem Aktivieren der Buttons.
                await fetchAndRenderDashboard(authenticatedUserData._id);
            } else {
                alert('Fehler beim Speichern der Zustimmung. Bitte versuchen Sie es erneut.');
                acceptBtn.disabled = false;
                acceptBtn.textContent = 'Zustimmen und Dashboard nutzen';
            }
        });
    }
}

async function loadAndInitDatenschutzView() {
    const container = dom.datenschutzView;
    const response = await fetch("./datenschutz.html");
    container.innerHTML = await response.text();
    if (!datenschutzViewInstance) datenschutzViewInstance = new DatenschutzView();
    await datenschutzViewInstance.init();
}

class StimmungsDashboardView {
    constructor() {
        this.initialized = false;
        this.scope = 'group';
        this.startDate = null;
        this.endDate = null;
    }

    _getDomElements() {
        // Neue Elemente
        this.scopeGroupBtn = document.getElementById('stimmungs-group-btn');
        this.scopeStructureBtn = document.getElementById('stimmungs-structure-btn');
        this.startDateInput = document.getElementById('stimmungs-start-date');
        this.endDateInput = document.getElementById('stimmungs-end-date');
        this.distributionChartContainer = document.getElementById('stimmungs-distribution-chart-container');
        this.kpiWarningsContainer = document.getElementById('stimmungs-kpi-warnings-container');

        // Bestehende Elemente
        this.redFlagsContainer = document.getElementById('stimmungs-red-flags-container');
        this.chartContainer = document.getElementById('stimmungs-chart-container');
        this.motivationContainer = document.getElementById('stimmungs-motivation-container');
        this.todosContainer = document.getElementById('stimmungs-todos-container');
        this.editTodayCheckinBtn = document.getElementById('edit-today-checkin-btn');
        return this.scopeGroupBtn && this.scopeStructureBtn && this.startDateInput && this.endDateInput && this.distributionChartContainer && this.redFlagsContainer && this.chartContainer && this.motivationContainer && this.todosContainer && this.editTodayCheckinBtn && this.kpiWarningsContainer;
    }

    async init() {
        if (!this._getDomElements()) {
            console.error('[StimmungsDashboard] Benötigte DOM-Elemente nicht gefunden.');
            return;
        }
// Initialisiere Datumsauswahl (letzte 30 Tage)
        this.endDate = new Date();
        this.startDate = new Date();
        this.startDate.setDate(this.endDate.getDate() - 30);
        this.startDateInput.value = this.startDate.toISOString().split('T')[0];
        this.endDateInput.value = this.endDate.toISOString().split('T')[0];

        // Lade gespeicherte Einstellungen
        this.scope = loadUiSetting('stimmungsScope', 'group');
        this.scopeGroupBtn.classList.toggle('active', this.scope === 'group');
        this.scopeStructureBtn.classList.toggle('active', this.scope === 'structure');

        // Event Listeners
        const debouncedRender = _.debounce(() => this.fetchAndRender(), 300);
        this.scopeGroupBtn.addEventListener('click', () => { this.scope = 'group'; saveUiSetting('stimmungsScope', 'group'); this.updateScopeButtons(); debouncedRender(); });
        this.scopeStructureBtn.addEventListener('click', () => { this.scope = 'structure'; saveUiSetting('stimmungsScope', 'structure'); this.updateScopeButtons(); debouncedRender(); });
        this.startDateInput.addEventListener('change', () => { this.startDate = new Date(this.startDateInput.value); debouncedRender(); });
        this.endDateInput.addEventListener('change', () => { this.endDate = new Date(this.endDateInput.value); debouncedRender(); });


        await this.fetchAndRender();
        this.initialized = true;
    }
    updateScopeButtons() {
        this.scopeGroupBtn.classList.toggle('active', this.scope === 'group');
        this.scopeStructureBtn.classList.toggle('active', this.scope === 'structure');
    }

    async fetchAndRender() {
        // 1. Lade die korrekten Benutzer-IDs basierend auf dem Scope
        let userIds;
        if (this.scope === 'structure') {
            // Alle untergebenen Mitarbeiter in der gesamten Struktur
            const structureMembers = getAllSubordinatesRecursive(authenticatedUserData._id);
            userIds = [authenticatedUserData._id, ...structureMembers.map(u => u._id)];
        } else { // 'group'
            // Alle Mitarbeiter in der direkten Gruppe
            const groupMembers = getSubordinates(authenticatedUserData._id, 'gruppe');
            userIds = [authenticatedUserData._id, ...groupMembers.map(u => u._id)];
        }
        const userIdsSet = new Set(userIds);

        // 2. Filtere Check-ins nach Benutzern und Datum
        const filteredCheckins = db.checkin.filter(c => {
            if (!c.Datum || !userIdsSet.has(c.Mitarbeiter)) return false;
            const checkinDate = new Date(c.Datum);
            return checkinDate >= this.startDate && checkinDate <= this.endDate;
        });

        // NEU: Logik für den "Bearbeiten"-Button
        const todayString = new Date().toISOString().split('T')[0];
        const todaysCheckin = db.checkin.find(c => 
            // KORREKTUR: Der eigene Check-in wird über die 'Mitarbeiter'-Spalte gefunden.
            // Die Prüfung auf 'Motivation' (truthiness) stellt sicher, dass es der Haupteintrag des Leiters ist.
            c.Mitarbeiter === authenticatedUserData._id &&
            c.Datum && c.Datum.startsWith(todayString) &&
            c.Motivation
        );

        if (todaysCheckin) {
            this.editTodayCheckinBtn.classList.remove('hidden');
            this.editTodayCheckinBtn.onclick = () => openCheckinModal(true); // true für Bearbeitungsmodus
        } else {
            this.editTodayCheckinBtn.classList.add('hidden');
        }

        // 3. Rufe die Render-Funktionen mit den gefilterten Daten auf
        this.renderRedFlags(filteredCheckins);
        this.renderStimmungChart(filteredCheckins);
        this.renderStimmungDistribution(filteredCheckins);
        this.renderMotivation(filteredCheckins);
        this.renderTodos(filteredCheckins);
        // NEU: KPI-Warnungen rendern
        this.renderKpiWarnings(userIdsSet);
    }

    renderRedFlags(checkins) {
        this.redFlagsContainer.innerHTML = '';
        const matrixCheckins = checkins.filter(c => c.Motivation === undefined); // Nur Team-Check-ins
        const questionKeys = ['TermineEingetragen', 'PositiverKontakt', 'ZieleDran', 'SeminarAnwesend', 'RecruitingTermine', 'AktuelleErfolge', 'TodosErledigt'];
        const questionLabels = {
            'TermineEingetragen': 'Termine eingetragen?',
            'PositiverKontakt': 'Positiver Kontakt?',
            'ZieleDran': 'An Zielen dran?',
            'SeminarAnwesend': 'Seminar anwesend?',
            'RecruitingTermine': 'Recruitingtermine?',
            'AktuelleErfolge': 'Aktuelle Erfolge?',
            'TodosErledigt': 'PG-Todos erledigt?'
        };

        const flagCounts = questionKeys.reduce((acc, key) => {
            acc[key] = 0;
            return acc;
        }, {});

        matrixCheckins.forEach(checkin => {
            questionKeys.forEach(key => {
                if (checkin[key] === false) {
                    flagCounts[key]++;
                }
            });
        });

        const sortedFlags = Object.entries(flagCounts).sort(([, a], [, b]) => b - a);
        const maxCount = sortedFlags[0]?.[1] || 0;

        if (maxCount === 0) {
            this.redFlagsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Keine negativen Antworten im ausgewählten Zeitraum. Sehr gut!</p>';
            return;
        }

        const container = document.createElement('div');
        container.className = 'space-y-3';
        sortedFlags.forEach(([key, count]) => {
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            container.innerHTML += `
                <div class="flex items-center gap-4">
                    <div class="w-48 text-sm text-skt-blue-light text-right">${questionLabels[key]}</div>
                    <div class="flex-1 bg-gray-200 rounded-full h-6">
                        <div class="bg-skt-red-accent h-6 rounded-full flex items-center justify-end pr-2 text-white font-bold text-sm" style="width: ${percentage}%">
                            ${count}
                        </div>
                    </div>
                </div>
            `;
        });
        this.redFlagsContainer.appendChild(container);
    }

    renderStimmungChart(checkins) {
        this.chartContainer.innerHTML = '';
        const leaderCheckins = checkins.filter(c => c.Motivation !== undefined && c.Stimmung);

        if (leaderCheckins.length < 2) {
            this.chartContainer.style.height = 'auto';
            this.chartContainer.innerHTML = '<div class="flex items-center justify-center text-gray-500 py-16"><p>Nicht genügend Daten für einen Stimmungsverlauf vorhanden.</p></div>';
            return;
        }

        this.chartContainer.style.height = '20rem'; // 320px, entspricht h-80
        const stimmungByDay = _.groupBy(leaderCheckins, c => c.Datum.split('T')[0]);
        const chartData = Object.entries(stimmungByDay).map(([date, entries]) => {
            const avgStimmung = _.meanBy(entries, 'Stimmung');
            return { date: new Date(date), value: avgStimmung };
        }).sort((a, b) => a.date - b.date);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 500 200');
        svg.classList.add('stimmungs-line-chart-svg', 'w-full', 'h-full');

        const margin = { top: 20, right: 20, bottom: 30, left: 30 };
        const width = 500 - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        const x = (date) => margin.left + (date - chartData[0].date) / (chartData[chartData.length - 1].date - chartData[0].date) * width;
        const y = (value) => margin.top + height - ((value - 1) / 9) * height;

        // Grid lines and axes
        let gridHtml = `<g class="grid-lines">`;
        for (let i = 1; i <= 10; i++) {
            gridHtml += `<line class="grid-line" x1="${margin.left}" y1="${y(i)}" x2="${width + margin.left}" y2="${y(i)}"></line>`;
            gridHtml += `<text class="axis-label" x="${margin.left - 8}" y="${y(i) + 3}" text-anchor="end">${i}</text>`;
        }
        gridHtml += `</g>`;
        svg.innerHTML += gridHtml;

        // Line path
        const pathData = chartData.map(d => `${x(d.date)},${y(d.value)}`).join(' L ');
        svg.innerHTML += `<path class="line-path" d="M ${pathData}"></path>`;

        // Points and tooltips
        chartData.forEach(d => {
            svg.innerHTML += `
                <g class="tooltip-group" transform="translate(${x(d.date)}, ${y(d.value)})">
                    <circle class="line-point" r="4"></circle>
                    <g class="tooltip" style="visibility: hidden;">
                        <rect class="tooltip-bg" x="-30" y="-25" width="60" height="20"></rect>
                        <text class="tooltip-text" x="0" y="-12" text-anchor="middle">${d.date.toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit'})}: ${d.value.toFixed(1)}</text>
                    </g>
                </g>
            `;
        });

        this.chartContainer.appendChild(svg);

        // Tooltip hover logic
        this.chartContainer.querySelectorAll('.tooltip-group').forEach(group => {
            group.addEventListener('mouseenter', () => group.querySelector('.tooltip').style.visibility = 'visible');
            group.addEventListener('mouseleave', () => group.querySelector('.tooltip').style.visibility = 'hidden');
        });
    }

    renderStimmungDistribution(checkins) {
        this.distributionChartContainer.innerHTML = '';
        const leaderCheckins = checkins.filter(c => c.Motivation !== undefined && c.Stimmung);

        if (leaderCheckins.length === 0) {
            this.distributionChartContainer.style.height = 'auto';
            this.distributionChartContainer.innerHTML = '<div class="flex items-center justify-center text-gray-500 py-16"><p>Keine Stimmungsdaten.</p></div>';
            return;
        }

        this.distributionChartContainer.style.height = '20rem'; // 320px, entspricht h-80
        const counts = Array(10).fill(0);
        leaderCheckins.forEach(c => {
            counts[c.Stimmung - 1]++;
        });

        const maxCount = Math.max(...counts);
        if (maxCount === 0) {
            this.distributionChartContainer.style.height = 'auto';
            this.distributionChartContainer.innerHTML = '<div class="flex items-center justify-center text-gray-500 py-16"><p>Keine Stimmungsdaten.</p></div>';
            return;
        }

        const chartHtml = counts.map((count, i) => {
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return `
                <div class="flex-1 flex flex-col items-center justify-end" title="${count} mal">
                    <div class="w-full bg-skt-blue-light rounded-t-md text-center text-white text-xs py-0.5" style="height: ${height}%; min-height: ${count > 0 ? '16px' : '0'};">
                        ${count > 0 ? count : ''}
                    </div>
                    <div class="text-xs mt-1 text-gray-500 font-semibold">${i + 1}</div>
                </div>
            `;
        }).join('');

        this.distributionChartContainer.innerHTML = `<div class="flex h-full items-end gap-1">${chartHtml}</div>`;
    }

    renderMotivation(checkins) {
        this.motivationContainer.innerHTML = '';
        // KORREKTUR: Prüfe, ob 'Motivation' truthy ist, bevor .trim() aufgerufen wird, um Fehler bei null-Werten zu vermeiden.
        const leaderCheckins = checkins.filter(c => c.Motivation && c.Motivation.trim() !== '');

        if (leaderCheckins.length === 0) {
            this.motivationContainer.innerHTML = '<p class="text-center text-gray-500">Keine Motivationseinträge gefunden.</p>';
            return;
        }
        this.motivationContainer.innerHTML = leaderCheckins.map(c => {
            const leiter = findRowById('mitarbeiter', c.Mitarbeiter);
            return `<div class="stimmungs-motivation-item">
                        <p>${c.Motivation}</p>
                        <p class="text-xs text-right text-gray-400 mt-1">- ${leiter ? leiter.Name : 'Unbekannt'} am ${new Date(c.Datum).toLocaleDateString('de-DE')}</p>
                    </div>`;
        }).join('');
    }

    // NEU: Rendert die KPI-basierten Warnungen für die Struktur/Gruppe
    renderKpiWarnings(userIds) {
        if (!this.kpiWarningsContainer) return;

        this.kpiWarningsContainer.innerHTML = '<div class="loader mx-auto"></div>';
        const warnings = [];
        const users = Array.from(userIds).map(id => findRowById('mitarbeiter', id)).filter(Boolean);

        // NEU: Monatsdaten für Planungs-Check holen
        const { startDate: cycleStartDate } = getMonthlyCycleDates();
        const currentMonthName = cycleStartDate.toLocaleString('de-DE', { month: 'long' });
        const currentYear = cycleStartDate.getFullYear();

        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const today = new Date();

        users.forEach(user => {
            if (user.Status === 'Ausgeschieden') return;

            // NEU: Mitarbeiter ohne EH-Monatsziel überspringen
            const plan = db.monatsplanung.find(p => 
                p.Mitarbeiter_ID === user._id &&
                p.Monat === currentMonthName &&
                p.Jahr === currentYear
            );
            if (!plan || !plan.EH_Ziel || plan.EH_Ziel <= 0) {
                return; // continue to next user
            }

            const userWarnings = [];

            // KPI 1: High Cancellation Rate (last 2 weeks)
            const twoWeekAppointments = db.termine.filter(t => 
                t.Mitarbeiter_ID === user._id && 
                t.Datum && 
                new Date(t.Datum) >= twoWeeksAgo && 
                new Date(t.Datum) <= today
            );
            
            if (twoWeekAppointments.length > 0) {
                const cancelledCount = twoWeekAppointments.filter(t => t.Absage === true || t.Status === 'Storno').length;
                const cancellationRate = cancelledCount / twoWeekAppointments.length;
                if (cancellationRate >= 0.5) {
                    userWarnings.push(`Hohe Stornoquote (${(cancellationRate * 100).toFixed(0)}% in den letzten 2 Wochen)`);
                }
            }

            // Check if user is active for at least 4 weeks
            const userStartDate = new Date(user.Startdatum);
            if (userStartDate <= fourWeeksAgo) {
                // KPI 2: Low Activity Rate (last 4 weeks)
                const fourWeekAppointments = db.termine.filter(t => 
                    t.Mitarbeiter_ID === user._id &&
                    t.Datum &&
                    new Date(t.Datum) >= fourWeeksAgo &&
                    new Date(t.Datum) <= today &&
                    ['AT', 'BT', 'ET'].includes(t.Kategorie)
                );

                if (fourWeekAppointments.length < 5) {
                    userWarnings.push(`Geringe Aktivität (${fourWeekAppointments.length} Termine in den letzten 4 Wochen)`);
                }

                // KPI 3: No Recruiting Activity (last 4 weeks)
                const fourWeekEtAppointments = fourWeekAppointments.filter(t => t.Kategorie === 'ET');
                if (fourWeekEtAppointments.length === 0) {
                    userWarnings.push('Keine Recruiting-Termine (ET) in den letzten 4 Wochen');
                }
            }

            if (userWarnings.length > 0) {
                warnings.push({
                    name: user.Name,
                    id: user._id,
                    reasons: userWarnings
                });
            }
        });

        this.kpiWarningsContainer.innerHTML = '';
        if (warnings.length === 0) {
            this.kpiWarningsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Keine KPI-Warnungen. Alles im grünen Bereich!</p>';
            return;
        }

        warnings.forEach(warning => {
            const warningEl = document.createElement('div');
            warningEl.className = 'p-3 bg-red-50 border-l-4 border-skt-red-accent rounded-r-lg';
            
            let reasonsHtml = warning.reasons.map(reason => `<li class="text-sm text-red-700">${reason}</li>`).join('');

            warningEl.innerHTML = `
                <p class="font-bold text-skt-blue">${warning.name}</p>
                <ul class="list-disc list-inside mt-1">
                    ${reasonsHtml}
                </ul>
            `;
            this.kpiWarningsContainer.appendChild(warningEl);
        });
    }



    renderTodos(checkins) {
        this.todosContainer.innerHTML = '';
        // KORREKTUR: Verwende das heutige Datum, da die Karte "Heutige To-Dos" heißt.
        const today = new Date();
        const displayDateString = today.toISOString().split('T')[0];
        // KORREKTUR: Prüfe, ob 'Motivation' truthy ist, um nur "Haupt-Check-ins" zu berücksichtigen.
        const displayDateCheckins = checkins.filter(c => c.Motivation && c.Todos && c.Datum.startsWith(displayDateString));

        if (displayDateCheckins.length === 0) {
            // KORREKTUR: Gib das heutige Datum in der Meldung aus.
            this.todosContainer.innerHTML = `<p class="text-center text-gray-500">Keine To-Dos für heute (${today.toLocaleDateString('de-DE')}) gefunden.</p>`;
            return;
        }

        this.todosContainer.innerHTML = displayDateCheckins.map(c => {
            const leiter = findRowById('mitarbeiter', c.Mitarbeiter);
            const todosHtml = c.Todos.split('\n').map(line => {
                if (line.trim().startsWith('-')) {
                    return `<li class="ml-4">${line.substring(1).trim()}</li>`;
                }
                return `<p class="font-semibold mt-2">${line}</p>`;
            }).join('');

            return `
                <div class="stimmungs-todo-card p-4 rounded-lg">
                    <p class="font-bold text-skt-blue mb-2">${leiter ? leiter.Name : 'Unbekannt'}</p>
                    <ul class="list-disc list-inside text-sm text-gray-700">${todosHtml}</ul>
                </div>
            `;
        }).join('');
            
        
    }

    
}

async function loadAndInitStimmungsDashboardView() {
    const container = dom.stimmungsDashboardView;
    const editBtn = document.getElementById('edit-today-checkin-btn');
    
    try {
        const response = await fetch("./stimmungs-dashboard.html");
        if (!response.ok) throw new Error(`Die Datei 'stimmungs-dashboard.html' konnte nicht gefunden werden.`);
        let html = await response.text();
        container.innerHTML = html;

        // NEU: Dynamically create the KPI warnings container.
        const redFlagsContainer = container.querySelector('#stimmungs-red-flags-container');
        if (redFlagsContainer && redFlagsContainer.parentElement && redFlagsContainer.parentElement.parentElement) {
            const gridContainer = redFlagsContainer.parentElement.parentElement;
            if (gridContainer.classList.contains('grid') && !gridContainer.querySelector('#stimmungs-kpi-warnings-container')) {
                const kpiWarningsHtml = `
                    <div class="bg-white rounded-2xl p-6 shadow-lg">
                        <h3 class="text-xl font-bold text-skt-blue mb-4">KPI Warnungen</h3>
                        <div id="stimmungs-kpi-warnings-container" class="space-y-4 max-h-96 overflow-y-auto pr-2">
                            <!-- content will be generated by JS -->
                        </div>
                    </div>
                `;
                gridContainer.insertAdjacentHTML('beforeend', kpiWarningsHtml);
            }
        }
        if (!stimmungsDashboardViewInstance) stimmungsDashboardViewInstance = new StimmungsDashboardView();
        await stimmungsDashboardViewInstance.init();
    } catch (error) {
        console.error("Fehler beim Laden des Stimmungsdashboards:", error);
        container.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}

// Mache Kernfunktionen global verfügbar für andere Module/Dateien
window.SKT_APP = {
  seaTableSqlQuery,
  seaTableAddRow,
  seaTableUpdateRow,
  seaTableUpdateTermin,
  seaTableAddTermin,
  seaTableDeleteRow,
  mapSqlResults,
  findRowById,
  getMonthlyCycleDates,
  escapeSql,
  getCurrentDate,
  isDateValidInfoabend,
  getSubordinates,
  getAllSubordinatesRecursive,
  isUserLeader,
  db,
  get COLUMN_MAPS() { // Use a getter to ensure the latest value is always returned
    return COLUMN_MAPS;
  },
  get METADATA() { // Use a getter to ensure the latest value is always returned
    return METADATA;
  },

  get authenticatedUserData() {
    return authenticatedUserData;
  },

  get currentlyViewedUserData() {
    return currentlyViewedUserData;
  },
};