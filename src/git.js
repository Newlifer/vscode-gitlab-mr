const Q = require('q');
const url = require('url');

module.exports = gitContext => {
    const checkStatus = targetBranch => {
        const deferred = Q.defer();

        gitContext.status((err, status) => {
            if (err) {
                return deferred.reject(err);
            }

            const currentBranch = status.current;
            const onMaster = currentBranch === targetBranch;
            const isConflicted = status.conflicted.length > 0;
            const cleanBranch = status.created.length === 0 &&
                                status.deleted.length === 0 &&
                                status.modified.length === 0 &&
                                status.not_added.length === 0 &&
                                status.renamed.length === 0;

            if (isConflicted) {
                return deferred.reject(new Error('Unresolved conflicts, please resolve before opening MR.'));
            }

            deferred.resolve({
                currentBranch,
                onMaster,
                cleanBranch
            });
        });

        return deferred.promise;
    };

    const lastCommitMessage = () => {
        const deferred = Q.defer();

        gitContext.log((err, log) => {
            if (err) {
                return deferred.reject(err);
            }

            const message = log.latest ? log.latest.message : '';

            // Commit messages are suffixed with message starting with '(HEAD -> )'
            deferred.resolve(message.split('(HEAD')[0].trim());
        });

        return deferred.promise;
    };

    const parseRemotes = targetRemote => {
        const deferred = Q.defer();

        gitContext.getRemotes(true, (err, remotes) => {
            // Remote error checking
            if (err) {
                return deferred.reject(new Error(err));
            }

            if (!remotes || remotes.length < 1) {
                return deferred.reject(new Error('No remotes configured.'));
            }

            // Determine which Gitlab server this repo uses
            const remote = remotes.find(remote => remote.name === targetRemote);
            if (!remote) {
                return deferred.reject(new Error(`Target remote ${targetRemote} does not exist.`));
            }

            // Parse repo host and tokens
            const repoUrl = remote.refs.push;
            const https = repoUrl.indexOf('https://') > -1;

            const repoHost = https ?
                 url.parse(repoUrl).host :
                 repoUrl.split(':')[0].split('@')[1];

            const repoId = https ?
                repoUrl.split(`https://${repoHost}/`)[1].split('.git')[0] :
                repoUrl.split(':')[1].split('.git')[0];

            deferred.resolve({
                repoId,
                repoHost
            });
        });

        return deferred.promise;
    };

    const checkoutBranch = branchName => {
        const deferred = Q.defer();

        gitContext.checkout(['-b', branchName], err => {
            if (err) {
                return deferred.reject(new Error(err));
            }

            deferred.resolve();
        });

        return deferred.promise;
    };

    const addFiles = files => {
        const deferred = Q.defer();

        gitContext.add(files, err => {
            if (err) {
                return deferred.reject(new Error(err));
            }

            deferred.resolve();
        });

        return deferred.promise;
    };

    const commitFiles = commitMessage => {
        const deferred = Q.defer();

        gitContext.commit(commitMessage, err => {
            if (err) {
                return deferred.reject(new Error(err));
            }

            return deferred.resolve();
        });

        return deferred.promise;
    };

    const pushBranch = (targetRemote, branchName) => {
        const deferred = Q.defer();

        gitContext.push(['-u', targetRemote, branchName], err => {
            if (err) {
                return deferred.reject(new Error(err));
            }

            return deferred.resolve();
        });

        return deferred.promise;
    };

    return {
        checkStatus,
        lastCommitMessage,
        parseRemotes,
        checkoutBranch,
        addFiles,
        commitFiles,
        pushBranch
    };
};
