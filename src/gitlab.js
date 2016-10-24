const Q = require('q');

module.exports = gitlabContext => {
    const openMr = (repoId, repoHost, branchName, targetBranch, commitMessage) => {
        const deferred = Q.defer();

        gitlabContext.projects.merge_requests.add(repoId, branchName, targetBranch, null, commitMessage, mr => {
            if (!mr.iid) {
                return deferred.reject(new Error('Unable to open MR.'));
            }

            deferred.resolve(mr);
        });

        return deferred.promise;
    };

    return {
        openMr
    };
};
