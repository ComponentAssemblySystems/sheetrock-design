# Sheetrock Design System

Design token library for Component Assembly Systems. Pulls variables from Figma, transforms them to CSS custom properties, and publishes them to a CDN via GitHub Pages.

## Using the tokens

**CSS (recommended)**

```html
<link
  rel="stylesheet"
  href="https://ComponentAssemblySystems.github.io/sheetrock-design-system/dist/tokens.css"
/>
```

**JS / ES module**

```js
import tokens from 'https://ComponentAssemblySystems.github.io/sheetrock-design-system/dist/tokens.js';
```

**JSON**

```text
https://ComponentAssemblySystems.github.io/sheetrock-design-system/dist/tokens.json
```

### Dark mode

Tokens ship with both `:root` (light) and `[data-theme="dark"]` selectors in a single file. Toggle dark mode by setting the attribute on the document root:

```js
document.documentElement.setAttribute('data-theme', 'dark');
```

### Token naming

All CSS custom properties follow the pattern `--<category>-<name>`. Examples:

| Token                                           | Category             |
| ----------------------------------------------- | -------------------- |
| `--cas-yellow`, `--cas-white`, `--cf-blue-dark` | Brand primitives     |
| `--bg-primary-subtle`, `--bg-danger-subtle`     | Semantic backgrounds |
| `--text-quaternary`                             | Text                 |
| `--charts-series-1` … `--charts-series-9`       | Data visualization   |
| `--border-divider-in-card`                      | Borders              |
| `--interaction-selected-background`             | Interactive states   |

## Development

```bash
npm install
npm run build   # transform Figma vars → dist/tokens.css + tokens.json + tokens.js
npm test        # run tests (build must be run first)
```

## Token pipeline

```text
tokens/figma-variables.json   ← Figma REST export (source of truth)
        ↓  scripts/transform-figma-vars.js
tokens/w3c-light.json
tokens/w3c-dark.json
        ↓  config/style-dictionary.config.js  (Style Dictionary v3)
dist/tokens.css               ← :root + [data-theme="dark"] combined
dist/tokens.json
dist/tokens.js
```

## Syncing tokens from Figma

Run `/sync-tokens` in Claude Code. This fetches the latest variables via the Figma MCP, overwrites `tokens/figma-variables.json`, and rebuilds `dist/`.

Then review the diff and commit:

```bash
git add tokens/ dist/
git commit -m "chore: sync tokens from Figma"
```

## Figma Code Connect

Components in `src/components/` have co-located `.figma.tsx` files that map React props to Figma component properties for Dev Mode.

Run `/connect` in Claude Code to generate mappings for new components and publish them to Figma.

## Deploy

Pushing to `main` automatically deploys `dist/` to GitHub Pages via the `deploy.yml` workflow. No manual step needed.
