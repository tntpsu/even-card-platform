# even-card-platform

Shared platform — chrome, launcher, card primitives, style guide — for Even Realities G2 card-game packs.

> **Status:** v0.1.0 — types + style guide only. Primitives and chrome land as Phase A of the Card Pack build progresses. Not on npm; consumed via `file:../even-card-platform` from sibling repos.

## What this is

The Even Hub card-games experience is structured as two packs:
- **[Card Pack](https://github.com/tntpsu/CardPack)** — Hearts, Spades, Euchre, Solitaire, Crazy Eights, Cribbage, Gin Rummy
- **[House Games](https://github.com/tntpsu/HouseGames)** — Blackjack, Video Poker, Three Card Poker, Roulette

Both packs depend on this platform. It owns:

- The **launcher** (game selection screen on glasses + on phone)
- The **frame composition** (header, body, footer — see `STYLE.md`)
- **Shared primitives**: Card, Suit, Deck, suit glyphs, hand-row renderer, plus-sign trick layout
- **The style guide** (`STYLE.md`) — the contract every game module obeys so the two packs feel like one product

## STYLE.md is the load-bearing artifact

If you only read one file in this repo, read [`STYLE.md`](./STYLE.md). It codifies:

- The glasses frame anatomy (header / body / footer)
- Score formats per game category
- Suit glyph conventions (and the BLACK DIAMOND substitute for the G2 firmware)
- Card notation, player markers, end-of-hand banners
- The gesture model (and which gestures the platform reserves)
- Phone WebView template (with the `overflow-x: hidden` fix baked in)
- Tone — sentence case, no exclamation points on glasses, no emoji except suits

If a future game wants to violate the style guide, that's a request to amend the guide — not a private exception in the game's render code.

## Game module contract

Every game implements:

```ts
interface Game {
  id: string
  name: string
  shortDesc: string
  category: 'trick' | 'shed' | 'pegging' | 'patience' | 'casino-card' | 'casino-wheel'
  glyph: string                          // single char, e.g. '♥'
  init(ctx: PlatformContext): GameHandle
}
```

The platform composes the header (game name + score) and footer (control hint) around the game's body. Games never render their own header/footer.

See [`src/types.ts`](./src/types.ts) for the full interface.

## Consume from a pack

```jsonc
// CardPack/package.json
{
  "dependencies": {
    "even-card-platform": "file:../even-card-platform"
  }
}
```

```ts
import type { Game, PlatformContext } from 'even-card-platform'
```

## License

MIT.
