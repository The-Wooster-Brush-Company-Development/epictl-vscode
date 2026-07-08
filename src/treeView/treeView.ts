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

export class EpictlTreeView implements vscode.TreeDataProvider<any> {
  private vscodeConfigManager: VsCodeConfigManager;
  private manifestManager: ManifestManager;

  constructor(
    vscodeConfigManager: VsCodeConfigManager,
    manifestManager: ManifestManager,
  ) {
    this.vscodeConfigManager = vscodeConfigManager;
    this.manifestManager = manifestManager;
  }

  get execPath(): string | undefined {
    return this.vscodeConfigManager.readExecPath();
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

    if (element instanceof BpmNode) {
      if (element.parentType === "bom") {
        await this.getBomBpmData(element);
      } else {
        await this.getTableBpmData(element);
      }
      return [];
    }

    if (element instanceof DirectiveNode) {
      if (element.type === "bom") {
        return await this.getBomBpms(element.type, element.sysRowId);
      } else {
        return await this.getTableBpms(element.type, element.sysRowId);
      }
    }

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

  private async getBomBpms(
    parentType: "bom" | "table",
    parentSysRowId: string,
  ): Promise<BpmNode[]> {
    const bpmData = JSON.parse(
      await describeBom(this.execPath ?? "", parentSysRowId, "json"),
    );

    return bpmData[1].returnObj.BpDirective.map(
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

  private async getTableBpms(
    parentType: "bom" | "table",
    parentSysRowId: string,
  ): Promise<BpmNode[]> {
    const bpmData = JSON.parse(
      await describeTable(this.execPath ?? "", parentSysRowId, "json"),
    );

    return bpmData[1].returnObj.BpDirective.map(
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

  private async getBomBpmData(element: BpmNode): Promise<void> {
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
  }
  private async getTableBpmData(element: BpmNode): Promise<void> {
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
