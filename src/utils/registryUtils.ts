import path from "path";
import { ManifestManager } from "../managers/manifestManager";
import * as fs from "fs";
import * as vscode from "vscode";

export interface ConfigQuickPickItem extends vscode.QuickPickItem {
  id: string;
}
export const updateFileName = (
  manifestManager: ManifestManager,
  newName: string,
  oldName: string,
) => {
  if (!newName.endsWith(".json")) {
    newName = `${newName}.json`;
  }

  if (!oldName.endsWith(".json")) {
    oldName = `${oldName}.json`;
  }

  try {
    fs.renameSync(
      manifestManager.createManifestFilePath(oldName),
      manifestManager.createManifestFilePath(newName),
    );
  } catch (error) {
    throw new Error(`Error updating file name: ${error}`);
  }
};

export const updateManifestMetadataWithCodeFile = (
  manifestManager: ManifestManager,
  codeFilePath: string,
) => {
  const manifestName = path.parse(path.basename(codeFilePath)).name + ".json";

  manifestManager.writeManifestCodeFilePath(manifestName, codeFilePath);
};

// used to parse results
export const formatMessage = (results: string) => {
  return path.basename(results);
};

export const formatCliConfigResult = (result: any) => {
  result = JSON.parse(result);
  const formattedResult = [];
  for (const config of result) {
    formattedResult.push(config);
    config.password = "********";
    const apiKeyLength = config.api_key?.length;
    config.api_key = config.api_key?.slice(0, 6) + "*".repeat(apiKeyLength - 6);
  }
  return formattedResult;
};

export const initCodeFile = (
  codeFilePath: string,
  manifestInput: string,
  manifestManager: ManifestManager,
) => {
  // create a new code file it does not exis
  if (!fs.existsSync(codeFilePath)) {
    fs.writeFileSync(codeFilePath, "");
  }

  // link code file to manifest if it exists
  const manifestName = path.basename(manifestInput);
  manifestManager.writeManifestCodeFilePath(manifestName, codeFilePath);
};
