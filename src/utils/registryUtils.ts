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
  console.log(`CODE DATA TEST: ${codeData}`);
  console.log(`CODE FILE PATH TEST: ${codeFilePath}`);

  const stats = fs.statSync(codeFilePath);

  fileName = fileName.endsWith(".cs") ? fileName : `${fileName}.cs`;

  if (stats.isDirectory()) {
    codeFilePath = path.join(codeFilePath, fileName);
  } else {
    codeFilePath = path.join(path.dirname(codeFilePath), fileName);
  }

  console.log(`CODE FILE PATH TEST: ${codeFilePath}`);
  fs.writeFileSync(codeFilePath, codeData);
  return codeFilePath;
};

export const updateManifestMetadataWithCodeFile = (
  manifestManager: ManifestManager,
  codeFilePath: string,
) => {
  const manifestName = path.parse(path.basename(codeFilePath)).name + ".json";
  console.log(`MANIFEST NAME TEST: ${manifestName}`);

  manifestManager.writeManifestCodeFilePath(manifestName, codeFilePath);

  console.log(
    `MANIFEST AFTER CODE FILE PATH UPDATE: ${JSON.stringify(manifestManager.readManifest(manifestName))}`,
  );
};
