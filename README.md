# Quackie VS Code Runtime

Personality-first rewrite runtime for VS Code and Cursor. Personas ship bundled inside the extension — no workspace setup required.

Commits are the first integration target. The architecture is designed for future targets such as pull request descriptions, code reviews, release notes, branch names, and changelog entries.

## Installation

### From source (development)

```bash
cd extension
npm install
npm run compile
```

Open the `extension/` folder in VS Code or Cursor, press **F5** to launch the Extension Development Host.

### As a VSIX package

```bash
cd extension
npm install
npm run package
npx @vscode/vsce package
```

Install the generated VSIX via **Cmd+Shift+P** → `Extensions: Install from VSIX...`, then reload the window.

Quackie works in any project. Personas are loaded from the extension bundle, not from your workspace.

## Development

Persona data lives at the repository root in:

- `personas-male/`
- `personas-female/`
- `personas-archetypes/`

Before each build, `scripts/sync-personas.js` copies them into `extension/personas/` for bundling.

From the repo root you can sync everything in one step:

```bash
node scripts/sync-personas-all.js
node scripts/sync-personas-all.js --anthropic
```

The second command also uploads all persona files to the Anthropic Files API and writes `personas-anthropic-files.json`.

Inside `extension/`:

```bash
npm run sync-personas
npm run compile
npm run watch
npm test
```

## Persona picker

Click the status bar item (`emoji Name`) or run **`Quackie: Select Persona`**.

The picker opens as a native VS Code list grouped by pack:

- **Recent** — last used personas
- **Male**, **Female**, **Archetypes**

Type to filter by name or voice.

## Rewrite engines

| Engine | Description |
| --- | --- |
| `mock` | Deterministic, offline, no network calls |
| `quackie` | Hosted rewrite API at `quackie.apiUrl` (default `https://quackie.me/api/rewrite`) — no API key in the extension |

Switch with `"quackie.rewriteEngine": "mock"` or `"quackie"`.

If the API call fails, Quackie shows an error and leaves your commit message untouched.

After a successful rewrite, a transient **quackie rewrote** hint appears in the status bar.

## Commit with Persona

`Quackie: Commit with Persona` (**Cmd+Alt+Enter** / **Ctrl+Alt+Enter** in Source Control):

1. Uses the current commit message, or asks for one if empty
2. Opens the persona dropdown modal
3. Rewrites through the active engine
4. Shows a confirmation dialog before replacing the SCM message field

## Architecture boundaries

| Layer | Responsibility |
| --- | --- |
| `PersonaRegistry` | Load bundled personas, expose `id`, `name`, `emoji`, `pack` |
| `RewriteService` | Rewrite text for a persona and target type |
| `CommitWatcher` | Poll Git input, debounce, loop prevention |
| `PersonaPicker` | Pack-grouped persona selection |
| `PersonaStatusBar` | Show active persona, open picker |

Only `RewriteService` implementations may read full persona metadata via `PersonaRegistry.getMetadata()`.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `quackie.persona` | `""` | Active persona id |
| `quackie.autoRewrite` | `true` | Auto rewrite commit messages |
| `quackie.debounceMs` | `500` | Debounce before rewrite |
| `quackie.rewriteEngine` | `"quackie"` | `mock` or `quackie` |
| `quackie.apiUrl` | `https://quackie.me/api/rewrite` | Backend endpoint for the `quackie` engine |
| `quackie.enabledTargets` | `["commit"]` | Enabled rewrite targets |

## Commands

- `Quackie: Select Persona` — open the pack-grouped persona picker
- `Quackie: Reload Personas` — reload bundled personas
- `Quackie: Toggle Auto Rewrite`
- `Quackie: Rewrite Now` — force a rewrite
- `Quackie: Commit with Persona` — pick persona, rewrite, confirm (**Cmd+Alt+Enter**)

## Project layout

```
extension/
  personas/
  src/
    personas/PersonaRegistry.ts, PersonaRecentStore.ts
    rewrite/MockRewriteService.ts, QuackieRewriteService.ts
    git/CommitWatcher.ts
    ui/PersonaPicker.ts, PersonaStatusBar.ts, RewriteFeedback.ts
scripts/
  sync-personas-all.js
  upload-personas-anthropic.py
```
