// Team-Planung Modal Funktionen
// Diese werden in main.js eingefügt

function openTeamPlanungModal() {
    // Lade alle Mitarbeiter in der Struktur des aktuellen Benutzers
    const currentUser = SKT_APP.currentlyViewedUserData;
    const isLeader = SKT_APP.getSubordinates(currentUser._id).length > 0;
    
    if (!isLeader) {
        alert('Diese Funktion ist nur für Führungskräfte verfügbar.');
        return;
    }
    
    // Button nur für Führungskräfte sichtbar machen
    if (dom.teamPlanungBtn) {
        dom.teamPlanungBtn.classList.remove('hidden');
    }
    
    // Alle Mitarbeiter in der Struktur laden
    const allSubordinates = SKT_APP.getAllSubordinatesRecursive(currentUser._id);
    renderTeamPlanungTable(allSubordinates);
    
    // Event-Listener für Suche und Filter
    setupTeamPlanungFilters();
    
    dom.teamPlanungModal.classList.add('visible');
    document.body.classList.add('modal-open');
}

function closeTeamPlanungModal() {
    dom.teamPlanungModal.classList.remove('visible');
    document.body.classList.remove('modal-open');
}

function renderTeamPlanungTable(employees) {
    const tbody = dom.teamPlanungTableBody;
    tbody.innerHTML = '';
    
    employees.forEach(emp => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.dataset.employeeId = emp._id;
        
        // Monatsplanung für aktuellen Monat laden
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        const planung = db.monatsplanung.find(p => 
            p.Mitarbeiter_ID === emp._id && 
            p.Monat === currentMonth && 
            p.Jahr === currentYear
        );
        
        row.innerHTML = `
            <td class="px-3 py-3 font-medium text-skt-blue">${emp.Name}</td>
            <td class="px-3 py-3 text-center">
                <input type="checkbox" 
                       class="h-4 w-4" 
                       ${emp.VA ? 'checked' : ''} 
                       onchange="updateEmployeeQualification('${emp._id}', 'VA', this.checked)">
            </td>
            <td class="px-3 py-3 text-center">
                <input type="checkbox" 
                       class="h-4 w-4" 
                       ${emp.VB ? 'checked' : ''} 
                       onchange="updateEmployeeQualification('${emp._id}', 'VB', this.checked)">
            </td>
            <td class="px-3 py-3 text-center">
                <input type="checkbox" 
                       class="h-4 w-4" 
                       ${emp.Immobilienexperte ? 'checked' : ''} 
                       onchange="updateEmployeeQualification('${emp._id}', 'Immobilienexperte', this.checked)">
            </td>
            <td class="px-3 py-3 text-center">
                <input type="checkbox" 
                       class="h-4 w-4" 
                       ${emp.Recruiter ? 'checked' : ''} 
                       onchange="updateEmployeeQualification('${emp._id}', 'Recruiter', this.checked)">
            </td>
            <td class="px-3 py-3 text-center">
                <input type="number" 
                       class="w-16 px-2 py-1 border border-gray-300 rounded text-center" 
                       value="${planung?.ATZiel || 0}"
                       onchange="updateMonthlyPlanningGoal('${emp._id}', 'ATZiel', this.value)">
            </td>
            <td class="px-3 py-3 text-center">
                <input type="number" 
                       class="w-16 px-2 py-1 border border-gray-300 rounded text-center" 
                       value="${planung?.BTZiel || 0}"
                       onchange="updateMonthlyPlanningGoal('${emp._id}', 'BTZiel', this.value)">
            </td>
            <td class="px-3 py-3 text-center">
                <input type="number" 
                       class="w-16 px-2 py-1 border border-gray-300 rounded text-center" 
                       value="${planung?.STZiel || 0}"
                       onchange="updateMonthlyPlanningGoal('${emp._id}', 'STZiel', this.value)">
            </td>
            <td class="px-3 py-3 text-center">
                <input type="number" 
                       class="w-16 px-2 py-1 border border-gray-300 rounded text-center" 
                       value="${planung?.ETZiel || 0}"
                       onchange="updateMonthlyPlanningGoal('${emp._id}', 'ETZiel', this.value)">
            </td>
            <td class="px-3 py-3 text-center">
                <button onclick="editEmployeeDetails('${emp._id}')" 
                        class="text-skt-blue hover:text-skt-blue-light">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function setupTeamPlanungFilters() {
    const searchInput = dom.teamPlanungSearch;
    const filterVA = document.getElementById('filter-va');
    const filterVB = document.getElementById('filter-vb');
    const filterImmo = document.getElementById('filter-immo');
    const filterRecruiter = document.getElementById('filter-recruiter');
    
    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const currentUser = SKT_APP.currentlyViewedUserData;
        let employees = SKT_APP.getAllSubordinatesRecursive(currentUser._id);
        
        // Suchfilter
        if (searchTerm) {
            employees = employees.filter(e => e.Name.toLowerCase().includes(searchTerm));
        }
        
        // Qualifikationsfilter
        if (filterVA.checked) {
            employees = employees.filter(e => e.VA === true);
        }
        if (filterVB.checked) {
            employees = employees.filter(e => e.VB === true);
        }
        if (filterImmo.checked) {
            employees = employees.filter(e => e.Immobilienexperte === true);
        }
        if (filterRecruiter.checked) {
            employees = employees.filter(e => e.Recruiter === true);
        }
        
        renderTeamPlanungTable(employees);
    };
    
    searchInput.addEventListener('input', applyFilters);
    filterVA.addEventListener('change', applyFilters);
    filterVB.addEventListener('change', applyFilters);
    filterImmo.addEventListener('change', applyFilters);
    filterRecruiter.addEventListener('change', applyFilters);
}

async function updateEmployeeQualification(employeeId, field, value) {
    try {
        const columnKey = SKT_APP.COLUMN_MAPS.mitarbeiter[field];
        if (!columnKey) {
            console.error(`Spalte ${field} nicht in COLUMN_MAPS gefunden`);
            return;
        }
        
        const dataToUpdate = {
            [columnKey]: value
        };
        
        await SKT_APP.seaTableUpdateRow('Mitarbeiter', employeeId, dataToUpdate);
        
        // Cache invalidieren und neu laden
        localStorage.removeItem(SKT_APP.CACHE_PREFIX + 'mitarbeiter');
        db.mitarbeiter = await SKT_APP.seaTableQuery('Mitarbeiter');
        
        console.log(`${field} für Mitarbeiter ${employeeId} auf ${value} aktualisiert`);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Qualifikation:', error);
        alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
}

async function updateMonthlyPlanningGoal(employeeId, goalType, value) {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        // Prüfen, ob bereits eine Planung existiert
        let planung = db.monatsplanung.find(p => 
            p.Mitarbeiter_ID === employeeId && 
            p.Monat === currentMonth && 
            p.Jahr === currentYear
        );
        
        const columnKey = SKT_APP.COLUMN_MAPS.monatsplanung[goalType];
        if (!columnKey) {
            console.error(`Spalte ${goalType} nicht in COLUMN_MAPS gefunden`);
            return;
        }
        
        const dataToUpdate = {
            [columnKey]: parseInt(value) || 0
        };
        
        if (planung) {
            // Update existing
            await SKT_APP.seaTableUpdateRow('Monatsplanung', planung._id, dataToUpdate);
        } else {
            // Create new
            const newPlanungData = {
                [SKT_APP.COLUMN_MAPS.monatsplanung.Mitarbeiter_ID]: [employeeId],
                [SKT_APP.COLUMN_MAPS.monatsplanung.Monat]: currentMonth,
                [SKT_APP.COLUMN_MAPS.monatsplanung.Jahr]: currentYear,
                ...dataToUpdate
            };
            await SKT_APP.seaTableAddRow('Monatsplanung', newPlanungData);
        }
        
        // Cache invalidieren und neu laden
        localStorage.removeItem(SKT_APP.CACHE_PREFIX + 'monatsplanung');
        db.monatsplanung = await SKT_APP.seaTableQuery('Monatsplanung');
        
        console.log(`${goalType} für Mitarbeiter ${employeeId} auf ${value} aktualisiert`);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Monatsziels:', error);
        alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
}

function editEmployeeDetails(employeeId) {
    // Diese Funktion könnte ein Detail-Modal öffnen oder zur Personendaten-Ansicht navigieren
    const employee = db.mitarbeiter.find(e => e._id === employeeId);
    if (employee) {
        // Navigiere zur Ansicht dieses Mitarbeiters
        SKT_APP.currentlyViewedUserData = employee;
        closeTeamPlanungModal();
        openEditUserModal();
    }
}
