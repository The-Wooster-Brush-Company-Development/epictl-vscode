import * as vscode from "vscode";

import { VsCodeConfigManager } from "../../managers/configManager";
import { ManifestManager } from "../../managers/manifestManager";
import { PromptManager } from "../../managers/promptManager";

import {
  applyBpm,
  cloneManifest,
  initManifest,
  updateBpm,
} from "../../commandHandlers";

import { formatCommand } from "../../utils/handlerUtils";
import { updateFileName } from "../../utils/registryUtils";

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

  return {
    success: cloneManifestResult.success,
    result: cloneManifestResult.results,
    codeLines: cloneManifestResult.codeLines,
  };
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
    await updateBpm(execPath, manifestFilePath, [flag]),
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
  console.log("applyResult: ", applyResult);
  return applyResult;
};
