// Glasses frame composition. Platform owns header + footer; game owns
// body. This file is what makes STYLE.md § 1.1 enforceable at runtime —
// games can't paint over the header or footer because they never
// produce a full string, only a GlassesFrame.
//
// See STYLE.md § 1.2 (header), § 1.3 (footer). The end-of-hand banner
// in GlassesFrame.banner is the only platform-level overlay; mid-game
// "exit to menu" and "quit app" are phone-side per STYLE.md § 2.

import type { GlassesFrame } from './types'

export interface ComposeOpts {
  /** Game display name, uppercased into the header. 'Hearts' → 'HEARTS'. */
  gameName: string
  /** Output of the game's render(). */
  frame: GlassesFrame
}

const HEADER_WIDTH_HINT = 32   // visual reference, not enforced (proportional font)

/**
 * Compose the full glasses string to hand to bridge.textContainerUpgrade.
 * Returns a single newline-joined string ready for render.
 *
 * Layout:
 *   HEADER (gameName uppercased + score)
 *   body lines from frame.body
 *   optional banner (preceded by a blank for separation)
 *   (blank)
 *   FOOTER (frame.controlHint)
 */
export function composeGlassesFrame(opts: ComposeOpts): string {
  const { gameName, frame } = opts
  const lines: string[] = []

  lines.push(buildHeader(gameName.toUpperCase(), frame.score))
  for (const ln of frame.body) lines.push(ln)
  if (frame.banner) {
    lines.push('')
    lines.push(frame.banner)
  }
  lines.push('')
  lines.push(frame.controlHint)

  return lines.join('\n')
}

function buildHeader(name: string, score: string): string {
  if (!score) return name
  // Pad between name and score so score is roughly right-aligned. Two
  // spaces minimum; more if there's slack. We can't measure pixels in
  // this composer (the caller's render path will via pretext if needed),
  // so we use character estimate + min-2 spaces.
  const slack = Math.max(2, HEADER_WIDTH_HINT - name.length - score.length)
  return `${name}${' '.repeat(slack)}${score}`
}
