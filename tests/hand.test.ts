// Tests for the multi-row hand renderer. Includes the regression test
// for the 13-card-Hearts-overflows-screen field bug surfaced when the
// user actually played the v0.1.2 .ehpk.

import { describe, expect, it } from 'vitest'
import { freshDeck } from '../src/deck'
import { renderHand, rowFitsDisplay, sortBySuit, DISPLAY_WIDTH_PX } from '../src/hand'
import { getTextWidth } from '@evenrealities/pretext'
import type { Card } from '../src/card'

function pick(count: number): Card[] {
  // Take every 4th card from a fresh deck to get a varied 13-card hand
  // (one of each rank by accident — close enough to a Hearts deal).
  const d = freshDeck()
  const out: Card[] = []
  for (let i = 0; i < count; i++) out.push(d[(i * 4) % 52]!)
  return out
}

describe('renderHand — single row for small hands', () => {
  it('5 cards (Euchre) renders as a single row', () => {
    const out = renderHand({ hand: pick(5), cursorIdx: 0 })
    expect(out.length).toBeLessThanOrEqual(2)   // cards row + cursor row
  })

  it('cursor row is omitted when cursorIdx is -1', () => {
    const out = renderHand({ hand: pick(5), cursorIdx: -1 })
    expect(out.length).toBe(1)
  })
})

describe('renderHand — multi-row split for large hands', () => {
  it('13 cards (Hearts) splits into two rows', () => {
    const out = renderHand({ hand: pick(13), cursorIdx: 0 })
    // 2 card rows + at least 1 cursor row = 3 lines minimum
    expect(out.length).toBeGreaterThanOrEqual(3)
    expect(out.length).toBeLessThanOrEqual(4)
  })

  it('cursor in row 1 produces a cursor row after row 1, not row 2', () => {
    const out = renderHand({ hand: pick(13), cursorIdx: 2 })
    // Lines: row1cards, row1cursor, row2cards (no row2cursor since cursor is in row 1)
    expect(out[1]).toContain('▲')
    expect(out[2]).not.toContain('▲')
  })

  it('cursor in row 2 produces a cursor row after row 2, not row 1', () => {
    const out = renderHand({ hand: pick(13), cursorIdx: 10 })
    // Lines: row1cards, row2cards, row2cursor (no row1cursor)
    expect(out[1]).not.toContain('▲')
    expect(out[2]).toContain('▲')
  })

  it('10 cards (Gin Rummy) also splits (above default threshold of 7)', () => {
    const out = renderHand({ hand: pick(10), cursorIdx: 0 })
    expect(out.length).toBeGreaterThanOrEqual(3)
  })

  it('regression: 13-card Hearts hand FITS the 576 px G2 display', () => {
    // The bug this test exists for: v0.1.2 rendered all 13 cards on one
    // row that overflowed the display. This regression test fails if
    // any future change reintroduces single-row layout for 13 cards.
    const hand = pick(13)
    const out = renderHand({ hand, cursorIdx: 0 })
    for (const line of out) {
      expect(getTextWidth(line)).toBeLessThanOrEqual(DISPLAY_WIDTH_PX)
    }
  })

  it('regression: 13-card hand with ALL cards illegal (parens) still fits', () => {
    // Worst case: parens around every card adds 2 chars × 13 = +26 chars
    // worth of width. Multi-row must still keep each row under 576 px.
    const hand = pick(13)
    const out = renderHand({ hand, cursorIdx: 0, legal: [] })
    for (const line of out) {
      expect(getTextWidth(line)).toBeLessThanOrEqual(DISPLAY_WIDTH_PX)
    }
  })
})

describe('rowFitsDisplay', () => {
  it('returns true for 5 cards', () => {
    expect(rowFitsDisplay(pick(5))).toBe(true)
  })
  it('returns false for 13 cards on a single row (the field bug)', () => {
    expect(rowFitsDisplay(pick(13))).toBe(false)
  })
})

describe('sortBySuit', () => {
  it('groups cards by suit in ♠ ♥ ♦ ♣ order, ascending rank within suit', () => {
    const hand: Card[] = [
      { suit: '♣', rank: '5' },
      { suit: '♠', rank: 'A' },
      { suit: '♥', rank: '2' },
      { suit: '♠', rank: '7' },
      { suit: '♦', rank: 'K' },
    ]
    const sorted = sortBySuit(hand)
    expect(sorted.map(c => `${c.rank}${c.suit}`)).toEqual([
      '7♠', 'A♠', '2♥', 'K♦', '5♣',
    ])
  })
  it('does not mutate input', () => {
    const hand: Card[] = [{ suit: '♣', rank: '5' }, { suit: '♠', rank: 'A' }]
    const before = JSON.stringify(hand)
    sortBySuit(hand)
    expect(JSON.stringify(hand)).toBe(before)
  })
})
