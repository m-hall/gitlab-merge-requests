import $Gitlab from '../common/gitlab.js';
import $util from '../common/util.js';

const THROTTLE_TIME = 500; //500ms
const body = document.body;
const form = document.querySelector('form#gitlab');
let searchTimer = null;
let searchId = 0;
let groups = {};
let repos = {};

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


async function saveLists() {
    await $Gitlab.setSavedGroups(groups);
    await $Gitlab.setSavedRepos(repos);
}
async function selectCompletion(e) {
    let el = e.target;
    e.preventDefault();
    if (el.dataset.repo) {
        repos[el.dataset.repo] = await addRepo(el.dataset.group, el.dataset.repo, el.dataset.name, '#6dc34a', false);
    } else {
        groups[el.dataset.group] = await addGroup(el.dataset.group, el.dataset.name, '#6dc34a', false);
    }
    saveLists();
    return false;
}
function completion(value) {
    if (!value.namespace) {
        // group
        return `
            <li data-group='${value.id}' data-name='${value.name}'>${value.name}</li>
        `;
    }
    // repository
    return `
        <li data-group='${value.namespace.id}' data-repo='${value.id}' data-name='${value.name}'>${value.namespace.name} > ${value.name}</li>
    `;
}
function searchAutocomplete(values) {
    let completions = [];
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
function searchThrottle(e) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(search.bind(this, e), THROTTLE_TIME);
}
function saveName(e) {
    let el = this.parentNode.parentNode;
    let id = el.dataset.id;
    let list = el.classList.contains('group') ? groups : repos;
    list[id].name = this.value;
    saveLists();
    e.preventDefault();
    return false;
}
function saveColor(e) {
    let el = this.parentNode.parentNode;
    let id = el.dataset.id;
    let list = el.classList.contains('group') ? groups : repos;
    list[id].color = this.value;
    saveLists();
    e.preventDefault();
    return false;
}
function saveShowAll(e) {
    let el = this.parentNode.parentNode;
    let id = el.dataset.id;
    let list = el.classList.contains('group') ? groups : repos;
    list[id].showAll = this.checked;
    saveLists();
    e.preventDefault();
    return false;
}
function removeItem(e) {
    let el = this.parentNode.parentNode;
    let id = el.dataset.id;
    let list = el.classList.contains('group') ? groups : repos;
    delete list[id];
    saveLists();
    el.parentNode.removeChild(el);
    e.preventDefault();
    return false;
}
async function addGroup(groupId, name, color, show) {
    let group = await $Gitlab.getGroupById(groupId);
    let el = $util.tableRow(`
        <tr class='group' data-id='${groupId}'>
            <td class='id'>${group.name}</td>
            <td><input type='text' value='${name}'></td>
            <td><input type='color' value='${color}'></td>
            <td><input type='checkbox' ${show ? 'checked=\'checked\'' : ''}'></td>
            <td><button class='remove'>X</button></td>
        </tr>
    `);
    el.querySelector('.remove').addEventListener('click', removeItem);
    el.querySelector('input[type=text]').addEventListener('change', saveName);
    el.querySelector('input[type=color]').addEventListener('change', saveColor);
    el.querySelector('input[type=checkbox]').addEventListener('change', saveShowAll);
    body.querySelector('#groups-list').appendChild(el);
    return {
        group: groupId,
        name: name,
        color: color
    };
}
async function addRepo(groupId, repoId, name, color, show) {
    let group = await $Gitlab.getGroupById(groupId);
    let repo = await $Gitlab.getRepoById(repoId);
    let el = $util.tableRow(`
        <tr class='repo' data-id='${repoId}'>
            <td class='id'>${group.name} > ${repo.name}</td>
            <td><input type='text' value='${name}'></td>
            <td><input type='color' value='${color}'></td>
            <td><input type='checkbox' ${show ? 'checked=\'checked\'' : ''}'></td>
            <td><button class='remove'>X</button></td>
        </tr>
    `);
    el.querySelector('.remove').addEventListener('click', removeItem);
    el.querySelector('input[type=text]').addEventListener('change', saveName);
    el.querySelector('input[type=color]').addEventListener('change', saveColor);
    el.querySelector('input[type=checkbox]').addEventListener('change', saveShowAll);
    body.querySelector('#repos-list').appendChild(el);
    return {
        group: groupId,
        repo: repoId,
        name: name,
        color: color
    };
}

async function loadGroups() {
    groups = await $Gitlab.getSavedGroups();
    for (let i in groups) {
        await addGroup(groups[i].group, groups[i].name, groups[i].color, groups[i].showAll);
    }
}

async function loadRepos() {
    repos = await $Gitlab.getSavedRepos();
    for (let i in repos) {
        await addRepo(repos[i].group, repos[i].repo, repos[i].name, repos[i].color, repos[i].showAll);
    }
}

function saveDefaultColor(e) {
    $Gitlab.setDefaultColor(e.target.value);
    e.preventDefault();
    return false;
}
async function loadDefaultColor() {
    body.querySelector('#default-color').value = await $Gitlab.getDefaultColor();
}

loadCredentials()
.then(loadDefaultColor)
.then(loadGroups)
.then(loadRepos)
.then(() => {
    form.addEventListener('submit', login, false);
    form.querySelector('#forget').addEventListener('click', forget, false);
    body.querySelector('#default-color').addEventListener('change', saveDefaultColor, false);
    for (let searches = body.querySelectorAll('.search-input > input'), i = 0, l = searches.length; i < l; i++) {
        searches[i].addEventListener('keyup', searchThrottle, false);
        searches[i].nextElementSibling.addEventListener('click', selectCompletion, false);
    }
});
