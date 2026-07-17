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
} from "./webviewHandlers/bpmWebviewHandlers";

export class BpmWebview implements vscode.WebviewViewProvider {
  private _webviewView: vscode.WebviewView | undefined;
  private manifestManager: ManifestManager;
  private vsCodeConfigManager: VsCodeConfigManager;
  private notificationManager: NotificationManager;
  private promptManager: PromptManager;
  private stateManager: StateManager;

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
      console.log("message: ", message);
      switch (message.command) {
        case "initManifest":
          try {
            const result = await initManifestHandler(
              this.vsCodeConfigManager,
              this.promptManager,
              this.manifestManager,
              message.data,
            );

            if (result.success) {
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
            } else {
              this.notificationManager.error(result.result.message);
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
        case "cloneManifest":
          try {
            const result = await cloneManifestHandler(
              this.vsCodeConfigManager,
              this.promptManager,
              this.manifestManager,
              message.data,
            );

            if (result.success) {
              const codeFilePath = this.vsCodeConfigManager.createCodeFilePath(
                result.result,
              );
              this.manifestManager.writeManifestCodeFilePath(
                path.basename(result.result),
                codeFilePath,
              );
              this.vsCodeConfigManager.writeToCodeFile(
                codeFilePath,
                result.codeLines,
              );

              this.notificationManager.success(
                "Manifest cloned successfully at " +
                  path.basename(result.result) +
                  "\nCode file created at " +
                  codeFilePath,
              );
            } else {
              this.notificationManager.error(result.result.message);
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
        case "fieldClicked":
          updateFieldHandler(message);
      }
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
    this._webviewView!.webview.postMessage({
      command: "displayDirectiveBpm",
      data: data,
    });
    this._webviewView!.webview.postMessage({
      command: "displayCode",
      data: codeLines,
    });
    console.log("data: ", data);
    this.enableCloneManifestButton(data);
  }

  private async getCodeToDisplay(data: any): Promise<string> {
    let codeLines: string = "";
    try {
      codeLines = JSON.parse(
        await describeBpm(
          this.vsCodeConfigManager.readExecPath() ?? "",
          "",
          data.DirectiveID,
          data.ParentType,
          data.ParentSysRowId,
          "json",
        ),
      ).code;
    } catch (error: any) {
      this.notificationManager.error(
        "Error fetching code lines: " + error.message,
      );
    }
    try {
      // if (codeLines === "") {
      //   return "No code found";
      // }

      if (codeLines === "") {
        if (!data.Name.endsWith(".json")) {
          data.Name += ".json";
        }

        const manifest = this.manifestManager.readManifest(data.Name);
        const codeFilePaths =
          manifest.extension?.code_file ?? manifest.epictl?.code_file ?? [];

        let code = "";

        for (const filePath of codeFilePaths) {
          code += `${path.basename(filePath)}:\n`;
          const csCode = fs.readFileSync(filePath, "utf8");
          const lines = csCode.split("\n");
          code += lines.slice(0, 15).join("\n");
          code += "\n\n";
          code += "                       .\n";
          code += "                       .\n";
          code += "                       .\n";
          code += `${lines.length - 15} more lines\n`;
        }

        return code;
      } else {
        let code = codeLines.split("\n").slice(0, 15).join("\n");
        if (15 <= codeLines.split("\n").length) {
          code += "\n\n";
          code += "                       .\n";
          code += "                       .\n";
          code += "                       .\n";
          code += `${codeLines.split("\n").length - 15} more lines\n`;
        }
        return code;
      }
    } catch {
      return "Error getting code";
    }
  }

  private enableInitManifestButton() {
    let data: any;
    try {
      data = this.stateManager.readState();
    } catch (error: any) {
      console.error("Error reading state: ", error);
      return;
    }
    this._webviewView!.webview.postMessage({
      command: "enableInitManifestButton",
      data: data,
    });
  }

  private enableCloneManifestButton(message: any) {
    this._webviewView!.webview.postMessage({
      command: "enableCloneManifestButton",
      data: message,
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WBC</title>
     <style>
      :root {
        --wbc-red: #e53935;
        --wbc-red-dark: #b71c1c;
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
        background: var(--wbc-red);
        border-radius: 2px;
        margin-bottom: 20px;
      }

      .section-buttons {
        margin-bottom: 10px;
      }

      .section {
        margin-bottom: 18px;
      }

      #init-clone-manifest-section {
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

      button.wbc-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        font-size: 12px;
        font-weight: 500;
        color: var(--vscode-editor-foreground);
        background-color: var(--vscode-button-secondaryBackground, var(--vscode-input-background));
        border: 1px solid var(--vscode-widget-border, var(--vscode-contrastBorder, transparent));
        border-radius: 6px;
        cursor: pointer;
        text-align: left;
        transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease;
      }

      button.wbc-btn:hover {
        border-color: var(--wbc-red);
        background-color: var(--vscode-list-hoverBackground);
      }

      button.wbc-btn:active {
        transform: scale(0.98);
      }

      button.wbc-btn .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--wbc-red);
        flex-shrink: 0;
      }

      button.wbc-btn {
        border-color: color-mix(in srgb, var(--wbc-red-dark) 40%, transparent);
      }

      button.wbc-btn.danger:hover {
        border-color: var(--wbc-red-dark);
        background-color: color-mix(in srgb, var(--wbc-red-dark) 12%, var(--vscode-editor-background));
      }

      button.wbc-btn.danger .dot {
        background: var(--wbc-red-dark);
      }

      button.wbc-btn.primary {
        background-color: var(--wbc-red);
        border-color: var(--wbc-red);
        color: #ffffff;
      }

      button.wbc-btn.primary:hover {
        background-color: var(--wbc-red-dark);
        border-color: var(--wbc-red-dark);
      }

      button.wbc-btn.primary .dot {
        background: #ffffff;
      }

      button.wbc-btn.disabled {
        background-color: var(--vscode-button-secondaryBackground);
        border-color: var(--vscode-widget-border);
        cursor: not-allowed;
      }

      button.wbc-btn.disabled .dot {
        background: var(--vscode-button-secondaryBackground);
      }

      .editable { cursor: pointer; }
      .editable:hover { background: var(--vscode-editor-hoverHighlightBackground, rgba(255,255,255,0.08)); outline: 1px dashed var(--vscode-focusBorder, #888); }

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
        border-color: var(--wbc-red);
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
      }

      .modal-btn:hover {
        border-color: var(--wbc-red);
      }

      .modal-btn.primary {
        background: var(--wbc-red);
        border-color: var(--wbc-red);
        color: #ffffff;
      }

      .modal-btn.primary:hover {
        background: var(--wbc-red-dark);
        border-color: var(--wbc-red-dark);
      }
      #status {
        margin-top: 20px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        min-height: 14px;
      }
    </style>
    </head>
    <body>
      <div id="init-clone-manifest-section" class="section-buttons">
        <button id="init-manifest-button" class="wbc-btn disabled" data-command="initManifest" disabled>
          <span class="dot"></span> Init Manifest
        </button>
        <button id="clone-manifest-button" class="wbc-btn disabled" data-command="cloneManifest" disabled>
          <span class="dot"></span> Clone Manifest
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
         initManifestButton.disabled = true;
         cloneManifestButton.disabled = true;

         let currentDirectiveData = null;
         console.log("currentDirectiveData: ", currentDirectiveData);


        window.addEventListener('message', (event) => {
          const message = event.data;
          tempSection.classList.remove("section");
          tempSection.classList.add("section-hidden");

          //console.log("message: ", message);
          
          switch (message.command) {
            case "displayDirectiveBpm": 
              displayHeaderSection(message.data);
              displayBodySection(message.data);
              headerSection.classList.remove("section-hidden");
              headerSection.classList.add("section");
              bodySection.classList.remove("section-hidden");
              bodySection.classList.add("section");
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
            default:
              tempSection.classList.remove("section-hidden");
              tempSection.classList.add("section");
              break;
          }
        });

        const setInitManifestButton = (data) => {
          console.log("Init data: ", data);
          initManifestButton.disabled = false;
          initManifestButton.classList.remove("disabled");
          initManifestButton.classList.add("wbc-btn");
          initManifestButton.textContent = ""
          initManifestButton.textContent = "Init Manifest for " + data.Name;
          initManifestButton.setAttribute("data-type", data.Type);
          initManifestButton.setAttribute("data-parentType", data.ParentType);
          initManifestButton.setAttribute("data-SysRowID", data.SysRowID);
          initManifestButton.setAttribute("data-Name", data.Name);
          console.log("Init manifest button: ", initManifestButton);
        }

        const setCloneManifestButton = (data) => {
          cloneManifestButton.disabled = false;
          cloneManifestButton.classList.remove("disabled");
          cloneManifestButton.classList.add("wbc-btn");
          cloneManifestButton.textContent = ""
          cloneManifestButton.textContent = "Clone Manifest for " + data.Name;
          cloneManifestButton.setAttribute("data-type", data.Type);
          cloneManifestButton.setAttribute("data-directiveID", data.DirectiveID);
          cloneManifestButton.setAttribute("data-parentId", data.ParentSysRowId);
          cloneManifestButton.setAttribute("data-parentType", data.ParentType);
        }

        const makeClickable = (element, fieldKey) => {
          element.classList.add("editable");
          element.setAttribute("data-field", fieldKey);
          element.addEventListener("click", () => {
            openEditModal(fieldKey);
          });
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
          
          const codePre = document.createElement("pre");
          codePre.textContent = data
          codeSection.append(codeHeader, codePre);
        }

        /* Edit Window */

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
          if (e.target === editModalOverlay) closeEditModal(); // click outside box = cancel
        });

        editModalSave.addEventListener("click", () => {
          if (!activeFieldKey) return;
          const newValue = editModalInput.value;

          vscode.postMessage({
            command: "fieldClicked",
            field: activeFieldKey,
            value: newValue,
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

        document.querySelectorAll('.wbc-btn').forEach(btn => {
          if (btn.id === 'init-manifest-button') {
            btn.addEventListener('click', () => { 
              const command = btn.getAttribute('data-command');
              const type = btn.getAttribute('data-type');
              const parentId = btn.getAttribute('data-SysRowID');
              data = {
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
              data = {
                parentType: parentType, 
                directiveId: directiveId,
                parentId: parentId,
              }
              console.log("data: ", data);
              vscode.postMessage({ command, data });
            });
          } else {
            btn.addEventListener('click', () => {
              const command = btn.getAttribute('data-command');
              vscode.postMessage({ command });
            });
          }
        });
      </script>
    </body>
    </html>
    `;
  }
}
