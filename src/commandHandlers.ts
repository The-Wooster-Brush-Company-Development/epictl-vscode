import * as vscode from "vscode";
import { exec } from "child_process";

const CONFIG_SECTION = "epictl";
const CONFIG_KEY_EXEC_PATH = "command_path";


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
    const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get(CONFIG_KEY_EXEC_PATH);
    const outputChannel = vscode.window.createOutputChannel("Epictl");
    if (execPath) {
       outputChannel.appendLine(`Epictl executable path: ${execPath}`);
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
 * Initialize/Clone a manifest for a given entity type and parent id
 ***********************************************************
 */

export const initManifest = async (): Promise<any> =>{
  const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
  if (!execPath) {
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

  return new Promise((resolve, reject) => {
    const command = `${execPath} init-manifest ${entityType} ${parentId} --file ${manifestPath} --output json`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      if (stderr) {
        reject(`Python standard error: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

export const cloneManifest = async (): Promise<any> => {
  const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
  if (!execPath) {
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

  return new Promise((resolve, reject) => {
    const command = `${execPath} clone-manifest ${entityType} ${bpmId} ${parentId} --file ${manifestPath} --output json`;
    console.log("COMMAND:", command);
    exec(command, (error, stdout, stderr) => {
      console.log("ERROR:", error);
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      if (stderr) {
        reject(`Python standard error: ${stderr}`);
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
  const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
  if (!execPath) {
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
    const command = `${execPath} get boms --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      if (stderr) {
        reject(`Python standard error: ${stderr}`);
        return;
      }
      resolve([stdout, outputType]);
    });
  });
};

export const getTables = async (): Promise<any> => {
  const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
    if (!execPath) {
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
    const command = `${execPath} get tables --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      if (stderr) {
        reject(`Python standard error: ${stderr}`);
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
  const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
  if (!execPath) {
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
    const command = `${execPath} describe bom ${bomId} --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      console.log("ERROR:", error);
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      if (stderr) {
        reject(`Python standard error: ${stderr}`);
        return;
      }
      resolve([stdout, outputType]);
    });
  })
 }

 
 export const describeTable = async (): Promise<any> => {
  const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
  if (!execPath) {
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
    const command = `${execPath} describe table ${tableId} --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      if (stderr) {
        reject(`Python standard error: ${stderr}`);
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
  const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
  if (!execPath) {
    throw new Error("No executable path set");
  }

  let bpmId: string | undefined;
  try {
    bpmId = await vscode.window.showInputBox({
      prompt: "Enter the bpm id",
      ignoreFocusOut: true,
    });
  } catch (error) {
    throw new Error(`Error getting bpm id: ${error}`);
  }
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
  if (!entityType) {
    throw new Error("No entity type selected");
  }

  let parentId: string | undefined;
  parentId = await vscode.window.showInputBox({
    prompt: "Enter the parent id",
    ignoreFocusOut: true,
  });
  if (!parentId) {
    throw new Error("No parent id provided");
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
    const command = `${execPath} describe bpm ${bpmId} --parent-type ${entityType} --parent-id ${parentId} --output ${outputType}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      if (stderr) {
        reject(`Python standard error: ${stderr}`);
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

export const applyManifest = async (): Promise<any> => {
  const execPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_EXEC_PATH);
  if (!execPath) {
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

  return new Promise((resolve, reject) => {
    const command = `${execPath} apply bpm --file ${filePath}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ${command}: ${error}`);
        return;
      }
      if (stderr) {
        reject(`Python standard error: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}