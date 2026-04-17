import { readFileSync, writeFileSync } from 'fs';

export function rgbaToHex({ r, g, b, a }) {
  const toHex = n => Math.round(n * 255).toString(16).padStart(2, '0');
  if (a === 1) return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${parseFloat(a.toFixed(3))})`;
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
  /*
   * Normalize variables: real Figma exports nest variables inside each collection
   * (collection.variables[]), but the test fixture uses a top-level data.variables[].
   * Support both shapes.
   */
  const allVariables = data.variables
    ? data.variables
    : data.collections.flatMap(c => c.variables || []);

  /* Build a map from variable ID to its dot-separated token path (for alias resolution) */
  const idToPath = {};
  for (const variable of allVariables) {
    idToPath[variable.id] = nameToParts(variable.name).join('.');
  }

  /* Build a map from collection ID to its modes (modeId → mode name, lowercased) */
  const collectionModes = {};
  for (const collection of data.collections) {
    collectionModes[collection.id] = {};
    for (const mode of collection.modes) {
      collectionModes[collection.id][mode.modeId] = mode.name.toLowerCase();
    }
  }

  const light = {};
  const dark = {};
  let unresolvedCount = 0;

  for (const variable of allVariables) {
    const parts = nameToParts(variable.name);
    const modes = collectionModes[variable.variableCollectionId] || {};

    for (const [modeId, rawValue] of Object.entries(variable.valuesByMode)) {
      const modeName = modes[modeId];
      /* Skip modes that are not light or dark (e.g. Desktop/Compact/Default) */
      if (!modeName) continue;

      let token;

      if (rawValue && typeof rawValue === 'object' && rawValue.type === 'VARIABLE_ALIAS') {
        const refPath = idToPath[rawValue.id];
        if (!refPath) {
          unresolvedCount++;
          continue; // Skip tokens that reference external library variables
        }
        token = { $value: `{${refPath}}`, $type: variable.resolvedType.toLowerCase() };
      } else if (variable.resolvedType === 'COLOR' && typeof rawValue === 'object') {
        token = { $value: rgbaToHex(rawValue), $type: 'color' };
      } else if (variable.resolvedType === 'FLOAT') {
        token = { $value: `${rawValue}px`, $type: 'dimension' };
      } else if (variable.resolvedType === 'STRING') {
        token = { $value: String(rawValue), $type: 'fontFamily' };
      } else {
        token = { $value: rawValue, $type: variable.resolvedType.toLowerCase() };
      }

      /* Only write to light or dark buckets; skip any other mode names */
      if (modeName !== 'light' && modeName !== 'dark') continue;
      const target = modeName === 'light' ? light : dark;
      buildNestedPath(target, parts, token);
    }
  }

  if (unresolvedCount > 0) {
    console.warn(`Warning: ${unresolvedCount} alias references could not be resolved (external library variables). These tokens were skipped.`);
  }

  return { light, dark };
}

/* Run as a script: node scripts/transform-figma-vars.js */
if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = JSON.parse(readFileSync('tokens/figma-variables.json', 'utf8'));
  const { light, dark } = transformFigmaVariables(raw);
  writeFileSync('tokens/w3c-light.json', JSON.stringify(light, null, 2));
  writeFileSync('tokens/w3c-dark.json', JSON.stringify(dark, null, 2));
  console.log('Wrote tokens/w3c-light.json and tokens/w3c-dark.json');
}
