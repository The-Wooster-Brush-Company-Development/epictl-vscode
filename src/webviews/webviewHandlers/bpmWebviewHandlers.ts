import * as vscode from "vscode";

import { VsCodeConfigManager } from "../../managers/configManager";
import { ManifestManager } from "../../managers/manifestManager";
import { PromptManager } from "../../managers/promptManager";
import {
  BpmStateManagerInterface,
  StateManager,
} from "../../managers/stateManager";

import { cloneManifest, initManifest, updateBpm } from "../../commandHandlers";

import { formatCommand } from "../../utils/handlerUtils";

export const initManifestHandler = async (
  vsCodeConfigManager: VsCodeConfigManager,
  promptManager: PromptManager,
  manifestManager: ManifestManager,
  data: any,
) => {
  if (!vsCodeConfigManager.readManifestCodeDirPath()) {
    throw new Error("No code directory path set");
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  const promptResult = await promptManager.resolveInitManifest({
    entity_type: data.type,
    entity_id: data.SysRowID,
  });

  const codeFilePath = vsCodeConfigManager.createCodeFilePath(
    promptResult.manifest_name,
  );

  const manifestPath = manifestManager.createManifestFilePath(
    promptResult.manifest_name,
  );

  console.log("manifestPath: ", manifestPath);
  console.log("codeFilePath: ", codeFilePath);
  console.log("execPath: ", execPath);
  console.log("promptResult: ", promptResult);

  const initManifestResult = JSON.parse(
    await initManifest(
      execPath,
      promptResult.entity_type,
      promptResult.entity_id,
      manifestPath,
    ),
  );
  console.log("initManifestResult: ", initManifestResult);

  return {
    success: initManifestResult.success,
    result: initManifestResult.result,
    codeFilePath: codeFilePath,
    manifestPath: manifestPath,
  };
};

export const cloneManifestHandler = async (
  vsCodeConfigManager: VsCodeConfigManager,
  promptManager: PromptManager,
  manifestManager: ManifestManager,
  data: any,
) => {
  const manifestDirPath = manifestManager.readManifestDirPath();
  if (!manifestDirPath) {
    throw new Error("No manifest directory path set");
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  console.log("data: ", data);

  const promptResult = await promptManager.resolveCloneManifest(
    {
      entity_type: data.parentType,
      entity_id: data.directiveId,
      parent_id: data.parentId,
      manifest_dir_path: manifestDirPath,
    },
    manifestDirPath,
  );

  console.log("promptResult: ", promptResult);

  const cloneManifestResult = JSON.parse(
    await cloneManifest(
      execPath,
      promptResult.entity_type,
      promptResult.entity_id,
      promptResult.parent_id,
      promptResult.manifest_dir_path,
    ),
  );

  return {
    success: cloneManifestResult.success,
    result: cloneManifestResult.results,
    codeLines: cloneManifestResult.codeLines,
  };
};

export const updateFieldHandler = (message: any) => {
  switch (message.field) {
    case "Name":
      const command = formatCommand["name"](message.value);
      break;

    case "DirectiveID":
      break;
    case "BpMethodCode":
      break;
    case "IsEnabled":
      break;
  }
};
