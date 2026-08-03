import * as vscode from "vscode";
import { ConfigQuickPickItem } from "../utils/registryUtils";
import { fields } from "../utils/handlerUtils";

interface InitManifestInterface {
  entity_type: string;
  entity_id: string;
  manifest_name: string;
  directivetype: string | undefined;
  description: string;
  group: string;
  order: string;
  scope: string;
}

interface CloneManifestInterface {
  entity_type: string;
  entity_id: string;
  parent_id: string;
  manifest_dir_path: string;
}

const ALLOWED_NULL_VALUES = ["description", "group", "order", "scope"];

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
          prompt: "Enter the parent id",
          ignoreFocusOut: true,
        });
      },
      manifest_name: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the manifest name (bpm name)",
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
      update_fields: async (fields) => {
        return await vscode.window.showQuickPick(fields, {
          placeHolder: "Select the fields you want to update",
          canPickMany: true,
          ignoreFocusOut: true,
        });
      },
      // Init Manifest Prompts--------------------------------------------------
      directive_type__bom: async () => {
        const result = await vscode.window.showQuickPick(
          ["Pre", "Base", "Post"],
          {
            placeHolder: "Select the directive type",
            ignoreFocusOut: true,
          },
        );
        return result === "Pre"
          ? 1
          : result === "Base"
            ? 2
            : result === "Post"
              ? 3
              : undefined;
      },
      directive_type__table: async () => {
        const result = await vscode.window.showQuickPick(
          ["Standard", "In-Transaction"],
          {
            placeHolder: "Select the directive type",
            ignoreFocusOut: true,
          },
        );
        return result === "Standard"
          ? 1
          : result === "In-Transaction"
            ? 0
            : undefined;
      },
      description: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the description",
          ignoreFocusOut: true,
        });
      },
      group: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the group name",
          ignoreFocusOut: true,
        });
      },
      order: async () => {
        return await vscode.window.showInputBox({
          prompt: "Enter the order",
          ignoreFocusOut: true,
        });
      },
      scope: async () => {
        const result = await vscode.window.showQuickPick(
          ["Company Specific (0)", "Company Independent (1)"],
          {
            placeHolder: "Select the scope",
            ignoreFocusOut: true,
          },
        );
        return result === "Company Specific (0)"
          ? 0
          : result === "Company Independent (1)"
            ? 1
            : undefined;
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
    let fullState: Partial<InitManifestInterface>;
    if (!inputState.directivetype) {
      inputState.directivetype =
        await this.prompts[`directive_type__${inputState.entity_type}`]();
    }
    fullState = await this.promptForMissingFields(inputState, [
      "entity_type",
      "entity_id",
      "manifest_name",
      "directivetype",
      "description",
      "group",
      "order",
      "scope",
    ]);

    // check one more time for null values
    for (const field of Object.keys(fullState)) {
      if (
        fullState[field as keyof typeof fullState] === null ||
        fullState[field as keyof typeof fullState] === undefined
      ) {
        if (!ALLOWED_NULL_VALUES.includes(field)) {
          throw new Error(`${field} is required`);
        }
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
      if (
        fullState[field as keyof typeof fullState] === null ||
        fullState[field as keyof typeof fullState] === undefined
      ) {
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

  public async promptUpdateFields(fields: any[]) {
    return await this.prompts.update_fields(fields);
  }

  public async promptDirectiveType(type: string): Promise<string | undefined> {
    return await this.prompts[`directive_type__${type}`]();
  }

  public async promptDescription(): Promise<string | undefined> {
    return await this.prompts.description();
  }

  public async promptGroupName(): Promise<string | undefined> {
    return await this.prompts.group();
  }

  public async promptOrder(): Promise<string | undefined> {
    return await this.prompts.order();
  }

  public async promptScope(): Promise<string | undefined> {
    return await this.prompts.scope();
  }
}
