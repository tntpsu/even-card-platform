// Glasses frame composition. Platform owns header + footer; game owns
// body. This file is what makes STYLE.md § 1.1 enforceable at runtime —
// games can't paint over the header or footer because they never
// produce a full string, only a GlassesFrame.
//
// See STYLE.md § 1.2 (header), § 1.3 (footer), § 1.10 (modal overlays).

import type { GlassesFrame } from './types'

export type Overlay =
  | { kind: 'exit-to-menu' }
  | { kind: 'quit-app' }
  | { kind: 'banner'; text: string }   // end-of-hand / end-of-game

export interface ComposeOpts {
  /** Game display name, uppercased into the header. 'Hearts' → 'HEARTS'. */
  gameName: string
  /** Output of the game's render(). */
  frame: GlassesFrame
  /** When set, replaces the body with the overlay content. The header
   *  and footer remain visible. */
  overlay?: Overlay | null
}

const HEADER_WIDTH_HINT = 32   // visual reference, not enforced (proportional font)

/**
 * Compose the full glasses string to hand to bridge.textContainerUpgrade.
 * Returns a single newline-joined string ready for render.
 */
export function composeGlassesFrame(opts: ComposeOpts): string {
  const { gameName, frame, overlay } = opts
  const lines: string[] = []

  // Header: <NAME>    <SCORE>
  lines.push(buildHeader(gameName.toUpperCase(), frame.score))

  // Body — overlay wins, otherwise frame.body, with banner appended.
  if (overlay) {
    for (const ln of overlayBody(overlay)) lines.push(ln)
  } else {
    for (const ln of frame.body) lines.push(ln)
    if (frame.banner) {
      lines.push('')
      lines.push(frame.banner)
    }
  }

  // Footer (separated by a blank line for breathing room).
  lines.push('')
  lines.push(overlay ? overlayFooter(overlay) : frame.controlHint)

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

function overlayBody(overlay: Overlay): string[] {
  switch (overlay.kind) {
    case 'exit-to-menu':
      return [
        '',
        'EXIT TO MENU?',
        '',
        'Swipe down again to confirm',
        'Or wait to cancel',
      ]
    case 'quit-app':
      return [
        '',
        'QUIT APP?',
        '',
        'Swipe down again to confirm',
        'Or wait to cancel',
      ]
    case 'banner':
      return ['', overlay.text, '']
  }
}

function overlayFooter(overlay: Overlay): string {
  switch (overlay.kind) {
    case 'exit-to-menu':
    case 'quit-app':
      return '[swipe↓] confirm   wait to cancel'
    case 'banner':
      return ''   // banner is informational; footer empty
  }
}
