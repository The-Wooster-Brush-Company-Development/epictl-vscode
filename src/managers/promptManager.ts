import * as vscode from "vscode";

interface InitManifestInput {
  entity_type: string;
  entity_parent_id: string;
  manifest_name: string;
}

export class PromptManager {
  private prompts: Record<string, () => Promise<string | undefined>>;
  constructor() {
    this.prompts = {
      entity_type: async () => {
        return await vscode.window.showQuickPick(["bom", "table"], {
          placeHolder: "Select the entity type",
        });
      },
      entity_id: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the entity id",
        });
      },
      entity_parent_id: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the entity parent id",
        });
      },
      manifest_name: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the manifest name",
        });
      },
      manifest_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the manifest path",
        });
      },
      exec_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the exec path",
        });
      },
      config_id: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the config id",
        });
      },
      code_dir_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the code dir path",
        });
      },
      manifest_dir_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the manifest dir path",
        });
      },
      code_file_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the code file path",
        });
      },
      manifest_file_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the manifest file path",
        });
      },
    };
  }

  private getMissingFields<T extends object>(
    obj: Partial<T>,
    requiredFields: (keyof T)[],
  ): (keyof T)[] {
    return requiredFields.filter((field) => obj[field] === undefined);
  }

  public resolveInitManifest(input: Partial<InitManifestInput>) {
    const missingFields = this.getMissingFields(input, [
      "entity_type",
      "entity_parent_id",
      "manifest_name",
    ]);
  }

  // Prompt methods, mainly for command palette

  public async promptEntityType(): Promise<string | undefined> {
    return await this.prompts.entity_type();
  }

  public async promptEntityId(): Promise<string | undefined> {
    return await this.prompts.entity_id();
  }

  public async promptEntityParentId(): Promise<string | undefined> {
    return await this.prompts.entity_parent_id();
  }

  public async promptManifestName(): Promise<string | undefined> {
    return await this.prompts.manifest_name();
  }

  public async promptManifestPath(): Promise<string | undefined> {
    return await this.prompts.manifest_path();
  }

  public async promptExecPath(): Promise<string | undefined> {
    return await this.prompts.exec_path();
  }

  public async promptConfigId(): Promise<string | undefined> {
    return await this.prompts.config_id();
  }

  public async promptCodeDirPath(): Promise<string | undefined> {
    return await this.prompts.code_dir_path();
  }

  public async promptManifestDirPath(): Promise<string | undefined> {
    return await this.prompts.manifest_dir_path();
  }

  public async promptCodeFilePath(): Promise<string | undefined> {
    return await this.prompts.code_file_path();
  }
}
