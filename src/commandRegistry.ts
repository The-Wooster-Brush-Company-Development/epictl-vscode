import * as vscode from "vscode";
import { exec } from "child_process";

const CONFIG_SECTION = "epictl";
const CONFIG_KEY_EXEC_PATH = "command_path";

import {
  createConfig,
  getConfig,
  setConfig,

  setExecPath, 
  getExecPath, 
  deleteExecPath,
  
  initManifest,
  cloneManifest,

  setManifestDirPath,
  getManifestDirPath,
  deleteLocalManifest,

  getBoms, 
  getTables,
   
  describeBom, 
  describeTable,

  describeBpm,

  applyBpm,
  updateBpm, 
  deleteBpm,

  validateCode,
} from "./commandHandlers";

import { VsCodeConfigManager } from "./managers/configManager";
import { ManifestManager } from "./managers/manifestManager";

import { updateFileName } from "./utils/registryUtils";

export const vsCodeConfigCommands = [
  {
    name: "epictl: setExecPath",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        await setExecPath(vsCodeConfigManager);
        outputChannel.appendLine("Exec path set successfully");
        vscode.window.showInformationMessage("Exec path set successfully");
      } catch (err) {        
        vscode.window.showErrorMessage("Error setting exec path");
        outputChannel.appendLine(`Error setting exec path: ${err}`);
      }
      outputChannel.show();
    }
  },

  {
    name: "epictl: getExecPath", 
    callback: (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const execPath = getExecPath(vsCodeConfigManager);
        outputChannel.appendLine(`Exec path: ${execPath}`);
        vscode.window.showInformationMessage("Exec path found");
      } catch (err: any) {
        vscode.window.showErrorMessage("Error getting exec path");
        outputChannel.appendLine(`Error getting exec path: ${err.message}`);
      }
      outputChannel.show();
    }
  },

  {
    name: "epictl: deleteExecPath", 
    callback: (vsCodeConfigManager: VsCodeConfigManager) => {
      deleteExecPath(vsCodeConfigManager);
    }
  }
]

export const cliConfigCommands = [
  {
    name: "epictl: createConfig",
    callback: async(vsCodeConfigManager: VsCodeConfigManager) => {
      let outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = JSON.parse(await createConfig(vsCodeConfigManager));
        if (result.success) {
          outputChannel.appendLine(result.message);
          if (result.config_id) {
            try {
              const message = await setConfig(result.config_id, vsCodeConfigManager);
              outputChannel.appendLine(message);
            } catch (err) {
              outputChannel.appendLine(`Error setting config: ${err}`);
            }
            vscode.window.showInformationMessage("Config created successfully");
          }
        } else {
          vscode.window.showErrorMessage("Failed to create config");
          outputChannel.appendLine(result.message);
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error creating config: ${err}`);
        vscode.window.showErrorMessage("Failed to create config");
        outputChannel.show();
      }
    },
  },
  {
    name: "epictl: getConfig",
    callback: async (_vsCodeConfigManager: VsCodeConfigManager) => {
      getConfig();
    },
  },
]


export const commands = [

  {
    name: "epictl: getBoms",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await getBoms(vsCodeConfigManager);

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
        outputChannel.appendLine(`${err}`);
        outputChannel.appendLine("")
        vscode.window.showErrorMessage("Error fetching boms");
        outputChannel.show();
      }
    }
  }, 

  {
    name: "epictl: getTables", 
    callback: async (vsCodeConfigManager: VsCodeConfigManager): Promise<any> => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await getTables(vsCodeConfigManager);
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
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await describeBom(vsCodeConfigManager);
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
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await describeTable(vsCodeConfigManager);
        if (outputType === "json") {
          vscode.window.showInformationMessage("Table described successfully");
          outputChannel.appendLine(result);
        } else if (outputType === "table") {
          vscode.window.showInformationMessage("Table described successfully");
          outputChannel.appendLine(result);
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error describing table:f ${err}`);
        vscode.window.showErrorMessage(`Error describing table: ${err}`);
        outputChannel.show();
      }
    }
  }, 
]

export const manifestDependentCommands = [
  {
    name: "epictl: setManifestDirPath",
    callback: (_vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      setManifestDirPath(manifestManager);
    }
  },

  {
    name: "epictl: getManifestDirPath",
    callback: (_vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const manifestDirPath = getManifestDirPath(manifestManager);
        vscode.window.showInformationMessage("Manifest directory path found");
        outputChannel.appendLine(`Manifest directory path: ${manifestDirPath}`);
        outputChannel.show();
      } catch (err: any) {
        vscode.window.showErrorMessage("Failed getting manifest directory path");
        outputChannel.appendLine(`Error getting manifest directory path: ${err.message}`);
        outputChannel.show();
      }
    }
  },

  {
    name: "epictl: deleteLocalManifest",
    callback: async (_vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const manifestName = await deleteLocalManifest(manifestManager);
        vscode.window.showInformationMessage(`Local manifest deleted successfully`);
        outputChannel.appendLine(`Local manifest ${manifestName} deleted successfully`);
      } catch (err) {
        vscode.window.showErrorMessage("Failed to delete local manifest");
        outputChannel.appendLine(`Error deleting local manifest: ${err}`);
      }
      outputChannel.show();
    }
  },
  {
    name: "epictl: initManifest", 
    callback: async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = JSON.parse(await initManifest(vsCodeConfigManager, manifestManager));
        if (result.success) {
          vscode.window.showInformationMessage("Manifest initialized successfully");
          outputChannel.append(result.message);
        } else if (result.duplicate) {
          outputChannel.append(result.message);
          vscode.window.showErrorMessage("Manifest already initialized");
        } else {
          outputChannel.append(result.message);
          vscode.window.showErrorMessage("Failed to initialize manifest");
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error initializing manifest: ${err}`);
        outputChannel.show();
      }
    }
  },

  {
    name: "epictl: cloneManifest",
    callback: async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        let result = await cloneManifest(vsCodeConfigManager, manifestManager);
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
    name: "epictl: getAllManifests",
    callback: (_vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {  
        const manifests = manifestManager.getAllManifests();

        if (manifests.length === 0) {
          outputChannel.appendLine("No manifests found");
        } else {
          for (const manifest of manifests) {
            outputChannel.appendLine(`- ${manifest}`);
          }
        }
      }
      catch (err) {
        outputChannel.appendLine(`Error listing manifests: ${err}`);
        vscode.window.showErrorMessage(`Error listing manifests: ${err}`);
      }
      outputChannel.show();
    }
  },

  {
    "name": "epictl: describeBpm",
    callback: async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await describeBpm(vsCodeConfigManager, manifestManager);

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
    "name": "epictl: applyBpm",
    callback: async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl"); 
      try { 
        const result = await JSON.parse(await applyBpm(vsCodeConfigManager, manifestManager));
        if (result.success) {
          vscode.window.showInformationMessage("Manifest applied successfully");
          outputChannel.appendLine(result.message);
        } else {
          vscode.window.showErrorMessage("Failed to apply manifest");
          outputChannel.appendLine(result.message);
        }
        outputChannel.show();
      } catch (err: any) {
        outputChannel.appendLine(`${err.message}`);
        vscode.window.showErrorMessage("Error applying manifest");
        outputChannel.show();
      }

    }
  }, 

  {
    "name": "epictl: updateBpm",
    callback: async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, updateName, newName, oldName] = await updateBpm(vsCodeConfigManager, manifestManager);
        const parsedResult = JSON.parse(result);
  
        if (parsedResult.success) {
          vscode.window.showInformationMessage("Bpm updated successfully");
          outputChannel.appendLine(parsedResult.message);
          if (updateName) {
            updateFileName(manifestManager, newName, oldName);
          }
        } else {
          vscode.window.showErrorMessage("Failed to update bpm");
          outputChannel.appendLine(parsedResult.message);
        }
        outputChannel.show();
      } catch (err: any) {
        outputChannel.appendLine(`${err}`);
        vscode.window.showErrorMessage("Error updating bpm");
        outputChannel.show();
      }
    }
  },

  {
    "name": "epictl: deleteBpm", 
    callback: async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = JSON.parse(await deleteBpm(vsCodeConfigManager, manifestManager));
        console.log("RESULT:", result);
        if (result.success) {
          vscode.window.showInformationMessage("Bpm deleted successfully");
          outputChannel.appendLine(result.message);
        } else {
          vscode.window.showErrorMessage("Failed to delete bpm");
          outputChannel.appendLine(result.message);
        }
      } catch (err) {
        outputChannel.appendLine(`Error deleting bpm: ${err}`);
        vscode.window.showErrorMessage(`Error deleting bpm: ${err}`);
        outputChannel.show();
      }
    }
  },

  {
    "name": "epictl: validateCode",
    callback: async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await validateCode(vsCodeConfigManager, manifestManager  );
        if (outputType === "json") {
          const parsed = JSON.parse(result);
          vscode.window.showInformationMessage("Code validated successfully");
          outputChannel.appendLine(result);
        } else if (outputType === "table") {
          vscode.window.showInformationMessage("Code validated successfully");
          outputChannel.appendLine(result);
        }
        outputChannel.show();
      }
      catch (err) {
        outputChannel.appendLine(`Error validating code: ${err}`);
        vscode.window.showErrorMessage(`Error validating code: ${err}`);
        outputChannel.show();
      }
    }
  }
]