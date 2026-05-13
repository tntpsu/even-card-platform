// Card primitives. The four suits use their canonical Unicode chars as
// the discriminator type (♠ ♥ ♦ ♣). For display, the BLACK DIAMOND
// substitute (◆ U+25C6) replaces U+2666 because the latter has advW=0
// in the G2 firmware font and renders as a blank cell. See STYLE.md § 1.5.

export const SUITS = ['♠', '♥', '♦', '♣'] as const
export type Suit = typeof SUITS[number]

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const
export type Rank = typeof RANKS[number]

export interface Card {
  suit: Suit
  rank: Rank
}

/** Display glyph for each suit. ♦ becomes ◆ for G2 firmware. */
export const SUIT_GLYPH: Record<Suit, string> = {
  '♠': '♠',
  '♥': '♥',
  '♦': '◆',
  '♣': '♣',
}

/** "7♠", "10♥", "A◆" — the canonical card string for glasses display. */
export function renderCard(c: Card): string {
  return `${c.rank}${SUIT_GLYPH[c.suit]}`
}

/** "AS", "10H" — compact letter form for storage / logs. Never displayed. */
export function cardKey(c: Card): string {
  return `${c.rank}${c.suit}`
}

/** Strict rank ordering. 2 → 2, J → 11, Q → 12, K → 13, A → 14. */
export function rankValue(r: Rank): number {
  return RANKS.indexOf(r) + 2
}

/** Same-card test (used in legal-play checks, set operations). */
export function cardEq(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank
}
