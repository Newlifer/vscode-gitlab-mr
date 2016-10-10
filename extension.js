const vscode = require('vscode');
const open = require('opn');
const gitlab = require('gitlab')
const simpleGit = require('simple-git');
const Promise = require('bluebird');

function activate(context) {
    const makeMrFromMaster = vscode.commands.registerCommand('extension.makeMrFromMaster', () => {
        const preferences = vscode.workspace.getConfiguration('gitlab');
        const gitlabApi = gitlab({
            url: preferences.get('url'),
            token: preferences.get('token')
        });

        const git = simpleGit(vscode.workspace.rootPath);
        const gitAsync = Promise.promisifyAll(git);

        vscode.window.showInputBox({
            prompt: 'Branch Name:'
        }).then(branch => {
            vscode.window.showInputBox({
                prompt: 'Commit Messaage:'
            }).then(commit_message => {
                vscode.window.setStatusBarMessage(`Gitlab: Building MR to master from ${branch}...`);

                gitAsync.checkoutAsync(['-b', branch])
                .then(gitAsync.addAsync('./*'))
                .then(gitAsync.commitAsync(commit_message))
                .then(gitAsync.pushAsync(['-u', 'origin', branch]))
                .then(() => {
                    return gitAsync.getRemotesAsync(true);
                })
                .then(remotes => {
                    const repo_url = remotes[0].refs.push;
                    const repo_id = repo_url.split(":")[1].split(".git")[0];

                    gitlabApi.projects.merge_requests.add(repo_id, branch, 'master', null, commit_message, mr => {
                        const successMessage = `Gitlab: MR !${mr.iid} created.`;

                        vscode.window.setStatusBarMessage(successMessage);
                        vscode.window.showInformationMessage(successMessage, 'Open MR').then(selected => {
                            switch (selected) {
                                case 'Open MR': {
                                    open(mr.web_url);
                                    break;
                                }
                            }
                        });
                    });
                })
                .catch(err => {
                    vscode.window.showErrorMessage(err);
                });
            });
        });
    });

    context.subscriptions.push(makeMrFromMaster);
}

exports.activate = activate;

function deactivate() { }

exports.deactivate = deactivate;