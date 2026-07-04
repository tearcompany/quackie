# Changelog

All notable changes to Quackie are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.4]

### Added

- Per-install registration token for the hosted rewrite API (`/api/register`), stored in VS Code SecretStorage.

### Changed

- Rewrite requests send `Authorization: Bearer` install token; auto-refresh on 401.

## [0.2.3]

### Changed

- Marketplace README updated — examples per persona, feature list, cleaner getting started.

## [0.2.2]

### Changed

- Marketplace README rewritten for end users — landing-page tone, usage instructions only.

## [0.2.1]

### Changed

- Auto-rewrite waits until you pick a persona; no silent network calls on first install.
- Manual edits to a generated commit message freeze auto-rewrite until you clear the input or run Rewrite Now.
- Commit with Persona no longer triggers a second auto-rewrite pass.

### Fixed

- No-op API responses no longer loop rewrites.
- Rewrite requests time out after 30 seconds.
- Extension disposes commit watchers cleanly on deactivate.

## [0.2.0]

### Added

- 40 bundled personas across three packs — Classic, Legends, and Archetype.
- `Quackie: Commit with Persona` (**⌥⌘Enter** / `Ctrl+Alt+Enter`) — pick a persona, preview the rewrite, confirm before it replaces your draft.
- Pack-grouped persona picker with a "Recent" section for quickly re-selecting a persona you've used before.
- Transient status bar confirmation after a successful rewrite.
- Hosted `quackie` rewrite engine (default) alongside the existing offline `mock` engine — switch with `quackie.rewriteEngine`.

### Changed

- Auto-rewrite now takes over the commit input immediately while a rewrite is in flight, instead of leaving stale text visible during the request.

## [0.1.0]

Initial release: automatic persona-styled rewriting of Git commit messages, with a status bar persona picker and an offline mock rewrite engine.
