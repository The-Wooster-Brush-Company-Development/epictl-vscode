import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from"path";
import { checkManifestDirPath, formatCommand, fields } from "./utils/handlerUtils";

const CONFIG_SECTION = "epictl";
const CONFIG_KEY_EXEC_PATH = "command_path";
const CONFIG_KEY_MANIFEST_DIR_PATH = "manifest_dir_path";
const EXEC_PATH = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
const MANIFEST_DIR_PATH = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_MANIFEST_DIR_PATH);


/**********************************************************
 * Set/Get/Delete the executable path for the epictl command
 ***********************************************************
 */

export const setExecPath = async () => {
    const userInput = await vscode.window.showInputBox({
        prompt: "Enter the path to the epictl executable",
        ignoreFocusOut: true,
      });
      if (userInput) {
        vscode.workspace
          .getConfiguration(CONFIG_SECTION)
          .update(
            CONFIG_KEY_EXEC_PATH,
            userInput,
            vscode.ConfigurationTarget.Global,
          );
        vscode.window.showInformationMessage(
          `Epictl executable path set to: ${userInput}`,
        );
      }
      else {
        vscode.window.showErrorMessage("No path provided");
      }
}

export const getExecPath = async () => {
    const outputChannel = vscode.window.createOutputChannel("Epictl");
    if (EXEC_PATH) {
       outputChannel.appendLine(`Epictl executable path: ${EXEC_PATH}`);
       vscode.window.showInformationMessage("Epictl executable path found");

    }
    else {
        outputChannel.appendLine("No path set for Epictl executable");
        vscode.window.showErrorMessage("No path set for Epictl executable");
    }
    outputChannel.show();
}

export const deleteExecPath = () => {
    vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .update(
      CONFIG_KEY_EXEC_PATH,
      "",
      vscode.ConfigurationTarget.Global,
    );
  vscode.window.showInformationMessage(
    `Epictl executable path deleted`,
  );
}

/**********************************************************
 * Set the path to the manifest files
 ***********************************************************
 */
export const setManifestDirPath = async () => {
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

export const getManifestDirPath = async () => {
  const outputChannel = vscode.window.createOutputChannel("Epictl");
  if (MANIFEST_DIR_PATH) {
    outputChannel.appendLine(`Manifest files path: ${MANIFEST_DIR_PATH}`);
    vscode.window.showInformationMessage(`Manifest Dir path found`);
  }
  else {
    vscode.window.showErrorMessage("No path set for Manifest Dir");
  }
  outputChannel.show();
}

export const deleteManifestDirPath = () => {
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

export const initManifest = async (): Promise<any> =>{
  if (!EXEC_PATH) {
    throw new Error("No executable path set");
  }
  // get the entity type
  let entityType: string | undefined;

  entityType = await vscode.window.showQuickPick([
    "bom",
    "table",
  ], {
    placeHolder: "Select the entity type",
  });

  if (!entityType) {
    throw new Error("No entity type selected");
  }

  // get the parent id
  let parentId: string | undefined;
  parentId = await vscode.window.showInputBox({
    prompt: "Enter the parent id",
    ignoreFocusOut: true,
  });

  if (!parentId) {
    throw new Error("No parent id provided");
  }

  let manifestPath: string | undefined; 
  manifestPath = await vscode.window.showInputBox({
    prompt: "Enter the path to the manifest file",
    ignoreFocusOut: true,
  });
  if (!manifestPath) {
    manifestPath = ""
  }

  if (checkManifestDirPath()) {
    manifestPath = path.join(MANIFEST_DIR_PATH as string, manifestPath);
  }

  return new Promise((resolve, reject) => {
    const command = `${EXEC_PATH} init-manifest ${entityType} ${parentId} --file ${manifestPath} --output json`;
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error initializing manifest: ${error}`);
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

export const cloneManifest = async (): Promise<any> => {
  if (!EXEC_PATH) {
    throw new Error("No executable path set");
  }

  let entityType: string | undefined;
  entityType = await vscode.window.showQuickPick([
    "bom",
    "table",
  ], {
    placeHolder: "Select the entity type",
  });

  if (!entityType) {
    throw new Error("No entity type selected");
  }

  let bpmId: string | undefined;
  bpmId = await vscode.window.showInputBox({
    prompt: "Enter the bpm id",
    ignoreFocusOut: true,
  });
  if (!bpmId) {
    throw new Error("No bpm id provided");
  }

  let parentId: string | undefined;
  parentId = await vscode.window.showInputBox({
    prompt: "Enter the parent id",
    ignoreFocusOut: true,
  });
  if (!parentId) {
    throw new Error("No parent id provided");
  }

  let manifestPath: string | undefined;
  manifestPath = await vscode.window.showInputBox({
    prompt: "Enter the path to the manifest file",
    ignoreFocusOut: true,
  });
  // Might want to make this optional
  if (!manifestPath) {
    manifestPath = ""
  }

  if (checkManifestDirPath()) {
    manifestPath = path.join(MANIFEST_DIR_PATH as string, manifestPath);
  }

  return new Promise((resolve, reject) => {
    const command = `${EXEC_PATH} clone-manifest ${entityType} ${bpmId} ${parentId} --file ${manifestPath} --output json`;
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

export const getBoms = async(): Promise<any> => {
  if (!EXEC_PATH) {
    throw new Error("No executable path set");
  }

  let outputType: string | undefined;
  outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }

  return new Promise((resolve, reject) => {
    const command = `${EXEC_PATH} get boms --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        reject(`Error getting boms: ${stderr}`);
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

export const getTables = async (): Promise<any> => {
  if (!EXEC_PATH) {
      throw new Error("No executable path set");
    }
  let outputType: string | undefined;
  outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }
  return new Promise((resolve, reject) => {
    const command = `${EXEC_PATH} get tables --output ${outputType}`;
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

 export const describeBom = async (): Promise<any> => {
  if (!EXEC_PATH) {
    throw new Error("No executable path set");
  }

  let bomId: string | undefined;
  bomId = await vscode.window.showInputBox({
    prompt: "Enter the bom id",
    ignoreFocusOut: true,
  });
  if (!bomId) {
    throw new Error("No bom id provided");
  }

  let outputType: string | undefined;
  outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }

  return new Promise((resolve, reject) => {
    const command = `${EXEC_PATH} describe bom ${bomId} --output ${outputType}`;
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

 
 export const describeTable = async (): Promise<any> => {
  if (!EXEC_PATH) {
    throw new Error("No executable path set");
  }

  let tableId: string | undefined;
  tableId = await vscode.window.showInputBox({
    prompt: "Enter the table id",
    ignoreFocusOut: true,
  });
  if (!tableId) {
    throw new Error("No table id provided");
  }

  let outputType: string | undefined;
  outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }

  return new Promise((resolve, reject) => {
    const command = `${EXEC_PATH} describe table ${tableId} --output ${outputType}`;
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

export const describeBpm = async (): Promise<any> => {
  if (!EXEC_PATH) {
    throw new Error("No executable path set");
  }

  let manifestPath: string | undefined;
  manifestPath = await vscode.window.showInputBox({
    prompt: "Enter path to manifest file, leave blank to skip", 
    ignoreFocusOut: true
  }) 

  if (manifestPath) {
    if (checkManifestDirPath()) {
      manifestPath = path.join(MANIFEST_DIR_PATH as string, manifestPath);
    }
  }


  let bpmId: string | undefined;
  bpmId = await vscode.window.showInputBox({
    prompt: "Enter the bpm id",
    ignoreFocusOut: true,
  });

  if (!bpmId) {
    throw new Error("No bpm id provided");
  }

  let entityType: string | undefined;
  entityType = await vscode.window.showQuickPick([
    "bom",
    "table",
  ], {
  placeHolder: "Select the entity type",
  });


  let parentId: string | undefined;
  parentId = await vscode.window.showInputBox({
    prompt: "Enter the parent id",
    ignoreFocusOut: true,
  });


  let outputType: string | undefined;
  outputType = await vscode.window.showQuickPick([
    "table",
    "json",
  ], {
    placeHolder: "Select the output type",
  });

  if (!outputType) {
    throw new Error("No output type selected");
  }
  
  //TODO: should be able to describe a bpm from a manifest file
  // need to add a new prompt to accept an optional manifest file path (maybe at beginning of function)

  return new Promise((resolve, reject) => {
    let command: string;
    if (!manifestPath) {
      command = `${EXEC_PATH} describe bpm ${bpmId} --parent-type ${entityType} --parent-id ${parentId} --output ${outputType}`;
    } else {
      command = `${EXEC_PATH} describe bpm ${bpmId} --file ${manifestPath}`
    }

    console.log("command", command)
    exec(command, (error, stdout, stderr) => {
      console.log("stdout", stdout)
      console.log("stderr", stderr)
      console.log("error", error)
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

export const applyBpm = async (): Promise<any> => {
  if (!EXEC_PATH) {
    throw new Error("No executable path set");
  }

  let filePath: string | undefined;
  filePath = await vscode.window.showInputBox({
    prompt: "Enter the path to your manifest file",
    ignoreFocusOut: true,
  });
  if (!filePath) {
    throw new Error("No file path provided");
  }

  if (checkManifestDirPath()) {
    filePath = path.join(MANIFEST_DIR_PATH as string, filePath);
  }


  return new Promise((resolve, reject) => {
    const command = `${EXEC_PATH} apply bpm --file ${filePath} --output json`;
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

export const updateBpm = async (): Promise<any> => {
  if (!EXEC_PATH) {
    throw new Error("No executable path set");
  }

  let filePath: string | undefined;
  filePath = await vscode.window.showInputBox({
    prompt: "Enter the path to your manifest file",
    ignoreFocusOut: true,
  });
  if (!filePath) {
    throw new Error("No file path provided");
  }
  
  if (checkManifestDirPath()) {
    filePath = path.join(MANIFEST_DIR_PATH as string, filePath);
  }



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

  return new Promise((resolve, reject) => {
    let command = `${EXEC_PATH} update bpm --file ${filePath}`;
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

export const deleteBpm = async (): Promise<any> => {
  if (!EXEC_PATH) {
    throw new Error("No executable path set");
  }

  let manifestPath: string | undefined;
  manifestPath = await vscode.window.showInputBox({
    prompt: "Enter the path to your manifest file",
    ignoreFocusOut: true,
  });
  if (!manifestPath) {
    throw new Error("No file path provided");
  }
  
  if (checkManifestDirPath()) {
    manifestPath = path.join(MANIFEST_DIR_PATH as string, manifestPath);
  }

  return new Promise((resolve, reject) => {
    const command = `${EXEC_PATH} delete bpm --file ${manifestPath} --output json`;
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