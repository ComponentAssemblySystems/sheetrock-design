Pull the latest Figma variables into this design system and rebuild the token outputs.

Steps:
1. Use the Figma MCP `get_variable_defs` tool to fetch all variables from the connected Figma file.
2. Write the result to `tokens/figma-variables.json` (overwrite the existing file). Preserve the `schemaVersion`, `collections`, and `variables` keys exactly as returned by the MCP.
3. Run `npm run build` using the Bash tool.
4. Show a brief summary of what changed in `tokens/figma-variables.json` by comparing to git diff: new variables, removed variables, changed values.
5. Remind the developer to review the diff and commit: `git add tokens/ dist/ && git commit -m "chore: sync tokens from Figma"`
