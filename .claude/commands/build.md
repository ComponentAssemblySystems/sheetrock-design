# Build

Run the full token pipeline build and test suite.

## Steps

1. **Build** — run `npm run build`. This runs the three-stage pipeline:
   - Figma variables → W3C tokens (`tokens/w3c-light.json`, `tokens/w3c-dark.json`)
   - W3C tokens → CSS/JS/JSON (`dist/tokens.css`, `dist/tokens.js`, `dist/tokens.json`)

   Show the full output. If it fails, identify which stage failed and show the relevant error.

2. **Test** — run `npm test`. Tests read from `dist/` (already built in step 1), so no need to rebuild.

   The test suite covers:
   - `tests/transform.test.js` — Figma variable transformation logic
   - `tests/build.test.js` — dist/ output correctness

3. **Report** — summarize:
   - Build: passed or failed
   - Tests: X passed, Y failed (list any failures with the test name and assertion)
   - Any warnings from Style Dictionary about dropped alias tokens

## Useful for

- Verifying token changes before commit
- Diagnosing build failures after a Figma sync
- Confirming dist/ is up to date before pushing to main
