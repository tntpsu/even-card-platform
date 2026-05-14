import { beforeEach, describe, expect, it } from 'vitest'
import { Launcher } from '../src/launcher'
import { makePlatformStorage } from '../src/storage'
import type { BridgeStorageRuntime } from '../src/storage'
import type { Game, GameHandle, PlatformContext } from '../src/types'

function fakeGame(id: string, name: string, glyph: string): Game {
  return {
    id, name, glyph,
    shortDesc: `${name} desc`,
    category: 'trick',
    init: (_ctx: PlatformContext): GameHandle => ({
      render: () => ({ score: '', body: [], controlHint: '' }),
      handleGlassesInput: () => {},
      handlePhoneEvent: () => {},
      destroy: () => {},
    }),
  }
}

function memBridge(): BridgeStorageRuntime & { store: Map<string, string> } {
  const store = new Map<string, string>()
  return {
    store,
    async getStorage(key) { return store.get(key) ?? null },
    async setStorage(key, value) { store.set(key, value) },
  }
}

const HEARTS = fakeGame('hearts', 'Hearts', '♥')
const SPADES = fakeGame('spades', 'Spades', '♠')
const EUCHRE = fakeGame('euchre', 'Euchre', '◆')

describe('Launcher', () => {
  let launcher: Launcher
  beforeEach(() => {
    launcher = new Launcher({
      games: [HEARTS, SPADES, EUCHRE],
      storage: makePlatformStorage(null),
      packName: 'CARD PACK',
    })
  })

  it('starts at cursor 0 when no last-played is stored', async () => {
    await launcher.init()
    expect(launcher.cursorIndex()).toBe(0)
  })

  it('seeds cursor from last-played at init', async () => {
    const bridge = memBridge()
    const storage = makePlatformStorage(bridge)
    await storage.set('lastPlayed', 'spades')
    const l = new Launcher({ games: [HEARTS, SPADES, EUCHRE], storage, packName: 'CARD PACK' })
    await l.init()
    expect(l.cursorIndex()).toBe(1)
  })

  it('swipe-down advances cursor', async () => {
    await launcher.init()
    launcher.handleGesture({ kind: 'swipe-down' })
    expect(launcher.cursorIndex()).toBe(1)
    launcher.handleGesture({ kind: 'swipe-down' })
    expect(launcher.cursorIndex()).toBe(2)
  })

  it('swipe-up retreats cursor', async () => {
    await launcher.init()
    launcher.handleGesture({ kind: 'swipe-down' })   // 0 → 1
    launcher.handleGesture({ kind: 'swipe-up' })     // 1 → 0
    expect(launcher.cursorIndex()).toBe(0)
  })

  it('cursor wraps around at top and bottom', async () => {
    await launcher.init()
    launcher.handleGesture({ kind: 'swipe-up' })       // 0 → 2 (wrap)
    expect(launcher.cursorIndex()).toBe(2)
    launcher.handleGesture({ kind: 'swipe-down' })     // 2 → 0 (wrap)
    expect(launcher.cursorIndex()).toBe(0)
  })

  it('tap returns a launch action for the cursored game', async () => {
    await launcher.init()
    launcher.handleGesture({ kind: 'swipe-down' })     // → spades
    const act = launcher.handleGesture({ kind: 'tap' })
    expect(act).toEqual({ kind: 'launch', gameId: 'spades' })
  })

  it('double-tap is a no-op', async () => {
    await launcher.init()
    expect(launcher.handleGesture({ kind: 'double-tap' })).toEqual({ kind: 'noop' })
  })

  it('render emits ▶ next to the cursored game and a space next to others', async () => {
    await launcher.init()
    launcher.handleGesture({ kind: 'swipe-down' })     // cursor on spades (idx 1)
    const frame = launcher.render()
    const heartsLine = frame.body[0]!
    const spadesLine = frame.body[1]!
    expect(heartsLine.startsWith('▶')).toBe(false)
    expect(spadesLine.startsWith('▶')).toBe(true)
  })

  it('render tags the previously-played game with (last) when not cursored', async () => {
    const bridge = memBridge()
    const storage = makePlatformStorage(bridge)
    await storage.set('lastPlayed', 'euchre')
    const l = new Launcher({ games: [HEARTS, SPADES, EUCHRE], storage, packName: 'CARD PACK' })
    await l.init()
    // Cursor is on euchre (the last-played), so no (last) tag.
    let frame = l.render()
    expect(frame.body[2]).not.toContain('(last)')

    // Move cursor away — now euchre should be tagged.
    l.handleGesture({ kind: 'swipe-down' })   // 2 → 0
    frame = l.render()
    expect(frame.body[2]).toContain('(last)')
  })

  it('commitLaunch persists last-played to storage', async () => {
    const bridge = memBridge()
    const storage = makePlatformStorage(bridge)
    const l = new Launcher({ games: [HEARTS, SPADES, EUCHRE], storage, packName: 'CARD PACK' })
    await l.init()
    await l.commitLaunch('euchre')
    expect(bridge.store.get('pack:lastPlayed')).toBe('"euchre"')
  })

  it('score string reflects game count', async () => {
    await launcher.init()
    expect(launcher.render().score).toBe('3 GAMES')
  })

  it('handles empty game list without crashing', () => {
    const l = new Launcher({
      games: [],
      storage: makePlatformStorage(null),
      packName: 'CARD PACK',
    })
    // No init needed for empty case.
    expect(l.handleGesture({ kind: 'swipe-down' })).toEqual({ kind: 'noop' })
    expect(l.handleGesture({ kind: 'tap' })).toEqual({ kind: 'noop' })
    expect(l.render().body).toEqual([])
  })
})
