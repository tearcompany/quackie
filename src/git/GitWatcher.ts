import * as vscode from 'vscode';
import { API, GitExtension } from './api/git';

export class GitWatcher {
  private apiPromise: Promise<API> | undefined;

  async getAPI(): Promise<API> {
    if (!this.apiPromise) {
      this.apiPromise = this.resolveAPI();
    }

    return this.apiPromise;
  }

  private async resolveAPI(): Promise<API> {
    const extension = vscode.extensions.getExtension<GitExtension>('vscode.git');
    if (!extension) {
      throw new Error('Git extension is not available');
    }

    if (!extension.isActive) {
      await extension.activate();
    }

    const gitExtension = extension.exports;
    if (!gitExtension.enabled) {
      throw new Error('Git extension is disabled');
    }

    return gitExtension.getAPI(1);
  }
}
