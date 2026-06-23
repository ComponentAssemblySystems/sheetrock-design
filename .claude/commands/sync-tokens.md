# Sync Tokens

Pull the latest design token variables from Figma and rebuild all dist/ outputs.

**Figma file:** `EM5KcfOyqRBsPTRkbvT5Kn` (Component Assembly Design System)

## Steps

1. **Fetch variables from Figma** using the Figma MCP `get_variable_defs` tool with file ID `EM5KcfOyqRBsPTRkbvT5Kn`. If the tool returns an error, report it and stop — do not write partial data.

2. **Write to `tokens/figma-variables.json`** (overwrite entirely). The file must contain exactly what the MCP returned — do not reshape, filter, or reformat the data.

3. **Run `npm run build`**. This runs the full pipeline:
   - `scripts/transform-figma-vars.js` → `tokens/w3c-light.json` + `tokens/w3c-dark.json`
   - Style Dictionary → `dist/tokens.css`, `dist/tokens.js`, `dist/tokens.json`

   If the build fails, show the full error output. Common causes: malformed alias references, renamed collections, or external library IDs in the variable data (these are silently skipped, not errors).

4. **Show a diff summary** using `git diff --stat tokens/ dist/` followed by `git diff tokens/figma-variables.json | head -80` to highlight the most significant changes. Call out:
   - New variables added
   - Variables removed or renamed
   - Collection structure changes

5. **Prompt to review and commit:**
   ```
   git diff tokens/ dist/
   git add tokens/ dist/
   git commit -m "chore: sync tokens from Figma"
   ```
   Do not commit automatically — the developer should review the diff first.
