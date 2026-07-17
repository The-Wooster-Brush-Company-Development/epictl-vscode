import * as vscode from "vscode";
import fs from "fs";
import {
  BpmNode,
  DirectiveNode,
  BomProcessingNode,
  TableProcessingNode,
} from "../treeView/treeView";

// State manager is used to store the state of the extension
// Primarly used to store the state of the entity the user is exploring

export interface MethodDirectiveStateManagerInterface {
  Type: "bom" | "table";
  Source: string;
  BpMethodCode: string;
  SystemCode: string;
  ObjectNS: string;
  BusinessObject: string;
  Name: string;
  Description: string | null;
  Version: string | null;
  HasRootTransaction: boolean;
  SignatureStatus: number;
  Disabled: boolean;
  SystemFlag: boolean;
  SysRevID: number;
  SysRowID: string;
  DebugMode: boolean;
  DumpSources: boolean;
  AdvTracing: boolean;
  HasOutdatedDirectives: boolean;
  HasPreProcessing: boolean;
  HasBaseProcessing: boolean;
  HasPostProcessing: boolean;
  IsMDRSEnabled: boolean;
  BitFlag: number;
  RowMod: string;
}

export interface DataDirectiveStateManagerInterface {
  Type: "bom" | "table";
  Source: string;
  BpMethodCode: string;
  SystemCode: string;
  ObjectNS: string;
  BusinessObject: string;
  Name: string;
  Description: string | null;
  Version: string | null;
  HasRootTransaction: boolean;
  SignatureStatus: number;
  Disabled: boolean;
  SysRevID: number;
  SysRowID: string;
  HasOutdatedDirectives: boolean;
  HasPreProcessing: boolean;
  HasBaseProcessing: boolean;
  HasPostProcessing: boolean;
  RowMod: string;
}

export interface BpmStateManagerInterface {
  Type: "bpm";
  ParentType: "bom" | "table";
  ParentSysRowId: string;
  DirectiveID: string;
  Source: string;
  BpMethodCode: string;
  DirectiveType: number;
  Name: string;
  Order: number;
  IsEnabled: boolean;
  ReenterMax: number;
  PreventDeadloops: boolean;
  VisibilityScope: number;
  Company: string;
  DirectiveGroup: string;
  IsUpToDate: boolean;
  CGCCode: string | null;
  Body: string;
  Thumbnail: string | null;
  SysRevID: number;
  SysRowID: string;
  Description: string | null;
  IsProtected: boolean;
  DisplayOrder: number;
  CompilerDiagnostics: string;
  BitFlag: number;
  RowMod: string;
}

export class StateManager {
  private _statePath: string;

  constructor(context: vscode.ExtensionContext) {
    this._statePath = vscode.Uri.joinPath(
      context.globalStorageUri,
      "state.json",
    ).fsPath;

    //initialize state file if it doesn't exist
    if (!fs.existsSync(this._statePath)) {
      fs.writeFileSync(this._statePath, JSON.stringify({}));
    }
  }

  //helper methods ------------------------------------------------------------

  private loadState(): Partial<
    | MethodDirectiveStateManagerInterface
    | DataDirectiveStateManagerInterface
    | BpmStateManagerInterface
  > {
    return JSON.parse(fs.readFileSync(this._statePath, "utf8")) as Partial<
      | MethodDirectiveStateManagerInterface
      | DataDirectiveStateManagerInterface
      | BpmStateManagerInterface
    >;
  }

  //executable methods ------------------------------------------------------------

  public writeState(
    newState: Partial<
      | MethodDirectiveStateManagerInterface
      | DataDirectiveStateManagerInterface
      | BpmStateManagerInterface
    >,
  ) {
    //const currentState = this.loadState();
    fs.writeFileSync(this._statePath, JSON.stringify(newState, null, 2));
  }

  public readState(): Partial<
    | MethodDirectiveStateManagerInterface
    | DataDirectiveStateManagerInterface
    | BpmStateManagerInterface
  > {
    return this.loadState();
  }

  public updateFromTree(
    element: DirectiveNode | BpmNode,
    type: "bom" | "table" | "bpm",
    parentSysRowId: string | undefined,
    parentType: "bom" | "table" | undefined,
  ) {
    if (!(element instanceof DirectiveNode || element instanceof BpmNode)) {
      return;
    }
    let hasUpdated = false;
    switch (element.type) {
      case "bom":
        element.data.Type = "bom";
        this.writeState({
          ...element.data,
        });
        hasUpdated = true;
        break;
      case "table":
        element.data.Type = "table";
        this.writeState({
          ...element.data,
        });
        hasUpdated = true;
        break;
      case "bpm":
        element.data.Type = "bpm";
        element.data.ParentType = parentType!;
        element.data.ParentSysRowId = parentSysRowId!;
        this.writeState({
          ...element.data,
        });
        hasUpdated = true;
        break;
      default:
        hasUpdated = false;
        break;
    }
    return hasUpdated;
  }
}
