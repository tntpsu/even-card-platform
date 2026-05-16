// Four-player trick layout — the three-line plus-sign per STYLE.md § 1.7.
// Pattern is fixed: partner across, opponents on sides, you at bottom.
//
//          N: <card>          ← partner row, centered
//   W: <card>      E: <card>  ← opponents row, left + right justified
//          S: <card>          ← your row, centered
//
// Empty positions (player hasn't played yet) show '-'. Markers like
// '(me)', '(D)', '(M,led)' come from the caller via getMarker.

import { getTextWidth } from '@evenrealities/pretext'
import { renderCard } from './card'
import type { Card } from './card'

export type Position = 'N' | 'E' | 'S' | 'W'

export interface PlusTrickPlay {
  pos: Position
  /** null = hasn't played yet, renders as '-'. */
  card: Card | null
}

const PLUS_WIDTH_PX = 360   // about half the 576 px G2 display
const SPACE_PX = 5

export interface PlusTrickOptions {
  plays: readonly PlusTrickPlay[]
  /** Returns the marker suffix for a position. Empty string = no marker.
   *  Example: getMarker('S') === 'me,D' → renders 'S(me,D): A♥'. */
  getMarker?: (pos: Position) => string
}

export function renderPlusTrick(opts: PlusTrickOptions): string[] {
  const { plays } = opts
  const getMarker = opts.getMarker ?? (() => '')
  const by = (pos: Position): string => {
    const play = plays.find(p => p.pos === pos)
    const cardStr = play?.card ? renderCard(play.card) : '-'
    const m = getMarker(pos)
    const label = m ? `${pos}(${m})` : pos
    return `${label}: ${cardStr}`
  }
  return [
    centerPx(by('N'), PLUS_WIDTH_PX),
    spreadPx(by('W'), by('E'), PLUS_WIDTH_PX),
    centerPx(by('S'), PLUS_WIDTH_PX),
  ]
}

function centerPx(text: string, widthPx: number): string {
  // Letter-anchored centering (v0.2.0): center the FIRST CHAR (the position
  // letter N or S) at widthPx/2 — not the whole string. Otherwise rows
  // with long marker text (e.g., "S(me,D,▶)" vs "N") drift the position
  // letters apart, making the cross look bent. Markers hang to the right.
  const firstCharPx = getTextWidth(text.slice(0, 1))
  const padPx = Math.max(0, (widthPx - firstCharPx) / 2)
  const spaces = Math.round(padPx / SPACE_PX)
  return ' '.repeat(spaces) + text
}

function spreadPx(left: string, right: string, widthPx: number): string {
  const leftPx = getTextWidth(left)
  const rightPx = getTextWidth(right)
  const gapPx = Math.max(SPACE_PX, widthPx - leftPx - rightPx)
  const spaces = Math.round(gapPx / SPACE_PX)
  return left + ' '.repeat(spaces) + right
}
