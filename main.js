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
};

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
let appointmentsViewInstance = null;
let potentialViewInstance = null;
let umsatzViewInstance = null;
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
  logoutBtn: document.getElementById("logout-btn"),
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
  umsatzView: document.getElementById("umsatz-view"),
  potentialView: document.getElementById("potential-view"),
  appointmentsView: document.getElementById("appointments-view"),
  einarbeitungTitle: document.getElementById("einarbeitung-title"),
  traineeOnboardingView: document.getElementById("trainee-onboarding-view"),
  leaderOnboardingView: document.getElementById("leader-onboarding-view"),
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
  nextInfoDate: document.getElementById("next-info-date"),
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
        if (value === null || value === undefined || value === '') formattedValue = "NULL";
        else if (colMeta && colMeta.type === 'number') { const numValue = parseFloat(value); formattedValue = isNaN(numValue) ? "NULL" : numValue; }
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
        const baseTableMeta = METADATA.tables.find(t => t.name === baseTableName);
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
        
        umsatzLog(`[UPDATE-LINK] Updating link for ${linkColumnName}. Payload:`, body);
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
    umsatzLog("[UPDATE-UMSATZ] Starting update-umsatz process.");
    if (!seaTableAccessToken || !apiGatewayUrl) return false;

    const linkColumns = {
        Mitarbeiter_ID: COLUMN_MAPS.umsatz.Mitarbeiter_ID,
        Gesellschaft_ID: COLUMN_MAPS.umsatz.Gesellschaft_ID,
        Produkt_ID: COLUMN_MAPS.umsatz.Produkt_ID
    };
    const linkData = {};
    const rowDataForUpdate = { ...rowData };

    for (const name in linkColumns) {
        const colKey = linkColumns[name];
        if (Object.prototype.hasOwnProperty.call(rowDataForUpdate, colKey)) {
            linkData[name] = rowDataForUpdate[colKey]?.[0] || null;
            delete rowDataForUpdate[colKey];
        }
    }

    const tableMap = COLUMN_MAPS[tableName.toLowerCase()];
    const reversedMap = Object.fromEntries(Object.entries(tableMap).map(([name, key]) => [key, name]));
    const rowDataWithNames = {};
    for (const key in rowDataForUpdate) {
        const name = reversedMap[key];
        if (name && name !== '_id') {
            rowDataWithNames[name] = (rowDataForUpdate[key] === undefined || rowDataForUpdate[key] === '') ? null : rowDataForUpdate[key];
        }
    }

    let mainUpdateSuccess = true;
    if (Object.keys(rowDataWithNames).length > 0) {
        try {
            const url = `${apiGatewayUrl}api/v2/dtables/${SEATABLE_DTABLE_UUID}/rows/`;
            const body = { table_name: tableName, row_id: rowId, row: rowDataWithNames };
            const response = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${seaTableAccessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (!response.ok) throw new Error(`Main row update failed: ${await response.text()}`);
        } catch (error) {
            console.error("[UPDATE-UMSATZ] Step 1 FAILED:", error);
            mainUpdateSuccess = false;
        }
    }

    if (!mainUpdateSuccess) return false;

    for (const colName in linkData) {
        await updateSingleLink(tableName, rowId, colName, linkData[colName] ? [linkData[colName]] : []);
    }

    return true;
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

    for (const colName in linkData) {
        if (linkData[colName]) {
            await updateSingleLink(tableName, newRowId, colName, [linkData[colName]]);
        }
    }

    return true;
}
// --- DATA NORMALIZATION & MAPPING ---
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
  ];

  for (const tableName of tablesToLoad) {
    const key = tableName.toLowerCase();
    let cachedData = loadFromCache(key, 60); // Cache für 60 Minuten

    if (cachedData) {
      // console.log(`Lade '${tableName}' aus dem Cache.`);
      db[key] = cachedData;
    } else {
      // console.log(`Lade '${tableName}' von der API.`);
      const apiData = await seaTableQuery(tableName);
      if (apiData && apiData.length > 0) {
        db[key] = apiData;
        saveToCache(key, apiData);
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
function findRowById(tableName, id) {
  return db[tableName.toLowerCase()].find((row) => row._id === id);
}

function escapeSql(str) {
  if (typeof str !== "string") return str;
  return str.replace(/'/g, "''");
}

function getMonthlyCycleDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const findCycleStartForMonth = (year, month) => {
    const date = new Date(year, month, 1);
    while (date.getDay() !== 4) {
      date.setDate(date.getDate() + 1);
    }
    if (date.getDate() <= 2) {
      date.setDate(date.getDate() + 7);
    }
    return date;
  };

  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let thisMonthCycleStart = findCycleStartForMonth(currentYear, currentMonth);
  let startDate, endDate;

  if (today < thisMonthCycleStart) {
    let prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    let prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    startDate = findCycleStartForMonth(prevYear, prevMonth);
    endDate = new Date(thisMonthCycleStart);
    endDate.setDate(endDate.getDate() - 1);
  } else {
    let nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    let nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    startDate = thisMonthCycleStart;
    let nextMonthCycleStart = findCycleStartForMonth(nextYear, nextMonth);
    endDate = new Date(nextMonthCycleStart);
    endDate.setDate(endDate.getDate() - 1);
  }
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

  // Nur Umsatzdaten werden für die KPIs immer frisch per SQL geladen.
  const ehQuery = `SELECT \`Mitarbeiter_ID\`, SUM(\`EH\`) AS \`ehIst\` FROM \`Umsatz\` WHERE \`Datum\` >= '${startDateIso}' AND \`Datum\` <= '${endDateIso}' GROUP BY \`Mitarbeiter_ID\``;
  const totalEhQuery = `SELECT \`Mitarbeiter_ID\`, SUM(\`EH\`) AS \`totalEh\` FROM \`Umsatz\` GROUP BY \`Mitarbeiter_ID\``;

  // WICHTIG: convertLinks wird auf `false` gesetzt, um die stabilen Row-IDs statt der Namen zu erhalten.
  const [ehResultRaw, totalEhResultRaw] = await Promise.all([seaTableSqlQuery(ehQuery, false), seaTableSqlQuery(totalEhQuery, false)]);
  const ehResults = mapSqlResults(ehResultRaw, "Umsatz");
  const totalEhResults = mapSqlResults(totalEhResultRaw, "Umsatz");

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
  const pos = user.Karrierestufe.toLowerCase();

  // Definiere die Schlüsselwörter für Nicht-Führungskräfte basierend auf der Anforderung.
  // Dazu gehören alle "Trainee"-Stufen und "JGST".
  const isTrainee = pos.includes("trainee");
  const isJgst = pos.includes("jgst");

  // Eine Führungskraft ist jeder, der NICHT eine dieser Stufen hat.
  return !(isTrainee || isJgst);
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

  return subordinates;
}

function getAllSubordinatesRecursive(leaderId) {
  const hierarchy = buildHierarchy();
  const subordinates = [];
  const queue = [...(hierarchy[leaderId]?.children || [])];
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
  return subordinates;
}

function calculateGroupOrStructureData(
  leaderId,
  type = "gruppe",
  fullDataStore
) {
  const leaderUser = findRowById("mitarbeiter", leaderId);
  if (!leaderUser) return { members: [] };

  // 1. Definiere, welche Mitarbeiter angezeigt werden sollen
  const membersForDisplay = getSubordinates(leaderId, type);
  const memberIdsForDisplay = new Set(membersForDisplay.map((m) => m._id));

  // 2. Definiere, wessen Daten für die Gesamtberechnung herangezogen werden, basierend auf dem Typ
  let membersForCalculation = [];
  if (type === "gruppe") {
    // Für 'Gruppe': Die Führungskraft selbst und alle unterstellten Trainees,
    // bis zur nächsten Führungskraft in der Hierarchie.
    membersForCalculation = [
      leaderUser,
      ...getSubordinates(leaderId, "gruppe"),
    ];
  } else {
    // type === 'struktur'
    // Für 'Struktur': Die Führungskraft selbst und ALLE Untergebenen (Führungskräfte und Trainees)
    membersForCalculation = [
      leaderUser,
      ...getAllSubordinatesRecursive(leaderId),
    ];
  }
  const memberIdsForCalc = new Set(membersForCalculation.map((m) => m._id));

  // 3. Filtere den vorab geladenen Datenspeicher
  const dataForCalc = fullDataStore.filter((d) => memberIdsForCalc.has(d.id));

  // 4. Berechne die Summen aus den gefilterten Daten
  const totalEhGoal = dataForCalc.reduce((sum, d) => sum + (d.ehGoal || 0), 0);
  const totalEhCurrent = dataForCalc.reduce(
    (sum, d) => sum + (d.ehCurrent || 0),
    0
  );
  const totalEtGoal = dataForCalc.reduce((sum, d) => sum + (d.etGoal || 0), 0);
  const totalEtCurrent = dataForCalc.reduce(
    (sum, d) => sum + (d.etCurrent || 0),
    0
  );
  const totalAtGoal = dataForCalc.reduce((sum, d) => sum + (d.atGoal || 0), 0);
  const totalAtCurrent = dataForCalc.reduce(
    (sum, d) => sum + (d.atCurrent || 0),
    0
  );
  const totalAtVereinbart = dataForCalc.reduce(
    (sum, d) => sum + (d.atVereinbart || 0),
    0
  );

  // Der Gesamtverdienst der Gruppe/Struktur ist der Verdienst der Führungskraft,
  // da dieser bereits die Differenzprovisionen für die jeweilige Downline enthält.
  const leaderData = fullDataStore.find((d) => d.id === leaderId);
  const totalEarnings = leaderData
    ? leaderData.earnings
    : { personal: 0, group: 0, structure: 0 };

  // 5. Hole die Daten für die anzuzeigenden Karten aus dem Datenspeicher
  const memberData = fullDataStore.filter((d) => memberIdsForDisplay.has(d.id));

  return {
    ehGoal: totalEhGoal,
    ehCurrent: totalEhCurrent,
    etGoal: totalEtGoal,
    etCurrent: totalEtCurrent,
    atGoal: totalAtGoal,
    atCurrent: totalAtCurrent,
    atVereinbart: totalAtVereinbart,
    earnings: totalEarnings,
    members: memberData,
  };
}

async function calculateGesamtansichtData() {
  const führungskräfte = db.mitarbeiter.filter(
    (m) => m.Karrierestufe && !m.Karrierestufe.toLowerCase().includes("trainee")
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
  const totalData = {
    ehGoal: 0,
    ehCurrent: 0,
    etGoal: 0,
    etCurrent: 0,
    atGoal: 0,
    atCurrent: 0,
    atVereinbart: 0,
    members: [],
    earnings: 0,
  };
  // Anforderung: In der Gesamtübersicht sollen die Einheiten aller Führungskräfte summiert werden.
  // Wir summieren hier die individuellen Plandaten jeder Führungskraft.
  führungskräfte.forEach((leader) => {
    const leaderData = augmentedMemberData.find((d) => d.id === leader._id);
    if (leaderData) {
      totalData.ehGoal += leaderData.ehGoal || 0;
      totalData.ehCurrent += leaderData.ehCurrent || 0;
      totalData.etGoal += leaderData.etGoal || 0;
      totalData.etCurrent += leaderData.etCurrent || 0;
      totalData.atGoal += leaderData.atGoal || 0;
      totalData.atCurrent += leaderData.atCurrent || 0;
      totalData.atVereinbart += leaderData.atVereinbart || 0;
    }
  });
  totalData.members = führungskräfte.map((leader) => {
    const gsName = `Geschäftsstelle ${leader.Name}`;
    const gsRow = geschäftsstelleRows.find((row) => row.Name === gsName);
    const targetId = gsRow ? gsRow._id : leader._id;
    const displayData = augmentedMemberData.find((d) => d.id === targetId);
    return {
      ...(displayData || {}),
      leaderName: leader.Name,
      originalPosition: leader.Karrierestufe,
    };
  });

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
    const today = new Date();
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
    const today = new Date();
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

  dom.leadershipViewCount.textContent = `Du hast ${data.members.length} aktive Mitarbeiter in deiner Gruppe.`;
  renderTeamMemberCards(data.members);
}

function renderTeamMemberCards(members) {
  clearChildren(dom.teamMembersContainer);
  clearChildren(dom.passiveMembersSection);
  dom.teamMembersContainer.className = "mt-6";
  if (!members || members.length === 0) {
    dom.teamMembersContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">Keine Mitarbeiter in dieser Ansicht.</p>`;
    return;
  }
  const activeMembers = members.filter((m) => m.ehGoal > 0 || m.etGoal > 0);
  const passiveMembers = members.filter(
    (m) => m.ehGoal === 0 && m.etGoal === 0
  );
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
    summary.textContent = `Passive Mitarbeiter (${passiveMembers.length})`;
    details.appendChild(summary);
    const container = document.createElement("div");
    container.className = "p-4 pt-0 space-y-3";
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
    
    summary.addEventListener('click', (e) => { if (!e.target.closest('.switch-view-btn')) { details.classList.toggle('open'); summary.classList.toggle('open'); } });
    summary.querySelector('.switch-view-btn').addEventListener('click', (e) => { 
        e.stopPropagation();
        const newuserId = e.currentTarget.dataset.userid;
        if (newuserId) {
            viewHistory.push(newuserId);
            fetchAndRenderDashboard(newuserId);
        }
    });
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
    summary.addEventListener("click", (e) => {
        if (!e.target.closest(".switch-view-btn")) {
        details.classList.toggle("open");
        summary.classList.toggle("open");
        }
    });
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
    const nextInfoDateObj = findNextInfoDateAfter(new Date());
    return nextInfoDateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function updateBackButtonVisibility() {
  const shouldShow =
    viewHistory.length > 1 || isSuperuserView || currentView === "einarbeitung";
  dom.backButton.classList.toggle("hidden", !shouldShow);
}

// --- MAIN LOGIC ---

async function fetchAndRenderDashboard(mitarbeiterId) {
  window.scrollTo(0, 0);
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

  const position = user.Karrierestufe || "";
  const isLeader = !position.toLowerCase().includes("trainee");
  if (isLeader) {
    teamData = calculateGroupOrStructureData(
      mitarbeiterId,
      "gruppe",
      augmentedDataStore
    );
    structureData = calculateGroupOrStructureData(
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
  dom.einarbeitungBanner.classList.toggle("hidden", isLeader);

  dom.nextInfoDate.textContent = `Nächstes Info: ${fetchNextInfoDate()}`;
  setStatus("");
  dom.dashboardSections.classList.remove("hidden");
  setTimeout(() => dom.dashboardSections.classList.remove("opacity-0"), 50);
  updateBackButtonVisibility();
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
    const teamMembers = getSubordinates(mitarbeiterId, "gruppe");
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

  if (allSteps.length === 0)
    return { percentage: 0, sollPercentage: 0, totalSteps: 0 };

  const completedStepIds = new Set(
    userEinarbeitung.map((e) => e["Schritt_ID"])
  );
  const completedSteps = allSteps.filter((s) =>
    completedStepIds.has(s._id)
  ).length;
  const percentage = (completedSteps / allSteps.length) * 100;

  const userStartDate = user.Startdatum;
  let sollPercentage = 0;
  if (userStartDate) {
    const startDate = new Date(userStartDate);
    const overallStartDate = new Date(startDate);
    overallStartDate.setDate(
      startDate.getDate() + allSteps[0]["Tage nach Start"]
    );
    const overallEndDate = new Date(startDate);
    overallEndDate.setDate(
      startDate.getDate() + allSteps[allSteps.length - 1]["Tage nach Start"]
    );
    const today = new Date();
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

  return { percentage, sollPercentage, totalSteps: allSteps.length };
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

  const viewerIsTrainee = (authenticatedUserData.Karrierestufe || "")
    .toLowerCase()
    .includes("trainee");

  let allSteps = db.einarbeitungsschritte;
  if (viewerIsTrainee) {
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
    grundseminarSteps
  );
  renderTimelineSection(
    dom.aufbauseminarStepsContainer,
    dom.aufbauseminarProgress,
    dom.aufbauseminarDateMarkers,
    aufbauseminarSteps
  );
}

function renderTimelineSection(
  container,
  progressElement,
  dateMarkerContainer,
  steps
) {
  clearChildren(container);

  if (steps.length === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-500 mt-4">Für diesen Abschnitt sind keine Schritte vorhanden.</p>';
    if (progressElement) progressElement.style.height = "0%";
    if (dateMarkerContainer) clearChildren(dateMarkerContainer);
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  steps.forEach((step, index) => {
    const stepEl = document.createElement("div");
    const stepType = step.Kategorie
      ? step.Kategorie.toLowerCase().trim()
      : "other";
    const isMajor = stepType === "meilenstein" || stepType === "seminar";

    let statusClass = step.completed
      ? "completed"
      : step.dueDate <= today
      ? "due"
      : "future";
    const isOverdue =
      !step.completed &&
      today.getTime() - step.dueDate.getTime() > 3 * 24 * 60 * 60 * 1000;

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

    stepEl.className = `timeline-item ${statusClass} ${stepType} ${
      isMajor ? "timeline-item-major" : "timeline-item-minor"
    }`;
    stepEl.style.animationDelay = `${index * 0.1}s`;

    const formattedDate = step.dueDate.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    stepEl.innerHTML = `
                    <div class="timeline-content ${
                      isOverdue ? "overdue-task" : ""
                    }">
                        <div class="timeline-header">
                            <div class="timeline-icon-inline">
                                <i class="fas ${iconClass}"></i>
                            </div>
                            <div class="timeline-info">
                                <p class="timeline-title">${step.Schritt}</p>
                                <p class="timeline-duedate">Fällig bis: ${formattedDate}</p>
                            </div>
                        </div>
                    </div>
                `;

    stepEl.querySelector(".timeline-content").addEventListener("click", () => {
      dom.hinweisModalContent.textContent =
        step.Hinweis || "Kein Hinweis verfügbar.";
      dom.hinweisModal.classList.add("visible");
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
    });

    container.appendChild(stepEl);
  });
}

// --- Appointments View Logic (integriert in main.js) ---

const appointmentsLog = (message, ...data) => console.log(`%c[Appointments] %c${message}`, 'color: #4f46e5; font-weight: bold;', 'color: black;', ...data);

class AppointmentsView {
    constructor() {
        // Der Konstruktor ist absichtlich schlank. DOM-Elemente werden in init() geholt.
        this.listContainer = null;
        this.umsatzTab = null;
        this.netzwerkTab = null;
        this.statsChartTitle = null;
        this.statsPieChartContainer = null;
        this.statsPieChartLegend = null;
        this.statsByEmployeeBtn = null;
        this.statsByStatusBtn = null;
        this.toggleStatsBtn = null;
        this.statsContent = null;
        this.prognosisDetailsContainer = null;
        this.recruitingTab = null;
        this.startDateInput = null;
        this.endDateInput = null;
        this.scopeFilter = null;
        this.modal = null;
        this.form = null;
        this.searchInput = null;
        this.showCancelledCheckbox = null;

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
        this.listContainer = document.getElementById('appointments-list-container');
        this.umsatzTab = document.getElementById('umsatz-tab');
        this.netzwerkTab = document.getElementById('netzwerk-tab');
        this.statsChartTitle = document.getElementById('stats-chart-title');
        this.statsPieChartContainer = document.getElementById('stats-pie-chart-container');
        this.statsPieChartLegend = document.getElementById('stats-pie-chart-legend');
        this.statsByEmployeeBtn = document.getElementById('stats-by-employee-btn');
        this.statsByStatusBtn = document.getElementById('stats-by-status-btn');
        this.toggleStatsBtn = document.getElementById('toggle-stats-visibility-btn');
        this.statsContent = document.getElementById('stats-content');
        this.prognosisDetailsContainer = document.getElementById('prognosis-details-container');
        this.recruitingTab = document.getElementById('recruiting-tab');
        this.startDateInput = document.getElementById('appointments-start-date');
        this.endDateInput = document.getElementById('appointments-end-date');
        this.scopeFilter = document.getElementById('appointments-scope-filter');
        this.modal = document.getElementById('appointment-modal');
        this.form = document.getElementById('appointment-form');
        this.searchInput = document.getElementById('appointments-search-filter');
        this.showCancelledCheckbox = document.getElementById('appointments-show-cancelled');

        return this.listContainer && this.umsatzTab && this.recruitingTab && this.netzwerkTab && this.statsPieChartContainer && this.toggleStatsBtn && this.statsContent && this.prognosisDetailsContainer && this.startDateInput && this.endDateInput && this.scopeFilter && this.modal && this.form && this.searchInput && this.showCancelledCheckbox;
    }

    async init(userId) {
        appointmentsLog(`Modul wird initialisiert für User-ID: ${userId}`);
        this.currentUserId = userId;
        
        if (!this._getDomElements()) {
            appointmentsLog('!!! FEHLER: Benötigte DOM-Elemente für die Termin-Ansicht wurden nicht gefunden.');
            return;
        }

        const { startDate, endDate } = SKT_APP.getMonthlyCycleDates();
        this.startDateInput.value = startDate.toISOString().split('T')[0];
        this.endDateInput.value = endDate.toISOString().split('T')[0];

        this.downline = SKT_APP.getAllSubordinatesRecursive(this.currentUserId);
        this.downline.sort((a, b) => a.Name.localeCompare(b.Name));
        this.scopeFilter.classList.toggle('hidden', !SKT_APP.isUserLeader(SKT_APP.authenticatedUserData));
        
        if (!this.initialized) {
            appointmentsLog('Erstmalige Initialisierung: Event-Listener werden eingerichtet.');
            this.setupEventListeners();
            this.initialized = true;
        }

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
        this.listContainer.innerHTML = '<div class="loader mx-auto"></div>';
        try {
            const startDateIso = this.startDateInput.value;
            const endDateIso = this.endDateInput.value;
            appointmentsLog(`1. Berechneter Zeitraum: ${startDateIso} bis ${endDateIso}`);

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
        this.listContainer.innerHTML = '';

        // 1. Filter data
        let filteredAppointments = this.allAppointments.filter(t => {
            const isUmsatzTermin = ['AT', 'BT', 'ST'].includes(t.Kategorie);
            const isRecruitingTermin = t.Kategorie === 'ET';
            const isNetzwerkTermin = t.Kategorie === 'NT';

            const tabMatch = (this.currentTab === 'umsatz' && isUmsatzTermin) || (this.currentTab === 'recruiting' && isRecruitingTermin) || (this.currentTab === 'netzwerk' && isNetzwerkTermin);
            if (!tabMatch) return false;

            // KORREKTUR: Prüfe auf Status 'Storno' ODER das Absage-Flag
            if (!this.showCancelled && (t.Status === 'Storno' || t.Absage === true)) {
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

        if (filteredAppointments.length === 0) {
            this.listContainer.innerHTML = `<div class="text-center py-16"><i class="fas fa-calendar-times fa-4x text-skt-grey-medium mb-4"></i><h3 class="text-xl font-semibold text-skt-blue">Keine Termine gefunden</h3><p class="text-gray-500 mt-2">Für die aktuelle Auswahl gibt es keine Termine.</p></div>`;
            return;
        }

        // 3. Build table
        const table = document.createElement('table');
        table.className = 'appointments-table';

        const isUmsatz = this.currentTab === 'umsatz';
        const columns = [
            { key: 'Datum', label: 'Datum' },
            { key: 'Terminpartner', label: isUmsatz ? 'Kunde' : 'Bewerber' },
            { key: 'Status', label: 'Status' },
            { key: 'Mitarbeiter_ID', label: 'Mitarbeiter' },
        ];
        if (isUmsatz) {
            columns.push({ key: 'Umsatzprognose', label: 'Umsatzprognose' });
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
                } else if (col.key === 'Datum') {
                    value = value ? new Date(value).toLocaleDateString('de-DE') : '-';
                } else if (col.key === 'Umsatzprognose') {
                    value = value ? value.toLocaleString('de-DE') + ' EH' : '-';
                }
                td.textContent = value || '-';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        this.listContainer.appendChild(table);

        this.listContainer.querySelectorAll('thead th').forEach(th => {
            th.addEventListener('click', () => this._handleSort(th.dataset.sortKey));
        });
        this.listContainer.querySelectorAll('tbody tr').forEach(tr => {
            tr.addEventListener('click', () => {
                const termin = this.allAppointments.find(t => t._id === tr.dataset.id);
                if (termin) this.openModal(termin);
            });
        });

        appointmentsLog('--- ENDE: render ---');
    }

    setupEventListeners() {
        const debouncedFetch = _.debounce(() => this.fetchAndRender(), 300);
        this.startDateInput.addEventListener('change', debouncedFetch);
        this.endDateInput.addEventListener('change', debouncedFetch);
        this.scopeFilter.addEventListener('change', () => this.fetchAndRender());

        this.searchInput.addEventListener('input', _.debounce((e) => {
            this.filterText = e.target.value;
            this.render();
        }, 300));
        this.showCancelledCheckbox.addEventListener('change', (e) => {
            this.showCancelled = e.target.checked;
            this.render();
        });

        this.umsatzTab.addEventListener('click', () => { this.currentTab = 'umsatz'; this.updateTabs(); this.render(); });
        this.recruitingTab.addEventListener('click', () => { this.currentTab = 'recruiting'; this.updateTabs(); this.render(); });
        this.netzwerkTab.addEventListener('click', () => { this.currentTab = 'netzwerk'; this.updateTabs(); this.render(); });

        document.getElementById('add-appointment-btn').addEventListener('click', () => this.openModal());
        document.getElementById('close-appointment-modal-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-appointment-btn').addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.closeModal(); });
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        this.toggleStatsBtn.addEventListener('click', () => this._toggleStatsVisibility());

        // NEU: Event Listeners für Statistik-Umschalter
        this.statsByEmployeeBtn.addEventListener('click', () => {
            this.statsChartMode = 'employee';
            this._updateStatsToggleButtons();
            this._renderStatsChart();
        });
        this.statsByStatusBtn.addEventListener('click', () => {
            this.statsChartMode = 'status';
            this._updateStatsToggleButtons();
            this._renderStatsChart();
        });

        // Event Listeners für bedingte Felder im Modal
        this.form.querySelector('#appointment-category').addEventListener('change', (e) => this.toggleConditionalFields(e.target.value));
        this.form.querySelector('#appointment-cancellation').addEventListener('change', (e) => {
            this.form.querySelector('#appointment-cancellation-reason-container').classList.toggle('hidden', !e.target.checked);
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
        if (termin.Status === 'Storno' || termin.Absage === true) {
            return 'border-skt-red-accent';
        }
        switch (termin.Status) {
            case 'Gehalten': return 'border-skt-green-accent';
            case 'Ausgemacht':
            case 'weiterer BT':
            case 'weiterer ET': return 'border-skt-grey-medium';
            case 'Verschoben':
            case 'offen': return 'border-skt-orange-accent';
            case 'Info Eingeladen': return 'border-skt-yellow-accent';
            case 'Info Bestätigt': return 'border-skt-blue-accent';
            case 'Info Anwesend': return 'border-accent-purple';
            case 'Wird Mitarbeiter': return 'border-skt-gold-accent';
            default: return 'border-gray-300';
        }
    }

    updateTabs() {
        const tabs = [
            { el: this.umsatzTab, name: 'umsatz' },
            { el: this.recruitingTab, name: 'recruiting' },
            { el: this.netzwerkTab, name: 'netzwerk' }
        ];
        const activeClass = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg border-skt-blue text-skt-blue';
        const inactiveClass = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';

        tabs.forEach(tab => {
            if (tab.el) {
                tab.el.className = tab.name === this.currentTab ? activeClass : inactiveClass;
            }
        });
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
    }

    openModal(termin = null) {
        appointmentsLog('--- START: openModal ---', termin ? `Editing term ID: ${termin?._id}` : 'Creating new term');
        try {
            this.form.reset();
            appointmentsLog('Form reset.');

            const title = this.modal.querySelector('#appointment-modal-title');
            const idInput = this.modal.querySelector('#appointment-id');
            const userSelect = this.modal.querySelector('#appointment-user');
            const categorySelect = this.modal.querySelector('#appointment-category');
            const statusSelect = this.modal.querySelector('#appointment-status');
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

            const statusColumn = terminMeta.columns.find(c => c.name === 'Status');
            if (!statusColumn || !statusColumn.data || !statusColumn.data.options) throw new Error("Could not find 'Status' options in metadata.");
            const statuses = statusColumn.data.options.map(o => o.name);
            appointmentsLog('Categories and statuses extracted from metadata.');

            categorySelect.innerHTML = '';
            statusSelect.innerHTML = '';
            categories.forEach(cat => categorySelect.add(new Option(cat, cat)));
            statuses.forEach(stat => statusSelect.add(new Option(stat, stat)));
            appointmentsLog('Category and status dropdowns populated.');

            if (termin) { // Edit mode
                appointmentsLog('Entering edit mode for termin:', termin);
                title.textContent = 'Termin bearbeiten';
                idInput.value = termin._id;
                const user = allRelevantUsers.find(u => u.Name === termin.Mitarbeiter_ID?.[0]?.display_value);
                if (user) userSelect.value = user._id;
                
                this.form.querySelector('#appointment-date').value = termin.Datum ? termin.Datum.split('T')[0] : '';
                categorySelect.value = termin.Kategorie || '';
                statusSelect.value = termin.Status || '';
                this.form.querySelector('#appointment-partner').value = termin.Terminpartner || '';
                this.form.querySelector('#appointment-prognose').value = termin.Umsatzprognose || '';
                this.form.querySelector('#appointment-referrals').value = termin.Empfehlungen || '';
                this.form.querySelector('#appointment-note').value = termin.Hinweis || '';
                this.form.querySelector('#appointment-cancellation').checked = termin.Absage || false;
                this.form.querySelector('#appointment-cancellation-reason').value = termin.Absagegrund || '';

            } else { // Add mode
                appointmentsLog('Entering add mode.');
                title.textContent = 'Termin anlegen';
                idInput.value = '';
                userSelect.value = this.currentUserId;
                this.form.querySelector('#appointment-date').value = new Date().toISOString().split('T')[0];

                // NEU: Standard-Kategorie basierend auf dem aktiven Tab setzen
                if (this.currentTab === 'umsatz') {
                    categorySelect.value = 'AT';
                } else if (this.currentTab === 'recruiting' || this.currentTab === 'netzwerk') {
                    categorySelect.value = 'ET';
                }
            }

            this.toggleConditionalFields(categorySelect.value);
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

                await this.fetchAndRender(); 

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
        return this.listContainer && this.modal && this.form && this.scheduleModal && this.scheduleForm && this.searchInput;
    }

    async init(userId) {
        potentialLog(`Modul wird initialisiert für User-ID: ${userId}`);
        this.currentUserId = userId;

        if (!this._getDomElements()) {
            potentialLog('!!! FEHLER: Benötigte DOM-Elemente für die Potential-Ansicht wurden nicht gefunden.');
            return;
        }

        // NEU: Gib die verfügbaren Spaltennamen aus, um bei der Fehlersuche zu helfen.
        console.log('Verfügbare Spalten in der "Termine" Tabelle:', SKT_APP.COLUMN_MAPS.termine);

        this.downline = SKT_APP.getAllSubordinatesRecursive(this.currentUserId);
        this.downline.sort((a, b) => a.Name.localeCompare(b.Name));

        if (!this.initialized) {
            potentialLog('Erstmalige Initialisierung: Event-Listener werden eingerichtet.');
            this.setupEventListeners();
            this.initialized = true;
        }

        await this.fetchAndRender();
    }

    async fetchAndRender() {
        this.listContainer.innerHTML = '<div class="loader mx-auto"></div>';
        try {
            const query = "SELECT * FROM `Termine` WHERE `Datum` IS NULL";
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

        const table = document.createElement('table');
        table.className = 'appointments-table';
        table.innerHTML = `<thead><tr><th>Terminpartner</th><th>Mitarbeiter</th><th>Kontakt</th><th>Kontaktstatus</th><th>Aktion</th></tr></thead>`;
        const tbody = document.createElement('tbody');

        filteredPotentials.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = 'cursor-pointer';
            tr.dataset.id = p._id;
            const mitarbeiterName = p.Mitarbeiter_ID?.[0]?.display_value || 'N/A';
            tr.innerHTML = `
                <td><p class="font-bold">${p.Terminpartner || '-'}</p></td>
                <td>${mitarbeiterName}</td>
                <td>
                    <p>${p.Telefonnummer || '-'}</p>
                    <p class="text-xs text-gray-500">${p.Email || '-'}</p>
                </td>
                <td><span class="px-2 py-1 text-xs font-semibold rounded-full bg-skt-grey-medium text-skt-blue-light">${p.Kontaktstatus || '-'}</span></td>
                <td><button class="text-skt-blue hover:underline">Bearbeiten</button></td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        this.listContainer.appendChild(table);

        this.listContainer.querySelectorAll('tbody tr').forEach(tr => {
            tr.addEventListener('click', () => {
                const potential = this.allPotentials.find(p => p._id === tr.dataset.id);
                if (potential) this.openModal(potential);
            });
        });
    }

    setupEventListeners() {
        document.getElementById('add-potential-btn').addEventListener('click', () => this.openModal());
        document.getElementById('download-template-btn').addEventListener('click', () => this.downloadExcelTemplate());
        document.getElementById('import-excel-btn').addEventListener('click', () => {
            alert('Die Import-Funktion wird in Kürze verfügbar sein. Bitte verwenden Sie die heruntergeladene Vorlage.');
            // Hier würde die Logik zum Öffnen des Datei-Dialogs folgen
        });
        
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
            this.form.querySelector('#potential-kontaktstatus').value = potential.Kontaktiert || '';
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
            [SKT_APP.COLUMN_MAPS.termine.Status]: this.form.querySelector('#potential-kontaktstatus').value || null,
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

        if (!this.initialized) {
            this.setupEventListeners();
            this.initialized = true;
        }
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
        this.listContainer.appendChild(table);

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
        document.getElementById('close-umsatz-modal-btn').addEventListener('click', () => this.modal.classList.remove('visible'));
        document.getElementById('cancel-umsatz-btn').addEventListener('click', () => this.modal.classList.remove('visible'));
        document.getElementById('delete-umsatz-btn').addEventListener('click', () => this.handleDelete());
    }

    openModal(umsatz = null) {
        this.form.reset();
        const idInput = this.form.querySelector('#umsatz-id');
        const boFields = this.form.querySelector('#umsatz-bo-fields');
        const deleteBtn = this.form.querySelector('#delete-umsatz-btn');

        this.form.querySelector('#save-umsatz-btn').disabled = false;
        this.form.querySelector('#save-umsatz-btn').textContent = 'Speichern';

        const populateSelect = (selectId, data, displayField, selectedValue) => {
            umsatzLog(`Befülle Dropdown ${selectId} mit ${data.length} Einträgen. Display-Feld: '${displayField}'`);
            const select = this.form.querySelector(selectId);
            select.innerHTML = '<option value="">-- Bitte wählen --</option>';
            data.forEach(item => {
                const text = item[displayField];
                if (text === undefined) {
                    console.warn(`Display-Feld '${displayField}' nicht im Objekt gefunden für Dropdown ${selectId}.`, item);
                }
                select.add(new Option(text || '', item._id));
            });
            if (selectedValue) {
                umsatzLog(`Setze Wert für ${selectId} auf: ${selectedValue}`);
                select.value = selectedValue;
            }
        };

        const allUsers = [SKT_APP.authenticatedUserData, ...this.downline].filter(Boolean);
        allUsers.sort((a, b) => a.Name.localeCompare(b.Name));

        // WIEDERHERGESTELLT: Robuste Bestimmung des Anzeigenamens der primären Spalte
        const getDisplayColumn = (tableName) => {
            const tableMeta = SKT_APP.METADATA.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
            if (tableMeta && tableMeta.columns) {
                const primaryColumn = tableMeta.columns.find(c => c.is_primary);
                if (primaryColumn) {
                    return primaryColumn.name;
                }
            }
            return 'Name'; // Fallback
        };

        const gesellschaftenDisplayCol = getDisplayColumn('Gesellschaften');
        const produkteDisplayCol = getDisplayColumn('Produkte');

        if (umsatz) {
            this.lastSavedUmsatz = null; // Clear pre-fill cache when editing
            idInput.value = umsatz._id;
            this.form.querySelector('#umsatz-kunde').value = umsatz.Kunde || '';
            this.form.querySelector('#umsatz-eh').value = umsatz.EH || '';
            this.form.querySelector('#umsatz-hinweis-bo').value = umsatz.Hinweis_BO || '';
            this.form.querySelector('#umsatz-status-ok').checked = umsatz.Status_OK || false;
            
            populateSelect('#umsatz-mitarbeiter', allUsers, 'Name', umsatz?.Mitarbeiter_ID?.[0]?.row_id);
            populateSelect('#umsatz-gesellschaft', db.gesellschaften, gesellschaftenDisplayCol, umsatz?.Gesellschaft_ID?.[0]?.row_id);
            populateSelect('#umsatz-produkt', db.produkte, produkteDisplayCol, umsatz?.Produkt_ID?.[0]?.row_id);

            boFields.classList.remove('hidden');
            deleteBtn.classList.remove('hidden');
        } else {
            idInput.value = '';
            boFields.classList.add('hidden');
            deleteBtn.classList.add('hidden');

            if (this.lastSavedUmsatz) {
                umsatzLog('Fülle Formular mit zuletzt gespeicherten Daten.', this.lastSavedUmsatz);
                this.form.querySelector('#umsatz-kunde').value = this.lastSavedUmsatz.Kunde;
                this.form.querySelector('#umsatz-eh').value = ''; // EH bleibt leer
                populateSelect('#umsatz-mitarbeiter', allUsers, 'Name', this.lastSavedUmsatz.Mitarbeiter_ID);
                populateSelect('#umsatz-gesellschaft', db.gesellschaften, gesellschaftenDisplayCol, this.lastSavedUmsatz.Gesellschaft_ID);
                populateSelect('#umsatz-produkt', db.produkte, produkteDisplayCol, this.lastSavedUmsatz.Produkt_ID);
            } else {
                populateSelect('#umsatz-mitarbeiter', allUsers, 'Name', this.currentUserId);
                populateSelect('#umsatz-gesellschaft', db.gesellschaften, gesellschaftenDisplayCol, null);
                populateSelect('#umsatz-produkt', db.produkte, produkteDisplayCol, null);
            }
        }
        this.modal.classList.add('visible');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const saveBtn = this.form.querySelector('#save-umsatz-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Speichern...';

        const rowId = this.form.querySelector('#umsatz-id').value;
        const isNew = !rowId;

        const formData = {
            Kunde: this.form.querySelector('#umsatz-kunde').value,
            EH: parseFloat(this.form.querySelector('#umsatz-eh').value) || null,
            Mitarbeiter_ID: this.form.querySelector('#umsatz-mitarbeiter').value,
            Gesellschaft_ID: this.form.querySelector('#umsatz-gesellschaft').value,
            Produkt_ID: this.form.querySelector('#umsatz-produkt').value,
            Hinweis_BO: this.form.querySelector('#umsatz-hinweis-bo').value,
            Status_OK: this.form.querySelector('#umsatz-status-ok').checked,
        };

        const rowData = {
            [COLUMN_MAPS.umsatz.Kunde]: formData.Kunde,
            [COLUMN_MAPS.umsatz.EH]: formData.EH,
            [COLUMN_MAPS.umsatz.Mitarbeiter_ID]: formData.Mitarbeiter_ID ? [formData.Mitarbeiter_ID] : [],
            [COLUMN_MAPS.umsatz.Gesellschaft_ID]: formData.Gesellschaft_ID ? [formData.Gesellschaft_ID] : [],
            [COLUMN_MAPS.umsatz.Produkt_ID]: formData.Produkt_ID ? [formData.Produkt_ID] : [],
            [COLUMN_MAPS.umsatz.Hinweis_BO]: formData.Hinweis_BO,
            [COLUMN_MAPS.umsatz.Status_OK]: formData.Status_OK,
        };

        if (isNew) rowData[COLUMN_MAPS.umsatz.Datum] = new Date().toISOString().split('T')[0];

        const success = isNew 
            ? await seaTableAddUmsatzRow('Umsatz', rowData)
            : await seaTableUpdateUmsatzRow('Umsatz', rowId, rowData);

        if (success) {
            saveBtn.textContent = 'Gespeichert!';
            saveBtn.classList.remove('hover:bg-green-700');
            saveBtn.classList.add('bg-skt-green-accent');

            if (isNew) {
                this.lastSavedUmsatz = formData;
            } else {
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
        if (confirm('Möchten Sie diesen Umsatz wirklich löschen?')) {
            const success = await seaTableDeleteRow('Umsatz', rowId);
            if (success) {
                this.modal.classList.remove('visible');
                await this.fetchAndRender();
            } else {
                alert('Fehler beim Löschen.');
            }
        }
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

  dom.settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isUserLeader(authenticatedUserData)) {
      dom.superuserBtn.classList.remove("hidden");
    } else {
      dom.superuserBtn.classList.add("hidden");
    }

    if (dom.settingsMenu.classList.contains("hidden")) {
      dom.settingsMenu.classList.remove("hidden");
      setTimeout(() => dom.settingsMenu.classList.add("visible"), 10);
    } else {
      closeSettingsMenu();
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !dom.settingsMenu.contains(e.target) &&
      !dom.settingsBtn.contains(e.target)
    ) {
      closeSettingsMenu();
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
  dom.logoutBtn.addEventListener("click", () => {
    closeSettingsMenu();
    localStorage.clear(); // Löscht alles, inkl. Cache und Login-Status
    location.reload();
  });

  dom.clearCacheBtn.addEventListener("click", () => {
    closeSettingsMenu();
    localStorage.clear(); // Löscht alles, inkl. Cache und Login-Status
    location.reload();
  });

  dom.clearCacheBtn.addEventListener("click", () => {
    closeSettingsMenu();
    localStorage.clear();
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
    if (isSuperuserView) {
      isSuperuserView = false;
      const userId = localStorage.getItem("loggedInUserId");
      await fetchAndRenderDashboard(userId);
      return;
    }
    if (currentView === "einarbeitung" || currentView === "appointments") {
      if (
        currentOnboardingSubView === "trainee-detail" &&
        isUserLeader(authenticatedUserData)
      ) {
        const teamMembers = getSubordinates(authenticatedUserData._id, "gruppe");
        await renderLeaderOnboardingView(teamMembers);
        currentOnboardingSubView = "leader-list";
        dom.einarbeitungTitle.textContent = "Einarbeitung: Gruppen-Übersicht";
        dom.leaderOnboardingView.classList.remove("hidden");
        dom.traineeOnboardingView.classList.add("hidden");
      } else {
        switchView("dashboard");
      }
      updateBackButtonVisibility();
      return;
    }
    if (viewHistory.length > 1) {
      viewHistory.pop();
      const previousUserId = viewHistory[viewHistory.length - 1];
      await fetchAndRenderDashboard(previousUserId);
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
  });
  dom.teamViewBtn.addEventListener("click", () => {
    currentPlanningView = "team";
    dom.teamViewBtn.classList.add("active");
    dom.personalViewBtn.classList.remove("active");
    dom.strukturViewBtn.classList.remove("active");
    dom.monthlyPlanningTitle.textContent = "Gruppen-Übersicht";
    updateMonthlyPlanningView(teamData);
    updateLeadershipView();
  });
  dom.strukturViewBtn.addEventListener("click", () => {
    currentPlanningView = "struktur";
    dom.strukturViewBtn.classList.add("active");
    dom.teamViewBtn.classList.remove("active");
    dom.personalViewBtn.classList.remove("active");
    dom.monthlyPlanningTitle.textContent = "Struktur-Übersicht";
    updateMonthlyPlanningView(structureData);
    updateLeadershipView();
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

  dom.potentialHeaderBtn.addEventListener("click", () => {
    // NEU
    switchView("potential");
  });

  dom.umsatzHeaderBtn.addEventListener("click", () => {
    // NEU
    switchView("umsatz");
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
}

function switchView(viewName) {
  currentView = viewName;
  dom.mainDashboardView.classList.toggle(
    "hidden",
    viewName !== "dashboard"
  );
  dom.einarbeitungView.classList.toggle("hidden", viewName !== "einarbeitung");
  dom.appointmentsView.classList.toggle("hidden", viewName !== "appointments");
  dom.potentialView.classList.toggle("hidden", viewName !== "potential");
  dom.umsatzView.classList.toggle("hidden", viewName !== "umsatz");
  updateBackButtonVisibility();

  if (viewName === "appointments") {
    loadAndInitAppointmentsView();
  } else if (viewName === "potential") {
    loadAndInitPotentialView();
  } else if (viewName === "umsatz") {
    loadAndInitUmsatzView();
  }
}

let isInitializing = false;
async function initializeDashboard() {
  if (isInitializing) {
    console.warn("Initialisierung bereits im Gange. Überspringe.");
    return;
  }
  isInitializing = true;

  const dataLoaded = await loadAllData();

  if (!dataLoaded) {
    setStatus("Initialisierung fehlgeschlagen. Bitte Seite neu laden.", true);
    isInitializing = false;
    return;
  }

  const usersForLogin = db.mitarbeiter.filter((m) => m.Name);
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

  setupEventListeners();
  isInitializing = false;
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
    const apiKey = "";
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

// --- User Data Editing Modal ---
function openEditUserModal() {
  const user = currentlyViewedUserData;
  document.getElementById("edit-name").value = user.Name || "";
  document.getElementById("edit-pwd").value = user.PWD || "";
  document.getElementById("edit-eh-quote").value = user.EHproATQuote || 0;

  const statusSelect = document.getElementById("edit-status");
  const positionSelect = document.getElementById("edit-position");
  clearChildren(statusSelect);
  clearChildren(positionSelect);

  const mitarbeiterMeta = METADATA.tables.find(
    (t) => t.name.toLowerCase() === "mitarbeiter"
  );
  const statusCol = mitarbeiterMeta.columns.find(
    (c) => c.key === COLUMN_MAPS.mitarbeiter.Status
  );

  statusCol.data.options.forEach((opt) => {
    const optionEl = document.createElement("option");
    optionEl.value = opt.name;
    optionEl.textContent = opt.name;
    if (user.Status === opt.name) optionEl.selected = true;
    statusSelect.appendChild(optionEl);
  });

  db.karriereplan.forEach((plan) => {
    const optionEl = document.createElement("option");
    optionEl.value = plan.Stufe;
    optionEl.textContent = plan.Stufe;
    if (user.Karrierestufe === plan.Stufe) optionEl.selected = true;
    positionSelect.appendChild(optionEl);
  });

  dom.editUserModal.classList.add("visible");
  document.body.classList.add("modal-open");
}

function closeEditUserModal() {
  dom.editUserModal.classList.remove("visible");
  document.body.classList.remove("modal-open");
}

async function saveUserData() {
  const user = currentlyViewedUserData;
  const updatedRowData = {};

  updatedRowData[COLUMN_MAPS.mitarbeiter.Name] =
    document.getElementById("edit-name").value;
  updatedRowData[COLUMN_MAPS.mitarbeiter.PWD] =
    document.getElementById("edit-pwd").value;
  updatedRowData[COLUMN_MAPS.mitarbeiter.EHproATQuote] =
    parseFloat(document.getElementById("edit-eh-quote").value) || 0;
  updatedRowData[COLUMN_MAPS.mitarbeiter.Status] =
    document.getElementById("edit-status").value;

  const selectedPositionName = document.getElementById("edit-position").value;
  const selectedPositionRow = db.karriereplan.find(
    (p) => p.Stufe === selectedPositionName
  );
  if (selectedPositionRow) {
    updatedRowData[COLUMN_MAPS.mitarbeiter.Karrierestufe] = [
      selectedPositionRow._id,
    ];
  }

  dom.saveUserBtn.textContent = "Speichern...";
  dom.saveUserBtn.disabled = true;

  const success = await seaTableUpdateRow(
    "Mitarbeiter",
    user._id,
    updatedRowData
  );

  if (success) {
    closeEditUserModal();
    setStatus("Daten werden neu geladen...");
    await loadAllData();
    await fetchAndRenderDashboard(user._id);
  }

  dom.saveUserBtn.textContent = "Speichern";
  dom.saveUserBtn.disabled = false;
}

// --- START ---
document.addEventListener("DOMContentLoaded", initializeDashboard);

// Mache Kernfunktionen global verfügbar für andere Module/Dateien
window.SKT_APP = {
  seaTableSqlQuery,
  seaTableAddRow,
  seaTableUpdateRow,
  mapSqlResults,
  findRowById,
  getMonthlyCycleDates,
  escapeSql,
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