import { describe, expect, it } from 'vitest'
import { renderPlusBid } from '../src/plus-bid'
import type { Card } from '../src/card'

const J_HEART: Card = { suit: '♥', rank: 'J' }
const A_DIAMOND: Card = { suit: '♦', rank: 'A' }

describe('renderPlusBid', () => {
  it('returns exactly 3 lines (N, W↔upcard↔E, S)', () => {
    const out = renderPlusBid({ upCard: J_HEART })
    expect(out.length).toBe(3)
  })

  it('line 0 is the N row, letter-anchored', () => {
    const out = renderPlusBid({ upCard: J_HEART })
    expect(out[0]!.trim()).toBe('N')
  })

  it('line 1 has W on left, [upcard] centered, E on right', () => {
    const out = renderPlusBid({ upCard: J_HEART })
    expect(out[1]).toMatch(/^W\b/)
    expect(out[1]).toContain('[J♥]')
    expect(out[1]).toMatch(/E\s*$/) // E at the right edge
  })

  it('line 2 is the S row, letter-anchored', () => {
    const out = renderPlusBid({ upCard: J_HEART })
    expect(out[2]!.trim()).toBe('S')
  })

  it('renders upcard with diamond as ◆ (G2 font workaround)', () => {
    const out = renderPlusBid({ upCard: A_DIAMOND })
    expect(out[1]).toContain('[A◆]')
    expect(out[1]).not.toContain('[A♦]')
  })

  it('appends markers via getMarker', () => {
    const out = renderPlusBid({
      upCard: J_HEART,
      getMarker: pos => {
        if (pos === 'S') return 'me'
        if (pos === 'W') return 'D'
        if (pos === 'E') return '▶'
        return ''
      },
    })
    expect(out[0]!.trim()).toBe('N')
    expect(out[1]).toContain('W(D)')
    expect(out[1]).toContain('E(▶)')
    expect(out[2]).toContain('S(me)')
  })

  it('N and S letter positions are vertically aligned regardless of marker width', () => {
    // The whole point of letter-anchored centering: long marker on N
    // shouldn't shift the N letter relative to S.
    const out = renderPlusBid({
      upCard: J_HEART,
      getMarker: pos => {
        if (pos === 'N') return 'D,▶'   // long marker
        if (pos === 'S') return 'me'    // shorter marker
        return ''
      },
    })
    // Find the column index of N and S letters.
    const nCol = out[0]!.indexOf('N')
    const sCol = out[2]!.indexOf('S')
    expect(nCol).toBe(sCol)
  })

  it('stacks multiple markers comma-separated', () => {
    const out = renderPlusBid({
      upCard: J_HEART,
      getMarker: pos => pos === 'S' ? 'me,D,▶' : '',
    })
    expect(out[2]).toContain('S(me,D,▶)')
  })
})
