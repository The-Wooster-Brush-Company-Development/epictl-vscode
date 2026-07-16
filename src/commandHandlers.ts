import * as vscode from "vscode";
import { exec } from "child_process";
import { VsCodeConfigManager } from "./managers/configManager";
import { ManifestManager } from "./managers/manifestManager";
import { PromptManager } from "./managers/promptManager";

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
  const command = `${execPath} config-create --base-url ${baseUrlPath} --username ${username} --password ${password} --api-key ${apiKey} --output json`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error creating config: ${stderr}`);
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  const command = `${execPath} config-get --output ${outputType}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error getting config: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve(stdout);
    });
  });
};

// sets this config to the active config
export const createConfigCli = async (
  configId: string | undefined,
  execPath: string,
): Promise<any> => {
  const command = `${execPath} config-set ${configId}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error setting config: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve(stdout);
    });
  });
};

// if we make it so the active config is the one that is set, will want to write it to the config file
// and perform all of our actions on that config
export const setConfigCli = async (
  execPath: string,
  configId: string,
): Promise<any> => {
  const command = `${execPath} config-set ${configId}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error executing ${command}: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve(stdout);
    });
  });
};

export const activeConfig = async (execPath: string): Promise<any> => {
  const command = `${execPath} config-active --output json`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error active config: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  const command = `${execPath} config-delete ${configId}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error deleting config: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  const command = `${execPath} init-manifest ${entityType} ${parentId} --file ${manifestPath} --output json`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error initializing manifest: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  const command = `${execPath} clone-manifest ${entityType} ${bpmId} ${parentId} --manifest-file ${manifestPath} --for-extension --output json`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error cloning manifest: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  const command = `${execPath} get boms --output ${outputType}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  const command = `${execPath} get tables --output ${outputType}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error getting tables: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  const command = `${execPath} describe bom --entity-id ${bomId} --output ${outputType}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error describing bom: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  const command = `${execPath} describe table --entity-id ${tableId} --output ${outputType}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error describing table: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  entityType: string | undefined,
  parentId: string | undefined,
  outputType: string,
): Promise<any> => {
  let command: string;
  if (manifestInput) {
    command = `${execPath} describe bpm --file ${manifestInput} --with-code --output ${outputType}`;
  } else {
    command = `${execPath} describe bpm --entity-id ${bpmId} --parent-type ${entityType} --parent-id ${parentId} --with-code --output ${outputType}`;
  }

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error describing bpm: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
    const command = `${execPath} apply bpm --file ${manifestPath} --output json`;
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error applying manifest: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  let command = `${execPath} update bpm --file ${manifestPath}`;
  for (const field of flagsWithCmds) {
    command += ` ${field}`;
  }
  command += " --output json";
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error updating bpm: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve(stdout);
    });
  });
};

export const deleteBpm = async (
  vsCodeConfigManager: VsCodeConfigManager,
  manifestManager: ManifestManager,
): Promise<any> => {
  let manifestInput = await vscode.window.showInputBox({
    prompt: "Enter the name of the manifest file",
    ignoreFocusOut: true,
  });
  if (!manifestInput) {
    throw new Error("No manifest file name provided");
  }

  if (!manifestInput.endsWith(".json")) {
    manifestInput = `${manifestInput}.json`;
  }

  const manifestPath = manifestManager.createManifestFilePath(manifestInput);

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  return new Promise((resolve, reject) => {
    const command = `${execPath} delete bpm --file ${manifestPath} --output json`;
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error deleting bpm: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
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
  const command = `${execPath} validate-code ${entityType} ${manifestPath} ${bodyFilePath} --output ${outputType}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error validating code: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve(stdout);
    });
  });
};
