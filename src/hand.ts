// Hand renderer that handles both small hands (Euchre 5-card, single row)
// and large hands (Hearts/Spades/Gin Rummy 10–13 card, multi-row split).
// Picks the layout based on a max-per-row threshold; the default is
// chosen to keep the row width under the 576 px G2 display even when
// most cards wear parens for "illegal play right now."
//
// Output is up to 4 lines: row1 cards, row1 cursor (or blank), row2
// cards, row2 cursor (or blank). Empty trailing rows are omitted.
//
// See STYLE.md § 1.6 (Cards in hands) for the visual contract.

import { getTextWidth } from '@evenrealities/pretext'
import { rankValue, renderCard, SUITS } from './card'
import type { Card, Suit } from './card'

const SPACE_PX = 5
const GAP_PX = 20           // narrower than Euchre's 30 to fit more per row
const CURSOR_GLYPH = '▲'
const CURSOR_PX = 20
const DEFAULT_MAX_PER_ROW = 7
const DISPLAY_WIDTH_PX = 576

export interface HandOptions {
  hand: readonly Card[]
  /** Cursor index over the (sorted, if applicable) hand. -1 = no cursor. */
  cursorIdx: number
  /** Subset of `hand` considered legal. Non-legal cards get parens. */
  legal?: readonly Card[]
  /** Max cards per visual row. Defaults to 7 (fits 13-card Hearts on G2). */
  maxPerRow?: number
}

/**
 * Render a hand as 1 or 2 rows depending on size. Returns up to 4 lines:
 *
 *   row1 cards
 *   row1 cursor (or blank if cursor is in row 2)
 *   row2 cards (only if hand > maxPerRow)
 *   row2 cursor (or blank if cursor is in row 1)
 *
 * Cursor wrap is the caller's job — this just renders whatever index
 * was passed.
 */
export function renderHand(opts: HandOptions): string[] {
  const { hand, cursorIdx } = opts
  const legal = opts.legal ?? hand
  const maxPerRow = opts.maxPerRow ?? DEFAULT_MAX_PER_ROW

  if (hand.length === 0) return ['']

  if (hand.length <= maxPerRow) {
    const [cards, cur] = renderOneRow(hand, cursorIdx, legal)
    return cur ? [cards, cur] : [cards]
  }

  // Multi-row split. Round up so row1 has the extra when odd.
  const halfway = Math.ceil(hand.length / 2)
  const row1 = hand.slice(0, halfway)
  const row2 = hand.slice(halfway)
  const cur1 = cursorIdx < halfway ? cursorIdx : -1
  const cur2 = cursorIdx >= halfway ? cursorIdx - halfway : -1
  const [r1c, r1k] = renderOneRow(row1, cur1, legal)
  const [r2c, r2k] = renderOneRow(row2, cur2, legal)
  const lines: string[] = []
  lines.push(r1c)
  if (r1k) lines.push(r1k)
  lines.push(r2c)
  if (r2k) lines.push(r2k)
  return lines
}

/** Sort by suit (♠ ♥ ♦ ♣) then by rank ascending. Useful for grouping
 *  cards visually in larger hands so cursor movement feels predictable. */
export function sortBySuit(hand: readonly Card[]): Card[] {
  const order = (s: Suit): number => SUITS.indexOf(s)
  const out = hand.slice()
  out.sort((a, b) => {
    const sd = order(a.suit) - order(b.suit)
    if (sd !== 0) return sd
    return rankValue(a.rank) - rankValue(b.rank)
  })
  return out
}

function renderOneRow(
  hand: readonly Card[],
  cursorIdx: number,
  legal: readonly Card[],
): [string, string] {
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
  const spaces = Math.max(0, Math.round((centerPx - CURSOR_PX / 2) / SPACE_PX))
  return ' '.repeat(spaces) + CURSOR_GLYPH
}

/** Exported for tests + diagnostics. Returns true if the row's rendered
 *  width fits in the 576 px G2 display. */
export function rowFitsDisplay(hand: readonly Card[], legal: readonly Card[] = hand): boolean {
  const [cards] = renderOneRow(hand, -1, legal)
  return getTextWidth(cards) <= DISPLAY_WIDTH_PX
}

export { DISPLAY_WIDTH_PX }
