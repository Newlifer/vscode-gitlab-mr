const vscode = require('vscode');
const open = require('opn');
const gitlab = require('gitlab')
const simpleGit = require('simple-git');
const Promise = require('bluebird');

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
        const gitAsync = Promise.promisifyAll(git);

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

                if (!commit_message) {
                    return vscode.window.showErrorMessage(message('Commit message must be provided.'));
                }

                vscode.window.setStatusBarMessage(message(`Building MR to master from ${branch}...`), STATUS_TIMEOUT);

                // Start git operations
                gitAsync.checkoutAsync(['-b', branch])
                .then(gitAsync.addAsync('./*'))
                .then(gitAsync.commitAsync(commit_message))
                .then(gitAsync.pushAsync(['-u', targetRemote, branch]))
                .then(() => {
                    return gitAsync.getRemotesAsync(true);
                })
                .then(remotes => {
                    if (remotes.length < 1) {
                        return vscode.window.showErrorMessage(message('No remotes configured.'));
                    }

                    // Parse Gitlab repo id from remotes
                    const repo_url = remotes[0].refs.push;
                    const repo_id = repo_url.split(":")[1].split(".git")[0];

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

    context.subscriptions.push(mrFromMaster);
}

exports.deactivate = () => {};
