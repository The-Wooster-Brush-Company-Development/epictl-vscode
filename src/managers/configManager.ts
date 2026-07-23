import * as vscode from "vscode";
import fs from "fs";
import path from "path";

// Main class for reading and writing from vs code config file in workspace storage
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
    const storagePath = context.storageUri?.fsPath ?? "";
    if (!storagePath) {
      throw new Error(
        "Error initializing config manager: No storage path found\n\nPlease open a workspace and try again",
      );
    }
    this.configPath = path.join(storagePath, "config.json");

    //initialize the config file if it doesn't exist
    if (!fs.existsSync(this.configPath)) {
      const data = {
        exec_path: "",
        manifest_code_dir_path: "",
      };
      // create the config file directory if it doesn't exist
      fs.mkdirSync(storagePath, {
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

  public writeToCodeFile(codeFilePath: string, codeLines: string): void {
    fs.writeFileSync(codeFilePath, codeLines);
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
    const codeFileName =
      path.basename(fileName, path.extname(fileName)) + ".cs";

    return vscode.Uri.joinPath(
      vscode.Uri.file(this.readManifestCodeDirPath()!),
      codeFileName,
    ).fsPath;
  }
}
