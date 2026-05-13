import { describe, expect, it } from 'vitest'
import { renderHandRow } from '../src/hand-row'
import type { Card } from '../src/card'

const HAND: Card[] = [
  { suit: '♥', rank: 'A' },
  { suit: '♠', rank: 'Q' },
  { suit: '♦', rank: '10' },
  { suit: '♣', rank: 'J' },
]

describe('renderHandRow', () => {
  it('returns exactly 2 lines', () => {
    const out = renderHandRow({ hand: HAND, cursorIdx: 0 })
    expect(out.length).toBe(2)
  })

  it('cards row contains all card strings', () => {
    const [cards] = renderHandRow({ hand: HAND, cursorIdx: 0 })
    expect(cards).toContain('A♥')
    expect(cards).toContain('Q♠')
    expect(cards).toContain('10◆')      // ♦ becomes ◆
    expect(cards).toContain('J♣')
  })

  it('wraps illegal cards in parens', () => {
    const legal = [HAND[0]!, HAND[2]!]  // only A♥ and 10◆ are legal
    const [cards] = renderHandRow({ hand: HAND, cursorIdx: 0, legal })
    expect(cards).toContain('A♥')
    expect(cards).toContain('(Q♠)')
    expect(cards).toContain('10◆')
    expect(cards).toContain('(J♣)')
  })

  it('cursor row shows ▲ when cursorIdx is in range', () => {
    const [, cursor = ''] = renderHandRow({ hand: HAND, cursorIdx: 1 })
    expect(cursor).toContain('▲')
    expect(cursor.length).toBeGreaterThan(0)
  })

  it('cursor row is empty when cursorIdx is -1', () => {
    const [, cursor = ''] = renderHandRow({ hand: HAND, cursorIdx: -1 })
    expect(cursor).toBe('')
  })

  it('cursor row is empty when cursorIdx is out of range', () => {
    const [, cursor = ''] = renderHandRow({ hand: HAND, cursorIdx: 99 })
    expect(cursor).toBe('')
  })

  it('handles empty hand', () => {
    const [cards, cursor] = renderHandRow({ hand: [], cursorIdx: 0 })
    expect(cards).toBe('')
    expect(cursor).toBe('')
  })

  it('cursor moves rightward as cursorIdx increases', () => {
    // Pixel-centered: cursor under later card has more leading spaces.
    const c0 = renderHandRow({ hand: HAND, cursorIdx: 0 })[1]!
    const c2 = renderHandRow({ hand: HAND, cursorIdx: 2 })[1]!
    const c0Spaces = c0.length - 1   // total length minus the ▲
    const c2Spaces = c2.length - 1
    expect(c2Spaces).toBeGreaterThan(c0Spaces)
  })
})
