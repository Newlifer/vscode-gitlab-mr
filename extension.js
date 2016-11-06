const vscode = require('vscode');
const workflows = require('./src/workflows');

exports.activate = context => {
    const openMR = vscode.commands.registerCommand('extension.openMR', workflows.openMR);
    const viewMR = vscode.commands.registerCommand('extension.viewMR', workflows.viewMR);
    const checkoutMR = vscode.commands.registerCommand('extension.checkoutMR', workflows.checkoutMR);

    context.subscriptions.push(openMR);
    context.subscriptions.push(viewMR);
    context.subscriptions.push(checkoutMR);
};

exports.deactivate = () => {};
