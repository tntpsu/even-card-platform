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
