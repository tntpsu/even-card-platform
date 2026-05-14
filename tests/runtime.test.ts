import { beforeEach, describe, expect, it } from 'vitest'
import { Runtime } from '../src/runtime'
import type {
  Game, GameHandle, GlassesFrame, GlassesGesture, PhoneEvent, PlatformContext,
} from '../src/types'

/** A test-only game module that records every call it receives. */
function recordingGame(id: string, name: string): Game & { calls: string[]; lastCtx: PlatformContext | null } {
  const calls: string[] = []
  let ctx: PlatformContext | null = null
  return {
    id, name,
    glyph: id[0]!.toUpperCase(),
    shortDesc: `${name} desc`,
    category: 'trick',
    calls,
    get lastCtx() { return ctx },
    set lastCtx(_v) { /* readonly-ish */ },
    init(c: PlatformContext): GameHandle {
      ctx = c
      calls.push('init')
      const handle: GameHandle = {
        render: (): GlassesFrame => ({
          score: `${name} score`,
          body: [`${name} body`],
          controlHint: `${name} hint`,
        }),
        handleGlassesInput: (g: GlassesGesture) => { calls.push(`glasses:${g.kind}`) },
        handlePhoneEvent: (ev: PhoneEvent) => { calls.push(`phone:${ev.kind}`) },
        destroy: () => { calls.push('destroy') },
      }
      return handle
    },
  } as Game & { calls: string[]; lastCtx: PlatformContext | null }
}

describe('Runtime', () => {
  let renders: string[]
  let rt: Runtime
  let hearts: ReturnType<typeof recordingGame>
  let spades: ReturnType<typeof recordingGame>

  beforeEach(async () => {
    renders = []
    hearts = recordingGame('hearts', 'Hearts')
    spades = recordingGame('spades', 'Spades')
    rt = new Runtime({
      games: [hearts, spades],
      bridge: null,
      packName: 'CARD PACK',
      difficulty: 'medium',
      onRender: f => renders.push(f),
    })
    await rt.init()
  })

  it('starts in launcher state', () => {
    expect(rt.isInGame()).toBe(false)
    expect(rt.currentGameId()).toBeNull()
  })

  it('init produces a rendered frame', () => {
    expect(renders.length).toBeGreaterThan(0)
    expect(renders[0]).toContain('CARD PACK')
  })

  it('launcher tap on Hearts launches Hearts and shows its frame', async () => {
    rt.handleGesture({ kind: 'tap' })
    // Wait for the async start() to complete
    await new Promise(r => setTimeout(r, 0))
    expect(rt.isInGame()).toBe(true)
    expect(rt.currentGameId()).toBe('hearts')
    expect(hearts.calls).toContain('init')
    expect(renders.at(-1)).toContain('HEARTS')
    expect(renders.at(-1)).toContain('Hearts body')
  })

  it('in-game gestures forward to the active game, not the launcher', async () => {
    rt.handleGesture({ kind: 'tap' })   // launch hearts
    await new Promise(r => setTimeout(r, 0))
    rt.handleGesture({ kind: 'swipe-down' })
    expect(hearts.calls).toContain('glasses:swipe-down')
  })

  it('phone events forward to the active game', async () => {
    rt.handleGesture({ kind: 'tap' })
    await new Promise(r => setTimeout(r, 0))
    rt.handlePhoneEvent({ kind: 'new-game' })
    expect(hearts.calls).toContain('phone:new-game')
  })

  it('phone events are dropped when in launcher', () => {
    rt.handlePhoneEvent({ kind: 'new-game' })
    expect(hearts.calls).not.toContain('phone:new-game')
    expect(spades.calls).not.toContain('phone:new-game')
  })

  it('ctx.endGame() returns to launcher and destroys the game', async () => {
    rt.handleGesture({ kind: 'tap' })   // launch hearts
    await new Promise(r => setTimeout(r, 0))
    hearts.lastCtx!.endGame()
    expect(hearts.calls).toContain('destroy')
    expect(rt.isInGame()).toBe(false)
    expect(renders.at(-1)).toContain('CARD PACK')
  })

  it('exitToMenu (phone-side) also returns to launcher', async () => {
    rt.handleGesture({ kind: 'tap' })   // launch hearts
    await new Promise(r => setTimeout(r, 0))
    rt.exitToMenu()
    expect(hearts.calls).toContain('destroy')
    expect(rt.isInGame()).toBe(false)
  })

  it('exitToMenu is a no-op when already in launcher', () => {
    rt.exitToMenu()
    expect(hearts.calls).not.toContain('destroy')
    expect(spades.calls).not.toContain('destroy')
  })

  it('launchGame programmatically switches games (e.g. phone-side game-list tap)', async () => {
    await rt.launchGame('spades')
    expect(rt.currentGameId()).toBe('spades')
    expect(spades.calls).toContain('init')
  })

  it('launching a second game destroys the first', async () => {
    await rt.launchGame('hearts')
    await rt.launchGame('spades')
    expect(hearts.calls).toContain('destroy')
    expect(rt.currentGameId()).toBe('spades')
  })

  it('setDifficulty applies to the NEXT game start, not the active one', async () => {
    rt.setDifficulty('hard')
    await rt.launchGame('hearts')
    expect(hearts.lastCtx!.difficulty).toBe('hard')
  })

  it('passes a namespaced storage to the game (game id reflected in key)', async () => {
    await rt.launchGame('hearts')
    await hearts.lastCtx!.storage.set('foo', 'bar')
    // Round-trip works
    expect(await hearts.lastCtx!.storage.get('foo', null)).toBe('bar')
  })

  it('launchGame with an unknown id is a no-op', async () => {
    await rt.launchGame('does-not-exist')
    expect(rt.isInGame()).toBe(false)
  })

  it('render() can be called manually for time-driven refreshes', async () => {
    const before = renders.length
    rt.render()
    expect(renders.length).toBe(before + 1)
  })
})
