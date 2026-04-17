# Figma-Connected Design System

**Date:** 2026-04-17
**Status:** Approved for implementation

## Context

The Sheetrock design system currently exists as a set of Figma variable exports (CSS custom properties + JSON). It needs to evolve into a structured, multi-platform token distribution system with a live connection back to Figma so designers and developers stay in sync. The system must work across React, C# (Razor/Blazor), and HTML/CSS prototype projects without requiring consumers to adopt any particular framework.

## Goals

- Single source of truth in Figma Variables
- Token changes in Figma flow to code via a one-command sync script
- React components are Code Connected to their Figma counterparts
- All platforms consume tokens via a CDN-hosted CSS file (no build step required for consumers)
- Mobile (iOS/Android) token output supported in the future via the same pipeline

## Approach: Figma MCP + Style Dictionary + Code Connect

### Architecture

```mermaid
Figma Variables (source of truth)
    ↓
Figma MCP (get_variable_defs)
    ↓
tokens/figma-variables.json
    ↓
Style Dictionary (transform + format)
    ↓
dist/tokens.css       ← CSS custom properties (web, CDN)
dist/tokens.json      ← raw JSON (tooling)
dist/tokens.js        ← JS module (React)
dist/(future) ios/    ← Swift constants
dist/(future) android/← XML resources

Figma Components ←→ Figma MCP (get_code_connect_suggestions / send_code_connect_mappings) ←→ React Components (.figma.tsx)
```

### Project Structure

```mermaid
sheetrock-design-system/
├── tokens/
│   └── figma-variables.json        # synced from Figma via MCP
├── config/
│   └── style-dictionary.config.js  # transform rules, platform targets
├── src/
│   └── components/                 # React components
│       └── Button/
│           ├── Button.jsx
│           └── Button.figma.tsx    # Code Connect mapping
├── .claude/
│   └── commands/
│       ├── sync-tokens.md          # slash command: /sync-tokens
│       └── connect.md              # slash command: /connect
├── dist/                           # committed, CDN-served via GitHub Pages
│   ├── tokens.css
│   ├── tokens.json
│   └── tokens.js
├── docs/
└── package.json
```

Existing CSS/JSON files (`sheetrock.css`, `sheetrock-primitives.css`, `Primitives-variables.css`, `Component Assembly Design System-variables-full.json`, etc.) migrate into `tokens/` as the Style Dictionary source.

### Workflow 1 — Token Sync (`/sync-tokens` slash command)

The Figma MCP runs inside Claude Code, so token sync is a Claude Code slash command — not a standalone npm script. The `/sync-tokens` command definition lives in `.claude/commands/sync-tokens.md`.

Triggered manually when Figma Variables change (designer or developer runs it after a design review):

1. Run `/sync-tokens` in Claude Code
2. Claude calls `get_variable_defs` via Figma MCP
3. Writes result to `tokens/figma-variables.json`
4. Runs `npm run build` (Style Dictionary)
5. Outputs `dist/tokens.css`, `dist/tokens.json`, `dist/tokens.js`
6. Developer reviews git diff, commits

`npm run build` can also be run standalone (without Claude Code) to rebuild from an existing `tokens/figma-variables.json`.

### Workflow 2 — Code Connect Publish (`/connect` slash command)

Also a Claude Code slash command for the same reason. The `/connect` command definition lives in `.claude/commands/connect.md`.

Triggered when React components are added or their props change:

1. Run `/connect` in Claude Code
2. Claude reads `src/components/`
3. Calls `get_code_connect_suggestions` via Figma MCP
4. Generates `*.figma.tsx` mapping files alongside each component
5. Developer reviews and adjusts mappings as needed
6. Claude calls `send_code_connect_mappings` to push live to Figma

Code Connect is React-only. C# and HTML/CSS projects consume tokens directly — no component mapping required.

### Distribution

GitHub Pages serves the `dist/` folder from the `main` branch. Consumers link directly (replace `your-org` with the actual GitHub organization name during setup):

```html
<!-- C#, HTML/CSS prototypes -->
<link
  rel="stylesheet"
  href="https://your-org.github.io/sheetrock-design-system/dist/tokens.css"
/>
```

```js
// React — CSS approach
import 'https://your-org.github.io/sheetrock-design-system/dist/tokens.css';

// React — JS tokens (typed, tree-shakeable)
import { colorPrimary } from 'https://your-org.github.io/sheetrock-design-system/dist/tokens.js';
```

**Versioning:** Start with "latest" (always points to `main`). Add tagged releases via jsDelivr when multiple projects need to upgrade independently.

### Multi-Platform (Future)

Style Dictionary supports additional platform transforms with no architectural change:

| Platform    | Output                    | Distribution              |
| ----------- | ------------------------- | ------------------------- |
| iOS (Swift) | `dist/ios/tokens.swift`   | Committed to iOS repo     |
| Android     | `dist/android/colors.xml` | Committed to Android repo |

Adding mobile support = adding a platform config to `style-dictionary.config.js`.

## Style Dictionary Configuration

The config will define:

- **Source:** `tokens/figma-variables.json`
- **Web platform:** CSS custom properties → `dist/tokens.css`
- **JSON platform:** Raw token values → `dist/tokens.json`
- **JS platform:** ES module with named exports → `dist/tokens.js`
- **Transform groups:** Handle Figma's variable naming conventions (slash-separated paths → CSS variable format)

Light/dark mode support already exists in the Figma variables — Style Dictionary will output both via `[data-theme="dark"]` selectors, consistent with the existing `Primitives-variables.css` pattern.

## Verification

1. **Token sync:** Run `/sync-tokens` in Claude Code → confirm `tokens/figma-variables.json` updates → confirm `dist/tokens.css` reflects current Figma values
2. **Multi-platform output:** Open `dist/tokens.css` and verify CSS custom properties match Figma variable values
3. **CDN consumption:** Create a minimal HTML file that links `dist/tokens.css` and uses a CSS custom property — confirm it renders correctly
4. **Code Connect:** Add a test React component → run `/connect` in Claude Code → open the component in Figma Dev Mode and confirm the correct React code appears
5. **Light/dark mode:** Apply `data-theme="dark"` to a test element and confirm token values switch correctly
