// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import {
  commands,
  manifestCommands,
  cliConfigCommands,
  vsCodeConfigCommands,
} from "./commandRegistry";
import { VsCodeConfigManager } from "./managers/configManager";
import { ManifestManager } from "./managers/manifestManager";
import { EpictlTreeView } from "./treeView/treeView";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "epictl-vscode" is now active!');

  const vsCodeConfigManager = new VsCodeConfigManager(context);
  const manifestManager = new ManifestManager(context);

  const epictlTreeView = new EpictlTreeView(
    vsCodeConfigManager,
    manifestManager,
  );
  vscode.window.registerTreeDataProvider("epictlExplorer", epictlTreeView);
  // ***********************************************************
  // register all commands for the extension
  // ***********************************************************
  vsCodeConfigCommands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager);
    });
    context.subscriptions.push(disposable);
  });

  cliConfigCommands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager);
    });
    context.subscriptions.push(disposable);
  });

  commands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager);
    });
    context.subscriptions.push(disposable);
  });

  manifestCommands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager, manifestManager);
    });
    context.subscriptions.push(disposable);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
