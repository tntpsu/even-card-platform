// Hand renderer that handles both small hands (Euchre 5-card, single row)
// and large hands (Hearts/Spades/Gin Rummy 10–13 card, multi-row split).
// Picks the layout based on a max-per-row threshold; the default is
// chosen to keep the row width under the 576 px G2 display even when
// most cards wear parens for "illegal play right now."
//
// Multi-row cursor: default is `between` — the cursor sits between the
// two card rows and flips ▲ (active card is in row above) or ▼ (active
// card is in row below). Legacy `below` keeps each row's cursor under
// that row. Field feedback from CardPack v0.1.5 drove the default flip.
//
// See STYLE.md § 1.6 (Cards in hands) for the visual contract.

import { getTextWidth } from '@evenrealities/pretext'
import { rankValue, renderCard, SUITS } from './card'
import type { Card, Suit } from './card'

const SPACE_PX = 5
const GAP_PX = 20           // narrower than Euchre's 30 to fit more per row
const CURSOR_UP = '▲'
const CURSOR_DOWN = '▼'
const CURSOR_PX = 20
const DEFAULT_MAX_PER_ROW = 7
const DISPLAY_WIDTH_PX = 576

export type MultiRowCursor = 'between' | 'below'

export interface HandOptions {
  hand: readonly Card[]
  /** Cursor index over the (sorted, if applicable) hand. -1 = no cursor. */
  cursorIdx: number
  /** Subset of `hand` considered legal. Non-legal cards get parens. */
  legal?: readonly Card[]
  /** Max cards per visual row. Defaults to 7 (fits 13-card Hearts on G2). */
  maxPerRow?: number
  /** Where the cursor sits on multi-row layouts. Defaults to `between`:
   *  the cursor sits BETWEEN the two rows and flips ▲ (active card is
   *  in row above) or ▼ (active card is in row below). `below` keeps
   *  the legacy per-row cursor underneath each row. Single-row hands
   *  always use cursor-below regardless of this option. */
  multiRowCursor?: MultiRowCursor
}

/**
 * Render a hand as 1 or 2 rows depending on size.
 *
 * Single row: returns [cards] or [cards, cursor].
 *
 * Multi-row in `between` mode (default): returns [row1, cursor, row2]
 * where `cursor` is the between-rows arrow line. Omitted when
 * cursorIdx < 0.
 *
 * Multi-row in `below` mode (legacy): returns up to 4 lines —
 * row1, [row1cursor], row2, [row2cursor].
 *
 * Cursor wrap is the caller's job — this just renders whatever index
 * was passed.
 */
export function renderHand(opts: HandOptions): string[] {
  const { hand, cursorIdx } = opts
  const legal = opts.legal ?? hand
  const maxPerRow = opts.maxPerRow ?? DEFAULT_MAX_PER_ROW
  const multiRowCursor = opts.multiRowCursor ?? 'between'

  if (hand.length === 0) return ['']

  if (hand.length <= maxPerRow) {
    const [cards, cur] = renderOneRow(hand, cursorIdx, legal)
    return cur ? [cards, cur] : [cards]
  }

  // Multi-row split. Round up so row1 has the extra when odd.
  const halfway = Math.ceil(hand.length / 2)
  const row1 = hand.slice(0, halfway)
  const row2 = hand.slice(halfway)

  if (multiRowCursor === 'below') {
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

  // 'between' mode — cursor anchored between the two rows.
  const [r1c, , row1Centers] = renderOneRow(row1, -1, legal)
  const [r2c, , row2Centers] = renderOneRow(row2, -1, legal)
  const lines: string[] = [r1c]
  if (cursorIdx >= 0 && cursorIdx < hand.length) {
    if (cursorIdx < halfway) {
      lines.push(buildCursorLine(row1Centers[cursorIdx]!, CURSOR_UP))
    } else {
      lines.push(buildCursorLine(row2Centers[cursorIdx - halfway]!, CURSOR_DOWN))
    }
  }
  lines.push(r2c)
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
): [string, string, number[]] {
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
    ? buildCursorLine(centers[cursorIdx]!, CURSOR_UP)
    : ''
  return [cardsLine, cursorLine, centers]
}

function buildCursorLine(centerPx: number, glyph: string): string {
  const spaces = Math.max(0, Math.round((centerPx - CURSOR_PX / 2) / SPACE_PX))
  return ' '.repeat(spaces) + glyph
}

/** Exported for tests + diagnostics. Returns true if the row's rendered
 *  width fits in the 576 px G2 display. */
export function rowFitsDisplay(hand: readonly Card[], legal: readonly Card[] = hand): boolean {
  const [cards] = renderOneRow(hand, -1, legal)
  return getTextWidth(cards) <= DISPLAY_WIDTH_PX
}

export { DISPLAY_WIDTH_PX }
