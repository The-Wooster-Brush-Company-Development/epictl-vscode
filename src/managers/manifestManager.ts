import * as vscode from "vscode";
import * as path from "path";
import fs from "fs";

interface ManifestManagerInterface {
  manifest_dir_path: string;
}

export class ManifestManager {
  private context: vscode.ExtensionContext;
  private manifestDirPath: string;
  private manifestConfigPath: string;

  public constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.manifestDirPath = vscode.Uri.joinPath(
      context.globalStorageUri,
      "manifest",
    ).fsPath;

    this.manifestConfigPath = path.join(this.manifestDirPath, "config.json");

    //initialize manifest directory and config file
    fs.mkdirSync(this.manifestDirPath, {
      recursive: true,
    });

    if (!fs.existsSync(this.manifestConfigPath)) {
      const data = {
        manifest_dir_path: this.manifestDirPath, //set as default, user can change later
      };
      fs.writeFileSync(this.manifestConfigPath, JSON.stringify(data, null, 2));
    }
  }

  // helper methods ------------------------------------------------------------

  private loadManifestConfig(): ManifestManagerInterface | undefined {
    return JSON.parse(
      fs.readFileSync(this.manifestConfigPath, "utf8"),
    ) as ManifestManagerInterface;
  }

  // executable methods ------------------------------------------------------------

  public writeManifestDirPath(manifestDirPath: string) {
    const data = this.loadManifestConfig();
    if (!data) {
      throw new Error("No manifest config file found");
    }
    data.manifest_dir_path = manifestDirPath;
    fs.writeFileSync(this.manifestConfigPath, JSON.stringify(data, null, 2));
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
    console.log("manifest file path: ", manifestFilePath);
    const manifestData = fs.readFileSync(manifestFilePath, "utf8");
    return JSON.parse(manifestData);
  }

  public readManifestByCodeFilePath(codeFilePath: string): string | undefined {
    const manifestFiles = this.getManifests();
    return manifestFiles.find((manifest) => {
      const manifestData = this.readManifest(manifest);
      if (manifestData.epictl.code_file.includes(codeFilePath)) return manifest;
      return undefined;
    });
  }

  public isCodeFileInManifests(
    codeFilePath: string | undefined,
  ): string | undefined {
    if (!codeFilePath) {
      return undefined;
    }
    const manifests = this.getManifests();
    for (const manifest of manifests) {
      const manifestData = this.readManifest(manifest);
      if (manifestData.epictl.code_file.includes(codeFilePath)) return manifest;
    }
    return undefined;
  }

  public createManifestFilePath(manifestName: string): string {
    const manifestDirPath = this.readManifestDirPath();
    if (!manifestDirPath) {
      throw new Error("No manifest directory path set");
    }
    return path.join(manifestDirPath, manifestName);
  }

  public getManifests(): string[] {
    const manifests = fs
      .readdirSync(this.manifestDirPath)
      .filter(
        (file) =>
          file.endsWith(".json") && path.basename(file) !== "config.json",
      );

    if (!manifests) {
      return [];
    }
    return manifests;
  }

  public deleteManifestDirPath() {
    const data = this.loadManifestConfig();
    if (!data) {
      throw new Error("No manifest config file found");
    }
    data.manifest_dir_path = "";
    fs.writeFileSync(this.manifestConfigPath, JSON.stringify(data, null, 2));
  }

  public deleteManifest(manifestName: string) {
    const manifestPath = this.createManifestFilePath(manifestName);
    fs.unlinkSync(manifestPath);
  }

  public deleteCodeFileFromManifest(
    manifestName: string,
    codeFilePath: string,
  ) {
    console.log(`manifest name: ${manifestName}`);
    console.log(`code file path: ${codeFilePath}`);
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

    console.log(`manifest code files: ${manifestCodeFiles}`);

    manifestCodeFiles = manifestCodeFiles.filter(
      (file: string) => file !== codeFilePath,
    );
    manifestData.epictl.code_file = manifestCodeFiles;
    console.log(`manifest code files: ${manifestCodeFiles}`);

    const manifestFilePath = this.createManifestFilePath(manifestName);
    fs.writeFileSync(manifestFilePath, JSON.stringify(manifestData, null, 2));
  }
}
