import { describe, expect, it } from 'vitest'
import { composeGlassesFrame } from '../src/frame'
import type { GlassesFrame } from '../src/types'

const FRAME: GlassesFrame = {
  score: 'US 0-0 THEM',
  body: ['Trump ♠', '       N: 7♥', 'W: J♠         E: -', '       S(me): A♥'],
  controlHint: '[swipe] sel  [tap] play',
}

describe('composeGlassesFrame', () => {
  it('uppercases the game name in the header', () => {
    const out = composeGlassesFrame({ gameName: 'Hearts', frame: FRAME })
    const [header] = out.split('\n')
    expect(header).toMatch(/^HEARTS/)
  })

  it('puts the score on the same line as the header', () => {
    const out = composeGlassesFrame({ gameName: 'Hearts', frame: FRAME })
    const [header] = out.split('\n')
    expect(header).toContain('HEARTS')
    expect(header).toContain('US 0-0 THEME'.slice(0, -1))  // contains "US 0-0 THEM"
  })

  it('emits the body lines in order, after the header', () => {
    const out = composeGlassesFrame({ gameName: 'Hearts', frame: FRAME })
    const lines = out.split('\n')
    expect(lines[1]).toContain('Trump')
    expect(lines[2]).toContain('N: 7♥')
    expect(lines[3]).toContain('E: -')
    expect(lines[4]).toContain('S(me): A♥')
  })

  it('emits the controlHint as the last line', () => {
    const out = composeGlassesFrame({ gameName: 'Hearts', frame: FRAME })
    const lines = out.split('\n')
    expect(lines.at(-1)).toBe('[swipe] sel  [tap] play')
  })

  it('separates body from footer with a blank line', () => {
    const out = composeGlassesFrame({ gameName: 'Hearts', frame: FRAME })
    const lines = out.split('\n')
    expect(lines.at(-2)).toBe('')
  })

  it('appends a banner at the end of the body, before the footer', () => {
    const out = composeGlassesFrame({
      gameName: 'Hearts',
      frame: { ...FRAME, banner: '*** YOU WIN ***' },
    })
    expect(out).toContain('*** YOU WIN ***')
    const lines = out.split('\n')
    // Banner appears AFTER body lines, BEFORE the footer line
    const bannerIdx = lines.findIndex(l => l.includes('*** YOU WIN ***'))
    const footerIdx = lines.findIndex(l => l === '[swipe] sel  [tap] play')
    expect(bannerIdx).toBeLessThan(footerIdx)
  })

  it('overlay=exit-to-menu replaces body with the menu prompt', () => {
    const out = composeGlassesFrame({
      gameName: 'Hearts',
      frame: FRAME,
      overlay: { kind: 'exit-to-menu' },
    })
    expect(out).toContain('EXIT TO MENU?')
    expect(out).not.toContain('Trump')   // original body suppressed
    expect(out).toContain('Swipe down again to confirm')
  })

  it('overlay=quit-app replaces body with the quit prompt', () => {
    const out = composeGlassesFrame({
      gameName: 'Hearts',
      frame: FRAME,
      overlay: { kind: 'quit-app' },
    })
    expect(out).toContain('QUIT APP?')
    expect(out).not.toContain('Trump')
  })

  it('overlay footer is the confirm hint, not the game controlHint', () => {
    const out = composeGlassesFrame({
      gameName: 'Hearts',
      frame: FRAME,
      overlay: { kind: 'exit-to-menu' },
    })
    expect(out).toContain('[swipe↓] confirm')
    expect(out).not.toContain('[swipe] sel  [tap] play')
  })
})
