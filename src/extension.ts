import * as path from 'path';
import * as vscode from 'vscode';
import { Configuration } from './config/Configuration';
import { CommitWatcher } from './git/CommitWatcher';
import { Repository } from './git/api/git';
import { GitWatcher } from './git/GitWatcher';
import { PersonaRecentStore } from './personas/PersonaRecentStore';
import { PersonaRegistry } from './personas/PersonaRegistry';
import { MockRewriteService } from './rewrite/MockRewriteService';
import { QuackieRewriteService } from './rewrite/QuackieRewriteService';
import { InstallTokenClient } from './rewrite/InstallTokenClient';
import { InstallTokenStore } from './rewrite/InstallTokenStore';
import { RewriteService } from './rewrite/RewriteService';
import { RewriteServiceRouter } from './rewrite/RewriteServiceRouter';
import { runPersonaCommitFlow } from './ui/PersonaCommitFlow';
import { PersonaStatusBar, showPersonaPicker } from './ui/PersonaStatusBar';
import { RewriteFeedback } from './ui/RewriteFeedback';

async function pickRepository(
  repositories: Map<string, Repository>,
  title: string,
): Promise<Repository | undefined> {
  const all = [...repositories.values()];
  if (all.length <= 1) {
    return all[0];
  }

  const items = all.map((repository) => ({
    label: path.basename(repository.rootUri.fsPath),
    description: repository.rootUri.fsPath,
    repository,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    title,
    placeHolder: 'Multiple Git repositories are open — pick one',
  });

  return selected?.repository;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const configuration = new Configuration();
  const personaRegistry = new PersonaRegistry(configuration, context.extensionUri);
  const recentStore = new PersonaRecentStore(context);
  await personaRegistry.reload();

  const installTokenStore = new InstallTokenStore(context);
  const installTokenClient = new InstallTokenClient(configuration, installTokenStore);
  const mockRewriteService = new MockRewriteService(personaRegistry);
  const quackieRewriteService = new QuackieRewriteService(
    personaRegistry,
    configuration,
    installTokenClient,
  );
  const rewriteService: RewriteService = new RewriteServiceRouter(
    configuration,
    mockRewriteService,
    quackieRewriteService,
  );

  const rewriteFeedback = new RewriteFeedback();
  const gitWatcher = new GitWatcher();
  const statusBar = new PersonaStatusBar(personaRegistry, configuration);

  const watchers = new Map<string, CommitWatcher>();
  const repositories = new Map<string, Repository>();

  const disposeAllWatchers = (): void => {
    for (const watcher of watchers.values()) {
      watcher.dispose();
    }
    watchers.clear();
    repositories.clear();
  };

  context.subscriptions.push({ dispose: disposeAllWatchers });

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
      if (repositories.size === 0) {
        return;
      }

      const withDraft = [...repositories.entries()].filter(([, repository]) =>
        repository.inputBox.value.trim(),
      );

      if (withDraft.length === 1) {
        await watchers.get(withDraft[0][0])?.rewriteNow();
        return;
      }

      if (withDraft.length > 1) {
        const picked = await pickRepository(
          new Map(withDraft.map(([key, repository]) => [key, repository])),
          'Quackie: Rewrite Now',
        );
        if (picked) {
          await watchers.get(picked.rootUri.toString())?.rewriteNow();
        }
        return;
      }

      const repository = await pickRepository(repositories, 'Quackie: Rewrite Now');
      if (repository) {
        await watchers.get(repository.rootUri.toString())?.rewriteNow();
      }
    }),
    vscode.commands.registerCommand('quackie.commitWithPersona', async () => {
      if (repositories.size === 0) {
        void vscode.window.showWarningMessage('Quackie: no Git repository found');
        return;
      }

      const repository = await pickRepository(repositories, 'Quackie: Commit with Persona');
      if (!repository) {
        return;
      }

      const key = repository.rootUri.toString();
      await runPersonaCommitFlow(
        repository,
        personaRegistry,
        recentStore,
        rewriteService,
        rewriteFeedback,
        watchers.get(key),
      );
    }),
  );
}

export function deactivate(): void {}
