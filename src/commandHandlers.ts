import * as vscode from "vscode";
import { execFile } from "child_process";
import { VsCodeConfigManager } from "./managers/configManager";
import { ManifestManager } from "./managers/manifestManager";
import { formatCommand } from "./utils/handlerUtils";
/**********************************************************
 * Create/Get/Delete a config file for the epictl command
 * This is the Cli config file, different from the vs code config file
 ***********************************************************
 */

// creates and sets the config as the current active config
export const createConfig = async (
  execPath: string,
  baseUrlPath: string,
  username: string,
  password: string,
  apiKey: string,
): Promise<any> => {
  const args = [
    "config-create",
    "--base-url",
    baseUrlPath,
    "--username",
    username,
    "--password",
    password,
    "--api-key",
    apiKey,
    "--output",
    "json",
  ];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

// Retrieves the config from the cli config file
// Might need to change this to not expose all of the config data
export const getConfig = async (
  execPath: string,
  outputType: string,
): Promise<any> => {
  const args = ["config-get", "--output", outputType];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const createConfigCli = async (
  configId: string,
  execPath: string,
): Promise<any> => {
  const args = ["config-set", configId];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const setConfigCli = async (
  execPath: string,
  configId: string,
): Promise<any> => {
  const args = ["config-set", configId];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const activeConfig = async (execPath: string): Promise<any> => {
  const args = ["config-active", "--output", "json"];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const deleteConfigCli = async (
  execPath: string,
  configId: string,
): Promise<any> => {
  const args = ["config-delete", configId, "--output", "json"];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

/**********************************************************
 * Set/Get/Delete the executable path for the epictl command
 ***********************************************************
 */

export const setExecPath = (
  vsCodeConfigManager: VsCodeConfigManager,
  execPath: string,
) => {
  vsCodeConfigManager.writeExecPath(execPath);
};

export const getExecPath = (vsCodeConfigManager: VsCodeConfigManager) => {
  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No path set for Epictl executable");
  }
  return execPath;
};

export const deleteExecPath = (vsCodeConfigManager: VsCodeConfigManager) => {
  vsCodeConfigManager.deleteExecPath();
};

/**********************************************************
 * Set/Get/Delete the code directory path
 ***********************************************************
 */

export const setCodeDirPath = (
  vsCodeConfigManager: VsCodeConfigManager,
  codeDirPath: string,
) => {
  vsCodeConfigManager.writeManifestCodeDirPath(codeDirPath);
};

export const getCodeDirPath = (vsCodeConfigManager: VsCodeConfigManager) => {
  const codeDirPath = vsCodeConfigManager.readManifestCodeDirPath();
  if (!codeDirPath) {
    throw new Error("No code directory path set");
  }
  return codeDirPath;
};

export const deleteCodeDirPath = (configManager: VsCodeConfigManager) => {
  configManager.deleteManifestCodeDirPath();
};

/**********************************************************
 * Set the path to the manifest files
 ***********************************************************
 */
export const setManifestDirPath = async (
  manifestManager: ManifestManager,
  userInput: string,
) => {
  manifestManager.writeManifestDirPath(userInput);
};

export const getManifestDirPath = (manifestManager: ManifestManager) => {
  const manifestDirPath = manifestManager.readManifestDirPath();
  if (!manifestDirPath) {
    throw new Error("No manifest directory path set");
  }
  return manifestDirPath;
};

export const deleteLocalManifest = async (
  manifestManager: ManifestManager,
  manifestInput: string[],
) => {
  manifestInput.forEach((manifest) => {
    manifestManager.deleteManifest(manifest);
  });

  return manifestInput;
};

/**********************************************************
 * Add/Delete code files to/from a manifest
 ***********************************************************
 */

export const addFileToManifest = (
  manifestManager: ManifestManager,
  manifestName: string,
  filePath: string,
) => {
  manifestManager.writeManifestCodeFilePath(manifestName, filePath);
};

export const deleteCodeFileFromManifest = (
  manifestManager: ManifestManager,
  manifestName: string,
  filePath: string,
) => {
  manifestManager.deleteCodeFileFromManifest(manifestName, filePath);
};

/**********************************************************
 * Initialize/Clone a manifest for a given entity type and parent id
 ***********************************************************
 */

export const initManifest = async (
  execPath: string,
  entityType: string,
  parentId: string,
  manifestPath: string,
): Promise<any> => {
  //const command = `${execPath} init-manifest ${entityType} ${parentId} --file ${shellQuote(manifestPath)} --output json`;
  const args = [
    "init-manifest",
    entityType,
    parentId,
    "--file",
    manifestPath,
    "--output",
    "json",
  ];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const cloneManifest = async (
  execPath: string,
  entityType: string,
  bpmId: string,
  parentId: string,
  manifestPath: string,
): Promise<any> => {
  const args = [
    "clone-manifest",
    entityType,
    bpmId,
    parentId,
    "--manifest-file",
    manifestPath,
    "--for-extension",
    "--output",
    "json",
  ];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

/**********************************************************
 * Get the boms/tables for a given entity type and parent id
 ***********************************************************
 */

export const getBoms = async (
  execPath: string,
  outputType: string,
): Promise<any> => {
  const args = ["get", "boms", "--output", outputType];

  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const getTables = async (
  execPath: string,
  outputType: string,
): Promise<any> => {
  const args = ["get", "tables", "--output", outputType];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

/**********************************************************
 * Describe a bom/table for a given entity type and entity id
 ***********************************************************
 */

export const describeBom = async (
  execPath: string,
  bomId: string,
  outputType: string,
): Promise<any> => {
  //const command = `${execPath} describe bom --entity-id ${bomId} --output ${outputType}`;
  const args = [
    "describe",
    "bom",
    "--entity-id",
    bomId,
    "--output",
    outputType,
  ];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const describeTable = async (
  execPath: string,
  tableId: string,
  outputType: string,
): Promise<any> => {
  //const command = `${execPath} describe table --entity-id ${tableId} --output ${outputType}`;
  const args = [
    "describe",
    "table",
    "--entity-id",
    tableId,
    "--output",
    outputType,
  ];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

/**********************************************************
 * Describe a bpm for a given bpm id, entity type (bom/table) and parent id
 ***********************************************************
 */

export const describeBpm = async (
  execPath: string,
  manifestInput: string | undefined,
  bpmId: string | undefined,
  parentType: string | undefined,
  parentId: string | undefined,
  outputType: string,
): Promise<any> => {
  let args: string[];
  if (manifestInput) {
    args = [
      "describe",
      "bpm",
      "--file",
      manifestInput,
      "--with-code",
      "--output",
      outputType,
    ];
  } else {
    if (!bpmId || !parentType || !parentId) {
      throw new Error(
        "entity id, parent type, and parent id are required when no manifest file is provided",
      );
    }
    args = [
      "describe",
      "bpm",
      "--entity-id",
      bpmId,
      "--parent-type",
      parentType,
      "--parent-id",
      parentId,
      "--with-code",
      "--output",
      outputType,
    ];
  }

  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

/**********************************************************
 * Apply a bom/table for a given entity type and entity id
 ***********************************************************
 */

export const applyBpm = async (
  execPath: string,
  manifestPath: string,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const args = ["apply", "bpm", "--file", manifestPath, "--output", "json"];
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const updateBpm = async (
  execPath: string,
  manifestPath: string,
  flagsWithCmds: string[],
): Promise<any> => {
  let args = ["update", "bpm", "--file", manifestPath];
  for (const field of flagsWithCmds) {
    args.push(field);
  }
  args.push("--output", "json");

  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const deleteBpm = async (
  execPath: string,
  manifestPath: string,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const args = ["delete", "bpm", "--file", manifestPath, "--output", "json"];
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

/**********************************************************
 * Validate the code for a given entity type and entity id
 ***********************************************************
 */

export const validateCode = async (
  execPath: string,
  entityType: string,
  manifestPath: string,
  bodyFilePath: string,
  outputType: string,
): Promise<any> => {
  const args = [
    "validate-code",
    entityType,
    manifestPath,
    bodyFilePath,
    "--output",
    outputType,
  ];
  return new Promise((resolve, reject) => {
    execFile(execPath, args, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(`${stderr}`));
        return;
      }
      if (error) {
        reject(new Error(`${error}`));
        return;
      }
      resolve(stdout);
    });
  });
};

export const applyCode = async (
  vsCodeConfigManager: VsCodeConfigManager,
  manifestManager: ManifestManager,
): Promise<any> => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    throw new Error("No editor open");
  }

  const code = editor.document.getText();
  if (!code) {
    throw new Error("No code found");
  }

  await editor.document.save();

  const codeFilePath = editor.document.fileName;
  if (!codeFilePath) {
    throw new Error("No code file path found");
  }

  const targetManifest = manifestManager.isCodeFileInManifests(codeFilePath);
  if (!targetManifest) {
    throw new Error("No manifest file found");
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  const entityType =
    manifestManager.readManifest(targetManifest).epictl.parent_type;
  const manifestPath = manifestManager.createManifestFilePath(targetManifest);
  const bodyFilePath = codeFilePath;

  const validateResult = await validateCode(
    execPath,
    entityType,
    manifestPath,
    bodyFilePath,
    "table",
  );

  if (!validateResult.includes("No errors")) {
    throw new Error(validateResult);
  }

  // update bpm
  const updateResult = JSON.parse(
    await updateBpm(
      execPath,
      manifestPath,
      formatCommand["codefile"](codeFilePath),
    ),
  );
  if (!updateResult.success) {
    throw new Error(updateResult.message);
  }
  // apply update
  const applyResult = JSON.parse(await applyBpm(execPath, manifestPath));
  if (applyResult.success) {
    return true;
  }
  throw new Error(applyResult.message);
};
