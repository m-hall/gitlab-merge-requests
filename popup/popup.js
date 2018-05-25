import $Gitlab from '../common/gitlab.js';
import $background from '../common/background.js';

const output = document.querySelector('#gitlab');

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
                    <span class='repo group-unknown repo-${mr.project_id}'>${source.name}</span>
                    <span class='branch'>${mr.source_branch}</span>
                </div>
                <div class='to'>
                    <span class='repo group-unknown repo-${mr.target_project_id} ${mr.target_project_id === mr.project_id ? 'same' : ''}'>${target.name}</span>
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

async function setStyle() {
    let defaultColor = await $Gitlab.getDefaultColor();
    let style = document.createElement('style');
    style.innerText = `.repo {background-color: ${defaultColor};}`;
    document.body.appendChild(style);
}

async function createLinks() {
    let user = await $Gitlab.getUserInfo();
    output.querySelector('.links').innerHTML = `<a href='https://gitlab.com/dashboard/merge_requests?assignee_id=${user.id}' class='repo' target="_blank">All</a>`;
}

setStyle()
.then(createLinks)
.then(getAssigned)
.then(fillAssigned)
.then(getCreated)
.then(fillCreated)
.then(setMessage, setMessage);


output.querySelector('#merge-requests').addEventListener('click', clickMR, false);