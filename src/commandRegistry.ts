import * as vscode from "vscode";
import path from "path";
import {
  createConfig,
  getConfig,
  setConfig,
  activeConfig,
  setConfigCmd,
  deleteConfig,
  setExecPath,
  getExecPath,
  deleteExecPath,
  addFileToManifest,
  deleteCodeFileFromManifest,
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

import {
  updateFileName,
  createCodeFile,
  updateManifestMetadataWithCodeFile,
  formatMessage,
  formatCliConfigResult,
  initCodeFile,
} from "./utils/registryUtils";

export const vsCodeConfigCommands = [
  {
    name: "epictl.setExecPath",
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
    },
  },

  {
    name: "epictl.getExecPath",
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
    },
  },

  {
    name: "epictl.deleteExecPath",
    callback: (vsCodeConfigManager: VsCodeConfigManager) => {
      deleteExecPath(vsCodeConfigManager);
    },
  },
];

export const cliConfigCommands = [
  {
    name: "epictl.createConfig",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      let outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = JSON.parse(await createConfig(vsCodeConfigManager));
        if (result.success) {
          outputChannel.appendLine(result.message);
          if (result.config_id) {
            try {
              const message = await setConfig(
                result.config_id,
                vsCodeConfigManager,
              );
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

  // Gets the cli config
  {
    name: "epictl.getConfig",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await getConfig(
          vsCodeConfigManager,
          "json",
        );
        const formattedResult = formatCliConfigResult(result);
        if (outputType === "json") {
          outputChannel.appendLine(JSON.stringify(formattedResult, null, 2));
        } else {
          outputChannel.appendLine(JSON.stringify(formattedResult, null, 2));
        }
        vscode.window.showInformationMessage("Config fetched successfully");
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error getting config: ${err}`);
        vscode.window.showErrorMessage("Failed to get config");
        outputChannel.show();
      }
    },
  },

  {
    name: "epictl.setConfig",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = await setConfigCmd(vsCodeConfigManager);
        outputChannel.appendLine(JSON.stringify(result, null, 2));
        vscode.window.showInformationMessage("Config set successfully");
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error setting config: ${err}`);
        vscode.window.showErrorMessage("Failed to set config");
        outputChannel.show();
      }
    },
  },

  {
    name: "epictl.activeConfig",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = JSON.parse(await activeConfig(vsCodeConfigManager));
        if (result.success) {
          outputChannel.appendLine(`Active config: ${result.active_config}`);
          vscode.window.showInformationMessage("Config active successfully");
        } else {
          outputChannel.appendLine("Failed to active config");
          vscode.window.showErrorMessage("Error active config");
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error active config: ${err}`);
        vscode.window.showErrorMessage("Failed to active config");
        outputChannel.show();
      }
    },
  },

  {
    name: "epictl.deleteConfig",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = await deleteConfig(vsCodeConfigManager);
        outputChannel.appendLine(result);
        vscode.window.showInformationMessage("Config deleted successfully");
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error deleting config: ${err}`);
        vscode.window.showErrorMessage("Failed to delete config");
        outputChannel.show();
      }
    },
  },
];

export const commands = [
  {
    name: "epictl.getBoms",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");

      try {
        const outputType = await vscode.window.showQuickPick(
          ["table", "json"],
          {
            placeHolder: "Select the output type",
          },
        );
        if (!outputType) {
          throw new Error("No output type selected");
        }

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = await getBoms(execPath, outputType);

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
        outputChannel.appendLine("");
        vscode.window.showErrorMessage("Error fetching boms");
        outputChannel.show();
      }
    },
  },

  {
    name: "epictl.getTables",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
    ): Promise<any> => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const outputType = await vscode.window.showQuickPick(
          ["table", "json"],
          {
            placeHolder: "Select the output type",
          },
        );
        if (!outputType) {
          throw new Error("No output type selected");
        }

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = await getTables(execPath, outputType);
        if (outputType === "json") {
          vscode.window.showInformationMessage("Tables fetched successfully");
          outputChannel.appendLine(result);
        } else if (outputType === "table") {
          vscode.window.showInformationMessage("Tables fetched successfully");
          outputChannel.appendLine(result);
        }
        outputChannel.show();
      } catch (err: any) {
        outputChannel.appendLine(`${err.message}`);
        vscode.window.showErrorMessage("Error fetching tables");
        outputChannel.show();
      }
    },
  },

  {
    name: "epictl.describeBom",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const bomId = await vscode.window.showInputBox({
        prompt: "Enter the bom id",
        ignoreFocusOut: true,
      });
      if (!bomId) {
        throw new Error("No bom id provided");
      }

      const outputType = await vscode.window.showQuickPick(["table", "json"], {
        placeHolder: "Select the output type",
      });

      if (!outputType) {
        throw new Error("No output type selected");
      }

      const execPath = vsCodeConfigManager.readExecPath();
      if (!execPath) {
        throw new Error("No exec path set");
      }

      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = await describeBom(execPath, bomId, outputType);
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
    },
  },

  {
    name: "epictl.describeTable",
    callback: async (vsCodeConfigManager: VsCodeConfigManager) => {
      const tableId = await vscode.window.showInputBox({
        prompt: "Enter the table id",
        ignoreFocusOut: true,
      });
      if (!tableId) {
        throw new Error("No table id provided");
      }

      const outputType = await vscode.window.showQuickPick(["table", "json"], {
        placeHolder: "Select the output type",
      });

      if (!outputType) {
        throw new Error("No output type selected");
      }

      const execPath = vsCodeConfigManager.readExecPath();
      if (!execPath) {
        throw new Error("No exec path set");
      }

      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = await describeTable(execPath, tableId, outputType);
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
    },
  },
];

export const manifestCommands = [
  {
    name: "epictl.setManifestDirPath",
    callback: (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        setManifestDirPath(manifestManager);
        vscode.window.showInformationMessage("Success");
        outputChannel.appendLine("Manifest directory path set successfully");
      } catch (err) {
        vscode.window.showErrorMessage("Error");
        outputChannel.appendLine(
          `Error setting manifest directory path: ${err}`,
        );
      }
      outputChannel.show();
    },
  },

  {
    name: "epictl.getManifestDirPath",
    callback: (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const manifestDirPath = getManifestDirPath(manifestManager);
        vscode.window.showInformationMessage("Manifest directory path found");
        outputChannel.appendLine(`Manifest directory path: ${manifestDirPath}`);
        outputChannel.show();
      } catch (err: any) {
        vscode.window.showErrorMessage(
          "Failed getting manifest directory path",
        );
        outputChannel.appendLine(
          `Error getting manifest directory path: ${err.message}`,
        );
        outputChannel.show();
      }
    },
  },

  {
    name: "epictl.deleteLocalManifest",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const manifestName = await deleteLocalManifest(manifestManager);
        vscode.window.showInformationMessage(
          `Local manifest deleted successfully`,
        );
        outputChannel.appendLine(
          `Local manifest ${manifestName} deleted successfully`,
        );
      } catch (err) {
        vscode.window.showErrorMessage("Failed to delete local manifest");
        outputChannel.appendLine(`Error deleting local manifest: ${err}`);
      }
      outputChannel.show();
    },
  },
  {
    name: "epictl.addFileToManifest",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const editor = vscode.window.activeTextEditor;
        let filePath = editor?.document.uri.fsPath;
        if (filePath && path.extname(filePath) !== ".cs") {
          filePath = undefined;
        }

        if (!filePath) {
          filePath = await vscode.window.showInputBox({
            prompt: "Enter the path to the code file",
            ignoreFocusOut: true,
          });
        }

        if (!filePath) {
          throw new Error("No file path provided");
        }

        const manifestName = await vscode.window.showInputBox({
          prompt: "Enter the name of the manifest",
          ignoreFocusOut: true,
        });

        if (!manifestName) {
          throw new Error("No manifest name provided");
        }

        const result = addFileToManifest(
          manifestManager,
          manifestName,
          filePath,
        );
        vscode.window.showInformationMessage("Success");
        outputChannel.appendLine(
          `File ${filePath} added to manifest ${manifestName} successfully`,
        );
        outputChannel.show();
      } catch (err: any) {
        outputChannel.appendLine(`${err.message}`);
        vscode.window.showErrorMessage(`Error`);
        outputChannel.show();
      }
    },
  },
  {
    name: "epictl.deleteCodeFileFromManifest",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const editor = vscode.window.activeTextEditor;
        let filePath = editor?.document.uri.fsPath;
        if (filePath && path.extname(filePath) !== ".cs") {
          filePath = undefined;
        }

        if (!filePath) {
          filePath = await vscode.window.showInputBox({
            prompt: "Enter the path to the code file",
            ignoreFocusOut: true,
          });
        }

        if (!filePath) {
          throw new Error("No file path provided");
        }

        const manifestName = await vscode.window.showInputBox({
          prompt: "Enter the name of the manifest",
          ignoreFocusOut: true,
        });

        if (!manifestName) {
          throw new Error("No manifest name provided");
        }

        const result = deleteCodeFileFromManifest(
          manifestManager,
          manifestName,
          filePath,
        );
        vscode.window.showInformationMessage("Success");
        outputChannel.appendLine(
          `File ${filePath} deleted from manifest ${manifestName} successfully`,
        );
        outputChannel.show();
      } catch (err: any) {
        outputChannel.appendLine(`${err.message}`);
        vscode.window.showErrorMessage(`Error`);
        outputChannel.show();
      }
      outputChannel.show();
    },
  },
  {
    name: "epictl.initManifest",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, codeFilePath, manifestInput] = await initManifest(
          vsCodeConfigManager,
          manifestManager,
        );
        const parsedResult = JSON.parse(result);
        if (parsedResult.success) {
          vscode.window.showInformationMessage(
            "Manifest initialized successfully",
          );
          initCodeFile(codeFilePath, manifestInput, manifestManager);
          const filePath = formatMessage(parsedResult.results);
          outputChannel.appendLine(
            "Manifest initialized successfully at " + filePath,
          );
        } else if (parsedResult.duplicate) {
          outputChannel.appendLine(parsedResult.message);
          vscode.window.showErrorMessage("Manifest already initialized");
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error initializing manifest: ${err}`);
        outputChannel.show();
      }
    },
  },

  {
    name: "epictl.cloneManifest",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, codeFilePath] = await cloneManifest(
          vsCodeConfigManager,
          manifestManager,
        );
        const parsedResult = JSON.parse(result);
        if (parsedResult.success) {
          vscode.window.showInformationMessage("Manifest cloned successfully");
          const filePath = formatMessage(parsedResult.results);
          outputChannel.appendLine(
            "Manifest cloned successfully at " + filePath,
          );

          if (parsedResult.codeLines) {
            const bpmCodePath = createCodeFile(
              parsedResult.codeLines,
              codeFilePath,
              parsedResult.name,
            );
            updateManifestMetadataWithCodeFile(manifestManager, bpmCodePath);
          }
          outputChannel.appendLine(
            `Code file initialized successfully at ${codeFilePath}`,
          );
          outputChannel.show();
        } else {
          vscode.window.showErrorMessage("Failed to clone manifest");
          outputChannel.appendLine(parsedResult.message);
          outputChannel.show();
        }
      } catch (err: any) {
        vscode.window.showErrorMessage("Error cloning manifest");
        outputChannel.appendLine(`${err.message}`);
        outputChannel.show();
      }
    },
  },

  {
    name: "epictl.getManifests",
    callback: (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const manifests = manifestManager.getManifests();

        if (manifests.length === 0) {
          outputChannel.appendLine("No manifests found");
        } else {
          for (const manifest of manifests) {
            outputChannel.appendLine(`- ${manifest}`);
          }
        }
      } catch (err) {
        outputChannel.appendLine(`Error listing manifests: ${err}`);
        vscode.window.showErrorMessage(`Error listing manifests: ${err}`);
      }
      outputChannel.show();
    },
  },

  {
    name: "epictl.describeBpm",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        let manifestInput = await vscode.window.showInputBox({
          prompt: "(optional) enter the name of the manifest file",
          ignoreFocusOut: true,
        });

        if (manifestInput) {
          if (!manifestInput.endsWith(".json")) {
            manifestInput = `${manifestInput}.json`;
          }
          manifestInput = manifestManager.createManifestFilePath(manifestInput);
        }

        let bpmId: string | undefined;
        let entityType: string | undefined;
        let parentId: string | undefined;

        if (!manifestInput) {
          entityType = await vscode.window.showQuickPick(["bom", "table"], {
            placeHolder: "Select the entity type",
          });

          if (!entityType) {
            throw new Error("No entity type selected");
          }
          bpmId = await vscode.window.showInputBox({
            prompt: "Enter the bpm id",
            ignoreFocusOut: true,
          });

          if (!bpmId) {
            throw new Error("No bpm id provided");
          }

          parentId = await vscode.window.showInputBox({
            prompt: "Enter the parent id",
            ignoreFocusOut: true,
          });

          if (!parentId) {
            throw new Error("No parent id provided");
          }
        }

        const outputType = await vscode.window.showQuickPick(
          ["table", "json"],
          {
            placeHolder: "Select the output type",
          },
        );

        if (!outputType) {
          throw new Error("No output type selected");
        }

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = await describeBpm(
          execPath,
          manifestInput,
          bpmId,
          entityType,
          parentId,
          outputType,
        );

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
    },
  },

  {
    name: "epictl.applyBpm",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = await JSON.parse(
          await applyBpm(vsCodeConfigManager, manifestManager),
        );
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
    },
  },

  {
    name: "epictl.updateBpm",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, updateName, newName, oldName] = await updateBpm(
          vsCodeConfigManager,
          manifestManager,
        );
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
    },
  },

  {
    name: "epictl.deleteBpm",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const result = JSON.parse(
          await deleteBpm(vsCodeConfigManager, manifestManager),
        );
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
    },
  },

  {
    name: "epictl.validateCode",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
    ) => {
      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, outputType] = await validateCode(
          vsCodeConfigManager,
          manifestManager,
        );
        if (outputType === "json") {
          const parsed = JSON.parse(result);
          vscode.window.showInformationMessage("Code validated successfully");
          outputChannel.appendLine(result);
        } else if (outputType === "table") {
          vscode.window.showInformationMessage("Code validated successfully");
          outputChannel.appendLine(result);
        }
        outputChannel.show();
      } catch (err) {
        outputChannel.appendLine(`Error validating code: ${err}`);
        vscode.window.showErrorMessage(`Error validating code: ${err}`);
        outputChannel.show();
      }
    },
  },
];
