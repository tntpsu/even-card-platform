import { describe, expect, it } from 'vitest'
import { renderPlusTrick } from '../src/plus-trick'
import type { Card } from '../src/card'

const A_HEART: Card = { suit: '♥', rank: 'A' }
const SEVEN_HEART: Card = { suit: '♥', rank: '7' }
const J_SPADE: Card = { suit: '♠', rank: 'J' }

describe('renderPlusTrick', () => {
  it('returns exactly 3 lines', () => {
    const out = renderPlusTrick({
      plays: [
        { pos: 'N', card: SEVEN_HEART },
        { pos: 'W', card: J_SPADE },
        { pos: 'E', card: null },
        { pos: 'S', card: A_HEART },
      ],
    })
    expect(out.length).toBe(3)
  })

  it('line 0 is the N row', () => {
    const out = renderPlusTrick({
      plays: [{ pos: 'N', card: SEVEN_HEART }, { pos: 'S', card: null }, { pos: 'W', card: null }, { pos: 'E', card: null }],
    })
    expect(out[0]).toContain('N: 7♥')
  })

  it('line 1 contains both W and E', () => {
    const out = renderPlusTrick({
      plays: [{ pos: 'W', card: J_SPADE }, { pos: 'E', card: SEVEN_HEART }, { pos: 'N', card: null }, { pos: 'S', card: null }],
    })
    expect(out[1]).toContain('W: J♠')
    expect(out[1]).toContain('E: 7♥')
  })

  it('line 2 is the S row', () => {
    const out = renderPlusTrick({
      plays: [{ pos: 'S', card: A_HEART }, { pos: 'N', card: null }, { pos: 'W', card: null }, { pos: 'E', card: null }],
    })
    expect(out[2]).toContain('S: A♥')
  })

  it('renders unplayed positions as `-`', () => {
    const out = renderPlusTrick({
      plays: [{ pos: 'N', card: null }, { pos: 'W', card: null }, { pos: 'E', card: null }, { pos: 'S', card: null }],
    })
    expect(out[0]).toContain('N: -')
    expect(out[1]).toContain('W: -')
    expect(out[1]).toContain('E: -')
    expect(out[2]).toContain('S: -')
  })

  it('appends markers via getMarker', () => {
    const out = renderPlusTrick({
      plays: [{ pos: 'S', card: A_HEART }, { pos: 'N', card: null }, { pos: 'W', card: null }, { pos: 'E', card: null }],
      getMarker: pos => pos === 'S' ? 'me' : '',
    })
    expect(out[2]).toContain('S(me): A♥')
  })

  it('stacks multiple markers comma-separated', () => {
    const out = renderPlusTrick({
      plays: [{ pos: 'S', card: A_HEART }, { pos: 'N', card: null }, { pos: 'W', card: null }, { pos: 'E', card: null }],
      getMarker: pos => pos === 'S' ? 'me,D,M' : '',
    })
    expect(out[2]).toContain('S(me,D,M): A♥')
  })

  it('N line has leading whitespace (centering)', () => {
    const out = renderPlusTrick({
      plays: [{ pos: 'N', card: SEVEN_HEART }, { pos: 'S', card: null }, { pos: 'W', card: null }, { pos: 'E', card: null }],
    })
    expect(out[0]!.startsWith(' ')).toBe(true)
  })

  it('substitutes BLACK DIAMOND for ♦ cards', () => {
    const tenDiamond: Card = { suit: '♦', rank: '10' }
    const out = renderPlusTrick({
      plays: [{ pos: 'S', card: tenDiamond }, { pos: 'N', card: null }, { pos: 'W', card: null }, { pos: 'E', card: null }],
    })
    expect(out[2]).toContain('S: 10◆')
  })
})
