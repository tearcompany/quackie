import * as vscode from 'vscode';
import { isPersonaPackId, PERSONA_PACK_LABELS } from '../personas/packs';
import { PersonaRecentStore } from '../personas/PersonaRecentStore';
import { PersonaRegistry } from '../personas/PersonaRegistry';
import { pickPersona } from './PersonaPicker';

export class PersonaStatusBar implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly personaRegistry: PersonaRegistry) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = 'quackie.selectPersona';

    this.disposables.push(
      this.statusBarItem,
      this.personaRegistry.onDidChange(() => this.refresh()),
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
    const current = this.personaRegistry.getCurrent();
    if (!current) {
      this.statusBarItem.text = 'Quackie';
      this.statusBarItem.tooltip = 'Select Quackie persona';
      return;
    }

    const packLabel = isPersonaPackId(current.pack)
      ? PERSONA_PACK_LABELS[current.pack]
      : current.pack;
    this.statusBarItem.text = `${current.emoji} ${current.name}`;
    this.statusBarItem.tooltip = current.voice
      ? `${current.name} (${packLabel}) — ${current.voice}. Click to change persona.`
      : `${current.name} (${packLabel}). Click to change persona.`;
  }
}

export async function showPersonaPicker(
  personaRegistry: PersonaRegistry,
  recentStore: PersonaRecentStore,
): Promise<void> {
  await pickPersona(personaRegistry, recentStore);
}
