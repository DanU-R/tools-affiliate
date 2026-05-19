---
version: alpha
name: Tools Affiliate Design System
description: A warm dark editorial tool combining Notion's purple-signature clarity and pastel-tinted card language, Figma's confident pill-button vocabulary and color-block section rhythm, and Wired's strict three-face typographic ladder (serif display, sans UI, clean body). The tool surface reads as a premium editor's workspace — deep warm-black canvas (#161412) borrowed from the user's portfolio, purple primary CTA (#7c5cfc — a slightly electric Notion-inspired purple adapted for dark mode), and pastel-tinted feature surfaces that echo Figma's story-block approach without overwhelming the tool's focus.

colors:
  primary: "#7c5cfc"
  primary-hover: "#9080ff"
  primary-pressed: "#6a4ae0"
  primary-dim: "#4a3a8a"
  on-primary: "#ffffff"
  canvas: "#161412"
  surface-1: "#1e1c1a"
  surface-2: "#2a2724"
  surface-3: "#34302c"
  surface-soft: "#1a1816"
  hairline: "#2e2a26"
  hairline-soft: "#252220"
  hairline-strong: "#3d3833"
  text: "#f2ede6"
  text-muted: "#a89f94"
  text-dim: "#6b6359"
  text-subtle: "#4a443e"
  block-lavender: "#2a2040"
  block-lime: "#1a2e1a"
  block-peach: "#2e1e14"
  block-sky: "#142838"
  block-mint: "#142820"
  block-rose: "#2e1420"
  accent-success: "#4ade80"
  accent-warning: "#f5a623"
  accent-error: "#ff4444"

typography:
  display-hero:
    fontFamily: '"Playfair Display", Georgia, serif'
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.5px
  display-md:
    fontFamily: '"Playfair Display", Georgia, serif'
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.3px
  heading:
    fontFamily: '"Space Grotesk", system-ui, sans-serif'
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.30
    letterSpacing: -0.2px
  subheading:
    fontFamily: '"Space Grotesk", system-ui, sans-serif'
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0
  body:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.60
    letterSpacing: 0
  body-sm:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  caption:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: 0.3px
  eyebrow:
    fontFamily: '"Space Grotesk", system-ui, sans-serif'
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: 0.8px
    textTransform: uppercase
  button:
    fontFamily: '"Space Grotesk", system-ui, sans-serif'
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.20
    letterSpacing: 0.1px
  button-sm:
    fontFamily: '"Space Grotesk", system-ui, sans-serif'
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.20
    letterSpacing: 0.1px

rounded:
  pill: 9999px
  md: 10px
  lg: 14px
  xl: 18px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 48px

components:
  card:
    background: "{colors.surface-1}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    padding: 24px
  card-hover:
    borderColor: "{colors.hairline-strong}"
    background: "{colors.surface-2}"
  card-title:
    typography: "{typography.eyebrow}"
    color: "{colors.text-muted}"
    marginBottom: 16px
  button-primary:
    background: "{colors.primary}"
    color: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
  button-primary-hover:
    background: "{colors.primary-hover}"
  button-primary-disabled:
    opacity: 0.4
  button-secondary:
    background: "{colors.surface-2}"
    color: "{colors.text}"
    border: "1px solid {colors.hairline}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-secondary-hover:
    background: "{colors.surface-3}"
    borderColor: "{colors.hairline-strong}"
  input:
    background: "{colors.surface-2}"
    border: "1px solid {colors.hairline}"
    color: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  input-focus:
    borderColor: "{colors.primary}"
    boxShadow: "0 0 0 3px rgba(124, 92, 252, 0.15)"
  pill-tag:
    background: "{colors.surface-2}"
    color: "{colors.text-muted}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    typography: "{typography.body-sm}"
  pill-tag-active:
    background: "{colors.primary}"
    color: "{colors.on-primary}"
    borderColor: "{colors.primary}"
  linkbio-entry:
    background: "{colors.surface-2}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: "14px"
    typography: "{typography.body}"
  linkbio-entry-hover:
    background: "{colors.surface-3}"
    borderColor: "{colors.hairline-strong}"
  color-block-lavender:
    background: "{colors.block-lavender}"
    border: "1px solid rgba(124, 92, 252, 0.15)"
  color-block-lime:
    background: "{colors.block-lime}"
    border: "1px solid rgba(74, 222, 128, 0.10)"
  color-block-peach:
    background: "{colors.block-peach}"
    border: "1px solid rgba(245, 166, 35, 0.10)"

dos:
  - Use purple (#7c5cfc) for primary CTAs — it's the brand signature from Notion, adapted for dark mode
  - Keep cards on surface-1 with hairline borders — never pure white or pure black
  - Use pill-shaped buttons (rounded.pill) for all CTAs — Figma's vocabulary
  - Use warm text (#f2ede6) not pure white — editorial warmth
  - Use subtle color blocks (block-lavender, block-lime) as section backgrounds for variety
  - Reserve Playfair Display for the hero/title only — editorial accent
  - Use Space Grotesk for buttons, labels, and technical UI elements
  - Use Inter for all body text and form content
  - Maintain generous whitespace between sections
  - Animate interactive elements with 200ms ease transitions

donts:
  - Don't use pill buttons AND square buttons in the same page — be consistent
  - Don't use pure black (#000000) backgrounds — always warm dark
  - Don't overuse purple — it's for CTAs and active states only
  - Don't add drop shadows to cards — use border color for elevation
  - Don't use more than 2 font families in a single component
  - Don't use Inter below 12px — use Space Grotesk for small UI labels
  - Don't create busy layouts — embrace negative space like Figma does
  - Don't animate everything — reserve motion for interactive feedback only

voice:
  tone: "Clean, professional tool — confident but not flashy"
  writing: "Indonesian-friendly, concise labels, action-oriented CTAs"
