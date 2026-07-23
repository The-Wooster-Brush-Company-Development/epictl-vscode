import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import { BpmNode, DirectiveNode } from "../treeView/treeView";

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
    const storagePath = context.storageUri?.fsPath ?? "";
    if (!storagePath) {
      throw new Error(
        "Error initializing state manager: No storage path found\n\nPlease open a workspace and try again",
      );
    }
    this._statePath = path.join(storagePath, "state.json");

    //initialize state file if it doesn't exist
    fs.mkdirSync(storagePath, { recursive: true });
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

  public updateWithManifestData(manifestData: any) {
    console.log("manifestData: ", manifestData);
    const currentState = this.loadState();
    if (!currentState) {
      throw new Error("Unable to load current state");
    }
    const newState = {
      ...currentState,
      ...(manifestData as BpmStateManagerInterface),
    };
    this.writeState(newState);
  }

  public clearState() {
    this.writeState({});
  }
}
