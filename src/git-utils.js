const sshParse = require('ssh-parse');
const url = require('url');
const trimStart = require('lodash.trimstart');

const parseRepoUrl = repoUrl => {
    const parsedRepoUrl = url.parse(repoUrl);
    const parsedRepoSshUrl = sshParse(repoUrl);

    const repoWebProtocol = parsedRepoUrl.protocol === 'http:' ? 'http' : 'https';
    const parsedUrl = parsedRepoUrl.protocol ? parsedRepoUrl : parsedRepoSshUrl;

    const repoHost = parsedUrl.hostname;
    const repoPath = parsedUrl.pathname;
    const repoId = trimStart(repoPath.split('.git')[0], '/');

    return {
        repoWebProtocol,
        repoHost,
        repoId
    };
};

module.exports = {
    parseRepoUrl
};
