# Figma-Connected Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing token-only design system into a structured, CDN-distributed system where Figma Variables are the single source of truth, with one-command token sync and Code Connect for React components.

**Architecture:** Figma MCP pulls variables into `tokens/figma-variables.json`. A custom transform script converts this to W3C Design Token format (light + dark). Style Dictionary builds `dist/tokens.css`, `dist/tokens.json`, and `dist/tokens.js` from those files. GitHub Pages serves `dist/` as a CDN. Two Claude Code slash commands (`/sync-tokens`, `/connect`) drive Figma-facing workflows.

**Tech Stack:** Node.js 18+, Style Dictionary v3, Vitest, React (existing components), Figma MCP

---

## File Map

| File                                     | Purpose                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `package.json`                           | Scripts: `build`, `test`. Dependencies: `style-dictionary`, `vitest`          |
| `.gitignore`                             | Ignore `node_modules/`, `.superpowers/`                                       |
| `tokens/figma-variables.json`            | Figma variable export (written by `/sync-tokens`)                             |
| `tokens/w3c-light.json`                  | Generated W3C tokens for light mode (written by build script)                 |
| `tokens/w3c-dark.json`                   | Generated W3C tokens for dark mode (written by build script)                  |
| `scripts/transform-figma-vars.js`        | Converts Figma JSON → W3C token format, handles RGBA→hex, aliases, multi-mode |
| `scripts/build.js`                       | Orchestrates transform + Style Dictionary double-build + CSS concatenation    |
| `config/style-dictionary.config.js`      | Style Dictionary platform config (CSS, JSON, JS outputs)                      |
| `dist/tokens.css`                        | Output: CSS custom properties with `:root` + `[data-theme="dark"]`            |
| `dist/tokens.json`                       | Output: raw nested JSON tokens                                                |
| `dist/tokens.js`                         | Output: ES module with named exports                                          |
| `.claude/commands/sync-tokens.md`        | Claude Code slash command: pull Figma vars + build                            |
| `.claude/commands/connect.md`            | Claude Code slash command: generate + publish Code Connect                    |
| `src/components/Button/Button.figma.tsx` | Example Code Connect mapping file                                             |
| `tests/transform.test.js`                | Unit tests for the transform script                                           |
| `tests/build.test.js`                    | Integration tests for build output (reads dist/ files directly)               |

---

## Task 1: Project Initialization

**Files:**

- Create: `package.json`
- Create: `.gitignore`
- Create: `tokens/`, `dist/`, `scripts/`, `config/`, `src/components/`, `.claude/commands/`, `tests/` directories

- [ ] **Step 1: Create package.json**

```json
{
  "name": "sheetrock-design-system",
  "version": "1.0.0",
  "description": "Component Assembly Systems design token library",
  "type": "module",
  "scripts": {
    "build": "node scripts/build.js",
    "test": "vitest run"
  },
  "dependencies": {
    "style-dictionary": "^3.9.2"
  },
  "devDependencies": {
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```txt
node_modules/
.superpowers/
```

- [ ] **Step 3: Create directories**

```bash
mkdir -p tokens dist scripts config src/components .claude/commands tests
touch tokens/.gitkeep dist/.gitkeep
```

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Commit**

```bash
git init
git add package.json package-lock.json .gitignore
git commit -m "chore: initialize project"
```

---

## Task 2: Migrate Existing Token Files

The project root contains exported Figma files. These become the initial `tokens/figma-variables.json`.

**Files:**

- Create: `tokens/figma-variables.json` (copy of existing export)
- Note: existing `sheetrock.css`, `sheetrock-primitives.css`, `Primitives-variables.css`, `Component Assembly Design System-variables.css` are superseded by the build pipeline but kept for reference until the new build is verified

- [ ] **Step 1: Copy the full Figma export as the token source**

```bash
cp "Component Assembly Design System-variables-full.json" tokens/figma-variables.json
```

- [ ] **Step 2: Verify the file is readable and valid JSON**

```bash
node -e "const d = JSON.parse(require('fs').readFileSync('tokens/figma-variables.json','utf8')); console.log('Collections:', d.collections.length, '| Schema version:', d.schemaVersion)"
```

Expected output: `Collections: <N> | Schema version: 1`

- [ ] **Step 3: Commit**

```bash
git add tokens/figma-variables.json
git commit -m "chore: add initial Figma variable export as token source"
```

---

## Task 3: Figma Variable Transformer

This script reads `tokens/figma-variables.json` and writes `tokens/w3c-light.json` and `tokens/w3c-dark.json` in W3C Design Token format.

**Files:**

- Create: `scripts/transform-figma-vars.js`
- Create: `tests/transform.test.js`

**Key data shape to handle (from the actual Figma export):**

- Variable names use `/` as separator: `cas/white`, `Colors/Primary/500`
- Color values: `{ r: 0-1, g: 0-1, b: 0-1, a: 0-1 }` (floats, not 0-255)
- Float values: raw numbers (spacing, sizing)
- String values: raw strings (font families)
- Aliases: `{ type: "VARIABLE_ALIAS", id: "VariableID:..." }` — reference another variable by ID
- Mode IDs come from collection.modes: `[{ name: "Light", modeId: "50:0" }, { name: "Dark", modeId: "437:1" }]`

- [ ] **Step 1: Write the failing tests**

Create `tests/transform.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  rgbaToHex,
  buildNestedPath,
  transformFigmaVariables
} from '../scripts/transform-figma-vars.js';

describe('rgbaToHex', () => {
  it('converts opaque white RGBA float to hex', () => {
    expect(rgbaToHex({ r: 1, g: 1, b: 1, a: 1 })).toBe('#ffffff');
  });

  it('converts black to hex', () => {
    expect(rgbaToHex({ r: 0, g: 0, b: 0, a: 1 })).toBe('#000000');
  });

  it('returns rgba() string for transparent colors', () => {
    expect(rgbaToHex({ r: 0, g: 0, b: 0, a: 0.5 })).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('converts an arbitrary color correctly', () => {
    expect(rgbaToHex({ r: 0.2, g: 0.4, b: 0.8, a: 1 })).toBe('#3366cc');
  });
});

describe('buildNestedPath', () => {
  it('sets a value at a single-segment path', () => {
    const obj = {};
    buildNestedPath(obj, ['white'], { $value: '#fff', $type: 'color' });
    expect(obj).toEqual({ white: { $value: '#fff', $type: 'color' } });
  });

  it('sets a value at a multi-segment path', () => {
    const obj = {};
    buildNestedPath(obj, ['colors', 'primary', '500'], {
      $value: '#0070f3',
      $type: 'color'
    });
    expect(obj.colors.primary['500'].$value).toBe('#0070f3');
  });

  it('does not overwrite sibling keys', () => {
    const obj = {};
    buildNestedPath(obj, ['colors', 'primary', '500'], {
      $value: '#0070f3',
      $type: 'color'
    });
    buildNestedPath(obj, ['colors', 'primary', '600'], {
      $value: '#0060cc',
      $type: 'color'
    });
    expect(Object.keys(obj.colors.primary)).toEqual(['500', '600']);
  });
});

describe('transformFigmaVariables', () => {
  const fixture = {
    schemaVersion: 1,
    collections: [
      {
        id: 'VariableCollectionId:4:2',
        name: 'Colors',
        modes: [
          { name: 'Light', modeId: '50:0' },
          { name: 'Dark', modeId: '437:1' }
        ],
        variableIds: ['VariableID:1:1', 'VariableID:1:2', 'VariableID:1:3']
      }
    ],
    variables: [
      {
        id: 'VariableID:1:1',
        name: 'cas/white',
        resolvedType: 'COLOR',
        valuesByMode: {
          '50:0': { r: 1, g: 1, b: 1, a: 1 },
          '437:1': { r: 0.1, g: 0.1, b: 0.1, a: 1 }
        },
        variableCollectionId: 'VariableCollectionId:4:2'
      },
      {
        id: 'VariableID:1:2',
        name: 'spacing/sm',
        resolvedType: 'FLOAT',
        valuesByMode: {
          '50:0': 8,
          '437:1': 8
        },
        variableCollectionId: 'VariableCollectionId:4:2'
      },
      {
        id: 'VariableID:1:3',
        name: 'text/primary',
        resolvedType: 'COLOR',
        valuesByMode: {
          '50:0': { type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' },
          '437:1': { type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' }
        },
        variableCollectionId: 'VariableCollectionId:4:2'
      }
    ]
  };

  it('produces light and dark token objects', () => {
    const { light, dark } = transformFigmaVariables(fixture);
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
  });

  it('converts a COLOR variable to hex in light mode', () => {
    const { light } = transformFigmaVariables(fixture);
    expect(light.cas.white.$value).toBe('#ffffff');
    expect(light.cas.white.$type).toBe('color');
  });

  it('converts a COLOR variable to hex in dark mode', () => {
    const { dark } = transformFigmaVariables(fixture);
    expect(dark.cas.white.$value).toBe('#1a1a1a');
  });

  it('converts a FLOAT variable to a px dimension string', () => {
    const { light } = transformFigmaVariables(fixture);
    expect(light.spacing.sm.$value).toBe('8px');
    expect(light.spacing.sm.$type).toBe('dimension');
  });

  it('converts a VARIABLE_ALIAS to a W3C token reference', () => {
    const { light } = transformFigmaVariables(fixture);
    expect(light.text.primary.$value).toBe('{cas.white}');
  });
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npm test
```

Expected: all tests FAIL with "Cannot find module"

- [ ] **Step 3: Implement the transformer**

Create `scripts/transform-figma-vars.js`:

```js
import { readFileSync, writeFileSync } from 'fs';

export function rgbaToHex({ r, g, b, a }) {
  const toHex = n =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');
  if (a === 1) return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
    b * 255
  )}, ${parseFloat(a.toFixed(3))})`;
}

export function buildNestedPath(obj, pathParts, token) {
  const [head, ...rest] = pathParts;
  if (rest.length === 0) {
    obj[head] = token;
  } else {
    obj[head] = obj[head] || {};
    buildNestedPath(obj[head], rest, token);
  }
}

function nameToParts(name) {
  return name.split('/').map(s => s.trim().replace(/\s+/g, '-').toLowerCase());
}

export function transformFigmaVariables(data) {
  // Build a map from variable ID to its dot-separated token path (for alias resolution)
  const idToPath = {};
  for (const variable of data.variables) {
    idToPath[variable.id] = nameToParts(variable.name).join('.');
  }

  // Build a map from collection ID to its modes (modeId → mode name, lowercased)
  const collectionModes = {};
  for (const collection of data.collections) {
    collectionModes[collection.id] = {};
    for (const mode of collection.modes) {
      collectionModes[collection.id][mode.modeId] = mode.name.toLowerCase();
    }
  }

  const light = {};
  const dark = {};

  for (const variable of data.variables) {
    const parts = nameToParts(variable.name);
    const modes = collectionModes[variable.variableCollectionId] || {};

    for (const [modeId, rawValue] of Object.entries(variable.valuesByMode)) {
      const modeName = modes[modeId];
      if (!modeName) continue;

      let token;

      if (
        rawValue &&
        typeof rawValue === 'object' &&
        rawValue.type === 'VARIABLE_ALIAS'
      ) {
        const refPath = idToPath[rawValue.id];
        token = {
          $value: `{${refPath}}`,
          $type: variable.resolvedType.toLowerCase()
        };
      } else if (
        variable.resolvedType === 'COLOR' &&
        typeof rawValue === 'object'
      ) {
        token = { $value: rgbaToHex(rawValue), $type: 'color' };
      } else if (variable.resolvedType === 'FLOAT') {
        token = { $value: `${rawValue}px`, $type: 'dimension' };
      } else if (variable.resolvedType === 'STRING') {
        token = { $value: String(rawValue), $type: 'fontFamily' };
      } else {
        token = {
          $value: rawValue,
          $type: variable.resolvedType.toLowerCase()
        };
      }

      const target = modeName === 'light' ? light : dark;
      buildNestedPath(target, parts, token);
    }
  }

  return { light, dark };
}

// Run as a script: node scripts/transform-figma-vars.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = JSON.parse(readFileSync('tokens/figma-variables.json', 'utf8'));
  const { light, dark } = transformFigmaVariables(raw);
  writeFileSync('tokens/w3c-light.json', JSON.stringify(light, null, 2));
  writeFileSync('tokens/w3c-dark.json', JSON.stringify(dark, null, 2));
  console.log('Wrote tokens/w3c-light.json and tokens/w3c-dark.json');
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 5: Run the transformer against the real token file to verify no crashes**

```bash
node scripts/transform-figma-vars.js
```

Expected: `Wrote tokens/w3c-light.json and tokens/w3c-dark.json` with no errors. Verify both files are valid JSON:

```bash
node -e "JSON.parse(require('fs').readFileSync('tokens/w3c-light.json','utf8')); console.log('light: valid')"
node -e "JSON.parse(require('fs').readFileSync('tokens/w3c-dark.json','utf8')); console.log('dark: valid')"
```

- [ ] **Step 6: Commit**

```bash
git add scripts/transform-figma-vars.js tests/transform.test.js tokens/w3c-light.json tokens/w3c-dark.json
git commit -m "feat: add Figma variable transformer with W3C token output"
```

---

## Task 4: Style Dictionary Configuration

Style Dictionary reads `tokens/w3c-light.json` (and dark) and produces `dist/tokens.css`, `dist/tokens.json`, and `dist/tokens.js`.

Style Dictionary v3 does not natively handle W3C `$value`/`$type` keys — it uses `value`/`type`. The build script strips the `$` prefix before passing tokens to Style Dictionary via a custom parser.

**Files:**

- Create: `config/style-dictionary.config.js`
- Create: `scripts/build.js`

- [ ] **Step 1: Create the Style Dictionary config**

Create `config/style-dictionary.config.js`:

```js
// includeAssets: true for light build only — json/js outputs use resolved values
// and should not be generated twice (dark build would overwrite with dark-mode values)
export function makeConfig(
  tokensPath,
  selector,
  { includeAssets = false } = {}
) {
  const stripDollar = obj => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const newKey = k.startsWith('$') ? k.slice(1) : k;
      out[newKey] = stripDollar(v);
    }
    return out;
  };

  const platforms = {
    css: {
      transformGroup: 'css',
      prefix: '',
      buildPath: 'dist/',
      files: [
        {
          destination: `tokens-${selector.replace(/[^a-z]/g, '')}.css`,
          format: 'css/variables',
          options: {
            selector,
            outputReferences: true
          }
        }
      ]
    }
  };

  if (includeAssets) {
    platforms.json = {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [{ destination: 'tokens.json', format: 'json/nested' }]
    };
    platforms.js = {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [{ destination: 'tokens.js', format: 'javascript/es6' }]
    };
  }

  return {
    source: [tokensPath],
    parsers: [
      {
        pattern: /\.json$/,
        parse: ({ contents }) => stripDollar(JSON.parse(contents))
      }
    ],
    platforms
  };
}
```

- [ ] **Step 2: Create the build orchestrator**

Create `scripts/build.js`:

```js
import StyleDictionary from 'style-dictionary';
import { readFileSync, writeFileSync, rmSync } from 'fs';
import { makeConfig } from '../config/style-dictionary.config.js';
import { transformFigmaVariables } from './transform-figma-vars.js';

// Step 1: Transform Figma variables to W3C tokens
const raw = JSON.parse(readFileSync('tokens/figma-variables.json', 'utf8'));
const { light, dark } = transformFigmaVariables(raw);
writeFileSync('tokens/w3c-light.json', JSON.stringify(light, null, 2));
writeFileSync('tokens/w3c-dark.json', JSON.stringify(dark, null, 2));
console.log('✓ Transformed Figma variables to W3C format');

// Step 2: Build light tokens → dist/tokens-root.css + dist/tokens.json + dist/tokens.js
const sdLight = new StyleDictionary(
  makeConfig('tokens/w3c-light.json', ':root', { includeAssets: true })
);
sdLight.buildAllPlatforms();
console.log('✓ Built light tokens');

// Step 3: Build dark tokens → dist/tokens-datathemedark.css only (no json/js duplication)
const sdDark = new StyleDictionary(
  makeConfig('tokens/w3c-dark.json', '[data-theme="dark"]')
);
sdDark.buildAllPlatforms();
console.log('✓ Built dark tokens');

// Step 4: Concatenate light + dark into dist/tokens.css
const lightCss = readFileSync('dist/tokens-root.css', 'utf8');
const darkCss = readFileSync('dist/tokens-datathemedark.css', 'utf8');
writeFileSync('dist/tokens.css', lightCss + '\n' + darkCss);

// Clean up intermediary files
rmSync('dist/tokens-root.css', { force: true });
rmSync('dist/tokens-datathemedark.css', { force: true });

console.log('✓ Wrote dist/tokens.css (light + dark)');
console.log('✓ Wrote dist/tokens.json');
console.log('✓ Wrote dist/tokens.js');
```

- [ ] **Step 3: Run the build**

```bash
npm run build
```

Expected:

```bash
✓ Transformed Figma variables to W3C format
✓ Built light tokens
✓ Built dark tokens
✓ Wrote dist/tokens.css (light + dark)
✓ Wrote dist/tokens.json
✓ Wrote dist/tokens.js
```

If Style Dictionary throws errors about unresolved references, the alias resolution in `transform-figma-vars.js` may need debugging. Log the failing token name and check that `idToPath` contains the referenced ID.

- [ ] **Step 4: Verify dist/tokens.css content**

```bash
head -40 dist/tokens.css
```

Expected: CSS custom properties inside `:root { }`.

```bash
grep "data-theme" dist/tokens.css
```

Expected: `[data-theme="dark"]` selector exists.

- [ ] **Step 5: Commit**

```bash
git add config/style-dictionary.config.js scripts/build.js dist/tokens.css dist/tokens.json dist/tokens.js tokens/w3c-light.json tokens/w3c-dark.json
git commit -m "feat: add Style Dictionary build pipeline with light/dark mode output"
```

---

## Task 5: Build Verification Test

Add an integration test that reads the already-built `dist/` files and verifies their format. These tests run against the committed `dist/` files — they do not re-run the build.

**Files:**

- Create: `tests/build.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/build.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('dist/ output files', () => {
  it('dist/tokens.css exists', () => {
    expect(existsSync('dist/tokens.css')).toBe(true);
  });

  it('dist/tokens.css contains a :root selector', () => {
    const css = readFileSync('dist/tokens.css', 'utf8');
    expect(css).toContain(':root {');
  });

  it('dist/tokens.css contains a [data-theme="dark"] selector', () => {
    const css = readFileSync('dist/tokens.css', 'utf8');
    expect(css).toContain('[data-theme="dark"]');
  });

  it('dist/tokens.css contains at least one CSS custom property', () => {
    const css = readFileSync('dist/tokens.css', 'utf8');
    expect(css).toMatch(/--[\w-]+:\s*.+;/);
  });

  it('dist/tokens.json exists and is valid JSON', () => {
    expect(existsSync('dist/tokens.json')).toBe(true);
    const raw = readFileSync('dist/tokens.json', 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('dist/tokens.js exists', () => {
    expect(existsSync('dist/tokens.js')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests PASS (reads from already-built `dist/` files)

- [ ] **Step 3: Commit**

```bash
git add tests/build.test.js
git commit -m "test: add build output integration tests"
```

---

## Task 6: GitHub Pages CDN Setup

Configure GitHub Pages to serve `dist/` from the `main` branch via GitHub Actions.

**Files:**

- Create: `.github/workflows/deploy.yml`
- Modify: `package.json` (add `homepage` field)

- [ ] **Step 1: Create the GitHub Actions deploy workflow**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Add homepage to package.json**

In `package.json`, add the `homepage` field — replace `your-org` with the actual GitHub organization or username:

```json
{
  "name": "sheetrock-design-system",
  "version": "1.0.0",
  "homepage": "https://your-org.github.io/sheetrock-design-system",
  "description": "Component Assembly Systems design token library",
  "type": "module",
  "scripts": {
    "build": "node scripts/build.js",
    "test": "vitest run"
  },
  "dependencies": {
    "style-dictionary": "^3.9.2"
  },
  "devDependencies": {
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 3: Enable GitHub Pages in repository settings**

In GitHub: **Settings → Pages → Source → GitHub Actions**

- [ ] **Step 4: Commit and verify deployment**

```bash
git add .github/workflows/deploy.yml package.json
git commit -m "chore: add GitHub Pages deploy workflow"
git push origin main
```

Watch the Actions tab. When the deploy job completes, visit `https://your-org.github.io/sheetrock-design-system/tokens.css` and confirm it returns CSS.

---

## Task 7: Claude Code Slash Commands

Create the two slash commands that drive Figma-facing workflows.

**Files:**

- Create: `.claude/commands/sync-tokens.md`
- Create: `.claude/commands/connect.md`

- [ ] **Step 1: Create the sync-tokens slash command**

Create `.claude/commands/sync-tokens.md`:

```markdown
Pull the latest Figma variables into this design system and rebuild the token outputs.

Steps:

1. Use the Figma MCP `get_variable_defs` tool to fetch all variables from the connected Figma file.
2. Write the result to `tokens/figma-variables.json` (overwrite the existing file). Preserve the `schemaVersion`, `collections`, and `variables` keys exactly as returned by the MCP.
3. Run `npm run build` using the Bash tool.
4. Show a brief summary of what changed in `tokens/figma-variables.json` by comparing to git diff: new variables, removed variables, changed values.
5. Remind the developer to review the diff and commit: `git add tokens/ dist/ && git commit -m "chore: sync tokens from Figma"`
```

- [ ] **Step 2: Create the connect slash command**

Create `.claude/commands/connect.md`:

```markdown
Generate and publish Figma Code Connect mappings for all React components in src/components/.

Steps:

1. List all component directories in `src/components/`. For each directory, identify the main component file (e.g., `Button.jsx`, `Button.tsx`).
2. For each component that does NOT already have a `.figma.tsx` file, use the Figma MCP `get_code_connect_suggestions` tool to get suggested prop mappings.
3. Generate a `.figma.tsx` file co-located with each component. Use `src/components/Button/Button.figma.tsx` as the reference format.
4. Show the generated files to the developer and ask them to review the prop mappings before publishing. Incorrect mappings show wrong code in Figma Dev Mode.
5. After developer confirmation, use the Figma MCP `send_code_connect_mappings` tool to publish all mappings to Figma.
6. Commit: `git add src/components/**/*.figma.tsx && git commit -m "feat: add Code Connect mappings"`
```

- [ ] **Step 3: Verify the slash commands are discoverable**

In Claude Code, type `/sync-tokens` — it should appear as an autocomplete option. Same for `/connect`.

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/sync-tokens.md .claude/commands/connect.md
git commit -m "feat: add /sync-tokens and /connect Claude Code slash commands"
```

---

## Task 8: Code Connect Reference Implementation

Create a reference Button component and its `.figma.tsx` mapping file. This is the template that `/connect` uses for all future Code Connect files.

**Files:**

- Create: `src/components/Button/Button.jsx`
- Create: `src/components/Button/Button.figma.tsx`

If a real Button component already exists elsewhere in the project, skip Step 1 and update the import path in Step 2 accordingly.

- [ ] **Step 1: Install @figma/code-connect**

```bash
npm install --save-dev @figma/code-connect
```

- [ ] **Step 2: Create a minimal Button component**

Create `src/components/Button/Button.jsx`:

```jsx
export function Button({
  label,
  variant = 'primary',
  disabled = false,
  onClick
}) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 3: Create the Code Connect mapping file**

Create `src/components/Button/Button.figma.tsx`:

```tsx
import figma from '@figma/code-connect';
import { Button } from './Button';

/*
 * Replace FIGMA_COMPONENT_URL_HERE with the actual Figma component URL.
 * To find it: right-click the Button component in Figma → Copy link.
 */
figma.connect(Button, 'FIGMA_COMPONENT_URL_HERE', {
  props: {
    label: figma.string('Label'),
    variant: figma.enum('Variant', {
      Primary: 'primary',
      Secondary: 'secondary',
      Destructive: 'destructive'
    }),
    disabled: figma.boolean('Disabled')
  },
  example: ({ label, variant, disabled }) => (
    <Button label={label} variant={variant} disabled={disabled} />
  )
});
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Button/Button.jsx src/components/Button/Button.figma.tsx package.json package-lock.json
git commit -m "feat: add Button component and Code Connect reference implementation"
```

---

## Task 9: End-to-End Verification

Manually verify the full system before considering the implementation complete.

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 2: Run the token sync slash command**

In Claude Code: `/sync-tokens`

Confirm `tokens/figma-variables.json` updates and `dist/tokens.css` rebuilds.

- [ ] **Step 3: Smoke test CDN consumption with a local HTML file**

Create `test.html` (do not commit — delete after verification):

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="dist/tokens.css" />
    <style>
      body {
        background: var(--bg-canvas, #fff);
        color: var(--text-primary, #000);
        font-family: sans-serif;
        padding: 2rem;
      }
      .dark-box {
        padding: 1rem;
        margin-top: 1rem;
      }
    </style>
  </head>
  <body>
    <p>Light mode token test</p>
    <div data-theme="dark" class="dark-box">
      <p>Dark mode token test</p>
    </div>
  </body>
</html>
```

Open in a browser. Both sections should render with visually distinct backgrounds (light vs dark).

- [ ] **Step 4: Verify light/dark mode switching**

Open browser DevTools → Elements → add `data-theme="dark"` to `<html>`. Confirm token values switch.

- [ ] **Step 5: Verify dist/tokens.js exports**

```bash
node --input-type=module <<< "import('./dist/tokens.js').then(m => console.log('First export:', Object.keys(m)[0]))"
```

Expected: prints the name of the first exported token constant.

- [ ] **Step 6: Delete test.html and do final commit**

```bash
rm test.html
git add .
git commit -m "chore: complete initial design system setup"
```
