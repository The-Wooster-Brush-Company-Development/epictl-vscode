import * as vscode from "vscode";
import fs from "fs";
import { json } from "stream/consumers";



export const getExecPath = (context: vscode.ExtensionContext) => {
   // get the config file path
   const configPath = vscode.Uri.joinPath(context.globalStorageUri, "config.json").fsPath;
   if (!fs.existsSync(configPath)) {
    return undefined;
   }

   // get the exec path from the config file
   const parsedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
   if (!parsedConfig.exec_path) {
    return undefined;
   }

   return parsedConfig.exec_path;
}