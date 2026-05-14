// Runtime orchestrator. Owns the Launcher + the currently active game,
// dispatches gestures to whichever is active, and swaps between them on
// launch / end-game events.
//
// The runtime is bridge-agnostic — it doesn't know about
// textContainerUpgrade or audioControl or the SDK shape. The consumer
// (CardPack/HouseGames main.ts) wires gestures IN via handleGesture()
// and renders OUT via the onRender callback. This keeps the platform
// testable in plain Node + lets each pack do its own bridge plumbing.

import { composeGlassesFrame } from './frame'
import { Launcher } from './launcher'
import { makeGameStorage } from './storage'
import type { BridgeStorageRuntime } from './storage'
import type {
  Difficulty, Game, GameHandle, GlassesGesture, PhoneEvent, PlatformContext,
} from './types'

export interface RuntimeOpts {
  games: readonly Game[]
  /** Bridge KV runtime, or null for in-memory (browser preview / tests). */
  bridge: BridgeStorageRuntime | null
  /** Pack name in the launcher header, e.g. 'CARD PACK'. */
  packName: string
  /** Initial difficulty applied to every game's PlatformContext. */
  difficulty?: Difficulty
  /** Called every time the composed glasses string should be displayed. */
  onRender: (composedFrame: string) => void
}

export class Runtime {
  private readonly games: readonly Game[]
  private readonly bridge: BridgeStorageRuntime | null
  private readonly packName: string
  private readonly onRender: (frame: string) => void
  private difficulty: Difficulty
  private launcher: Launcher
  private current: GameHandle | null = null
  private currentDef: Game | null = null

  constructor(opts: RuntimeOpts) {
    this.games = opts.games
    this.bridge = opts.bridge
    this.packName = opts.packName
    this.onRender = opts.onRender
    this.difficulty = opts.difficulty ?? 'medium'
    this.launcher = new Launcher({
      games: this.games,
      storage: makeGameStorage(this.bridge, '__platform__'),
      packName: this.packName,
    })
  }

  /** Load persisted state (last-played) and render the launcher. */
  async init(): Promise<void> {
    await this.launcher.init()
    this.render()
  }

  /** Route a glasses gesture to the active game, or to the launcher. */
  handleGesture(g: GlassesGesture): void {
    if (this.current) {
      this.current.handleGlassesInput(g)
      this.render()
      return
    }
    const action = this.launcher.handleGesture(g)
    if (action.kind === 'launch') {
      void this.start(action.gameId)
      return  // start() renders
    }
    this.render()
  }

  /** Forward a phone event to the active game (no-op when in launcher). */
  handlePhoneEvent(ev: PhoneEvent): void {
    if (this.current) {
      this.current.handlePhoneEvent(ev)
      this.render()
    }
  }

  /** Phone-side "End game" button → back to launcher. */
  exitToMenu(): void {
    if (!this.current) return
    this.current.destroy()
    this.current = null
    this.currentDef = null
    this.render()
  }

  /** Phone-side difficulty change. Applies to the NEXT game start; the
   *  active game keeps the difficulty it was created with. */
  setDifficulty(d: Difficulty): void {
    this.difficulty = d
  }

  /** Programmatic launch — used by phone-side game-list tap, not via
   *  the glasses launcher. Same teardown semantics as the launcher path. */
  async launchGame(gameId: string): Promise<void> {
    return this.start(gameId)
  }

  /** True if a game is currently active (false in launcher). */
  isInGame(): boolean { return this.current !== null }

  /** Current game's id (or null if in launcher). Useful for phone-side
   *  panels that mirror the glasses state. */
  currentGameId(): string | null { return this.currentDef?.id ?? null }

  /** Manual render, e.g. for the consumer's auto-tick interval that
   *  refreshes time-based displays (Solitaire's TIME field). */
  render(): void {
    if (this.current && this.currentDef) {
      const frame = this.current.render()
      this.onRender(composeGlassesFrame({
        gameName: this.currentDef.name,
        frame,
      }))
    } else {
      this.onRender(composeGlassesFrame({
        gameName: this.packName,
        frame: this.launcher.render(),
      }))
    }
  }

  private async start(gameId: string): Promise<void> {
    const def = this.games.find(g => g.id === gameId)
    if (!def) return
    // Tear down any existing game first (defensive — shouldn't happen
    // via the launcher path, but the programmatic launchGame might).
    if (this.current) {
      this.current.destroy()
      this.current = null
      this.currentDef = null
    }
    const ctx: PlatformContext = {
      storage: makeGameStorage(this.bridge, def.id),
      difficulty: this.difficulty,
      endGame: () => { this.exitToMenu() },
      requestRender: () => { this.render() },
    }
    this.currentDef = def
    this.current = def.init(ctx)
    await this.launcher.commitLaunch(gameId)
    this.render()
  }
}
