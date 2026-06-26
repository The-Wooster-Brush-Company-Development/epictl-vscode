import * as vscode from "vscode";
import * as path from "path";

const CONFIG_SECTION = "epictl";
const CONFIG_KEY_MANIFEST_DIR_PATH = "manifest_dir_path";

export const checkManifestDirPath = () => {
    const manifestDirPath = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(CONFIG_KEY_MANIFEST_DIR_PATH);
    if(!manifestDirPath) {
        return false;
    }
    return true;
}

