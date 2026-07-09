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

export class EpictlTreeView implements vscode.TreeDataProvider<any> {
  private vscodeConfigManager: VsCodeConfigManager;
  private manifestManager: ManifestManager;

  constructor(
    vscodeConfigManager: VsCodeConfigManager,
    manifestManager: ManifestManager,
    private readonly bpmWebview: BpmWebview,
  ) {
    this.vscodeConfigManager = vscodeConfigManager;
    this.manifestManager = manifestManager;
  }

  get execPath(): string | undefined {
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
      case "In-Transition":
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

    // 2nd level
    if (element instanceof DirectiveNode) {
      console.log("clicked directive node");
      if (element.type === "bom") {
        return this.getProcessingNodes("bom", element.sysRowId);
      } else {
        return this.getProcessingNodes("table", element.sysRowId);
      }
    }

    //3rd level
    if (
      element instanceof BomProcessingNode ||
      element instanceof TableProcessingNode
    ) {
      console.log("clicked processing node");
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

    // 4th level
    if (element instanceof BpmNode) {
      if (element.parentType === "bom") {
        await this.describeBomBpm(element);
      } else {
        await this.describeTableBpm(element);
      }
      return [];
    }

    // 1st level
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
          bom.SysRowID,
          "bom",
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
          table.SysRowID,
          "table",
        ),
    );
  }

  private getProcessingNodes(
    directiveType: "bom" | "table",
    parentSysRowId: string,
  ): BomProcessingNode[] | TableProcessingNode[] {
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
          "In-Transition",
          vscode.TreeItemCollapsibleState.Collapsed,
          "In-Transition",
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
          new BpmNode(
            bpm.Name,
            vscode.TreeItemCollapsibleState.Collapsed,
            bpm.DirectiveID,
            parentType,
            parentSysRowId,
          ),
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
          new BpmNode(
            bpm.Name,
            vscode.TreeItemCollapsibleState.Collapsed,
            bpm.DirectiveId,
            parentType,
            parentSysRowId,
          ),
      );
  }

  private async describeBomBpm(element: BpmNode): Promise<void> {
    console.log(`element type: ${typeof element}`);
    console.log(`element: ${JSON.stringify(element)}`);
    const bpmData = JSON.parse(
      await describeBpm(
        this.execPath ?? "",
        undefined,
        `${element.directiveId}`,
        "bom",
        element.parentSysRowId,
        "json",
      ),
    );

    const message = {
      command: "describeBomBpm",
      data: bpmData,
    };

    this.bpmWebview.postMessage(message);
  }
  private async describeTableBpm(element: BpmNode): Promise<void> {
    console.log(`element type: ${typeof element}`);
    console.log(`element: ${element}`);
    const bpmData = JSON.parse(
      await describeBpm(
        this.execPath ?? "",
        undefined,
        `${element.directiveId}`,
        "table",
        element.parentSysRowId,
        "json",
      ),
    );
  }

  private formatBpMethodCode(bpMethodCode: string): string {
    return bpMethodCode.split(".").slice(2).join(".");
  }
}

class EpicorNode extends vscode.TreeItem {
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

class BomProcessingNode extends EpicorNode {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public directiveType: "Pre" | "Base" | "Post",
    public parentSysRowId: string,
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon("file-directory");
  }
}

class TableProcessingNode extends EpicorNode {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public directiveType: "Standard" | "In-Transition",
    public parentSysRowId: string,
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon("file-directory");
  }
}

class DirectiveNode extends EpicorNode {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public sysRowId: string,
    public type: "bom" | "table",
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon("layers");
  }
}

class BpmNode extends EpicorNode {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public directiveId: string,
    public parentType: "bom" | "table",
    public parentSysRowId: string,
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon("gear");
  }
}
