import * as vscode from "vscode";
import * as path from "path";
import fs from "fs";

interface ManifestManagerInterface {
  manifest_dir_path: string;
}

export class ManifestManager {
  private _manifestDirPath: string;
  private _manifestConfigPath: string;

  public constructor(context: vscode.ExtensionContext) {
    const storagePath = context.storageUri?.fsPath ?? "";
    if (!storagePath) {
      throw new Error(
        "Error initializing manifest manager: No storage path found\n\nPlease open a workspace and try again",
      );
    }
    this._manifestDirPath = path.join(storagePath, "manifest");

    this._manifestConfigPath = path.join(this._manifestDirPath, "config.json");

    //initialize manifest directory and config file
    fs.mkdirSync(this._manifestDirPath, {
      recursive: true,
    });

    if (!fs.existsSync(this._manifestConfigPath)) {
      const data = {
        manifest_dir_path: this._manifestDirPath,
      };
      fs.writeFileSync(this._manifestConfigPath, JSON.stringify(data, null, 2));
    }
  }

  // helper methods ------------------------------------------------------------

  private loadManifestConfig(): ManifestManagerInterface | undefined {
    return JSON.parse(
      fs.readFileSync(this._manifestConfigPath, "utf8"),
    ) as ManifestManagerInterface;
  }

  // executable methods ------------------------------------------------------------

  public writeManifestDirPath(manifestDirPath: string) {
    const data = this.loadManifestConfig();
    if (!data) {
      throw new Error("No manifest config file found");
    }
    data.manifest_dir_path = manifestDirPath;
    fs.writeFileSync(this._manifestConfigPath, JSON.stringify(data, null, 2));
  }

  public writeManifestCodeFilePath(manifestName: string, codeFilePath: string) {
    if (path.extname(manifestName) !== ".json") {
      manifestName = `${manifestName}.json`;
    }
    const manifestData = this.readManifest(manifestName);
    if (!manifestData) {
      throw new Error("No manifest data found");
    }

    const manifestFilePath = this.createManifestFilePath(manifestName);

    if (!manifestData.epictl.code_file) {
      manifestData.epictl.code_file = [];
    }

    manifestData.epictl.code_file.push(codeFilePath);
    fs.writeFileSync(manifestFilePath, JSON.stringify(manifestData, null, 2));
  }

  public readManifestDirPath(): string | undefined {
    const data = this.loadManifestConfig();
    if (!data) {
      throw new Error("No manifest config file found");
    }
    return data.manifest_dir_path;
  }

  public readManifest(manifestName: string): any {
    const manifestFilePath = this.createManifestFilePath(manifestName);
    const manifestData = fs.readFileSync(manifestFilePath, "utf8");
    return JSON.parse(manifestData);
  }

  public readManifests(): string[] {
    const manifest_dir_path = this.loadManifestConfig()?.manifest_dir_path;
    if (!manifest_dir_path) {
      return [];
    }
    return fs
      .readdirSync(manifest_dir_path)
      .filter(
        (file) =>
          file.endsWith(".json") && path.basename(file) !== "config.json",
      );
  }

  public findCodeFileInManifests(
    codeFilePath: string | undefined,
  ): string | undefined {
    if (!codeFilePath) {
      return undefined;
    }
    const manifests = this.readManifests();
    for (const manifest of manifests) {
      const manifestData = this.readManifest(manifest);
      if (manifestData.epictl.code_file) {
        if (manifestData.epictl.code_file.includes(codeFilePath))
          return manifest;
      }
    }
    return undefined;
  }

  public createManifestFilePath(manifestName: string): string {
    const manifestDirPath = this.readManifestDirPath();
    if (!manifestDirPath) {
      throw new Error("No manifest directory path set");
    }
    if (path.extname(manifestName) !== ".json") {
      manifestName = `${manifestName}.json`;
    }
    return path.join(manifestDirPath, manifestName);
  }

  public deleteManifestDirPath() {
    const data = this.loadManifestConfig();
    if (!data) {
      throw new Error("No manifest config file found");
    }
    data.manifest_dir_path = "";
    fs.writeFileSync(this._manifestConfigPath, JSON.stringify(data, null, 2));
  }

  public deleteManifest(manifestName: string) {
    const manifestPath = this.createManifestFilePath(manifestName);
    fs.unlinkSync(manifestPath);
  }

  public deleteCodeFileFromManifest(
    manifestName: string,
    codeFilePath: string,
  ) {
    if (path.extname(manifestName) !== ".json") {
      manifestName = `${manifestName}.json`;
    }
    const manifestData = this.readManifest(manifestName);
    if (!manifestData) {
      throw new Error("No manifest data found");
    }
    let manifestCodeFiles = manifestData.epictl.code_file;
    if (!manifestCodeFiles.includes(codeFilePath)) {
      throw new Error("Code file not found in manifest");
    }

    manifestCodeFiles = manifestCodeFiles.filter(
      (file: string) => file !== codeFilePath,
    );
    manifestData.epictl.code_file = manifestCodeFiles;

    const manifestFilePath = this.createManifestFilePath(manifestName);
    fs.writeFileSync(manifestFilePath, JSON.stringify(manifestData, null, 2));
  }
}
