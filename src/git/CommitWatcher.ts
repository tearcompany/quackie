import * as vscode from 'vscode';
import { Configuration } from '../config/Configuration';
import { PersonaRecentStore } from '../personas/PersonaRecentStore';
import { PersonaRegistry } from '../personas/PersonaRegistry';
import { RewriteService } from '../rewrite/RewriteService';
import { RewriteFeedback } from '../ui/RewriteFeedback';
import { Repository } from './api/git';

const POLL_INTERVAL_MS = 150;

export class CommitWatcher implements vscode.Disposable {
  private lastSeenValue = '';
  private lastOriginal = '';
  private lastGenerated = '';
  private isUpdating = false;
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

  async rewriteNow(): Promise<void> {
    const current = this.repository.inputBox.value.trim();
    if (!current) {
      return;
    }

    this.clearDebounce();
    await this.performRewrite(current);
  }

  dispose(): void {
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

    this.lastSeenValue = current;

    if (!current.trim()) {
      this.resetState();
      return;
    }

    if (current === this.lastGenerated) {
      return;
    }

    if (!this.configuration.isAutoRewriteEnabled()) {
      return;
    }

    if (!this.configuration.isTargetEnabled('commit')) {
      return;
    }

    this.lastOriginal = current;
    this.scheduleRewrite();
  }

  private scheduleRewrite(): void {
    this.clearDebounce();

    this.debounceTimer = setTimeout(() => {
      void this.performRewrite(this.lastOriginal);
    }, this.configuration.getDebounceMs());
  }

  private async performRewrite(original: string): Promise<void> {
    const trimmed = original.trim();
    if (!trimmed) {
      return;
    }

    const persona = this.personaRegistry.getCurrent();
    if (!persona) {
      return;
    }

    // Take over the input immediately: this hides whatever raw text is there
    // (e.g. Cursor's own generated commit) and signals that work is happening,
    // instead of leaving the user staring at stale text for the ~3s API call.
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

      const changed = rewritten.trim().length > 0 && rewritten !== trimmed;
      const finalText = changed ? rewritten : original;
      this.repository.inputBox.value = finalText;
      this.lastGenerated = changed ? finalText : '';
      this.lastSeenValue = finalText;
      if (changed) {
        await this.recentStore.remember(persona.id);
        this.rewriteFeedback.showRewrote();
      }
    } catch (error) {
      // Never destroy the user's message on failure — put the original back.
      this.repository.inputBox.value = original;
      this.lastSeenValue = original;
      this.lastGenerated = '';
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(`Quackie rewrite failed: ${message}`);
    } finally {
      this.isUpdating = false;
    }
  }

  private resetState(): void {
    this.clearDebounce();
    this.lastOriginal = '';
    this.lastGenerated = '';
  }

  private clearDebounce(): void {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }
}
