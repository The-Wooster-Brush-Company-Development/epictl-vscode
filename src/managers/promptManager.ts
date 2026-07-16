import * as vscode from "vscode";
import { ConfigQuickPickItem } from "../utils/registryUtils";

interface InitManifestInterface {
  entity_type: string;
  entity_id: string;
  manifest_name: string;
}

interface CloneManifestInterface {
  entity_type: string;
  entity_id: string;
  parent_id: string;
  manifest_dir_path: string;
}

export class PromptManager {
  private prompts: Record<string, (...args: any[]) => Promise<any>>;
  constructor() {
    this.prompts = {
      entity_type: async () => {
        return await vscode.window.showQuickPick(["bom", "table"], {
          placeHolder: "Select the entity type",
          ignoreFocusOut: true,
        });
      },
      entity_id: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the entity id",
          ignoreFocusOut: true,
        });
      },
      parent_id: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the entity parent id",
          ignoreFocusOut: true,
        });
      },
      manifest_name: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the manifest name",
          ignoreFocusOut: true,
        });
      },
      manifest_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the manifest path",
          ignoreFocusOut: true,
        });
      },
      exec_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the exec path",
          ignoreFocusOut: true,
        });
      },
      extension_config_id: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the config id",
          ignoreFocusOut: true,
        });
      },
      code_dir_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the code dir path",
          ignoreFocusOut: true,
        });
      },
      manifest_dir_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the manifest dir path",
          ignoreFocusOut: true,
        });
      },
      manifest_selection: async (manifestFiles: string[]) => {
        return await vscode.window.showQuickPick(manifestFiles, {
          placeHolder: "Select the manifest file to delete",
          canPickMany: true,
          ignoreFocusOut: true,
        });
      },
      code_file_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the code file path",
          ignoreFocusOut: true,
        });
      },
      manifest_file_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the manifest file path",
          ignoreFocusOut: true,
        });
      },
      confirm: async () => {
        return await vscode.window.showQuickPick(["Yes", "No"], {
          placeHolder: "Confirm",
          ignoreFocusOut: true,
        });
      },
      config_base_url_path: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the config base url path",
          ignoreFocusOut: true,
        });
      },
      config_username: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the config username",
          ignoreFocusOut: true,
        });
      },
      config_password: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the config password",
          ignoreFocusOut: true,
        });
      },
      cli_config_id: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the config id",
          ignoreFocusOut: true,
        });
      },
      config_api_key: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the config api key",
          ignoreFocusOut: true,
        });
      },
      output_type: async () => {
        return await vscode.window.showQuickPick(["table", "json"], {
          placeHolder: "Select the output type",
          ignoreFocusOut: true,
        });
      },
      config_selection: async (configOptions: ConfigQuickPickItem[]) => {
        return await vscode.window.showQuickPick(configOptions, {
          placeHolder: "Select the config to set",
          ignoreFocusOut: true,
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

  private async promptForMissingFields<T extends object>(
    obj: Partial<T>,
    requiredFields: (keyof T)[],
  ): Promise<Partial<T>> {
    const missingFields = this.getMissingFields(obj, requiredFields);
    for (const field of missingFields) {
      obj[field] = await this.prompts[field as keyof typeof this.prompts]();
    }
    return obj;
  }

  public async resolveInitManifest(
    inputState: Partial<InitManifestInterface>,
  ): Promise<InitManifestInterface> {
    const fullState = await this.promptForMissingFields(inputState, [
      "entity_type",
      "entity_id",
      "manifest_name",
    ]);

    // check one more time for null values
    for (const field of Object.keys(fullState)) {
      if (fullState[field as keyof typeof fullState] === null) {
        throw new Error(`${field} is required`);
      }
    }

    return fullState as InitManifestInterface;
  }

  public async resolveCloneManifest(
    inputState: Partial<CloneManifestInterface>,
    manifestDirPath: string,
  ): Promise<CloneManifestInterface> {
    const fullState = await this.promptForMissingFields(inputState, [
      "entity_type",
      "entity_id",
      "parent_id",
    ]);

    fullState.manifest_dir_path = manifestDirPath;

    // check one more time for null values
    for (const field of Object.keys(fullState)) {
      if (fullState[field as keyof typeof fullState] === null) {
        throw new Error(`${field} is required`);
      }
    }

    return fullState as CloneManifestInterface;
  }

  // Prompt methods, mainly for command palette

  public async promptConfirm(): Promise<string | undefined> {
    return await this.prompts.confirm();
  }

  public async promptEntityType(): Promise<string | undefined> {
    return await this.prompts.entity_type();
  }

  public async promptEntityId(): Promise<string | undefined> {
    return await this.prompts.entity_id();
  }

  public async promptParentId(): Promise<string | undefined> {
    return await this.prompts.parent_id();
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
    return await this.prompts.extension_config_id();
  }

  public async promptCodeDirPath(): Promise<string | undefined> {
    return await this.prompts.code_dir_path();
  }

  public async promptManifestDirPath(): Promise<string | undefined> {
    return await this.prompts.manifest_dir_path();
  }

  public async promptManifestSelection(
    manifestFiles: string[],
  ): Promise<string[] | undefined> {
    return await this.prompts.manifest_selection(manifestFiles);
  }

  public async promptCodeFilePath(): Promise<string | undefined> {
    return await this.prompts.code_file_path();
  }

  public async promptConfigBaseUrlPath(): Promise<string | undefined> {
    return await this.prompts.config_base_url_path();
  }

  public async promptConfigUsername(): Promise<string | undefined> {
    return await this.prompts.config_username();
  }

  public async promptConfigPassword(): Promise<string | undefined> {
    return await this.prompts.config_password();
  }

  public async promptCliConfigId(): Promise<string | undefined> {
    return await this.prompts.cli_config_id();
  }

  public async promptConfigApiKey(): Promise<string | undefined> {
    return await this.prompts.config_api_key();
  }

  public async promptOutputType(): Promise<string | undefined> {
    return await this.prompts.output_type();
  }

  public async promptConfigSelection(
    configOptions: ConfigQuickPickItem[],
  ): Promise<ConfigQuickPickItem | undefined> {
    return await this.prompts.config_selection(configOptions);
  }
}
