import * as vscode from "vscode";
import { VsCodeConfigManager } from "../managers/configManager";
import { activeConfig, getExecPath } from "../commandHandlers";
import { NotificationManager } from "../managers/notificationManager";
import { PromptManager } from "../managers/promptManager";

export class ContextWebview implements vscode.WebviewViewProvider {
  private _webviewView: vscode.WebviewView | undefined;
  private _configManager: VsCodeConfigManager;
  private _notificationManager: NotificationManager;
  private _promptManager: PromptManager;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    configManager: VsCodeConfigManager,
    notificationManager: NotificationManager,
    promptManager: PromptManager,
  ) {
    this._configManager = configManager;
    this._notificationManager = notificationManager;
    this._promptManager = promptManager;
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
      console.log("Received message: ", message);
      switch (message.command) {
        case "setConfig":
          await vscode.commands.executeCommand("epictl.setConfig");
          await this.displayConfigInfo();
          break;
        case "deleteConfig":
          await vscode.commands.executeCommand("epictl.deleteConfig");
          await this.displayConfigInfo();
          break;
        case "setExecPath":
          await vscode.commands.executeCommand("epictl.setExecPath");
          await this.displayConfigInfo();
          break;
        case "deleteExecPath":
          await vscode.commands.executeCommand("epictl.deleteExecPath");
          await this.displayConfigInfo();
          break;
        case "setCodeDirPath":
          await vscode.commands.executeCommand("epictl.setCodeDirPath");
          await this.displayConfigInfo();
          break;
        case "deleteCodeDirPath":
          await vscode.commands.executeCommand("epictl.deleteCodeDirPath");
          await this.displayConfigInfo();
          break;
      }
    });

    this.displayConfigInfo();
  }

  private async displayConfigInfo() {
    let message: any;
    let execPath: string | undefined;
    let activeConfigResult: string | undefined;
    let codeDirPath: string | undefined;

    try {
      execPath = this._configManager.readExecPath();
    } catch (error) {
      execPath = "No exec path";
    }
    try {
      execPath = getExecPath(this._configManager);
      const activeConfigResponse = JSON.parse(await activeConfig(execPath));
      activeConfigResult = activeConfigResponse.active_config;
    } catch (error) {
      activeConfigResult = "No active config (possibly bad exec path)";
    }
    try {
      codeDirPath = this._configManager.readManifestCodeDirPath();
      console.log("codeDirPath: ", codeDirPath);
    } catch (error) {
      codeDirPath = "No code directory path";
    }

    message = {
      command: "displayConfigInfo",
      execPath: execPath,
      activeConfig: activeConfigResult,
      codeDirPath: codeDirPath,
    };

    console.log("message: ", message);
    this._webviewView!.webview.postMessage(message);
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
        text-transform: uppercase;
        margin: 0 0 4px 0;
        color: var(--vscode-editor-foreground);
      }

      .subtitle {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin: 0 0 20px 0;
      }

      .accent-bar {
        height: 3px;
        width: 100%;
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

      button.wbc-btn.danger {
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

      #status {
        margin-top: 20px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        min-height: 14px;
      }
    </style>
    </head>
    <body>
      <h1 id="title">Config</h1>
      <div class="accent-bar"></div>

      <div id="config-info" class="section"></div>


      <div class="section">
      <p class="section-label">Epictl Path</p>
      <div class="btn-group">
        <button class="wbc-btn" data-command="setExecPath">
          <span class="dot"></span> Set exec path
        </button>
        <button class="wbc-btn danger" data-command="deleteExecPath">
          <span class="dot"></span> Delete exec path
        </button>
      </div>
      </div>

      <div class="section">
        <p class="section-label">Epicor Config</p>
        <div class="btn-group">
          <button class="wbc-btn" data-command="setConfig">
            <span class="dot"></span> Set config
          </button>
          <button class="wbc-btn danger" data-command="deleteConfig">
            <span class="dot"></span> Delete config
          </button>
        </div>
      </div>

      <div class="section">
        <p class="section-label">Extension Config</p>
        <div class="btn-group">
          <button class="wbc-btn" data-command="setCodeDirPath">
            <span class="dot"></span> Set code directory path
          </button>
          <button class="wbc-btn danger" data-command="deleteCodeDirPath">
            <span class="dot"></span> Delete code directory path
          </button>
        </div>
      </div>
     
      </div>

     

      <script>
        const vscode = acquireVsCodeApi();
        const statusEl = document.getElementById('status');

        window.addEventListener('message', (event) => {
          const message = event.data;
          console.log("message in javascript: ", message);
          switch (message.command) {
            case "displayConfigInfo":
              displayConfigInfo(message);
              break;
          }
        });


        const displayConfigInfo = (message) => {
          const configSection = document.getElementById('config-info');
          configSection.replaceChildren();

          const execPath = document.createElement('h4');
          execPath.textContent = "Exec path: " + (message.execPath || "No exec path");

          const activeConfig = document.createElement('h4');
          activeConfig.textContent = "Active config: " + (message.activeConfig || "No active config");

          const codeDirPath = document.createElement('h4');
          codeDirPath.textContent = "Code directory path: " + (message.codeDirPath || "No code directory path");

          configSection.append(execPath, activeConfig, codeDirPath); 
        }

        document.querySelectorAll('.wbc-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            console.log("Button clicked: ", btn.getAttribute('data-command'));
            const command = btn.getAttribute('data-command');
            vscode.postMessage({ command });
          });
        });
      </script>
    </body>
    </html>
    `;
  }
}
