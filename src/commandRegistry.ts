import * as vscode from "vscode";
import { exec } from "child_process";

const CONFIG_SECTION = "epictl";
const CONFIG_KEY_EXEC_PATH = "command_path";

import {
  setExecPath, 
  getExecPath, 
  deleteExecPath,
  
  initManifest,
  cloneManifest,

  setManifestDirPath,
  getManifestDirPath,
  deleteManifestDirPath,

  getBoms, 
  getTables,
   
  describeBom, 
  describeTable,

  describeBpm,

  applyManifest,
} from "./commandHandlers";


export const commands = [
  {
    name: "epictl: setExecPath",
    callback: async () => {
        setExecPath();
    },
  },

  {
    name: "epictl: getExecPath", 
    callback: () => {
      getExecPath();
    }
  },

  {
    name: "epictl: deleteExecPath", 
    callback: () => {
      deleteExecPath();
    }
  },

  {
    name: "epictl: setManifestDirPath",
    callback: () => {
      setManifestDirPath();
    }
  },

  {
    name: "epictl: getManifestDirPath",
    callback: () => {
      getManifestDirPath();
    }
  },

  {
    name: "epictl: deleteManifestDirPath",
    callback: () => {
      deleteManifestDirPath();
    }
  },

  {
    name: "epictl: init-manifest", 
    callback: async () => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        let result = await initManifest();
        result = JSON.parse(result);
        // console.log(`duplicate: ${result["duplicate"]}`);
        if (result["success"]) {
          vscode.window.showInformationMessage("Manifest initialized successfully");
          outputChannel.append(result["message"]);
          outputChannel.show();
        } else if (result["duplicate"]) {
          outputChannel.append(result["message"]);
          outputChannel.show();
          vscode.window.showErrorMessage("Manifest already initialized");
        } else {
          outputChannel.append(result["message"]);
          outputChannel.show();
          vscode.window.showErrorMessage("Failed to initialize manifest");
        }
      } catch (err) {
        outputChannel.appendLine(`Error initializing manifest: ${err}`);
        outputChannel.show();
      }
    }
  },

  {
    name: "epictl: clone-manifest",
    callback: async () => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        let result = await cloneManifest();
        result = JSON.parse(result);
        console.log("RESULT:", result);
        if (result.success) {
          vscode.window.showInformationMessage("Manifest cloned successfully");
          outputChannel.appendLine(result.message);
          outputChannel.show();
      }
      else {
        vscode.window.showErrorMessage("Failed to clone manifest");
        outputChannel.appendLine(result.message);
        outputChannel.show();
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Error cloning manifest: ${err}`);
        outputChannel.appendLine(`Error cloning manifest: ${err}`);
        outputChannel.show();
      }
    }
  },

  {
    name: "epictl: getBoms",
    callback: async () => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await getBoms();

        if (outputType === "json") {
          vscode.window.showInformationMessage("Boms fetched successfully");
          outputChannel.appendLine(result);
        } else if (outputType === "table") {
          vscode.window.showInformationMessage("Boms fetched successfully");
          outputChannel.appendLine(result);
        } else {
          vscode.window.showErrorMessage("Invalid output type");
          outputChannel.appendLine(result);
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error fetching boms: ${err}`);
        vscode.window.showErrorMessage(`Error fetching boms: ${err}`);
        outputChannel.show();
      }
    }
  }, 

  {
    name: "epictl: getTables", 
    callback: async (): Promise<any> => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await getTables();
        if (outputType === "json") {
          vscode.window.showInformationMessage("Tables fetched successfully");
          outputChannel.appendLine(result);
        } else if (outputType === "table") {
          vscode.window.showInformationMessage("Tables fetched successfully");
          outputChannel.appendLine(result);
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error fetching tables: ${err}`);
        vscode.window.showErrorMessage(`Error fetching tables: ${err}`);
      }
    }
  }, 

  {
    "name": "epictl: describeBom",
    callback: async () => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await describeBom();
        if (outputType === "json") {
            vscode.window.showInformationMessage("Bom described successfully");
            outputChannel.append(result);
        } else if (outputType === "table") {
          vscode.window.showInformationMessage("Bom described successfully");
          outputChannel.append(result);
        } 
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error describing bom: ${err}`);
        vscode.window.showErrorMessage(`Error describing bom: ${err}`);
        outputChannel.show();
      }
    }
  }, 

  {
    "name": "epictl: describeTable", 
    callback: async () => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await describeTable();
        if (outputType === "json") {
          vscode.window.showInformationMessage("Table described successfully");
          outputChannel.appendLine(result);
        } else if (outputType === "table") {
          vscode.window.showInformationMessage("Table described successfully");
          outputChannel.appendLine(result);
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error describing table: ${err}`);
        vscode.window.showErrorMessage(`Error describing table: ${err}`);
        outputChannel.show();
      }
    }
  }, 

  {
    "name": "epictl: describeBpm",
    callback: async () => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await describeBpm();

        if (outputType === "json") {
          vscode.window.showInformationMessage("Bpm described successfully");
          outputChannel.appendLine(result);
        } else if (outputType === "table") {
          vscode.window.showInformationMessage("Bpm described successfully");
          outputChannel.appendLine(result);
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error describing bpm: ${err}`);
        vscode.window.showErrorMessage(`Error describing bpm: ${err}`);
        outputChannel.show();
      }
    }
  }, 

  {
    "name": "epictl: applyManifest",
    callback: async () => {
      const outputChannel = vscode.window.createOutputChannel("Epictl"); 
      try { 
        const result = await applyManifest();
        console.log("RESULT:", result);
        return;
        if (result) {
          vscode.window.showInformationMessage("Manifest applied successfully");
          outputChannel.appendLine(result);
        } else {
          vscode.window.showErrorMessage("Failed to apply manifest");
          outputChannel.appendLine(result);
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error applying manifest: ${err}`);
        vscode.window.showErrorMessage(`Error applying manifest: ${err}`);
        outputChannel.show();
      }
    }
  }, 

];
