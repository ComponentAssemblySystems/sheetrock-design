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
// Style Dictionary v3 uses StyleDictionary.extend(config), not new StyleDictionary(config)
const sdLight = StyleDictionary.extend(makeConfig('tokens/w3c-light.json', ':root', { includeAssets: true }));
sdLight.buildAllPlatforms();
console.log('✓ Built light tokens');

// Step 3: Build dark tokens → dist/tokens-datathemedark.css only (no json/js duplication)
const sdDark = StyleDictionary.extend(makeConfig('tokens/w3c-dark.json', '[data-theme="dark"]'));
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
