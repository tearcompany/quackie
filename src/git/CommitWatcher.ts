import * as vscode from 'vscode';
import { Configuration } from '../config/Configuration';
import { PersonaRecentStore } from '../personas/PersonaRecentStore';
import { PersonaRegistry } from '../personas/PersonaRegistry';
import { RewriteService } from '../rewrite/RewriteService';
import { RewriteFeedback } from '../ui/RewriteFeedback';
import { showRewriteError } from '../ui/showRewriteError';
import { Repository } from './api/git';

const POLL_INTERVAL_MS = 150;
const MIN_DEBOUNCE_MS = 250;

export class CommitWatcher implements vscode.Disposable {
  private lastSeenValue = '';
  private lastOriginal = '';
  private lastGenerated = '';
  private frozen = false;
  private isUpdating = false;
  private generation = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly pollInterval: ReturnType<typeof setInterval>;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly repository: Repository,
    private readonly personaRegistry: PersonaRegistry,
    private readonly rewriteService: RewriteService,
    private readonly configuration: Configuration,
    private readonly rewriteFeedback: RewriteFeedback,
    private readonly recentStore: PersonaRecentStore,
  ) {
    this.lastSeenValue = repository.inputBox.value;
    this.pollInterval = setInterval(() => this.onPollTick(), POLL_INTERVAL_MS);

    this.disposables.push(
      configuration.onDidChange(() => {
        this.clearDebounce();
      }),
    );
  }

  markGenerated(text: string): void {
    this.lastGenerated = text;
    this.lastSeenValue = text;
    this.lastOriginal = text;
    this.frozen = false;
    this.clearDebounce();
  }

  async rewriteNow(): Promise<void> {
    if (this.isUpdating) {
      return;
    }

    const current = this.repository.inputBox.value.trim();
    if (!current) {
      return;
    }

    this.frozen = false;
    this.clearDebounce();
    await this.performRewrite(current);
  }

  dispose(): void {
    this.generation += 1;
    this.clearDebounce();
    clearInterval(this.pollInterval);
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private onPollTick(): void {
    if (this.isUpdating) {
      return;
    }

    const current = this.repository.inputBox.value;
    if (current === this.lastSeenValue) {
      return;
    }

    if (!current.trim()) {
      this.lastSeenValue = current;
      this.resetState();
      return;
    }

    if (current === this.lastGenerated) {
      this.lastSeenValue = current;
      return;
    }

    if (
      this.lastGenerated &&
      current !== this.lastGenerated &&
      current !== this.lastOriginal
    ) {
      this.frozen = true;
      this.lastSeenValue = current;
      return;
    }

    if (this.frozen) {
      this.lastSeenValue = current;
      return;
    }

    this.lastSeenValue = current;

    if (!this.configuration.isAutoRewriteEnabled()) {
      return;
    }

    if (!this.configuration.isTargetEnabled('commit')) {
      return;
    }

    if (!this.configuration.getPersonaId()) {
      return;
    }

    this.lastOriginal = current;
    this.scheduleRewrite();
  }

  private scheduleRewrite(): void {
    this.clearDebounce();

    const debounceMs = Math.max(this.configuration.getDebounceMs(), MIN_DEBOUNCE_MS);
    this.debounceTimer = setTimeout(() => {
      void this.performRewrite(this.lastOriginal);
    }, debounceMs);
  }

  private async performRewrite(original: string): Promise<void> {
    const trimmed = original.trim();
    if (!trimmed || this.isUpdating) {
      return;
    }

    const persona = this.personaRegistry.getCurrent();
    if (!persona) {
      return;
    }

    const rewriteGeneration = ++this.generation;
    this.isUpdating = true;
    const placeholder = `${persona.emoji} …`;
    this.repository.inputBox.value = placeholder;
    this.lastSeenValue = placeholder;

    try {
      const rewritten = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.SourceControl, title: 'Quackie' },
        () =>
          this.rewriteService.rewrite({
            persona: persona.id,
            type: 'commit',
            text: trimmed,
          }),
      );

      if (rewriteGeneration !== this.generation) {
        return;
      }

      const currentValue = this.repository.inputBox.value;
      if (currentValue !== placeholder) {
        this.lastSeenValue = currentValue;
        this.frozen = true;
        this.lastGenerated = '';
        return;
      }

      const changed = rewritten.trim().length > 0 && rewritten !== trimmed;
      const finalText = changed ? rewritten : original;
      this.repository.inputBox.value = finalText;
      this.lastGenerated = finalText;
      this.lastSeenValue = finalText;
      this.lastOriginal = finalText;
      this.frozen = false;

      if (changed) {
        await this.recentStore.remember(persona.id);
        this.rewriteFeedback.showRewrote();
      }
    } catch (error) {
      if (rewriteGeneration !== this.generation) {
        return;
      }

      this.repository.inputBox.value = original;
      this.lastSeenValue = original;
      this.lastGenerated = '';
      void showRewriteError(error);
    } finally {
      if (rewriteGeneration === this.generation) {
        this.isUpdating = false;
      }
    }
  }

  private resetState(): void {
    this.clearDebounce();
    this.lastOriginal = '';
    this.lastGenerated = '';
    this.frozen = false;
  }

  private clearDebounce(): void {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }
}
