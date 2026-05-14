# STYLE.md — Even Card Platform style guide

The contract every game module obeys so the two packs (`CardPack`, `HouseGames`) feel like one product.

> **If it's not in this doc, it's a per-game freedom. If it IS in this doc, no game gets to override it.**

## 0. Why

Without a written contract, "same feel" decays the moment the second game lands. The first game's quirks (score format, cursor style, footer wording) become precedents, the second game half-copies them with small differences, and by the fifth game there's no shared identity. This doc is the prophylactic.

## 1. Glasses display

### Frame anatomy

Every screen is composed of three parts. The **platform** owns the header and footer; the **game** owns only the body. This is enforced by the `GlassesFrame` interface — games return `{ body, controlHint, ... }`, not a raw string.

```
─────────────────────────────────────────────
  HEARTS              US 0-3 THEM        ← header (platform)
                                          ← blank
  S: 7♥ (led)                             ← body (game) — up to 5 lines
  W: 8♥
  N: J♥
  E: -                                    ← cursor / waiting
                                          ← blank
  [swipe] sel  [tap] play                 ← footer (platform-rendered from
                                                    game's controlHint)
─────────────────────────────────────────────
```

Total: 8–10 lines max. The G2 canvas is 576×288 px with a proportional firmware font; longer lines wrap or clip. Keep body lines ≤ 32 chars to be safe.

### Header

`<NAME>    <SCORE>` — always one line, uppercase game name, score right-aligned-ish (one or two visual spaces apart depending on length).

The score string format is per-game category (see § 1.4). The platform composes the header from the game's `name` field + a `score` string the game provides.

### Footer

Control hints, single line, using fixed notation:

| Token | Means |
|---|---|
| `[tap]` | single tap (ring or glasses) |
| `[2x]` | double-tap |
| `[swipe]` | swipe up or down (when meaning is "move cursor" or "cycle") |
| `[swipe↓]` | swipe down specifically |
| `[swipe↑]` | swipe up specifically |

Examples:
```
[swipe] sel  [tap] play
[tap] order up  [2x] pass
[swipe] cursor  [tap] hit  [2x] stand
```

Two-space separator between actions. No periods, no caps.

### Score formats (by category)

| Game category | Format | Example |
|---|---|---|
| **trick — partnership** (Spades, Euchre) | `US <ns>-<ew> THEM` | `US 13-7 THEM` |
| **trick — solo** (Hearts) | `S:<n> W:<n> N:<n> E:<n>` | `S:0 W:0 N:5 E:3` |
| **shed** (Crazy Eights, Gin Rummy) | `YOU <a>  THEM <b>` (single opponent) or `S:<a> W:<b> N:<c> E:<d>` | `YOU 32  THEM 41` |
| **pegging** (Cribbage) | `US <pts>  THEM <pts>  /<target>` | `US 89  THEM 76  /121` |
| **patience** (Solitaire) | `MOVES <n>  TIME <m:ss>` | `MOVES 47  TIME 3:12` |
| **casino-card** (Blackjack, Video Poker, Three Card Poker) | `YOU $<bal>  BET $<bet>` | `YOU $185  BET $25` |
| **casino-wheel** (Roulette) | `YOU $<bal>  BET $<total>` | `YOU $200  BET $15` |

Partnership games communicate teams through the score format alone (`US`/`THEM`). Solo-multiplayer games (Hearts) list per-player scores so the user can see opponents' standings at a glance — Hearts strategy depends on knowing who's at risk of shooting the moon.

Dollar signs without commas. No negative balances — a bankrupt bankroll resets after a "GAME OVER" banner.

### Suits

```
♠ — SPADES        BLACK SPADE SUIT (U+2660)
♥ — HEARTS        BLACK HEART SUIT (U+2665)
◆ — DIAMONDS      BLACK DIAMOND (U+25C6) — substitute for U+2666 which renders blank in the G2 firmware font
♣ — CLUBS         BLACK CLUB SUIT (U+2663)
```

All four glyphs measure 20 px in the firmware font, so a row of cards aligns regardless of suit. **Don't use letters (S/H/D/C) as a fallback.** Suit glyphs only.

### Cards in hands

A hand is rendered horizontally with a `▲` cursor on the next line under the active card. Pixel-centered using `@evenrealities/pretext` for proportional-font width measurement.

**Small hands (≤ 7 cards)** — single row, the original Euchre v0.3 pattern:

```
J♦  (Q♣)   Q♠   A♦   K♥        ← cards row
     ▲                          ← cursor row, centered under Q♣
```

**Large hands (> 7 cards, e.g. Hearts/Spades 13, Gin Rummy 10)** — split into two rows so the layout fits the 576 px G2 display. Cursor row appears immediately below the row containing the active card:

```
2♠ 5♠ 8♠ (J♠) A♠ 4♥ 9♥       ← row 1
              ▲                ← cursor row (only if cursor in row 1)
Q♥ 3♦ K♦ 4♣ 7♣ (J♣)           ← row 2
                                ← cursor row (only if cursor in row 2)
```

Total up to 4 lines. Empty cursor rows are omitted; the renderer's output is variable-length 1–4 lines depending on hand size + cursor position.

- **Legal play**: `7♠` (rank + suit, no decoration)
- **Illegal play right now** (e.g. must follow suit): `(7♠)` with literal parens
- **Selected via cursor**: indicated by the `▲` on the cursor row, not by decoration on the card itself

**Sort order (large hands)**. Hands of >7 cards must be sorted by suit (♠ ♥ ♦ ♣) then by rank ascending. The platform exports `sortBySuit(hand)` for this. Sorting makes the cursor traverse a predictable path (suit clusters) instead of the random deal order — without this, swipe-through-hand feels chaotic on Hearts/Spades.

Small hands (≤ 5 cards in Euchre) MAY remain unsorted — the random deal order is short enough not to feel chaotic, and sorting would mask the strategic significance of card order in some games. Sort by default for new games; opt out only with a documented reason.

**Platform exports**:
- `renderHand({ hand, cursorIdx, legal, maxPerRow? })` — auto single/multi-row. Default `maxPerRow = 7`.
- `sortBySuit(hand)` — canonical ♠♥♦♣ + rank-ascending order.
- `rowFitsDisplay(hand, legal?)` — diagnostic, returns true iff a single-row render fits 576 px.

The older `renderHandRow` (always single-row) is kept for the simple case where the game knows the hand is always small. New games should use `renderHand` unless they have a specific reason otherwise.

### Markers

Used to label position-relative or role-relative info:

```
(D)     dealer this hand
(M)     maker / declarer (called trump in Euchre; the one who took the bid in Spades)
(me)    you (player South)
(led)   led the current trick
```

Always parenthesized, always lowercase. Appear after the position label: `S (me)`, `N (D)`.

### Four-player trick layout

Trick-category games (Hearts, Spades, Euchre) render the active trick as a three-line plus-sign that mirrors a card table sitting in front of the player:

```
         N: <card>             ← partner (centered)
W: <card>          E: <card>   ← opponents (left + right)
         S: <card>             ← you (centered, always (me) marker)
```

The spatial pattern IS the message:
- **Partner is across the canvas** from you. Communicated by position, not by a `(partner)` marker — that would be noise.
- **Opponents are on the sides**. Same principle.
- **You are at the bottom**, where your hand row visually grows from.

Empty positions (player hasn't played yet) show `-`. Position markers stack inside parens per the previous section: `S(me,D,M)` when you dealt and called trump. The leader of the current trick (Hearts) gets `(led)`.

When the 4th card lands, the trick view **lingers** for ~1 s before clearing so the user can see all four cards before the winner leads the next trick. Without the linger, the trick clears before the human can read it.

**Pixel layout**: each row is padded to `PLUS_WIDTH_PX = 360 px` (about half the 576 px display, centered on the canvas) using `@evenrealities/pretext` for proportional-font width measurement. Don't compute widths via string-length — the firmware font is proportional, not monospace (see `~/Documents/CLAUDE.md` and `KNOWN_QUIRKS.md` for the gory details).

**Platform export**: games don't reimplement this. The platform exports:

```ts
renderPlusTrick(
  plays: Array<{ pos: Position; card: Card | null }>,
  getMarker: (pos: Position) => string,   // e.g. 'me', 'D,M', 'led'
): string[]
```

Three lines back. Game wraps it with its own meta line above (Trump indicator, bid info, etc.) and the hand row below.

**Why not show the full 4-trick history**: the G2 budget doesn't allow it. The plus-sign shows only the *current* trick. Past tricks live in the score (`US 13-7 THEM` already tells you who won what). If a player needs to review past tricks, that's a phone-side feature, not a glasses-side one.

### End-of-hand / end-of-game banners

```
*** YOU WIN ***          end-of-game, you won
*** THEM WIN ***         end-of-game, opponents won
*** YOU WIN +2 ***       won by margin (optional, when meaningful)
```

Three asterisks each side, no other decoration. Banner is a body line; the footer remains its normal control-hint format pointing the user at the next action.

### Modal overlays

One overlay the platform owns: the **end-of-hand banner** (see § 1.10 below). Mid-game "exit to menu" and "quit app" are **phone-side buttons only** — not glasses gestures. See § 2 for the reasoning.

## 2. Gestures

| Gesture | In-game | In-launcher |
|---|---|---|
| Single tap | Primary action (play card, hit, deal, etc.) | Launch the cursored game |
| Double tap | Secondary action (pass, double-down, "next hand" at end-of-hand, "back to menu" at game-end) | (unused — reserved for future use) |
| Swipe up | Cursor up / previous option | Previous game in the list |
| Swipe down | Cursor down / next option | Next game in the list |

**Games own the entire glasses gesture surface during play.** The platform does not intercept anything mid-game. This matches how the existing card games (Hearts, Spades, Euchre) already work — they use swipe-up/down to navigate the hand cursor, so reserving those for platform-level use would force a port-time rewrite of every game's input model.

**"Exit to menu" mid-game is phone-side only.** Each game's phone panel has an `End game` button. Reasoning: card games naturally pause between hands. A mid-hand exit is rare. Hands-free play with glasses doesn't need a glasses-side bail-out for the rare interrupt case — the user can pull out their phone. Revisit if real play shows this is too friction-heavy.

**"Quit app" is also phone-side only.** EvenHub host provides this navigation already (back button in its UI chrome). The pack doesn't need to duplicate.

**Game-end → launcher.** Every game's terminal state (someone won) should show a `[2x] back to menu` footer. Double-tap in that terminal state fires the game's `ctx.endGame()`, the platform tears down the game module, the launcher reappears.

## 3. Phone WebView (companion app)

### Page wrapper

Every pack's `main.ts` builds the same wrapper:

```html
<main style="
  font-family: system-ui;
  padding: 1rem;
  max-width: 720px;
  margin: 0 auto;
  color: #232323;
  overflow-x: hidden;
">
```

The `overflow-x: hidden` is **mandatory** — the hub rejected Euchre v0.3.0 and Hearts v0.1.5 for phone WebView UI extending past screen bounds (see `~/Documents/CLAUDE.md`). Don't omit.

### Header

```html
<h1>Card Pack <span class="version">v0.1.0</span></h1>
<p class="tagline">Seven classic card games. One tap to play.</p>
<p id="status">Connecting…</p>
```

Tagline is per-pack. Version comes from `__APP_VERSION__` injected by Vite.

### Launcher (top of page)

```
┌─ Play ──────────────────────────┐
│ ♥ Hearts        (last played)   │
│ ♠ Spades                        │
│ ♦ Euchre                        │
│ ♣ Solitaire                     │
│ 8 Crazy Eights                  │
│ ⊡ Cribbage                      │
│ G Gin Rummy                     │
└─────────────────────────────────┘
```

Phone-side launcher is a vertical list. Tap a row → glasses display switches to that game's first screen. Glyph column is the same glyph the game declares in its `Game.glyph` field — so the launcher list visually matches the glasses-side glyph if shown.

### Per-game settings panel

Below the launcher, the currently-selected game's settings appear:

```html
<section>
  <h2>Hearts</h2>
  <label>Difficulty <select>…</select></label>
  <label>Target score <select>…</select></label>
  <button>New game</button>
</section>
```

Selects must have `style="max-width: 100%; box-sizing: border-box;"` — see "Phone WebView gotchas" in `~/Documents/CLAUDE.md`.

### Universal settings (collapsed)

```html
<details>
  <summary>Settings</summary>
  …
</details>
<details>
  <summary>How to play</summary>
  …per-game rules from Game.renderPhoneRules()…
</details>
```

Two disclosures, both closed by default. Settings is universal; "How to play" is per-game.

## 4. Game module interface

Games conform to this exactly. The platform composes the rest:

```ts
interface Game {
  id: string                      // 'hearts'
  name: string                    // 'Hearts'        — used in header
  shortDesc: string               // 'avoid hearts'  — launcher subtitle
  category: GameCategory
  glyph: string                   // '♥'             — single char for launcher + header
  init(ctx: PlatformContext): GameHandle
}

type GameCategory =
  | 'trick' | 'shed' | 'pegging' | 'patience'
  | 'casino-card' | 'casino-wheel'

interface GameHandle {
  /** Returns just the body + score + control hint. Platform composes the rest. */
  render(): GlassesFrame
  handleGlassesInput(ev: GlassesGesture): void
  handlePhoneEvent(ev: PhoneEvent): void
  /** Called when the platform tears down the game (user exits to menu). */
  destroy(): void
  /** Optional: per-game rules markdown for the "How to play" disclosure. */
  renderPhoneRules?(): string
  /** Optional: per-game settings HTML for the per-game panel. */
  renderPhoneSettings?(): string
}

interface GlassesFrame {
  score: string                   // e.g. "US 13-7 THEM"
  body: string[]                  // up to 5 lines
  controlHint: string             // e.g. "[swipe] sel  [tap] play"
  banner?: string                 // optional — e.g. "*** YOU WIN ***"
}

type GlassesGesture =
  | { kind: 'tap' }
  | { kind: 'double-tap' }
  | { kind: 'swipe-up' }
  | { kind: 'swipe-down' }
```

`swipe-down` is NOT in `GlassesGesture` — the platform consumes it for the exit prompt and never forwards. If a game needs "swipe down" for something else, that's a request to revisit this contract, not a workaround.

## 5. Tone

Across all text strings — glasses, phone, store listings, commit messages, this doc:

- **Sentence case.** Not Title Case. ("Tap to play", not "Tap To Play".)
- **No exclamation points** in the glasses display. The G2's display is small and quiet by design; excitement should come from the gameplay, not the typography. The end-of-game banner is the one exception — `*** YOU WIN ***` is allowed.
- **Second person, present tense.** "Tap to play your card." Not "the player taps to play their card."
- **No emoji** except the suit glyphs and the four explicitly defined markers. Specifically NO `🏆`, `🎉`, `🃏`, etc. — the firmware font support is unreliable and the visual tone is wrong for the product.
- **Numerals not spelled out** for scores and counts. `5 hearts`, not `five hearts`.

## 6. Open questions / things to revisit

These are intentionally NOT decided yet — they'll be filled in as Phase A reveals what matters:

- **Plate-math-equivalent for cribbage**: how to visualize the peg track on glasses? Probably a fractional progress bar like `[██████░░░░] 89/121` — but defer to Cribbage's implementation week.
- **Roulette wheel "spin" animation**: text-based tick-down over 1–2 s? Or instant reveal? Defer to Roulette's implementation week.
- **Settings persistence shape**: should there be a single `pack:settings:v1` blob, or per-game settings keys? Probably per-game; revisit when more than one game has tunable settings.
- **Difficulty defaults across games**: do we let the user set a default difficulty for the whole pack, or per-game only? Lean per-game with no global override; revisit if it feels noisy.

## 7. Enforcement

Style violations should be catchable at review time, not at QA time. Plans for future enforcement:

- Snapshot tests against `GlassesFrame` shapes (header/footer composition).
- Lint rule: `tsc` complains if a game's `render()` returns anything other than the declared `GlassesFrame` interface.
- Manual review checklist in PR template: "does this game obey STYLE.md §X?"

For v0.1, the enforcement is just "read this doc before adding a game."

---

**Owner**: Phil Tullai.
**Last update**: 2026-05-13 (v0.1 — initial draft, awaiting Phase A review).
