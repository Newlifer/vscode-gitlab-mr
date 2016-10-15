const vscode = require('vscode');
const open = require('opn');
const gitlab = require('gitlab')
const simpleGit = require('simple-git');
const url = require('url');

const STATUS_TIMEOUT = 10000;

const message = message => `Gitlab MR: ${message}`;

module.exports = {
    mrFromMaster: () => {
        const preferences = vscode.workspace.getConfiguration('gitlab-mr');

        // Target branch and remote
        const targetBranch = preferences.get('targetBranch', 'master');
        const targetRemote = preferences.get('targetRemote', 'origin');

        // Access tokens
        const gitlabComAccessToken = preferences.get('accessToken');
        const otherAccessTokens = preferences.get('accessTokens');

        // Set git context
        const git = simpleGit(vscode.workspace.rootPath);

        // Read remotes to determine where MR will go
        git.getRemotes(true, (remotesErr, remotes) => {
            // Remote error checking
            if (remotesErr) {
                return vscode.window.showErrorMessage(message(remotesErr));
            }

            if (!remotes || remotes.length < 1) {
                return vscode.window.showErrorMessage(message('No remotes configured.'));
            }

            // Determine which Gitlab server this repo uses
            const remote = remotes.find(remote => remote.name === targetRemote);
            if (!remote) {
                return vscode.window.showErrorMessage(message(`Target remote ${targetRemote} does not exist.`));
            }

            // Parse repo host and tokens
            const repoUrl = remote.refs.push;
            const https = repoUrl.indexOf('https://') > -1;

            const repoHost = https ?
                 url.parse(repoUrl).host :
                 repoUrl.split(':')[0].split('@')[1];

            const httpsRepoHost = `https://${repoHost}`;

            const repoId = https ?
                repoUrl.split(`${httpsRepoHost}/`)[1].split('.git')[0] :
                repoUrl.split(':')[1].split('.git')[0];

            const isGitlabCom = repoHost === "gitlab.com";
            const accessToken = isGitlabCom ? gitlabComAccessToken : otherAccessTokens[httpsRepoHost];

            // Token not set for repo host
            if (!accessToken) {
                const tokenUrl = url.format({
                    protocol: 'https',
                    host: repoHost,
                    pathname: '/profile/personal_access_tokens'
                });

                const errorMsg = isGitlabCom ?
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

            // Setup gitlab api
            const gitlabApi = gitlab({
                url: url.format({
                    protocol: 'https',
                    host: repoHost
                }),
                token: accessToken
            });

            // Prompt user for branch and commit message
            vscode.window.showInputBox({
                prompt: 'Branch Name:'
            }).then(branch => {
                // Validate branch name
                if (!branch) {
                    return vscode.window.showErrorMessage(message('Branch name must be provided.'));
                }

                if (branch.indexOf(' ') > -1) {
                    return vscode.window.showErrorMessage(message('Branch name must not contain spaces.'));
                }

                vscode.window.showInputBox({
                    prompt: 'Commit Messaage:'
                }).then(commit_message => {
                    // Validate commit message
                    if (!commit_message) {
                        return vscode.window.showErrorMessage(message('Commit message must be provided.'));
                    }

                    vscode.window.setStatusBarMessage(message(`Building MR to master from ${branch}...`));

                    const gitStatusError =  message('Unable to create MR.');

                    // Create branch
                    git.checkout(['-b', branch], checkoutError => {
                        if (checkoutError) {
                            vscode.window.setStatusBarMessage(gitStatusError, STATUS_TIMEOUT);
                            return vscode.window.showErrorMessage(message(checkoutError));
                        }

                        // Stage files
                        git.add('./*', addErr => {
                            if (addErr) {
                                vscode.window.setStatusBarMessage(gitStatusError, STATUS_TIMEOUT);
                                return vscode.window.showErrorMessage(message(addErr));
                            }

                            // Commit files
                            git.commit(commit_message, commitErr => {
                                if (commitErr) {
                                    vscode.window.setStatusBarMessage(gitStatusError, STATUS_TIMEOUT);
                                    return vscode.window.showErrorMessage(message(commitErr));
                                }

                                // Push to Gitlab
                                git.push(['-u', targetRemote, branch], pushErr => {
                                    if (pushErr) {
                                        vscode.window.setStatusBarMessage(gitStatusError, STATUS_TIMEOUT);
                                        return vscode.window.showErrorMessage(message(pushErr));
                                    }

                                    // Open MR via Gitlab API
                                    gitlabApi.projects.merge_requests.add(repoId, branch, targetBranch, null, commit_message, mr => {
                                        // node-gitlab doesn't seem to bubble the actual error up
                                        if (!mr.iid) {
                                            const gitlabNewMrUrl = url.format({
                                                protocol: 'https',
                                                host: repoHost,
                                                pathname: `${repoId}/merge_requests/new`,
                                                query: {
                                                    'merge_request[source_branch]': branch,
                                                    'merge_request[target_branch]': targetBranch
                                                }
                                            });

                                            const errorMessage = message('Unable to create MR.');
                                            const createButton = 'Create on Gitlab';

                                            vscode.window.setStatusBarMessage(errorMessage, STATUS_TIMEOUT);
                                            return vscode.window.showErrorMessage(errorMessage, createButton).then(selected => {
                                                switch (selected) {
                                                    case createButton:
                                                        open(gitlabNewMrUrl);
                                                        break;
                                                }
                                            })
                                        }

                                        // Success message and prompt
                                        const successMessage = message(`MR !${mr.iid} created.`);
                                        const successButton = 'Open MR';

                                        vscode.window.setStatusBarMessage(successMessage, STATUS_TIMEOUT);
                                        vscode.window.showInformationMessage(successMessage, successButton).then(selected => {
                                            switch (selected) {
                                                case successButton: {
                                                    open(mr.web_url);
                                                    break;
                                                }
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
}