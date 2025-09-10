// --- KONSTANTEN ---
const SEATABLE_API_TOKEN = "b148f4c735d193f77841ce4e4ddb2bb8bc2e446b";
const SEATABLE_APP_ACCESS_TOKEN_URL =
  "https://cloud.seatable.io/api/v2.1/dtable/app-access-token/";
const SEATABLE_DTABLE_UUID = "5b374b51-789c-4aac-a12f-02574f8f4855";
// Cache-Konstanten: Ändere die Version, um alle Caches zu invalidieren.
const CACHE_VERSION = "v1.1";
const CACHE_PREFIX = `skt-dashboard-cache-${CACHE_VERSION}-`;

let COLUMN_MAPS = {}; // Wird dynamisch gefüllt

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
  einarbeitung: [],
  gesellschaften: [],
  produkte: [],
  "pg": [],
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
let timeTravelDate = null; // NEU
let appointmentsViewInstance = null;
let potentialViewInstance = null;
let umsatzViewInstance = null;
let auswertungViewInstance = null;
let strukturbaumViewInstance = null;
let pgTagebuchViewInstance = null;
let HIERARCHY_CACHE = null;
let currentOnboardingSubView = "leader-list";

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
  employeeGoalStatus: document.getElementById("employee-goal-status"),
  interviewsProgressBar: document.getElementById("interviews-progress-bar"),
  userDropdownSelect: document.getElementById("user-dropdown-select"),
  userSelectError: document.getElementById("user-select-error"),
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
  auswertungView: document.getElementById("auswertung-view"),
  umsatzView: document.getElementById("umsatz-view"),
  potentialView: document.getElementById("potential-view"),
  appointmentsView: document.getElementById("appointments-view"),
  einarbeitungTitle: document.getElementById("einarbeitung-title"),
  traineeOnboardingView: document.getElementById("trainee-onboarding-view"),
  leaderOnboardingView: document.getElementById("leader-onboarding-view"),
  pgTagebuchView: document.getElementById('pg-tagebuch-view'),
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
  moreToolsBtn: document.getElementById('more-tools-btn'),
  moreToolsMenu: document.getElementById('more-tools-menu'),
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

      if (colName === "Mitarbeiter_ID") {
        const mitarbeiterRowId = value && value[0] ? value[0] : null;
        const success = await seaTableUpdateLinkField(rowId, mitarbeiterRowId);
        if (!success) {
          console.error(`[API-LINK-UPDATE] Failed to update field: ${colName}`);
          allUpdatesSucceeded = false;
          break;
        }
      } else {
        const colMeta = tableMeta.columns.find(c => c.key === key);
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
  return allUpdatesSucceeded;
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
  const mitarbeiterIdKey = SKT_APP.COLUMN_MAPS.termine.Mitarbeiter_ID;
  const mitarbeiterRowId = rowData[mitarbeiterIdKey] ? rowData[mitarbeiterIdKey][0] : null;
  
  const rowDataForCreation = { ...rowData };
  delete rowDataForCreation[mitarbeiterIdKey];

  // KORREKTUR: Der 'rows' Endpunkt erwartet Spalten-NAMEN, nicht Spalten-Keys.
  // Wir müssen die Keys (z.B. '0000') in Namen (z.B. 'Terminpartner') umwandeln.
  const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
  if (!tableMap) {
      console.error(`[ADD-ROW-NEW] Column map for table '${tableName}' not found.`);
      return false;
  }
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

  // --- SCHRITT 3: Mitarbeiter verknüpfen ---
  if (mitarbeiterRowId) {
    console.log(`[ADD-ROW-NEW] Step 2: Linking Mitarbeiter_ID ${mitarbeiterRowId} to new Termin ${newRowId}.`);
    const linkSuccess = await seaTableUpdateLinkField(newRowId, mitarbeiterRowId);
    if (!linkSuccess) {
      console.error("[ADD-ROW-NEW] Step 2 FAILED: Could not link employee to the new row.");
      return false; // Fehler, wenn die Verknüpfung fehlschlägt.
    }
    console.log("[ADD-ROW-NEW] Step 2 Success: Employee linked.");
  }

  console.log("[ADD-ROW-NEW] Process finished successfully.");
  return true;
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
        
        pgLog(`[UPDATE-LINK] Updating link for ${linkColumnName}. Payload:`, body);
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
  }

  setStatus("Lade Stammdaten...");
  const tablesToLoad = [
    "Mitarbeiter",
    "Karriereplan",
    "Einarbeitungsschritte",
    "Monatsplanung",
    "Termine",
    "Einarbeitung",
    "Gesellschaften",
    "Produkte",
    "PG",
    "Bürostandorte",
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
        console.error(`Konnte '${tableName}' nicht von der API laden.`);
      }
    }
  }
  console.timeEnd('[DATENLADEN] Gesamtladezeit Stammdaten');

  normalizeAllData();
  // console.log("Stammdaten geladen und zwischengespeichert.");
  return true;
}

// --- HILFSFUNKTIONEN ---
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

function escapeSql(str) {
  if (typeof str !== "string") return str;
  return str.replace(/'/g, "''");
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
  
  // Plandaten aus dem vorgeladenen und normalisierten Cache laden.
  const planResults = db.monatsplanung.filter(p => p.Monat === currentMonthName && p.Jahr === currentYear);

  // Termindaten ebenfalls aus dem Cache laden und nach Datum filtern.
  const termineResults = db.termine.filter(t => {
      if (!t.Datum) return false;
      const terminDate = new Date(t.Datum);
      return terminDate >= startDate && terminDate <= endDate;
  });

  // Die Abfrage für den aktuellen Monat ist schnell genug und wird immer frisch geladen.
  const ehQuery = `SELECT \`Mitarbeiter_ID\`, SUM(\`EH\`) AS \`ehIst\` FROM \`Umsatz\` WHERE \`Datum\` >= '${startDateIso}' AND \`Datum\` <= '${endDateIso}' GROUP BY \`Mitarbeiter_ID\``;
  const ehResultRaw = await seaTableSqlQuery(ehQuery, false);
  
  const ehResults = mapSqlResults(ehResultRaw || [], "Umsatz");
  // const totalEhResults = mapSqlResults(totalEhResultRaw || [], "Umsatz"); // ALT: Wurde hier geladen

  const AT_STATUS_GEHALTEN = ["Gehalten"];
  const AT_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten"];
  const ET_STATUS_GEHALTEN = [
    "Gehalten",
    "Weiterer ET",
    "Info Eingeladen",
    "Info Bestätigt",
    "Info Anwesend",
    "Wird Mitarbeiter",
  ];

  return users.map((user) => {
    // Plandaten kommen aus dem Cache und sind normalisiert.
    const plan = planResults.find((p) => p.Mitarbeiter_ID === user._id) || {};
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
    const userTermine = termineResults.filter((t) => t.Mitarbeiter_ID === user._id);

    let atIst = 0,
      atVereinbart = 0,
      etIst = 0;
    userTermine.forEach((t) => {
      if (t.Kategorie === "AT") {
        if (AT_STATUS_GEHALTEN.includes(t.Status)) atIst++;
        if (AT_STATUS_AUSGEMACHT.includes(t.Status)) atVereinbart++;
      } else if (t.Kategorie === "ET") {
        if (ET_STATUS_GEHALTEN.includes(t.Status)) etIst++;
      }
    });

    const ehZiel = plan["EH_Ziel"] || 0,
      etZiel = plan["ET_Ziel"] || 0,
      ehIst = eh.ehIst || 0;
    const atSoll =
      user.EHproATQuote && ehZiel > 0
        ? Math.round(ehZiel / user.EHproATQuote)
        : 0;
    const totalCurrentEh = totalEh.totalEh || 0;
    const anzahlGeworbenerMA = db.mitarbeiter.filter(
      (m) => m.Werber === user._id
    ).length;
    const position = user.Karrierestufe || "";

    return {
      id: user._id,
      name: user.Name,
      position,
      ehGoal: ehZiel,
      ehCurrent: ehIst,
      etGoal: etZiel,
      etCurrent: etIst,
      atGoal: atSoll,
      atCurrent: atIst,
      atVereinbart,
      totalCurrentEh,
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
    const queue = [...(hierarchy[leaderId]?.children || [])];
    const visited = new Set(queue);
    while (queue.length > 0) {
      const currentId = queue.shift();
      const user = findRowById("mitarbeiter", currentId);
      if (!user) continue;

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
    const queue = [...(hierarchy[leaderId]?.children || [])];
    const visited = new Set(queue);

    while (queue.length > 0) {
      const currentId = queue.shift();
      const user = findRowById("mitarbeiter", currentId);
      if (!user) continue;

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

function getAllSubordinatesRecursive(leaderId, hierarchy = buildHierarchy()) {  const subordinates = [];
  const queue = [...(hierarchy[leaderId]?.children || [])]; // Use provided hierarchy
  const visited = new Set(queue);

  while (queue.length > 0) {
    const currentId = queue.shift();
    const current = hierarchy[currentId];
    if (!current) continue;

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
  fullDataStore // This parameter will now be ignored, but we keep it for now to avoid breaking other calls.
) {
  const leaderUser = findRowById("mitarbeiter", leaderId);
  if (!leaderUser) return { members: [] };

  // NEUER ANSATZ: Wir definieren die Mitarbeiter für die Berechnung und holen ihre Daten frisch.
  // 'gruppe' = FK + ihre direkten Trainees/GAs.
  // 'struktur' = FK + ihre gesamte Downline (FKs und Trainees).
  const groupSubordinates = (type === 'gruppe') ? getSubordinates(leaderId, "gruppe") : getAllSubordinatesRecursive(leaderId);
  const membersForCalculation = [leaderUser, ...groupSubordinates];
  const memberIdsForCalc = membersForCalculation.map(m => m._id);

  // FRISCHE DATEN HOLEN: Anstatt auf `fullDataStore` zu vertrauen, holen wir die Daten für genau diese Mitarbeiter.
  const dataForCalc = await fetchBulkDashboardData(memberIdsForCalc);

  // Die Summen für die Gruppe berechnen.
  const aggregatedData = dataForCalc.reduce((acc, member) => {
      acc.ehGoal += (member.ehGoal || 0);
      acc.ehCurrent += (member.ehCurrent || 0);
      acc.etGoal += (member.etGoal || 0);
      acc.etCurrent += (member.etCurrent || 0);
      acc.atGoal += (member.atGoal || 0);
      acc.atCurrent += (member.atCurrent || 0);
      acc.atVereinbart += (member.atVereinbart || 0);
      return acc;
  }, {
      ehGoal: 0, ehCurrent: 0, etGoal: 0, etCurrent: 0,
      atGoal: 0, atCurrent: 0, atVereinbart: 0
  });

  // Der Gesamtverdienst der Gruppe/Struktur ist der Verdienst der Führungskraft,
  // da dieser bereits die Differenzprovisionen für die jeweilige Downline enthält.
  const leaderData = dataForCalc.find((d) => d.id === leaderId);
  const totalEarnings = leaderData
    ? leaderData.earnings
    : { personal: 0, group: 0, structure: 0 };

  // KORREKTUR: Die `members`-Eigenschaft muss die Daten der unterstellten Mitarbeiter enthalten,
  // damit die aufrufende Funktion (z.B. renderTeamMemberCards) darauf zugreifen kann.
  // Für die "Gesamtansicht" (die `calculateGesamtansichtData` aufruft) wollen wir die unterstellten
  // Trainees anzeigen, wenn eine FK-Karte aufgeklappt wird.
  // KORREKTUR: Verwende die bereits berechneten `dataForCalc`, um die Daten der Untergebenen zu filtern.
  const membersForDisplay = groupSubordinates;
  const memberData = dataForCalc.filter((d) =>
    new Set(membersForDisplay.map((m) => m._id)).has(d.id)
  );

  return {
    id: leaderId, // KORREKTUR: Füge die ID der Führungskraft zum Ergebnisobjekt hinzu.
    ehGoal: aggregatedData.ehGoal,
    ehCurrent: aggregatedData.ehCurrent,
    etGoal: aggregatedData.etGoal,
    etCurrent: aggregatedData.etCurrent,
    atGoal: aggregatedData.atGoal,
    atCurrent: aggregatedData.atCurrent,
    atVereinbart: aggregatedData.atVereinbart,
    earnings: totalEarnings,
    members: memberData,
  };
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
  const { startDate, endDate } = getMonthlyCycleDates();
  const [allMemberData, earningsMap] = await Promise.all([
    fetchBulkDashboardData(Array.from(allMemberIds)),
    calculateAllStructureEarnings(Array.from(allMemberIds), startDate, endDate),
  ]);
  const augmentedMemberData = allMemberData.map((data) => ({
    ...data,
    earnings: earningsMap[data.id] || { personal: 0, group: 0, structure: 0 },
  }));

  // KORREKTUR: Berechne die Summen für die obere Anzeige und die Daten für die einzelnen Karten.
  // KORREKTUR: Verwende Promise.all, um sicherzustellen, dass alle Gruppenberechnungen abgeschlossen sind, bevor es weitergeht.
  const groupDataPromises = führungskräfte.map(leader => calculateGroupOrStructureData(leader._id, 'gruppe', augmentedMemberData)); // Der 3. Parameter wird ignoriert, ist aber OK.
  const allGroupData = await Promise.all(groupDataPromises);


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

function updateMonthlyPlanningView(data) {
  updateWeeklyProgress();
  
  if (isMoneyView) {
    let earningsToShow = 0;
    let earningsGoal = 0;

    if (data.earnings) {
      if (isSuperuserView) {
        earningsToShow = data.earnings;
        const avgRate = data.ehCurrent > 0 ? data.earnings / data.ehCurrent : 0;
        earningsGoal = data.ehGoal * avgRate;
      } else if (currentPlanningView === "personal") {
        earningsToShow = data.earnings.personal;
        const rate = getVerdienstForPosition(data.position);
        earningsGoal = data.ehGoal * rate;
      } else if (currentPlanningView === "team") {
        earningsToShow = data.earnings.group;
        const leaderRate = getVerdienstForPosition(personalData.position);
        const avgRate = data.ehCurrent > 0 ? data.earnings.group / data.ehCurrent : leaderRate;
        earningsGoal = data.ehGoal * avgRate;
      } else if (currentPlanningView === "struktur") {
        earningsToShow = data.earnings.structure;
        const leaderRate = getVerdienstForPosition(personalData.position);
        const avgRate = data.ehCurrent > 0 ? data.earnings.structure / data.ehCurrent : leaderRate;
        earningsGoal = data.ehGoal * avgRate;
      }
    }

    animateValue(dom.ehCenterCurrent, 0, earningsToShow || 0, 1000, true);
    dom.ehCenterGoal.textContent = (earningsGoal || 0).toLocaleString("de-DE", { maximumFractionDigits: 0 });
    dom.ehCenterUnitLabel.textContent = "Ist €";
    dom.ehSollUnitLabel.textContent = "Soll €";

    const moneyPercentage = earningsGoal > 0 ? (earningsToShow / earningsGoal) * 100 : 0;
    updateCircleProgress(dom.ehProgressCircle, 45, moneyPercentage);

    // Prognose- und Soll-Logik für Geld-Ansicht
    const { startDate, endDate } = getMonthlyCycleDates();
    const today = getCurrentDate();
    const totalDaysInCycle = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const daysPassedInCycle = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
    const timeElapsedPercentage = totalDaysInCycle > 0 ? (daysPassedInCycle / totalDaysInCycle) * 100 : 0;
    updateCircleProgress(dom.prognosisCircleEh, 35, timeElapsedPercentage);

    const sollValue = Math.round(earningsGoal * (timeElapsedPercentage / 100));
    animateValue(dom.ehSollValue, 0, sollValue, 1000, true);

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

    // Prognose- und Soll-Logik wiederhergestellt
    const { startDate, endDate } = getMonthlyCycleDates();
    const today = getCurrentDate();
    const totalDaysInCycle = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const daysPassedInCycle = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
    const timeElapsedPercentage = totalDaysInCycle > 0 ? (daysPassedInCycle / totalDaysInCycle) * 100 : 0;
    updateCircleProgress(dom.prognosisCircleEh, 35, timeElapsedPercentage);

    const sollValue = Math.round((data.ehGoal || 0) * (timeElapsedPercentage / 100));
    animateValue(dom.ehSollValue, 0, sollValue, 1000);
    drawSegmentDividers();
  }

  dom.appointmentsText.textContent = `${data.atCurrent || 0} / ${
    data.atVereinbart || 0
  } / ${data.atGoal || 0}`;
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
  const { totalCurrentEh, recruitedEmployees, position } = personalData;
  animateValue(dom.currentEhDisplay, 0, totalCurrentEh, 1500);
  const currentStage = db.karriereplan.find((k) => k.Stufe === position);
  if (!currentStage) {
    console.error(
      "Aktuelle Karrierestufe nicht im Karriereplan gefunden:",
      position
    );
    return;
  }
  const nextStage = db.karriereplan
    .filter((k) => k.Hierarchie > currentStage.Hierarchie)
    .sort((a, b) => a.Hierarchie - b.Hierarchie)[0];
  if (nextStage) {
    dom.nextMilestone.innerHTML = `Nächster Meilenstein: <span class="text-skt-blue font-semibold">${nextStage.Stufe}</span>`;
    const ehNeeded = nextStage.Kriterium_EH || 0;
    const progressEh = ehNeeded > 0 ? (totalCurrentEh / ehNeeded) * 100 : 0;
    dom.careerProgressPercentage.textContent = `${Math.min(
      progressEh,
      100
    ).toFixed(1)}%`;
    dom.progressToNextText.textContent = `Fortschritt zum ${nextStage.Stufe}`;
    updateCircleProgress(dom.fortschrittKreisKarriere, 40, progressEh);
    const maNeeded = nextStage.Kriterium_MA || 0;
    dom.employeeCountDisplay.textContent = `${recruitedEmployees} / ${maNeeded}`;
    dom.employeeGoalStatus.textContent = `Ziel: ${maNeeded} MA`;
    clearChildren(dom.employeeSlotsContainer);
    for (let i = 0; i < maNeeded; i++) {
      const slot = document.createElement("div");
      slot.className = `employee-slot ${
        i < recruitedEmployees ? "filled" : ""
      }`;
      dom.employeeSlotsContainer.appendChild(slot);
    }
  } else {
    dom.nextMilestone.innerHTML = "Höchste Stufe erreicht!";
    dom.careerProgressPercentage.textContent = "100%";
    updateCircleProgress(dom.fortschrittKreisKarriere, 40, 100);
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
    summary.className = "p-4 font-semibold text-skt-blue cursor-pointer";
    summary.textContent = `Passive Mitarbeiter (${passiveMembers.length}) anzeigen`;
    details.appendChild(summary);

    const container = document.createElement("div");
    // NEU: Scrollbar hinzufügen, wenn die Liste zu lang wird
    container.className = "p-4 pt-0 space-y-3 max-h-96 overflow-y-auto";

    passiveMembers.forEach((member) => {
      const passiveCard = document.createElement("div");
      passiveCard.className =
        "p-3 bg-skt-grey-light rounded-lg flex justify-between items-center";
      passiveCard.innerHTML = `<div><p class="font-bold text-skt-blue">${member.name}</p><p class="text-sm text-skt-blue-light">${member.position}</p></div><button data-userid="${member.id}" class="switch-view-btn text-skt-blue-light hover:text-skt-blue-main transition-colors" title="Zur Ansicht wechseln"><i class="fas fa-eye"></i></button>`;
      passiveCard
        .querySelector(".switch-view-btn")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          const userId = e.currentTarget.dataset.userid;
          if (userId) fetchAndRenderDashboard(userId);
        });
      container.appendChild(passiveCard);
    });
    details.appendChild(container);
    dom.passiveMembersSection.appendChild(details);
  }
}

function createMemberCardGrid(member, totalDaysInCycle, daysPassedInCycle) {
    const ehPercentage = isMoneyView ? 0 : (member.ehGoal > 0 ? (member.ehCurrent / member.ehGoal * 100) : 0);
    const etPercentage = member.etGoal > 0 ? (member.etCurrent / member.etGoal * 100) : 0;
    const ehColorHex = getProgressColorHex(member.ehCurrent, member.ehGoal, totalDaysInCycle, daysPassedInCycle);
    const prognosis = getPrognosis(member.ehCurrent, member.ehGoal, totalDaysInCycle, daysPassedInCycle);
    
    const ehValue = isMoneyView ? (member.earnings?.structure || 0) : member.ehCurrent;
    const ehGoal = isMoneyView ? 0 : member.ehGoal;
    const ehUnit = isMoneyView ? "Verdienst" : "Einheiten";
    const ehDisplayValue = isMoneyView
        ? ehValue.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
        : `${ehValue.toLocaleString("de-DE", {
            maximumFractionDigits: 0,
          })} / ${ehGoal.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg transition-shadow hover:shadow-xl flex flex-col';

    const summary = document.createElement('div');
    summary.className = 'p-4 cursor-pointer flex-grow';

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.min(ehPercentage, 100) / 100);
    
    const pos = member.position || "";
    let positionHtml = '';
    if (pos && !pos.toLowerCase().includes("trainee")) {
        positionHtml = `<p class="text-sm text-skt-blue-light">${member.originalPosition || member.position}</p>`;
    }
    const prognosisHtml = !isMoneyView ? `<p class="text-sm ${prognosis.colorClass} font-semibold">${prognosis.text}</p>` : '';

    summary.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="min-w-0">
                <p class="font-bold text-skt-blue text-lg break-words">${member.leaderName || member.name}</p>
                ${positionHtml || prognosisHtml}
            </div>
            <div class="flex items-center space-x-2">
                 <button data-userid="${member.id}" class="switch-view-btn text-skt-blue-light hover:text-skt-blue-main transition-colors" title="Zur Ansicht wechseln"><i class="fas fa-eye"></i></button>
                 <i class="fas fa-chevron-down chevron-icon text-skt-blue-light"></i>
            </div>
        </div>
        <div class="flex justify-center items-center flex-col">
            <div class="w-40 h-40 relative">
                <svg class="team-progress-circle w-full h-full" viewBox="0 0 100 100">
                    <circle class="bg-circle" cx="50" cy="50" r="${radius}"></circle>
                    <circle class="progress-arc" cx="50" cy="50" r="${radius}" 
                            style="stroke: ${ehColorHex}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};"></circle>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center flex-col text-center px-2">
                    <p class="text-base sm:text-lg font-bold" style="color: ${ehColorHex}; font-size: clamp(0.75rem, 4vw, 1.125rem);">${ehDisplayValue}</p>
                    <p class="text-xs text-skt-blue-light">${ehUnit}</p>
                </div>
            </div>
        </div>
        <div class="mt-4 px-2">
            <div class="flex justify-between items-baseline text-xs">
                <p class="text-skt-blue-light">ET Termine</p>
                <p class="font-semibold text-skt-blue">${member.etCurrent} / ${member.etGoal}</p>
            </div>
            <div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden mt-1">
                 <div class="h-full bg-skt-green-accent" style="width: ${Math.min(etPercentage, 100)}%;"></div>
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
    if (isLeader) {
        summary.addEventListener('click', (e) => { if (!e.target.closest('.switch-view-btn')) { details.classList.toggle('open'); summary.classList.toggle('open'); } });
    } else {
        summary.querySelector('.chevron-icon').classList.add('hidden'); // Pfeil ausblenden
    }

    summary.querySelector('.switch-view-btn').addEventListener('click', (e) => { 
        e.stopPropagation();
        const newuserId = e.currentTarget.dataset.userid;
        if (newuserId) {
            viewHistory.push(newuserId);
            fetchAndRenderDashboard(newuserId);
        }
    });

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
    const prognosis = getPrognosis(
        member.ehCurrent,
        member.ehGoal,
        totalDaysInCycle,
        daysPassedInCycle
    );
    const etPercentage =
        member.etGoal > 0 ? (member.etCurrent / member.etGoal) * 100 : 0;

    const ehValue = isMoneyView
        ? member.earnings?.structure || 0
        : member.ehCurrent;
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
    const prognosisHtml = !isMoneyView
        ? `<span class="font-semibold text-sm ${prognosis.colorClass}" data-tooltip="Prognose basierend auf dem aktuellen Fortschritt im Verhältnis zur vergangenen Zeit im Monat.">${prognosis.text}</span>`
        : "";
    summary.innerHTML = `<div class="flex justify-between items-start gap-2"><div class="min-w-0"><p class="font-bold text-skt-blue text-lg break-words">${
        member.leaderName || member.name
    }</p>${positionHtml}</div><div class="flex items-center space-x-4 flex-shrink-0">${prognosisHtml}<button data-userid="${
        member.id
    }" class="switch-view-btn text-skt-blue-light hover:text-skt-blue-main transition-colors" title="Zur Ansicht wechseln"><i class="fas fa-eye"></i></button><i class="fas fa-chevron-down chevron-icon text-skt-blue-light"></i></div></div><div class="mt-2"><div class="flex justify-between items-baseline"><p class="text-xs text-skt-blue-light">${ehUnit}</p><p class="text-xs font-semibold text-skt-blue">${ehDisplayValue} ${ehGoalDisplay}</p></div>${
        !isMoneyView
        ? `<div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden mt-1"><div class="h-full ${ehColorClass}" style="width: ${Math.min(
            ehPercentage,
            100
            )}%;"></div></div>`
        : ""
    }</div><div class="mt-2"><div class="flex justify-between items-baseline"><p class="text-xs text-skt-blue-light">ET Termine</p><p class="text-xs font-semibold text-skt-blue">${
        member.etCurrent
    } / ${
        member.etGoal
    }</p></div><div class="w-full bg-skt-grey-medium h-2.5 rounded-full overflow-hidden mt-1"><div class="h-full bg-skt-green-accent" style="width: ${Math.min(
        etPercentage,
        100
    )}%;"></div></div></div>`;
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
    if (isLeader) {
        summary.addEventListener("click", (e) => {
            if (!e.target.closest(".switch-view-btn")) {
                details.classList.toggle("open");
                summary.classList.toggle("open");
            }
        });
    } else {
        summary.querySelector('.chevron-icon').classList.add('hidden'); // Pfeil ausblenden
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
    summary.querySelector(".switch-view-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const newuserId = e.currentTarget.dataset.userid;
        if (newuserId) {
        viewHistory.push(newuserId);
        fetchAndRenderDashboard(newuserId);
        }
    });
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

  const augmentedDataStore = fullDataStore.map((data) => ({
    ...data,
    earnings: earningsMap[data.id] || { personal: 0, group: 0, structure: 0 },
  }));
  // --- ENDE OPTIMIERTER DATENABRUF ---

  personalData = augmentedDataStore.find((d) => d.id === mitarbeiterId) || {};
  await checkAndApplyAutomaticPromotion(
    mitarbeiterId,
    personalData.totalCurrentEh
  );

  currentlyViewedUserData = user;
  dom.welcomeHeader.textContent = `Willkommen, ${user.Name}`;
  dom.userPosition.textContent = user.Karrierestufe;

  // KORREKTUR: Verwende die robustere isUserLeader-Funktion, um zu bestimmen, ob die Führungsansicht angezeigt werden soll.
  const isLeader = isUserLeader(user);
  if (isLeader) {
    teamData = await calculateGroupOrStructureData(
      mitarbeiterId,
      "gruppe",
      augmentedDataStore
    );
    structureData = await calculateGroupOrStructureData(
      mitarbeiterId,
      "struktur",
      augmentedDataStore
    );

    currentPlanningView = "team";
    dom.teamViewBtn.classList.add("active");
    dom.personalViewBtn.classList.remove("active");
    dom.strukturViewBtn.classList.remove("active");
    dom.monthlyPlanningTitle.textContent = "Gruppen-Übersicht";
    updateMonthlyPlanningView(teamData);
    updateLeadershipView();
  } else {
    currentPlanningView = "personal";
    dom.monthlyPlanningTitle.textContent = "Deine Monatsplanung";
    updateMonthlyPlanningView(personalData);
    updateEmployeeCareerView();
  }

  dom.employeeView.classList.toggle("hidden", isLeader);
  dom.leadershipView.classList.toggle("hidden", !isLeader);
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
}

async function renderSuperuserView() {
  isSuperuserView = true;
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
async function fetchAndRenderOnboarding(mitarbeiterId) {
  const user = findRowById("mitarbeiter", mitarbeiterId);
  if (!user) return;

  const position = user.Karrierestufe || "";
  const isTrainee = position.toLowerCase().includes("trainee");

  if (isTrainee) {
    dom.einarbeitungTitle.textContent = "Dein Einarbeitungsplan";
    dom.leaderOnboardingView.classList.add("hidden");
    dom.traineeOnboardingView.classList.remove("hidden");
    await renderTraineeOnboardingView(mitarbeiterId);
  } else {
    currentOnboardingSubView = "leader-list";
    dom.einarbeitungTitle.textContent = "Einarbeitung: Gruppen-Übersicht";
    dom.traineeOnboardingView.classList.add("hidden");
    dom.leaderOnboardingView.classList.remove("hidden");
    let teamMembers = getSubordinates(mitarbeiterId, "gruppe");
    teamMembers = teamMembers.filter(member => member && member.Startdatum);
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
    getOnboardingProgressForTrainee(member._id).then((data) => ({
      member,
      data,
    }))
  );
  const results = await Promise.all(progressPromises);

  for (const { member, data: progressData } of results) {
    if (progressData.totalSteps > 0) {
      const card = document.createElement("div");
      card.className =
        "bg-skt-grey-light p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-colors";
      card.dataset.traineeId = member._id;
      card.innerHTML = `
                           <div class="flex justify-between items-center mb-1">
                               <p class="font-bold text-skt-blue">${
                                 member.Name
                               }</p>
                               <p class="font-semibold text-skt-blue-light">${progressData.percentage.toFixed(
                                 0
                               )}%</p>
                           </div>
                           <div class="w-full bg-gray-200 rounded-full h-4 shadow-inner relative">
                               <div class="bg-red-300 h-4 rounded-full absolute top-0 left-0 transition-all duration-700 ease-out" style="width: ${progressData.sollPercentage.toFixed(
                                 0
                               )}%; z-index: 1;" data-tooltip="Soll-Fortschritt"></div>
                               <div class="bg-skt-green-accent h-4 rounded-full absolute top-0 left-0 transition-all duration-700 ease-out" style="width: ${progressData.percentage.toFixed(
                                 0
                               )}%; z-index: 2;" data-tooltip="Ist-Fortschritt"></div>
                           </div>
                       `;
      card.addEventListener("click", () => showTraineeDetailView(member._id));
      container.appendChild(card);
    }
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
    return { percentage: 0, sollPercentage: 0, totalSteps: 0 };

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
    return { percentage: 0, sollPercentage: 0, totalSteps: 0 };

  const completedStepIds = new Set(
    userEinarbeitung.map((e) => e["Schritt_ID"])
  );
  const completedSteps = visibleSteps.filter((s) =>
    completedStepIds.has(s._id)
  ).length;
  const percentage = visibleSteps.length > 0 ? (completedSteps / visibleSteps.length) * 100 : 0;

  const userStartDate = user.Startdatum;
  let sollPercentage = 0;
  if (userStartDate) {
    const startDate = new Date(userStartDate);
    const overallStartDate = new Date(startDate);
    overallStartDate.setDate(
      startDate.getDate() + visibleSteps[0]["Tage nach Start"]
    );
    const overallEndDate = new Date(startDate);
    overallEndDate.setDate(
      startDate.getDate() + visibleSteps[visibleSteps.length - 1]["Tage nach Start"]
    );
    const today = getCurrentDate();
    const totalPlanDuration =
      overallEndDate.getTime() - overallStartDate.getTime();
    const elapsedPlanDuration = today.getTime() - overallStartDate.getTime();
    if (totalPlanDuration > 0) {
      sollPercentage = Math.max(
        0,
        Math.min(100, (elapsedPlanDuration / totalPlanDuration) * 100)
      );
    } else if (today >= overallStartDate) {
      sollPercentage = 100;
    }
  }

  return { percentage, sollPercentage, totalSteps: visibleSteps.length };
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
    isEditable && grundseminarCompleted, // Bearbeitung nur möglich, wenn Grundseminar fertig ist
    mitarbeiterId
  );
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
  const isAufbauseminar = container.id.includes('aufbauseminar');
  const grundseminarCompleted = dom.grundseminarStepsContainer.querySelectorAll('.timeline-item:not(.completed)').length === 0;

  if (isAufbauseminar && !grundseminarCompleted) {
      // KORREKTUR: Wendet den Blur-Effekt auf den Container an und platziert das Overlay daneben,
      // anstatt es zu verschachteln.
      const parentWrapper = container.parentElement;
      parentWrapper.classList.add('aufbauseminar-locked-wrapper');
      container.classList.add('aufbauseminar-blurred-content');
      const overlay = document.createElement('div');
      overlay.innerHTML = `<i class="fas fa-lock text-3xl text-skt-blue-light mb-2"></i><p class="font-semibold text-skt-blue">Wird nach Abschluss des Grundseminars freigeschaltet.</p>`;
      overlay.className = 'aufbauseminar-locked-overlay';
      parentWrapper.appendChild(overlay);
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

    let checkboxHtml = '';
    if (isEditable) {
        // Die Standard-Checkbox wird durch eine benutzerdefinierte, gestylte Checkbox ersetzt.
        checkboxHtml = `
            <div class="onboarding-step-toggle custom-checkbox ${step.completed ? 'checked' : ''}" data-step-id="${step._id}" data-trainee-id="${traineeId}" title="Status ändern">
                <div class="custom-checkbox-tick"></div>
            </div>
        `;
    }

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    let statusClass = step.completed
      ? "completed"
      : step.dueDate < threeDaysAgo // KORREKTUR: Erst nach 3 Tagen als "due" markieren
      ? "due"
      : "future";

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
                                <p class="timeline-title">${step.Schritt}</p>
                                <p class="timeline-duedate">Fällig bis: ${formattedDate}</p>
                            </div>
                            ${checkboxHtml}
                        </div>
                    </div>
                `;

    // Klick-Listener aufteilen: Klick auf Checkbox ändert Status, Klick auf Rest öffnet Modal.
    const contentArea = stepEl.querySelector(".timeline-content");
    contentArea.addEventListener("click", (e) => {
        // Verhindert, dass das Modal aufgeht, wenn auf die Checkbox geklickt wird.
        if (e.target.closest('.onboarding-step-toggle')) {
            return;
        }
        dom.hinweisModalContent.textContent = step.Hinweis || "Kein Hinweis verfügbar.";
        dom.hinweisModal.classList.add("visible");
        document.body.classList.add("modal-open");
        document.documentElement.classList.add("modal-open");
    });

    container.appendChild(stepEl);
  });

  if (isEditable) {
    container.querySelectorAll('.onboarding-step-toggle').forEach(toggle => {
        toggle.addEventListener('click', handleOnboardingStepToggle);
    });
  }
}

function renderDateMarkers(container, startDate, endDate) {
    clearChildren(container);
    const totalDuration = endDate.getTime() - startDate.getTime();
    if (totalDuration <= 0) return;

    const today = new Date();
    const elapsedDuration = today.getTime() - startDate.getTime();
    const timeProgressPercent = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));

    // Start- und Enddatum Marker
    const createMarker = (date, topPercent) => {
        const marker = document.createElement('div');
        marker.className = 'timeline-date-marker';
        marker.style.top = `${topPercent}%`;
        marker.textContent = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        container.appendChild(marker);
    };

    createMarker(startDate, 0);
    createMarker(endDate, 100);

    // "Heute" Marker
    if (today >= startDate && today <= endDate) {
        const todayMarker = document.createElement('div');
        todayMarker.className = 'timeline-date-marker font-bold text-skt-red-accent';
        todayMarker.style.top = `${timeProgressPercent}%`;
        todayMarker.textContent = 'Heute';
        container.appendChild(todayMarker);
    }
}

async function handleOnboardingStepToggle(event) {
    const checkboxElement = event.currentTarget;
    const stepId = checkboxElement.dataset.stepId;
    const traineeId = checkboxElement.dataset.traineeId;
    const isCompleted = !checkboxElement.classList.contains('checked'); // Der neue Status ist das Gegenteil vom aktuellen

    // UI sofort aktualisieren und Interaktion sperren
    checkboxElement.style.pointerEvents = 'none';
    checkboxElement.style.opacity = '0.5';

    let success = false;
    if (isCompleted) {
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
    const current = new Date(date);
    current.setHours(0, 0, 0, 0);
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
        this.umsatzTab = null;
        this.immoTab = null; // NEU
        this.netzwerkTab = null;
        this.statsChartTitle = null;
        this.statsPieChartContainer = null;
        this.statsPieChartLegend = null;
        this.statsByEmployeeBtn = null;
        // NEU: DOM-Elemente für die neue Statistik-Sektion
        this.statsScopeFilter = null;
        this.statsCategoryFilterBtn = null;
        this.statsCategoryFilterPanel = null;
        this.statsMonthTimeline = null;
        this.statsPeriodDisplay = null; // Beibehalten für die Wochenanzeige
        this.statsNavPrevBtn = null;    // Beibehalten für die Navigation
        this.statsNavNextBtn = null;    // Beibehalten für die Navigation
        this.statsViewCalendarBtn = null;
        this.statsViewTableBtn = null;
        this.statsCalendarView = null;
        this.statsTableView = null;
        this.statsByStatusBtn = null;
        this.outstandingAppointmentsSection = null;
        this.statsTableSortConfig = {
            column: 'Datum',
            direction: 'desc'
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
        this.initialized = false;
        this.currentUserId = null;
        this.allAppointments = [];
        this.currentTab = 'umsatz';
        this.downline = [];
        this.sortColumn = 'Datum';
        this.sortDirection = 'desc';
        this.filterText = '';
        this.statsChartMode = 'employee';
        this.showCancelled = false;
    }

    // Hilfsmethode, um DOM-Elemente zu holen, wird von init() aufgerufen.
    _getDomElements() {
        this.statsChartTitle = document.getElementById('stats-chart-title');
        this.statsPieChartContainer = document.getElementById('stats-pie-chart-container');
        this.statsPieChartLegend = document.getElementById('stats-pie-chart-legend');
        this.statsByEmployeeBtn = document.getElementById('stats-by-employee-btn');
        this.statsScopeFilter = document.getElementById('appointments-scope-filter'); // KORREKTUR: ID von appointments-scope-filter verwenden
        this.statsCategoryFilterBtn = document.getElementById('stats-category-filter-btn');
        this.statsCategoryFilterPanel = document.getElementById('stats-category-filter-panel');
        this.statsMonthTimeline = document.getElementById('stats-month-timeline');
        this.statsPeriodDisplay = document.getElementById('stats-period-display'); // Beibehalten
        this.statsNavPrevBtn = document.getElementById('stats-nav-prev-btn');       // Beibehalten
        this.statsNavNextBtn = document.getElementById('stats-nav-next-btn');       // Beibehalten
        this.statsViewCalendarBtn = document.getElementById('stats-view-calendar-btn');
        this.statsViewTableBtn = document.getElementById('stats-view-table-btn');
        this.statsCalendarView = document.getElementById('stats-calendar-view');
        this.statsTableView = document.getElementById('stats-table-view');
        this.statsByStatusBtn = document.getElementById('stats-by-status-btn');
        this.outstandingAppointmentsSection = document.getElementById('outstanding-appointments-section');
        this.outstandingAppointmentsList = document.getElementById('outstanding-appointments-list');
        this.prognosisDetailsContainer = document.getElementById('prognosis-details-container');
        this.startDateInput = document.getElementById('appointments-start-date');
        this.endDateInput = document.getElementById('appointments-end-date');
        this.modal = document.getElementById('appointment-modal');
        this.form = document.getElementById('appointment-form');
        this.searchInput = document.getElementById('appointments-search-filter');
        // NEU: Gekapselte Analyse-Ansicht
        this.detailsContainer = document.getElementById('appointments-details-container');
        this.toggleDetailsCheckbox = document.getElementById('toggle-details-checkbox');
        this.searchResultsContainer = document.getElementById('appointments-search-results-container'); // NEU
        this.toggleAnalysisBtn = document.getElementById('toggle-analysis-visibility-btn');
        this.analysisContent = document.getElementById('analysis-content');
        this.statsViewPane = document.getElementById('stats-view-pane');
        this.heatmapViewPane = document.getElementById('heatmap-view-pane');
        this.statsTab = document.getElementById('analysis-stats-tab');
        this.heatmapTab = document.getElementById('analysis-heatmap-tab');
        this.heatmapGrid = document.getElementById('heatmap-grid');
        return this.statsPieChartContainer && this.prognosisDetailsContainer && this.startDateInput && this.endDateInput && this.modal && this.form && this.searchInput && this.searchResultsContainer && this.toggleAnalysisBtn && this.analysisContent && this.statsViewPane && this.heatmapViewPane && this.statsTab && this.heatmapTab && this.heatmapGrid && this.statsScopeFilter && this.statsCategoryFilterBtn && this.statsCategoryFilterPanel && this.statsMonthTimeline && this.statsPeriodDisplay && this.statsNavPrevBtn && this.statsNavNextBtn && this.outstandingAppointmentsSection && this.outstandingAppointmentsList && this.statsViewCalendarBtn && this.statsViewTableBtn && this.statsCalendarView && this.statsTableView;
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
        // NEU: Kalender auf die aktuelle Woche initialisieren
        const today = getCurrentDate();
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        this.calendarWeekStartDate = new Date(startOfWeek.setDate(diff));
        this.calendarWeekStartDate.setHours(0, 0, 0, 0);

        // KORREKTUR: Standard-Datum auf aktuellen Umsatzmonat (Geschäftszyklus) setzen
        const { startDate, endDate } = SKT_APP.getMonthlyCycleDates();
        this.startDateInput.value = startDate.toISOString().split('T')[0];
        this.endDateInput.value = endDate.toISOString().split('T')[0];

        this.downline = SKT_APP.getAllSubordinatesRecursive(this.currentUserId);
        this.statsScopeFilter.classList.toggle('hidden', !SKT_APP.isUserLeader(SKT_APP.authenticatedUserData));
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
        try {
            const startDateIso = this.startDateInput.value;
            const endDateIso = this.endDateInput.value;
            appointmentsLog(`1. Berechneter Zeitraum: ${startDateIso} bis ${endDateIso}`);

            // KORREKTUR: Da der Filter entfernt wurde, wird der Scope fest auf 'personal' gesetzt.
            const scope = this.statsScopeFilter.value; // KORREKTUR: Greift jetzt auf das korrekte Element zu
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
                    userIds.add(this.currentUserId);
                    this.downline.forEach(u => userIds.add(u._id));
                    break;
            }

            if (userIds.size === 0) {
                this.allAppointments = [];
                this.render();
                return;
            }

            const userNames = Array.from(userIds).map(id => SKT_APP.findRowById('mitarbeiter', id)?.Name).filter(Boolean);
            const userNamesSql = userNames.map(name => `'${SKT_APP.escapeSql(name)}'`).join(',');
            appointmentsLog(`2. Lade Termine für ${userNames.length} Mitarbeiter (Scope: ${scope})`);

            const query = `SELECT *, Mitarbeiter_ID FROM \`Termine\` WHERE \`Datum\` >= '${startDateIso}' AND \`Datum\` <= '${endDateIso}' AND \`Mitarbeiter_ID\` IN (${userNamesSql}) ORDER BY \`Datum\` DESC`;
            appointmentsLog('3. Sende SQL-Abfrage an die Datenbank...');
            const appointmentsRaw = await SKT_APP.seaTableSqlQuery(query, true); // convert_link_id: true
            appointmentsLog('4. Roh-Antwort von der Datenbank erhalten:', JSON.parse(JSON.stringify(appointmentsRaw)));
            
            this.allAppointments = SKT_APP.mapSqlResults(appointmentsRaw, 'Termine');
            appointmentsLog(`5. Antwort in ${this.allAppointments.length} Termin-Objekte umgewandelt.`);

            appointmentsLog('6. Rufe render() auf, um die Termine anzuzeigen.');
            this.render();
        } catch (error) {
            appointmentsLog('!!! FEHLER in fetchAndRender !!!', error);
            this.listContainer.innerHTML = `<div class="text-center py-16"><i class="fas fa-exclamation-triangle fa-4x text-red-400 mb-4"></i><h3 class="text-xl font-semibold text-skt-blue">Ein Fehler ist aufgetreten</h3><p class="text-gray-500 mt-2">${error.message}</p></div>`;
        }
        appointmentsLog('--- ENDE: fetchAndRender ---');
    }

    render() {
        appointmentsLog('--- START: render ---');

        this._renderAppointmentStats(); // NEU: Aufruf der Statistik-Render-Funktion
        this._renderOutstandingAppointments();
        // 1. Filter data
        let filteredAppointments = this.allAppointments.filter(t => {
            const isUmsatzTermin = ['AT', 'BT', 'ST'].includes(t.Kategorie);
            const isRecruitingTermin = t.Kategorie === 'ET';
            const isImmoTermin = t.Kategorie === 'Immo';
            const isNetzwerkTermin = t.Kategorie === 'NT';

            const tabMatch = (this.currentTab === 'umsatz' && isUmsatzTermin) || (this.currentTab === 'recruiting' && isRecruitingTermin) || (this.currentTab === 'immo' && isImmoTermin) || (this.currentTab === 'netzwerk' && isNetzwerkTermin);
            if (!tabMatch) return false;

            // KORREKTUR: Prüfe auf Status 'Storno' ODER das Absage-Flag
            if (!this.showCancelled && (t.Status === 'Storno' || t.Absage === true)) { // this.showCancelled is not defined anymore
                return false;
            }

            if (this.filterText) {
                const searchText = this.filterText.toLowerCase();
                const partner = (t.Terminpartner || '').toLowerCase();
                const mitarbeiter = (t.Mitarbeiter_ID?.[0]?.display_value || '').toLowerCase();
                if (!partner.includes(searchText) && !mitarbeiter.includes(searchText)) {
                    return false;
                }
            }
            return true;
        });

        // 2. Sort data
        const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
        filteredAppointments.sort((a, b) => {
            let valA = a[this.sortColumn];
            let valB = b[this.sortColumn];

            if (this.sortColumn === 'Mitarbeiter_ID') {
                valA = valA?.[0]?.display_value || '';
                valB = valB?.[0]?.display_value || '';
            }

            if (valA === null || valA === undefined) valA = '';
            if (valB === null || valB === undefined) valB = '';

            let comparison = 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else if (this.sortColumn === 'Datum') {
                comparison = new Date(valA) - new Date(valB);
            } else {
                comparison = collator.compare(String(valA), String(valB));
            }

            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        appointmentsLog(`Rendering ${filteredAppointments.length} appointments.`);

        // NEU: KPIs und Statistiken rendern, bevor die Tabelle gebaut wird
        this._renderStatsChart();
        this._renderPrognosisDetails();
        this._renderHeatmap();
        this._renderCalendar();

        if (filteredAppointments.length === 0) {
            return;
        }

        // 3. Build table
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'overflow-x-auto';

        const table = document.createElement('table');
        table.className = 'appointments-table';

        const isUmsatz = this.currentTab === 'umsatz';
        const isRecruiting = this.currentTab === 'recruiting';
        const columns = [
            { key: 'Datum', label: 'Datum' },
            { key: 'Terminpartner', label: isUmsatz ? 'Kunde' : 'Bewerber' },
            { key: 'Status', label: 'Status' },
            { key: 'Mitarbeiter_ID', label: 'Mitarbeiter' },
        ];
        if (isUmsatz) {
            columns.push({ key: 'Umsatzprognose', label: 'Umsatzprognose' });
        }
        if (isRecruiting) {
            columns.push({ key: 'Infoabend', label: 'Infoabend' });
        }

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.dataset.sortKey = col.key;
            let iconHtml = '<i class="fas fa-sort sort-icon"></i>';
            if (this.sortColumn === col.key) {
                iconHtml = this.sortDirection === 'asc' ? '<i class="fas fa-sort-up sort-icon active"></i>' : '<i class="fas fa-sort-down sort-icon active"></i>';
            }
            th.innerHTML = `${col.label} ${iconHtml}`;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        filteredAppointments.forEach(termin => {
            const tr = document.createElement('tr');
            const statusColorClass = this._getStatusColorClass(termin);
            tr.className = `border-l-4 ${statusColorClass} cursor-pointer`;
            tr.dataset.id = termin._id;

            columns.forEach(col => {
                const td = document.createElement('td');
                let value = termin[col.key];
                if (col.key === 'Mitarbeiter_ID') {
                    value = termin.Mitarbeiter_ID?.[0]?.display_value || 'N/A';
                } else if (col.key === 'Datum' || col.key === 'Infoabend') {
                    // NEU: Uhrzeit hinzufügen
                    value = value ? new Date(value).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr' : '-';
                } else if (col.key === 'Umsatzprognose') {
                    value = value ? value.toLocaleString('de-DE') + ' EH' : '-';
                }
                td.textContent = value || '-';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        tableWrapper.appendChild(table);

        appointmentsLog('--- ENDE: render ---');
    }

    setupEventListeners() {
        const debouncedFetch = _.debounce(() => this.fetchAndRender(), 300);
        this.startDateInput.addEventListener('change', debouncedFetch);
        this.endDateInput.addEventListener('change', debouncedFetch);
        // KORREKTUR: Navigation auf "Tag für Tag" umgestellt
        this.statsNavPrevBtn.addEventListener('click', () => this._navigateStats(-1));
        this.statsNavNextBtn.addEventListener('click', () => this._navigateStats(1));
        this.statsPeriodDisplay.addEventListener('click', () => this._scrollToTodayInTimeline());

        // NEU: Event Listener für den dynamischen Skalierungseffekt beim Scrollen
        this.statsMonthTimeline.addEventListener('scroll', _.throttle(() => {
            this._updateCardScales();
        }, 50));
        
        this.statsViewCalendarBtn.addEventListener('click', () => this._switchStatsView('calendar')); //FIXME: this is a bug
        this.statsViewTableBtn.addEventListener('click', () => this._switchStatsView('table'));


        // NEU: Event Listener für das Dropdown
        this.statsCategoryFilterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.statsCategoryFilterPanel.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => { if (!this.statsCategoryFilterPanel.contains(e.target)) this.statsCategoryFilterPanel.classList.add('hidden'); });
        
        // KORREKTUR: Event-Listener wiederhergestellt
        this.statsScopeFilter.addEventListener('change', () => this.fetchAndRender());
        this.searchInput.addEventListener('input', _.debounce((e) => this.handleLiveSearch(e.target.value), 350));

        // KORREKTUR: Event-Listener für die Statistik-Chart-Umschaltung wiederhergestellt
        this.statsByEmployeeBtn.addEventListener('click', () => { this.statsChartMode = 'employee'; this._updateStatsToggleButtons(); this._renderStatsChart(); });
        this.statsByStatusBtn.addEventListener('click', () => { this.statsChartMode = 'status'; this._updateStatsToggleButtons(); this._renderStatsChart(); });

        document.getElementById('add-appointment-btn-stats').addEventListener('click', () => this.openModal());
        document.getElementById('close-appointment-modal-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-appointment-btn').addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.closeModal(); });
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        document.getElementById('delete-appointment-btn').addEventListener('click', () => this.handleDelete());
        // NEU: Event Listener für den neuen Analyse-Container und die Tabs
        this.toggleAnalysisBtn.addEventListener('click', () => this._toggleCollapsible(this.analysisContent, this.toggleAnalysisBtn));
        this.statsTab.addEventListener('click', () => this._switchAnalysisTab('stats'));
        this.heatmapTab.addEventListener('click', () => this._switchAnalysisTab('heatmap'));
    }

    _updateStatusDropdown(category, currentStatus = null) {
        const statusSelect = this.form.querySelector('#appointment-status');
        const oldValue = currentStatus || statusSelect.value;
        statusSelect.innerHTML = '';

        const terminMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'termine');
        const allStatuses = terminMeta.columns.find(c => c.name === 'Status').data.options.map(o => o.name);
      //GROssbuchstaben! Also Weiterer ET, Weiterer BT, Offen, Verschoben usw.
        const baseStati = ['Ausgemacht', 'Gehalten', 'Verschoben', 'Offen'];
        let allowedStati = [...baseStati];

        if (category === 'BT') {
            allowedStati.push('Weiterer BT');
        } else if (category === 'ET') {
            allowedStati.push('Weiterer ET', 'Info Eingeladen', 'Info Bestätigt', 'Info Anwesend', 'Wird Mitarbeiter');
        } else if (category === 'Immo') {
            allowedStati.push('AV Termin', 'Besichtigung', 'Kredittermin');
        }
        
        const finalStati = allStatuses.filter(s => allowedStati.includes(s) || s === 'Storno');

        finalStati.forEach(stat => statusSelect.add(new Option(stat, stat)));

        if (finalStati.includes(oldValue)) {
            statusSelect.value = oldValue;
        }
    }

    _navigateStats(days) {
        const newDate = new Date(this.statsCurrentDate);
        newDate.setDate(newDate.getDate() + days);
        this.statsCurrentDate = newDate;
        // KORREKTUR: Scrollt zum neuen Datum in der Timeline, anstatt alles neu zu rendern.
        const dateString = newDate.toISOString().split('T')[0];
        const targetCard = this.statsMonthTimeline.querySelector(`[data-date="${dateString}"]`);
        if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
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
        this.statsCalendarView.classList.toggle('hidden', view !== 'calendar');
        this.statsTableView.classList.toggle('hidden', view !== 'table');
        this.statsViewCalendarBtn.classList.toggle('active', view === 'calendar');
        this.statsViewTableBtn.classList.toggle('active', view === 'table');
    }
    _populateCategoryFilter() {
        const terminMeta = METADATA.tables.find(t => t.name.toLowerCase() === 'termine');
        if (!terminMeta) return;

        const categoryColumn = terminMeta.columns.find(c => c.name === 'Kategorie');
        if (!categoryColumn || !categoryColumn.data || !categoryColumn.data.options) return;

        this.statsCategoryFilterPanel.innerHTML = '';
        const categories = categoryColumn.data.options.map(o => o.name);
        
        const relevantCategories = ['AT', 'BT', 'ST', 'ET', 'Immo', 'NT'];

        const createCheckbox = (label, value, isChecked = false) => {
            const wrapper = document.createElement('label');
            wrapper.className = 'flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'h-5 w-5 rounded border-gray-300 text-skt-blue focus:ring-skt-blue-light';
            checkbox.value = value;
            checkbox.checked = isChecked;
            checkbox.addEventListener('change', () => {
                this._renderAppointmentStats();
            });
            const span = document.createElement('span');
            span.textContent = label;
            wrapper.appendChild(checkbox);
            wrapper.appendChild(span);
            this.statsCategoryFilterPanel.appendChild(wrapper);        };

        categories.filter(cat => relevantCategories.includes(cat)).forEach(cat => createCheckbox(cat, cat, true));
    }

    // NEU: Funktion zum Berechnen und Anzeigen der Termin-Statistiken
    _renderAppointmentStats() {
        // KORREKTUR: Da der Filter entfernt wurde, wird der Scope fest auf 'personal' gesetzt.
        const scope = 'personal';
        const userIds = new Set();
        switch (scope) {
            case 'personal':
                userIds.add(this.currentUserId);
                break;
            case 'group':
                userIds.add(this.currentUserId);
                SKT_APP.getSubordinates(this.currentUserId, 'gruppe').forEach(u => userIds.add(u._id));
                break;
            case 'structure':
                userIds.add(this.currentUserId);
                this.downline.forEach(u => userIds.add(u._id));
                break;
        }

        const today = getCurrentDate();
        const monthName = today.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
        this.statsPeriodDisplay.textContent = monthName;

        const selectedCheckboxes = this.statsCategoryFilterPanel.querySelectorAll('input[type="checkbox"]:checked');
        const selectedCategories = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (selectedCategories.length === 0) {
            this.statsCategoryFilterBtn.textContent = 'Keine Auswahl';
        } else if (selectedCategories.length === this.statsCategoryFilterPanel.querySelectorAll('input').length) {
            this.statsCategoryFilterBtn.textContent = 'Alle Kategorien';
        } else {
            this.statsCategoryFilterBtn.textContent = selectedCategories.join(', ');
        }
        // KORREKTUR: Greife auf die bereits gefilterten Termine der Ansicht zu (`this.allAppointments`),
        // anstatt auf die globalen, ungefilterten `db.termine`. Dies ist die Kernursache des Fehlers.
        const relevantAppointments = this.allAppointments.filter(t => {
            const categoryMatch = selectedCategories.length === 0 ? false : selectedCategories.includes(t.Kategorie);
            return t.Datum && categoryMatch;
        });
        // KORREKTUR: Um Zeitzonenprobleme endgültig zu vermeiden, wird der Termin einfach
        // anhand des reinen Datum-Strings (YYYY-MM-DD) gruppiert, ohne ihn in ein Date-Objekt umzuwandeln.
        // Dies stellt sicher, dass ein Termin vom 09.09. immer am 09.09. angezeigt wird, egal um welche Uhrzeit.
        const appointmentsByDay = _.groupBy(relevantAppointments, t => {
            return t.Datum ? t.Datum.split(/ |T/)[0] : null;
        });

        // KORREKTUR: Die gefilterten Termine müssen vor dem Rendern der Tabelle sortiert werden.
        const sortedAppointments = this._sortStatsTableData(relevantAppointments);
        this._renderStatsTable(sortedAppointments);

        this.statsMonthTimeline.innerHTML = '';

        const categoryColors = {
            'AT': 'bg-skt-green-accent',
            'BT': 'bg-skt-blue-accent',   // KORREKTUR: 'bg-skt-blue-accent' statt 'bg-skt-blue-main'
            'ST': 'bg-skt-yellow-accent',// Gelb
            'ET': 'bg-accent-gold',      // Gold
            'Immo': 'bg-accent-immo',    // Türkis
            'NT': 'bg-accent-purple',    // Lila
            'default': 'bg-skt-grey-medium' // Grau
        };

        const viewStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const viewEndDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

        // Hilfsfunktion, um ein Datum in YYYY-MM-DD umzuwandeln, ohne die Zeitzone zu ändern.
        const toLocalISOString = (date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        for (let d = new Date(viewStartDate); d <= viewEndDate; d.setDate(d.getDate() + 1)) {
            const dateString = toLocalISOString(d); // KORREKTUR: Zeitzonen-sichere Umwandlung verwenden.
            const appointmentsForDay = (appointmentsByDay[dateString] || []).sort((a,b) => new Date(a.Datum) - new Date(b.Datum));
            const isToday = d.toDateString() === new Date().toDateString();

            const dayCard = document.createElement('div');
            dayCard.className = `day-card flex-shrink-0 w-56 h-full bg-white rounded-xl p-3 flex flex-col border-2 ${isToday ? 'border-skt-green-accent' : 'border-gray-200'}`;
            dayCard.dataset.date = dateString; // NEU: Datum als Attribut für die Navigation hinzufügen
            dayCard.className = `day-card flex-shrink-0 w-72 h-full bg-white rounded-xl p-3 flex flex-col border-2 ${isToday ? 'border-skt-green-accent' : 'border-gray-200'}`;
            if (isToday) dayCard.classList.add('is-today');

            let appointmentsHtml = '';
            if (appointmentsForDay.length > 0) {
                appointmentsHtml = appointmentsForDay.map(termin => {
                    const color = categoryColors[termin.Kategorie] || categoryColors['default'];
                    // KORREKTUR: Robuster Zugriff auf den Mitarbeiternamen. Die Datenquelle für `Mitarbeiter_ID`
                    // kann entweder eine einfache ID (String) oder ein Link-Objekt sein.
                    let mitarbeiterName = 'N/A';
                    if (termin.Mitarbeiter_ID && Array.isArray(termin.Mitarbeiter_ID) && termin.Mitarbeiter_ID[0]?.display_value) {
                        mitarbeiterName = termin.Mitarbeiter_ID[0].display_value;
                    } else if (typeof termin.Mitarbeiter_ID === 'string') {
                        mitarbeiterName = SKT_APP.findRowById('mitarbeiter', termin.Mitarbeiter_ID)?.Name || 'N/A';
                    }
                    // NEU: Uhrzeit des Termins extrahieren und formatieren
                    const terminTime = termin.Datum ? new Date(termin.Datum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';

                    return `<div class="p-1.5 rounded ${color} text-white text-xs mb-1.5 cursor-pointer" data-id="${termin._id}">
                                <div class="flex justify-between items-baseline"><p class="font-bold truncate">${termin.Terminpartner || 'Unbekannt'}</p><span class="font-normal opacity-90">${terminTime}</span></div>
                                <p class="opacity-80">${mitarbeiterName}</p>
                            </div>`;
                }).join('');
            } else {
                appointmentsHtml = '<div class="flex-grow flex items-center justify-center text-xs text-gray-400">Keine Termine</div>';
            }

            dayCard.innerHTML = `
                <div class="font-bold text-skt-blue mb-3">${d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
                <div class="flex-grow overflow-y-auto space-y-2 pr-1">${appointmentsHtml}</div>
            `;
            dayCard.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', (e) => this.openModal(relevantAppointments.find(t => t._id === e.currentTarget.dataset.id))));
            this.statsMonthTimeline.appendChild(dayCard);
        }
        this._scrollToTodayInTimeline();

        setTimeout(() => {
            this._scrollToTodayInTimeline();
            this._updateCardScales();
        }, 150);
        // Stellt sicher, dass nach dem Rendern zum heutigen Tag gescrollt wird.
        // Ein kleiner Timeout gibt dem Browser Zeit, die Elemente zu zeichnen.
        setTimeout(() => this._scrollToTodayInTimeline(), 100);
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
            tr.dataset.id = termin._id;
            const statusColorClass = this._getStatusColorClass(termin);
            tr.className = `border-l-4 ${statusColorClass} cursor-pointer`;
            
            // KORREKTUR: Der Mitarbeitername wird aus dem verknüpften Objekt ausgelesen, das von der API kommt.
            const mitarbeiterName = termin.Mitarbeiter_ID?.[0]?.display_value || 'N/A';
            tr.innerHTML = `
                <td>${new Date(termin.Datum).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>${termin.Terminpartner || '-'}</td>
                <td>${termin.Kategorie || '-'}</td>
                <td>${termin.Status || '-'}</td>
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
            this.statsTableSortConfig.direction = 'desc'; // Standardmäßig absteigend bei neuer Spalte
        }
        // Die Daten müssen nicht neu gefiltert, sondern nur neu gerendert werden.
        // Wir rufen _renderAppointmentStats auf, was wiederum _renderStatsTable mit den bereits gefilterten Daten aufruft.
        this._renderAppointmentStats();
    }

    _sortStatsTableData(appointments) {
        const { column, direction } = this.statsTableSortConfig;
        const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
        
        return appointments.sort((a, b) => {
            const valA = (column === 'Mitarbeiter_ID' ? (SKT_APP.findRowById('mitarbeiter', a.Mitarbeiter_ID)?.Name || '') : a[column]) || '';
            const valB = (column === 'Mitarbeiter_ID' ? (SKT_APP.findRowById('mitarbeiter', b.Mitarbeiter_ID)?.Name || '') : b[column]) || '';
            const comparison = collator.compare(String(valA), String(valB));
            return direction === 'asc' ? comparison : -comparison;
        });
    }

    _renderOutstandingAppointments() {
        const today = getCurrentDate();
        today.setHours(0, 0, 0, 0);

        const outstanding = this.allAppointments.filter(t => {
            if (!t.Datum || t.Status !== 'Ausgemacht') return false;
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
            // KORREKTUR: Der Mitarbeitername wird aus dem verknüpften Objekt ausgelesen.
            const mitarbeiterName = termin.Mitarbeiter_ID?.[0]?.display_value || 'N/A';
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

    _getStatusColorClass(termin) {
        if (termin.Kategorie === 'Immo') {
            return 'border-immo-accent';
        }
        if (termin.Absage === true || termin.Status === 'Storno') {
            return 'border-skt-red-accent';
        }
        switch (termin.Status) {
            case 'Ausgemacht': return 'border-skt-green-accent'; // Grün
            case 'Verschoben':
            case 'offen': return 'border-skt-red-accent'; // Rot
            case 'weiterer BT':
            case 'weiterer ET': return 'border-skt-blue-accent'; // Blau
            case 'Wird Mitarbeiter': return 'border-skt-gold-accent'; // Gold
            case 'Info Eingeladen': return 'border-skt-yellow-accent'; // Gelb
            case 'Info Bestätigt':
            case 'Info Anwesend': return 'border-accent-purple'; // Lila
            case 'Gehalten': return 'border-skt-grey-medium'; // Neutrales Grau für erledigt
            default: return 'border-gray-300'; // Standard
        }
    }

    _renderPrognosisDetails() {
        const container = this.prognosisDetailsContainer;
        if (!container) return;
        container.innerHTML = '';

        const prognosisByEmployee = {};

        this.allAppointments
            .filter(t => t.Kategorie === 'BT' && t.Status !== 'Storno' && t.Absage !== true && t.Umsatzprognose > 0)
            .forEach(t => {
                const employeeName = t.Mitarbeiter_ID?.[0]?.display_value || 'Unbekannt';
                prognosisByEmployee[employeeName] = (prognosisByEmployee[employeeName] || 0) + t.Umsatzprognose;
            });

        const sortedPrognosis = Object.entries(prognosisByEmployee)
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
            this.allAppointments.forEach(t => {
                const name = t.Mitarbeiter_ID?.[0]?.display_value || 'Unbekannt';
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
            this.allAppointments.forEach(t => {
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
    }

    openModal(termin = null) {
        appointmentsLog('--- START: openModal ---', termin ? `Editing term ID: ${termin?._id}` : 'Creating new term');
        try {
            this.form.reset();
            appointmentsLog('Form reset.');

            const title = this.modal.querySelector('#appointment-modal-title');
            const idInput = this.modal.querySelector('#appointment-id');
            const userSelect = this.modal.querySelector('#appointment-user');
            const deleteBtn = this.modal.querySelector('#delete-appointment-btn');
            const categorySelect = this.modal.querySelector('#appointment-category');
            appointmentsLog('Modal elements found.');

            // Dropdowns befüllen
            const allRelevantUsers = [SKT_APP.authenticatedUserData, ...this.downline].filter(Boolean);
            userSelect.innerHTML = '';
            allRelevantUsers.forEach(u => userSelect.add(new Option(u.Name, u._id)));
            appointmentsLog('User dropdown populated.');

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
                title.textContent = 'Termin bearbeiten';
                deleteBtn.classList.remove('hidden');
                idInput.value = termin._id;
                const user = allRelevantUsers.find(u => u.Name === termin.Mitarbeiter_ID?.[0]?.display_value);
                if (user) userSelect.value = user._id;
                
                // KORREKTUR: `datetime-local` erwartet das Format YYYY-MM-DDTHH:mm
                this.form.querySelector('#appointment-date').value = termin.Datum ? new Date(termin.Datum).toISOString().slice(0, 16) : '';
                categorySelect.value = termin.Kategorie || '';
                this.form.querySelector('#appointment-partner').value = termin.Terminpartner || '';
                this.form.querySelector('#appointment-prognose').value = termin.Umsatzprognose || '';
                this.form.querySelector('#appointment-referrals').value = termin.Empfehlungen || '';
                this.form.querySelector('#appointment-note').value = termin.Hinweis || '';
                this.form.querySelector('#appointment-cancellation').checked = termin.Absage || false;
                this.form.querySelector('#appointment-cancellation-reason').value = termin.Absagegrund || '';
                this.form.querySelector('#appointment-infoabend-date').value = termin.Infoabend ? termin.Infoabend.split('T')[0] : '';

                this._updateStatusDropdown(termin.Kategorie, termin.Status);
                this.toggleConditionalFields(termin.Kategorie, false);

            } else { // Add mode
                appointmentsLog('Entering add mode.');
                title.textContent = 'Termin anlegen';
                deleteBtn.classList.add('hidden');
                idInput.value = '';
                userSelect.value = this.currentUserId;
                // KORREKTUR: `datetime-local` erwartet das Format YYYY-MM-DDTHH:mm
                this.form.querySelector('#appointment-date').value = new Date().toISOString().slice(0, 16);

                // NEU: Standard-Kategorie basierend auf dem aktiven Tab setzen
                if (this.currentTab === 'umsatz') {
                    categorySelect.value = 'AT';
                } else if (this.currentTab === 'recruiting' || this.currentTab === 'netzwerk') {
                    categorySelect.value = 'ET';
                    // Wert im Hintergrund setzen, auch wenn das Feld nicht sichtbar ist
                    const nextInfoDate = findNextInfoDateAfter(getCurrentDate());
                    this.form.querySelector('#appointment-infoabend-date').value = nextInfoDate.toISOString().split('T')[0];
                } else if (this.currentTab === 'immo') {
                    categorySelect.value = 'Immo';
                }
                this._updateStatusDropdown(categorySelect.value);
                this.toggleConditionalFields(categorySelect.value, true);
            }

            this.form.querySelector('#appointment-cancellation-reason-container').classList.toggle('hidden', !this.form.querySelector('#appointment-cancellation').checked);
            
            this.modal.classList.add('visible');
            document.body.classList.add('modal-open');
            appointmentsLog('Modal is now visible.');

        } catch (error) {
            appointmentsLog('!!! ERROR in openModal !!!', error);
            alert('Ein Fehler ist beim Öffnen des Formulars aufgetreten. Details siehe Konsole.');
        }
        appointmentsLog('--- END: openModal ---');
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

    handleDelete() {
        const rowId = this.form.querySelector('#appointment-id').value;
        if (!rowId) return;
    
        // NEU: Benutzerdefiniertes Bestätigungs-Modal verwenden
        const confirmModal = document.getElementById('confirm-modal');
        const confirmOkBtn = document.getElementById('confirm-modal-ok-btn');
        const confirmCancelBtn = document.getElementById('confirm-modal-cancel-btn');
        document.getElementById('confirm-modal-text').textContent = 'Möchten Sie diesen Termin wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.';
    
        confirmModal.classList.add('visible');
    
        const handleOk = async () => {
            const success = await SKT_APP.seaTableDeleteRow('Termine', rowId);
            if (success) {
                this.closeModal(); // Schließt das Bearbeitungs-Modal
                // KORREKTUR: Entferne den gelöschten Termin aus dem lokalen Datenbestand,
                // damit er sofort aus allen Ansichten (Kalender, Tabelle) verschwindet.
                const indexToRemove = this.allAppointments.findIndex(t => t._id === rowId);
                if (indexToRemove > -1) this.allAppointments.splice(indexToRemove, 1);
                
                await this.fetchAndRender();
            } else {
                alert('Fehler beim Löschen des Termins.');
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
            const isCancellation = this.form.querySelector('#appointment-cancellation').checked;

            // Log individual form values
            const mitarbeiterId = this.form.querySelector('#appointment-user').value;
            const datum = this.form.querySelector('#appointment-date').value;
            const kategorie = this.form.querySelector('#appointment-category').value;
            const status = this.form.querySelector('#appointment-status').value;
            const terminpartner = this.form.querySelector('#appointment-partner').value;
            const prognoseRaw = this.form.querySelector('#appointment-prognose').value;
            const empfehlungenRaw = this.form.querySelector('#appointment-referrals').value;
            const hinweis = this.form.querySelector('#appointment-note').value;
            const absagegrund = this.form.querySelector('#appointment-cancellation-reason').value;
            const infoabend = this.form.querySelector('#appointment-infoabend-date').value;

            const rowData = {
                [SKT_APP.COLUMN_MAPS.termine.Mitarbeiter_ID]: [mitarbeiterId],
                [SKT_APP.COLUMN_MAPS.termine.Datum]: datum,
                [SKT_APP.COLUMN_MAPS.termine.Kategorie]: kategorie,
                [SKT_APP.COLUMN_MAPS.termine.Status]: isCancellation ? 'Storno' : status,
                [SKT_APP.COLUMN_MAPS.termine.Terminpartner]: terminpartner,
                [SKT_APP.COLUMN_MAPS.termine.Umsatzprognose]: parseFloat(prognoseRaw) || null,
                [SKT_APP.COLUMN_MAPS.termine.Empfehlungen]: parseInt(empfehlungenRaw) || null,
                [SKT_APP.COLUMN_MAPS.termine.Hinweis]: hinweis,
                [SKT_APP.COLUMN_MAPS.termine.Absage]: isCancellation,
                [SKT_APP.COLUMN_MAPS.termine.Absagegrund]: isCancellation ? absagegrund : '',
                [SKT_APP.COLUMN_MAPS.termine.Infoabend]: kategorie === 'ET' ? infoabend : null,
            };

            appointmentsLog('Constructed rowData object for API:', JSON.parse(JSON.stringify(rowData)));

            const success = rowId 
                ? await SKT_APP.seaTableUpdateRow('Termine', rowId, rowData)
                : await SKT_APP.seaTableAddRow('Termine', rowData);

            appointmentsLog(`API call finished. Success: ${success ? 'true' : 'false'}`);

            if (success) {
                appointmentsLog('API call successful. Showing success message and refreshing.');
                
                saveBtnText.textContent = 'Gespeichert!';
                saveBtnLoader.classList.add('hidden');
                saveBtnText.classList.remove('hidden');
                saveBtn.classList.remove('bg-skt-blue', 'hover:bg-skt-blue-light');
                saveBtn.classList.add('bg-skt-green-accent');

                // KORREKTUR: fetchAndRender() ist der korrekte Weg. Es lädt die Daten für den
                // aktuellen Filterbereich neu und füllt `this.allAppointments`, worauf
                // jetzt auch die Statistik-Ansicht zugreift.
                await this.fetchAndRender(); // Rendert jetzt alles mit den frischesten Daten.

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

    // NEU: Methode zum Rendern der Heatmap
    _renderHeatmap() {
        if (!this.heatmapGrid) return;
        this.heatmapGrid.innerHTML = '';

        const { startDate, endDate } = SKT_APP.getMonthlyCycleDates();
        const appointmentsByDay = _.groupBy(this.allAppointments, t => t.Datum ? t.Datum.split('T')[0] : null);
        
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
            const dateString = currentDate.toISOString().split('T')[0];
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
        const appointmentsByDay = _.groupBy(this.allAppointments, t => t.Datum ? t.Datum.split('T')[0] : null);

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
                        const clickedTermin = this.allAppointments.find(t => t._id === e.currentTarget.dataset.id);
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
        const appointmentsForDay = this.allAppointments.filter(t => t.Datum && t.Datum.startsWith(dateString));
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

    // NEU: Funktion für die Live-Suche
    async handleLiveSearch(searchText) {
        if (searchText.length < 3) {
            this.searchResultsContainer.classList.add('hidden');
            return;
        }

        this.searchResultsContainer.classList.remove('hidden');
        this.searchResultsContainer.innerHTML = '<div class="loader mx-auto my-4"></div>';

        try {
            const escapedText = SKT_APP.escapeSql(searchText);
            const query = `
                SELECT * 
                FROM \`Termine\` 
                WHERE \`Terminpartner\` LIKE '%${escapedText}%' 
                   OR \`Mitarbeiter_ID\` LIKE '%${escapedText}%'
                ORDER BY \`Datum\` DESC
                LIMIT 20
            `;
            
            const resultsRaw = await SKT_APP.seaTableSqlQuery(query, true);
            const results = SKT_APP.mapSqlResults(resultsRaw, 'Termine');

            this.renderSearchResults(results);
        } catch (error) {
            console.error('Fehler bei der Live-Suche:', error);
            this.searchResultsContainer.innerHTML = '<p class="text-red-500 text-center p-4">Fehler bei der Suche.</p>';
        }
    }

    // NEU: Funktion zum Rendern der Suchergebnisse
    renderSearchResults(results) {
        if (results.length === 0) {
            this.searchResultsContainer.innerHTML = '<p class="text-gray-500 text-center p-4">Keine Termine gefunden.</p>';
            return;
        }

        const listHtml = results.map(termin => {
            const mitarbeiterName = termin.Mitarbeiter_ID?.[0]?.display_value || 'N/A';
            const terminDate = termin.Datum ? new Date(termin.Datum).toLocaleDateString('de-DE') : 'Ohne Datum';
            const statusColorClass = this._getStatusColorClass(termin);

            return `
                <div data-id="${termin._id}" class="search-result-item flex items-center justify-between p-3 border-t border-gray-200 cursor-pointer hover:bg-skt-grey-light">
                    <div class="flex items-center gap-3">
                        <div class="w-1.5 h-8 rounded-full ${statusColorClass.replace('border-l-4', 'bg-').replace('border-', 'bg-')}"></div>
                        <div>
                            <p class="font-semibold text-skt-blue">${termin.Terminpartner || 'Unbekannt'}</p>
                            <p class="text-sm text-gray-500">${mitarbeiterName} am ${terminDate}</p>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-400"></i>
                </div>`;
        }).join('');

        this.searchResultsContainer.innerHTML = `<div class="bg-white rounded-lg border border-gray-200 shadow-md max-h-80 overflow-y-auto">${listHtml}</div>`;

        this.searchResultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                // Wir müssen den vollständigen Termin aus der DB laden, da die Suche evtl. nicht alle Felder hat
                const fullTermin = SKT_APP.db.termine.find(t => t._id === item.dataset.id) || results.find(t => t._id === item.dataset.id);
                if (fullTermin) {
                    this.openModal(fullTermin);
                }
            });
        });
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
    await appointmentsViewInstance.init(authenticatedUserData._id);
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
        // NEU: Zusätzliche Elemente für Robustheit
        this.addBtn = document.getElementById('add-potential-btn');
        this.downloadBtn = document.getElementById('download-template-btn');
        this.importBtn = document.getElementById('import-excel-btn');
        this.fileInput = document.getElementById('potential-import-input');
        return this.listContainer && this.modal && this.form && this.scheduleModal && this.scheduleForm && this.searchInput && this.scopeFilter && this.addBtn && this.downloadBtn && this.importBtn && this.fileInput;
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
        let filteredPotentials = this.allPotentials.filter(p => {
            if (this.filterText) {
                const searchText = this.filterText.toLowerCase();
                const partner = (p.Terminpartner || '').toLowerCase();
                const mitarbeiter = (p.Mitarbeiter_ID?.[0]?.display_value || '').toLowerCase();
                return partner.includes(searchText) || mitarbeiter.includes(searchText);
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

        const { startDate, endDate } = SKT_APP.getMonthlyCycleDates();
        this.startDateInput.value = startDate.toISOString().split('T')[0];
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
            const scope = this.scopeFilter.value;
            let userIds = new Set([this.currentUserId]);
            if (scope === 'group') SKT_APP.getSubordinates(this.currentUserId, 'gruppe').forEach(u => userIds.add(u._id));
            else if (scope === 'structure') this.downline.forEach(u => userIds.add(u._id));

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
            { key: 'Kunde', label: 'Kunde' }, { key: 'Mitarbeiter_ID', label: 'Mitarbeiter' },
            { key: 'EH', label: 'EH' }, { key: 'Gesellschaft_ID', label: 'Gesellschaft' },
            { key: 'Produkt_ID', label: 'Produkt' }
        ];
        table.innerHTML = `<thead><tr>${headers.map(h => `<th data-sort-key="${h.key}">${h.label} <i class="fas fa-sort sort-icon"></i></th>`).join('')}</tr></thead>`;
        const tbody = document.createElement('tbody');
        filteredData.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = 'cursor-pointer';
            tr.dataset.id = u._id;
            tr.innerHTML = `
                <td>${u.Kunde || '-'}</td>
                <td>${u.Mitarbeiter_ID?.[0]?.display_value || '-'}</td>
                <td>${u.EH || '-'}</td>
                <td>${u.Gesellschaft_ID?.[0]?.display_value || '-'}</td>
                <td>${u.Produkt_ID?.[0]?.display_value || '-'}</td>
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
        const boFields = this.form.querySelector('#umsatz-bo-fields');
        const deleteBtn = this.form.querySelector('#delete-umsatz-btn');

        this.form.querySelector('#save-umsatz-btn').disabled = false;
        this.form.querySelector('#save-umsatz-btn').textContent = 'Speichern';

        const allUsers = [SKT_APP.authenticatedUserData, ...this.downline].filter(Boolean);
        allUsers.sort((a, b) => a.Name.localeCompare(b.Name));

        const mitarbeiterSelect = this.form.querySelector('#umsatz-mitarbeiter');
        mitarbeiterSelect.innerHTML = '';
        allUsers.forEach(u => mitarbeiterSelect.add(new Option(u.Name, u._id)));

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
        row.className = 'grid grid-cols-1 sm:grid-cols-7 gap-x-4 gap-y-2 p-3 bg-skt-grey-light rounded-lg border border-gray-200 umsatz-row';
        
        const getDisplayColumnKey = (tableName, colName) => {
            const tableMeta = SKT_APP.METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
            const displayColumn = tableMeta?.columns.find(c => c.name === colName);
            return displayColumn?.key || '0000';
        };

        const gesellschaftenDisplayKey = getDisplayColumnKey('Gesellschaften', 'Gesellschaft');
        const produkteDisplayKey = getDisplayColumnKey('Produkte', 'Produkt');

        row.innerHTML = `
            <div class="sm:col-span-3"><label class="block text-xs font-medium text-gray-600">Produkt</label><select class="modern-select umsatz-produkt" required></select></div>
            <div class="sm:col-span-3"><label class="block text-xs font-medium text-gray-600">Gesellschaft</label><select class="modern-select umsatz-gesellschaft" required></select></div>
            <div class="sm:col-span-1"><label class="block text-xs font-medium text-gray-600">EH</label><input type="number" step="0.01" class="modern-input umsatz-eh" required></div>
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
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const saveBtn = this.form.querySelector('#save-umsatz-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Speichern...';

        const rowId = this.form.querySelector('#umsatz-id').value;
        const isEdit = !!rowId;

        const kunde = this.form.querySelector('#umsatz-kunde').value;
        const mitarbeiterId = this.form.querySelector('#umsatz-mitarbeiter').value;
        const hinweisBO = this.form.querySelector('#umsatz-hinweis-bo').value;
        const statusOK = this.form.querySelector('#umsatz-status-ok').checked;

        const umsatzRows = this.form.querySelectorAll('.umsatz-row');
        let allSuccess = true;

        for (const row of umsatzRows) {
            const produktId = row.querySelector('.umsatz-produkt').value;
            const gesellschaftId = row.querySelector('.umsatz-gesellschaft').value;
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
        this.currentTab = 'rangliste';
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
        this.naechstesInfoTab = document.getElementById('naechstes-info-tab');
        this.ranglisteView = document.getElementById('rangliste-view');
        this.aktivitaetenView = document.getElementById('aktivitaeten-view');
        this.aktivitaetenListContainer = document.getElementById('aktivitaeten-list-container');
        this.aktivitaetenRoleFilter = document.getElementById('aktivitaeten-role-filter');
        this.aktivitaetenDateRangeHint = document.getElementById('aktivitaeten-date-range-hint');
        this.fkRennlisteView = document.getElementById('fk-rennliste-view');
        this.naechstesInfoView = document.getElementById('naechstes-info-view');
        this.infoabendDateSelect = document.getElementById('infoabend-date-select');
        this.infoabendScopeFilter = document.getElementById('infoabend-scope-filter');
        this.infoabendShowCancelled = document.getElementById('infoabend-show-cancelled');
        this.infoabendListContainer = document.getElementById('infoabend-list-container');
        this.funnelChartContainer = document.getElementById('funnel-chart-container');

        return this.ranglisteTab && this.aktivitaetenTab && this.fkRennlisteTab && this.naechstesInfoTab && this.ranglisteView && this.aktivitaetenView && this.fkRennlisteView && this.naechstesInfoView;
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

        if (!this._getDomElements()) {
            auswertungLog('!!! FEHLER: Benötigte DOM-Elemente wurden nicht gefunden.');
            return;
        }

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
                this.updateTabs();
                this.renderCurrentView();
            });
        });

        document.querySelectorAll('.aktivitaeten-timespan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentAktivitaetenTimespan = e.currentTarget.dataset.timespan;
                document.querySelectorAll('.aktivitaeten-timespan-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderAktivitaeten();
            });
        });

        this.aktivitaetenRoleFilter.addEventListener('change', () => this.renderAktivitaeten());

        this.infoabendDateSelect.addEventListener('change', () => this.renderNaechstesInfo());
        this.infoabendScopeFilter.addEventListener('change', () => this.renderNaechstesInfo());
        this.infoabendShowCancelled.addEventListener('change', () => this.renderNaechstesInfo());
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
            case 'naechstes-info':
                await this.renderNaechstesInfo(true); // true to repopulate dates
                break;
        }
    }

    async renderRangliste() {
        this.ranglisteView.innerHTML = '<div class="loader mx-auto"></div>';
        const { startDate, endDate } = getMonthlyCycleDates();
        const startDateIso = startDate.toISOString().split('T')[0];
        const endDateIso = endDate.toISOString().split('T')[0];

        const query = `SELECT Mitarbeiter_ID, SUM(EH) as TotalEH FROM Umsatz WHERE Datum >= '${startDateIso}' AND Datum <= '${endDateIso}' GROUP BY Mitarbeiter_ID HAVING SUM(EH) >= 1`;
        const activeUsersRaw = await seaTableSqlQuery(query, true);
        const activeUsersData = mapSqlResults(activeUsersRaw || [], 'Umsatz');

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

        this.ranglisteView.innerHTML = '';
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

                const groupEl = document.createElement('div');
                groupEl.innerHTML = `<h3 class="text-xl font-bold text-skt-blue mb-3">${groupName}</h3>`;
                const tableWrapper = document.createElement('div');
                tableWrapper.className = 'overflow-x-auto';

                const table = document.createElement('table');
                table.className = 'appointments-table';
                // ANPASSUNG: "Rangstufe" entfernt
                const headers = [
                    { key: 'name', label: 'Name' },
                    { key: 'eh', label: 'Einheiten' },
                ];
                table.innerHTML = `<thead><tr>${headers.map(h => {
                    const icon = sortConfig.column === h.key ? (sortConfig.direction === 'asc' ? '<i class="fas fa-sort-up sort-icon active"></i>' : '<i class="fas fa-sort-down sort-icon active"></i>') : '<i class="fas fa-sort sort-icon"></i>';
                    return `<th data-sort-key="${h.key}">${h.label} ${icon}</th>`;
                }).join('')}</tr></thead>`;

                const tbody = document.createElement('tbody');
                usersInRank.forEach(user => {
                    // ANPASSUNG: Spaltenstruktur angepasst
                    tbody.innerHTML += `<tr><td>${user.name}</td><td>${user.eh.toFixed(2)}</td></tr>`;
                });
                table.appendChild(tbody);
                table.querySelectorAll('thead th').forEach(th => th.addEventListener('click', e => this._handleSort('rangliste', e.currentTarget.dataset.sortKey)));
                tableWrapper.appendChild(table);
                groupEl.appendChild(tableWrapper);
                this.ranglisteView.appendChild(groupEl);
            }
        }
    }

    async renderAktivitaeten() {
        this.aktivitaetenListContainer.innerHTML = '<div class="loader mx-auto"></div>';

        const { startDate, endDate } = this.currentAktivitaetenTimespan === 'woche'
            ? getWeeklyCycleDates()
            : getMonthlyCycleDates();

        this.aktivitaetenDateRangeHint.textContent = `Zeitraum: ${startDate.toLocaleDateString('de-DE')} - ${endDate.toLocaleDateString('de-DE')}`;

        const startDateIso = startDate.toISOString().split('T')[0];
        const endDateIso = endDate.toISOString().split('T')[0];

        const query = `SELECT Mitarbeiter_ID, Kategorie, Status FROM Termine WHERE Datum >= '${startDateIso}' AND Datum <= '${endDateIso}'`;
        const termineRaw = await seaTableSqlQuery(query, true);
        const termineData = mapSqlResults(termineRaw || [], 'Termine');

        const AT_STATUS_GEHALTEN = ["Gehalten"];
        const AT_STATUS_AUSGEMACHT = ["Ausgemacht", "Gehalten"];
        const ET_STATUS_GEHALTEN = ["Gehalten", "Weiterer ET", "Info Eingeladen", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];
        const ET_STATUS_AUSGEMACHT = ["Ausgemacht", ...ET_STATUS_GEHALTEN];

        const statsByMitarbeiter = {};

        termineData.forEach(t => {
            const mitarbeiterId = t.Mitarbeiter_ID?.[0]?.row_id;
            if (!mitarbeiterId) return;

            if (!statsByMitarbeiter[mitarbeiterId]) {
                statsByMitarbeiter[mitarbeiterId] = { atAusgemacht: 0, atGehalten: 0, etAusgemacht: 0, etGehalten: 0 };
            }

            if (t.Kategorie === 'AT') {
                if (AT_STATUS_AUSGEMACHT.includes(t.Status)) statsByMitarbeiter[mitarbeiterId].atAusgemacht++;
                if (AT_STATUS_GEHALTEN.includes(t.Status)) statsByMitarbeiter[mitarbeiterId].atGehalten++;
            } else if (t.Kategorie === 'ET') {
                if (ET_STATUS_AUSGEMACHT.includes(t.Status)) statsByMitarbeiter[mitarbeiterId].etAusgemacht++;
                if (ET_STATUS_GEHALTEN.includes(t.Status)) statsByMitarbeiter[mitarbeiterId].etGehalten++;
            }
        });

        const enrichedUsers = Object.keys(statsByMitarbeiter).map(mitarbeiterId => {
            const mitarbeiter = db.mitarbeiter.find(m => m._id === mitarbeiterId);
            if (!mitarbeiter || mitarbeiter.Status === 'Ausgeschieden') return null;
            return { name: mitarbeiter.Name, rang: mitarbeiter.Karrierestufe || 'N/A', ...statsByMitarbeiter[mitarbeiterId] };
        }).filter(Boolean);

        const filterValue = this.aktivitaetenRoleFilter.value;
        const isTraineeOrGA = (rank) => {
            const rankStr = String(rank || '').trim().toLowerCase();
            return rankStr.includes('trainee') || (rankStr.includes('ga') && rankStr.length < 5);
        };

        const filteredUsers = enrichedUsers.filter(user => {
            if (filterValue === 'all') return true;
            if (filterValue === 'trainee') return isTraineeOrGA(user.rang);
            if (filterValue === 'leader') return !isTraineeOrGA(user.rang);
            return true; // Fallback to show all
        });

        const sortConfig = this.sortConfig.aktivitaeten;
        const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });

        // Sort all users directly, removing the grouping logic
        filteredUsers.sort((a, b) => {
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

        if (filteredUsers.length === 0) {
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
        filteredUsers.forEach(user => {
            tbody.innerHTML += `<tr><td>${user.name}</td><td>${user.rang}</td><td>${user.atAusgemacht}</td><td>${user.atGehalten}</td><td>${user.etAusgemacht}</td><td>${user.etGehalten}</td></tr>`;
        });
        table.appendChild(tbody);
        table.querySelectorAll('thead th').forEach(th => th.addEventListener('click', e => this._handleSort('aktivitaeten', e.currentTarget.dataset.sortKey)));
        
        tableWrapper.appendChild(table);
        this.aktivitaetenListContainer.appendChild(tableWrapper);
    }

    async renderFkRennliste() {
        this.fkRennlisteView.innerHTML = '<div class="loader mx-auto"></div>';
        const leaders = db.mitarbeiter.filter(m => isUserLeader(m) && m.Status !== 'Ausgeschieden');
        const { startDate, endDate } = getMonthlyCycleDates();
        const startDateIso = startDate.toISOString().split('T')[0];
        const endDateIso = endDate.toISOString().split('T')[0];

        // 1. Lade alle EH-Daten für den Zeitraum
        const ehQuery = `SELECT \`Mitarbeiter_ID\`, SUM(\`EH\`) AS \`ehIst\` FROM \`Umsatz\` WHERE \`Datum\` >= '${startDateIso}' AND \`Datum\` <= '${endDateIso}' GROUP BY \`Mitarbeiter_ID\``;
        const ehResultRaw = await seaTableSqlQuery(ehQuery, false);
        const ehResults = mapSqlResults(ehResultRaw || [], "Umsatz");

        // 2. Lade alle relevanten Termindaten für den Zeitraum
        const termineQuery = `SELECT Mitarbeiter_ID, Kategorie, Status FROM Termine WHERE Datum >= '${startDateIso}' AND Datum <= '${endDateIso}'`;
        const termineResultsRaw = await seaTableSqlQuery(termineQuery, true);
        const termineResults = mapSqlResults(termineResultsRaw || [], "Termine");

        const AT_STATUS_GEHALTEN = ["Gehalten"];
        const ET_STATUS_GEHALTEN = ["Gehalten", "Weiterer ET", "Info Eingeladen", "Info Bestätigt", "Info Anwesend", "Wird Mitarbeiter"];

        // 3. Gruppiere Daten nach Mitarbeiter für schnellen Zugriff
        const ehByMitarbeiter = _.keyBy(ehResults.map(e => ({ id: e.Mitarbeiter_ID?.[0]?.row_id, eh: e.ehIst })), 'id');
        const termineByMitarbeiter = _.groupBy(termineResults, t => t.Mitarbeiter_ID?.[0]?.row_id);

        // 4. Berechne die Strukturdaten für jede Führungskraft
        const structureDataList = leaders.map(leader => {
            const structureMembers = [leader, ...getAllSubordinatesRecursive(leader._id)];
            
            let eh = 0;
            let at = 0;
            let et = 0;

            for (const member of structureMembers) {
                eh += ehByMitarbeiter[member._id]?.eh || 0;

                const memberTermine = termineByMitarbeiter[member._id] || [];
                memberTermine.forEach(t => {
                    if (t.Kategorie === "AT" && AT_STATUS_GEHALTEN.includes(t.Status)) at++;
                    else if (t.Kategorie === "ET" && ET_STATUS_GEHALTEN.includes(t.Status)) et++;
                });
            }
            
            return {
                name: leader.Name,
                rang: leader.Karrierestufe,
                eh: eh,
                at: at,
                et: et
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
            { key: 'eh', label: 'Gesamt EH' }, { key: 'at', label: 'Gesamt ATs' },
            { key: 'et', label: 'Gesamt ETs' }
        ];
        table.innerHTML = `<thead><tr>${headers.map(h => {
            const icon = sortConfig.column === h.key ? (sortConfig.direction === 'asc' ? '<i class="fas fa-sort-up sort-icon active"></i>' : '<i class="fas fa-sort-down sort-icon active"></i>') : '<i class="fas fa-sort sort-icon"></i>';
            return `<th data-sort-key="${h.key}">${h.label} ${icon}</th>`;
        }).join('')}</tr></thead>`;
        const tbody = document.createElement('tbody');
        structureDataList.forEach(s => {
            // ANPASSUNG: Neue Spalten in der Tabelle ausgeben
            tbody.innerHTML += `<tr><td>${s.name}</td><td>${s.rang}</td><td>${s.eh.toFixed(2)}</td><td>${s.at}</td><td>${s.et}</td></tr>`;
        });
        table.appendChild(tbody);
        table.querySelectorAll('thead th').forEach(th => th.addEventListener('click', e => this._handleSort('fkRennliste', e.currentTarget.dataset.sortKey)));
        tableWrapper.appendChild(table);
        this.fkRennlisteView.innerHTML = '';
        this.fkRennlisteView.appendChild(tableWrapper);
    }

    async renderNaechstesInfo(repopulateDates = false) {
        if (repopulateDates) {
            this.infoabendDateSelect.innerHTML = '';
            let currentDate = new Date();
            for (let i = 0; i < 5; i++) {
                const infoDate = findNextInfoDateAfter(currentDate);
                const dateString = infoDate.toISOString().split('T')[0];
                this.infoabendDateSelect.add(new Option(infoDate.toLocaleDateString('de-DE'), dateString));
                currentDate = new Date(infoDate.getTime() + 24 * 60 * 60 * 1000);
            }
        }

        this.infoabendListContainer.innerHTML = '<div class="loader mx-auto"></div>';
        const selectedDate = this.infoabendDateSelect.value;
        const scope = this.infoabendScopeFilter.value;
        const showCancelled = this.infoabendShowCancelled.checked;

        let userIds = new Set([this.currentUserId]);
        if (scope === 'group') getSubordinates(this.currentUserId, 'gruppe').forEach(u => userIds.add(u._id));
        else if (scope === 'structure') this.downline.forEach(u => userIds.add(u._id));

        const allETs = db.termine.filter(t => t.Kategorie === 'ET');
        
        let filteredTermine = allETs.filter(t => {
            const userMatch = userIds.has(t.Mitarbeiter_ID);
            const dateMatch = t.Infoabend && t.Infoabend.startsWith(selectedDate);
            const cancelledMatch = showCancelled || (t.Status !== 'Storno' && !t.Absage);
            return userMatch && dateMatch && cancelledMatch;
        });

        this.renderInfoabendTable(filteredTermine);
        this.renderFunnelChart(allETs.filter(t => t.Infoabend && t.Infoabend.startsWith(selectedDate)));
    }

    renderInfoabendTable(termine) {
        this.infoabendListContainer.innerHTML = '';
        if (termine.length === 0) {
            this.infoabendListContainer.innerHTML = '<p class="text-center text-gray-500">Keine Bewerber für diesen Infoabend gefunden.</p>';
            return;
        }

        const sortConfig = this.sortConfig.infoabend;
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
            const mitarbeiter = db.mitarbeiter.find(m => m._id === t.Mitarbeiter_ID);
            tbody.innerHTML += `<tr><td>${t.Terminpartner}</td><td>${t.Status}</td><td>${mitarbeiter?.Name || '-'}</td><td>${t.Hinweis || '-'}</td></tr>`;
        });
        table.appendChild(tbody);
        table.querySelectorAll('thead th').forEach(th => th.addEventListener('click', e => this._handleSort('infoabend', e.currentTarget.dataset.sortKey)));
        tableWrapper.appendChild(table);
        this.infoabendListContainer.appendChild(tableWrapper);
    }

    renderFunnelChart(termine) {
        const stats = {
            'Ausgemacht': termine.length,
            'Gehalten': termine.filter(t => t.Status === 'Gehalten').length,
            'Eingeladen': termine.filter(t => t.Status === 'Info Eingeladen').length,
            'Bestätigt': termine.filter(t => t.Status === 'Info Bestätigt').length,
            'Anwesend': termine.filter(t => t.Status === 'Info Anwesend').length,
            'Wird Mitarbeiter': termine.filter(t => t.Status === 'Wird Mitarbeiter').length,
        };

        const funnelSteps = [
            { label: 'ET Ausgemacht', value: stats.Ausgemacht },
            { label: 'ET Gehalten', value: stats.Gehalten },
            { label: 'Info Eingeladen', value: stats.Eingeladen },
            { label: 'Info Bestätigt', value: stats.Bestätigt },
            { label: 'Info Anwesend', value: stats.Anwesend },
            { label: 'Wird Mitarbeiter', value: stats['Wird Mitarbeiter'] }
        ];

        this.funnelChartContainer.innerHTML = '';
        const maxValue = Math.max(...funnelSteps.map(s => s.value), 1);

        funnelSteps.forEach(step => {
            const percentage = (step.value / maxValue) * 100;
            const stepEl = document.createElement('div');
            stepEl.className = 'funnel-step';
            stepEl.style.width = `${percentage}%`;
            stepEl.innerHTML = `<span class="funnel-label">${step.label}</span><span class="funnel-value">${step.value}</span>`;
            this.funnelChartContainer.appendChild(stepEl);
        });
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

// --- INITIALISIERUNG & EVENT LISTENERS ---

function setupEventListeners() {
  // --- Dropdown Menu Logic ---
  function closeSettingsMenu() {
    if (dom.settingsMenu.classList.contains("visible")) {
      dom.settingsMenu.classList.remove("visible");
      dom.settingsMenu.addEventListener(
        "transitionend",
        () => {
          dom.settingsMenu.classList.add("hidden");
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
          dom.moreToolsMenu.classList.add("hidden");
        },
        { once: true }
      );
    }
  }

  dom.settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isUserLeader(authenticatedUserData)) {
      dom.superuserBtn.classList.remove("hidden");
    } else {
      dom.superuserBtn.classList.add("hidden");
    }
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
        viewHistory = [selectedUserId];
        document.getElementById("user-select-screen").classList.add("hidden");
        document.getElementById("dashboard-content").classList.remove("hidden");
        fetchAndRenderDashboard(selectedUserId);
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
  setupMenuItem('ai-assistant-menu-item', 'ai-assistant-btn');
  dom.superuserBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    closeSettingsMenu();
    // Zusätzliche Sicherheitsprüfung: Blockiert den Zugriff, selbst wenn der Button sichtbar wäre.
    if (!isUserLeader(authenticatedUserData)) {
      alert("Du hast keine Berechtigung für diese Ansicht.");
      return;
    }
    await renderSuperuserView();
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
        await fetchAndRenderDashboard(authenticatedUserData._id);
    }
  });

  // --- View Toggles ---
  dom.personalViewBtn.addEventListener("click", () => {
    currentPlanningView = "personal";
    dom.personalViewBtn.classList.add("active");
    dom.teamViewBtn.classList.remove("active");
    dom.strukturViewBtn.classList.remove("active");
    dom.monthlyPlanningTitle.textContent = "Deine Monatsplanung";
    updateMonthlyPlanningView(personalData);
    updateLeadershipView();
    calculateAndRenderPQQForCurrentView();
  });
  dom.teamViewBtn.addEventListener("click", () => {
    currentPlanningView = "team";
    dom.teamViewBtn.classList.add("active");
    dom.personalViewBtn.classList.remove("active");
    dom.strukturViewBtn.classList.remove("active");
    dom.monthlyPlanningTitle.textContent = "Gruppen-Übersicht";
    updateMonthlyPlanningView(teamData);
    updateLeadershipView();
    calculateAndRenderPQQForCurrentView();
  });
  dom.strukturViewBtn.addEventListener("click", () => {
    currentPlanningView = "struktur";
    dom.strukturViewBtn.classList.add("active");
    dom.teamViewBtn.classList.remove("active");
    dom.personalViewBtn.classList.remove("active");
    dom.monthlyPlanningTitle.textContent = "Struktur-Übersicht";
    updateMonthlyPlanningView(structureData);
    updateLeadershipView();
    calculateAndRenderPQQForCurrentView();
  });

  dom.gridViewBtn.addEventListener("click", () => {
    if (currentLeadershipViewMode === "grid") return;
    currentLeadershipViewMode = "grid";
    dom.gridViewBtn.classList.add("active");
    dom.listViewBtn.classList.remove("active");
    updateLeadershipView();
  });

  dom.listViewBtn.addEventListener("click", () => {
    if (currentLeadershipViewMode === "list") return;
    currentLeadershipViewMode = "list";
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

  dom.strukturbaumHeaderBtn.addEventListener("click", () => {
    // NEU
    switchView("strukturbaum");
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

  dom.aiAssistantBtn.addEventListener("click", handleAIAssistantClick);

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

}

async function loadAndCacheTotalEh() {
    const totalEhCacheKey = 'total-eh-results-v2'; // Neuer Cache-Key, um alte Formate zu invalidieren
    let cachedResults = loadFromCache(totalEhCacheKey, 240); // Cache für 4 Stunden

    if (cachedResults) {
        console.log('%c[DATENLADEN] %cGesamt-EH aus dem Cache geladen.', 'color: #17a2b8; font-weight: bold;', 'color: black;');
        totalEhResults = cachedResults; // Die gecachten Daten sind bereits im richtigen Format
        return true;
    }

    // NEUER, ROBUSTER ANSATZ:
    // 1. Lade die gesamte Umsatz-Tabelle. seaTableQuery nutzt Paging und ist daher stabil.
    console.log(`%c[DATENLADEN] %cGesamte Umsatz-Tabelle wird von der API geladen (langsame, aber stabile Abfrage)...`, 'color: #17a2b8; font-weight: bold;', 'color: red;');
    console.time('[DATENLADEN] Dauer für Gesamt-Umsatz-Tabellenabfrage');
    const allUmsatzRowsRaw = await seaTableQuery('Umsatz');
    console.timeEnd('[DATENLADEN] Dauer für Gesamt-Umsatz-Tabellenabfrage');

    if (!allUmsatzRowsRaw) {
        console.error('[DATENLADEN] Die Abfrage der Umsatz-Tabelle ist fehlgeschlagen.');
        setStatus("Kritischer Fehler: Die Umsatzdaten konnten nicht geladen werden.", true);
        return false;
    }

    // 2. Berechne die Summen lokal im Browser. Das ist sehr schnell.
    const umsatzByMitarbeiter = _.groupBy(allUmsatzRowsRaw, row => row[COLUMN_MAPS.umsatz.Mitarbeiter_ID]?.[0]?.row_id);
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

  const dataLoaded = await loadAllData();

  if (!dataLoaded) {
    setStatus("Initialisierung fehlgeschlagen. Bitte Seite neu laden.", true);
    isInitializing = false;
    return;
  }

  // NEU: Lade die Gesamt-EH-Daten, BEVOR das Dashboard gerendert wird.
  setStatus("Lade Gesamtumsätze (dies kann einen Moment dauern)...");
  const totalEhLoaded = await loadAndCacheTotalEh();
  if (!totalEhLoaded) {
      // loadAndCacheTotalEh setzt bereits die Fehlermeldung
      isInitializing = false;
      return;
  }

  const usersForLogin = db.mitarbeiter.filter((m) => m.Name && m.Status !== 'Ausgeschieden');
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
    viewHistory = [loggedInUserId];
    document.getElementById("user-select-screen").classList.add("hidden");
    document.getElementById("dashboard-content").classList.remove("hidden");
    await fetchAndRenderDashboard(loggedInUserId);
  } else {
    document.getElementById("user-select-screen").classList.remove("hidden");
    document.getElementById("user-select-screen").classList.add("flex");
    setStatus("");
  }

  // NEU: Blende Auswertungs-Buttons für Trainees aus
  const isLeader = isUserLeader(authenticatedUserData);
  document.getElementById('auswertung-header-btn').classList.toggle('hidden', !isLeader);
  document.getElementById('auswertung-menu-item').classList.toggle('hidden', !isLeader);

  setupEventListeners();
  isInitializing = false;
}

async function renderSubordinatesForLeader(leaderId, container) {
    container.innerHTML = '<div class="loader mx-auto my-4"></div>';
    container.dataset.loaded = "true";

    const subordinates = getSubordinates(leaderId, 'gruppe');
    if (subordinates.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">Diese Führungskraft hat keine direkten Mitarbeiter in der Gruppe.</p>';
        return;
    }

    const subordinateIds = subordinates.map(s => s._id);
    const subordinateData = await fetchBulkDashboardData(subordinateIds);

    // NEU: Filtere Mitarbeiter heraus, die kein EH-Ziel haben (passive MA)
    const activeSubordinates = subordinateData.filter(member => member.ehGoal > 0);

    if (activeSubordinates.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">Diese Führungskraft hat keine aktiven Mitarbeiter in der Gruppe.</p>';
        return;
    }

    const listHtml = activeSubordinates.map(member => {
        const ehPercentage = member.ehGoal > 0 ? (member.ehCurrent / member.ehGoal * 100) : 0;
        const etPercentage = member.etGoal > 0 ? (member.etCurrent / member.etGoal * 100) : 0;
        const atPercentage = member.atGoal > 0 ? (member.atCurrent / member.atGoal * 100) : 0;

        return `
            <div class="p-3 border-t border-gray-200">
                <p class="font-semibold text-skt-blue">${member.name}</p>
                <div class="mt-2 space-y-2 text-xs">
                    <div>
                        <div class="flex justify-between"><span class="text-gray-600">EH</span><span>${member.ehCurrent} / ${member.ehGoal}</span></div>
                        <div class="w-full bg-gray-200 h-2 rounded-full"><div class="bg-skt-green-accent h-2 rounded-full" style="width: ${Math.min(ehPercentage, 100)}%;"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between"><span class="text-gray-600">ET</span><span>${member.etCurrent} / ${member.etGoal}</span></div>
                        <div class="w-full bg-gray-200 h-2 rounded-full"><div class="bg-skt-blue-accent h-2 rounded-full" style="width: ${Math.min(etPercentage, 100)}%;"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between"><span class="text-gray-600">AT</span><span>${member.atCurrent} / ${member.atGoal}</span></div>
                        <div class="w-full bg-gray-200 h-2 rounded-full"><div class="bg-accent-gold h-2 rounded-full" style="width: ${Math.min(atPercentage, 100)}%;"></div></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // NEU: Füge eine maximale Höhe und eine Scroll-Funktion hinzu
    container.innerHTML = `<div class="space-y-2 max-h-80 overflow-y-auto">${listHtml}</div>`;
}

function getPrognosis(current, goal, totalDays, daysPassed) {
  if (goal <= 0 || daysPassed <= 0)
    return { text: "-", colorClass: "text-gray-500" };
  const dailyRate = current / daysPassed;
  const prognosis = dailyRate * totalDays;

  if (prognosis >= goal)
    return {
      text: `↗ ${Math.round(prognosis)}`,
      colorClass: "text-skt-green-accent",
    };
  if (prognosis >= goal * 0.8)
    return {
      text: `→ ${Math.round(prognosis)}`,
      colorClass: "text-skt-yellow-accent",
    };
  return {
    text: `↘ ${Math.round(prognosis)}`,
    colorClass: "text-skt-red-accent",
  };
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
  const earningsMap = {};
  if (memberIds.length === 0) return earningsMap;

  const startDateIso = startDate.toISOString().split("T")[0];
  const endDateIso = endDate.toISOString().split("T")[0];

  const turnoverQuery = `SELECT \`Mitarbeiter_ID\`, SUM(\`EH\`) AS \`turnover\` FROM \`Umsatz\` WHERE \`Datum\` >= '${startDateIso}' AND \`Datum\` <= '${endDateIso}' GROUP BY \`Mitarbeiter_ID\``;

  const turnoverResultsRaw = await seaTableSqlQuery(turnoverQuery, false);
  const allTurnovers = mapSqlResults(turnoverResultsRaw, "Umsatz");

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

    const leaderRate = getVerdienstForPosition(leader.Karrierestufe);
    const leaderTurnover = getTurnoverForMember(leaderId);

    const personalEarnings = leaderTurnover * leaderRate;
    let groupEarnings = personalEarnings;
    let structureEarnings = personalEarnings;

    const directSubordinates = (hierarchy[leaderId]?.children || [])
      .map((id) => findRowById("mitarbeiter", id))
      .filter(Boolean);

    directSubordinates.forEach((sub) => {
      const subRate = getVerdienstForPosition(sub.Karrierestufe);
      const differentialRate = leaderRate - subRate;

      if (differentialRate > 0) {
        const subAndHisTeam = [sub, ...getAllSubordinatesRecursive(sub._id)];
        const subStructureTurnover = subAndHisTeam.reduce(
          (total, currentMember) =>
            total + getTurnoverForMember(currentMember._id),
          0
        );
        const differentialEarning = subStructureTurnover * differentialRate;
        structureEarnings += differentialEarning;
        if (!isUserLeader(sub)) {
          groupEarnings += differentialEarning;
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
  dom.hinweisModalTitle.textContent = "KI-Assistent";
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
                Analysiere die folgenden Leistungsdaten für den Mitarbeiter ${name} (${position}) und gib eine kurze, motivierende Zusammenfassung und 2-3 konkrete, umsetzbare Tipps.
                - Aktuelle Einheiten (EH): ${ehCurrent} von ${ehGoal} geplant.
                - Aktuelle Analysetermine (AT): ${atCurrent} von ${atGoal} geplant.
                - Aktuelle Einstellungstermine (ET): ${etCurrent} von ${etGoal} geplant.
                
                Gib die Antwort auf Deutsch, direkt formuliert an den Mitarbeiter (Du-Form) und formatiere sie mit HTML (z.B. <strong> für wichtige Punkte und <ul>/<li> für die Tipps).
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

    const relevantPlans = db.monatsplanung.filter(p =>
        userIds.includes(p.Mitarbeiter_ID) &&
        p.Monat === prevMonthName &&
        p.Jahr === prevYear
    );

    if (relevantPlans.length === 0) {
        pqqLog('FEHLER: Keine Plandaten für den Vormonat in der ausgewählten Ansicht gefunden. PQQ-Ansicht wird ausgeblendet.');
        const usersWithPlans = new Set(db.monatsplanung.filter(p => p.Monat === prevMonthName && p.Jahr === prevYear).map(p => p.Mitarbeiter_ID));
        const usersWithoutPlans = userIds.filter(id => !usersWithPlans.has(id));
        pqqLog('Mitarbeiter in der Ansicht, für die kein Plan gefunden wurde:', usersWithoutPlans.map(id => findRowById('mitarbeiter', id)?.Name || `ID: ${id}`));
        dom.pqqView.classList.add('hidden');
        return;
    }

    dom.pqqView.classList.remove('hidden');
    const totalUrsprungszielEH = relevantPlans.reduce((sum, p) => sum + (p.Ursprungsziel_EH || 0), 0);
    const totalUrsprungszielET = relevantPlans.reduce((sum, p) => sum + (p.Ursprungsziel_ET || 0), 0);
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
    let ehQuote = 0;
    if (totalEH > 0) {
        ehQuote = totalUrsprungszielEH / totalEH;
    } else if (totalUrsprungszielEH === 0) {
        ehQuote = 1;
    }

    let etQuote = 0;
    if (totalETAusgemacht > 0) {
        etQuote = totalUrsprungszielET / totalETAusgemacht;
    } else if (totalUrsprungszielET === 0) {
        etQuote = 1;
    }

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
        this.filterText = '';
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
        return this.listContainer && this.editorContainer && this.form && this.newEntryBtn && this.searchInput && this.searchContainer;
    }

    async init(userId) {
        pgLog(`Modul wird initialisiert für User-ID: ${userId}`);
        this.currentUserId = userId;

        if (!this._getDomElements()) {
            pgLog('!!! FEHLER: Benötigte DOM-Elemente wurden nicht gefunden.');
            return;
        }

        // Die Event-Listener müssen bei jeder Initialisierung neu gesetzt werden,
        // da der HTML-Inhalt der Ansicht dynamisch neu geladen wird.
        this.setupEventListeners();
        await this.fetchAndRender();
    }

    async fetchAndRender() {
        this.listContainer.innerHTML = '<div class="loader mx-auto"></div>';
        const currentUserIsLeader = SKT_APP.isUserLeader(SKT_APP.authenticatedUserData);
        const currentUserId = this.currentUserId;
        const mySubordinateIds = new Set(SKT_APP.getAllSubordinatesRecursive(this.currentUserId).map(u => u._id));

        this.allPgs = db['pg'].filter(pg => {
            if (currentUserIsLeader) {
                // KORREKTUR: Die geladenen Daten enthalten IDs, keine Namen.
                return pg.Leiter === currentUserId || mySubordinateIds.has(pg.Mitarbeiter);
            } else {
                // KORREKTUR: Vergleich mit ID statt Name.
                return pg.Mitarbeiter === currentUserId;
            }
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
        // Warnhinweis standardmäßig ausblenden
        document.getElementById('pg-warning-message').classList.add('hidden');

        this.renderList(); // Liste neu rendern, um die Auswahl zu markieren

        this.welcomeView.classList.toggle('hidden', pgId !== null);
        this.editorView.classList.toggle('hidden', pgId === null);
        if (pgId === null) {
            this.timerStartTime = null;
            return;
        }

        const pg = this.allPgs.find(p => p._id === pgId);
        if (!pg) { // This can happen if a new entry is being created
            if (!pgId.startsWith('new-')) pgLog(`PG mit ID ${pgId} nicht gefunden.`);
            this.welcomeView.classList.remove('hidden');
            this.editorView.classList.add('hidden');
            return;
        }

        this.timerStartTime = Date.now(); // Timer starten

        this.form.querySelector('#pg-id').value = pg._id;
        const durationInSeconds = pg.Dauer || 0;
        this.form.querySelector('#pg-duration-hidden').value = formatMinutesToDuration(Math.round(durationInSeconds / 60));
        this.form.querySelector('#pg-titel').value = pg.Titel || '';
        this.form.querySelector('#pg-text').value = pg.Text || '';
        this.form.querySelector('#pg-aufgaben').value = pg.Aufgaben || '';

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
        this.timerStartTime = Date.now(); // Timer starten
        this.renderList();

        this.welcomeView.classList.add('hidden');
        this.editorView.classList.remove('hidden');
        this.form.reset();
        this.form.querySelector('#pg-id').value = '';
        this.form.querySelector('#pg-duration-hidden').value = '0:00';

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

        this.form.querySelector('#pg-text').value = `Ziel: Ursachen verstehen, gemeinsam Lösungen entwickeln, Entwicklung starten.\nAblauf:\n1. Offene Bestandsaufnahme (10 Min)\no Wie zufrieden bist du mit deiner letzten Woche?\no Was hat gut funktioniert, was nicht?\n2. Ursachenanalyse (15 Min)\no Quoten, Termine, Aktivitäten durchsprechen.\no Gemeinsame Bewertung: Was sind die größten Hebel?\n3. Zielklärung & Motivation (10 Min)\no Welches Hauptziel für nächste Woche ist realistisch und motivierend?\n4. Lösungsentwicklung (15 Min)\no 2–3 konkrete Maßnahmen festlegen.\no Rollenspiel oder Praxisbeispiele einbauen.\n5. Unterstützung sichern (5 Min)\no Was kann ich tun, um dir zu helfen?\no abfragen wann man den GP erreichen kann\n6. Motivation & Verabschiedung (5 Min)\no Positiver Ausblick, Termin fürs nächste Gespräch setzen.`;
        this.form.querySelector('#pg-aufgaben').value = `Prio 1 ToDos:\n-\n-\n-\n\nSonstige ToDos:\n-\n-\n-\n-\n-`;
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
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const saveBtn = this.form.querySelector('#pg-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Speichern...';

        const rowId = this.form.querySelector('#pg-id').value;
        const isNew = !rowId;

        let oldDurationString = this.form.querySelector('#pg-duration-hidden').value;
        let totalMinutes = parseDurationToMinutes(oldDurationString);

        if (this.timerStartTime) {
            const elapsedMs = Date.now() - this.timerStartTime;
            const elapsedMinutes = Math.round(elapsedMs / 60000);
            totalMinutes += elapsedMinutes;
        }

        const existingPg = isNew ? null : this.allPgs.find(p => p._id === rowId);
        const dateValue = existingPg ? new Date(existingPg.Datum).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        const rowData = { // KORREKTUR: Spalten-Keys statt Property-Namen verwenden
            [COLUMN_MAPS.pg.Leiter]: [this.currentUserId],
            [COLUMN_MAPS.pg.Mitarbeiter]: [this.form.querySelector('#pg-mitarbeiter').value],
            [COLUMN_MAPS.pg.Datum]: dateValue,
            [COLUMN_MAPS.pg.Titel]: this.form.querySelector('#pg-titel').value,
            [COLUMN_MAPS.pg.Text]: this.form.querySelector('#pg-text').value,
            [COLUMN_MAPS.pg.Aufgaben]: this.form.querySelector('#pg-aufgaben').value,
            [COLUMN_MAPS.pg.Dauer]: totalMinutes * 60 // KORREKTUR: Dauer in Sekunden speichern
        };

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
        if (rowId && confirm('Möchten Sie dieses Gespräch wirklich löschen?')) {
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
}

async function loadAndInitPGTagebuchView() {
    const container = dom.pgTagebuchView;
    try {
        const response = await fetch("./pg-tagebuch.html");
        if (!response.ok) throw new Error(`Die Datei 'pg-tagebuch.html' konnte nicht gefunden werden.`);
        container.innerHTML = await response.text();
        if (!pgTagebuchViewInstance) pgTagebuchViewInstance = new PGTagebuchView();
        await pgTagebuchViewInstance.init(authenticatedUserData._id);
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
        let allUpdatesSucceeded = true;
 
        for (const key in rowDataWithKeys) {
            if (!Object.prototype.hasOwnProperty.call(rowDataWithKeys, key)) continue;
 
            const value = rowDataWithKeys[key];
            const colName = reversedMap[key];
 
            pgLog(`  [UPDATE-LOOP] Processing key: ${key}, colName: ${colName}, value:`, value);
 
            if (!colName || colName === '_id') {
                pgLog(`  [UPDATE-LOOP] Skipping key: ${key}`);
                continue;
            }
 
            if (linkColumnNames.includes(colName)) {
                pgLog(`  [UPDATE-LOOP] Treating '${colName}' as a LINK column.`);
                const linkRowId = value && value[0] ? value[0] : null;
                pgLog(`  [UPDATE-LOOP] Calling updateSingleLink with linkRowId: ${linkRowId}`);
                const success = await updateSingleLink(tableName, rowId, colName, linkRowId ? [linkRowId] : []);
                pgLog(`  [UPDATE-LOOP] updateSingleLink result: ${success}`);
                if (!success) {
                    pgLog(`  [UPDATE-LOOP] !!! Link update for '${colName}' FAILED.`);
                    allUpdatesSucceeded = false;
                    break;
                }
            } else {
                pgLog(`  [UPDATE-LOOP] Treating '${colName}' as a regular column.`);
                const colMeta = METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase())?.columns.find(c => c.key === key);
                let formattedValue;
                if (value === null || value === undefined || value === '') { formattedValue = "NULL"; }
                else if (colMeta && (colMeta.type === 'number' || colMeta.type === 'duration')) { const numValue = parseFloat(value); formattedValue = isNaN(numValue) ? "NULL" : numValue; }
                else if (typeof value === 'boolean') { formattedValue = value ? "true" : "false"; }
                else { formattedValue = `'${escapeSql(String(value))}'`; }
 
                const sql = `UPDATE \`${tableName}\` SET \`${colName}\` = ${formattedValue} WHERE \`_id\` = '${rowId}'`;
                pgLog(`  [UPDATE-LOOP] Executing SQL: ${sql}`);
                const result = await seaTableSqlQuery(sql, false);
                pgLog(`  [UPDATE-LOOP] SQL query result:`, result);
                if (result === null) {
                    pgLog(`  [UPDATE-LOOP] !!! SQL update for '${colName}' FAILED.`);
                    allUpdatesSucceeded = false;
                    break;
                }
            }
        }
        pgLog(`[UPDATE-PG] Finished update loop. Overall success: ${allUpdatesSucceeded}`);
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
      PWD: document.getElementById('edit-pwd').value,
      EHproATQuote: parseFloat(document.getElementById('edit-eh-quote').value) || 0,
      Startdatum: document.getElementById('edit-start-date').value || null,
      Geburtstag: document.getElementById('edit-birthday').value || null,
      Befoerderungsdatum: document.getElementById('edit-promotion-date').value || null,
      Ausgeschieden: isAusgeschieden,
      Ausscheidetag: isAusgeschieden ? ausscheidetag : null,
      Ausscheidegrund: isAusgeschieden ? ausscheidegrund : null,
  };

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

    const usersForWerber = [...db.mitarbeiter.filter(m => m.Status !== 'Ausgeschieden')].sort((a, b) => a.Name.localeCompare(b.Name));
    usersForWerber.forEach(user => {
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
function openPlanningModal() {
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

    const today = getCurrentDate();
    monthSelect.value = months[today.getMonth()];
    yearInput.value = today.getFullYear();

    userSelect.addEventListener('change', loadPlanningDataForSelection);
    monthSelect.addEventListener('change', loadPlanningDataForSelection);
    yearInput.addEventListener('change', loadPlanningDataForSelection);

    // Initial load for the first user in the list
    if (structureUsers.length > 0) {
        loadPlanningDataForSelection();
    }

    dom.planningModal.classList.add('visible');
    document.body.classList.add('modal-open');
}

function loadPlanningDataForSelection() {
    const userId = document.getElementById('planning-user-select').value;
    const monthName = document.getElementById('planning-month-select').value;
    const year = parseInt(document.getElementById('planning-year-input').value);
    const ehInput = document.getElementById('planning-eh-goal');
    const etInput = document.getElementById('planning-et-goal');
    const infoabendInput = document.getElementById('planning-infoabend-date'); // NEU

    const existingPlan = db.monatsplanung.find(p =>
        p.Mitarbeiter_ID === userId &&
        p.Monat === monthName &&
        p.Jahr === year
    );

    ehInput.value = existingPlan?.EH_Ziel || 0;
    etInput.value = existingPlan?.ET_Ziel || 0;

    // NEU: Immer das nächste Infoabend-Datum berechnen und im (deaktivierten) Feld anzeigen.
    const nextInfoDate = findNextInfoDateAfter(getCurrentDate());
    infoabendInput.value = nextInfoDate.toISOString().split('T')[0];
}

function closePlanningModal() {
    dom.planningModal.classList.remove('visible');
    document.body.classList.remove('modal-open');
    // Remove event listeners to prevent memory leaks and multiple triggers
    const userSelect = document.getElementById('planning-user-select');
    const monthSelect = document.getElementById('planning-month-select');
    const yearInput = document.getElementById('planning-year-input');
    userSelect.removeEventListener('change', loadPlanningDataForSelection);
    monthSelect.removeEventListener('change', loadPlanningDataForSelection);
    yearInput.removeEventListener('change', loadPlanningDataForSelection);
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
    
    const existingPlan = db.monatsplanung.find(p =>
        p.Mitarbeiter_ID === userId &&
        p.Monat === monthName &&
        p.Jahr === year
    );

    let success = false;
    if (existingPlan) {
        // Update existing plan
        // NEU: Informationsabend-Feld hinzugefügt
        const sql = `UPDATE \`Monatsplanung\` SET \`EH_Ziel\` = ${ehGoal}, \`ET_Ziel\` = ${etGoal}, \`Informationsabend\` = '${nextInfoDateIso}' WHERE \`_id\` = '${existingPlan._id}'`;
        const result = await seaTableSqlQuery(sql, false);
        success = result !== null;
    } else {
        // Create new plan
        const rowData = {
            [COLUMN_MAPS.monatsplanung.Monat]: monthName,
            [COLUMN_MAPS.monatsplanung.Jahr]: year,
            [COLUMN_MAPS.monatsplanung.EH_Ziel]: ehGoal,
            [COLUMN_MAPS.monatsplanung.ET_Ziel]: etGoal,
            [COLUMN_MAPS.monatsplanung.Mitarbeiter_ID]: [userId],
            // NEU: Informationsabend-Feld hinzugefügt
            [COLUMN_MAPS.monatsplanung.Informationsabend]: nextInfoDateIso,
        };
        success = await addPlanningRowToDatabase('Monatsplanung', rowData);
    }

    if (success) {
        localStorage.removeItem(CACHE_PREFIX + 'monatsplanung');
        await loadAllData();
        await fetchAndRenderDashboard(currentlyViewedUserData._id);
        closePlanningModal();
    } else {
        alert('Fehler beim Speichern der Plandaten.');
    }

    dom.savePlanningBtn.disabled = false;
    dom.savePlanningBtn.textContent = 'Speichern';
}

async function addPlanningRowToDatabase(tableName, rowData) {
    const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));

    const rowDataForCreation = { ...rowData };
    const mitarbeiterId = rowDataForCreation[COLUMN_MAPS.monatsplanung.Mitarbeiter_ID][0];
    delete rowDataForCreation[COLUMN_MAPS.monatsplanung.Mitarbeiter_ID];

    const rowDataWithNames = {};
    for (const key in rowDataForCreation) {
        const name = reversedMap[key];
        if (name) rowDataWithNames[name] = (rowDataForCreation[key] === undefined || rowDataForCreation[key] === '') ? null : rowDataForCreation[key];
    }

    const newRowId = await genericSeaTableAddRow(tableName, rowDataWithNames);
    if (!newRowId) return false;

    const success = await updateSingleLink(tableName, newRowId, 'Mitarbeiter_ID', [mitarbeiterId]);
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


// --- START ---
document.addEventListener("DOMContentLoaded", initializeDashboard);

function switchView(viewName) {
  currentView = viewName;
  dom.mainDashboardView.classList.toggle("hidden", viewName !== "dashboard");
  dom.einarbeitungView.classList.toggle("hidden", viewName !== "einarbeitung");
  dom.appointmentsView.classList.toggle("hidden", viewName !== "appointments");
  dom.potentialView.classList.toggle("hidden", viewName !== "potential");
  dom.umsatzView.classList.toggle("hidden", viewName !== "umsatz");
  dom.auswertungView.classList.toggle("hidden", viewName !== "auswertung");
  dom.strukturbaumView.classList.toggle("hidden", viewName !== "strukturbaum");
  dom.pgTagebuchView.classList.toggle('hidden', viewName !== 'pg-tagebuch');
  updateBackButtonVisibility();

  // NEU: Sicherheitsprüfung, um zu verhindern, dass Trainees die Auswertung sehen.
  if (viewName === 'auswertung' && !isUserLeader(authenticatedUserData)) {
      console.warn('Zugriff auf Auswertung für Trainee blockiert. Wechsle zum Dashboard.');
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
  } else if (viewName === 'pg-tagebuch') {
    loadAndInitPGTagebuchView();
  }
}

// Mache Kernfunktionen global verfügbar für andere Module/Dateien
window.SKT_APP = {
  seaTableSqlQuery,
  seaTableAddRow,
  seaTableUpdateRow,
  seaTableDeleteRow, // NEU: Funktion global verfügbar machen
  mapSqlResults,
  findRowById,
  getMonthlyCycleDates,
  escapeSql,
  getCurrentDate,
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