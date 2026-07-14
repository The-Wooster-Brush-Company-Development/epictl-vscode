import * as vscode from "vscode";

export class NotificationManager {
  private outputChannel = vscode.window.createOutputChannel("WBC");

  public error(message: string) {
    this.outputChannel.clear();
    this.outputChannel.appendLine(message);
    this.outputChannel.show();
    vscode.window.showErrorMessage("Error");
  }

  public success(message: string) {
    this.outputChannel.clear();
    this.outputChannel.appendLine(message);
    this.outputChannel.show();
    vscode.window.showInformationMessage("Success");
  }
}
