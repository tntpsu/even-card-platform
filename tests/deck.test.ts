import { describe, expect, it } from 'vitest'
import { cardKey } from '../src/card'
import { deal, deckFromRanks, drawTop, freshDeck, shuffle } from '../src/deck'

describe('freshDeck', () => {
  it('has 52 unique cards', () => {
    const d = freshDeck()
    expect(d.length).toBe(52)
    const keys = new Set(d.map(cardKey))
    expect(keys.size).toBe(52)
  })
})

describe('deckFromRanks', () => {
  it('builds Euchre 24-card deck', () => {
    const d = deckFromRanks(['9', '10', 'J', 'Q', 'K', 'A'])
    expect(d.length).toBe(24)
    // All four suits represented
    const suits = new Set(d.map(c => c.suit))
    expect(suits.size).toBe(4)
  })
})

describe('shuffle', () => {
  it('preserves length and contents (just reorders)', () => {
    const original = freshDeck()
    const shuffled = shuffle(original)
    expect(shuffled.length).toBe(original.length)
    expect(new Set(shuffled.map(cardKey))).toEqual(new Set(original.map(cardKey)))
  })
  it('is deterministic with a seeded RNG', () => {
    // Tiny linear-congruential RNG, seeded.
    const seeded = (seed: number) => {
      let s = seed
      return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
    }
    const a = shuffle(freshDeck(), seeded(42))
    const b = shuffle(freshDeck(), seeded(42))
    expect(a.map(cardKey)).toEqual(b.map(cardKey))
  })
  it('does not mutate the input', () => {
    const original = freshDeck()
    const before = original.map(cardKey)
    shuffle(original)
    expect(original.map(cardKey)).toEqual(before)
  })
})

describe('deal', () => {
  it('splits 52 cards into 4 hands of 13', () => {
    const r = deal(freshDeck(), 4, 13)
    expect(r.hands.length).toBe(4)
    expect(r.hands.every(h => h.length === 13)).toBe(true)
    expect(r.rest.length).toBe(0)
  })
  it('leaves the rest pile for partial deals (Euchre: 24 deck, 4 hands × 5 = 20 dealt, 4 in kitty)', () => {
    const r = deal(deckFromRanks(['9', '10', 'J', 'Q', 'K', 'A']), 4, 5)
    expect(r.hands.length).toBe(4)
    expect(r.hands.every(h => h.length === 5)).toBe(true)
    expect(r.rest.length).toBe(4)
  })
  it('deals in dealer-rotation order (round-robin, not slab)', () => {
    // First 4 cards of the deck go to the 4 hands' first slot each.
    const d = freshDeck()
    const r = deal(d, 4, 13)
    expect(r.hands[0]![0]).toEqual(d[0])
    expect(r.hands[1]![0]).toEqual(d[1])
    expect(r.hands[2]![0]).toEqual(d[2])
    expect(r.hands[3]![0]).toEqual(d[3])
    expect(r.hands[0]![1]).toEqual(d[4])
  })
})

describe('drawTop', () => {
  it('returns the first card and the remaining deck', () => {
    const d = freshDeck()
    const r = drawTop(d)
    expect(r.card).toEqual(d[0])
    expect(r.rest.length).toBe(51)
  })
  it('handles an empty deck', () => {
    const r = drawTop([])
    expect(r.card).toBeNull()
    expect(r.rest).toEqual([])
  })
})
