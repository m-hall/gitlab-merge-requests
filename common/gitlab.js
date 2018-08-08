import $ajax from './ajax.js';
import $data from './data.js';


const URL_GITLAB = 'https://gitlab.com/api/v4';
const URL_USER_INFO = `${URL_GITLAB}/user`;
const URL_ASSIGNED_MERGE_REQUESTS = `${URL_GITLAB}/merge_requests?scope=assigned-to-me&state=opened`;
const URL_CREATED_MERGE_REQUESTS = `${URL_GITLAB}/merge_requests?scope=created-by-me&state=opened`;
const URL_LIST_GROUPS = `${URL_GITLAB}/groups?membership=true`;
const URL_GROUP_BY_ID = `${URL_GITLAB}/groups/`;
const URL_LIST_REPOS = `${URL_GITLAB}/projects?membership=true`;
const URL_REPO_BY_ID = `${URL_GITLAB}/projects/`;
const URL_MERGE_REQUEST_APPROVALS = `${URL_GITLAB}/projects/:pid/merge_requests/:mriid/approvals`;

const DATA_TOKEN = 'gitlab-token';
const DATA_USER = 'gitlab-user';
const DATA_GROUPS = 'gitlab-groups';
const DATA_REPOS = 'gitlab-repos';
const DATA_COLOR = 'gitlab-color';
const DATA_REPO_CACHE = 'gitlab-repo-cache';
const DATA_GROUP_CACHE = 'gitlab-group-cache';

const CACHE_LIFETIME = 7 * 24 * 60 * 60 * 1000; // 1 week

let groupCache = null;
let repoCache = null;

async function _ajax(options) {
    let token = await $data.get(DATA_TOKEN);
    if (options.headers) {
        options.headers['Private-Token'] = token;
    } else {
        options.headers = {
            'Private-Token': token
        };
    }
    let xhr = await $ajax(options);
    return JSON.parse(xhr.responseText);
}
const $GitLab = {
    setDefaultColor: async (color) => {
        return await $data.set({
            [DATA_COLOR]: color
        });
    },
    getDefaultColor: async () => {
        return (await $data.get(DATA_COLOR)) || '#6dc34a';
    },
    clearDefaultColor: async () => {
        return await $data.remove(DATA_COLOR);
    },
    setAccessToken: async (token) => {
        let xhr = await $ajax({
            url: URL_USER_INFO,
            headers: {
                'Private-Token': token
            }
        });
        let raw = xhr.responseText;
        let user = JSON.parse(raw);
        if (user.id) {
            await $data.set({
                [DATA_TOKEN]: token,
                [DATA_USER]: raw
            });
            return user;
        }
        throw 'Could not identify user';
    },
    clearUser: async () => {
        return await $data.remove([DATA_TOKEN, DATA_USER]);
    },
    getUserInfo: async () => {
        let userString = await $data.get(DATA_USER);
        if (typeof userString !== 'string') {
            return null;
        }
        return JSON.parse(userString);
    },
    isLoggedIn: async () => {
        return !!(await $GitLab.getUserInfo());
    },
    getMergeRequestsAssigned: async () => {
        return await _ajax({
            url: URL_ASSIGNED_MERGE_REQUESTS
        });
    },
    getMergeRequestsCreated: async () => {
        return await _ajax({
            url: URL_CREATED_MERGE_REQUESTS
        });
    },
    getMergeRequestApprovals: async (mr) => {
        return await _ajax({
            url: URL_MERGE_REQUEST_APPROVALS.replace(':pid', mr.project_id).replace(':mriid', mr.iid)
        });
    },
    searchGroups: async (query) => {
        let searchURL = query ? `${URL_LIST_GROUPS}&search=${query}` : URL_LIST_GROUPS;
        let groups = await _ajax({
            url: searchURL
        });
        return groups;
    },
    searchRepos: async (query) => {
        let searchURL = query ? `${URL_LIST_REPOS}&search=${query}` : URL_LIST_REPOS;
        let repos = await _ajax({
            url: searchURL
        });
        return repos;
    },
    getRepoById: async (id) => {
        let repo;
        if (!id) {
            return null;
        }
        if (!repoCache) {
            repoCache = JSON.parse((await $data.get(DATA_REPO_CACHE)) || '{}');
        }
        repo = repoCache[id];
        if (repo && repo.lastUpdate && (+new Date()) - repo.lastUpdate < CACHE_LIFETIME) {
            return repoCache[id];
        }
        repo = await _ajax({
            url: `${URL_REPO_BY_ID}${id}`
        });
        repoCache[id] = repo;
        repo.lastUpdate = +new Date();
        await $data.set({
            [DATA_REPO_CACHE]: JSON.stringify(repoCache)
        });
        return repo;
    },
    getGroupById: async (id) => {
        let group;
        if (!id) {
            return null;
        }
        if (!groupCache) {
            groupCache = JSON.parse((await $data.get(DATA_GROUP_CACHE)) || '{}');
        }
        group = groupCache[id];
        if (group && group.lastUpdate && (+new Date()) - group.lastUpdate < CACHE_LIFETIME) {
            return groupCache[id];
        }
        group = await _ajax({
            url: `${URL_GROUP_BY_ID}${id}`
        });
        groupCache[id] = group;
        group.lastUpdate = +new Date();
        await $data.set({
            [DATA_GROUP_CACHE]: JSON.stringify(groupCache)
        });
        return group;
    },
    setSavedGroups: async (groups) => {
        let groupsString = JSON.stringify(groups);
        return await $data.set({
            [DATA_GROUPS]: groupsString
        });
    },
    getSavedGroups: async () => {
        let groupsString = await $data.get(DATA_GROUPS);
        if (typeof groupsString !== 'string') {
            return {};
        }
        return JSON.parse(groupsString);
    },
    setSavedRepos: async (repos) => {
        let reposString = JSON.stringify(repos);
        return await $data.set({
            [DATA_REPOS]: reposString
        });
    },
    getSavedRepos: async () => {
        let reposString = await $data.get(DATA_REPOS);
        if (typeof reposString !== 'string') {
            return {};
        }
        return JSON.parse(reposString);
    }
};
export default $GitLab;