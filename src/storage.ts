// Per-game persistent storage, backed by the SDK bridge's KV
// (`bridge.setLocalStorage` / `getLocalStorage`) when connected, with an
// in-memory fallback for browser preview and tests.
//
// Key namespacing: `pack:<gameId>:<key>`. The `pack:` prefix is shared
// across CardPack and HouseGames so platform-level keys (e.g. launcher
// last-played) sit alongside game keys. Game ids should be unique
// across both packs — `hearts`, `blackjack`, etc.

import type { GameStorage } from './types'

/** Minimum interface the platform needs from the host bridge. */
export interface BridgeStorageRuntime {
  getStorage(key: string): Promise<string | null>
  setStorage(key: string, value: string): Promise<void>
}

const PREFIX = 'pack'

/** Per-game storage, namespaced and JSON-serializing. */
export function makeGameStorage(
  bridge: BridgeStorageRuntime | null,
  gameId: string,
): GameStorage {
  return makeStorage(bridge, `${PREFIX}:${gameId}`)
}

/** Platform-level storage (launcher state, universal settings). */
export function makePlatformStorage(
  bridge: BridgeStorageRuntime | null,
): GameStorage {
  return makeStorage(bridge, PREFIX)
}

function makeStorage(
  bridge: BridgeStorageRuntime | null,
  scope: string,
): GameStorage {
  const mem = new Map<string, string>()

  const fullKey = (key: string): string => `${scope}:${key}`

  const rawGet = async (key: string): Promise<string> => {
    const k = fullKey(key)
    if (bridge) {
      try { return (await bridge.getStorage(k)) ?? '' } catch { return '' }
    }
    return mem.get(k) ?? ''
  }

  const rawSet = async (key: string, value: string): Promise<void> => {
    const k = fullKey(key)
    if (bridge) {
      try { await bridge.setStorage(k, value) } catch { /* ignore */ }
      return
    }
    mem.set(k, value)
  }

  return {
    async get<T>(key: string, fallback: T): Promise<T> {
      const raw = (await rawGet(key)).trim()
      if (!raw) return fallback
      try { return JSON.parse(raw) as T } catch { return fallback }
    },
    async set(key: string, value: unknown): Promise<void> {
      await rawSet(key, JSON.stringify(value))
    },
    async remove(key: string): Promise<void> {
      await rawSet(key, '')
    },
  }
}
