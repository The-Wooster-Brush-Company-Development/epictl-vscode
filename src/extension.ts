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
import { EpictlTreeView, registerTreeEvents } from "./treeView/treeView";
import { ContextWebview } from "./webviews/contextWebview";
import { BpmWebview } from "./webviews/bpmWebview";
import { NotificationManager } from "./managers/notificationManager";
import { StateManager } from "./managers/stateManager";
import { PromptManager } from "./managers/promptManager";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "epictl-vscode" is now active!');

  const vsCodeConfigManager = new VsCodeConfigManager(context);
  const manifestManager = new ManifestManager(context);
  const notificationManager = new NotificationManager();
  const promptManager = new PromptManager();
  const stateManager = new StateManager(context);

  const contextWebview = new ContextWebview(
    context.extensionUri,
    vsCodeConfigManager,
    notificationManager,
    promptManager,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("contextMenu", contextWebview),
  );

  const bpmWebview = new BpmWebview(
    context.extensionUri,
    manifestManager,
    vsCodeConfigManager,
    notificationManager,
    promptManager,
    stateManager,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("bpmMenu", bpmWebview),
  );

  const epictlTreeView = new EpictlTreeView(
    vsCodeConfigManager,
    manifestManager,
    bpmWebview,
    stateManager,
  );
  const treeView = vscode.window.createTreeView("epictlExplorer", {
    treeDataProvider: epictlTreeView,
  });

  registerTreeEvents(treeView, epictlTreeView, stateManager);

  // ***********************************************************
  // register all commands for the extension
  // ***********************************************************
  vsCodeConfigCommands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager, notificationManager, promptManager);
    });
    context.subscriptions.push(disposable);
  });

  cliConfigCommands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager, notificationManager, promptManager);
    });
    context.subscriptions.push(disposable);
  });

  commands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(vsCodeConfigManager, notificationManager, promptManager);
    });
    context.subscriptions.push(disposable);
  });

  manifestCommands.forEach(({ name, callback }) => {
    let disposable = vscode.commands.registerCommand(name, () => {
      callback(
        vsCodeConfigManager,
        manifestManager,
        notificationManager,
        promptManager,
      );
    });
    context.subscriptions.push(disposable);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
