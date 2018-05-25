import $Gitlab from '../common/gitlab.js';
import $background from '../common/background.js';

const output = document.querySelector('#gitlab');
let groups, repos;
function getReviewedState(mr) {
    return mr.state;
}
function getAuthoredReviewState(mr) {
    return mr.state;
}
async function generateMRMarkup(mr, state) {
    let source = await $Gitlab.getRepoById(mr.project_id);
    let target = await $Gitlab.getRepoById(mr.target_project_id);

    return `
        <div data-href="${mr.web_url}">
            ${state ? `<div class='status state-${state}'>${state}</div>` : ''}
            <div class='title'>${mr.title}</div>
            <div class='creator'>${mr.author.name}</div>
            <div class='branches'>
                <div class='from'>
                    <span class='repo group-${source.namespace.id} repo-${mr.project_id}'>${source.name}</span>
                    <span class='branch'>${mr.source_branch}</span>
                </div>
                <div class='to'>
                    <span class='repo group-${target.namespace.id} repo-${mr.target_project_id} ${mr.target_project_id === mr.project_id ? 'same' : ''}'>${target.name}</span>
                    <span class='branch'>${mr.target_branch}</span>
                </div>
            </div>
        </div>
    `;
}

async function fillAssigned(mrs) {
    let assigned = [];
    for (let i = 0, l = mrs.length; i < l; i++) {
        assigned.push(await generateMRMarkup(mrs[i], getReviewedState(mrs[i])));
    }
    if (assigned.length) {
        let el = document.createElement('ol');
        el.className = 'reviewer';
        el.innerHTML = `<li>${assigned.join('</li><li>')}</li>`;
        output.querySelector('#merge-requests').appendChild(el);
    }
}
async function fillCreated(mrs) {
    let created = [];
    for (let i = 0, l = mrs.length; i < l; i++) {
        created.push(await generateMRMarkup(mrs[i], getAuthoredReviewState(mrs[i])));
    }
    if (created.length) {
        let el = document.createElement('ol');
        el.className = 'author';
        el.innerHTML = `<li>${created.join('</li><li>')}</li>`;
        output.querySelector('#merge-requests').appendChild(el);
    }
}
function getAssigned() {
    return $background({
        name: 'gitlab-assigned'
    });
}
function getCreated() {
    return $background({
        name: 'gitlab-created'
    });
}

function setMessage() {
    if (output.querySelector('#merge-requests').childElementCount === 0) {
        output.querySelector('#message').innerHTML = 'You are not currently watching any merge requests';
    }
}


function clickMR(e) {
    let el = e.target;
    do {
        if (el.dataset.href) {
            chrome.tabs.create({url: el.dataset.href});
            return;
        }
    } while (el = el.parentNode);
}

async function getSaved() {
    groups = await $Gitlab.getSavedGroups();
    repos = await $Gitlab.getSavedRepos();
}
async function setStyle() {
    let defaultColor = await $Gitlab.getDefaultColor();
    let style = document.createElement('style');
    let rules = []
    rules.push(`.repo {background-color: ${defaultColor};}`);
    for (let i in groups) {
        let saved = groups[i];
        rules.push(`.group-${saved.group} {background-color: ${saved.color};}`);
    }
    for (let i in repos) {
        let saved = repos[i];
        rules.push(`.repo-${saved.repo} {background-color: ${saved.color};}`);
    }
    style.innerText = rules.join('');
    document.body.appendChild(style);
}

async function createLinks() {
    let user = await $Gitlab.getUserInfo();
    let links = [];
    for (let i in groups) {
        let saved = groups[i];
        let group = await $Gitlab.getGroupById(saved.group);
        links.push(`<a href='https://gitlab.com/groups/${group.full_path}/-/merge_requests' class='repo group-${saved.group}' target='_blank'>${saved.name}</a>`);
    }
    for (let i in repos) {
        let saved = repos[i];
        let repo = await $Gitlab.getRepoById(saved.repo);
        links.push(`<a href='https://gitlab.com/${repo.path_with_namespace}/merge_requests' class='repo repo-${saved.repo}' target='_blank'>${saved.name}</a>`);
    }
    links.push(`<a href='https://gitlab.com/dashboard/merge_requests?assignee_id=${user.id}' class='repo' target="_blank">All</a>`);
    output.querySelector('.links').innerHTML = links.join('');
}

getSaved()
.then(setStyle)
.then(createLinks)
.then(getAssigned)
.then(fillAssigned)
.then(getCreated)
.then(fillCreated)
.then(setMessage, setMessage);


output.querySelector('#merge-requests').addEventListener('click', clickMR, false);