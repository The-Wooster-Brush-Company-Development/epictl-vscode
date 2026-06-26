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

export const fields = [
    { label: "Name", key: "name" },
    { label: "Description", key: "description" },
    { label: "Body File", key: "bodyfile" },
    { label: "Enabled", key: "isenabled" },
    { label: "Group", key: "group" },
    { label: "Order", key: "order" },
    { label: "Source", key: "source" },
    { label: "Reenter Max", key: "reenter-max" },
    { label: "Prevent Deadloops", key: "preventdeadloops" },
    { label: "Visibility Scope", key: "visibilityscope" },
    { label: "Company", key: "company" },
    { label: "Directive Group", key: "directivegroup" },
    { label: "Up To Date", key: "isuptodate" },
    { label: "CGC Code", key: "cgccode" },
    { label: "Thumbnail", key: "thumbnail" },
    { label: "Compiler Diagnostics", key: "compilerdiagnostics" },
    { label: "Bit Flag", key: "bitflag" },
    { label: "Row Mod", key: "rowmod" },
    { label: "Directive Type", key: "directivetype" },
];

export const formatCommand: Record<string, (v: string) => string> = {
    name: (v: string) => `--name "${v}"`,
    description: (v: string) => `--description "${v}"`,
    bodyfile: (v: string) => `--bodyfile ${v}`,
    isenabled: (v: string) => `${v === "true" ? "--enabled" : "--disabled"}`,
    group: (v: string) => `--group "${v}"`,
    order: (v: string) => `--order ${v}`,
    source: (v: string) => `--source "${v}"`,
    "reenter-max": (v: string) => `--reenter-max ${v}`,
    preventdeadloops: (v: string) => `${v === "true" ? "--preventdeadloops" : "--no-preventdeadloops"}`,
    visibilityscope: (v: string) => `--visibilityscope "${v}"`,
    company: (v: string) => `--company "${v}"`,
    directivegroup: (v: string) => `--directivegroup "${v}"`,
    isuptodate: (v: string) => `${v === "true" ? "--uptodate" : "--outdated"}`,
    cgccode: (v: string) => `--cgccode "${v}"`,
    thumbnail: (v: string) => `--thumbnail "${v}"`,
    compilerdiagnostics: (v: string) => `--compilerdiagnostics "${v}"`,
    bitflag: (v: string) => `--bitflag ${v}`,
    rowmod: (v: string) => `--rowmod ${v}`,
    directivetype: (v: string) => `--directivetype "${v}"`,
};

