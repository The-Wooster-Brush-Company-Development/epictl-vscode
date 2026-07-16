import * as vscode from "vscode";
import fs from "fs";
import { BpmNode, DirectiveNode, EpicorNode } from "../treeView/treeView";

// State manager is used to store the state of the extension
// Primarly used to store the state of the entity the user is exploring

interface StateManagerInterface {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  parent_id: string;
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

    console.log("State manager initialized");
    console.log("State path: ", this._statePath);
  }

  //helper methods ------------------------------------------------------------

  private loadState(): Partial<StateManagerInterface> {
    return JSON.parse(
      fs.readFileSync(this._statePath, "utf8"),
    ) as Partial<StateManagerInterface>;
  }

  //executable methods ------------------------------------------------------------

  public writeState(newState: Partial<StateManagerInterface>) {
    const currentState = this.loadState();
    fs.writeFileSync(
      this._statePath,
      JSON.stringify({ ...currentState, ...newState }, null, 2),
    );
  }

  public readState(): Partial<StateManagerInterface> {
    return this.loadState();
  }

  public updateFromTree(element: EpicorNode) {
    if (element instanceof DirectiveNode) {
      this.writeState({
        entity_type: element.type,
        entity_id: element.sysRowId,
        entity_name: element.label as string,
        parent_id: "",
      });
    } else if (element instanceof BpmNode) {
      this.writeState({
        entity_type: element.parentType,
        entity_id: element.directiveId,
        entity_name: element.label as string,
        parent_id: element.parentSysRowId,
      });
    } else {
      this.writeState({});
    }
  }
}
