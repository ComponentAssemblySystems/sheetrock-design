# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build   # Transform Figma variables → W3C tokens → dist/ outputs
npm test        # Run vitest (requires build first — tests read dist/)
```

Run a single test file:
```bash
npx vitest run tests/transform.test.js
```

> **Tests read committed `dist/` files.** Always run `npm run build` before `npm test`.

## Architecture

This is a **design token pipeline**, not a component library. The pipeline has three stages:

### 1. Figma → W3C tokens (`scripts/transform-figma-vars.js`)
Reads `tokens/figma-variables.json` (Figma REST export format) and splits it into `tokens/w3c-light.json` and `tokens/w3c-dark.json`. Key behaviors:
- Figma `VARIABLE_ALIAS` types become W3C `{dot.path}` references
- `FLOAT` → `px` dimension strings
- Colors with `a < 1` → `rgba()`, otherwise hex
- Variables referencing external Figma library IDs are silently skipped (unresolvable)
- Both `data.variables[]` (test fixture shape) and `data.collections[].variables[]` (real Figma export shape) are supported

### 2. W3C tokens → CSS/JS/JSON (`config/style-dictionary.config.js`)
Uses Style Dictionary v3. Custom parser strips W3C `$`-prefixed keys before SD processes them. Iteratively drops alias tokens whose targets don't exist (up to 10 passes) to avoid hard SD errors. Outputs:
- `dist/tokens-root.css` + `dist/tokens-datathemedark.css` → merged into `dist/tokens.css`
- `dist/tokens.json` and `dist/tokens.js` (light values only — never regenerated for dark)
- CSS filter excludes `boolean`, `string`, and `fontfamily` token types

### 3. Figma Code Connect (`src/components/**/*.figma.tsx`)
Maps React components to Figma component URLs for Dev Mode. `Button.figma.tsx` is the reference format. Managed via `/connect` slash command.

## Token Sync Workflow

Source of truth is Figma. To update tokens:
1. `/sync-tokens` — fetches variables via Figma MCP, writes `tokens/figma-variables.json`, runs build
2. Review `git diff tokens/ dist/`, then commit

## Slash Commands

| Command | Purpose |
|---|---|
| `/sync-tokens` | Pull Figma variables → rebuild all dist/ outputs |
| `/connect` | Generate + publish Figma Code Connect for components in `src/components/` |

## Deploy

`npm run build` output in `dist/` is deployed to GitHub Pages on push to `main`. The `dist/` directory is the published artifact — it is committed to the repo.
