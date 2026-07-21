import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
  getBoms,
  getTables,
  describeBom,
  describeTable,
  describeBpm,
} from "../commandHandlers";
import { VsCodeConfigManager } from "../managers/configManager";
import { ManifestManager } from "../managers/manifestManager";
import { BpmWebview } from "../webviews/bpmWebview";
import {
  StateManager,
  MethodDirectiveStateManagerInterface,
  DataDirectiveStateManagerInterface,
  BpmStateManagerInterface,
} from "../managers/stateManager";

export const registerTreeEvents = (
  tree: vscode.TreeView<any>,
  treeProvider: EpictlTreeView,
  stateManager: StateManager,
) => {
  tree.onDidChangeSelection((event) => {
    const element = event.selection[0];
    if (!element) return;

    //TODO: the bpmWebview should not be getting data from treeView. It should be getting data from the stateManager.
    // Treeview passes messages to bpmWebview, which then reads the stateManager based on the message received.
    let hasUpdated: boolean | undefined = false;

    if (element instanceof DirectiveNode) {
      hasUpdated =
        stateManager.updateFromTree(
          element,
          element.type,
          undefined,
          undefined,
        ) ?? false;
    } else if (element instanceof BpmNode) {
      hasUpdated =
        stateManager.updateFromTree(
          element,
          element.type,
          element.parentSysRowId,
          element.parentType,
        ) ?? false;
    }

    if (hasUpdated) {
      if (element instanceof DirectiveNode) {
        treeProvider.bpmWebview.postMessageHelper({
          command: "canInitManifest",
        });
      } else if (element instanceof BpmNode) {
        treeProvider.bpmWebview.postMessageHelper({
          command: "describeDirectiveBpm",
        });
      }
    }
  });
};

export class EpictlTreeView implements vscode.TreeDataProvider<EpicorNode> {
  private vscodeConfigManager: VsCodeConfigManager;
  private manifestManager: ManifestManager;
  private _onDidChangeTreeData: vscode.EventEmitter<
    EpicorNode | undefined | null | void
  > = new vscode.EventEmitter<EpicorNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    EpicorNode | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(
    vscodeConfigManager: VsCodeConfigManager,
    manifestManager: ManifestManager,
    public readonly bpmWebview: BpmWebview,
    stateManager: StateManager,
  ) {
    this.vscodeConfigManager = vscodeConfigManager;
    this.manifestManager = manifestManager;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  private get execPath(): string | undefined {
    return this.vscodeConfigManager.readExecPath();
  }

  private getDirectiveTypeNumber(directiveType: string): number {
    switch (directiveType) {
      case "Pre":
        return 1;
      case "Base":
        return 2;
      case "Post":
        return 3;
      case "Standard":
        return 1;
      case "In-Transaction":
        return 0;
      default:
        throw new Error(`Invalid directive type: ${directiveType}`);
    }
  }

  getTreeItem(element: any): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: EpicorNode): Promise<EpicorNode[]> {
    if (!element) {
      //1st level
      return [
        new EpicorNode(
          "Method Directives",
          vscode.TreeItemCollapsibleState.Collapsed,
        ),
        new EpicorNode(
          "Data Directives",
          vscode.TreeItemCollapsibleState.Collapsed,
        ),
      ];
    }

    // 3rd level
    if (element instanceof DirectiveNode) {
      if (element.type === "bom") {
        return this.getProcessingNodes("bom", element.data.SysRowID);
      } else {
        return this.getProcessingNodes("table", element.data.SysRowID);
      }
    }

    //4th level
    if (
      element instanceof BomProcessingNode ||
      element instanceof TableProcessingNode
    ) {
      if (element instanceof BomProcessingNode) {
        return await this.describeBom(
          "bom",
          element.parentSysRowId,
          this.getDirectiveTypeNumber(element.directiveType),
        );
      } else {
        return await this.describeTable(
          "table",
          element.parentSysRowId,
          this.getDirectiveTypeNumber(element.directiveType),
        );
      }
    }

    // 2nd level
    if (element instanceof EpicorNode) {
      if (element.label === "Method Directives") {
        return await this.getBoms();
      } else {
        return await this.getTables();
      }
    }
    return [];
  }

  private async getBoms(): Promise<DirectiveNode[]> {
    const boms = JSON.parse(await getBoms(this.execPath ?? "", "json"));

    return boms.map(
      (bom: any) =>
        new DirectiveNode(
          this.formatBpMethodCode(bom.BpMethodCode),
          vscode.TreeItemCollapsibleState.Collapsed,
          "bom",
          bom,
        ),
    );
  }

  private async getTables(): Promise<DirectiveNode[]> {
    const tables = JSON.parse(await getTables(this.execPath ?? "", "json"));

    return tables.map(
      (table: any) =>
        new DirectiveNode(
          table.BusinessObject,
          vscode.TreeItemCollapsibleState.Collapsed,
          "table",
          table,
        ),
    );
  }

  private async getProcessingNodes(
    directiveType: "bom" | "table",
    parentSysRowId: string,
  ): Promise<BomProcessingNode[] | TableProcessingNode[]> {
    if (directiveType === "bom") {
      return [
        new BomProcessingNode(
          "Pre",
          vscode.TreeItemCollapsibleState.Collapsed,
          "Pre",
          parentSysRowId,
        ),
        new BomProcessingNode(
          "Base",
          vscode.TreeItemCollapsibleState.Collapsed,
          "Base",
          parentSysRowId,
        ),
        new BomProcessingNode(
          "Post",
          vscode.TreeItemCollapsibleState.Collapsed,
          "Post",
          parentSysRowId,
        ),
      ];
    } else {
      return [
        new TableProcessingNode(
          "Standard",
          vscode.TreeItemCollapsibleState.Collapsed,
          "Standard",
          parentSysRowId,
        ),
        new TableProcessingNode(
          "In-Transaction",
          vscode.TreeItemCollapsibleState.Collapsed,
          "In-Transaction",
          parentSysRowId,
        ),
      ];
    }
  }

  private async describeBom(
    parentType: "bom" | "table",
    parentSysRowId: string,
    directiveType: number,
  ): Promise<BpmNode[]> {
    const bomData = JSON.parse(
      await describeBom(this.execPath ?? "", parentSysRowId, "json"),
    );

    return bomData[1].returnObj.BpDirective.filter(
      (bpm: any) => bpm.DirectiveType === directiveType,
    )
      .sort((a: any, b: any) => a.Order - b.Order)
      .map(
        (bpm: any) =>
          new BpmNode(bpm.Name, parentType, parentSysRowId, "bpm", bpm),
      );
  }

  private async describeTable(
    parentType: "bom" | "table",
    parentSysRowId: string,
    directiveType: number,
  ): Promise<BpmNode[]> {
    const bpmData = JSON.parse(
      await describeTable(this.execPath ?? "", parentSysRowId, "json"),
    );

    return bpmData[1].returnObj.BpDirective.filter(
      (bpm: any) => bpm.DirectiveType === directiveType,
    )
      .sort((a: any, b: any) => a.Order - b.Order)
      .map(
        (bpm: any) =>
          new BpmNode(bpm.Name, parentType, parentSysRowId, "bpm", bpm),
      );
  }

  private formatBpMethodCode(bpMethodCode: string): string {
    return bpMethodCode.split(".").slice(2).join(".");
  }
}

export class EpicorNode extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
    this.iconPath = path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "epicorIcon.png",
    );
  }
}

export class BomProcessingNode extends EpicorNode {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public directiveType: "Pre" | "Base" | "Post",
    public parentSysRowId: string,
    public type = "bom",
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon("file-directory");
  }
}

export class TableProcessingNode extends EpicorNode {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public directiveType: "Standard" | "In-Transaction",
    public parentSysRowId: string,
    public type = "table",
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon("file-directory");
  }
}

export class DirectiveNode extends EpicorNode {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    //public sysRowId: string,
    public type: "bom" | "table",
    public data:
      | MethodDirectiveStateManagerInterface
      | DataDirectiveStateManagerInterface,
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon("layers");
  }
}

export class BpmNode extends EpicorNode {
  constructor(
    label: string,
    public parentType: "bom" | "table",
    public parentSysRowId: string,
    public type: "bpm",
    public data: BpmStateManagerInterface,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon("gear");
  }
}
