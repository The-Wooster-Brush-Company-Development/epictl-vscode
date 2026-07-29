import * as vscode from "vscode";

export class NotificationManager {
  private outputChannel = vscode.window.createOutputChannel("Epictl");

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

  public write(message: string) {
    this.outputChannel.clear();
    this.outputChannel.appendLine(message);
    this.outputChannel.show();
  }

  public notifySuccess(message: string) {
    vscode.window.showInformationMessage(message);
  }

  public notifyError(message: string) {
    vscode.window.showErrorMessage(message);
  }
}
