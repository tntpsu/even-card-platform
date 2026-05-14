// Public types for game modules and the platform that hosts them.
// Contract surface — see ../STYLE.md § 4 for the canonical description.

export type GameCategory =
  | 'trick'         // Hearts, Spades, Euchre
  | 'shed'          // Crazy Eights, Gin Rummy
  | 'pegging'       // Cribbage
  | 'patience'      // Solitaire
  | 'casino-card'   // Blackjack, Video Poker, Three Card Poker
  | 'casino-wheel'  // Roulette

export type GlassesGesture =
  | { kind: 'tap' }
  | { kind: 'double-tap' }
  | { kind: 'swipe-up' }
  | { kind: 'swipe-down' }
// Per STYLE.md § 2: games own the entire glasses gesture surface during
// play. The platform does not intercept any gesture mid-game. Exit-to-menu
// and quit-app are phone-side buttons, not glasses gestures.

export interface GlassesFrame {
  /** Score string per STYLE.md § 1.4. */
  score: string
  /** Up to 5 lines. Platform adds the header + blank + footer. */
  body: string[]
  /** Per STYLE.md § 1.2 — `[tap] X  [swipe] Y` etc. */
  controlHint: string
  /** Optional end-of-hand / end-of-game banner. */
  banner?: string
}

export interface PhoneEvent {
  kind: string
  payload?: unknown
}

/** Platform-provided context handed to every game's init(). */
export interface PlatformContext {
  /** Persistent KV scoped to this game. */
  storage: GameStorage
  /** Difficulty as set by the user; defaults to 'medium'. */
  difficulty: Difficulty
  /** Fire when the user has explicitly ended the game via in-game UI
   *  (not the platform's exit gesture). Triggers the end-of-game flow. */
  endGame(): void
  /** Ask the runtime to re-render. Use this when the game's state
   *  changes from inside an async tick (paced AI plays, trick-linger
   *  timeouts, animations) so the glasses display reflects it without
   *  waiting for the next gesture. */
  requestRender(): void
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface GameStorage {
  get<T>(key: string, fallback: T): Promise<T>
  set(key: string, value: unknown): Promise<void>
  remove(key: string): Promise<void>
}

export interface Game {
  /** Stable identifier — used in storage keys, never localized. */
  id: string
  /** Display name, sentence case ("Hearts", "Three Card Poker"). */
  name: string
  /** One-line description for launcher subtitle. */
  shortDesc: string
  category: GameCategory
  /** Single-char glyph for launcher + glasses header. Use suit glyphs
   *  where applicable; otherwise a recognizable letter or symbol. */
  glyph: string
  init(ctx: PlatformContext): GameHandle
  /** Optional: HTML for the phone-side "How to play" disclosure. Static
   *  (doesn't depend on game state) — that's why it lives on Game and
   *  not on GameHandle. Trusted markup; main.ts will innerHTML this. */
  renderPhoneRules?(): string
}

export interface GameHandle {
  render(): GlassesFrame
  handleGlassesInput(ev: GlassesGesture): void
  handlePhoneEvent(ev: PhoneEvent): void
  /** Called when the platform tears down the game. */
  destroy(): void
  /** Optional: per-game settings HTML. Lives on the handle (not the
   *  Game) because settings often reflect current state (e.g. active
   *  difficulty, target score for this match). */
  renderPhoneSettings?(): string
}
