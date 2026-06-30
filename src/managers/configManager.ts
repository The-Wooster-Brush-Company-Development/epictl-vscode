import * as vscode from "vscode";
import fs from "fs";

// Main class for reading and writing from vs code config file in global storage
// vs code config file has path to executable, path to manifest directory etc.

interface VsCodeConfigInterface {
    exec_path: string;
    manifest_dir_path: string;
}

export class VsCodeConfigManager {

    private context: vscode.ExtensionContext;
    private configPath: string;


    public constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.configPath = vscode.Uri.joinPath(context.globalStorageUri, "config.json").fsPath;

        //initialize the config file if it doesn't exist
        if (!fs.existsSync(this.configPath)) {
            const data ={
                exec_path: "",
                manifest_dir_path: "",
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
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8')) as VsCodeConfigInterface;
    }

    // Executable methods ------------------------------------------------------------

    public writeExecPath(execPath: string) {
        const data = this.loadConfig();
        if (!data) {
            throw new Error("No config file found");
        }
        console.log(`writing exec path: ${execPath}`);
        data.exec_path = execPath;
        console.log(`data: ${JSON.stringify(data, null, 2)}`);
        fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
    }

    public readExecPath(): string | undefined {
        const data = this.loadConfig();
        if (!data) {
            throw new Error("No config file found");
        }
        return data.exec_path;
    }

    public deleteExecPath() {
        const data = this.loadConfig();
        if (!data) {
            throw new Error("No config file found");
        }
        data.exec_path = "";
        fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
    }
}
