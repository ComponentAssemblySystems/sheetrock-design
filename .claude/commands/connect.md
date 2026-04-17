Generate and publish Figma Code Connect mappings for all React components in src/components/.

Steps:

1. List all component directories in `src/components/`. For each directory, identify the main component file (e.g., `Button.jsx`, `Button.tsx`).
2. For each component that does NOT already have a `.figma.tsx` file, use the Figma MCP `get_code_connect_suggestions` tool to get suggested prop mappings.
3. Generate a `.figma.tsx` file co-located with each component. Use `src/components/Button/Button.figma.tsx` as the reference format.
4. Show the generated files to the developer and ask them to review the prop mappings before publishing. Incorrect mappings show wrong code in Figma Dev Mode.
5. After developer confirmation, use the Figma MCP `send_code_connect_mappings` tool to publish all mappings to Figma.
6. Commit: `git add src/components/**/*.figma.tsx && git commit -m "feat: add Code Connect mappings"`
