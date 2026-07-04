import * as vscode from 'vscode';

const STORAGE_KEY = 'quackie.installToken';

export class InstallTokenStore {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async get(): Promise<string | undefined> {
    return this.context.secrets.get(STORAGE_KEY);
  }

  async set(token: string): Promise<void> {
    await this.context.secrets.store(STORAGE_KEY, token);
  }

  async clear(): Promise<void> {
    await this.context.secrets.delete(STORAGE_KEY);
  }
}
