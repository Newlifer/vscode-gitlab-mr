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

    const listMrs = (repoId, params) => {
        const deferred = Q.defer();

        gitlabContext.projects.merge_requests.list(repoId, params, mrs => {
            if (!mrs) {
                return deferred.reject(new Error('No MRs found.'));
            }

            deferred.resolve(mrs);
        });

        return deferred.promise;
    };

    return {
        openMr,
        listMrs
    };
};
