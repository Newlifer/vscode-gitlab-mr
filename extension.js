const vscode = require('vscode');
const workflows = require('./src/workflows');

exports.activate = context => {
    const mrFromMaster = vscode.commands.registerCommand('extension.mrFromMaster', workflows.mrFromMaster);

    context.subscriptions.push(mrFromMaster);
};

exports.deactivate = () => {};
