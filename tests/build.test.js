// Prerequisite: run `npm run build` before `npm test`.
// These tests read the committed dist/ files — they do not re-run the build.
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

  it('dist/tokens.json exists, is valid JSON, and has tokens', () => {
    expect(existsSync('dist/tokens.json')).toBe(true);
    const raw = readFileSync('dist/tokens.json', 'utf8');
    const parsed = JSON.parse(raw);
    expect(Object.keys(parsed).length).toBeGreaterThan(0);
  });

  it('dist/tokens.js exists and exports named constants', () => {
    expect(existsSync('dist/tokens.js')).toBe(true);
    const js = readFileSync('dist/tokens.js', 'utf8');
    expect(js).toMatch(/^export const \w+/m);
  });
});
