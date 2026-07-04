import * as vscode from 'vscode';
import { Repository } from '../git/api/git';
import { PersonaRecentStore } from '../personas/PersonaRecentStore';
import { PersonaRegistry } from '../personas/PersonaRegistry';
import { RewriteService } from '../rewrite/RewriteService';
import { pickPersona } from './PersonaPicker';
import { RewriteFeedback } from './RewriteFeedback';

export async function runPersonaCommitFlow(
  repository: Repository,
  personaRegistry: PersonaRegistry,
  recentStore: PersonaRecentStore,
  rewriteService: RewriteService,
  rewriteFeedback: RewriteFeedback,
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
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`Quackie rewrite failed: ${message}`);
    return;
  }

  const accepted = await confirmRewrite(persona.emoji, persona.name, draft, rewritten);
  if (!accepted) {
    return;
  }

  repository.inputBox.value = rewritten;
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

async function confirmRewrite(
  emoji: string,
  name: string,
  original: string,
  rewritten: string,
): Promise<boolean> {
  const choice = await vscode.window.showInformationMessage(
    `${emoji} ${name} rewrite ready`,
    { modal: true, detail: `${original}\n\n→\n\n${rewritten}` },
    'Use rewrite',
    'Cancel',
  );

  return choice === 'Use rewrite';
}
