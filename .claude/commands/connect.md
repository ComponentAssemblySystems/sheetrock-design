# Connect

Generate and publish Figma Code Connect mappings for all React components in `src/components/`.

**Figma file:** `EM5KcfOyqRBsPTRkbvT5Kn` (Component Assembly Design System)
**Reference format:** `src/components/Button/Button.figma.tsx`

## Steps

1. **Audit existing coverage** — list all directories in `src/components/`. For each, check whether a `.figma.tsx` file already exists. Report which components have mappings and which don't.

2. **For each component WITHOUT a `.figma.tsx` file:**

   a. Use Figma MCP `get_code_connect_suggestions` with file ID `EM5KcfOyqRBsPTRkbvT5Kn` to get suggested prop mappings for that component.

   b. Generate a `.figma.tsx` file co-located with the component. Follow the Button format exactly:
   - Import `figma` from `@figma/code-connect`
   - Import the component from its local file
   - Map each Figma prop to a `figma.string()`, `figma.enum()`, or `figma.boolean()` call
   - Include the correct `figma.com/design/...` URL with the component's `node-id`

   c. For `figma.enum()` props, map Figma variant names to React prop values explicitly. Do not guess — use exact Figma variant names from the suggestions.

3. **Show all generated/updated files** and ask the developer to review prop mappings before publishing. Incorrect mappings cause wrong code snippets in Figma Dev Mode.

4. **After developer confirms**, publish using:
   ```bash
   npx figma connect publish --token $FIGMA_ACCESS_TOKEN
   ```
   If `FIGMA_ACCESS_TOKEN` is not set, instruct the developer to set it and re-run.

5. **Commit:**
   ```bash
   git add src/components/**/*.figma.tsx
   git commit -m "feat: add Code Connect mappings"
   ```
   Do not commit until the developer confirms the publish succeeded.

## Prop type reference

| Figma property type | Code Connect call |
|---|---|
| Text / string | `figma.string('Prop Name')` |
| Boolean | `figma.boolean('Prop Name')` |
| Enum / variant | `figma.enum('Prop Name', { FigmaValue: 'reactProp' })` |
| Instance swap | `figma.instance('Prop Name')` |
