import $Gitlab from '../common/gitlab.js';
import $badge from '../common/badge.js';

const BADGE_FREQUENCY = 300000;
const colorSuccess = "#4080d0";
const colorNeedsWork = "#820dd5";
const colorError = "#830922";

let assigned = [];
let created = [];
let watched = [];
let watchedGroups = [];
let watchedRepos = [];

async function prefetch(projectId) {
    let project = await $Gitlab.getRepoById(projectId);
    if (project.namespace && project.namespace.kind === 'group') {
        await $Gitlab.getGroupById(project.namespace.id);
    }
}
async function fetchAssignedMergeRequests() {
    assigned = (await $Gitlab.getMergeRequestsAssigned()) || [];
    for (let i in assigned) {
        let mr = assigned[i];
        await prefetch(mr.project_id);
        await prefetch(mr.target_project_id);
        mr.approvals = await $Gitlab.getMergeRequestApprovals(mr);
    }
    return assigned.length;
}
async function fetchCreatedMergeRequests() {
    let numberRelevant = 0;
    created = (await $Gitlab.getMergeRequestsCreated()) || [];
    for (let i in created) {
        let mr = created[i];
        await prefetch(mr.project_id);
        await prefetch(mr.target_project_id);
        mr.approvals = await $Gitlab.getMergeRequestApprovals(mr);
        if (mr.state === 'rejected') {
            numberRelevant++;
        }
    }
    return numberRelevant;
}
async function fetchWatchedMergeRequests() {
    let checkedGroups = [];
    watched = [];
    watchedGroups = await $Gitlab.getSavedGroups();
    watchedRepos = await $Gitlab.getSavedRepos();
    for (let i in watchedGroups) {
        let group = watchedGroups[i];
        if (group.showAll) {
            checkedGroups.push(group.group);
            watched.push.apply(watched, await $Gitlab.getGroupMergeRequests(await $Gitlab.getGroupById(group.group)));
        }
    }
    for (let i in watchedRepos) {
        let repo = watchedRepos[i];
        if (repo.showAll && checkedGroups.indexOf(repo.group) >= 0) {
            watched.push.apply(watched, await $Gitlab.getRepoMergeRequests(await $Gitlab.getRepoById(repo.repo)));
        }
    }
    for (let i in watched) {
        let mr = watched[i];
        await prefetch(mr.project_id);
        await prefetch(mr.target_project_id);
        mr.approvals = await $Gitlab.getMergeRequestApprovals(mr);
    }
    return watched.length;
}
async function getNumberOfActionsWaiting() {
    if (!await $Gitlab.isLoggedIn()) {
        throw new Error('Not logged in');
    }
    let number = await fetchAssignedMergeRequests();
    number += await fetchCreatedMergeRequests();
    await fetchWatchedMergeRequests();
    return number;
}

async function pollBadge() {
    try {
        let number = await getNumberOfActionsWaiting();

        if (number === 0) {
            $badge.clear();
        } else {
            $badge.set(number, colorNeedsWork);
        }
    } catch (err) {
        $badge.set(' ', colorError);
    }
    setTimeout(pollBadge, BADGE_FREQUENCY);
}

async function init() {
    pollBadge();
}

init();
chrome.extension.onRequest.addListener(
    (request, sender, respond) => {
        switch (request.name) {
            case 'gitlab-mrs':
                respond({
                    assigned,
                    created
                });
                return;
            case 'gitlab-assigned':
                respond(assigned);
                return;
            case 'gitlab-created':
                respond(created);
                return;
            case 'gitlab-watched':
                respond(watched);
                return;
        }
    }
);