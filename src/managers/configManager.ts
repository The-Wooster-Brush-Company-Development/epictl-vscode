import * as vscode from "vscode";
import fs from "fs";

// Main class for reading and writing from vs code config file in global storage
// vs code config file has path to executable, path to manifest directory etc.

interface VsCodeConfigInterface {
  exec_path: string;
  manifest_code_dir_path: string;
}

export class VsCodeConfigManager {
  private context: vscode.ExtensionContext;
  private configPath: string;

  public constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.configPath = vscode.Uri.joinPath(
      context.globalStorageUri,
      "config.json",
    ).fsPath;

    //initialize the config file if it doesn't exist
    if (!fs.existsSync(this.configPath)) {
      const data = {
        exec_path: "",
        manifest_code_dir_path: "",
      };
      // create the config file directory if it doesn't exist
      fs.mkdirSync(this.context.globalStorageUri.fsPath, {
        recursive: true,
      });

      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
    }
  }

  //helper methods ------------------------------------------------------------

  private loadConfig(): VsCodeConfigInterface | undefined {
    const config = JSON.parse(
      fs.readFileSync(this.configPath, "utf8"),
    ) as VsCodeConfigInterface;
    return config;
  }

  // Executable methods ------------------------------------------------------------

  public readConfig(): VsCodeConfigInterface {
    const data = this.loadConfig();
    if (!data) {
      throw new Error("No config file found");
    }
    return data;
  }

  public readExecPath(): string | undefined {
    const data = this.loadConfig();
    if (!data) {
      throw new Error("No config file found");
    }
    return data.exec_path;
  }

  public readManifestCodeDirPath(): string | undefined {
    const data = this.loadConfig();
    if (!data) {
      throw new Error("No config file found");
    }
    return data.manifest_code_dir_path;
  }

  // overwrites the existing config file with the new exec path
  public writeExecPath(execPath: string) {
    const data = this.loadConfig();
    if (!data) {
      throw new Error("No config file found");
    }
    data.exec_path = execPath;
    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
  }

  public writeManifestCodeDirPath(manifestCodeDirPath: string) {
    const data = this.loadConfig();
    if (!data) {
      throw new Error("No config file found");
    }
    data.manifest_code_dir_path = manifestCodeDirPath;
    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
  }

  // deletes the exec path from the config file
  public deleteExecPath() {
    const data = this.loadConfig();
    if (!data) {
      throw new Error("No config file found");
    }
    data.exec_path = "";
    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
  }

  public deleteManifestCodeDirPath() {
    const data = this.loadConfig();
    if (!data) {
      throw new Error("No config file found");
    }
    data.manifest_code_dir_path = "";
    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
  }

  public createCodeFilePath(fileName: string): string {
    if (!fileName.endsWith(".cs")) {
      fileName += ".cs";
    }
    return vscode.Uri.joinPath(
      vscode.Uri.parse(this.readManifestCodeDirPath()!),
      fileName,
    ).fsPath;
  }
}
