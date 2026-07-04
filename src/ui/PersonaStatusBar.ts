import * as vscode from 'vscode';
import { Configuration } from '../config/Configuration';
import { isPersonaPackId, PERSONA_PACK_LABELS } from '../personas/packs';
import { PersonaRecentStore } from '../personas/PersonaRecentStore';
import { PersonaRegistry } from '../personas/PersonaRegistry';
import { pickPersona } from './PersonaPicker';

export class PersonaStatusBar implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly personaRegistry: PersonaRegistry,
    private readonly configuration: Configuration,
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = 'quackie.selectPersona';

    this.disposables.push(
      this.statusBarItem,
      this.personaRegistry.onDidChange(() => this.refresh()),
      this.configuration.onDidChange(() => this.refresh()),
    );

    this.refresh();
    this.statusBarItem.show();
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private refresh(): void {
    const autoRewriteState = this.configuration.isAutoRewriteEnabled()
      ? 'Auto-rewrite: on'
      : 'Auto-rewrite: off';

    const current = this.personaRegistry.getCurrent();
    if (!current) {
      this.statusBarItem.text = 'Quackie';
      this.statusBarItem.tooltip = `Select Quackie persona. ${autoRewriteState}.`;
      return;
    }

    const packLabel = isPersonaPackId(current.pack)
      ? PERSONA_PACK_LABELS[current.pack]
      : current.pack;
    const voicePart = current.voice ? ` — ${current.voice}` : '';
    this.statusBarItem.text = `${current.emoji} ${current.name}`;
    this.statusBarItem.tooltip = `${current.name} (${packLabel})${voicePart}. Click to change persona. ${autoRewriteState}.`;
  }
}

export async function showPersonaPicker(
  personaRegistry: PersonaRegistry,
  recentStore: PersonaRecentStore,
): Promise<void> {
  await pickPersona(personaRegistry, recentStore);
}
