import * as vscode from 'vscode';

export async function showRewriteError(error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const choice = await vscode.window.showErrorMessage(
    `Quackie rewrite failed: ${message}`,
    'Open Settings',
  );

  if (choice === 'Open Settings') {
    void vscode.commands.executeCommand('workbench.action.openSettings', 'quackie');
  }
}
