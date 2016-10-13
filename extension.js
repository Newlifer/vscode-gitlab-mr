const vscode = require('vscode');
const open = require('opn');
const gitlab = require('gitlab')
const simpleGit = require('simple-git');

const STATUS_TIMEOUT = 10000;

const message = message => `Gitlab MR: ${message}`;

exports.activate = context => {
    const mrFromMaster = vscode.commands.registerCommand('extension.mrFromMaster', () => {
        // Read and validate preferences
        const preferences = vscode.workspace.getConfiguration('gitlab-mr');
        const targetBranch = preferences.get('targetBranch', 'master');
        const targetRemote = preferences.get('targetRemote', 'origin');
        const gitlabConfig = {
            url: preferences.get('gitlabUrl', 'https://gitlab.com'),
            token: preferences.get('accessToken')
        };

        if (!gitlabConfig.token) {
            return vscode.window.showErrorMessage(message('gitlab-mr.accessToken preference not set.'), 'Generate Access Token').then(selected => {
                switch (selected) {
                    case 'Generate Access Token':
                        open(`${gitlabConfig.url}/profile/personal_access_tokens`);
                        break;
                }
            });
        }

        // Set git and gitlab contexts
        const gitlabApi = gitlab(gitlabConfig);
        const git = simpleGit(vscode.workspace.rootPath);

        // Prompt user for branch and commit message
        vscode.window.showInputBox({
            prompt: 'Branch Name:'
        }).then(branch => {
            vscode.window.showInputBox({
                prompt: 'Commit Messaage:'
            }).then(commit_message => {
                // Validate user inputs
                if (!branch) {
                    return vscode.window.showErrorMessage(message('Branch name must be provided.'));
                }

                if (branch.indexOf(' ') > -1) {
                    return vscode.window.showErrorMessage(message('Branch name must not contain spaces.'));
                }

                if (!commit_message) {
                    return vscode.window.showErrorMessage(message('Commit message must be provided.'));
                }

                vscode.window.setStatusBarMessage(message(`Building MR to master from ${branch}...`), STATUS_TIMEOUT);

                // Create branch
                git.checkout(['-b', branch], checkoutError => {
                    if (checkoutError) {
                        return vscode.window.showErrorMessage(message(checkoutError));
                    }

                    // Stage files
                    git.add('./*', addErr => {
                        if (addErr) {
                            return vscode.window.showErrorMessage(message(addErr));
                        }

                        // Commit files
                        git.commit(commit_message, commitErr => {
                            if (commitErr) {
                                return vscode.window.showErrorMessage(message(commitErr));
                            }

                            // Get remotes
                            git.getRemotes(true, (remotesErr, remotes) => {
                                if (remotesErr) {
                                    return vscode.window.showErrorMessage(message(remotesErr));
                                }

                                if (!remotes || remotes.length < 1) {
                                    return vscode.window.showErrorMessage(message('No remotes configured.'));
                                }

                                // Parse Gitlab repo id from remotes
                                // remotes[0].name

                                const remote = remotes.find(remote => remote.name === targetRemote);

                                if (!remote) {
                                    return vscode.window.showErrorMessage(message('Target remote does not exist.'));
                                }

                                const repo_url = remote.refs.push;
                                const https = repo_url.indexOf('https://') > -1;
                                const repo_id = https ?
                                                repo_url.split(`${gitlabConfig.url}/`)[1].split('.git')[0] :
                                                repo_url.split(':')[1].split('.git')[0];

                                // Push to Gitlab
                                git.push(['-u', targetRemote, branch], pushErr => {
                                    if (pushErr) {
                                        return vscode.window.showErrorMessage(message(pushErr));
                                    }

                                    // Open MR via Gitlab API
                                    gitlabApi.projects.merge_requests.add(repo_id, branch, targetBranch, null, commit_message, mr => {
                                        const successMessage = message(`MR !${mr.iid} created.`);

                                        vscode.window.setStatusBarMessage(successMessage, STATUS_TIMEOUT);
                                        vscode.window.showInformationMessage(successMessage, 'Open MR').then(selected => {
                                            switch (selected) {
                                                case 'Open MR': {
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
    });

    context.subscriptions.push(mrFromMaster);
}

exports.deactivate = () => {};
