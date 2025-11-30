// ===== ACCESS CODE CONFIGURATION =====
// TO CHANGE ACCESS CODE: Modify the default value below (line 23)
// Current default access code: '1234'

// ===== AUTO-UPDATER =====
const { ipcRenderer } = require('electron');

// Listen for version info
ipcRenderer.on('app-version', (event, version) => {
    const versionEl = document.getElementById('app-version');
    if (versionEl) {
        versionEl.textContent = `v${version}`;
    }
});

// Listen for update available
ipcRenderer.on('update-available', (event, version) => {
    const notification = document.getElementById('update-notification');
    const message = document.getElementById('update-message');
    message.textContent = `Update v${version} is downloading...`;
    notification.style.display = 'block';
});

// Listen for download progress
ipcRenderer.on('download-progress', (event, percent) => {
    const message = document.getElementById('update-message');
    message.textContent = `Downloading update... ${Math.round(percent)}%`;
});

// Listen for update downloaded
ipcRenderer.on('update-downloaded', (event, version) => {
    const notification = document.getElementById('update-notification');
    const message = document.getElementById('update-message');
    const installBtn = document.getElementById('install-update-btn');
    
    message.textContent = `Update v${version} ready to install!`;
    installBtn.style.display = 'block';
    notification.style.display = 'block';
});

// Install update button handler
document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('install-update-btn');
    if (installBtn) {
        installBtn.addEventListener('click', () => {
            ipcRenderer.send('install-update');
        });
    }
});

// ===== DISCORD WEBHOOK CONFIGURATION =====
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1444702169239392469/MbP5XARTrZ4G7kLgj-_iP9VQ3frh5_PV4YOx7DUcOs5OpIN6oav1Y30gG_WHdRDrsfKY';

async function sendDiscordWebhook(title, description, color, fields = []) {
    try {
        const embed = {
            title: title,
            description: description,
            color: color,
            fields: fields,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'BLRPC Control Room System'
            }
        };

        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embed]
            })
        });
    } catch (error) {
        console.error('Discord webhook error:', error);
    }
}

// ===== STATE MANAGEMENT =====
let appState = {
    operator: null,
    dutyStartTime: null,
    dutyTimerInterval: null,
    cads: [],
    units: [],
    forms: {
        incidentLogs: [],
        majorIncidents: [],
        callTakingRecords: []
    },
    nextCadNumber: 1,
    currentCadDetail: null,
    accessCode: null
};

// ===== ACCESS CODE MANAGEMENT =====
function loadAccessCode() {
    const saved = localStorage.getItem('controlRoomAccessCode');
    if (saved) {
        appState.accessCode = saved;
    } else {
        // Default access code on first run
        appState.accessCode = '1234';
        localStorage.setItem('controlRoomAccessCode', appState.accessCode);
    }
}

function saveAccessCode(newCode) {
    appState.accessCode = newCode;
    localStorage.setItem('controlRoomAccessCode', newCode);
}

// Load access code on startup
loadAccessCode();

// ===== UTILITY FUNCTIONS =====
function generateCADReference() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const ref = String(appState.nextCadNumber).padStart(6, '0');
    appState.nextCadNumber++;
    return `${ref}/${day}${month}${year.toString().slice(2)}`;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDateTime(date) {
    return date.toLocaleString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    });
}

function calculateDuration(startTime) {
    const now = new Date();
    const diff = now - startTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function saveToLocalStorage() {
    const stateData = {
        nextCadNumber: appState.nextCadNumber,
        cads: appState.cads.map(cad => ({
            ...cad,
            startTime: cad.startTime.toISOString(),
            endTime: cad.endTime ? cad.endTime.toISOString() : null
        })),
        units: appState.units,
        forms: appState.forms,
        lastModified: new Date().toISOString()
    };
    localStorage.setItem('controlRoomState', JSON.stringify(stateData));
    // Trigger storage event for other windows
    localStorage.setItem('controlRoomSync', Date.now().toString());
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('controlRoomState');
    if (saved) {
        const data = JSON.parse(saved);
        appState.nextCadNumber = data.nextCadNumber || 1;
        appState.cads = data.cads.map(cad => ({
            ...cad,
            startTime: new Date(cad.startTime),
            endTime: cad.endTime ? new Date(cad.endTime) : null
        }));
        appState.units = data.units || [];
        appState.forms = data.forms || { incidentLogs: [], majorIncidents: [], callTakingRecords: [] };
    }
}

function syncFromStorage() {
    const currentScreen = document.querySelector('.screen.active');
    const wasDetailOpen = appState.currentCadDetail;
    const isModalOpen = document.querySelector('.modal.active');
    
    loadFromLocalStorage();
    
    // Only update displays if logged in
    if (appState.operator) {
        // Don't refresh lists if a modal is open (prevents interruption)
        if (!isModalOpen) {
            renderCADList();
            renderUnitsList();
        }
        
        // If on forms screen, update forms
        if (currentScreen && currentScreen.id === 'forms-screen' && !isModalOpen) {
            renderFormLogs();
        }
        
        // If CAD detail was open, refresh only the content, not the list
        if (wasDetailOpen && isModalOpen) {
            const cad = appState.cads.find(c => c.reference === wasDetailOpen);
            if (cad) {
                renderAssignedUnits(cad);
                renderCADComments(cad);
            } else {
                // CAD was deleted, close the modal
                hideModal('cad-detail-modal');
            }
        }
    }
}

// Listen for storage events from other windows/tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'controlRoomSync' && appState.operator) {
        syncFromStorage();
    }
});

// Periodic sync check every 2 seconds
setInterval(() => {
    if (appState.operator) {
        syncFromStorage();
    }
}, 2000);

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== LOGIN FUNCTIONALITY =====
document.getElementById('book-on-btn').addEventListener('click', () => {
    const accessCode = document.getElementById('access-code').value;
    const name = document.getElementById('operator-name').value.trim();
    const id = document.getElementById('operator-id').value.trim();
    
    if (!accessCode) {
        alert('Please enter access code');
        return;
    }
    
    if (accessCode !== appState.accessCode) {
        alert('Invalid access code');
        document.getElementById('access-code').value = '';
        return;
    }
    
    if (!name || !id) {
        alert('Please enter both operator name and ID');
        return;
    }
    
    appState.operator = { name, id };
    appState.dutyStartTime = new Date();
    
    document.getElementById('operator-info').textContent = `${name} (${id})`;
    
    // Start duty timer
    appState.dutyTimerInterval = setInterval(updateDutyTimer, 1000);
    updateDutyTimer();
    
    // Set operator in forms
    if (document.getElementById('incident-operator')) {
        document.getElementById('incident-operator').value = name;
    }
    if (document.getElementById('call-taker')) {
        document.getElementById('call-taker').value = name;
    }
    
    loadFromLocalStorage();
    renderCADList();
    renderUnitsList();
    
    // Send Discord notification
    sendDiscordWebhook(
        '👮 Operator Booked On',
        `**${name}** (${id}) has started their shift`,
        3447003,
        [
            { name: 'Operator', value: name, inline: true },
            { name: 'ID', value: id, inline: true }
        ]
    );
    
    // Add event listener for clear units button
    document.getElementById('clear-units-btn').addEventListener('click', clearAllUnits);
    
    // Add event listener for confirm clear units button
    document.getElementById('confirm-clear-units-btn').addEventListener('click', confirmClearUnits);
    
    showScreen('dashboard-screen');
});

function updateDutyTimer() {
    if (appState.dutyStartTime) {
        document.getElementById('duty-timer').textContent = calculateDuration(appState.dutyStartTime);
    }
}

document.getElementById('book-off-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to book off duty?')) {
        const operatorName = appState.operator.name;
        const operatorId = appState.operator.id;
        
        // Send Discord notification
        sendDiscordWebhook(
            '👋 Operator Booked Off',
            `**${operatorName}** (${operatorId}) has ended their shift`,
            15158332,
            [
                { name: 'Operator', value: operatorName, inline: true },
                { name: 'ID', value: operatorId, inline: true }
            ]
        );
        
        clearInterval(appState.dutyTimerInterval);
        appState.operator = null;
        appState.dutyStartTime = null;
        document.getElementById('access-code').value = '';
        document.getElementById('operator-name').value = '';
        document.getElementById('operator-id').value = '';
        showScreen('login-screen');
    }
});

// ===== FORMS NAVIGATION =====
document.getElementById('forms-btn').addEventListener('click', () => {
    showScreen('forms-screen');
    renderFormLogs();
});

document.getElementById('back-to-dashboard-btn').addEventListener('click', () => {
    showScreen('dashboard-screen');
});

// ===== FIDS NAVIGATION =====
document.getElementById('fids-btn').addEventListener('click', () => {
    showScreen('fids-screen');
    resetFIDS();
    
    // Send Discord notification
    sendDiscordWebhook(
        '🔫 FIDS Opened',
        `Firearms Incident Deployment System has been accessed`,
        16776960, // Yellow
        [
            { name: 'Accessed By', value: appState.operator.name, inline: true },
            { name: 'Operator ID', value: appState.operator.id, inline: true }
        ]
    );
});

document.getElementById('back-to-dashboard-fids-btn').addEventListener('click', () => {
    showScreen('dashboard-screen');
});

// ===== FIDS SYSTEM =====
let fidsState = {
    activeThreat: null,
    possession: null,
    accessToWeapon: null,
    appropriate: null,
    subjectPosition: null,
    victim: null,
    victimLocation: null,
    vehicleStatus: null,
    buildingType: null,
    otherResidents: null
};

function resetFIDS() {
    fidsState = {
        activeThreat: null,
        possession: null,
        accessToWeapon: null,
        appropriate: null,
        subjectPosition: null,
        victim: null,
        victimLocation: null,
        vehicleStatus: null,
        buildingType: null,
        otherResidents: null
    };
    
    const display = document.getElementById('fids-display');
    display.innerHTML = `
        <div class="fids-card fids-start">
            <h1>FIREARMS INCIDENT<br>DEPLOYMENT SYSTEM</h1>
            <button id="start-fids-btn" class="btn-fids-start">START FIREARMS GRADING</button>
        </div>
    `;
    
    document.getElementById('start-fids-btn').addEventListener('click', () => {
        showFIDSQuestion('activeThreat');
    });
}

function showFIDSQuestion(question) {
    const display = document.getElementById('fids-display');
    
    if (question === 'activeThreat') {
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">ACTIVE THREAT</div>
                <h2 class="fids-question-title">ACTIVE THREAT</h2>
                <p class="fids-question-subtitle">Is the subject actively attacking people with a weapon?</p>
                <div class="fids-options two-column">
                    <button class="fids-option-btn yes" onclick="handleFIDSAnswer('activeThreat', 'YES')">YES</button>
                    <button class="fids-option-btn no" onclick="handleFIDSAnswer('activeThreat', 'NO')">NO</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    } else if (question === 'possession') {
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">POSSESSION</div>
                <h2 class="fids-question-title">POSSESSION</h2>
                <p class="fids-question-subtitle">Is there reason to believe the subject is in possession of a firearm or otherwise potentially lethal weapon?</p>
                <div class="fids-options" style="grid-template-columns: 1fr 1fr 1fr;">
                    <button class="fids-option-btn yes" onclick="handleFIDSAnswer('possession', 'YES')">YES</button>
                    <button class="fids-option-btn maybe" onclick="handleFIDSAnswer('possession', 'MAYBE')">MAYBE</button>
                    <button class="fids-option-btn no" onclick="handleFIDSAnswer('possession', 'NO')">NO</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    } else if (question === 'accessToWeapon') {
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">ACCESS TO A WEAPON</div>
                <h2 class="fids-question-title">ACCESS TO A WEAPON</h2>
                <p class="fids-question-subtitle">Does the subject have immediate access to a firearm or otherwise potentially lethal weapon?</p>
                <div class="fids-options two-column">
                    <button class="fids-option-btn yes" onclick="handleFIDSAnswer('accessToWeapon', 'YES')">YES</button>
                    <button class="fids-option-btn no" onclick="handleFIDSAnswer('accessToWeapon', 'NO')">NO</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    } else if (question === 'appropriate') {
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">APPROPRIATE</div>
                <h2 class="fids-question-title">APPROPRIATE</h2>
                <p class="fids-question-subtitle">Is the subject so dangerous that the deployment of armed officers is considered to be appropriate?</p>
                <div class="fids-options two-column">
                    <button class="fids-option-btn yes" onclick="handleFIDSAnswer('appropriate', 'YES')">YES</button>
                    <button class="fids-option-btn no" onclick="handleFIDSAnswer('appropriate', 'NO')">NO</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    } else if (question === 'subjectPosition') {
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">SUBJECT POSITION</div>
                <h2 class="fids-question-title">SUBJECT POSITION</h2>
                <p class="fids-question-subtitle">Where is the subject?</p>
                <div class="fids-options four-grid">
                    <button class="fids-option-btn on-foot" onclick="handleFIDSAnswer('subjectPosition', 'ON_FOOT')">ON FOOT</button>
                    <button class="fids-option-btn in-vehicle" onclick="handleFIDSAnswer('subjectPosition', 'IN_VEHICLE')">IN VEHICLE</button>
                    <button class="fids-option-btn in-building" onclick="handleFIDSAnswer('subjectPosition', 'IN_BUILDING')">IN BUILDING</button>
                    <button class="fids-option-btn unknown" onclick="handleFIDSAnswer('subjectPosition', 'UNKNOWN')">UNKNOWN</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    } else if (question === 'victim') {
        const context = fidsState.subjectPosition === 'ON_FOOT' ? 'SUBJECT ON FOOT' : 
                       fidsState.subjectPosition === 'IN_VEHICLE' ? 'SUBJECT IN VEHICLE' : 'SUBJECT IN BUILDING';
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">${context}</div>
                <h2 class="fids-question-title">VICTIM</h2>
                <p class="fids-question-subtitle">Is there a specific victim?</p>
                <div class="fids-options two-column">
                    <button class="fids-option-btn yes" onclick="handleFIDSAnswer('victim', 'YES')">YES</button>
                    <button class="fids-option-btn no" onclick="handleFIDSAnswer('victim', 'NO')">NO</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    } else if (question === 'victimLocation') {
        const context = fidsState.subjectPosition === 'ON_FOOT' ? 'SUBJECT ON FOOT' : 
                       fidsState.subjectPosition === 'IN_VEHICLE' ? 'SUBJECT IN VEHICLE' : 'SUBJECT IN BUILDING';
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">${context}</div>
                <h2 class="fids-question-title">VICTIM LOCATION</h2>
                <p class="fids-question-subtitle">Is the victim currently with the subject in question?</p>
                <div class="fids-options two-column">
                    <button class="fids-option-btn yes" onclick="handleFIDSAnswer('victimLocation', 'YES')">YES</button>
                    <button class="fids-option-btn no" onclick="handleFIDSAnswer('victimLocation', 'NO')">NO</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    } else if (question === 'vehicleStatus') {
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">SUBJECT IN VEHICLE</div>
                <h2 class="fids-question-title">VEHICLE STATUS</h2>
                <p class="fids-question-subtitle">Is the subject's vehicle mobile?</p>
                <div class="fids-options two-column">
                    <button class="fids-option-btn yes" onclick="handleFIDSAnswer('vehicleStatus', 'YES')">YES</button>
                    <button class="fids-option-btn no" onclick="handleFIDSAnswer('vehicleStatus', 'NO')">NO</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    } else if (question === 'buildingType') {
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">SUBJECT IN BUILDING</div>
                <h2 class="fids-question-title">BUILDING</h2>
                <p class="fids-question-subtitle">Is the building in question a detached residential property?</p>
                <div class="fids-options two-column">
                    <button class="fids-option-btn yes" onclick="handleFIDSAnswer('buildingType', 'YES')">YES</button>
                    <button class="fids-option-btn no" onclick="handleFIDSAnswer('buildingType', 'NO')">NO</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    } else if (question === 'otherResidents') {
        display.innerHTML = `
            <div class="fids-card fids-question active">
                <div class="fids-question-header">SUBJECT IN BUILDING</div>
                <h2 class="fids-question-title">OTHER RESIDENTS</h2>
                <p class="fids-question-subtitle">Are other residents believed to be in the property?</p>
                <div class="fids-options two-column">
                    <button class="fids-option-btn yes" onclick="handleFIDSAnswer('otherResidents', 'YES')">YES</button>
                    <button class="fids-option-btn no" onclick="handleFIDSAnswer('otherResidents', 'NO')">NO</button>
                </div>
                <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
            </div>
        `;
    }
}

function handleFIDSAnswer(question, answer) {
    fidsState[question] = answer;
    
    // Decision tree logic
    if (question === 'activeThreat') {
        if (answer === 'YES') {
            showFIDSResult('activeThreat');
        } else {
            showFIDSQuestion('possession');
        }
    } else if (question === 'possession') {
        if (answer === 'NO') {
            showFIDSResult('noCause');
        } else {
            showFIDSQuestion('accessToWeapon');
        }
    } else if (question === 'accessToWeapon') {
        if (answer === 'NO') {
            showFIDSResult('noCause');
        } else {
            showFIDSQuestion('appropriate');
        }
    } else if (question === 'appropriate') {
        if (answer === 'NO') {
            showFIDSResult('noCause');
        } else {
            showFIDSQuestion('subjectPosition');
        }
    } else if (question === 'subjectPosition') {
        if (answer === 'UNKNOWN') {
            showFIDSResult('noCause');
        } else {
            showFIDSQuestion('victim');
        }
    } else if (question === 'victim') {
        if (answer === 'YES') {
            showFIDSQuestion('victimLocation');
        } else {
            // No victim - proceed to position-specific questions
            if (fidsState.subjectPosition === 'ON_FOOT') {
                showFIDSResult('onFootNoVictim');
            } else if (fidsState.subjectPosition === 'IN_VEHICLE') {
                showFIDSQuestion('vehicleStatus');
            } else if (fidsState.subjectPosition === 'IN_BUILDING') {
                showFIDSQuestion('buildingType');
            }
        }
    } else if (question === 'victimLocation') {
        if (fidsState.subjectPosition === 'ON_FOOT') {
            showFIDSResult(answer === 'YES' ? 'onFootVictimWith' : 'onFootVictimSeparate');
        } else if (fidsState.subjectPosition === 'IN_VEHICLE') {
            if (answer === 'YES') {
                showFIDSQuestion('vehicleStatus');
            } else {
                showFIDSResult('vehicleVictimSeparate');
            }
        } else if (fidsState.subjectPosition === 'IN_BUILDING') {
            if (answer === 'YES') {
                showFIDSQuestion('buildingType');
            } else {
                showFIDSResult('buildingVictimSeparate');
            }
        }
    } else if (question === 'vehicleStatus') {
        if (fidsState.victim === 'YES' && fidsState.victimLocation === 'YES') {
            showFIDSResult(answer === 'YES' ? 'vehicleVictimWithMobile' : 'vehicleVictimWithStatic');
        } else {
            showFIDSResult(answer === 'YES' ? 'vehicleNoVictimMobile' : 'vehicleNoVictimStatic');
        }
    } else if (question === 'buildingType') {
        if (answer === 'YES') {
            showFIDSQuestion('otherResidents');
        } else {
            if (fidsState.victim === 'YES' && fidsState.victimLocation === 'YES') {
                showFIDSResult('buildingVictimWithNonDetached');
            } else {
                showFIDSResult('buildingNoVictimNonDetached');
            }
        }
    } else if (question === 'otherResidents') {
        if (fidsState.victim === 'YES' && fidsState.victimLocation === 'YES') {
            showFIDSResult(answer === 'YES' ? 'buildingVictimWithDetachedOthers' : 'buildingVictimWithDetachedNoOthers');
        } else {
            showFIDSResult(answer === 'YES' ? 'buildingNoVictimDetachedOthers' : 'buildingNoVictimDetachedNoOthers');
        }
    }
}

function showFIDSResult(scenario) {
    const display = document.getElementById('fids-display');
    let resultData = getFIDSResultData(scenario);
    
    display.innerHTML = `
        <div class="fids-card fids-result active">
            <div class="fids-result-header ${scenario === 'noCause' ? 'no-cause' : ''}">
                <h2>${resultData.title}</h2>
                ${resultData.subtitle ? `<p class="fids-result-subtitle">${resultData.subtitle}</p>` : ''}
            </div>
            <div class="fids-result-grid">
                <div class="fids-result-section">
                    <h3>Deployment Details</h3>
                    <div class="fids-result-item">
                        <span class="fids-result-label">TACTIC SELECTED:</span>
                        <span class="fids-result-value">${resultData.tactic}</span>
                    </div>
                    <div class="fids-result-item">
                        <span class="fids-result-label">TYPE OF DEPLOYMENT:</span>
                        <span class="fids-result-value">${resultData.deploymentType}</span>
                    </div>
                    <div class="fids-result-item">
                        <span class="fids-result-label">REQUIRED TROJANS:</span>
                        <span class="fids-result-value">${resultData.trojans}</span>
                    </div>
                    <div class="fids-result-item">
                        <span class="fids-result-label">WORKING STRATEGY:</span>
                        <span class="fids-result-value">${resultData.strategy}</span>
                    </div>
                </div>
                <div class="fids-result-section">
                    <h3>Initial Risk Assessment</h3>
                    <div class="fids-result-item">
                        <span class="fids-result-label">VICTIM:</span>
                        <span class="fids-risk-badge ${resultData.risks.victim.toLowerCase()}">${resultData.risks.victim}</span>
                    </div>
                    <div class="fids-result-item">
                        <span class="fids-result-label">PUBLIC:</span>
                        <span class="fids-risk-badge ${resultData.risks.public.toLowerCase()}">${resultData.risks.public}</span>
                    </div>
                    <div class="fids-result-item">
                        <span class="fids-result-label">POLICE:</span>
                        <span class="fids-risk-badge ${resultData.risks.police.toLowerCase()}">${resultData.risks.police}</span>
                    </div>
                    <div class="fids-result-item">
                        <span class="fids-result-label">SUBJECT:</span>
                        <span class="fids-risk-badge ${resultData.risks.subject.toLowerCase()}">${resultData.risks.subject}</span>
                    </div>
                </div>
            </div>
            <div class="fids-result-notes">
                <h3>ADDITIONAL INFORMATION</h3>
                <ul>
                    ${resultData.notes.map(note => `<li>${note}</li>`).join('')}
                </ul>
            </div>
            <button class="fids-restart-btn" onclick="resetFIDS()">RESTART DEPLOYMENT</button>
        </div>
    `;
}

function getFIDSResultData(scenario) {
    const results = {
        noCause: {
            title: 'NO CAUSE TO DECLARE A FIREARMS INCIDENT',
            subtitle: 'GIVEN THE INFORMATION PROVIDED',
            tactic: 'N/A',
            deploymentType: 'N/A',
            trojans: 'N/A',
            strategy: 'N/A',
            risks: { victim: 'LOW', public: 'LOW', police: 'LOW', subject: 'LOW' },
            notes: ['No firearms deployment required based on current information.']
        },
        activeThreat: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: 'ACTIVE THREAT / MXA DEPLOYMENT',
            tactic: 'Officer Discretion',
            deploymentType: 'STRAIGHT TO SCENE',
            trojans: 'ALL AVAILABLE',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'HIGH', public: 'HIGH', police: 'HIGH', subject: 'HIGH' },
            notes: [
                'Available RESPONSE callsigns should be placed on standby to attend.',
                'The NATIONAL POLICE AIR SERVICE should be tasked.',
                'Any COUNTER-TERROR callsigns should be placed on standby to attend.'
            ]
        },
        onFootVictimWith: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Pedestrian Armed Interception',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '1 ARV or 1 NODDY CAR',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'MEDIUM', public: 'MEDIUM', police: 'LOW', subject: 'LOW' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'The NATIONAL POLICE AIR SERVICE should be tasked.',
                'DOGS should be tasked.'
            ]
        },
        onFootVictimSeparate: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Pedestrian Armed Enquiry',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '1 ARV or 1 NODDY CAR',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'LOW', police: 'LOW', subject: 'LOW' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.'
            ]
        },
        onFootNoVictim: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Pedestrian Armed Enquiry',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '1 ARV or 1 NODDY CAR',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'LOW', police: 'LOW', subject: 'LOW' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.'
            ]
        },
        vehicleVictimWithMobile: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Enforced Stop, Containment and Callout',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'MEDIUM', public: 'MEDIUM', police: 'MEDIUM', subject: 'MEDIUM' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.',
                'ANPR WARNING MARKERS should be applied immediately.'
            ]
        },
        vehicleVictimWithStatic: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Emergency Search',
            deploymentType: 'STRAIGHT TO SCENE and WAIT',
            trojans: '2 ARVs or 2 NODDY CARs',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'MEDIUM', public: 'LOW', police: 'HIGH', subject: 'MEDIUM' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.'
            ]
        },
        vehicleVictimSeparate: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Enforced Stop, Armed Enquiry',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'LOW', police: 'MEDIUM', subject: 'LOW' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.',
                'ANPR WARNING MARKERS should be applied immediately.'
            ]
        },
        vehicleNoVictimMobile: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Enforced Stop, Armed Enquiry',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'LOW', police: 'MEDIUM', subject: 'LOW' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.',
                'ANPR WARNING MARKERS should be applied immediately.'
            ]
        },
        vehicleNoVictimStatic: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Deliberate Search',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs or 2 NODDY CARs',
            strategy: 'Minimise risk to victim(s). Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'LOW', police: 'MEDIUM', subject: 'MEDIUM' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.'
            ]
        },
        buildingVictimWithNonDetached: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Enforced Stop, Containment and Callout',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'MEDIUM', public: 'MEDIUM', police: 'MEDIUM', subject: 'MEDIUM' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.',
                'ANPR WARNING MARKERS should be applied immediately.'
            ]
        },
        buildingVictimWithDetachedOthers: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Containment and Callout',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs or 2 NODDY CARs',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'MEDIUM', police: 'LOW', subject: 'LOW' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.'
            ]
        },
        buildingVictimWithDetachedNoOthers: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Containment and Callout',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs or 2 NODDY CARs',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'MEDIUM', police: 'LOW', subject: 'LOW' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.'
            ]
        },
        buildingVictimSeparate: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Deliberate Search',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs or 2 NODDY CARs',
            strategy: 'Minimise risk to victim(s). Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'LOW', police: 'MEDIUM', subject: 'MEDIUM' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.'
            ]
        },
        buildingNoVictimNonDetached: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Containment and Callout',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs or 2 NODDY CARs',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'MEDIUM', police: 'LOW', subject: 'LOW' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.'
            ]
        },
        buildingNoVictimDetachedOthers: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Containment and Callout',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs or 2 NODDY CARs',
            strategy: 'Minimise risk to victim(s). Minimise risk to the public. Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'MEDIUM', police: 'LOW', subject: 'LOW' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.'
            ]
        },
        buildingNoVictimDetachedNoOthers: {
            title: 'DECLARED FIREARMS INCIDENT',
            subtitle: '',
            tactic: 'Deliberate Search',
            deploymentType: 'RENDEZVOUS and WAIT',
            trojans: '2 ARVs or 2 NODDY CARs',
            strategy: 'Minimise risk to victim(s). Maximise the safety of police.',
            risks: { victim: 'LOW', public: 'LOW', police: 'MEDIUM', subject: 'MEDIUM' },
            notes: [
                'Suitable RESPONSE callsigns should be placed on standby to attend.',
                'DOGS should be tasked.'
            ]
        }
    };
    
    return results[scenario] || results.noCause;
}

// Forms tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tab).classList.add('active');
    });
});

// ===== CAD MANAGEMENT =====
document.getElementById('create-cad-btn').addEventListener('click', () => {
    showModal('create-cad-modal');
});

document.getElementById('submit-cad-btn').addEventListener('click', (e) => {
    e.preventDefault();
    
    const type = document.getElementById('new-cad-type').value;
    const location = document.getElementById('new-cad-location').value;
    const grading = document.getElementById('new-cad-grading').value;
    const description = document.getElementById('new-cad-description').value;
    const channel = document.getElementById('new-cad-channel').value;
    
    if (!type || !location || !grading || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    const cad = {
        id: Date.now(),
        reference: generateCADReference(),
        type,
        location,
        grading,
        description,
        channel,
        status: 'ON SCENE',
        startTime: new Date(),
        endTime: null,
        assignedUnits: [],
        comments: []
    };
    
    appState.cads.unshift(cad);
    saveToLocalStorage();
    renderCADList();
    
    // Send Discord notification
    const gradingColors = {
        'IMMEDIATE': 15158332, // Red
        'DELAYED': 16098851,   // Orange
        'STANDARD': 3447003    // Blue
    };
    
    sendDiscordWebhook(
        '🚨 New CAD Created',
        `A new call has been logged in the system`,
        gradingColors[grading] || 3447003,
        [
            { name: 'CAD Reference', value: cad.reference, inline: true },
            { name: 'Grading', value: grading, inline: true },
            { name: 'Type', value: type, inline: false },
            { name: 'Location', value: location, inline: false },
            { name: 'Description', value: description.substring(0, 100) + (description.length > 100 ? '...' : ''), inline: false },
            { name: 'Channel', value: channel || 'N/A', inline: true },
            { name: 'Logged By', value: appState.operator.name, inline: true }
        ]
    );
    
    document.getElementById('create-cad-form').reset();
    hideModal('create-cad-modal');
});

function renderCADList() {
    const cadList = document.getElementById('cad-list');
    const activeCads = appState.cads.filter(cad => !cad.endTime);
    
    document.getElementById('cad-count').textContent = `${activeCads.length} Open CADs`;
    
    if (activeCads.length === 0) {
        cadList.innerHTML = `
            <div class="empty-state">
                <p>No active CADs</p>
                <p class="empty-state-sub">Create a new call to get started</p>
            </div>
        `;
        return;
    }
    
    cadList.innerHTML = activeCads.map(cad => `
        <div class="cad-item ${cad.grading.toLowerCase().replace('/', '')}" onclick="openCADDetail(${cad.id})">
            <div class="cad-item-header">
                <span class="cad-reference">${cad.reference}</span>
                <span class="cad-grading ${cad.grading.toLowerCase().replace('/', '')}">${cad.grading}</span>
            </div>
            <div class="cad-type">${cad.type}</div>
            <div class="cad-location">${cad.location}</div>
            <div class="cad-description">${cad.description}</div>
            <div class="cad-meta">
                <span class="cad-status">${cad.status}</span>
                <span>${formatTime(cad.startTime)}</span>
                <span>${cad.channel}</span>
                ${cad.assignedUnits.length > 0 ? `<span>Units: ${cad.assignedUnits.join(', ')}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function openCADDetail(cadId) {
    const cad = appState.cads.find(c => c.id === cadId);
    if (!cad) return;
    
    // Store the reference, not the object
    appState.currentCadDetail = cad.reference;
    
    document.getElementById('detail-reference').textContent = cad.reference;
    document.getElementById('detail-type').textContent = cad.type;
    document.getElementById('detail-location').textContent = cad.location;
    document.getElementById('detail-status').textContent = cad.status;
    document.getElementById('detail-grading').innerHTML = `<span class="cad-grading ${cad.grading.toLowerCase().replace('/', '')}">${cad.grading}</span>`;
    document.getElementById('detail-start-time').textContent = formatDateTime(cad.startTime);
    document.getElementById('detail-duration').textContent = calculateDuration(cad.startTime);
    document.getElementById('detail-description').textContent = cad.description;
    
    // Render assigned units
    renderAssignedUnits(cad);
    
    // Render comments
    renderCADComments(cad);
    
    // Populate unit assignment dropdown
    const assignSelect = document.getElementById('assign-unit-select');
    assignSelect.innerHTML = '<option value="">-- Assign Unit --</option>' +
        appState.units
            .filter(u => !cad.assignedUnits.includes(u.callsign))
            .map(u => `<option value="${u.callsign}">${u.callsign} - ${u.type}</option>`)
            .join('');
    
    showModal('cad-detail-modal');
    
    // Update duration periodically
    if (appState.durationInterval) clearInterval(appState.durationInterval);
    appState.durationInterval = setInterval(() => {
        const currentCad = appState.cads.find(c => c.reference === appState.currentCadDetail);
        if (currentCad && !currentCad.endTime) {
            document.getElementById('detail-duration').textContent = calculateDuration(currentCad.startTime);
        }
    }, 1000);
}

function renderAssignedUnits(cad) {
    const container = document.getElementById('detail-assigned-units');
    if (cad.assignedUnits.length === 0) {
        container.innerHTML = '<p style="color: #666;">No units assigned</p>';
        return;
    }
    
    container.innerHTML = cad.assignedUnits.map(callsign => `
        <div class="assigned-unit-item">
            <span class="assigned-unit-callsign">${callsign}</span>
            <button class="remove-unit-btn" onclick="unassignUnit('${callsign}', ${cad.id})">Remove</button>
        </div>
    `).join('');
}

function renderCADComments(cad) {
    const container = document.getElementById('cad-comments-list');
    if (cad.comments.length === 0) {
        container.innerHTML = '<p style="color: #666;">No comments yet</p>';
        return;
    }
    
    container.innerHTML = cad.comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-operator">${comment.operator}</span>
                <span>${formatDateTime(new Date(comment.timestamp))}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
        </div>
    `).join('');
}

document.getElementById('assign-unit-select').addEventListener('change', (e) => {
    const callsign = e.target.value;
    if (!callsign || !appState.currentCadDetail) return;
    
    const cad = appState.cads.find(c => c.reference === appState.currentCadDetail);
    if (!cad) return;
    
    cad.assignedUnits.push(callsign);
    
    // Update unit status
    const unit = appState.units.find(u => u.callsign === callsign);
    if (unit) {
        unit.status = 'EN_ROUTE';
    }
    
    saveToLocalStorage();
    renderAssignedUnits(cad);
    renderUnitsList();
    renderCADList();
    
    e.target.value = '';
    e.target.innerHTML = '<option value="">-- Assign Unit --</option>' +
        appState.units
            .filter(u => !cad.assignedUnits.includes(u.callsign))
            .map(u => `<option value="${u.callsign}">${u.callsign} - ${u.type}</option>`)
            .join('');
});

function unassignUnit(callsign, cadId) {
    const cad = appState.cads.find(c => c.id === cadId);
    if (!cad) return;
    
    cad.assignedUnits = cad.assignedUnits.filter(u => u !== callsign);
    
    // Update unit status
    const unit = appState.units.find(u => u.callsign === callsign);
    if (unit) {
        unit.status = 'AVAILABLE';
    }
    
    saveToLocalStorage();
    renderAssignedUnits(cad);
    renderUnitsList();
    renderCADList();
    
    // Update dropdown
    const assignSelect = document.getElementById('assign-unit-select');
    assignSelect.innerHTML = '<option value="">-- Assign Unit --</option>' +
        appState.units
            .filter(u => !cad.assignedUnits.includes(u.callsign))
            .map(u => `<option value="${u.callsign}">${u.callsign} - ${u.type}</option>`)
            .join('');
}

document.getElementById('add-comment-btn').addEventListener('click', () => {
    const commentText = document.getElementById('new-comment-input').value.trim();
    if (!commentText || !appState.currentCadDetail) return;
    
    const cad = appState.cads.find(c => c.reference === appState.currentCadDetail);
    if (!cad) return;
    
    const comment = {
        operator: appState.operator.name,
        timestamp: new Date().toISOString(),
        text: commentText
    };
    
    cad.comments.push(comment);
    saveToLocalStorage();
    renderCADComments(cad);
    renderCADList();
    
    document.getElementById('new-comment-input').value = '';
});

document.getElementById('end-call-btn').addEventListener('click', () => {
    if (!appState.currentCadDetail) return;
    
    const cad = appState.cads.find(c => c.reference === appState.currentCadDetail);
    if (!cad) return;
    
    if (confirm('End this call? It will be removed from active CADs.')) {
        cad.endTime = new Date();
        cad.status = 'CLOSED';
        
        // Free up assigned units
        cad.assignedUnits.forEach(callsign => {
            const unit = appState.units.find(u => u.callsign === callsign);
            if (unit) unit.status = 'AVAILABLE';
        });
        
        saveToLocalStorage();
        renderCADList();
        renderUnitsList();
        hideModal('cad-detail-modal');
        clearInterval(appState.durationInterval);
    }
});

document.getElementById('delete-cad-btn').addEventListener('click', () => {
    if (!appState.currentCadDetail) return;
    
    const cad = appState.cads.find(c => c.reference === appState.currentCadDetail);
    if (!cad) return;
    
    if (confirm('Delete this CAD permanently? This cannot be undone.')) {
        // Free up assigned units
        cad.assignedUnits.forEach(callsign => {
            const unit = appState.units.find(u => u.callsign === callsign);
            if (unit) unit.status = 'AVAILABLE';
        });
        
        appState.cads = appState.cads.filter(c => c.id !== cad.id);
        saveToLocalStorage();
        renderCADList();
        renderUnitsList();
        hideModal('cad-detail-modal');
        clearInterval(appState.durationInterval);
    }
});

// ===== UNIT MANAGEMENT =====
document.getElementById('create-unit-btn').addEventListener('click', () => {
    showModal('create-unit-modal');
});

document.getElementById('submit-unit-btn').addEventListener('click', (e) => {
    e.preventDefault();
    
    const callsign = document.getElementById('new-unit-callsign').value.trim().toUpperCase();
    const type = document.getElementById('new-unit-type').value;
    const crew = document.getElementById('new-unit-crew').value.trim();
    const status = document.getElementById('new-unit-status').value;
    
    if (!callsign || !type || !crew) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Check for duplicate callsign
    if (appState.units.find(u => u.callsign === callsign)) {
        alert('A unit with this call sign already exists');
        return;
    }
    
    const unit = {
        id: Date.now(),
        callsign,
        type,
        crew,
        status,
        notes: ''
    };
    
    appState.units.push(unit);
    saveToLocalStorage();
    renderUnitsList();
    
    // Send Discord notification
    sendDiscordWebhook(
        '🚓 Unit Added',
        `A new unit has been added to the system`,
        5763719, // Green
        [
            { name: 'Callsign', value: callsign, inline: true },
            { name: 'Type', value: type.replace(/_/g, ' '), inline: true },
            { name: 'Crew', value: crew, inline: false },
            { name: 'Status', value: status.replace(/_/g, ' '), inline: true },
            { name: 'Added By', value: appState.operator.name, inline: true }
        ]
    );
    
    document.getElementById('create-unit-form').reset();
    hideModal('create-unit-modal');
});

function renderUnitsList() {
    const unitsList = document.getElementById('units-list');
    
    if (appState.units.length === 0) {
        unitsList.innerHTML = '<p style="color: #666; padding: 1rem; text-align: center;">No units created</p>';
        return;
    }
    
    unitsList.innerHTML = appState.units.map(unit => `
        <div class="unit-card ${unit.status.toLowerCase().replace('_', '-')}" onclick="editUnit(${unit.id})">
            <div class="unit-callsign">${unit.callsign}</div>
            <div class="unit-type">${unit.type.replace(/_/g, ' ')}</div>
            <div class="unit-crew">${unit.crew}</div>
            <span class="unit-status ${unit.status.toLowerCase().replace('_', '-')}">${unit.status.replace(/_/g, ' ')}</span>
            ${unit.notes ? '<div style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: rgba(59, 130, 246, 0.1); border-left: 2px solid #3b82f6; font-size: 0.8rem; color: #93c5fd;">📝 ' + unit.notes + '</div>' : ''}
        </div>
    `).join('');
}

function clearAllUnits() {
    if (appState.units.length === 0) {
        alert('No units to clear');
        return;
    }
    
    // Show modal with unit selection
    showModal('clear-units-modal');
    renderClearUnitsList();
}

function renderClearUnitsList() {
    const clearUnitsList = document.getElementById('clear-units-list');
    
    if (appState.units.length === 0) {
        clearUnitsList.innerHTML = '<p style="color: #666; text-align: center;">No units available</p>';
        return;
    }
    
    clearUnitsList.innerHTML = appState.units.map(unit => `
        <div style="background: #2a2a2a; padding: 1rem; margin-bottom: 0.5rem; border-radius: 4px; border-left: 4px solid ${getUnitStatusColor(unit.status)}; display: flex; align-items: center; gap: 1rem;">
            <input type="checkbox" class="clear-unit-checkbox" data-unit-id="${unit.id}" style="width: 18px; height: 18px; cursor: pointer;">
            <div style="flex: 1;">
                <div style="font-weight: bold; color: #fff; margin-bottom: 0.25rem;">${unit.callsign}</div>
                <div style="color: #999; font-size: 0.9rem;">${unit.type.replace(/_/g, ' ')} - ${unit.crew}</div>
                <div style="color: #888; font-size: 0.85rem; margin-top: 0.25rem;">
                    Status: <span style="color: ${getUnitStatusColor(unit.status)};">${unit.status.replace(/_/g, ' ')}</span>
                    ${isUnitAssigned(unit.id) ? ' • <span style="color: #f59e0b;">Assigned to CAD</span>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function getUnitStatusColor(status) {
    switch(status) {
        case 'AVAILABLE': return '#10b981';
        case 'ON_SCENE': return '#3b82f6';
        case 'EN_ROUTE': return '#f59e0b';
        case 'UNAVAILABLE': return '#ef4444';
        default: return '#6b7280';
    }
}

function isUnitAssigned(unitId) {
    return appState.cads.some(cad => 
        cad.assignedUnits && cad.assignedUnits.includes(unitId)
    );
}

function confirmClearUnits() {
    const checkboxes = document.querySelectorAll('.clear-unit-checkbox:checked');
    const unitIdsToRemove = Array.from(checkboxes).map(cb => parseInt(cb.dataset.unitId));
    
    if (unitIdsToRemove.length === 0) {
        alert('Please select at least one unit to remove');
        return;
    }
    
    const unitsToRemove = appState.units.filter(u => unitIdsToRemove.includes(u.id));
    const unitNames = unitsToRemove.map(u => u.callsign).join(', ');
    
    if (confirm(`Remove ${unitIdsToRemove.length} unit(s)?\n\n${unitNames}\n\nThis will also unassign them from any CADs.`)) {
        // Remove units from all CADs
        appState.cads.forEach(cad => {
            if (cad.assignedUnits) {
                cad.assignedUnits = cad.assignedUnits.filter(unitId => !unitIdsToRemove.includes(unitId));
            }
        });
        
        // Remove units from array
        appState.units = appState.units.filter(u => !unitIdsToRemove.includes(u.id));
        
        // Update displays
        renderUnitsList();
        renderCADList();
        
        // If CAD detail is open, refresh it
        if (appState.currentCadDetail) {
            const cad = appState.cads.find(c => c.reference === appState.currentCadDetail);
            if (cad) {
                renderAssignedUnits(cad);
            }
        }
        
        saveToLocalStorage();
        hideModal('clear-units-modal');
    }
}

function editUnit(unitId) {
    const unit = appState.units.find(u => u.id === unitId);
    if (!unit) return;
    
    // Open edit modal
    showModal('edit-unit-modal');
    
    // Populate form
    document.getElementById('edit-unit-callsign').value = unit.callsign;
    document.getElementById('edit-unit-type').value = unit.type.replace(/_/g, ' ');
    document.getElementById('edit-unit-crew').value = unit.crew;
    document.getElementById('edit-unit-status').value = unit.status;
    document.getElementById('edit-unit-notes').value = unit.notes || '';
    
    // Store current unit ID for save/delete
    appState.currentEditingUnit = unitId;
}

// Save unit changes
document.getElementById('save-unit-btn').addEventListener('click', () => {
    const unit = appState.units.find(u => u.id === appState.currentEditingUnit);
    if (!unit) return;
    
    const newStatus = document.getElementById('edit-unit-status').value;
    const newNotes = document.getElementById('edit-unit-notes').value.trim();
    
    unit.status = newStatus;
    unit.notes = newNotes;
    
    saveToLocalStorage();
    renderUnitsList();
    renderCADList();
    hideModal('edit-unit-modal');
});

// Delete unit
document.getElementById('delete-unit-btn').addEventListener('click', () => {
    const unit = appState.units.find(u => u.id === appState.currentEditingUnit);
    if (!unit) return;
    
    if (confirm(`Delete unit ${unit.callsign}? This will also unassign it from any CADs.`)) {
        const unitCallsign = unit.callsign;
        const unitType = unit.type;
        const unitCrew = unit.crew;
        
        // Remove from any CADs
        appState.cads.forEach(cad => {
            if (cad.assignedUnits) {
                cad.assignedUnits = cad.assignedUnits.filter(c => c !== unit.callsign);
            }
        });
        
        appState.units = appState.units.filter(u => u.id !== appState.currentEditingUnit);
        saveToLocalStorage();
        renderUnitsList();
        renderCADList();
        
        // Send Discord notification
        sendDiscordWebhook(
            '❌ Unit Deleted',
            `A unit has been removed from the system`,
            15158332, // Red
            [
                { name: 'Callsign', value: unitCallsign, inline: true },
                { name: 'Type', value: unitType.replace(/_/g, ' '), inline: true },
                { name: 'Crew', value: unitCrew, inline: false },
                { name: 'Deleted By', value: appState.operator.name, inline: true }
            ]
        );
        
        // If CAD detail is open, refresh it
        if (appState.currentCadDetail) {
            const cad = appState.cads.find(c => c.reference === appState.currentCadDetail);
            if (cad) {
                renderAssignedUnits(cad);
            }
        }
        
        hideModal('edit-unit-modal');
    }
});

// ===== FORMS FUNCTIONALITY =====
function renderFormLogs() {
    // Set operator names
    if (appState.operator) {
        document.getElementById('incident-operator').value = appState.operator.name;
        document.getElementById('call-taker').value = appState.operator.name;
    }
    
    // Render incident logs
    const incidentLogsList = document.getElementById('incident-logs-list');
    if (appState.forms.incidentLogs.length === 0) {
        incidentLogsList.innerHTML = '<p style="color: #666; margin-top: 1rem;">No incident logs recorded</p>';
    } else {
        incidentLogsList.innerHTML = '<h4 style="color: #fff; margin-top: 2rem; margin-bottom: 1rem;">Recorded Incidents</h4>' +
            appState.forms.incidentLogs.map(log => `
                <div class="log-item">
                    <div class="log-item-header">
                        <span class="log-item-title">${log.type} - ${log.location}</span>
                        <span class="log-item-date">${formatDateTime(new Date(log.datetime))}</span>
                    </div>
                    <div class="log-item-content">
                        <p><strong>Description:</strong> ${log.description}</p>
                        <p><strong>Action Taken:</strong> ${log.action}</p>
                        <p><strong>Operator:</strong> ${log.operator}</p>
                    </div>
                </div>
            `).join('');
    }
    
    // Render major incidents
    const majorIncidentsList = document.getElementById('major-incidents-list');
    if (appState.forms.majorIncidents.length === 0) {
        majorIncidentsList.innerHTML = '<p style="color: #666; margin-top: 1rem;">No major incidents recorded</p>';
    } else {
        majorIncidentsList.innerHTML = '<h4 style="color: #fff; margin-top: 2rem; margin-bottom: 1rem;">Major Incidents</h4>' +
            appState.forms.majorIncidents.map(incident => `
                <div class="log-item" style="border-left-color: #dc2626;">
                    <div class="log-item-header">
                        <span class="log-item-title">${incident.name}</span>
                        <span class="log-item-date">${formatDateTime(new Date(incident.datetime))}</span>
                    </div>
                    <div class="log-item-content">
                        <p><strong>Type:</strong> ${incident.type.replace(/_/g, ' ')}</p>
                        <p><strong>Location:</strong> ${incident.location}</p>
                        <p><strong>Severity:</strong> ${incident.severity}</p>
                        <p><strong>Commander:</strong> ${incident.commander}</p>
                        <p><strong>Situation:</strong> ${incident.sitrep}</p>
                    </div>
                </div>
            `).join('');
    }
    
    // Render call taking records
    const callTakingList = document.getElementById('call-taking-list');
    if (appState.forms.callTakingRecords.length === 0) {
        callTakingList.innerHTML = '<p style="color: #666; margin-top: 1rem;">No call records</p>';
    } else {
        callTakingList.innerHTML = '<h4 style="color: #fff; margin-top: 2rem; margin-bottom: 1rem;">Call Records</h4>' +
            appState.forms.callTakingRecords.map(record => {
                let serviceColor = '#3b82f6';
                if (record.serviceRequired === 'POLICE') serviceColor = '#3b82f6';
                if (record.serviceRequired === 'AMBULANCE') serviceColor = '#22c55e';
                if (record.serviceRequired === 'FIRE') serviceColor = '#ef4444';
                
                let detailsHtml = `
                    <p><strong>Service:</strong> ${record.serviceRequired}</p>
                    <p><strong>Caller:</strong> ${record.callerName} (${record.callerPhone})</p>
                    <p><strong>Location:</strong> ${record.location}</p>
                `;
                
                // Add service-specific details
                if (record.policeData) {
                    detailsHtml += `
                        <p><strong>What's Happening:</strong> ${record.policeData.happeningNow}</p>
                        ${record.policeData.weapons ? `<p><strong>Weapons:</strong> ${record.policeData.weapons}</p>` : ''}
                        ${record.policeData.injuries ? `<p><strong>Injuries:</strong> ${record.policeData.injuries}</p>` : ''}
                        ${record.policeData.suspectDesc ? `<p><strong>Suspect Description:</strong> ${record.policeData.suspectDesc}</p>` : ''}
                        ${record.policeData.callerSafe ? `<p><strong>Caller Safe:</strong> ${record.policeData.callerSafe}</p>` : ''}
                    `;
                }
                
                if (record.ambulanceData) {
                    detailsHtml += `
                        <p><strong>What Happened:</strong> ${record.ambulanceData.whatHappened}</p>
                        ${record.ambulanceData.breathing ? `<p><strong>Breathing:</strong> ${record.ambulanceData.breathing}</p>` : ''}
                        ${record.ambulanceData.conscious ? `<p><strong>Conscious:</strong> ${record.ambulanceData.conscious}</p>` : ''}
                        ${record.ambulanceData.bleeding ? `<p><strong>Bleeding:</strong> ${record.ambulanceData.bleeding}</p>` : ''}
                        ${record.ambulanceData.age ? `<p><strong>Patient Age:</strong> ${record.ambulanceData.age}</p>` : ''}
                        ${record.ambulanceData.medicalHistory ? `<p><strong>Medical History:</strong> ${record.ambulanceData.medicalHistory}</p>` : ''}
                    `;
                }
                
                if (record.fireData) {
                    detailsHtml += `
                        <p><strong>What's Burning:</strong> ${record.fireData.whatBurning}</p>
                        ${record.fireData.propertyType ? `<p><strong>Property Type:</strong> ${record.fireData.propertyType}</p>` : ''}
                        ${record.fireData.trapped ? `<p><strong>Anyone Trapped:</strong> ${record.fireData.trapped}</p>` : ''}
                        ${record.fireData.evacuated ? `<p><strong>Evacuated:</strong> ${record.fireData.evacuated}</p>` : ''}
                        ${record.fireData.injuries ? `<p><strong>Injuries:</strong> ${record.fireData.injuries}</p>` : ''}
                        ${record.fireData.hazards ? `<p><strong>Hazards:</strong> ${record.fireData.hazards}</p>` : ''}
                    `;
                }
                
                detailsHtml += `
                    ${record.additionalNotes ? `<p><strong>Additional Notes:</strong> ${record.additionalNotes}</p>` : ''}
                    <p><strong>Call Taker:</strong> ${record.callTaker}</p>
                    ${record.cadRef ? `<p><strong>CAD Ref:</strong> ${record.cadRef}</p>` : ''}
                `;
                
                return `
                    <div class="log-item" style="border-left-color: ${serviceColor};">
                        <div class="log-item-header">
                            <span class="log-item-title">${record.serviceRequired} Call - ${record.callerName}</span>
                            <span class="log-item-date">${formatDateTime(new Date(record.receivedTime))}</span>
                        </div>
                        <div class="log-item-content">
                            ${detailsHtml}
                        </div>
                    </div>
                `;
            }).join('');
    }
}

// Incident Log Form
document.getElementById('incident-log-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const log = {
        datetime: document.getElementById('incident-datetime').value,
        type: document.getElementById('incident-type').value,
        location: document.getElementById('incident-location').value,
        description: document.getElementById('incident-description').value,
        action: document.getElementById('incident-action').value,
        operator: document.getElementById('incident-operator').value
    };
    
    appState.forms.incidentLogs.push(log);
    saveToLocalStorage();
    
    e.target.reset();
    document.getElementById('incident-operator').value = appState.operator.name;
    
    renderFormLogs();
    alert('Incident log saved successfully');
});

// Major Incident Form
document.getElementById('major-incident-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const incident = {
        name: document.getElementById('major-incident-name').value,
        datetime: document.getElementById('major-datetime').value,
        commander: document.getElementById('major-commander').value,
        location: document.getElementById('major-location').value,
        type: document.getElementById('major-type').value,
        severity: document.getElementById('major-severity').value,
        sitrep: document.getElementById('major-sitrep').value,
        resources: document.getElementById('major-resources').value,
        actions: document.getElementById('major-actions').value
    };
    
    appState.forms.majorIncidents.push(incident);
    saveToLocalStorage();
    
    e.target.reset();
    
    renderFormLogs();
    alert('Major incident information saved successfully');
});

// Call Taking Form
document.getElementById('call-taking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const serviceRequired = document.getElementById('service-required').value;
    
    const record = {
        receivedTime: document.getElementById('call-received-time').value,
        serviceRequired: serviceRequired,
        location: document.getElementById('call-location').value,
        callerPhone: document.getElementById('caller-phone').value,
        callerName: document.getElementById('caller-name').value,
        callTaker: document.getElementById('call-taker').value,
        cadRef: document.getElementById('call-cad-ref').value,
        additionalNotes: document.getElementById('call-additional-notes').value
    };
    
    // Add service-specific data
    if (serviceRequired === 'POLICE') {
        record.policeData = {
            happeningNow: document.getElementById('police-happening-now').value,
            weapons: document.getElementById('police-weapons').value,
            injuries: document.getElementById('police-injuries').value,
            suspectDesc: document.getElementById('police-suspect-desc').value,
            callerSafe: document.getElementById('police-caller-safe').value
        };
    } else if (serviceRequired === 'AMBULANCE') {
        record.ambulanceData = {
            whatHappened: document.getElementById('amb-what-happened').value,
            breathing: document.getElementById('amb-breathing').value,
            conscious: document.getElementById('amb-conscious').value,
            bleeding: document.getElementById('amb-bleeding').value,
            age: document.getElementById('amb-age').value,
            medicalHistory: document.getElementById('amb-medical-history').value,
            access: document.getElementById('amb-access').value
        };
    } else if (serviceRequired === 'FIRE') {
        record.fireData = {
            whatBurning: document.getElementById('fire-what-burning').value,
            propertyType: document.getElementById('fire-property-type').value,
            trapped: document.getElementById('fire-trapped').value,
            evacuated: document.getElementById('fire-evacuated').value,
            injuries: document.getElementById('fire-injuries').value,
            hazards: document.getElementById('fire-hazards').value,
            access: document.getElementById('fire-access').value
        };
    }
    
    appState.forms.callTakingRecords.push(record);
    saveToLocalStorage();
    
    e.target.reset();
    document.getElementById('call-taker').value = appState.operator.name;
    
    // Hide all service-specific sections
    document.querySelectorAll('.service-questions').forEach(section => {
        section.style.display = 'none';
    });
    
    renderFormLogs();
    alert('Call record saved successfully');
});

// Service selector - show/hide relevant questions
document.getElementById('service-required').addEventListener('change', (e) => {
    const service = e.target.value;
    
    // Hide all service-specific sections
    document.querySelectorAll('.service-questions').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show relevant section
    if (service === 'POLICE') {
        document.getElementById('police-questions').style.display = 'block';
    } else if (service === 'AMBULANCE') {
        document.getElementById('ambulance-questions').style.display = 'block';
    } else if (service === 'FIRE') {
        document.getElementById('fire-questions').style.display = 'block';
    } else if (service === 'MULTI') {
        // Show all sections for multiple services
        document.querySelectorAll('.service-questions').forEach(section => {
            section.style.display = 'block';
        });
    }
});

// ===== MODAL CLOSE HANDLERS =====
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        hideModal(modal.id);
        if (modal.id === 'cad-detail-modal' && appState.durationInterval) {
            clearInterval(appState.durationInterval);
        }
    });
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal(modal.id);
            if (modal.id === 'cad-detail-modal' && appState.durationInterval) {
                clearInterval(appState.durationInterval);
            }
        }
    });
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    showScreen('login-screen');
});
