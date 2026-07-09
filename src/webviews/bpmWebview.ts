import * as vscode from "vscode";

export class BpmWebview implements vscode.WebviewViewProvider {
  private _webviewView: vscode.WebviewView | undefined;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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

    webviewView.webview.onDidReceiveMessage((message) => {
      console.log("onDidReceiveMessage called");
    });
  }

  public postMessageHelper(message: any) {
    console.log("post message helper called");
    console.log("post message helper message: ", message);
    if (message.command === "describeBomBpm") {
      this.displayBomBpm(message);
    }
  }

  private displayBomBpm(message: any) {
    console.log("displayBomBpm called");
    console.log("displayBomBpm message: ", message);
    this._webviewView!.webview.postMessage({
      command: "displayBomBpm",
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
          width: 40px;
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

        .section-hidden {
          display: none;
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
      <h1>WBC</h1>
      <div class="accent-bar"></div>

      <div class="section-hidden">
        <h4 class="section-label">BPM</h4>
        <ul id="directive-fields"></ul>
      </div>

      <div class="section">
       <p class="section-label"></p>

      <script>
        const vscode = acquireVsCodeApi();
        const dataKeys = ['DirectiveID', 'Source', 'BpMethodCode', 'DirectiveType', 'Name', 'Order', 'IsEnabled', 'ReenterMax', 'PreventDeadloops', 'VisibilityScope', 'Company', 'DirectiveGroup', 'IsUpToDate', 'CGCCode', 'SysRevID', 'SysRowID', 'Description', 'IsProtected', 'DisplayOrder', 'CompilerDiagnostics', 'BitFlag', 'RowMod'];
        
        const directiveList = document.getElementById('directive-fields');
        const bpmSectionDiv = document.querySelector('.section-hidden');

        window.addEventListener('message', (event) => {
          const message = event.data;
          switch (message.command) {
            case "displayBomBpm": 
              displayBomBpm(message.data);
              bpmSectionDiv.classList.remove('section-hidden');
              break;
            default:
              break;
          }
        });
       
        function displayBomBpm(data) {
          console.log("data: ", data);
          directiveList.replaceChildren();
          dataKeys.forEach(key => {
            const li = document.createElement('li');
            if (data !== undefined) {
              li.textContent = key + ": " + data[key];
            } else {
              li.textContent = key + ": None";
            }
            directiveList.appendChild(li);
          });
        }


        document.querySelectorAll('.wbc-btn').forEach(btn => {
          btn.addEventListener('click', () => {
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

// <li data-key="DirectiveID">DirectiveID</li>
//             <li data-key="Source">Source</li>
//             <li data-key="BpMethodCode">BpMethodCode</li>
//             <li data-key="DirectiveType">DirectiveType</li>
//             <li data-key="Name">Name</li>
//             <li data-key="Order">Order</li>
//             <li data-key="IsEnabled">IsEnabled</li>
//             <li data-key="ReenterMax">ReenterMax</li>
//             <li data-key="PreventDeadloops">PreventDeadloops</li>
//             <li data-key="VisibilityScope">VisibilityScope</li>
//             <li data-key="Company">Company</li>
//             <li data-key="DirectiveGroup">DirectiveGroup</li>
//             <li data-key="IsUpToDate">IsUpToDate</li>
//             <li data-key="CGCCode">CGCCode</li>
//             <li data-key="Body">Body</li>
//             <li data-key="SysRevID">SysRevID</li>
//             <li data-key="SysRowID">SysRowID</li>
//             <li data-key="Description">Description</li>
//             <li data-key="IsProtected">IsProtected</li>
//             <li data-key="DisplayOrder">DisplayOrder</li>
//             <li data-key="CompilerDiagnostics">CompilerDiagnostics</li>
//             <li data-key="BitFlag">BitFlag</li>
//             <li data-key="RowMod">RowMod</li>
