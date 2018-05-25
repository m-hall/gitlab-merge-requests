import $Gitlab from '../common/gitlab.js';

const form = document.querySelector('form#gitlab');
let searchId = 0;

async function loadCredentials() {
    let credentials = await $Gitlab.getUserInfo();
    if (credentials !== null) {
        form.querySelector('#username').innerHTML = credentials.username;
    }
}
function login(e) {
    let accessToken = form.querySelector('input#token').value;
    $Gitlab.setAccessToken(accessToken)
    .then((response) => {
        form.querySelector('#username').innerHTML = response.username;
    });
    e.preventDefault();
    return false;
}
function forget(e) {
    $Gitlab.clearUser();
    e.preventDefault();
    return false;
}


function selectCompletion(e) {
    console.log(e.target);
    e.preventDefault();
    return false;
}
function completion(value) {
    if (value.path) {
        // group
        return `
            <li data-group='${value.path}' data-name='${value.name}'>${value.name}</li>
        `;
    }
    // repository
    return `
        <li data-group='${value.namespace.path}' data-repo='${value.path}' data-name='${value.name}'>${value.namespace.name} > ${value.name}</li>
    `;
}
function searchAutocomplete(values) {
    let completions = [];
    console.log(values);
    for (let i = 0, l = Math.min(values.length, 5); i < l; i++) {
        completions.push(completion(values[i]));
    }
    return `<ol>
        ${completions.join('')}
    </ol>`;
}
function search(e) {
    let searchFn = null;
    let thisSearch = ++searchId;
    switch(e.target.dataset.list) {
        case 'groups':
            searchFn = $Gitlab.searchGroups;
            break;
        case 'repos':
            searchFn = $Gitlab.searchRepos;
            break;
        default:
            e.preventDefault();
            return false;
    }
    searchFn(this.value).then((data) => {
        if (thisSearch !== searchId) {
            return;
        }
        this.nextElementSibling.innerHTML = searchAutocomplete(data);
    });
    e.preventDefault();
    return false;
}
function addGroup(group) {
    let el = $util.html(`
        <div>
            ${JSON.stringify(group)}
        </div>
    `);
    form.querySelector('#groups-list').appendChild(el);
    return group;
}

async function loadGroups() {
    let groups = await $Gitlab.getSavedGroups();
    groups.forEach(addGroup);
}

function addRepo(repo) {
    let el = $util.html(`
        <div>
            ${JSON.stringify(repo)}
        </div>
    `);
    form.querySelector('#repos-list').appendChild(el);
    return repo;
}
async function loadRepos() {
    let groups = await $Gitlab.getSavedGroups();
    groups.forEach(addRepo);
}

function saveDefaultColor(e) {
    $Gitlab.setDefaultColor(e.target.value);
    e.preventDefault();
    return false;
}
async function loadDefaultColor() {
    form.querySelector('#default-color').value = await $Gitlab.getDefaultColor();
}

loadCredentials()
.then(loadDefaultColor)
.then(loadGroups)
.then(loadRepos)
.then(() => {
    form.addEventListener('submit', login, false);
    form.querySelector('#forget').addEventListener('click', forget, false);
    form.querySelector('#default-color').addEventListener('change', saveDefaultColor, false);
    for (let searches = form.querySelectorAll('.search-list > input'), i = 0, l = searches.length; i < l; i++) {
        searches[i].addEventListener('keyup', search, false);
        searches[i].nextElementSibling.addEventListener('click', selectCompletion, false);
    }
});
