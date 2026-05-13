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
// Note: STYLE.md § 2 reserves consecutive swipe-down for the platform's
// exit prompt. Games will not see swipe-down events.

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
}

export interface GameHandle {
  render(): GlassesFrame
  handleGlassesInput(ev: GlassesGesture): void
  handlePhoneEvent(ev: PhoneEvent): void
  /** Called when the platform tears down the game. */
  destroy(): void
  /** Optional: markdown rules text for the "How to play" disclosure. */
  renderPhoneRules?(): string
  /** Optional: per-game settings HTML. */
  renderPhoneSettings?(): string
}
