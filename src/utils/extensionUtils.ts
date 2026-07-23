import * as vscode from "vscode";

// universal helper to get the name of the active file
export const getActiveFilename = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }
  return editor.document.uri.fsPath;
};
