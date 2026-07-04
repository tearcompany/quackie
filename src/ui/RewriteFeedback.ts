import * as vscode from 'vscode';

const FEEDBACK_MS = 4000;

export class RewriteFeedback implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      50,
    );
    this.statusBarItem.name = 'Quackie rewrite feedback';
  }

  dispose(): void {
    this.clearTimer();
    this.statusBarItem.dispose();
  }

  showRewrote(): void {
    this.clearTimer();
    this.statusBarItem.text = '$(check) Quackie rewrote your commit';
    this.statusBarItem.tooltip = 'Quackie updated your commit message';
    this.statusBarItem.show();
    this.hideTimer = setTimeout(() => {
      this.statusBarItem.hide();
      this.hideTimer = undefined;
    }, FEEDBACK_MS);
  }

  private clearTimer(): void {
    if (this.hideTimer !== undefined) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }
}
