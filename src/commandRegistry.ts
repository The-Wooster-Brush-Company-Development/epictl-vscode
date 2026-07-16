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
  ConfigQuickPickItem,
} from "./utils/registryUtils";
import { PromptManager } from "./managers/promptManager";

export const vsCodeConfigCommands = [
  {
    name: "epictl.setExecPath",
    callback: async (
      vsCodeConfigManager: VsCodeConfigManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const execPath = await promptManager.promptExecPath();
        if (!execPath) {
          throw new Error("No exec path provided");
        }
        setExecPath(vsCodeConfigManager, execPath);
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
        const codeDirPath = await promptManager.promptCodeDirPath();
        if (!codeDirPath) {
          throw new Error("No code directory path provided");
        }
        setCodeDirPath(vsCodeConfigManager, codeDirPath);
        notificationManager.success("Code directory path set successfully");
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

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }
        const result = JSON.parse(
          await createConfig(execPath, baseUrlPath, username, password, apiKey),
        );
        if (result.success) {
          notificationManager.success(result.message);
          if (result.config_id) {
            try {
              const message = await setConfigCli(result.config_id, execPath);
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
            label: `${path.basename(config.base_url)} : ${config.id.slice(0, 6)}`,
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
        const result = await deleteConfigCli(execPath, selection.id);
        notificationManager.success(result);
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

      try {
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

export const manifestCommands = [
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

  {
    name: "epictl.deleteLocalManifest",
    callback: async (
      _vsCodeConfigManager: VsCodeConfigManager,
      manifestManager: ManifestManager,
      notificationManager: NotificationManager,
      promptManager: PromptManager,
    ) => {
      try {
        const manifestFIles = manifestManager.getManifests();

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
      //TODO: Eventually, will want to change this so that only have to provide one name (manifest/code file)
      // and use it in both places, manifest name and code file name
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

        const codeFilePath = vscode.Uri.joinPath(
          vscode.Uri.parse(vsCodeConfigManager.readManifestCodeDirPath()!),
          manifestInput.split(".")[0] + ".cs",
        );

        console.log("codeFilePath: ", codeFilePath.fsPath);
        console.log("codefilePath: ", codeFilePath);

        const execPath = vsCodeConfigManager.readExecPath();
        if (!execPath) {
          throw new Error("No exec path set");
        }

        const result = JSON.parse(
          await initManifest(execPath, entityType, parentId, manifestPath),
        );
        if (result.success) {
          notificationManager.success("Manifest initialized successfully");
          initCodeFile(codeFilePath.fsPath, manifestInput, manifestManager);
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
      const entityType = await promptManager.promptEntityType();

      if (!entityType) {
        throw new Error("No entity type selected");
      }

      const bpmId = await promptManager.promptEntityId();
      if (!bpmId) {
        throw new Error("No entity id provided");
      }

      const parentId = await promptManager.promptEntityId();
      if (!parentId) {
        throw new Error("No parent id provided");
      }
      let manifestInput = await promptManager.promptManifestName();
      if (!manifestInput) {
        throw new Error("No manifest name provided");
      }

      const manifestPath = manifestManager.createManifestFilePath("");

      let codeFilePath = await promptManager.promptCodeFilePath();
      if (!codeFilePath) {
        throw new Error("No code file path provided");
      }

      const execPath = vsCodeConfigManager.readExecPath();
      if (!execPath) {
        throw new Error("No exec path set");
      }

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
      promptManager: PromptManager,
    ) => {
      try {
        const manifests = manifestManager.getManifests();

        const output: string[] = [];
        if (manifests.length < 1) {
          notificationManager.error("No manifests found");
        } else {
          for (const manifest of manifests) {
            output.push(`- ${manifest}`);
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
        if (!manifestInput) {
          throw new Error("No manifest name provided");
        }

        if (!manifestInput.endsWith(".json")) {
          manifestInput = `${manifestInput}.json`;
        }
        manifestInput = manifestManager.createManifestFilePath(manifestInput);

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
          notificationManager.success("Bpm described successfully");
        } else if (outputType === "table") {
          notificationManager.success("Bpm described successfully");
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
      promptManager: PromptManager,
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
      promptManager: PromptManager,
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
      promptManager: PromptManager,
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
