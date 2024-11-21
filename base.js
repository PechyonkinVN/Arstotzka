const availableCountries = ["Arstotzka", "Kolechia", "Obristan", "Impor", "Easting", "Antegria", "Republia", "Sordland"];
let laws = JSON.parse(localStorage.getItem('papersPleaseLaws')) || [];
let currentlyEditedRuleIndex = -1;
let isEditingEnabled = false;

function ChangeMode(){
    let user = document.getElementById("logo_account").textContent;
    let img = document.getElementById("user_img");

    if (user == "Administrator"){
        if(isEditingEnabled){
            saveLaws();
        }
        document.getElementById('buttons').style.display = "none";
        document.getElementById("logo_account").textContent = "User";
        img.src = 'Resources/user.jpg';
        img.style.transform = "translateX(0)";
    }
    else {
        document.getElementById('buttons').style.display = "block";
        document.getElementById("logo_account").textContent = "Administrator";
        img.src = 'Resources/admin.jpg';
        img.style.transform = "translateX(0)";
    }

}

function generateLawElement(lawIndex) {
    const lawDiv = document.createElement('div');
    lawDiv.className = 'law';
    lawDiv.id = `law-${lawIndex}`;

    if (isEditingEnabled) {
        lawDiv.innerHTML = `<h3>Law ${lawIndex + 1}</h3>
                            <div id="ruleList-${lawIndex}"></div>
                            <div class="rulebuttons"><button id="addRule-${lawIndex}" class="add_rule_but">Add Rule</button>
                            <button onclick="deleteLaw(${lawIndex})" class="del_law_but">Del Law</button></div>`;
    } else {
        const summary = generateLawSummary(lawIndex);
        lawDiv.innerHTML = `<h3>Law ${lawIndex + 1}</h3><p>${summary}</p>`;
    }
    return lawDiv;
}

function generateLawSummary(lawIndex) {
    const rules = laws[lawIndex];
    let summary = "Въезд на территорию Арстотцка разрешён ";

    const countryRule = rules.find(r => r && r.find(rule => rule.type === 'country'));
    const country = countryRule ? countryRule.find(rule => rule.type === 'country').country : null;
    if (country) {
        summary += `гражданам ${country}`;
    } else {
        summary += `гражданам любой страны`;
    }

    const visaRule = rules.find(r => r && r.find(rule => rule.type === 'visa'));
    const visaRequired = visaRule ? visaRule.find(rule => rule.type === 'visa').visaRequired : null;
    if (visaRequired !== null) {
        summary += `${visaRequired === 'true' ? ', при наличии визы' : ', без визы'}`;
    }

    const idCardRule = rules.find(r => r && r.find(rule => rule.type === 'idCard'));
    const idCardRequired = idCardRule ? idCardRule.find(rule => rule.type === 'idCard').idCardRequired : null;
    if (idCardRequired !== null) {
        summary += `${idCardRequired === 'true' ? ', при наличии личной карты' : ', без личной карты'}`;
    }

    const workPermitRule = rules.find(r => r && r.find(rule => rule.type === 'workPermit'));
    const workPermitRequired = workPermitRule ? workPermitRule.find(rule => rule.type === 'workPermit').workPermitRequired : null;
    if (workPermitRequired !== null) {
        summary += `${workPermitRequired === 'true' ? ', при наличии разрешения на работу' : ', без разрешения на работу'}`;
    }

    summary += `.`
    return summary.trim();
}

function displayLaws() {
    const lawsContainer = document.getElementById('lawsContainer');
    lawsContainer.innerHTML = '';
    laws.forEach((rules, lawIndex) => {
        const lawElement = generateLawElement(lawIndex);
        lawsContainer.appendChild(lawElement);

        const addRuleButton = lawElement.querySelector(`#addRule-${lawIndex}`);
        if (addRuleButton) {
            addRuleButton.addEventListener('click', () => addRule(lawIndex));
        }
        const ruleList = lawElement.querySelector(`#ruleList-${lawIndex}`);
        if (ruleList) {
            displayRules(lawIndex, rules, ruleList);
        }
    });

    const addLawButton = document.getElementById('addLaw');
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');

    addLawButton.style.display = isEditingEnabled ? 'inline-block' : 'none';
    editButton.style.display = isEditingEnabled ? 'none' : 'inline-block';
    saveButton.style.display = isEditingEnabled ? 'inline-block' : 'none';
}

function displayRules(lawIndex, rules, ruleList) {
    ruleList.innerHTML = '';
    rules.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'rule-row';
        rowDiv.id = `rule-row-${rowIndex}-${lawIndex}`;
        row.forEach((rule, ruleIndex) => {
            const ruleElement = generateRuleElement(rule, rowIndex, ruleIndex, lawIndex, isEditingEnabled);
            rowDiv.appendChild(ruleElement);
        });
        const deleteRowButton = document.createElement('button');
        deleteRowButton.className = 'delete-row-button';
        deleteRowButton.textContent = 'Del Rule';
        deleteRowButton.onclick = () => deleteRow(lawIndex, rowIndex);
        rowDiv.appendChild(deleteRowButton);
        ruleList.appendChild(rowDiv);
    });
    new Sortable(ruleList, { group: "rules", onEnd: (evt) => handleSortableEnd(evt, lawIndex) });
}

function generateRuleElement(rule, rowIndex, ruleIndex, lawIndex, isEditingEnabled) {
    let html = '';
    const ruleType = rule.type || 'country';
    html += `<div class="rule-block">`;

    let displayValue = '';
    if (ruleType === 'country') {
        if (rule.country === undefined) {rule.country = 'Arstotzka';}
        displayValue = rule.country ? rule.country : 'Arstotzka';
    } else if (ruleType === 'visa') {
        if (rule.visa === undefined) {rule.visa = true;}
        displayValue = rule.visa === 'false' ? "isn't needed" : 'is needed'
        rule.visaRequired = rule.visa;
    } else if (ruleType === 'idCard') {
        if (rule.idCard === undefined) {rule.idCard = true;}
        displayValue = rule.idCard === 'false' ? "isn't needed" : 'is needed';
        rule.idCardRequired = rule.idCard;
    } else if (ruleType === 'workPermit') {
        if (rule.workPermit === undefined) {rule.workPermit = true;}
        displayValue = rule.workPermit === 'false' ? "isn't needed" : 'is needed'
        rule.workPermitRequired = rule.workPermit;
    }

    html += isEditingEnabled ? `<label onclick="openRuleTypeModal(${rowIndex}, ${ruleIndex}, ${lawIndex})">` : `<label>`;
    html += `${ruleType}: ${displayValue}`;
    html += isEditingEnabled ? `</label>` : `</label>`;

    if (isEditingEnabled) {
        if (ruleType === 'country') {
            html += `<select onchange="updateRule(${lawIndex}, ${rowIndex}, ${ruleIndex}, 'country', this.value)">${availableCountries.map(country => `<option value="${country}" ${rule.country === country ? 'selected' : ''}>${country}</option>`).join('')}</select>`;
        } else if (ruleType === 'visa' || ruleType === 'idCard' || ruleType === 'workPermit') {
            html += `<select onchange="updateRule(${lawIndex}, ${rowIndex}, ${ruleIndex}, '${ruleType.replace('Permit','Required')}', this.value)"><option value="true" ${rule[ruleType.replace('Permit','Required')] === 'true' ? 'selected' : ''}>Yes</option><option value="false" ${rule[ruleType.replace('Permit','Required')] === 'false' ? 'selected' : ''}>No</option></select>`;
        }
    }
    html += `</div>`;
    if (isEditingEnabled) {
        html += `<button class="delete-button" onclick="deleteRule(${lawIndex}, ${rowIndex}, ${ruleIndex})">Удалить</button>`;
    }

    return new DOMParser().parseFromString(html, 'text/html').body.firstChild;
}

function handleSortableEnd(evt, lawIndex) {
    const item = evt.item;
    const oldRowIndex = parseInt(item.parentElement.id.split('-')[2]);
    const oldRuleIndex = parseInt(item.id.split('-')[2]);
    const newRowIndex = parseInt(evt.to.id.split('-')[2]);
    const newRuleIndex = parseInt(evt.newIndex);
    if (!laws[lawIndex][newRowIndex]) laws[lawIndex][newRowIndex] = [];
    const movedRule = laws[lawIndex][oldRowIndex].splice(oldRuleIndex, 1)[0];
    laws[lawIndex][newRowIndex].splice(newRuleIndex, 0, movedRule);
    displayLaws();
}

function updateRule(lawIndex, rowIndex, ruleIndex, key, value) {
    laws[lawIndex][rowIndex][ruleIndex][key] = value;
    displayLaws();
}

function deleteRule(lawIndex, rowIndex, ruleIndex) {
    laws[lawIndex][rowIndex].splice(ruleIndex, 1);
    displayLaws();
}

function addRule(lawIndex) {
    if (!isEditingEnabled) return;
    if (!laws[lawIndex]) laws[lawIndex] = [];
    const newRowIndex = laws[lawIndex].length;
    laws[lawIndex].push([]);
    openRuleTypeModal(newRowIndex, 0, lawIndex);
    displayLaws();
}

function saveLaws() {
    try {
        localStorage.setItem('papersPleaseLaws', JSON.stringify(laws));
        alert('Законы сохранены!');
    } catch (error) {
        alert('Ошибка сохранения: ' + error);
    }
    isEditingEnabled = false;
    displayLaws();
}

function openRuleTypeModal(rowIndex, ruleIndex, lawIndex) {
    currentlyEditedRuleIndex = { rowIndex, ruleIndex, lawIndex };
    selectedRuleTypes = {};
    updateRuleTypeModal();
    const modal = document.getElementById('ruleTypeModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error("Modal element with ID 'ruleTypeModal' not found.");
    }
}

function closeRuleTypeModal() {
    const modal = document.getElementById('ruleTypeModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentlyEditedRuleIndex = -1;
    selectedRuleTypes = {};
}

let selectedRuleTypes = {};

function selectRuleType(type) {
    const { rowIndex, ruleIndex, lawIndex } = currentlyEditedRuleIndex;
    if (!laws[lawIndex][rowIndex]) laws[lawIndex][rowIndex] = [];
    laws[lawIndex][rowIndex].push({ type });
    selectedRuleTypes[type] = true;
    updateRuleTypeModal();
    closeRuleTypeModal();
    displayLaws();
}


function updateRuleTypeModal() {
    const modal = document.getElementById('ruleTypeModal');
    if (!modal) return;

    const ruleTypeButtons = modal.querySelectorAll('button');
    ruleTypeButtons.forEach(button => {
        const ruleType = button.dataset.ruleType;
        button.disabled = selectedRuleTypes[ruleType];
        button.style.display = selectedRuleTypes[ruleType] ? 'none' : 'inline-block';
    });
}


function deleteRow(lawIndex, rowIndex) {
    laws[lawIndex].splice(rowIndex, 1);
    displayLaws();
}

function deleteLaw(lawIndex) {
    laws.splice(lawIndex, 1);
    displayLaws();
}

function toggleEdit() {
    isEditingEnabled = !isEditingEnabled;
    displayLaws();
}

const addLawButton = document.getElementById('addLaw');
addLawButton.addEventListener('click', () => {
    laws.push([]);
    displayLaws();
});

const saveButton = document.getElementById('saveButton');
saveButton.addEventListener('click', saveLaws);

const editButton = document.getElementById('editButton');
editButton.addEventListener('click', toggleEdit);

displayLaws();