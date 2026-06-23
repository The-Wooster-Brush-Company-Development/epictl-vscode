import * as vscode from "vscode";
import { exec } from "child_process";

const CONFIG_SECTION = "epictl";
const CONFIG_KEY_EXEC_PATH = "command_path";

export const commands = [
  {
    name: "epictl: helloWorld",
    callback: () => {
      vscode.window.showInformationMessage("Hello World from Epictl-VSCode!");
    },
  },
  {
    name: "epictl: testCommand",
    callback: () => {
      vscode.window.showInformationMessage("Test from Epictl-VSCode!");
    },
  },
  {
    name: "epictl: setExecPath",
    callback: async () => {
      const userInput = await vscode.window.showInputBox({
        prompt: "Enter the path to the epictl executable",
        ignoreFocusOut: true,
      });
      if (userInput) {
        vscode.workspace
          .getConfiguration(CONFIG_SECTION)
          .update(
            CONFIG_KEY_EXEC_PATH,
            userInput,
            vscode.ConfigurationTarget.Global,
          );
        vscode.window.showInformationMessage(
          `Epictl executable path set to: ${userInput}`,
        );
      }
      else {
        vscode.window.showErrorMessage("No path provided");
      }
    },
  },
  {
    name: "epictl: getExecPath", 
    callback: () => {
        const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get(CONFIG_KEY_EXEC_PATH);
        if (execPath) {
            vscode.window.showInformationMessage(`Epictl executable path: ${execPath}`);
        }
        else {
            vscode.window.showErrorMessage("No path set for Epictl executable");
        }
    },
  }
];
