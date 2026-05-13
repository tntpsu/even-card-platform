// Horizontal hand renderer with pixel-centered ▲ cursor below the active
// card. Returns exactly two lines: the cards row and the cursor row.
// (Cursor row is an empty string if cursorIdx is out of range.)
//
// Pixel-aware: the firmware font is proportional, so cursor centering
// can't use string indices. Uses @evenrealities/pretext.getTextWidth.
// See KNOWN_QUIRKS in any sibling glasses-app repo for the gory details.

import { getTextWidth } from '@evenrealities/pretext'
import { renderCard } from './card'
import type { Card } from './card'

const SPACE_PX = 5     // single-space advance width in the firmware font
const GAP_PX = 30      // visible gap between cards in the row
const CURSOR_GLYPH = '▲'
const CURSOR_PX = 20   // ▲ width in the firmware font

export interface HandRowOptions {
  hand: readonly Card[]
  /** Index of the active card, or -1 for no cursor. */
  cursorIdx: number
  /** Subset of `hand` considered legal to play right now. Cards NOT in
   *  this set are wrapped in parens. Defaults to "all legal." */
  legal?: readonly Card[]
}

export function renderHandRow(opts: HandRowOptions): string[] {
  const { hand, cursorIdx } = opts
  const legal = opts.legal ?? hand

  if (hand.length === 0) return ['', '']

  // Build the cards row token-by-token, tracking each card's pixel
  // center so we can place the cursor ▲ under it.
  const tokens: string[] = []
  const centers: number[] = []
  let pxCursor = 0
  const gapSpaces = Math.round(GAP_PX / SPACE_PX)

  for (let i = 0; i < hand.length; i++) {
    const c = hand[i]!
    const isLegal = legal.some(l => l.suit === c.suit && l.rank === c.rank)
    const tok = isLegal ? renderCard(c) : `(${renderCard(c)})`
    if (i > 0) {
      tokens.push(' '.repeat(gapSpaces))
      pxCursor += gapSpaces * SPACE_PX
    }
    const tokW = getTextWidth(tok)
    centers.push(pxCursor + tokW / 2)
    tokens.push(tok)
    pxCursor += tokW
  }

  const cardsLine = tokens.join('')
  const cursorLine = cursorIdx >= 0 && cursorIdx < hand.length
    ? buildCursorLine(centers[cursorIdx]!)
    : ''
  return [cardsLine, cursorLine]
}

function buildCursorLine(centerPx: number): string {
  // Lead with N spaces (5 px each) to center the ▲ glyph (20 px) at centerPx.
  const spaces = Math.max(0, Math.round((centerPx - CURSOR_PX / 2) / SPACE_PX))
  return ' '.repeat(spaces) + CURSOR_GLYPH
}
