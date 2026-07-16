import * as vscode from "vscode";

import { VsCodeConfigManager } from "../../managers/configManager";
import { ManifestManager } from "../../managers/manifestManager";
import { NotificationManager } from "../../managers/notificationManager";
import { PromptManager } from "../../managers/promptManager";
import { StateManager } from "../../managers/stateManager";

import { initManifest } from "../../commandHandlers";

export const initManifestHandler = async (
  vsCodeConfigManager: VsCodeConfigManager,
  stateManager: StateManager,
  promptManager: PromptManager,
  manifestManager: ManifestManager,
) => {
  if (!vsCodeConfigManager.readManifestCodeDirPath()) {
    throw new Error("No code directory path set");
  }
  const state = stateManager.readState();

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  const promptResult = await promptManager.resolveInitManifest(state);

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
