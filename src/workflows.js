const vscode = require('vscode');
const open = require('opn');
const url = require('url');
const gitApi = require('simple-git');
const gitlabApi = require('gitlab');

const gitActions = require('./git');
const gitlabActions = require('./gitlab');

const message = msg => `Gitlab MR: ${msg}`;
const ERROR_STATUS = message('Unable to create MR.');
const STATUS_TIMEOUT = 10000;

const showErrorMessage = msg => {
    vscode.window.setStatusBarMessage(ERROR_STATUS, STATUS_TIMEOUT);
    vscode.window.showErrorMessage(message(msg));
};

module.exports = {
    mrFromMaster: () => {
        const preferences = vscode.workspace.getConfiguration('gitlab-mr');

        // Target branch and remote
        const targetBranch = preferences.get('targetBranch', 'master');
        const targetRemote = preferences.get('targetRemote', 'origin');

        // Access tokens
        const gitlabComAccessToken = preferences.get('accessToken');
        const gitlabCeAccessTokens = preferences.get('accessTokens');

        // Set git context
        const gitContext = gitApi(vscode.workspace.rootPath);
        const git = gitActions(gitContext);

        // Check repo status
        git.checkStatus(targetBranch)
        .then(() => {
            // Read remotes to determine where MR will go
            git.parseRemotes(targetRemote, gitlabComAccessToken, gitlabCeAccessTokens)
            .then(result => {
                const repoId = result.repoId;
                const repoHost = result.repoHost;

                const httpsRepoHost = `https://${repoHost}`;
                const isGitlabCom = repoHost === 'gitlab.com';
                const accessToken = isGitlabCom ? gitlabComAccessToken : gitlabCeAccessTokens[httpsRepoHost];

                // Token not set for repo host
                if (!accessToken) {
                    const tokenUrl = `${httpsRepoHost}/profile/personal_access_tokens`;
                    const errorMsg = httpsRepoHost === 'https://gitlab.com' ?
                        'gitlab-mr.accessToken preference not set.' :
                        `gitlab-mr.accessTokens['${httpsRepoHost}'] preference not set.`;

                    const generateTokenLabel = 'Generate Access Token';

                    return vscode.window.showErrorMessage(message(errorMsg), generateTokenLabel).then(selected => {
                        switch (selected) {
                            case generateTokenLabel:
                                open(tokenUrl);
                                break;
                        }
                    });
                }

                // Build Gitlab context
                const gitlabContext = gitlabApi({
                    url: url.format({
                        host: repoHost,
                        protocol: 'https'
                    }),
                    token: accessToken
                });

                const gitlab = gitlabActions(gitlabContext);

                // Prompt user for branch and commit message
                vscode.window.showInputBox({
                    prompt: 'Branch Name:'
                })
                .then(branch => {
                    // Validate branch name
                    if (!branch) {
                        return showErrorMessage('Branch name must be provided.');
                    }

                    if (branch.indexOf(' ') > -1) {
                        return showErrorMessage('Branch name must not contain spaces.');
                    }

                    vscode.window.showInputBox({
                        prompt: 'Commit Messaage:'
                    })
                    .then(commitMessage => {
                        // Validate commit message
                        if (!commitMessage) {
                            return showErrorMessage('Commit message must be provided.');
                        }

                        vscode.window.setStatusBarMessage(message(`Building MR to master from ${branch}...`));

                        // Create commit, push branch, open MR
                        git.checkoutBranch(branch)
                        .then(() => git.addFiles('./*'))
                        .then(() => git.commitFiles(commitMessage))
                        .then(() => git.pushBranch(targetRemote, branch))
                        .then(() => {
                            gitlab.openMr(repoId, repoHost, branch, targetBranch, commitMessage)
                            .then(mr => {
                                // Success message and prompt
                                const successMessage = message(`MR !${mr.iid} created.`);
                                const successButton = 'Open MR';

                                vscode.window.setStatusBarMessage(successMessage, STATUS_TIMEOUT);
                                vscode.window.showInformationMessage(successMessage, successButton).then(selected => {
                                    switch (selected) {
                                        case successButton: {
                                            vscode.window.setStatusBarMessage('');
                                            open(mr.web_url);
                                            break;
                                        }
                                    }
                                });
                            })
                            .catch(() => {
                                // Build url to create MR from web ui
                                const gitlabNewMrUrl = url.format({
                                    protocol: 'https',
                                    host: repoHost,
                                    pathname: `${repoId}/merge_requests/new`,
                                    query: {
                                        'merge_request[source_branch]': branch,
                                        'merge_request[target_branch]': targetBranch
                                    }
                                });

                                const createButton = 'Create on Gitlab';

                                vscode.window.setStatusBarMessage(ERROR_STATUS, STATUS_TIMEOUT);
                                vscode.window.showErrorMessage(ERROR_STATUS, createButton).then(selected => {
                                    switch (selected) {
                                        case createButton:
                                            vscode.window.setStatusBarMessage('');
                                            open(gitlabNewMrUrl);
                                            break;
                                    }
                                });
                            });
                        });
                    });
                });
            });
        })
        .catch(err => {
            showErrorMessage(err.message);
        });
    }
};
