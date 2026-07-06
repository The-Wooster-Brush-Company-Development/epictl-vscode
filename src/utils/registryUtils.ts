import path from "path";
import { ManifestManager } from "../managers/manifestManager";
import * as fs from "fs";

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

export const initCodeFile = (
  codeData: string,
  codeFilePath: string,
  fileName: string,
) => {
  const stats = fs.statSync(codeFilePath);

  fileName = fileName.endsWith(".cs") ? fileName : `${fileName}.cs`;

  if (stats.isDirectory()) {
    codeFilePath = path.join(codeFilePath, fileName);
  } else {
    codeFilePath = path.join(path.dirname(codeFilePath), fileName);
  }

  fs.writeFileSync(codeFilePath, codeData);
  return codeFilePath;
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
  const parsedResult = JSON.parse(result)[0];

  //format password
  parsedResult.password = "********";

  //format api key
  const apiKeyLength = parsedResult.api_key?.length;
  parsedResult.api_key =
    parsedResult.api_key?.slice(0, 6) + "*".repeat(apiKeyLength - 6);

  return parsedResult;
};
