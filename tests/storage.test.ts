import { describe, expect, it } from 'vitest'
import { makeGameStorage, makePlatformStorage } from '../src/storage'
import type { BridgeStorageRuntime } from '../src/storage'

/** In-memory bridge stand-in so we can assert what got written under what key. */
function memBridge(): BridgeStorageRuntime & { store: Map<string, string> } {
  const store = new Map<string, string>()
  return {
    store,
    async getStorage(key) { return store.get(key) ?? null },
    async setStorage(key, value) { store.set(key, value) },
  }
}

describe('makeGameStorage', () => {
  it('returns fallback when nothing stored', async () => {
    const s = makeGameStorage(null, 'hearts')
    expect(await s.get('foo', 'default')).toBe('default')
    expect(await s.get('foo', 42)).toBe(42)
  })

  it('set then get round-trips JSON', async () => {
    const s = makeGameStorage(null, 'hearts')
    await s.set('settings', { difficulty: 'hard', target: 100 })
    expect(await s.get('settings', null)).toEqual({ difficulty: 'hard', target: 100 })
  })

  it('namespaces keys as pack:<gameId>:<key>', async () => {
    const b = memBridge()
    const s = makeGameStorage(b, 'hearts')
    await s.set('score', 42)
    expect(b.store.has('pack:hearts:score')).toBe(true)
    expect(b.store.get('pack:hearts:score')).toBe('42')
  })

  it('different gameIds are isolated', async () => {
    const b = memBridge()
    const hearts = makeGameStorage(b, 'hearts')
    const spades = makeGameStorage(b, 'spades')
    await hearts.set('score', 'H')
    await spades.set('score', 'S')
    expect(await hearts.get('score', null)).toBe('H')
    expect(await spades.get('score', null)).toBe('S')
    expect(b.store.get('pack:hearts:score')).toBe('"H"')
    expect(b.store.get('pack:spades:score')).toBe('"S"')
  })

  it('remove clears the value', async () => {
    const s = makeGameStorage(null, 'hearts')
    await s.set('foo', 'bar')
    expect(await s.get('foo', null)).toBe('bar')
    await s.remove('foo')
    expect(await s.get('foo', 'fallback')).toBe('fallback')
  })

  it('falls back to memory when bridge is null', async () => {
    const s = makeGameStorage(null, 'hearts')
    await s.set('foo', 'bar')
    // No bridge means no real persistence — but within this process, get works.
    expect(await s.get('foo', null)).toBe('bar')
  })

  it('survives bridge throwing on get/set (returns fallback / no-op)', async () => {
    const broken: BridgeStorageRuntime = {
      async getStorage() { throw new Error('boom') },
      async setStorage() { throw new Error('boom') },
    }
    const s = makeGameStorage(broken, 'hearts')
    await s.set('foo', 'bar')   // doesn't throw
    expect(await s.get('foo', 'fallback')).toBe('fallback')   // throws caught, fallback returned
  })
})

describe('makePlatformStorage', () => {
  it('namespaces under `pack:` without a game id', async () => {
    const b = memBridge()
    const s = makePlatformStorage(b)
    await s.set('lastPlayed', 'hearts')
    expect(b.store.get('pack:lastPlayed')).toBe('"hearts"')
  })
})
