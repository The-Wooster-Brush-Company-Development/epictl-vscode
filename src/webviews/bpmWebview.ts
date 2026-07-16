import * as vscode from "vscode";
import { ManifestManager } from "../managers/manifestManager";
import * as fs from "fs";
import * as path from "path";
import { initManifest } from "../commandHandlers";
import { VsCodeConfigManager } from "../managers/configManager";
import { NotificationManager } from "../managers/notificationManager";
import { formatMessage, initCodeFile } from "../utils/registryUtils";
import { StateManager } from "../managers/stateManager";
import { PromptManager } from "../managers/promptManager";
import { json } from "stream/consumers";

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
            if (!this.vsCodeConfigManager.readManifestCodeDirPath()) {
              this.notificationManager.error("No code directory path set");
              return;
            }
            const state = this.stateManager.readState();

            const execPath = this.vsCodeConfigManager.readExecPath();
            if (!execPath) {
              this.notificationManager.error("No exec path set");
              return;
            }

            const promptResult =
              await this.promptManager.resolveInitManifest(state);

            const codeFilePath = vscode.Uri.joinPath(
              vscode.Uri.parse(
                this.vsCodeConfigManager.readManifestCodeDirPath()!,
              ),
              promptResult.manifest_name + ".cs",
            );

            const manifestPath = this.manifestManager.createManifestFilePath(
              promptResult.manifest_name,
            );

            const result = JSON.parse(
              await initManifest(
                execPath,
                promptResult.entity_type,
                promptResult.entity_id,
                manifestPath,
              ),
            );

            if (result.success) {
              initCodeFile(
                codeFilePath.fsPath,
                manifestPath,
                this.manifestManager,
              );
              this.notificationManager.success(
                "Manifest initialized successfully at " +
                  path.basename(manifestPath) +
                  "\nCode file created at " +
                  codeFilePath.fsPath,
              );
            } else {
              this.notificationManager.error(result.message);
            }
          } catch (error: any) {
            this.notificationManager.error(error.message);
            return;
          }
          break;
      }
    });
  }

  public postMessageHelper(message: any) {
    switch (message.command) {
      case "describeDirectiveBpm":
        this.displayDirectiveBpm(message);
        break;
      case "canInitManifest":
        console.log("canInitManifest called");
        console.log("message: ", message);
        this.enableInitManifestButton(message);
        break;
    }
  }

  public displayDirectiveBpm(message: any) {
    this._webviewView!.webview.postMessage({
      command: "displayDirectiveBpm",
      data: message.data,
    });
    const codeLines = this.getCodeToDisplay(message.data);
    this._webviewView!.webview.postMessage({
      command: "displayCode",
      data: codeLines,
    });
  }

  private getCodeToDisplay(message: any): string {
    try {
      if (message.code === "") {
        return "No code found";
      }

      if (!message.code) {
        if (!message.Name.endsWith(".json")) {
          message.Name += ".json";
        }

        const manifest = this.manifestManager.readManifest(message.Name);
        const codeFilePaths = manifest.epictl.code_file;

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
        let code = message.code.split("\n").slice(0, 15).join("\n");
        code += "\n\n";
        code += "                       .\n";
        code += "                       .\n";
        code += "                       .\n";
        code += `${message.code.split("\n").length - 15} more lines\n`;
        return code;
      }
    } catch {
      return "Error getting code";
    }
  }

  private enableInitManifestButton(message: any) {
    console.log("enableInitManifestButton called");
    console.log("message: ", message);
    this._webviewView!.webview.postMessage({
      command: "enableInitManifestButton",
      data: message.data,
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

      .section {
        margin-bottom: 18px;
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

      #status {
        margin-top: 20px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        min-height: 14px;
      }
    </style>
    </head>
    <body>
      <div id="init-manifest-section" class="section">
        <button id="init-manifest-button" class="wbc-btn disabled" data-command="initManifest" disabled>
          <span class="dot"></span> Init Manifest
        </button>
      </div>

      <div id="temp-section" class="section">No BPM selected</div>

      <div id="header-section" class="section-hidden"></div>

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
         initManifestButton.disabled = true;

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
              break;
            case "displayCode": 
              displayCode(message.data);
              codeSection.classList.remove("section-hidden");
              codeSection.classList.add("section");
              break;
            case "enableInitManifestButton":
              setInitManifestButton(message.data);
              break;
            default:
              tempSection.classList.remove("section-hidden");
              tempSection.classList.add("section");
              break;
          }
        });

        const setInitManifestButton = (data) => {
          initManifestButton.disabled = false;
          initManifestButton.classList.remove("disabled");
          initManifestButton.classList.add("wbc-btn");
          initManifestButton.textContent = ""
          initManifestButton.textContent = "Init Manifest for " + data.name;
          initManifestButton.setAttribute("data-type", data.type);
          initManifestButton.setAttribute("data-parentId", data.sysRowId);
          initManifestButton.setAttribute("data-manifestName", data.name);
        }

        const displayHeaderSection = (data) => {
          headerSection.replaceChildren();

          const title = document.createElement("h1");
          title.textContent = data.Name;

          const subtitle = document.createElement("p");
          subtitle.textContent = data.DirectiveID;

          const bpMethodCode = document.createElement("p");
          bpMethodCode.textContent = data.BpMethodCode;

          const accentBar = document.createElement("div");
          accentBar.className = "accent-bar";

          headerSection.append(title, subtitle, bpMethodCode, accentBar);
        };

        const displayBodySection = (data) =>{
          bodySection.replaceChildren();

          const enabled = document.createElement("h4");
          enabled.textContent = "Enabled: " + (data.IsEnabled ? "✅" : "❌");
          
          const group = document.createElement("h4");
          group.textContent = "Group: " + data.DirectiveGroup;

          const descriptionRow = document.createElement("div");
          descriptionRow.className = "description-row";

          const descriptionLabel = document.createElement("h4");
          descriptionLabel.textContent = "Description:";
          const description = document.createElement("span");
          description.textContent = data.Description ?? "None";
          descriptionRow.append(descriptionLabel, description);

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

        document.querySelectorAll('.wbc-btn').forEach(btn => {
          if (btn.id === 'init-manifest-button') {
            btn.addEventListener('click', () => { 
              const command = btn.getAttribute('data-command');
              const type = btn.getAttribute('data-type');
              const parentId = btn.getAttribute('data-parentId');
              const manifestName = btn.getAttribute('data-manifestName');
              console.log("manifestName: ", manifestName);
              vscode.postMessage({ command, type, parentId, manifestName });
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
