const vscode = require('vscode');
const workflows = require('./src/workflows');

exports.activate = context => {
    const openMR = vscode.commands.registerCommand('extension.openMR', workflows.openMR);

    context.subscriptions.push(openMR);
};

exports.deactivate = () => {};
