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
        this.manifestDirPath = vscode.Uri.joinPath(context.globalStorageUri, "manifest").fsPath;
        this.manifestConfigPath = path.join(this.manifestDirPath, "manifest_config.json");

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
        return JSON.parse(fs.readFileSync(this.manifestConfigPath, 'utf8')) as ManifestManagerInterface;
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

    public readManifestDirPath(): string | undefined {
        const data = this.loadManifestConfig();
        if (!data)  {
            throw new Error("No manifest config file found");
        }
        return data.manifest_dir_path;
    }

    public deleteManifestDirPath() {
        const data = this.loadManifestConfig();
        if (!data) {
            throw new Error("No manifest config file found");
        }
        data.manifest_dir_path = "";
        fs.writeFileSync(this.manifestConfigPath, JSON.stringify(data, null, 2));
    }

    public createManifestFilePath(manifestName: string): string {
        const manifestDirPath = this.readManifestDirPath();
        if (!manifestDirPath) {
            throw new Error("No manifest directory path set");
        }
        return path.join(manifestDirPath, manifestName);
    }

    public getManifests(): string[] {
        const manifests = fs.readdirSync(this.manifestDirPath)
            .filter(file => file.endsWith('.json'));
        
        if (!manifests) {
            return [];
        }
        return manifests
    }

    public deleteManifest(manifestName: string) {
        const manifestPath = this.createManifestFilePath(manifestName);
        console.log("deleting manifest: ", manifestPath);
        
        fs.unlinkSync(manifestPath);
    }
}