import * as vscode from 'vscode';
import { CommitWatcher } from '../git/CommitWatcher';
import { Repository } from '../git/api/git';
import { PersonaRecentStore } from '../personas/PersonaRecentStore';
import { PersonaRegistry } from '../personas/PersonaRegistry';
import { RewriteService } from '../rewrite/RewriteService';
import { pickPersona } from './PersonaPicker';
import { RewriteFeedback } from './RewriteFeedback';
import { showRewriteError } from './showRewriteError';

export async function runPersonaCommitFlow(
  repository: Repository,
  personaRegistry: PersonaRegistry,
  recentStore: PersonaRecentStore,
  rewriteService: RewriteService,
  rewriteFeedback: RewriteFeedback,
  watcher?: CommitWatcher,
): Promise<void> {
  const draft = repository.inputBox.value.trim() || (await promptForDraft());
  if (!draft) {
    return;
  }

  const persona = await pickPersona(personaRegistry, recentStore, {
    title: 'Commit with persona',
  });
  if (!persona) {
    return;
  }

  let rewritten: string;
  try {
    rewritten = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Quackie' },
      () =>
        rewriteService.rewrite({
          persona: persona.id,
          type: 'commit',
          text: draft,
        }),
    );
  } catch (error) {
    void showRewriteError(error);
    return;
  }

  const accepted = await confirmRewrite(persona.emoji, persona.name, rewritten);
  if (!accepted) {
    return;
  }

  repository.inputBox.value = rewritten;
  watcher?.markGenerated(rewritten);
  rewriteFeedback.showRewrote();
  void vscode.commands.executeCommand('workbench.view.scm');
}

async function promptForDraft(): Promise<string | undefined> {
  const value = await vscode.window.showInputBox({
    prompt: 'Commit message to rewrite',
    placeHolder: 'fix validation',
  });

  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function confirmRewrite(emoji: string, name: string, rewritten: string): Promise<boolean> {
  const choice = await vscode.window.showInformationMessage(
    `${emoji} ${name}: ${rewritten}`,
    'Use rewrite',
    'Cancel',
  );

  return choice === 'Use rewrite';
}
