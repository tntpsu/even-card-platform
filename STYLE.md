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
| **trick** (Hearts, Spades, Euchre) | `US <ns>-<ew> THEM` | `US 13-7 THEM` |
| **shed** (Crazy Eights, Gin Rummy) | `YOU <a>  THEM <b>` (single opponent) or `S:<a> W:<b> N:<c> E:<d>` | `YOU 32  THEM 41` |
| **pegging** (Cribbage) | `US <pts>  THEM <pts>  /<target>` | `US 89  THEM 76  /121` |
| **patience** (Solitaire) | `MOVES <n>  TIME <m:ss>` | `MOVES 47  TIME 3:12` |
| **casino-card** (Blackjack, Video Poker, Three Card Poker) | `YOU $<bal>  BET $<bet>` | `YOU $185  BET $25` |
| **casino-wheel** (Roulette) | `YOU $<bal>  BET $<total>` | `YOU $200  BET $15` |

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

A hand is rendered horizontally with a `▲` cursor on the next line under the active card. From the Euchre v0.3 pattern, pixel-centered using `@evenrealities/pretext` for proportional-font width measurement.

```
J♦  (Q♣)   Q♠   A♦   K♥        ← cards row
     ▲                          ← cursor row, centered under Q♣
```

- **Legal play**: `7♠` (rank + suit, no decoration)
- **Illegal play right now** (e.g. must follow suit): `(7♠)` with literal parens
- **Selected via cursor**: indicated by the `▲` on the cursor row, not by decoration on the card itself
- **PR / star card** (when applicable, e.g. trump): no decoration in v1; revisit later

### Markers

Used to label position-relative or role-relative info:

```
(D)     dealer this hand
(M)     maker / declarer (called trump in Euchre; the one who took the bid in Spades)
(me)    you (player South)
(led)   led the current trick
```

Always parenthesized, always lowercase. Appear after the position label: `S (me)`, `N (D)`.

### End-of-hand / end-of-game banners

```
*** YOU WIN ***          end-of-game, you won
*** THEM WIN ***         end-of-game, opponents won
*** YOU WIN +2 ***       won by margin (optional, when meaningful)
```

Three asterisks each side, no other decoration. Banner is a body line; the footer remains its normal control-hint format pointing the user at the next action.

### Modal overlays

Two overlays the platform owns:

**EXIT prompt (when user swipes down once in-game):**
```
EXIT TO MENU?

Swipe down again to confirm
Or wait to cancel
```
Auto-cancels after 2 s if no second swipe.

**Quit-app prompt (when user swipes down once in launcher):**
```
QUIT APP?

Swipe down again to confirm
Or wait to cancel
```

Same 2 s cancel window. Wording differs only in the action (`MENU` vs `APP`).

## 2. Gestures

| Gesture | In-game | In-launcher |
|---|---|---|
| Single tap | Primary action (play card, hit, deal, etc.) | (no-op — avoids accidental selection) |
| Double tap | Secondary action (pass, double-down, "next hand" at end-of-hand) | Launch selected game |
| Swipe up | Cursor up / previous option | Previous game |
| Swipe down | Cursor down / next option | Next game |
| Swipe down ×2 within 2 s | Confirm "exit to menu" | Confirm "quit app" |

The same gesture (swipe-down + swipe-down) has context-dependent meaning: in-game it exits to the launcher, in-launcher it exits the app. The 2 s confirmation window is consistent. This pattern is borrowed from Hands Free Lift's existing exit flow — known to work.

**Reserved for the platform:** swipe-down-once never means anything in-game except "show exit prompt." Games must not bind it. The platform consumes the gesture and shows the overlay; the game's `handleGlassesInput` is not called.

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
