import $Gitlab from '../common/gitlab.js';
import $badge from '../common/badge.js';

const BADGE_FREQUENCY = 300000;
const colorSuccess = "#4080d0";
const colorNeedsWork = "#820dd5";
const colorError = "#830922";

let assigned = [];
let created = [];

async function prefetch(projectId) {
    let project = await $Gitlab.getRepoById(projectId);
    if (project.namespace && project.namespace.kind === 'group') {
        await $Gitlab.getGroupById(project.namespace.id);
    }
}
async function getNumberOfActionsWaiting() {
    if (!await $Gitlab.isLoggedIn()) {
        throw new Error('Not logged in');
    }
    assigned = (await $Gitlab.getMergeRequestsAssigned()) || [];
    created = (await $Gitlab.getMergeRequestsCreated()) || [];
    let number = assigned.length;
    for (let i in assigned) {
        let mr = assigned[i];
        await prefetch(mr.project_id);
        await prefetch(mr.target_project_id);
        mr.approvals = await $Gitlab.getMergeRequestApprovals(mr);
    }
    for (let i in created) {
        let mr = created[i];
        await prefetch(mr.project_id);
        await prefetch(mr.target_project_id);
        mr.approvals = await $Gitlab.getMergeRequestApprovals(mr);
        if (mr.state === 'rejected') {
            number++;
        }
    }
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
        }
    }
);