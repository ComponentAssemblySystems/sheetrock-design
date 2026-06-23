# Design System: Component Assembly Systems (Sheetrock)

**Figma Source:** [Component Assembly Design System](https://www.figma.com/design/EM5KcfOyqRBsPTRkbvT5Kn/Component-Assembly-Design-System)
**Token File:** `tokens/figma-variables.json` (synced from Figma variables API)

---

## 1. Visual Theme & Atmosphere

Professional, data-forward, and quietly warm. The interface is built for density and clarity — the kind of tool UI where information is the hero. Backgrounds are near-white in light mode with barely-visible separators (10% opacity dividers), creating a sense of open space without emptiness. Status colors appear only as translucent washes (20% opacity), keeping alert states present but never alarming. Dark mode shifts to a deep charcoal foundation that maintains warmth rather than going cold or pitch-black.

The brand identity bridges two distinct personalities: a warm amber-gold from the CAS (Component Assembly Systems) brand, and a crisp corporate blue lineage from the CF (Componentflow) palette. Together they produce a system that feels trustworthy and capable without being sterile.

---

## 2. Color Palette & Roles

### Brand Primitives

| Name                                          | Light                      | Dark                        | Role                                                                                               |
| --------------------------------------------- | -------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| Warm Amber Gold (`--cas-yellow`)              | `#cda871`                  | `#ffd28f`                   | Primary brand accent; used for highlights, badges, and brand moments                               |
| Near-Black Charcoal (`--cas-black`)           | `#262522`                  | `#262522`                   | Deepest text and foreground color; has a warm brown undertone, not pure black                      |
| Pure White (`--cas-white`)                    | `#ffffff`                  | `#ffffff`                   | Surface foundation                                                                                 |
| Warm Near-Black (`--cas-brown`)               | `#0e0800`                  | `#e9e9e9`                   | Inverts dramatically — deep espresso in light mode, cool light gray in dark                        |
| Sky Blue (`--cf-blue-light`)                  | `#00adef`                  | `#00b9ff`                   | Accent and interactive elements; bright, saturated, electric                                       |
| Corporate Blue (`--cf-blue-dark`)             | `#1d75bc`                  | `#269eff`                   | Primary action color; links, buttons, active states                                                |
| Deep Indigo-Navy (`--cf-purple`)              | `#2c2f75`                  | `#5f65ff`                   | Secondary brand color; shifts dramatically from a muted navy to vivid electric violet in dark mode |
| Translucent Blue Gradient (`--blue-gradient`) | `rgba(29, 117, 188, 0.56)` | `rgba(185, 228, 254, 0.56)` | Gradient overlays on branded surfaces                                                              |

### Semantic Backgrounds

All semantic backgrounds use 20% opacity — they are intentionally subtle washes, not solid fills. This keeps status surfaces present without overwhelming surrounding content.

| Name                                                       | Light Value                | Role                                                    |
| ---------------------------------------------------------- | -------------------------- | ------------------------------------------------------- |
| Primary Subtle (`--bg-primary-subtle`)                     | `rgba(0, 93, 147, 0.2)`    | Highlighted or selected primary content areas           |
| Accent Subtle (`--bg-accent-subtle`)                       | `rgba(55, 48, 163, 0.2)`   | Accent-colored informational regions                    |
| Info Subtle (`--bg-info-subtle`)                           | `rgba(0, 131, 210, 0.2)`   | Informational banners and callouts                      |
| Success Subtle (`--bg-success-subtle`)                     | `rgba(44, 84, 32, 0.2)`    | Confirmation and success states; deep forest green tint |
| Warning Subtle (`--bg-warning-subtle`)                     | `rgba(138, 90, 9, 0.2)`    | Cautionary states; warm amber tint                      |
| Danger Subtle (`--bg-danger-subtle`)                       | `rgba(174, 6, 6, 0.2)`     | Error and destructive action states                     |
| Hover Alt (`--bg-hover-alt`)                               | `rgba(218, 222, 224, 0.2)` | Row and item hover in light-touch surfaces              |
| Interaction Selected (`--interaction-selected-background`) | `rgba(0, 131, 210, 0.2)`   | Chosen/active items in lists, tabs, and menus           |

### Borders

Borders are near-invisible by design — structural without being decorative.

| Name                                      | Light Value              | Dark Value                | Role                                                                            |
| ----------------------------------------- | ------------------------ | ------------------------- | ------------------------------------------------------------------------------- |
| Card Divider (`--border-divider-in-card`) | `rgba(34, 36, 38, 0.1)`  | `rgba(34, 36, 38, 0.9)`   | Section separators within cards; barely visible in light, much stronger in dark |
| Hover Border (`--border-hover`)           | `rgba(0, 131, 210, 0.2)` | `rgba(45, 189, 255, 0.2)` | Border color when an element is focused or hovered                              |

### Text Hierarchy

The text scale uses semantic roles rather than named sizes. From the Figma variable structure:

- **Primary** — highest-contrast body text; near-black in light, near-white in dark
- **Secondary** — supporting text, labels; mid-gray
- **Tertiary** — de-emphasized metadata, captions
- **Quaternary** (`--text-quaternary`) — `rgba(60, 60, 67, 0.18)` — nearly invisible; used for ghosted placeholders and decorative text
- **Link / Brand / Active / Accent** — contextual text colors pulling from the corporate blue family
- **Status text** (info, success, warning, danger) — mirrors the semantic background palette at full opacity

### Data Visualization (Chart Series)

A 9-color sequence designed to remain distinguishable across both light and dark modes. Series 5 is the only color that shifts between modes (`#f9c74f` → `#fdd07a`); the rest are mode-invariant.

| Series | Color                 | Character            |
| ------ | --------------------- | -------------------- |
| 1      | `#376df5`             | Electric royal blue  |
| 2      | `#64dfdf`             | Clear teal           |
| 3      | `#f68769`             | Warm salmon          |
| 4      | `#c161e2`             | Soft lavender-violet |
| 5      | `#f9c74f` / `#fdd07a` | Golden amber         |
| 6      | `#f8629b`             | Hot pink             |
| 7      | `#74d062`             | Grass green          |
| 8      | `#84a7ff`             | Periwinkle blue      |
| 9      | `#f94144`             | Alarm red            |

---

## 3. Typography Rules

Font family tokens exist in Figma but are filtered from the CSS output (the build excludes `fontfamily` type tokens). The typographic intent from the token naming structure:

- **Primary text** maps to the body foreground — dark charcoal on white surfaces
- **Emphasis** uses the inverted color (white on dark brand surfaces) for maximum contrast
- **Labels and secondary text** use mid-gray to create clear hierarchy without extra sizing

When implementing type, use `--cas-black` (#262522) for body text — not pure #000000. The warm undertone is intentional and prevents the harshness of pure black on white.

---

## 4. Component Stylings

- **Buttons (Primary):** Corporate blue (`--cf-blue-dark`) fill with inverted/white text. On hover, the background pulls from the brand interaction selected color. Destructive variant uses danger-subtle background with danger text color.
- **Interactive States:** Hover uses `--bg-hover-alt` (near-transparent cool gray wash). Selected uses `--interaction-selected-background` (translucent corporate blue). These are light enough to layer over any surface color without competing.
- **Cards and Containers:** White/canvas background. Borders use `--border-divider-in-card` — at 10% opacity in light mode, these are structural guides rather than visible edges. No heavy drop shadows; elevation is implied through background contrast rather than shadow depth.
- **Status Banners/Alerts:** Always built with the `*-subtle` background tokens at 20% opacity paired with the corresponding full-opacity text color (e.g., `--bg-danger-subtle` + `--text-danger`). Never use solid status fills for large areas.
- **Icons:** Three-tier system — primary (matches body text), secondary (mid-gray), inverted (white for dark surfaces). Gradient icons use the two-stop `Icons/Gradient stop 1` and `Icons/Gradient stop 2` variables from Figma.

---

## 5. Layout Principles

Restraint defines the spatial system. Card separators at 10% opacity and hover states at 20% opacity signal that the UI trusts whitespace to do structural work. When generating new screens:

- Prefer subtle background washes over heavy borders to define regions
- Status states should use the `*-subtle` tokens — never solid fills for contextual callouts
- Dark mode maintains surface warmth: `--cas-black` (#262522) is the anchor, not pure black. Backgrounds in dark mode shift to deep grays from the Figma library, not to `#000000`
- The chart series palette is the only place where saturated, full-opacity color appears in large areas — everywhere else, saturation is held back through opacity

---

## Token Reference

All resolved token values are in `dist/tokens.css`. The CSS custom property naming convention maps directly from Figma variable paths:

```text
Figma: cas/yellow     →  CSS: --cas-yellow
Figma: bg/primary     →  CSS: --bg-primary  (if resolved; many alias external library)
Figma: charts/series-1 → CSS: --charts-series-1
```

Tokens that alias external Figma library variables (gray scale, most bg/ and text/ tokens) are dropped from `dist/tokens.css` because the external library IDs cannot be resolved at build time. Only tokens with direct color values or internal aliases appear in the output.
