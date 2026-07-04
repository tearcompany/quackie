import * as vscode from 'vscode';
import { Configuration } from './config/Configuration';
import { CommitWatcher } from './git/CommitWatcher';
import { Repository } from './git/api/git';
import { GitWatcher } from './git/GitWatcher';
import { PersonaRecentStore } from './personas/PersonaRecentStore';
import { PersonaRegistry } from './personas/PersonaRegistry';
import { MockRewriteService } from './rewrite/MockRewriteService';
import { QuackieRewriteService } from './rewrite/QuackieRewriteService';
import { RewriteService } from './rewrite/RewriteService';
import { RewriteServiceRouter } from './rewrite/RewriteServiceRouter';
import { runPersonaCommitFlow } from './ui/PersonaCommitFlow';
import { PersonaStatusBar, showPersonaPicker } from './ui/PersonaStatusBar';
import { RewriteFeedback } from './ui/RewriteFeedback';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const configuration = new Configuration();
  const personaRegistry = new PersonaRegistry(configuration, context.extensionUri);
  const recentStore = new PersonaRecentStore(context);
  await personaRegistry.reload();

  const mockRewriteService = new MockRewriteService(personaRegistry);
  const quackieRewriteService = new QuackieRewriteService(personaRegistry, configuration);
  const rewriteService: RewriteService = new RewriteServiceRouter(
    configuration,
    mockRewriteService,
    quackieRewriteService,
  );

  const rewriteFeedback = new RewriteFeedback();
  const gitWatcher = new GitWatcher();
  const statusBar = new PersonaStatusBar(personaRegistry);

  const watchers = new Map<string, CommitWatcher>();
  const repositories = new Map<string, Repository>();

  const attach = (repository: Repository): void => {
    const key = repository.rootUri.toString();
    watchers.get(key)?.dispose();
    watchers.set(
      key,
      new CommitWatcher(
        repository,
        personaRegistry,
        rewriteService,
        configuration,
        rewriteFeedback,
        recentStore,
      ),
    );
    repositories.set(key, repository);
  };

  try {
    const api = await gitWatcher.getAPI();
    for (const repository of api.repositories) {
      attach(repository);
    }

    context.subscriptions.push(
      api.onDidOpenRepository((repository) => attach(repository)),
      api.onDidCloseRepository((repository) => {
        const key = repository.rootUri.toString();
        watchers.get(key)?.dispose();
        watchers.delete(key);
        repositories.delete(key);
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showWarningMessage(`Quackie: ${message}`);
  }

  context.subscriptions.push(
    statusBar,
    rewriteFeedback,
    personaRegistry,
    vscode.commands.registerCommand('quackie.selectPersona', () =>
      showPersonaPicker(personaRegistry, recentStore),
    ),
    vscode.commands.registerCommand('quackie.reloadPersonas', () => personaRegistry.reload()),
    vscode.commands.registerCommand('quackie.toggleAutoRewrite', async () => {
      const enabled = !configuration.isAutoRewriteEnabled();
      await configuration.setAutoRewriteEnabled(enabled);
      void vscode.window.showInformationMessage(
        `Quackie auto rewrite ${enabled ? 'enabled' : 'disabled'}`,
      );
    }),
    vscode.commands.registerCommand('quackie.rewriteNow', async () => {
      for (const watcher of watchers.values()) {
        await watcher.rewriteNow();
      }
    }),
    vscode.commands.registerCommand('quackie.commitWithPersona', async () => {
      const repository = repositories.values().next().value;
      if (!repository) {
        void vscode.window.showWarningMessage('Quackie: no Git repository found');
        return;
      }

      await runPersonaCommitFlow(
        repository,
        personaRegistry,
        recentStore,
        rewriteService,
        rewriteFeedback,
      );
    }),
  );
}

export function deactivate(): void {}
