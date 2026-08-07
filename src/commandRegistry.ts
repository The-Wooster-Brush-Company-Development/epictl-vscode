import * as vscode from "vscode";
import path from "path";
import {
  createConfig,
  getConfig,
  activeConfig,
  deleteConfigCli,
  setConfigCli,
  setExecPath,
  getExecPath,
  deleteExecPath,
  setCodeDirPath,
  getCodeDirPath,
  deleteCodeDirPath,
  addFileToManifest,
  deleteCodeFileFromManifest,
  initManifest,
  cloneManifest,
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
  applyCode,
} from "./commandHandlers";

import { fields, formatCommand } from "./utils/handlerUtils";

import { VsCodeConfigManager } from "./managers/configManager";
import { ManifestManager } from "./managers/manifestManager";
import { NotificationManager } from "./managers/notificationManager";

import {
  updateFileName,
  updateManifestMetadataWithCodeFile,
  formatMessage,
  formatCliConfigResult,
  initCodeFile,
  ConfigQuickPickItem,
} from "./utils/registryUtils";

import { PromptManager } from "./managers/promptManager";
import {
  BpmStateManagerInterface,
  StateManager,
} from "./managers/stateManager";

export const vsCodeConfigCommands = [
  /*
   * Exec path may fail if user enters a window path like "C:\Users\username\AppData\Local\epictl\epictl.exe"
   */
  {
    name: "epictl.setExecPath",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const userPath = (await promptManager.promptExecPath())?.trim();
        if (!userPath) {
          throw new Error("No exec path provided");
        }

        if (path.isAbsolute(userPath)) {
          setExecPath(vsCodeConfigManager, userPath);
        } else {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            throw new Error(
              "Error setting exec path: No workspace folder found",
            );
          }
          const execPath = path.resolve(workspaceFolder.uri.fsPath, userPath);
          setExecPath(vsCodeConfigManager, execPath);
        }
        notificationManager.success(
          "Exec path set successfully to: " + userPath,
        );
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
      _promptManager: PromptManager,
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
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const confirm = await promptManager.promptConfirm();
        if (!confirm) {
          throw new Error("Aborting delete exec path");
        }
        if (confirm === "No") {
          throw new Error("Aborting delete exec path");
        }
        deleteExecPath(vsCodeConfigManager);
        notificationManager.success("Exec path deleted successfully");
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },

  {
    name: "epictl.setCodeDirPath",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const userInput = (await promptManager.promptCodeDirPath())?.trim();
        if (!userInput) {
          throw new Error("No code directory path provided");
        }
        if (path.isAbsolute(userInput)) {
          setCodeDirPath(vsCodeConfigManager, userInput);
        } else {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            throw new Error(
              "Error setting code directory path: No workspace folder found",
            );
          }
          const codeDirPath = path.resolve(
            workspaceFolder.uri.fsPath,
            userInput,
          );
          setCodeDirPath(vsCodeConfigManager, codeDirPath);
        }
        notificationManager.success(
          "Code directory path set successfully to: " + userInput,
        );
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },

  {
    name: "epictl.getCodeDirPath",
    callback: (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      _promptManager: PromptManager,
    ) => {
      try {
        const codeDirPath = getCodeDirPath(vsCodeConfigManager);
        notificationManager.success(`Code directory path: ${codeDirPath}`);
      } catch (err: any) {
        notificationManager.notifyError("Error getting code directory path");
        notificationManager.write(err.message);
      }
    },
  },

  {
    name: "epictl.deleteCodeDirPath",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const confirm = await promptManager.promptConfirm();
        if (!confirm) {
          throw new Error("Aborting delete code directory path");
        }
        if (confirm === "No") {
          throw new Error("Aborting delete code directory path");
        }
        deleteCodeDirPath(vsCodeConfigManager);
        notificationManager.success("Code directory path deleted successfully");
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },
];

export const cliConfigCommands = [
  {
    name: "epictl.createConfig",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const baseUrlPath = await promptManager.promptConfigBaseUrlPath();
        if (!baseUrlPath) {
          throw new Error("No base url path provided");
        }

        const username = await promptManager.promptConfigUsername();
        if (!username) {
          throw new Error("No username provided");
        }

        const password = await promptManager.promptConfigPassword();
        if (!password) {
          throw new Error("No password provided");
        }

        const apiKey = await promptManager.promptConfigApiKey();
        if (!apiKey) {
          throw new Error("No api key provided");
        }

        const company = await promptManager.promptConfigCompany();
        if (!company) {
          throw new Error("No company ID provided");
        }

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }
        const result = JSON.parse(
          await createConfig(
            execPath,
            baseUrlPath,
            username,
            password,
            apiKey,
            company,
          ),
        );
        if (result.success) {
          notificationManager.success(result.message);
          if (result.config_id) {
            try {
              const message = await setConfigCli(execPath, result.config_id);
              notificationManager.success(message);
            } catch (err: any) {
              notificationManager.error(`${err.message}`);
            }
          }
        } else {
          notificationManager.error(result.message);
        }
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },

  // Gets the cli config
  {
    name: "epictl.getConfig",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const outputType = await promptManager.promptOutputType();
        if (!outputType) {
          throw new Error("No output type selected");
        }
        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }
        const result = await getConfig(execPath, outputType);
        if (outputType === "json") {
          const formattedResult = formatCliConfigResult(result);
          notificationManager.success(JSON.stringify(formattedResult, null, 2));
        } else {
          notificationManager.success(result);
        }
      } catch (err) {
        notificationManager.error(`Error getting config: ${err}`);
      }
    },
  },

  {
    name: "epictl.setConfig", // setting the cli config
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }
        const configs = await getConfig(execPath, "json");

        const configsParsed = JSON.parse(configs);

        const configOptions: ConfigQuickPickItem[] = configsParsed.map(
          (config: any) => ({
            label: `${path.basename(config.base_url)} : ${config.company ?? "?"} : ${config.id.slice(0, 6)}`,
            id: config.id,
          }),
        );
        const selection =
          await promptManager.promptConfigSelection(configOptions);

        if (!selection) {
          throw new Error("No config selected");
        }
        const result = await setConfigCli(execPath, selection.id);
        notificationManager.success(result);
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
      promptManager: PromptManager,
    ) => {
      try {
        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }
        const response = await activeConfig(execPath);
        const result = JSON.parse(response);
        if (result.success) {
          notificationManager.success(`Active config: ${result.active_config}`);
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
      promptManager: PromptManager,
    ) => {
      try {
        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }
        const activeConfigResult = JSON.parse(await activeConfig(execPath));
        const activeConfigId = activeConfigResult.active_config;

        const configs = await getConfig(execPath, "json");
        const configsParsed = JSON.parse(configs);

        const configOptions: ConfigQuickPickItem[] = configsParsed
          .filter((config: any) => config.id !== activeConfigId)
          .map((config: any) => config.id);

        const selection =
          await promptManager.promptConfigSelection(configOptions);
        if (!selection) {
          throw new Error("No config id provided");
        }

        const confirm = await promptManager.promptConfirm();
        if (!confirm) {
          throw new Error("Aborting delete config");
        }
        if (confirm !== "Yes") {
          throw new Error("Aborting delete config");
        }
        const result = JSON.parse(
          await deleteConfigCli(execPath, selection as unknown as string),
        );

        if (result.success) {
          notificationManager.success(result.message);
        } else {
          notificationManager.error(result.message);
        }
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
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
      promptManager: PromptManager,
    ) => {
      try {
        const outputType = await promptManager.promptOutputType();
        if (!outputType) {
          throw new Error("No output type selected");
        }

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = await getBoms(execPath, outputType);

        if (outputType === "json") {
          notificationManager.notifySuccess("Boms fetched successfully");
          notificationManager.write(result);
        } else if (outputType === "table") {
          notificationManager.notifySuccess("Boms fetched successfully");
          notificationManager.write(result);
        } else {
          notificationManager.notifyError("Failed to fetch boms");
          notificationManager.write(result);
        }
      } catch (err: any) {
        notificationManager.notifyError("Error fetching boms");
        notificationManager.write(err.message);
      }
    },
  },

  {
    name: "epictl.getTables",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ): Promise<any> => {
      try {
        const outputType = await promptManager.promptOutputType();
        if (!outputType) {
          throw new Error("No output type selected");
        }
        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = await getTables(execPath, outputType);
        if (outputType === "json") {
          notificationManager.notifySuccess("Tables fetched successfully");
          notificationManager.write(result);
        } else if (outputType === "table") {
          notificationManager.notifySuccess("Tables fetched successfully");
          notificationManager.write(result);
        } else {
          notificationManager.notifyError("Failed to fetch tables");
          notificationManager.write(result);
        }
      } catch (err: any) {
        notificationManager.notifyError("Error fetching tables");
        notificationManager.write(err.message);
      }
    },
  },

  {
    name: "epictl.describeBom",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const bomId = await promptManager.promptEntityId();
        if (!bomId) {
          throw new Error("No entity id provided");
        }

        const outputType = await promptManager.promptOutputType();
        if (!outputType) {
          throw new Error("No output type selected");
        }

        const execPath = getExecPath(vsCodeConfigManager);
        if (!execPath) {
          throw new Error("No exec path set");
        }
        const result = await describeBom(execPath, bomId, outputType);
        if (outputType === "json") {
          notificationManager.notifySuccess("Bom described successfully");
          notificationManager.write(result);
        } else if (outputType === "table") {
          notificationManager.notifySuccess("Bom described successfully");
          notificationManager.write(result);
        }
      } catch (err: any) {
        notificationManager.notifyError("Error describing bom");
        notificationManager.write(err.message);
      }
    },
  },

  {
    name: "epictl.describeTable",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      const tableId = await promptManager.promptEntityId();
      if (!tableId) {
        throw new Error("No table id provided");
      }

      const outputType = await promptManager.promptOutputType();

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
          notificationManager.notifySuccess("Table described successfully");
          notificationManager.write(result);
        } else if (outputType === "table") {
          notificationManager.notifySuccess("Table described successfully");
          notificationManager.write(result);
        } else {
          notificationManager.notifyError("Failed to describe table");
          notificationManager.write(result);
        }
      } catch (err: any) {
        notificationManager.notifyError("Error describing table");
        notificationManager.write(err.message);
      }
    },
  },
];

// Currently not used
export const manifestCommands = [
  /**
  {
    name: "epictl.setManifestDirPath",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const userInput = await promptManager.promptManifestDirPath();
        if (!userInput) {
          throw new Error("No manifest directory path provided");
        }
        setManifestDirPath(manifestManager, userInput);
        notificationManager.success("Manifest directory path set successfully");
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },

  {
    name: "epictl.getManifestDirPath",
    callback: (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
      _promptManager: PromptManager,
    ) => {
      try {
        const manifestDirPath = getManifestDirPath(manifestManager);
        notificationManager.success(
          `Manifest directory path: ${manifestDirPath}`,
        );
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },
  */

  {
    name: "epictl.deleteLocalManifest",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const manifestFIles = manifestManager.readManifests();

        const manifestInput =
          await promptManager.promptManifestSelection(manifestFIles);

        if (!manifestInput) {
          throw new Error("No manifest file selected");
        }

        const confirm = await promptManager.promptConfirm();
        if (!confirm) {
          throw new Error("Aborting delete local manifest");
        }
        if (confirm !== "Yes") {
          throw new Error("Aborting delete local manifest");
        }
        const manifestName = await deleteLocalManifest(
          manifestManager,
          manifestInput,
        );
        notificationManager.success(
          `Local manifest ${manifestName} deleted successfully`,
        );
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },
  {
    name: "epictl.addFileToManifest",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const editor = vscode.window.activeTextEditor;
        let filePath = editor?.document.uri.fsPath;
        if (filePath && path.extname(filePath) !== ".cs") {
          filePath = undefined;
        }

        if (!filePath) {
          filePath = await promptManager.promptCodeFilePath();
          if (!filePath) {
            throw new Error("No file path provided");
          }
        }

        const manifestName = await promptManager.promptManifestName();
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
      promptManager: PromptManager,
    ) => {
      try {
        const editor = vscode.window.activeTextEditor;
        let filePath = editor?.document.uri.fsPath;
        if (filePath && path.extname(filePath) !== ".cs") {
          filePath = undefined;
        }

        if (!filePath) {
          filePath = await promptManager.promptCodeFilePath();
          if (!filePath) {
            throw new Error("No file path provided");
          }
        }

        const manifestName = await promptManager.promptManifestName();
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
      promptManager: PromptManager,
    ) => {
      try {
        const entityType = await promptManager.promptEntityType();

        if (!entityType) {
          throw new Error("No entity type selected");
        }

        // get the parent id
        const parentId = await promptManager.promptParentId();
        if (!parentId) {
          throw new Error("No parent id provided");
        }

        let manifestInput = await promptManager.promptManifestName();
        if (!manifestInput) {
          throw new Error("No manifest name provided");
        }

        if (!manifestInput.endsWith(".json")) {
          manifestInput = `${manifestInput}.json`;
        }

        const manifestPath = manifestManager.createManifestFilePath(
          manifestInput ? manifestInput : "",
        );

        if (!vsCodeConfigManager.readManifestCodeDirPath()) {
          throw new Error("No code directory path set");
        }

        const codeFilePath =
          vsCodeConfigManager.createCodeFilePath(manifestInput);

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = JSON.parse(
          await initManifest(execPath, entityType, parentId, manifestPath),
        );
        if (result.success) {
          notificationManager.success("Manifest initialized successfully");
          initCodeFile(codeFilePath, manifestInput, manifestManager);
          const filePath = formatMessage(result.results);
          notificationManager.success(
            "Manifest initialized successfully at " + filePath,
          );
        } else if (result.duplicate) {
          notificationManager.error(result.message);
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
      promptManager: PromptManager,
    ) => {
      try {
        const entityType = await promptManager.promptEntityType();

        if (!entityType) {
          throw new Error("No entity type selected");
        }

        const bpmId = await promptManager.promptEntityId();
        if (!bpmId) {
          throw new Error("No entity id provided");
        }

        const parentId = await promptManager.promptParentId();
        if (!parentId) {
          throw new Error("No parent id provided");
        }

        const manifestDirPath = manifestManager.readManifestDirPath();
        if (!manifestDirPath) {
          throw new Error("No manifest directory path set");
        }

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }
        const result = await cloneManifest(
          execPath,
          entityType,
          bpmId,
          parentId,
          manifestDirPath,
        );
        const parsedResult = JSON.parse(result);
        if (parsedResult.success) {
          if (!vsCodeConfigManager.readManifestCodeDirPath()) {
            throw new Error("No manifest code directory path set");
          }
          const filePath = formatMessage(parsedResult.results);
          const codeFilePath = vsCodeConfigManager.createCodeFilePath(
            parsedResult.name,
          );
          if (parsedResult.codeLines) {
            vsCodeConfigManager.writeToCodeFile(
              codeFilePath,
              parsedResult.codeLines,
            );
            manifestManager.writeManifestCodeFilePath(
              parsedResult.name,
              codeFilePath,
            );
          }
          notificationManager.notifySuccess("Success");
          notificationManager.success(
            "Manifest cloned successfully at " +
              filePath +
              "\n" +
              "Code file initialized successfully at " +
              codeFilePath,
          );
        } else {
          notificationManager.notifyError("Error");
          notificationManager.error(parsedResult.message);
        }
      } catch (err) {
        notificationManager.error(`${err}`);
      }
    },
  },

  {
    name: "epictl.getManifests",
    callback: (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
      _promptManager: PromptManager,
    ) => {
      try {
        const manifests = manifestManager.readManifests();

        const output: string[] = [];
        if (manifests.length < 1) {
          notificationManager.error("No manifests found");
        } else {
          for (const manifest of manifests) {
            output.push(`- ${path.basename(manifest, path.extname(manifest))}`);
          }
          notificationManager.success(output.join("\n"));
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
      promptManager: PromptManager,
    ) => {
      try {
        let manifestInput = await promptManager.promptManifestName();
        if (manifestInput) {
          if (!manifestInput.endsWith(".json")) {
            manifestInput = `${manifestInput}.json`;
          }
          manifestInput = manifestManager.createManifestFilePath(manifestInput);
        }

        // if (!manifestInput.endsWith(".json")) {
        //   manifestInput = `${manifestInput}.json`;
        // }
        // manifestInput = manifestManager.createManifestFilePath(manifestInput);

        let bpmId: string | undefined;
        let entityType: string | undefined;
        let parentId: string | undefined;

        if (!manifestInput) {
          entityType = await promptManager.promptEntityType();

          if (!entityType) {
            throw new Error("No entity type selected");
          }
          bpmId = await promptManager.promptEntityId();

          if (!bpmId) {
            throw new Error("No entity id provided");
          }

          parentId = await promptManager.promptParentId();
          if (!parentId) {
            throw new Error("No parent id provided");
          }
        }
        const outputType = await promptManager.promptOutputType();
        if (!outputType) {
          throw new Error("No output type selected");
        }
        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path provided");
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
          notificationManager.notifySuccess("Bpm described successfully");
          notificationManager.write(result);
        } else if (outputType === "table") {
          notificationManager.notifySuccess("Bpm described successfully");
          notificationManager.write(result);
        }
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },
  // STOPPED UPDATING HERE ----------------------------------------------
  {
    name: "epictl.applyBpm",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const openFilename = vscode.window.activeTextEditor?.document.fileName;

        if (!openFilename) {
          throw new Error("No open filename found");
        }

        const manifestFile =
          manifestManager.findCodeFileInManifests(openFilename);

        let manifestInput: string | undefined;

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
      promptManager: PromptManager,
    ) => {
      try {
        const openFilename = vscode.window.activeTextEditor?.document.fileName;
        if (!openFilename) {
          throw new Error("No open filename found");
        }
        let manifestInput: string | undefined =
          manifestManager.findCodeFileInManifests(openFilename);

        const haveValidCodeFile = openFilename.endsWith(".cs");
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

        const selectedFields = await promptManager.promptUpdateFields(fields);
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

          flagsWithCmds.push(...formatCommand[field.key](userInput));
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
      promptManager: PromptManager,
    ) => {
      try {
        let manifestInput = await promptManager.promptManifestName();
        if (!manifestInput) {
          throw new Error("No manifest file name provided");
        }

        const manifestPath =
          manifestManager.createManifestFilePath(manifestInput);

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = JSON.parse(await deleteBpm(execPath, manifestPath));
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
      _promptManager: PromptManager,
    ) => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          throw new Error("No editor open");
        }

        const codeFilePath = editor.document.fileName;

        const targetManifest =
          manifestManager.findCodeFileInManifests(codeFilePath);

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
          codeFilePath,
          displayType,
        );

        notificationManager.write(result);
      } catch (err) {
        notificationManager.error("Error validating code");
        notificationManager.error(`${err}`);
      }
    },
  },
  {
    name: "epictl.applyCode",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
      _promptManager: PromptManager,
    ) => {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Applying code",
            cancellable: false,
          },
          async () => {
            const applyResult = await applyCode(
              vsCodeConfigManager,
              manifestManager,
            );
            if (applyResult) {
              notificationManager.success("Code applied successfully");
            } else {
              throw new Error("Failed to apply code");
            }
          },
        );
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },
];

export const stateCommands = [
  {
    name: "epictl.getManifestFromCodeFile",
    callback: async (
      stateManager: StateManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
    ) => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          throw new Error("No editor open");
        }

        const codeFilePath = editor.document.fileName;

        const manifest = manifestManager.findCodeFileInManifests(codeFilePath);
        if (!manifest) {
          throw new Error("No manifest file found");
        }

        const manifestData = manifestManager.readManifest(manifest);
        if (!manifestData) {
          throw new Error("No manifest data found");
        }

        const bpmData = manifestData.bpmConfig;

        const state = {
          ...bpmData,
          Type: "bpm",
          ParentType: manifestData.epictl.parent_type,
          ParentSysRowId:
            manifestData.epictl.parent_type === "bom"
              ? manifestData.epictl.bomId
              : manifestData.epictl.tableId,
        };

        stateManager.writeState(state);

        notificationManager.success("Found manifest data");
      } catch (err: any) {
        notificationManager.error(`${err.message}`);
      }
    },
  },
];
