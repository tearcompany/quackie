import * as vscode from 'vscode';
import { RewriteTargetType } from '../rewrite/types';

const SECTION = 'quackie';

const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_ENABLED_TARGETS: RewriteTargetType[] = ['commit'];
const DEFAULT_REWRITE_ENGINE: RewriteEngine = 'quackie';
const DEFAULT_API_URL = 'https://quackie.me/api/rewrite';

export type RewriteEngine = 'mock' | 'quackie';

export class Configuration {
  private get config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(SECTION);
  }

  getPersonaId(): string | undefined {
    const value = this.config.get<string>('persona', '');
    return value.length > 0 ? value : undefined;
  }

  async setPersonaId(id: string): Promise<void> {
    await this.config.update('persona', id, vscode.ConfigurationTarget.Global);
  }

  isAutoRewriteEnabled(): boolean {
    return this.config.get<boolean>('autoRewrite', true);
  }

  async setAutoRewriteEnabled(enabled: boolean): Promise<void> {
    await this.config.update('autoRewrite', enabled, vscode.ConfigurationTarget.Global);
  }

  getDebounceMs(): number {
    return this.config.get<number>('debounceMs', DEFAULT_DEBOUNCE_MS);
  }

  getEnabledTargets(): RewriteTargetType[] {
    return this.config.get<RewriteTargetType[]>('enabledTargets', DEFAULT_ENABLED_TARGETS);
  }

  isTargetEnabled(type: RewriteTargetType): boolean {
    return this.getEnabledTargets().includes(type);
  }

  getRewriteEngine(): RewriteEngine {
    return this.config.get<RewriteEngine>('rewriteEngine', DEFAULT_REWRITE_ENGINE);
  }

  async setRewriteEngine(engine: RewriteEngine): Promise<void> {
    await this.config.update('rewriteEngine', engine, vscode.ConfigurationTarget.Global);
  }

  getApiUrl(): string {
    return this.config.get<string>('apiUrl', DEFAULT_API_URL);
  }

  onDidChange(listener: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(SECTION)) {
        listener();
      }
    });
  }
}
