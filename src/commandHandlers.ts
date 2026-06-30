import * as vscode from "vscode";
import * as path from"path";
import { exec } from "child_process";
import { manifestDirPath, formatCommand, fields} from "./utils/handlerUtils";
import { VsCodeConfigManager } from "./managers/configManager";
import { ManifestManager } from "./managers/manifestManager";
import { stringify } from "querystring";

const CONFIG_SECTION = "epictl";
const CONFIG_KEY_EXEC_PATH = "command_path";
const CONFIG_KEY_MANIFEST_DIR_PATH = "manifest_dir_path";
//const EXEC_PATH = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
//const MANIFEST_DIR_PATH = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_MANIFEST_DIR_PATH);


//TODO: Just removed all of exec path checks, migrating to use config file instead, 
// will have cli throw error if exec path is not set and see what error is thrown


/**********************************************************
 * Create/Get/Delete a config file for the epictl command
 * This is the Cli config file, different from the vs code config file
 ***********************************************************
 */

// creates and sets the config as the current active config
export const createConfig = async(vsCodeConfigManager: VsCodeConfigManager): Promise<any> => {

  const baseUrlPath = await vscode.window.showInputBox({
    prompt: "Enter the base url path",
    ignoreFocusOut: true,
  });
  if (!baseUrlPath) {
    throw new Error("No base url path provided");
  }
  
  const username = await vscode.window.showInputBox({
    prompt: "Enter the username",
    ignoreFocusOut: true,
  });
  if (!username) {
    throw new Error("No username provided");
  }
  
  const password = await vscode.window.showInputBox({
    prompt: "Enter the password",
    ignoreFocusOut: true,
  });
  if (!password) {
    throw new Error("No password provided");
  }

  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter the api key",
    ignoreFocusOut: true,
  });
  if (!apiKey) {
    throw new Error("No api key provided");
  }

  return new Promise((resolve, reject) => {
    const command = `${getExecPath(vsCodeConfigManager)} config-create --base-url ${baseUrlPath} --username ${username} --password ${password} --api-key ${apiKey} --output json`;
    
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
}

//TODO: this is getting the cli config file, not the vs code config file
 export const getConfig = () => {
   console.log("To do: get config");
 }

 // sets this config to the active config
 export const setConfig = async (configId: string | undefined, vsCodeConfigManager: VsCodeConfigManager): Promise<any> => {

  if (!configId) {
    configId = await vscode.window.showInputBox({
      prompt: "Enter the config id",
      ignoreFocusOut: true,
    });
  }

  if (!configId) {
    throw new Error("No config id provided");
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }
  const command = `${execPath} config-set ${configId}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error setting config: ${stderr}`);
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
      }
      resolve(stdout);
    }); 
  });
 }



/**********************************************************
 * Set/Get/Delete the executable path for the epictl command
 ***********************************************************
 */

export const setExecPath = async (vsCodeConfigManager: VsCodeConfigManager) => {
  const execPath = await vscode.window.showInputBox({
    prompt: "Enter the path to the epictl executable",
    ignoreFocusOut: true,
  });
  if (!execPath) {
    throw new Error("No path provided");
  }

  vsCodeConfigManager.writeExecPath(execPath);
}

export const getExecPath = (vsCodeConfigManager: VsCodeConfigManager) => {
  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No path set for Epictl executable");
  }
  return execPath;
}

export const deleteExecPath = (vsCodeConfigManager: VsCodeConfigManager) => {
    vsCodeConfigManager.deleteExecPath();
}

/**********************************************************
 * Set the path to the manifest files
 ***********************************************************
 */
export const setManifestDirPath = async (manifestManager: ManifestManager) => {
  const userInput = await vscode.window.showInputBox({
    prompt: "Enter the path to the manifest files",
    ignoreFocusOut: true,
  });
  const outputChannel = vscode.window.createOutputChannel("Epictl");
  if (userInput) {
    vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .update(
      CONFIG_KEY_MANIFEST_DIR_PATH, 
      userInput, vscode.ConfigurationTarget.Global
    );
    vscode.window.showInformationMessage(`Manifest Dir path set successfully`);
    outputChannel.appendLine(`Manifest Dir path set successfully`);
  }
  else {
    vscode.window.showErrorMessage("No path provided");
  }
  outputChannel.show();
}

export const getManifestDirPath = (manifestManager: ManifestManager) => {
  const manifestDirPath = manifestManager.readManifestDirPath();
  if (!manifestDirPath) {
    throw new Error("No manifest directory path set");
  }
  return manifestDirPath;
}

export const deleteManifestDirPath = (manifestManager: ManifestManager) => {
  try {
    vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .update(
      CONFIG_KEY_MANIFEST_DIR_PATH,
      "",
      vscode.ConfigurationTarget.Global,
    );
    vscode.window.showInformationMessage(`Manifest Dir path deleted`);
  } catch (error) {
    vscode.window.showErrorMessage(`Error deleting Manifest Dir path: ${error}`);
  }
}

/**********************************************************
 * Initialize/Clone a manifest for a given entity type and parent id
 ***********************************************************
 */

export const initManifest = async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager): Promise<any> =>{
  // get the entity type
  const entityType = await vscode.window.showQuickPick([
    "bom",
    "table",
  ], {
    placeHolder: "Select the entity type",
  });

  if (!entityType) {
    throw new Error("No entity type selected");
  }

  // get the parent id
  const parentId = await vscode.window.showInputBox({
    prompt: "Enter the parent id",
    ignoreFocusOut: true,
  });

  if (!parentId) {
    throw new Error("No parent id provided");
  }

  let manifestInput = await vscode.window.showInputBox({
    prompt: "enter the name of the manifest file",
    ignoreFocusOut: true,
  });
  if (!manifestInput) {
    throw new Error("No manifest file name provided");
  }

  if (!manifestInput.endsWith(".json")) {
   manifestInput = `${manifestInput}.json`;
  }

  const manifestPath = manifestManager.createManifestFilePath(manifestInput);
  console.log("manifestPath", manifestPath);

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }
  const command = `${execPath} init-manifest ${entityType} ${parentId} --file ${manifestPath} --output json`;
  console.log("command", command);
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      console.log("stdout", stdout);
      console.log("stderr", stderr);
      console.log("error", error);
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
}

//TODO: Need to fix this function, not handling manifest path correctly
export const cloneManifest = async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager): Promise<any> => {
  const entityType = await vscode.window.showQuickPick([
    "bom",
    "table",
  ], {
    placeHolder: "Select the entity type",
  });

  if (!entityType) {
    throw new Error("No entity type selected");
  }

  const bpmId = await vscode.window.showInputBox({
    prompt: "Enter the bpm id",
    ignoreFocusOut: true,
  });
  if (!bpmId) {
    throw new Error("No bpm id provided");
  }

  const parentId = await vscode.window.showInputBox({
    prompt: "Enter the parent id",
    ignoreFocusOut: true,
  });
  if (!parentId) {
    throw new Error("No parent id provided");
  }

  let manifestInput: string | undefined;
  manifestInput = await vscode.window.showInputBox({
    prompt: "(optional) enter the name of the new manifest file",
    ignoreFocusOut: true,
  });

  if (manifestInput) {
    if (!manifestInput.endsWith(".json")) {
      manifestInput = `${manifestInput}.json`;
    }
  } else {
    manifestInput = "";
  }

  const manifestPath = manifestManager.createManifestFilePath(manifestInput);

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }
  return new Promise((resolve, reject) => {
    const command = `${execPath} clone-manifest ${entityType} ${bpmId} ${parentId} --file ${manifestPath} --output json`;
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
  })
}

/**********************************************************
 * Get the boms/tables for a given entity type and parent id
 ***********************************************************
 */

export const getBoms = async(vsCodeConfigManager: VsCodeConfigManager): Promise<any> => {

  const outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  return new Promise((resolve, reject) => {
    const command = `${execPath} get boms --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      console.log("stdout", stdout);
      console.log("stderr", stderr);
      console.log("error", error);
      if (stderr) {
        reject(`${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve([stdout, outputType]);
    });
  });
};

export const getTables = async (vsCodeConfigManager: VsCodeConfigManager): Promise<any> => {
  const outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  return new Promise((resolve, reject) => {
    const command = `${execPath} get tables --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error getting tables: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve([stdout, outputType]);
    });
  });
};

/**********************************************************
 * Describe a bom/table for a given entity type and entity id
 ***********************************************************
 */

 export const describeBom = async (vsCodeConfigManager: VsCodeConfigManager): Promise<any> => {

  const bomId = await vscode.window.showInputBox({
    prompt: "Enter the bom id",
    ignoreFocusOut: true,
  });
  if (!bomId) {
    throw new Error("No bom id provided");
  }

  const outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  return new Promise((resolve, reject) => {
    const command = `${execPath} describe bom --entity-id${bomId} --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error describing bom: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve([stdout, outputType]);
    });
  })
 }

 
 export const describeTable = async (vsCodeConfigManager: VsCodeConfigManager): Promise<any> => {

  const tableId = await vscode.window.showInputBox({
    prompt: "Enter the table id",
    ignoreFocusOut: true,
  });
  if (!tableId) {
    throw new Error("No table id provided");
  }

  const outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  return new Promise((resolve, reject) => {
    const command = `${execPath} describe table --entity-id ${tableId} --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error describing table: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve([stdout, outputType]);
    });
  })
 }

 
/**********************************************************
 * Describe a bpm for a given bpm id, entity type (bom/table) and parent id
 ***********************************************************
 */

export const describeBpm = async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager): Promise<any> => {
  let manifestInput = await vscode.window.showInputBox({
    prompt: "(optional) enter the name of the manifest file", 
    ignoreFocusOut: true
  }) 

  if (manifestInput) {
    if (!manifestInput.endsWith(".json")) {
      manifestInput = `${manifestInput}.json`;
    }
  }

  let bpmId: string | undefined;
  let entityType: string | undefined;
  let parentId: string | undefined;

  if (!manifestInput) {
    bpmId = await vscode.window.showInputBox({
      prompt: "Enter the bpm id",
      ignoreFocusOut: true,
    });

    if (!bpmId) {
      throw new Error("No bpm id provided");
    }

    entityType = await vscode.window.showQuickPick([
      "bom",
      "table",
    ], {
    placeHolder: "Select the entity type",
    });


    parentId = await vscode.window.showInputBox({
      prompt: "Enter the parent id",
      ignoreFocusOut: true,
    });
  }

  const outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }
  
  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  let command: string;
  if (manifestInput) {
    command = `${execPath} describe bpm --file ${manifestManager.createManifestFilePath(manifestInput)} --output ${outputType}`
  } else {
    command = `${execPath} describe bpm --entity-id ${bpmId} --parent-type ${entityType} --parent-id ${parentId} --output ${outputType}`;
  }

  const manifests = manifestManager.getAllManifests();
  console.log("manifests", manifests);
  console.log("command", command);

  return new Promise((resolve, reject) => {

    console.log("command", command)
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        
        reject(`Error describing bpm: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve([stdout, outputType]);
    });
  });
}

/**********************************************************
 * Apply a bom/table for a given entity type and entity id
 ***********************************************************
 */

export const applyBpm = async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager): Promise<any> => {
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
}

export const updateBpm = async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager): Promise<any> => {

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

  const flagsWithCmds: string[] = [];

  const selectedFields = await vscode.window.showQuickPick(fields, {
    canPickMany: true,
    placeHolder: "Select the fields you want to update",
  });

  if (!selectedFields) {
    throw new Error("No fields selected");
  }


  for (const field of selectedFields) {
    const value = await vscode.window.showInputBox({
      prompt: `Enter the value for ${field.label}`,
      ignoreFocusOut: true,
    });
    if (!value) {
      throw new Error(`No value provided for ${field.label}`);
    }

    flagsWithCmds.push(formatCommand[field.key](value));
   
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  return new Promise((resolve, reject) => {
    let command = `${execPath} update bpm --file ${manifestPath}`;
    for (const field of flagsWithCmds) {
      command += ` ${field}`
    }
    command += " --output json";

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
}

export const deleteBpm = async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager): Promise<any> => {

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
}

/**********************************************************
 * Validate the code for a given entity type and entity id
 ***********************************************************
 */

export const validateCode = async (vsCodeConfigManager: VsCodeConfigManager, manifestManager: ManifestManager): Promise<any> => {
  const entityType = await vscode.window.showQuickPick([
    "bom",
    "table",
  ], {
    placeHolder: "Select the entity type",
  });
  if (!entityType) {
    throw new Error("No entity type selected");
  }

  
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

  const bodyFilePath = await vscode.window.showInputBox({
    prompt: "Enter the path to the body file",
    ignoreFocusOut: true,
  });
  if (!bodyFilePath) {
    throw new Error("No body file path provided");
  }
  
  const outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });
  if (!outputType) {
    throw new Error("No output type selected");
  }

  const execPath = vsCodeConfigManager.readExecPath();
  if (!execPath) {
    throw new Error("No exec path set");
  }

  return new Promise((resolve, reject) => {
    const command = `${execPath} validate-code ${entityType} ${manifestPath} ${bodyFilePath} --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error validating code: ${stderr}`);
        return;
      }
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      resolve([stdout, outputType]);
    });
  });
}