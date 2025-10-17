# NovelAI Prompt & Character Manager

An Electron + React desktop application that streamlines prompt authoring for [NovelAI](https://novelai.net/image). The app embeds the NovelAI image generation page in a companion window, generates rich prompts from tag libraries and character profiles, and automates the injection of prompts/settings into NovelAI.

## Features

- 🚀 **Quick send** — Compose prompts from scene tags and characters, randomize NovelAI settings, and inject everything into the NovelAI window with one click (or <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd>).
- 🧩 **Tag library** — Searchable default tag catalogue plus custom/favorite tags with drag-and-drop support.
- 🧑‍🤝‍🧑 **Character management** — Build reusable character profiles with gender-aware subject tokens and per-character prompt groupings.
- 🎲 **Settings randomizer** — Strict/Creative/Wildcard profiles, overrides, last-roll preview, and hotkeys.
- 📚 **History & presets** — Template library, negative prompt presets, style presets, and local prompt history with reuse support.
- 📦 **Persistence & portability** — JSON-backed storage in the OS app-data directory with import/export helpers.
- 🔒 **Secure preload bridges** — Context-isolated preload scripts expose only a narrow automation API to the renderer and NovelAI windows.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This runs Vite in dev mode and launches Electron with automatic reload. The main application window hosts the prompt manager UI, while a separate window loads NovelAI's image page.

### Linting & Tests

```bash
npm run lint
npm run test
```

### Build

```bash
npm run build
```

The `dist/` directory receives compiled renderer assets (`dist/renderer`) and transpiled Electron code (`dist/electron`).

### Distribution Packages

```bash
npm run dist
```

Builds platform installers with electron-builder for Windows (NSIS), macOS, and Linux (AppImage).

## Usage Tips

- **Send to NovelAI** via the toolbar, hotkey (<kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd>), or the prompt editor quick actions.
- **Randomize settings** with <kbd>Ctrl/Cmd</kbd> + <kbd>R</kbd>. The last roll is displayed in the randomizer panel.
- **Copy final prompt** with <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd>.
- **Import/Export** data from the toolbar. Exports bundle all user data (custom tags, characters, history, presets, settings) to a JSON file in your chosen location.
- **Selectors troubleshooting** — If NovelAI updates its DOM, edit `config/selectors.json` in the app data directory. By default, the app seeds selectors from `src/data/selectors.json`.

## Project Structure

```
├─ electron/          # Electron main & preload scripts
├─ src/               # Renderer (React + Zustand)
│  ├─ app/            # Root app shell
│  ├─ core/           # Prompt composition, randomizer, bridge helpers
│  ├─ data/           # Seed data (tags, presets, selectors)
│  ├─ state/          # Zustand stores + persistence helpers
│  ├─ ui/             # UI components
│  └─ types/          # Shared type definitions
├─ static/            # Icons/assets
└─ electron-builder.yml
```

## Data Locations

All persisted files live inside Electron's userData directory (per OS). Paths include:

- `libraries/custom-tags.json`
- `libraries/favorites.json`
- `characters/profiles.json`
- `history/history.json`
- `config/settings.json`
- `libraries/templates.json`
- `libraries/negative-presets.json`
- `libraries/style-presets.json`
- `config/selectors.json`

## Troubleshooting

- **NovelAI window missing?** Use the toolbar “Focus NAI” button to bring the window to the front.
- **Selectors failing?** Update `config/selectors.json` or implement custom selectors via the extended mapper preload.
- **Clipboard permissions** — Some Linux environments require enabling clipboard access for Electron apps; grant permissions if copy buttons do not work.

## License

MIT
