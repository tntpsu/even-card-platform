// Bidding-phase plus-sign layout. Same compass positions as
// renderPlusTrick (N centered top, W/E spread middle, S centered bottom),
// with the upcard rendered (bracketed) in the middle of the W↔E row so
// the user can see who's at the table AND what's being bid on.
//
// Position letters (N, S) are letter-anchored at the center column so
// they stay vertically aligned even when their markers vary in width.
// Same anchoring as plus-trick.ts uses (v0.2.0+).
//
//         N(P)
//  W(D)  [J◆]  E(▶)
//         S(me)
//
// Markers are caller-provided via getMarker. Convention used by Euchre:
//   (D) — dealer
//   (▶) — currently bidding
//   (—) — passed in this round
//   (me) — South (you); kept for consistency with plus-trick.ts

import { getTextWidth } from '@evenrealities/pretext'
import { renderCard } from './card'
import type { Card } from './card'
import type { Position } from './plus-trick'

const PLUS_WIDTH_PX = 360
const SPACE_PX = 5

export interface PlusBidOptions {
  /** Marker text per position (e.g., 'D', '▶', 'me'). Empty = no marker. */
  getMarker?: (pos: Position) => string
  /** The upcard rendered bracketed in the middle of the W↔E row. */
  upCard: Card
}

export function renderPlusBid(opts: PlusBidOptions): string[] {
  const getMarker = opts.getMarker ?? (() => '')
  const label = (pos: Position): string => {
    const m = getMarker(pos)
    return m ? `${pos}(${m})` : pos
  }
  const upStr = `[${renderCard(opts.upCard)}]`
  return [
    centerOnFirstChar(label('N'), PLUS_WIDTH_PX),
    spreadWithCenterCard(label('W'), upStr, label('E'), PLUS_WIDTH_PX),
    centerOnFirstChar(label('S'), PLUS_WIDTH_PX),
  ]
}

function centerOnFirstChar(text: string, widthPx: number): string {
  const firstCharPx = getTextWidth(text.slice(0, 1))
  const padPx = Math.max(0, (widthPx - firstCharPx) / 2)
  const spaces = Math.round(padPx / SPACE_PX)
  return ' '.repeat(spaces) + text
}

function spreadWithCenterCard(
  leftLabel: string,
  centerCard: string,
  rightLabel: string,
  widthPx: number,
): string {
  const leftPx = getTextWidth(leftLabel)
  const cardPx = getTextWidth(centerCard)
  const rightPx = getTextWidth(rightLabel)
  const cardStartPx = (widthPx - cardPx) / 2 // upcard whole-string centered
  const gap1 = Math.max(SPACE_PX, cardStartPx - leftPx)
  const rightStartPx = widthPx - rightPx
  const gap2 = Math.max(SPACE_PX, rightStartPx - (cardStartPx + cardPx))
  const sp1 = Math.round(gap1 / SPACE_PX)
  const sp2 = Math.round(gap2 / SPACE_PX)
  return leftLabel + ' '.repeat(sp1) + centerCard + ' '.repeat(sp2) + rightLabel
}
