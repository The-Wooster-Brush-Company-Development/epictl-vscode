import * as vscode from "vscode";
import { VsCodeConfigManager } from "../managers/configManager";
import {
  activeConfig,
  deleteConfig,
  deleteExecPath,
  setConfig,
  setExecPath,
} from "../commandHandlers";

export class ContextWebview implements vscode.WebviewViewProvider {
  private _webviewView: vscode.WebviewView | undefined;
  private _configManager: VsCodeConfigManager;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    configManager: VsCodeConfigManager,
  ) {
    this._configManager = configManager;
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
          await setConfig(undefined, this._configManager);
          await this.displayConfigInfo();
          break;
        case "deleteConfig":
          await deleteConfig(this._configManager);
          await this.displayConfigInfo();
          break;
        case "setExecPath":
          await setExecPath(this._configManager);
          await this.displayConfigInfo();
          break;
        case "deleteExecPath":
          await deleteExecPath(this._configManager);
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

    try {
      execPath = this._configManager.readExecPath();
    } catch (error) {
      execPath = "No exec path";
    }
    try {
      const activeConfigResponse = JSON.parse(
        await activeConfig(this._configManager),
      );
      activeConfigResult = activeConfigResponse.active_config;
    } catch (error) {
      activeConfigResult = "No active config (possibly bad exec path)";
    }

    message = {
      command: "displayConfigInfo",
      execPath: execPath,
      activeConfig: activeConfigResult,
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
          --wbc-black: #121212;
          --wbc-black-soft: #1c1c1c;
          --wbc-white: #f5f5f5;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 16px;
          font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
          background-color: var(--vscode-editor-background, var(--wbc-black));
          color: var(--wbc-white);
        }

        h1 {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin: 0 0 4px 0;
          color: var(--wbc-white);
        }

        .subtitle {
          font-size: 11px;
          color: #9a9a9a;
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
          color: #808080;
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
          color: var(--wbc-white);
          background-color: var(--wbc-black-soft);
          border: 1px solid #2c2c2c;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease;
        }

        button.wbc-btn:hover {
          border-color: var(--wbc-red);
          background-color: #232323;
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
          border-color: #3a1414;
        }

        button.wbc-btn.danger:hover {
          border-color: var(--wbc-red-dark);
          background-color: #241414;
        }

        button.wbc-btn.danger .dot {
          background: var(--wbc-red-dark);
        }

        button.wbc-btn.primary {
          background-color: var(--wbc-red);
          border-color: var(--wbc-red);
          color: var(--wbc-white);
        }

        button.wbc-btn.primary:hover {
          background-color: var(--wbc-red-dark);
          border-color: var(--wbc-red-dark);
        }

        button.wbc-btn.primary .dot {
          background: var(--wbc-white);
        }

        #status {
          margin-top: 20px;
          font-size: 11px;
          color: #808080;
          min-height: 14px;
        }
      </style>
    </head>
    <body>
      <h1 id="title">Config</h1>
      <div class="accent-bar"></div>

      <div id="config-info" class="section"></div>

      <div class="section">
      <p class="section-label">Configuration</p>
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
      <p class="section-label">Executable</p>
      <div class="btn-group">
        <button class="wbc-btn" data-command="setExecPath">
          <span class="dot"></span> Set exec path
        </button>
        <button class="wbc-btn danger" data-command="deleteExecPath">
          <span class="dot"></span> Delete exec path
        </button>
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
          execPath.textContent = "Exec path: " + message.execPath;

          const activeConfig = document.createElement('h4');
          activeConfig.textContent = "Active config: " + message.activeConfig;

          configSection.append(execPath, activeConfig); 
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

// <div class="section">
// <p class="section-label">Configuration</p>
// <div class="btn-group">
//   <button class="wbc-btn" data-command="changeContext">
//     <span class="dot"></span> Change context
//   </button>
//   <button class="wbc-btn" data-command="activeConfig">
//     <span class="dot"></span> Active config
//   </button>
//   <button class="wbc-btn danger" data-command="deleteConfig">
//     <span class="dot"></span> Delete config
//   </button>
// </div>
// </div>

// <div class="section">
// <p class="section-label">Executable</p>
// <div class="btn-group">
//   <button class="wbc-btn" data-command="getExecPath">
//     <span class="dot"></span> Get exec path
//   </button>
//   <button class="wbc-btn danger" data-command="deleteExecPath">
//     <span class="dot"></span> Delete exec path
//   </button>
// </div>
// </div>

// <p id="status"></p>
