import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { VsCodeConfigManager } from "../managers/configManager";
import { ManifestManager } from "../managers/manifestManager";
import { NotificationManager } from "../managers/notificationManager";
import { initCodeFile } from "../utils/registryUtils";
import { StateManager } from "../managers/stateManager";
import { PromptManager } from "../managers/promptManager";
import { describeBpm } from "../commandHandlers";
import {
  initManifestHandler,
  cloneManifestHandler,
  updateFieldHandler,
  applyBpmHandler,
  openCodeFileHandler,
  deleteBpmHandler,
  refreshBpmHandler,
} from "./webviewHandlers/bpmWebviewHandlers";

export class BpmWebview implements vscode.WebviewViewProvider {
  private _webviewView: vscode.WebviewView | undefined;
  private manifestManager: ManifestManager;
  private vsCodeConfigManager: VsCodeConfigManager;
  private notificationManager: NotificationManager;
  private promptManager: PromptManager;
  private stateManager: StateManager;
  private ready: boolean;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    manifestManager: ManifestManager,
    vsCodeConfigManager: VsCodeConfigManager,
    notificationManager: NotificationManager,
    promptManager: PromptManager,
    stateManager: StateManager,
  ) {
    this.manifestManager = manifestManager;
    this.vsCodeConfigManager = vsCodeConfigManager;
    this.notificationManager = notificationManager;
    this.promptManager = promptManager;
    this.stateManager = stateManager;
    this.ready = false;

    this.stateManager.onDidChangeState(() => {
      if (!this.ready) {
        return;
      }
      const state = this.stateManager.readState();
      if (state.Type === "bpm") {
        this.displayDirectiveBpm();
      }
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "ready") {
        this.ready = true;
        this.checkForCurrentDirective();
        return;
      }

      if (!this.ready) {
        return;
      }

      switch (message.command) {
        case "initManifest":
          try {
            const result = await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "Initializing Manifest...",
                cancellable: false,
              },
              () =>
                initManifestHandler(
                  this.vsCodeConfigManager,
                  this.promptManager,
                  this.manifestManager,
                  message.data,
                ),
            );

            if (result.success && result.updateResult.success) {
              initCodeFile(
                result.codeFilePath,
                result.manifestPath,
                this.manifestManager,
              );

              this.notificationManager.success(
                "Manifest initialized successfully at " +
                  path.basename(result.manifestPath) +
                  "\nCode file created at " +
                  result.codeFilePath,
              );
            } else if (result.duplicate) {
              this.notificationManager.error(
                `Manifest ${path.basename(result.manifestPath)} already exists`,
              );
            } else {
              this.notificationManager.error(result.message);
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
        case "cloneManifest":
          try {
            if (!this.vsCodeConfigManager.readManifestCodeDirPath()) {
              throw new Error("No manifest code directory path set");
            }
            const result = await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "Cloning Manifest...",
                cancellable: false,
              },
              () =>
                cloneManifestHandler(
                  this.vsCodeConfigManager,
                  this.promptManager,
                  this.manifestManager,
                  message.data,
                ),
            );

            if (result.success) {
              const codeFilePath = this.vsCodeConfigManager.createCodeFilePath(
                result.results,
              );
              this.manifestManager.writeManifestCodeFilePath(
                path.basename(result.results),
                codeFilePath,
              );
              this.vsCodeConfigManager.writeToCodeFile(
                codeFilePath,
                result.codeLines,
              );

              this.notificationManager.success(
                "Manifest cloned successfully at " +
                  path.basename(result.results) +
                  "\nCode file created at " +
                  codeFilePath,
              );
              this.disableCloneManifestButton();
            } else if (result.duplicate) {
              this.notificationManager.error(
                `Manifest ${path.basename(result.results)} already exists`,
              );
              this.disableCloneManifestButton();
            } else {
              this.notificationManager.error(result.message);
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
        case "fieldClicked":
          try {
            const result = await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "Updating Field...",
                cancellable: false,
              },
              () =>
                updateFieldHandler(
                  this.vsCodeConfigManager.readExecPath() ?? "",
                  message,
                  this.manifestManager,
                ),
            );
            if (result.success) {
              this.notificationManager.notifySuccess("Success");
              this.notificationManager.success(result.successMessage);
              this._webviewView!.webview.postMessage({
                command: "enableApplyBpmButton",
                data: {
                  directiveId: message.directiveId,
                  sysRowId: message.sysRowId,
                  name: result.name,
                },
              });
              this.updateBpmData(result.name);
            } else {
              this.notificationManager.error(result.errorMessage);
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
        case "applyBpm":
          try {
            const execPath = this.vsCodeConfigManager.readExecPath() ?? "";
            if (!execPath) {
              throw new Error("Exec path not found");
            }
            const result = JSON.parse(
              await vscode.window.withProgress(
                {
                  location: vscode.ProgressLocation.Notification,
                  title: "Applying BPM...",
                  cancellable: false,
                },
                () =>
                  applyBpmHandler(execPath, message.data, this.manifestManager),
              ),
            );
            if (result.success) {
              this.notificationManager.notifySuccess("Success");
              this.notificationManager.success(result.message);
              this.disableApplyBpmButton();
            } else {
              this.notificationManager.error(result.message);
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
        case "openCodeFile":
          try {
            const openFiles = vscode.window.tabGroups.all.flatMap(({ tabs }) =>
              tabs
                .map((tab) => {
                  if (tab.input instanceof vscode.TabInputText) {
                    return tab.input.uri.fsPath;
                  }
                  return null;
                })
                .filter((filePath) => filePath !== null),
            );

            const codeFilePath = await openCodeFileHandler(
              this.manifestManager,
              message.data.name,
            );
            if (!codeFilePath) {
              throw new Error("Code file not found");
            }

            const uri = vscode.Uri.file(codeFilePath);

            if (openFiles.includes(codeFilePath)) {
              const doc = await vscode.workspace.openTextDocument(uri);
              await vscode.window.showTextDocument(doc, {
                preserveFocus: false,
                preview: false,
              });
              return;
            } else {
              await vscode.window.showTextDocument(uri);
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
        case "deleteBpm":
          try {
            const execPath = this.vsCodeConfigManager.readExecPath() ?? "";
            if (!execPath) {
              throw new Error("Exec path not found");
            }

            const manifestPath = this.manifestManager.createManifestFilePath(
              message.data.name ?? "",
            );
            let result: any;
            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "Deleting BPM...",
                cancellable: false,
              },
              async () => {
                result = await deleteBpmHandler(
                  execPath,
                  manifestPath,
                  this.promptManager,
                );
              },
            );
            if (result.success) {
              this.notificationManager.success(result.message);
              this.stateManager.clearState();
              this.clearBpmWebview();
            } else {
              this.notificationManager.error(result.message);
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
        case "refreshBpm":
          try {
            const execPath = this.vsCodeConfigManager.readExecPath() ?? "";
            if (!execPath) {
              throw new Error("Exec path not found");
            }
            let result: any;
            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "Refreshing BPM...",
                cancellable: false,
              },
              async () => {
                result = await refreshBpmHandler(execPath, this.stateManager);
              },
            );
            if (result.success) {
              this.stateManager.writeState(result.newState);
              this.displayDirectiveBpm();
              this.notificationManager.notifySuccess("Success");
            } else {
              this.notificationManager.error("Error refreshing BPM");
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
      }
    });
    this._webviewView.onDidChangeVisibility(() => {
      if (this._webviewView?.visible) {
        this.checkForCurrentDirective();
      }
    });
  }

  private checkForCurrentDirective() {
    const state = this.stateManager.readState();
    if (state.Type === "bpm") {
      this.displayDirectiveBpm();
    } else {
      this.stateManager.clearState();
      this.clearBpmWebview();
    }
  }

  private clearBpmWebview() {
    this._webviewView!.webview.postMessage({
      command: "clearBpmWebview",
    });
  }

  public postMessageHelper(message: any) {
    switch (message.command) {
      case "describeDirectiveBpm":
        this.displayDirectiveBpm();
        break;
      case "canInitManifest":
        this.enableInitManifestButton();
        break;
    }
  }
  public updateBpmData(name: string) {
    try {
      const manifestData = this.manifestManager.readManifest(name);
      this.stateManager.updateWithManifestData(manifestData.bpmConfig);
    } catch (error: any) {
      this.notificationManager.error("Error updating state: " + error.message);
      return;
    }
    this.displayDirectiveBpm();
  }

  public async displayDirectiveBpm() {
    let data: any;
    try {
      data = this.stateManager.readState();
    } catch (error: any) {
      this.notificationManager.error("Error reading state: " + error.message);
      return;
    }
    let codeLines: string;
    try {
      codeLines = await this.getCodeToDisplay(data);
    } catch (error: any) {
      this.notificationManager.error(
        "Error getting code to display: " + error.message,
      );
      return;
    }
    await this._webviewView!.webview.postMessage({
      command: "displayDirectiveBpm",
      data: data,
    });
    await this._webviewView!.webview.postMessage({
      command: "displayCode",
      data: codeLines,
    });
    await this.enableCloneManifestButton(data);
    await this.enableDeleteBpmButton(data);
    await this.enableRefreshBpmButton(data);
  }

  private truncateCodePreview(code: string): string {
    const lines = code.split("\n");
    let preview = lines.slice(0, 15).join("\n");
    if (lines.length > 15) {
      preview += "\n\n";
      preview += "                       .\n";
      preview += "                       .\n";
      preview += "                       .\n";
      preview += `${lines.length - 15} more lines\n`;
    }
    return preview;
  }

  private async getCodeToDisplay(data: any): Promise<string> {
    // Prefer local code file when a manifest is associated
    try {
      const manifest = this.manifestManager.readManifest(data.Name);
      const codeFilePaths = manifest?.epictl?.code_file ?? [];
      if (codeFilePaths.length > 0 && fs.existsSync(codeFilePaths[0])) {
        const code = fs.readFileSync(codeFilePaths[0], "utf8");
        return this.truncateCodePreview(code);
      }
    } catch {}

    try {
      const code =
        JSON.parse(
          await describeBpm(
            this.vsCodeConfigManager.readExecPath() ?? "",
            "",
            data.DirectiveID,
            data.ParentType,
            data.ParentSysRowId,
            "json",
          ),
        ).code ?? "";

      if (!code) {
        return "No code found";
      }
      return this.truncateCodePreview(code);
    } catch (error: any) {
      this.notificationManager.error(
        "Error fetching code lines: " + error.message,
      );
      return "No code found";
    }
  }

  /**
   * Enable Buttons
   */

  private async enableInitManifestButton() {
    let data: any;
    try {
      data = this.stateManager.readState();
    } catch (error: any) {
      console.error("Error reading state: ", error);
      return;
    }
    await this._webviewView!.webview.postMessage({
      command: "enableInitManifestButton",
      data: data,
    });
  }

  private async enableCloneManifestButton(message: any) {
    await this._webviewView!.webview.postMessage({
      command: "enableCloneManifestButton",
      data: message,
    });
  }

  private async enableDeleteBpmButton(message: any) {
    this._webviewView!.webview.postMessage({
      command: "enableDeleteBpmButton",
      data: message,
    });
  }
  private async enableRefreshBpmButton(message: any) {
    this._webviewView!.webview.postMessage({
      command: "enableRefreshBpmButton",
      data: message,
    });
  }
  /*
   * Disable Buttons
   */

  private async disableCloneManifestButton() {
    this._webviewView!.webview.postMessage({
      command: "disableCloneManifestButton",
    });
  }

  private async disableApplyBpmButton() {
    this._webviewView!.webview.postMessage({
      command: "disableApplyBpmButton",
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Epictl</title>
     <style>
      :root {
      --epictl-red: #e53935;
      --epictl-red-dark: #b71c1c;
      --epictl-radius: 6px;
      --epictl-transition: 0.15s ease;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 16px;
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }

    body.vscode-dark {
      color: #f5f5f5;
    }

    body.vscode-high-contrast:not(.vscode-high-contrast-light) {
      color: #ffffff;
    }

    h1 {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.08em;
      margin: 0 0 4px 0;
      color: inherit;
    }

    .subtitle {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin: 0 0 20px 0;
    }

    .accent-bar {
      height: 3px;
      width: 75%;
      background: linear-gradient(90deg, var(--epictl-red), var(--epictl-red-dark));
      border-radius: 2px;
      margin-bottom: 20px;
    }

    .section-buttons {
      margin-bottom: 10px;
    }

    .section {
      margin-bottom: 18px;
    }

    #btn-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .section-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--vscode-descriptionForeground);
      margin: 0 0 8px 2px;
    }

    .section-hidden {
      display: none;
    }

    .description-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .description-row h4 {
      margin: 0;
    }

    .description-row span {
      margin: 0;
    }

    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    button.epictl-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-button-secondaryBackground, var(--vscode-input-background));
      border: 1px solid color-mix(in srgb, var(--epictl-red-dark) 40%, transparent);
      border-radius: var(--epictl-radius);
      cursor: pointer;
      text-align: left;
      transition: border-color var(--epictl-transition), background-color var(--epictl-transition),
        transform 0.1s ease, box-shadow var(--epictl-transition);
    }

    button.epictl-btn:hover {
      border-color: var(--epictl-red);
      background-color: var(--vscode-list-hoverBackground);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    button.epictl-btn:active {
      transform: scale(0.98);
      box-shadow: none;
    }

    button.epictl-btn:focus-visible {
      outline: 2px solid var(--vscode-focusBorder, var(--epictl-red));
      outline-offset: 1px;
    }

    button.epictl-btn .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--epictl-red);
      flex-shrink: 0;
    }

    button.epictl-btn.danger:hover {
      border-color: var(--epictl-red-dark);
      background-color: color-mix(in srgb, var(--epictl-red-dark) 12%, var(--vscode-editor-background));
    }

    button.epictl-btn.danger .dot {
      background: var(--epictl-red-dark);
    }

    button.epictl-btn.primary {
      background-color: var(--epictl-red);
      border-color: var(--epictl-red);
      color: #ffffff;
    }

    button.epictl-btn.primary:hover {
      background-color: var(--epictl-red-dark);
      border-color: var(--epictl-red-dark);
    }

    button.epictl-btn.disabled {
      background-color: var(--vscode-button-secondaryBackground);
      border-color: var(--vscode-widget-border);
      cursor: not-allowed;
      pointer-events: none;
      opacity: 0.5;
    }

    button.epictl-btn.small,
    button.epictl-btn.disabled.small,
    button.epictl-btn.delete {
      font-size: 10px;
      padding: 6px 8px;
      max-height: 30px;
    }

    button.epictl-btn.hidden {
      display: none;
    }

    .editable {
      cursor: pointer;
      border-radius: 3px;
      transition: background-color var(--epictl-transition);
    }
    .editable:hover {
      background: var(--vscode-editor-hoverHighlightBackground, rgba(255, 255, 255, 0.08));
      outline: 1px dashed var(--vscode-focusBorder, #888);
    }

    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-overlay.visible {
      display: flex;
    }

    .modal-box {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border, var(--vscode-contrastBorder, #444));
      border-radius: 8px;
      width: min(320px, 90%);
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .modal-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--vscode-descriptionForeground);
      margin: 0 0 10px 0;
    }

    .modal-input {
      width: 100%;
      font: inherit;
      font-size: 13px;
      padding: 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, #555);
      border-radius: 4px;
      resize: vertical;
      min-height: 34px;
    }

    .modal-input:focus {
      outline: none;
      border-color: var(--epictl-red);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 14px;
    }

    .modal-btn {
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 5px;
      cursor: pointer;
      border: 1px solid var(--vscode-widget-border, transparent);
      background: var(--vscode-button-secondaryBackground, var(--vscode-input-background));
      color: var(--vscode-editor-foreground);
      transition: border-color var(--epictl-transition);
    }

    .modal-btn:hover {
      border-color: var(--epictl-red);
    }

    .modal-btn.primary {
      background: var(--epictl-red);
      border-color: var(--epictl-red);
      color: #ffffff;
    }

    .modal-btn.primary:hover {
      background: var(--epictl-red-dark);
      border-color: var(--epictl-red-dark);
    }
    </style>
    </head>
    <body>
      <div id="btn-section" class="section-buttons">
        <button id="init-manifest-button" class="epictl-btn disabled" data-command="initManifest" disabled>
          <span class="dot"></span> Init Manifest
        </button>
        <button id="clone-manifest-button" class="epictl-btn disabled" data-command="cloneManifest" disabled>
          <span class="dot"></span> Clone Manifest
        </button>
        <button id="apply-bpm-button" class="epictl-btn disabled" data-command="applyBpm" disabled>
          <span class="dot"></span> Apply BPM
        </button>
        <button id="delete-bpm-button" class="epictl-btn hidden" data-command="deleteBpm" disabled>
          <span class="dot"></span> Delete BPM
        </button>
        <button id="refresh-bpm-button" class="epictl-btn hidden" data-command="refreshBpm" disabled>
          <span class="dot"></span> Refresh BPM
        </button>
      </div>

      <div id="temp-section" class="section">No BPM selected</div>

      <div id="header-section" class="section-hidden"></div>

      <div id="edit-modal-overlay" class="modal-overlay">
        <div class="modal-box">
          <p class="modal-title" id="edit-modal-label">Edit Field</p>
          <textarea id="edit-modal-input" class="modal-input" rows="1"></textarea>
          <div class="modal-actions">
            <button id="edit-modal-cancel" class="modal-btn">Cancel</button>
            <button id="edit-modal-save" class="modal-btn primary">Save</button>
          </div>
        </div>
      </div>

      <div id="body-section" class="section-hidden"></div>

      <div id="code-section" class="section-hidden"></div>

      <script>
        const vscode = acquireVsCodeApi();
        const dataKeys = ['DirectiveID', 'Source', 'BpMethodCode', 'DirectiveType', 'Name', 'Order', 'IsEnabled', 'ReenterMax', 'PreventDeadloops', 'VisibilityScope', 'Company', 'DirectiveGroup', 'IsUpToDate', 'CGCCode', 'SysRevID', 'SysRowID', 'Description', 'IsProtected', 'DisplayOrder', 'CompilerDiagnostics', 'BitFlag', 'RowMod'];
        
         const headerSection = document.getElementById('header-section');
         const bodySection = document.getElementById('body-section');
         const codeSection = document.getElementById('code-section');
         const tempSection = document.getElementById('temp-section');

         const initManifestButton = document.getElementById('init-manifest-button');
         const cloneManifestButton = document.getElementById('clone-manifest-button');
         const applyBpmButton = document.getElementById('apply-bpm-button');
         const deleteBpmButton = document.getElementById('delete-bpm-button');
         const refreshBpmButton = document.getElementById('refresh-bpm-button');
         initManifestButton.disabled = true;
         cloneManifestButton.disabled = true;
         applyBpmButton.disabled = true;
         refreshBpmButton.disabled = true;


         let currentDirectiveData = null;
         
         window.addEventListener('message', (event) => {
          const message = event.data;
          tempSection.classList.remove("section");
          tempSection.classList.add("section-hidden");

          console.log("message: ", message);
          
          switch (message.command) {
            case "displayDirectiveBpm": 
              displayHeaderSection(message.data);
              displayBodySection(message.data);
              headerSection.classList.remove("section-hidden");
              headerSection.classList.add("section");
              bodySection.classList.remove("section-hidden");
              bodySection.classList.add("section");
              currentDirectiveData = message.data;
              break;
            case "displayCode": 
              displayCode(message.data);
              codeSection.classList.remove("section-hidden");
              codeSection.classList.add("section");
              break;
            case "enableInitManifestButton":
              setInitManifestButton(message.data);
              break;
            case "enableCloneManifestButton":
              setCloneManifestButton(message.data);
              break;
            case "enableApplyBpmButton":
              enableApplyBpmButton(message.data);
              break;
            case "enableDeleteBpmButton":
              enableDeleteBpmButton(message.data);
              break;
            case "clearBpmWebview":
              clearBpmWebview();
              break;
            case "disableApplyBpmButton":
              disableApplyBpmButton();
              break;
            case "disableCloneManifestButton": 
              disableCloneManifestButton();
              break;
            case "enableRefreshBpmButton":
              enableRefreshBpmButton();
              break;
            case "revertEnableButton":
              revertEnabledToggle(message.data.previousValue);
              break;
            default:
              tempSection.classList.remove("section-hidden");
              tempSection.classList.add("section");
              break;
          }
        });

        /*
         * Helper Functions
        */
        
        const setButtonLabel = (button, label) => {
          const dot = document.createElement('span');
          dot.className = 'dot';
          button.replaceChildren(dot, document.createTextNode(label));
         };

        const revertEnabledToggle = (previousValue) => {
          const element = document.getElementById('enabled-toggle');
          element.textContent = "Enabled: " + (previousValue ? "✅" : "❌");
          currentDirectiveData.IsEnabled = previousValue;
        };


        /*
         * Disable Buttons
         */

        const disableCloneManifestButton = () => {
          cloneManifestButton.disabled = true;
          cloneManifestButton.classList.add("disabled");
          setButtonLabel(cloneManifestButton, "Clone Manifest");
        }

        const disableApplyBpmButton = () => {
          applyBpmButton.disabled = true;
          applyBpmButton.classList.add("disabled");
          setButtonLabel(applyBpmButton, "Apply BPM");
        }

        const clearBpmWebview = () => {
          tempSection.classList.remove("section-hidden");
          tempSection.classList.add("section");

          headerSection.classList.remove("section");
          headerSection.classList.add("section-hidden");

          bodySection.classList.remove("section");
          bodySection.classList.add("section-hidden");

          codeSection.classList.remove("section");
          codeSection.classList.add("section-hidden");

          initManifestButton.classList.add("disabled");
          cloneManifestButton.classList.add("disabled");
          applyBpmButton.classList.add("disabled");
          deleteBpmButton.classList.remove("delete", "danger");
          deleteBpmButton.classList.add("hidden");

          initManifestButton.disabled = true;
          cloneManifestButton.disabled = true;
          applyBpmButton.disabled = true;
          deleteBpmButton.disabled = true;
        }

        /*
         * Enable Buttons
         */

        const enableRefreshBpmButton = () => {
          console.log("can now enable refresh bpm button");
          refreshBpmButton.disabled = false;
          refreshBpmButton.classList.remove("hidden");
          refreshBpmButton.classList.add("small");
          setButtonLabel(refreshBpmButton, "Refresh BPM");
        }

        const enableDeleteBpmButton = (data) => {
          deleteBpmButton.disabled = false;
          deleteBpmButton.classList.remove("hidden");
          deleteBpmButton.classList.remove("disabled");
          deleteBpmButton.classList.add("delete", "danger");      
          setButtonLabel(deleteBpmButton, "Delete BPM for " + data.Name);
          deleteBpmButton.setAttribute("data-directiveId", data.DirectiveID);
          deleteBpmButton.setAttribute("data-sysRowId", data.SysRowID);
           deleteBpmButton.setAttribute("data-name", data.Name);
        }

        const setInitManifestButton = (data) => {
          initManifestButton.disabled = false;
          initManifestButton.classList.remove("disabled");
          initManifestButton.classList.add("epictl-btn");
          setButtonLabel(
            initManifestButton,
            "Init Manifest for " + (data.Type === "bom" ? data.Name : data.BusinessObject),
          );
          initManifestButton.setAttribute("data-type", data.Type);
          initManifestButton.setAttribute("data-parentType", data.ParentType);
          initManifestButton.setAttribute("data-SysRowID", data.SysRowID);
          initManifestButton.setAttribute("data-Name", data.Name);
        }

        const setCloneManifestButton = (data) => {
          cloneManifestButton.disabled = false;
          cloneManifestButton.classList.remove("disabled");
          cloneManifestButton.classList.add("epictl-btn");
          setButtonLabel(cloneManifestButton, "Clone Manifest for " + data.Name);
          cloneManifestButton.setAttribute("data-type", data.Type);
          cloneManifestButton.setAttribute("data-directiveID", data.DirectiveID);
          cloneManifestButton.setAttribute("data-parentId", data.ParentSysRowId);
          cloneManifestButton.setAttribute("data-parentType", data.ParentType);
        }

        const makeClickable = (element, fieldKey) => {
          element.classList.add("editable");
          element.setAttribute("data-field", fieldKey);
          if (fieldKey === "IsEnabled") {
            if (element.style.pointerEvents === "none") return;
            element.addEventListener("click", () => {
              const currentlyEnabled = currentDirectiveData?.IsEnabled;
              const newEnabled = !currentlyEnabled;
              element.textContent = "Enabled: " + (newEnabled ? "✅" : "❌");
              vscode.postMessage({
                command: "fieldClicked",
                field: fieldKey,
                value: String(newEnabled),
                name: currentDirectiveData.Name,
                directiveId: currentDirectiveData.DirectiveID,
                sysRowId: currentDirectiveData.SysRowID,
                previousValue: currentlyEnabled,
              });
              currentDirectiveData.IsEnabled = newEnabled;
            });
          } else {
            element.addEventListener("click", () => {
              openEditModal(fieldKey);
            });
          }
        };

        const displayHeaderSection = (data) => {
          headerSection.replaceChildren();

          const title = document.createElement("h1");
          title.textContent = data.Name;
          makeClickable(title, "Name");

          const subtitle = document.createElement("p");
          subtitle.textContent = data.DirectiveID;

          const bpMethodCode = document.createElement("p");
          bpMethodCode.textContent = data.BpMethodCode;

          const accentBar = document.createElement("div");
          accentBar.className = "accent-bar";

          headerSection.append(title, subtitle, bpMethodCode, accentBar);
        };

        const displayBodySection = (data) => {
          bodySection.replaceChildren();

          const enabled = document.createElement("h4");
          enabled.id = "enabled-toggle";
          enabled.textContent = "Enabled: " + (data.IsEnabled ? "✅" : "❌");
          makeClickable(enabled, "IsEnabled");

          const group = document.createElement("h4");
          group.textContent = "Group: " + data.DirectiveGroup;
          makeClickable(group, "DirectiveGroup");

          const descriptionRow = document.createElement("div");
          descriptionRow.className = "description-row";

          const descriptionLabel = document.createElement("h4");
          descriptionLabel.textContent = "Description:";
          const description = document.createElement("span");
          description.textContent = data.Description ?? "None";
          descriptionRow.append(descriptionLabel, description);

          makeClickable(descriptionRow, "Description");

          bodySection.append(enabled, group, descriptionRow);
        };

        const displayCode = (data) => {
          codeSection.replaceChildren();
          const codeHeader = document.createElement("h4");
          codeHeader.textContent = "Code (15 lines):";

          const openCodeFileButton = document.createElement("button");
          openCodeFileButton.className = "epictl-btn small";
          openCodeFileButton.classList.add("epictl-btn");
          setButtonLabel(openCodeFileButton, "Open Code File");
          openCodeFileButton.addEventListener("click", () => {
            vscode.postMessage({
              command: "openCodeFile",
              data: {
                name: currentDirectiveData.Name,
                directiveId: currentDirectiveData.DirectiveID,
                sysRowId: currentDirectiveData.SysRowID ?? "",
              },
            });
          });
          
          const codePre = document.createElement("pre");
          codePre.textContent = data
          codeSection.append(codeHeader, openCodeFileButton, codePre);
        }

        /* 
         * Edit Window
        */

        const editModalOverlay = document.getElementById('edit-modal-overlay');
        const editModalLabel = document.getElementById('edit-modal-label');
        const editModalInput = document.getElementById('edit-modal-input');
        const editModalCancel = document.getElementById('edit-modal-cancel');
        const editModalSave = document.getElementById('edit-modal-save');

        let activeFieldKey = null;

        const openEditModal = (fieldKey) => {
          activeFieldKey = fieldKey;
          editModalLabel.textContent = "Edit " + fieldKey;
          editModalInput.value = currentDirectiveData ? (currentDirectiveData[fieldKey] ?? "") : "";
          editModalOverlay.classList.add("visible");
          editModalInput.focus();
          editModalInput.select();
        };

        const closeEditModal = () => {
          editModalOverlay.classList.remove("visible");
          activeFieldKey = null;
        };

        editModalCancel.addEventListener("click", closeEditModal);

        editModalOverlay.addEventListener("click", (e) => {
          if (e.target === editModalOverlay) closeEditModal();
        });

        editModalSave.addEventListener("click", () => {
          if (!activeFieldKey) return;
          const newValue = editModalInput.value;

          vscode.postMessage({
            command: "fieldClicked",
            field: activeFieldKey,
            value: newValue,
            name: currentDirectiveData.Name,
            directiveId: currentDirectiveData ? currentDirectiveData.DirectiveID : undefined,
            sysRowId: currentDirectiveData ? currentDirectiveData.SysRowID : undefined
          });

          closeEditModal();
        });

        editModalInput.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            closeEditModal();
          } else if (e.key === "Enter" && !e.shiftKey && editModalInput.rows === 1) {
            e.preventDefault();
            editModalSave.click();
          }
        });

        const enableApplyBpmButton = (data) => {
          applyBpmButton.disabled = false;
          applyBpmButton.classList.remove("disabled");
          applyBpmButton.classList.add("epictl-btn");
          setButtonLabel(applyBpmButton, "Apply BPM for " + data.name);
          applyBpmButton.setAttribute("data-directiveId", data.directiveId);
          applyBpmButton.setAttribute("data-sysRowId", data.sysRowId);
          applyBpmButton.setAttribute("data-name", data.name);
        }

        /*
         * Button Click Events
         */

        document.querySelectorAll('.epictl-btn').forEach(btn => {
          if (btn.id === 'init-manifest-button') {
            btn.addEventListener('click', () => { 
              const command = btn.getAttribute('data-command');
              const type = btn.getAttribute('data-type');
              const parentId = btn.getAttribute('data-SysRowID');
              const data = {
                type: type, 
                SysRowID: parentId,
              }
              vscode.postMessage({ command, data });
            });
          }
          else if (btn.id === 'clone-manifest-button') {
            btn.addEventListener('click', () => {
              const command = btn.getAttribute('data-command');
              const parentType = btn.getAttribute('data-parentType');
              const directiveId = btn.getAttribute('data-directiveID');
              const parentId = btn.getAttribute('data-parentId');
              const data = {
                parentType: parentType, 
                directiveId: directiveId,
                parentId: parentId,
              }
              vscode.postMessage({ command, data });
            });
          } else if (btn.id === 'apply-bpm-button') {
            btn.addEventListener('click', () => {
              const command = btn.getAttribute('data-command');
              const name = btn.getAttribute('data-name');
              const data = {
                name: name,
              }
              vscode.postMessage({ command, data });
            });
          } else if (btn.id === 'delete-bpm-button') {
            btn.addEventListener('click', () => {
              const command = btn.getAttribute('data-command');
              const name = btn.getAttribute('data-name');
              const data = {
                name: name,
              }
              vscode.postMessage({ command, data });
            });
          } else {
            btn.addEventListener('click', () => {
              const command = btn.getAttribute('data-command');
              vscode.postMessage({ command });
            });
          }
        });
        vscode.postMessage({ command: 'ready' });
      </script>
    </body>
    </html>
    `;
  }
}
