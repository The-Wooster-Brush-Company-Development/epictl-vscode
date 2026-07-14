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
import {
  EpictlTreeView,
  EpicorNode,
  BpmNode,
  DirectiveNode,
  BomProcessingNode,
  TableProcessingNode,
  registerTreeEvents,
} from "./treeView/treeView";
import { ContextWebview } from "./webviews/contextWebview";
import { BpmWebview } from "./webviews/bpmWebview";
import { NotificationManager } from "./managers/notificationManager";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "epictl-vscode" is now active!');

  const vsCodeConfigManager = new VsCodeConfigManager(context);
  const manifestManager = new ManifestManager(context);
  const notificationManager = new NotificationManager();

  const contextWebview = new ContextWebview(
    context.extensionUri,
    vsCodeConfigManager,
    notificationManager,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("contextMenu", contextWebview),
  );

  const bpmWebview = new BpmWebview(
    context.extensionUri,
    manifestManager,
    vsCodeConfigManager,
    notificationManager,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("bpmMenu", bpmWebview),
  );

  const epictlTreeView = new EpictlTreeView(
    vsCodeConfigManager,
    manifestManager,
    bpmWebview,
  );
  const treeView = vscode.window.createTreeView("epictlExplorer", {
    treeDataProvider: epictlTreeView,
  });

  registerTreeEvents(treeView, epictlTreeView);

  // ***********************************************************
  // register all commands for the extension
  // ***********************************************************
  vsCodeConfigCommands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager, notificationManager);
    });
    context.subscriptions.push(disposable);
  });

  cliConfigCommands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager, notificationManager);
    });
    context.subscriptions.push(disposable);
  });

  commands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager, notificationManager);
    });
    context.subscriptions.push(disposable);
  });

  manifestCommands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager, manifestManager, notificationManager);
    });
    context.subscriptions.push(disposable);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
