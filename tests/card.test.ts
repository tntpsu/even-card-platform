import { describe, expect, it } from 'vitest'
import {
  cardEq, cardKey, RANKS, rankValue, renderCard, SUIT_GLYPH, SUITS,
} from '../src/card'

describe('SUIT_GLYPH', () => {
  it('substitutes BLACK DIAMOND for ♦', () => {
    expect(SUIT_GLYPH['♦']).toBe('◆')
  })
  it('passes the other three suits through unchanged', () => {
    expect(SUIT_GLYPH['♠']).toBe('♠')
    expect(SUIT_GLYPH['♥']).toBe('♥')
    expect(SUIT_GLYPH['♣']).toBe('♣')
  })
})

describe('renderCard', () => {
  it('builds rank + suit glyph', () => {
    expect(renderCard({ suit: '♠', rank: 'A' })).toBe('A♠')
    expect(renderCard({ suit: '♦', rank: '10' })).toBe('10◆')
    expect(renderCard({ suit: '♥', rank: '7' })).toBe('7♥')
  })
})

describe('cardKey', () => {
  it('uses the literal suit char (not the glyph)', () => {
    // Key is for storage/logs; glyph substitution only applies to display.
    expect(cardKey({ suit: '♦', rank: 'A' })).toBe('A♦')
  })
})

describe('rankValue', () => {
  it('orders ranks low-to-high with A = 14', () => {
    expect(rankValue('2')).toBe(2)
    expect(rankValue('10')).toBe(10)
    expect(rankValue('J')).toBe(11)
    expect(rankValue('A')).toBe(14)
  })
})

describe('cardEq', () => {
  it('matches identical cards', () => {
    expect(cardEq({ suit: '♥', rank: 'Q' }, { suit: '♥', rank: 'Q' })).toBe(true)
  })
  it('rejects differing suit or rank', () => {
    expect(cardEq({ suit: '♥', rank: 'Q' }, { suit: '♠', rank: 'Q' })).toBe(false)
    expect(cardEq({ suit: '♥', rank: 'Q' }, { suit: '♥', rank: 'K' })).toBe(false)
  })
})

describe('SUITS + RANKS', () => {
  it('SUITS has 4 elements', () => {
    expect(SUITS.length).toBe(4)
  })
  it('RANKS has 13 elements', () => {
    expect(RANKS.length).toBe(13)
  })
})
