// Deck operations. Pure functions over Card[] arrays. RNG is injectable
// so games can use seeded determinism for testing.

import type { Card, Rank } from './card'
import { RANKS, SUITS } from './card'

/** Standard 52-card deck, suit-major, low rank first. Not shuffled. */
export function freshDeck(): Card[] {
  const out: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) out.push({ suit, rank })
  }
  return out
}

/** Custom-rank deck. Euchre uses ['9','10','J','Q','K','A'] for a 24-card deck. */
export function deckFromRanks(ranks: readonly Rank[]): Card[] {
  const out: Card[] = []
  for (const suit of SUITS) {
    for (const rank of ranks) out.push({ suit, rank })
  }
  return out
}

/** Fisher-Yates in-place shuffle, returning a new array. Inject rng for tests. */
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]!
    out[i] = out[j]!
    out[j] = tmp
  }
  return out
}

/** Deal cards into `hands` piles of `cardsPerHand` each, in dealer order
 *  (one card at a time around the table). Returns the hands + remaining deck. */
export function deal(
  deck: readonly Card[],
  hands: number,
  cardsPerHand: number,
): { hands: Card[][]; rest: Card[] } {
  const out: Card[][] = Array.from({ length: hands }, () => [])
  const taken = hands * cardsPerHand
  for (let i = 0; i < taken; i++) {
    out[i % hands]!.push(deck[i]!)
  }
  return { hands: out, rest: deck.slice(taken) }
}

/** Take one card off the top. Used for stock/draw mechanics. */
export function drawTop(deck: readonly Card[]): { card: Card | null; rest: Card[] } {
  if (deck.length === 0) return { card: null, rest: [] }
  return { card: deck[0]!, rest: deck.slice(1) }
}
