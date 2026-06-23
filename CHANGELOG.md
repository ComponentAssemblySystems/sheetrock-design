# Changelog

## [Unreleased]

### Added

- Claude Code slash commands in `.claude/commands/`
  - `/sync-tokens` — fetches Figma variables (file `EM5KcfOyqRBsPTRkbvT5Kn`), writes `tokens/figma-variables.json`, runs build, shows diff summary
  - `/connect` — audits component coverage, generates `.figma.tsx` Code Connect files, publishes to Figma
  - `/build` (new) — runs `npm run build` + `npm test`, reports pass/fail and Style Dictionary alias warnings
- `README.md` — added "Claude Code commands" section with command table
- `CLAUDE.md` — expanded slash commands table with Figma file ID and per-command detail
