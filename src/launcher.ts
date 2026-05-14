// Launcher — the platform's game selection screen, shown when no game
// is active. Implemented as a GameHandle-shaped object so it slots
// into the runtime's render/gesture pipeline without special-case code.
//
// Gesture model per STYLE.md § 2:
//   swipe up    cursor up (wraps at top)
//   swipe down  cursor down (wraps at bottom)
//   tap         launch the cursored game
//   double-tap  unused (reserved)

import type { Game, GameStorage, GlassesFrame, GlassesGesture } from './types'

const LAST_PLAYED_KEY = 'lastPlayed'

export type LauncherAction =
  | { kind: 'noop' }
  | { kind: 'launch'; gameId: string }

export interface LauncherOpts {
  games: readonly Game[]
  storage: GameStorage         // platform-level (makePlatformStorage)
  /** Pack display name, e.g. 'CARD PACK' or 'HOUSE GAMES'. */
  packName: string
}

export class Launcher {
  private readonly games: readonly Game[]
  private readonly storage: GameStorage
  private readonly packName: string
  private cursor = 0
  private lastPlayedId: string | null = null

  constructor(opts: LauncherOpts) {
    this.games = opts.games
    this.storage = opts.storage
    this.packName = opts.packName
  }

  /** Load last-played from storage and seed the cursor on it. */
  async init(): Promise<void> {
    this.lastPlayedId = await this.storage.get<string | null>(LAST_PLAYED_KEY, null)
    if (this.lastPlayedId) {
      const idx = this.games.findIndex(g => g.id === this.lastPlayedId)
      if (idx >= 0) this.cursor = idx
    }
  }

  render(): GlassesFrame {
    const lines = this.games.map((g, i) => {
      const arrow = i === this.cursor ? '▶' : ' '
      const lastTag = g.id === this.lastPlayedId && i !== this.cursor ? '  (last)' : ''
      return `${arrow} ${g.glyph} ${g.name}${lastTag}`
    })
    return {
      score: `${this.games.length} GAMES`,
      body: lines,
      controlHint: '[swipe] choose  [tap] play',
    }
  }

  handleGesture(g: GlassesGesture): LauncherAction {
    const n = this.games.length
    if (n === 0) return { kind: 'noop' }
    switch (g.kind) {
      case 'swipe-up':
        this.cursor = (this.cursor - 1 + n) % n
        return { kind: 'noop' }
      case 'swipe-down':
        this.cursor = (this.cursor + 1) % n
        return { kind: 'noop' }
      case 'tap': {
        const game = this.games[this.cursor]!
        return { kind: 'launch', gameId: game.id }
      }
      case 'double-tap':
        return { kind: 'noop' }
    }
  }

  /** Called by the runtime after a successful launch so next boot opens
   *  the same game's row pre-cursored. */
  async commitLaunch(gameId: string): Promise<void> {
    await this.storage.set(LAST_PLAYED_KEY, gameId)
    this.lastPlayedId = gameId
  }

  /** For phone-side rendering or debug. */
  cursorIndex(): number { return this.cursor }
  cursoredGame(): Game | null { return this.games[this.cursor] ?? null }
  getPackName(): string { return this.packName }
}
