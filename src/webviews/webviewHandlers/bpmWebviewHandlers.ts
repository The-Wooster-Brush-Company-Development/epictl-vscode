import * as vscode from "vscode";

import { VsCodeConfigManager } from "../../managers/configManager";
import { ManifestManager } from "../../managers/manifestManager";
import { PromptManager } from "../../managers/promptManager";

import {
  applyBpm,
  cloneManifest,
  deleteBpm,
  describeBpm,
  initManifest,
  updateBpm,
} from "../../commandHandlers";

import { formatCommand } from "../../utils/handlerUtils";
import { updateFileName } from "../../utils/registryUtils";
import {
  StateManager,
  BpmStateManagerInterface,
} from "../../managers/stateManager";

interface UpdateDataInterface {
  manifest_name: string;
  directivetype: string;
  description: string;
  group: string;
  order: string;
  scope: string;
}

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

  const initManifestResult = JSON.parse(
    await initManifest(
      execPath,
      promptResult.entity_type,
      promptResult.entity_id,
      manifestPath,
    ),
  );

  if (!initManifestResult.success) {
    return {
      success: false,
      duplicate: initManifestResult.duplicate,
      message: initManifestResult.message,
      result: initManifestResult.results ?? initManifestResult.result,
      codeFilePath,
      manifestPath,
    };
  }

  const updateFields: string[] = [];
  const formatKeyByField: Partial<
    Record<keyof UpdateDataInterface, keyof typeof formatCommand>
  > = {
    manifest_name: "name",
    directivetype: "directivetype",
    description: "description",
    group: "group",
    order: "order",
    scope: "visibilityscope",
  };

  for (const field of Object.keys(
    formatKeyByField,
  ) as (keyof UpdateDataInterface)[]) {
    const value = promptResult[field as keyof typeof promptResult];
    const formatKey = formatKeyByField[field];
    if (value !== undefined && formatKey) {
      updateFields.push(...formatCommand[formatKey](String(value)));
    }
  }

  const updateResult = JSON.parse(
    await updateBpm(execPath, manifestPath, updateFields),
  );
  if (!updateResult.success) {
    throw new Error(updateResult.message);
  }

  const applyResult = JSON.parse(await applyBpm(execPath, manifestPath));
  if (!applyResult.success) {
    throw new Error(applyResult.message);
  }

  return {
    success: initManifestResult.success,
    result: initManifestResult.result,
    duplicate: initManifestResult.duplicate,
    message: initManifestResult.messasge,
    codeFilePath: codeFilePath,
    manifestPath: manifestPath,
    updateResult: updateResult,
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

  const promptResult = await promptManager.resolveCloneManifest(
    {
      entity_type: data.parentType,
      entity_id: data.directiveId,
      parent_id: data.parentId,
      manifest_dir_path: manifestDirPath,
    },
    manifestDirPath,
  );

  const cloneManifestResult = JSON.parse(
    await cloneManifest(
      execPath,
      promptResult.entity_type,
      promptResult.entity_id,
      promptResult.parent_id,
      promptResult.manifest_dir_path,
    ),
  );

  return cloneManifestResult;
};

export const updateFieldHandler = async (
  execPath: string,
  message: any,
  manifestManager: ManifestManager,
) => {
  // First check if we have a manifest file for the bpm the user wants to update
  let manifest: any | undefined;
  try {
    manifest = manifestManager.readManifest(message.name);
  } catch (error: any) {
    throw new Error("Manifest must exist before updating a field");
  }
  if (!manifest) {
    throw new Error("Manifest not found");
  }
  const manifestFilePath = manifestManager.createManifestFilePath(message.name);

  const flag = formatCommand[
    message.field.toLowerCase() as keyof typeof formatCommand
  ](message.value);

  const updateResult = JSON.parse(
    await updateBpm(execPath, manifestFilePath, flag),
  );

  let currentName = message.name;
  if (
    updateResult.success &&
    message.field.toLowerCase() === "name" &&
    message.value !== message.name
  ) {
    updateFileName(manifestManager, message.value, message.name);
    currentName = message.value;
  }

  return {
    success: updateResult.success,
    name: currentName,
    successMessage: `Updated ${currentName}`,
    errorMessage: updateResult.message,
  };
};

export const applyBpmHandler = async (
  execPath: string,
  message: any,
  manifestManager: ManifestManager,
) => {
  const manifest = manifestManager.readManifest(message.name);
  if (!manifest) {
    throw new Error("Manifest not found");
  }
  const manifestFilePath = manifestManager.createManifestFilePath(message.name);
  const applyResult = await applyBpm(execPath, manifestFilePath);
  return applyResult;
};

export const openCodeFileHandler = async (
  manifestManager: ManifestManager,
  manifestName: string,
) => {
  let manifest: any | undefined;
  try {
    manifest = manifestManager.readManifest(manifestName);
  } catch (error: any) {
    throw new Error("No code file found for manifest: " + manifestName);
  }
  if (!manifest) {
    throw new Error("Manifest not found");
  }

  const codeFilePaths = manifest.epictl?.code_file ?? [];
  if (!codeFilePaths || codeFilePaths.length < 1) {
    throw new Error("No code file found for manifest: " + manifestName);
  }
  for (const filePath of codeFilePaths) {
    if (filePath.includes(manifestName)) {
      return filePath;
    }
  }
  throw new Error("Code file not found");
};

export const deleteBpmHandler = async (
  execPath: string,
  manifestPath: string,
  promptManager: PromptManager,
) => {
  const confirm = await promptManager.promptConfirm();
  if (!confirm) {
    throw new Error("User did not confirm");
  }
  if (confirm.toLowerCase() !== "yes") {
    throw new Error("User did not confirm");
  }

  const result = JSON.parse(await deleteBpm(execPath, manifestPath));
  if (!result.success) {
    throw new Error(result.message);
  }
  return result;
};

export const refreshBpm = async (
  execPath: string,
  vsCodeConfigManager: VsCodeConfigManager,
  stateManager: StateManager,
  manifestManager: ManifestManager,
): Promise<any> => {
  console.log("refreshing bpm");
  const currentState = stateManager.readState();
  if (!currentState) {
    throw new Error("No state found");
  }

  if (currentState.Type !== "bpm") {
    throw new Error("Current state is not a bpm");
  }

  if (
    !currentState.DirectiveID ||
    !currentState.ParentType ||
    !currentState.ParentSysRowId
  ) {
    throw new Error("BPM state is missing directive or parent identifiers");
  }

  // Not using manifest manager want to get most recent data from the server
  const newState = JSON.parse(
    await describeBpm(
      execPath,
      undefined,
      currentState.DirectiveID,
      currentState.ParentType,
      currentState.ParentSysRowId,
      "json",
    ),
  );

  console.log("new state type: ", newState.Type);
  console.log("newState: ", newState);

  return newState;
};

export const refreshBpmHandler = async (
  execPath: string,
  stateManager: StateManager,
): Promise<any> => {
  console.log("refreshing bpm");
  const currentState = stateManager.readState() as BpmStateManagerInterface;
  if (!currentState) {
    throw new Error("No state found");
  }

  if (currentState.Type !== "bpm") {
    throw new Error("Current state is not a bpm");
  }

  // Not using manifest manager want to get most recent data from the server
  const newState = JSON.parse(
    await describeBpm(
      execPath,
      undefined,
      currentState.DirectiveID,
      currentState.ParentType,
      currentState.ParentSysRowId,
      "json",
    ),
  ) as BpmStateManagerInterface;

  console.log("new state type: ", typeof newState);
  console.log("newState: ", newState);

  newState.Type = "bpm";
  newState.ParentType = currentState.ParentType;
  newState.ParentSysRowId = currentState.ParentSysRowId;

  return newState;
};
