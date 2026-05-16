// Public surface for the platform.
//
// v0.1: types only. Primitives (Deck, hand-row, plus-trick) and chrome
// (launcher, frame composition) land as Phase A progresses.
//
// See ../STYLE.md for the visual + interaction contract every consumer
// of this package agrees to.

export type {
  Game, GameCategory, GameHandle, GameStorage,
  GlassesFrame, GlassesGesture,
  PhoneEvent, PlatformContext,
  Difficulty,
} from './types'

export { SUITS, RANKS, SUIT_GLYPH, renderCard, cardKey, rankValue, cardEq } from './card'
export type { Card, Suit, Rank } from './card'

export { freshDeck, deckFromRanks, shuffle, deal, drawTop } from './deck'

export { renderHandRow } from './hand-row'
export type { HandRowOptions } from './hand-row'

export { renderHand, sortBySuit, rowFitsDisplay, DISPLAY_WIDTH_PX } from './hand'
export type { HandOptions } from './hand'

export { renderPlusTrick } from './plus-trick'
export type { Position, PlusTrickPlay, PlusTrickOptions } from './plus-trick'

export { renderPlusBid } from './plus-bid'
export type { PlusBidOptions } from './plus-bid'

export { composeGlassesFrame } from './frame'
export type { ComposeOpts } from './frame'

export { makeGameStorage, makePlatformStorage } from './storage'
export type { BridgeStorageRuntime } from './storage'

export { Launcher } from './launcher'
export type { LauncherOpts, LauncherAction } from './launcher'

export { Runtime } from './runtime'
export type { RuntimeOpts } from './runtime'
