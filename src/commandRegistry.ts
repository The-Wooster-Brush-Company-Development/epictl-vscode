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

import { getActiveFilename } from "./utils/extensionUtils";
import { fields, formatCommand } from "./utils/handlerUtils";

import { VsCodeConfigManager } from "./managers/configManager";
import { ManifestManager } from "./managers/manifestManager";
import { NotificationManager } from "./managers/notificationManager";

import fs from "fs";

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
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        await setExecPath(vsCodeConfigManager);
        notificationManager.success("Exec path set successfully");
      } catch (err) {
        notificationManager.error(`Error setting exec path: ${err}`);
      }
    },
  },

  {
    name: "epictl.getExecPath",
    callback: (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const execPath = getExecPath(vsCodeConfigManager);
        notificationManager.success(`Exec path: ${execPath}`);
      } catch (err: any) {
        vscode.window.showErrorMessage("Error getting exec path");
        notificationManager.error(`Error getting exec path: ${err.message}`);
      }
    },
  },

  {
    name: "epictl.deleteExecPath",
    callback: (
      vsCodeConfigManager: VsCodeConfigManager,
      _notificationManager: NotificationManager,
    ) => {
      deleteExecPath(vsCodeConfigManager);
    },
  },
];

export const cliConfigCommands = [
  {
    name: "epictl.createConfig",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const result = JSON.parse(await createConfig(vsCodeConfigManager));
        if (result.success) {
          notificationManager.success(result.message);
          if (result.config_id) {
            try {
              const message = await setConfig(
                result.config_id,
                vsCodeConfigManager,
              );
              notificationManager.success(message);
            } catch (err) {
              notificationManager.error(`Error setting config: ${err}`);
            }
            notificationManager.success("Config created successfully");
          }
        } else {
          notificationManager.error(result.message);
        }
      } catch (err) {
        notificationManager.error(`Error creating config: ${err}`);
      }
    },
  },

  // Gets the cli config
  {
    name: "epictl.getConfig",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const [result, outputType] = await getConfig(
          vsCodeConfigManager,
          "json",
        );
        const formattedResult = formatCliConfigResult(result);
        if (outputType === "json") {
          notificationManager.success(JSON.stringify(formattedResult, null, 2));
        } else {
          notificationManager.success(JSON.stringify(formattedResult, null, 2));
        }
      } catch (err) {
        notificationManager.error(`Error getting config: ${err}`);
      }
    },
  },

  {
    name: "epictl.setConfig",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const [configs, _outputType] = await getConfig(
          vsCodeConfigManager,
          "json",
        );

        const configsParsed = JSON.parse(configs);

        const configId = await vscode.window.showQuickPick(
          configsParsed.map(
            (config: any) =>
              `${path.basename(config.base_url)} : ${config.id.slice(0, 6)}`,
          ),
          {
            placeHolder: "Select the config to set",
          },
        );
        if (!configId) {
          throw new Error("No config selected");
        }
        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }
        const result = await setConfigCmd(execPath, configId);
        notificationManager.success(JSON.stringify(result, null, 2));
        notificationManager.success("Config set successfully");
      } catch (err) {
        notificationManager.error(`Error setting config: ${err}`);
      }
    },
  },

  {
    name: "epictl.activeConfig",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const response = await activeConfig(vsCodeConfigManager);
        const result = JSON.parse(response);
        if (result.success) {
          notificationManager.success(`Active config: ${result.active_config}`);
          notificationManager.success("Config active successfully");
        } else {
          notificationManager.error("Failed to active config");
        }
        return response;
      } catch (err) {
        notificationManager.error(`Error active config: ${err}`);
      }
    },
  },

  {
    name: "epictl.deleteConfig",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const result = await deleteConfig(vsCodeConfigManager);
        notificationManager.success(result);
        notificationManager.success("Config deleted successfully");
      } catch (err) {
        notificationManager.error(`Error deleting config: ${err}`);
      }
    },
  },
];

export const commands = [
  {
    name: "epictl.getBoms",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
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
          notificationManager.success(result);
        } else if (outputType === "table") {
          notificationManager.success(result);
        } else {
          notificationManager.error(result);
        }
      } catch (err) {
        notificationManager.error(`${err}`);
      }
    },
  },

  {
    name: "epictl.getTables",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ): Promise<any> => {
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
          notificationManager.success(result);
        } else if (outputType === "table") {
          notificationManager.success(result);
        }
        notificationManager.success("Tables fetched successfully");
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },

  {
    name: "epictl.describeBom",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
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
          notificationManager.success(result);
          outputChannel.append(result);
        } else if (outputType === "table") {
          notificationManager.success(result);
        }
        notificationManager.success("Bom described successfully");
      } catch (err) {
        notificationManager.error(`Error describing bom: ${err}`);
      }
    },
  },

  {
    name: "epictl.describeTable",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
    ) => {
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

      try {
        const result = await describeTable(execPath, tableId, outputType);
        if (outputType === "json") {
          notificationManager.success(result);
        } else if (outputType === "table") {
          notificationManager.success(result);
        }
        notificationManager.success("Table described successfully");
      } catch (err) {
        notificationManager.error(`Error describing table:f ${err}`);
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
      notificationManager: NotificationManager,
    ) => {
      try {
        setManifestDirPath(manifestManager);
        notificationManager.success("Manifest directory path set successfully");
      } catch (err) {
        notificationManager.error(
          `Error setting manifest directory path: ${err}`,
        );
      }
    },
  },

  {
    name: "epictl.getManifestDirPath",
    callback: (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const manifestDirPath = getManifestDirPath(manifestManager);
        notificationManager.success(
          `Manifest directory path: ${manifestDirPath}`,
        );
      } catch (err: any) {
        notificationManager.error(
          `Error getting manifest directory path: ${err.message}`,
        );
      }
    },
  },

  {
    name: "epictl.deleteLocalManifest",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const manifestName = await deleteLocalManifest(manifestManager);
        notificationManager.success(
          `Local manifest ${manifestName} deleted successfully`,
        );
      } catch (err) {
        notificationManager.error(`Error deleting local manifest: ${err}`);
      }
    },
  },
  {
    name: "epictl.addFileToManifest",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
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
        notificationManager.success(
          `File ${filePath} added to manifest ${manifestName} successfully`,
        );
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },
  {
    name: "epictl.deleteCodeFileFromManifest",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
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
        notificationManager.success(
          `File ${filePath} deleted from manifest ${manifestName} successfully`,
        );
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },
  {
    name: "epictl.initManifest",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const entityType = await vscode.window.showQuickPick(["bom", "table"], {
          placeHolder: "Select the entity type",
        });

        if (!entityType) {
          throw new Error("No entity type selected");
        }

        // get the parent id
        const parentId = await vscode.window.showInputBox({
          prompt: "Enter the parent id",
          ignoreFocusOut: true,
        });

        if (!parentId) {
          throw new Error("No parent id provided");
        }

        let manifestInput = await vscode.window.showInputBox({
          prompt: "enter the name of the manifest file",
          ignoreFocusOut: true,
        });

        if (manifestInput && !manifestInput.endsWith(".json")) {
          manifestInput = `${manifestInput}.json`;
        }

        const manifestPath = manifestManager.createManifestFilePath(
          manifestInput ? manifestInput : "",
        );

        let codeFilePath = await vscode.window.showInputBox({
          prompt: "Enter the path and name of the code file",
          ignoreFocusOut: true,
        });
        if (!codeFilePath) {
          throw new Error("No code file path and name provided");
        }
        if (
          fs.existsSync(codeFilePath) &&
          fs.statSync(codeFilePath).isDirectory()
        ) {
          throw new Error("Code file path is a directory");
        }

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = await initManifest(
          execPath,
          entityType,
          parentId,
          manifestPath,
          undefined,
          manifestManager,
        );
        const parsedResult = JSON.parse(result);
        if (parsedResult.success) {
          notificationManager.success("Manifest initialized successfully");
          initCodeFile(codeFilePath, manifestPath, manifestManager);
          const filePath = formatMessage(parsedResult.results);
          notificationManager.success(
            "Manifest initialized successfully at " + filePath,
          );
        } else if (parsedResult.duplicate) {
          notificationManager.error(parsedResult.message);
          notificationManager.error("Manifest already initialized");
        }
      } catch (err) {
        notificationManager.error(`Error initializing manifest: ${err}`);
      }
    },
  },

  {
    name: "epictl.cloneManifest",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      const entityType = await vscode.window.showQuickPick(["bom", "table"], {
        placeHolder: "Select the entity type",
      });

      if (!entityType) {
        throw new Error("No entity type selected");
      }

      const bpmId = await vscode.window.showInputBox({
        prompt: "Enter the bpm id",
        ignoreFocusOut: true,
      });
      if (!bpmId) {
        throw new Error("No bpm id provided");
      }

      const parentId = await vscode.window.showInputBox({
        prompt: "Enter the parent id",
        ignoreFocusOut: true,
      });
      if (!parentId) {
        throw new Error("No parent id provided");
      }

      let manifestInput: string | undefined;
      manifestInput = await vscode.window.showInputBox({
        prompt: "(optional) enter the name of the new manifest file",
        ignoreFocusOut: true,
      });

      const manifestPath = manifestManager.createManifestFilePath("");

      let codeFilePath = await vscode.window.showInputBox({
        prompt: "Enter the path and name of the code file",
        ignoreFocusOut: true,
      });
      if (!codeFilePath) {
        throw new Error("No code file path provided");
      }

      const execPath = vsCodeConfigManager.readExecPath();
      if (!execPath) {
        throw new Error("No exec path set");
      }

      const outputChannel = vscode.window.createOutputChannel("Epictl");
      try {
        const [result, codeResultPath] = await cloneManifest(
          execPath,
          entityType,
          bpmId,
          parentId,
          manifestPath,
          codeFilePath,
        );
        const parsedResult = JSON.parse(result);
        if (parsedResult.success) {
          notificationManager.success("Manifest cloned successfully");
          const filePath = formatMessage(parsedResult.results);
          notificationManager.success(
            "Manifest cloned successfully at " + filePath,
          );

          if (parsedResult.codeLines) {
            const bpmCodePath = createCodeFile(
              parsedResult.codeLines,
              codeResultPath,
              parsedResult.name,
            );
            updateManifestMetadataWithCodeFile(manifestManager, bpmCodePath);
          }
          notificationManager.success(
            `Code file initialized successfully at ${codeResultPath}`,
          );
        } else {
          notificationManager.error("Failed to clone manifest");
          notificationManager.error(parsedResult.message);
        }
      } catch (err: any) {
        notificationManager.error("Error cloning manifest");
        notificationManager.error(`${err.message}`);
      }
    },
  },

  {
    name: "epictl.getManifests",
    callback: (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const manifests = manifestManager.getManifests();

        if (manifests.length === 0) {
          notificationManager.error("No manifests found");
        } else {
          for (const manifest of manifests) {
            notificationManager.success(`- ${manifest}`);
          }
        }
      } catch (err) {
        notificationManager.error(`Error listing manifests: ${err}`);
      }
    },
  },

  {
    name: "epictl.describeBpm",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
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
          notificationManager.success("Bpm described successfully");
        } else if (outputType === "table") {
          notificationManager.success("Bpm described successfully");
        }
      } catch (err) {
        notificationManager.error(`Error describing bpm: ${err}`);
      }
    },
  },

  {
    name: "epictl.applyBpm",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const openFilename = getActiveFilename();
        let manifestInput: string | undefined;

        const manifestFile =
          manifestManager.isCodeFileInManifests(openFilename);

        if (!manifestFile) {
          manifestInput = await vscode.window.showInputBox({
            prompt:
              "Manifest file not found, enter the name of the manifest file",
            ignoreFocusOut: true,
          });
        } else {
          manifestInput = manifestFile;
        }

        if (!manifestInput) {
          throw new Error("No manifest file path provided");
        }

        if (!manifestInput.endsWith(".json")) {
          manifestInput = `${manifestInput}.json`;
        }

        const manifestPath =
          manifestManager.createManifestFilePath(manifestInput);

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = JSON.parse(await applyBpm(execPath, manifestPath));
        if (result.success) {
          notificationManager.success("Manifest applied successfully");
        } else {
          notificationManager.error("Failed to apply manifest");
          notificationManager.error(result.message);
        }
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },

  {
    name: "epictl.updateBpm",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const openFilename = getActiveFilename();
        let manifestInput: string | undefined =
          manifestManager.isCodeFileInManifests(openFilename);
        const haveValidCodeFile =
          !!openFilename && openFilename.endsWith(".cs");
        if (!manifestInput) {
          manifestInput = await vscode.window.showInputBox({
            prompt:
              "Manifest file not found, enter the name of the manifest file",
            ignoreFocusOut: true,
          });
        }

        if (!manifestInput) {
          throw new Error("No manifest file name provided");
        }

        if (!manifestInput.endsWith(".json")) {
          manifestInput = `${manifestInput}.json`;
        }

        const manifestPath =
          manifestManager.createManifestFilePath(manifestInput);

        const flagsWithCmds: string[] = [];

        const selectedFields = await vscode.window.showQuickPick(fields, {
          canPickMany: true,
          placeHolder: "Select the fields you want to update",
        });

        if (!selectedFields) {
          throw new Error("No fields selected");
        }

        let updateName = false;
        let newName: string | undefined;
        let oldName: string | undefined;

        for (const field of selectedFields) {
          let userInput: string | undefined;
          if (field.key === "codefile") {
            if (!haveValidCodeFile) {
              userInput = await vscode.window.showInputBox({
                prompt: "Enter the path to the code file",
                ignoreFocusOut: true,
              });
              if (!userInput) {
                throw new Error("No code file path provided");
              }
              if (!userInput.endsWith(".cs")) {
                throw new Error("Code file must be a .cs file");
              }
            } else {
              userInput = openFilename;
            }
          } else {
            userInput = await vscode.window.showInputBox({
              prompt: `Enter the value for ${field.label}`,
              ignoreFocusOut: true,
            });
          }
          if (!userInput) {
            throw new Error(`No value provided for ${field.label}`);
          }

          if (field.key === "name") {
            updateName = true;
            newName = userInput;
            oldName = manifestInput;
          }

          flagsWithCmds.push(formatCommand[field.key](userInput));
        }

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = await updateBpm(execPath, manifestPath, flagsWithCmds);
        const parsedResult = JSON.parse(result);
        if (parsedResult.success) {
          notificationManager.success("Bpm updated successfully");
          if (updateName) {
            updateFileName(manifestManager, newName!, oldName!);
          }
        } else {
          notificationManager.error("Failed to update bpm");
          notificationManager.error(parsedResult.message);
        }
      } catch (err: any) {
        notificationManager.error("Error updating bpm");
        notificationManager.error(`${err}`);
      }
    },
  },

  {
    name: "epictl.deleteBpm",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const result = JSON.parse(
          await deleteBpm(vsCodeConfigManager, manifestManager),
        );
        if (result.success) {
          notificationManager.success("Bpm deleted successfully");
        } else {
          notificationManager.error("Failed to delete bpm");
          notificationManager.error(result.message);
        }
      } catch (err) {
        notificationManager.error("Error deleting bpm");
        notificationManager.error(`${err}`);
      }
    },
  },

  {
    name: "epictl.validateCode",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          throw new Error("No editor open");
        }

        const bodyFilePath = editor.document.fileName;

        const targetManifest =
          manifestManager.readManifestByCodeFilePath(bodyFilePath);

        if (!targetManifest) {
          throw new Error("No manifest file found");
        }

        const entityType =
          manifestManager.readManifest(targetManifest).epictl.parent_type;

        const manifestPath =
          manifestManager.createManifestFilePath(targetManifest);

        const displayType = "table";
        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = await validateCode(
          execPath,
          entityType,
          manifestPath,
          bodyFilePath,
          displayType,
        );
        notificationManager.success("Code validated successfully");
      } catch (err) {
        notificationManager.error("Error validating code");
        notificationManager.error(`${err}`);
      }
    },
  },
];
