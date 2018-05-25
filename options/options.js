import $Gitlab from '../common/gitlab.js';
import $util from '../common/util.js';

const form = document.querySelector('form#gitlab');
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
        repos[el.dataset.repo] = await addRepo(el.dataset.group, el.dataset.repo, el.dataset.name, '#6dc34a');
    } else {
        groups[el.dataset.group] = await addGroup(el.dataset.group, el.dataset.name, '#6dc34a');
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
function saveName(e) {
    let el = this.parentNode;
    let id = el.dataset.id;
    let list = el.classList.contains('group') ? groups : repos;
    list[id].name = this.value;
    saveLists();
    e.preventDefault();
    return false;
}
function saveColor(e) {
    let el = this.parentNode;
    let id = el.dataset.id;
    let list = el.classList.contains('group') ? groups : repos;
    list[id].color = this.value;
    saveLists();
    e.preventDefault();
    return false;
}
function removeItem(e) {
    let el = this.parentNode;
    let id = el.dataset.id;
    let list = el.classList.contains('group') ? groups : repos;
    delete list[id];
    console.log(list);
    saveLists();
    el.parentNode.removeChild(el);
    e.preventDefault();
    return false;
}
async function addGroup(groupId, name, color) {
    let group = await $Gitlab.getGroupById(groupId);
    let el = $util.html(`
        <div class='group' data-id='${groupId}'>
            <button class='remove'>X</button>
            <span class='id'>${group.name}</span>
            <input type='text' value='${name}'>
            <input type='color' value='${color}'>
        </div>
    `);
    el.querySelector('.remove').addEventListener('click', removeItem);
    el.querySelector('input[type=text]').addEventListener('change', saveName);
    el.querySelector('input[type=color]').addEventListener('change', saveColor);
    form.querySelector('#groups-list').appendChild(el);
    return {
        group: groupId,
        name: name,
        color: color
    };
}
async function addRepo(groupId, repoId, name, color) {
    let group = await $Gitlab.getGroupById(groupId);
    let repo = await $Gitlab.getRepoById(repoId);
    let el = $util.html(`
        <div class='repo' data-id='${repoId}'>
            <button class='remove'>X</button>
            <span class='id'>${group.name} > ${repo.name}</span>
            <input type='text' value='${name}'>
            <input type='color' value='${color}'>
        </div>
    `);
    el.querySelector('.remove').addEventListener('click', removeItem);
    el.querySelector('input[type=text]').addEventListener('change', saveName);
    el.querySelector('input[type=color]').addEventListener('change', saveColor);
    form.querySelector('#repos-list').appendChild(el);
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
        await addGroup(groups[i].group, groups[i].name, groups[i].color);
    }
}

async function loadRepos() {
    repos = await $Gitlab.getSavedRepos();
    for (let i in repos) {
        await addRepo(repos[i].group, repos[i].repo, repos[i].name, repos[i].color);
    }
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
