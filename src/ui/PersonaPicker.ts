import * as vscode from 'vscode';
import { PersonaRecentStore } from '../personas/PersonaRecentStore';
import { isPersonaPackId, PERSONA_PACK_LABELS, PERSONA_PACK_ORDER } from '../personas/packs';
import { PersonaRegistry } from '../personas/PersonaRegistry';
import { PersonaSummary } from '../personas/types';

interface PersonaPickItem extends vscode.QuickPickItem {
  personaId: string;
}

export async function pickPersona(
  personaRegistry: PersonaRegistry,
  recentStore: PersonaRecentStore,
  options?: { title?: string },
): Promise<PersonaSummary | undefined> {
  const personas = personaRegistry.getAll();
  if (personas.length === 0) {
    void vscode.window.showWarningMessage('No personas found in configured paths');
    return undefined;
  }

  const current = personaRegistry.getCurrent();
  const recentIds = recentStore.getRecentIds();
  const items: Array<PersonaPickItem | vscode.QuickPickItem> = [];

  const recentPersonas = recentIds
    .map((id) => personas.find((persona) => persona.id === id))
    .filter((persona): persona is PersonaSummary => persona !== undefined);

  if (recentPersonas.length > 0) {
    items.push({ kind: vscode.QuickPickItemKind.Separator, label: 'Recent' });
    for (const persona of recentPersonas) {
      items.push(toPickItem(persona, current?.id === persona.id));
    }
    items.push({ kind: vscode.QuickPickItemKind.Separator, label: 'All personas' });
  }

  for (const pack of PERSONA_PACK_ORDER) {
    const packPersonas = personas.filter((persona) => persona.pack === pack);
    if (packPersonas.length === 0) {
      continue;
    }

    items.push({
      kind: vscode.QuickPickItemKind.Separator,
      label: PERSONA_PACK_LABELS[pack],
    });

    for (const persona of packPersonas) {
      items.push(toPickItem(persona, current?.id === persona.id));
    }
  }

  const selected = await vscode.window.showQuickPick(items, {
    title: options?.title ?? 'Select Quackie persona',
    placeHolder: 'Pick a persona by pack',
    matchOnDescription: true,
  });

  if (!selected || !('personaId' in selected)) {
    return undefined;
  }

  const persona = personas.find((entry) => entry.id === selected.personaId);
  if (!persona) {
    return undefined;
  }

  await personaRegistry.setCurrent(persona.id);
  await recentStore.remember(persona.id);
  return persona;
}

function toPickItem(persona: PersonaSummary, picked: boolean): PersonaPickItem {
  const packLabel = isPersonaPackId(persona.pack)
    ? PERSONA_PACK_LABELS[persona.pack]
    : persona.pack;

  return {
    label: `${persona.emoji} ${persona.name}`,
    description: persona.voice ?? packLabel,
    detail: persona.voice ? packLabel : undefined,
    personaId: persona.id,
    picked,
  };
}
