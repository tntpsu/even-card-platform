# TESTS — coverage matrix

Last updated: 2026-05-14 (v0.1.0)

This is the build gate for `even-card-platform`. Every public export gets
a row, every cell gets a test reference or explicit reason. See
`~/.claude/skills/coverage-matrix/SKILL.md` for the discipline.

The platform is a pure TypeScript library — no DOM, no I/O outside the
optional bridge runtime, no async lifecycle. Many "by dimension" rows are
n/a (no e2e — there's no app to boot; no hardware — there's no hardware
the lib talks to directly). What matters is the unit + integration
coverage of the public API.

## Public surface × failure mode

Columns dropped as n/a (lib only):
- Network — no fetch calls
- Mic — no audio API surface
- Storage hang — covered by storage bridge fallback behavior

| Use case | Happy | Bad input | Edge case |
|---|---|---|---|
| Card type constants (SUITS / RANKS / SUIT_GLYPH) | unit:card | n/a | unit:card (♦ → ◆ substitution) |
| renderCard formats rank+glyph | unit:card | n/a | unit:card (10 + diamonds) |
| cardKey uses literal suit char | unit:card | n/a | n/a |
| rankValue ordering | unit:card | n/a | unit:card (A=14) |
| cardEq same-card / different-card | unit:card | n/a | n/a |
| freshDeck builds 52 unique | unit:deck | n/a | n/a |
| deckFromRanks (Euchre 24-card) | unit:deck | n/a | n/a |
| shuffle preserves length + contents | unit:deck | n/a | unit:deck (does not mutate) |
| shuffle determinism with seeded RNG | unit:deck | n/a | n/a |
| deal round-robin order | unit:deck | n/a | unit:deck (partial Euchre 5x4+4 kitty) |
| drawTop with empty deck | unit:deck (edge) | unit:deck (empty) | n/a |
| renderHandRow line count = 2 | unit:hand-row | n/a | unit:hand-row (empty hand) |
| renderHandRow ♦ → ◆ substitution | unit:hand-row | n/a | n/a |
| renderHandRow paren-wraps illegals | unit:hand-row | n/a | n/a |
| renderHandRow ▲ cursor position | unit:hand-row | n/a | unit:hand-row (out-of-range) |
| renderHandRow cursor monotonic rightward | unit:hand-row | n/a | n/a |
| renderPlusTrick line count = 3 | unit:plus-trick | n/a | n/a |
| renderPlusTrick N/W/E/S row positions | unit:plus-trick | n/a | n/a |
| renderPlusTrick markers stacking | unit:plus-trick | n/a | unit:plus-trick (no markers) |
| renderPlusTrick null card → `-` | unit:plus-trick | n/a | n/a |
| renderPlusTrick ♦ → ◆ substitution | unit:plus-trick | n/a | n/a |
| renderPlusTrick centering whitespace | unit:plus-trick | n/a | n/a |
| composeGlassesFrame uppercases name | unit:frame | n/a | n/a |
| composeGlassesFrame body line order | unit:frame | n/a | n/a |
| composeGlassesFrame banner placement | unit:frame | n/a | unit:frame (no banner) |
| composeGlassesFrame footer last line | unit:frame | n/a | n/a |
| GameStorage round-trip | unit:storage | n/a | unit:storage (fallback default) |
| GameStorage key namespacing | unit:storage | n/a | unit:storage (game isolation) |
| GameStorage remove clears | unit:storage | n/a | n/a |
| GameStorage memory fallback | unit:storage (null bridge) | n/a | n/a |
| GameStorage broken-bridge fallback | unit:storage | unit:storage (throw → fallback) | n/a |
| Launcher init seeds from last-played | unit:launcher | n/a | unit:launcher (no last-played) |
| Launcher cursor wrap | unit:launcher | n/a | n/a |
| Launcher tap launches cursored | unit:launcher | n/a | n/a |
| Launcher double-tap no-op | unit:launcher | n/a | n/a |
| Launcher (last) tag on previously-played | unit:launcher | n/a | n/a |
| Launcher render reflects cursor | unit:launcher | n/a | n/a |
| Launcher commitLaunch persists | unit:launcher | n/a | n/a |
| Launcher empty game list safety | unit:launcher | unit:launcher | n/a |
| Runtime init → launcher state | unit:runtime | n/a | n/a |
| Runtime gesture routing (in-game vs launcher) | unit:runtime | n/a | n/a |
| Runtime ctx.endGame() returns to launcher | unit:runtime | n/a | n/a |
| Runtime phone events forward to active game | unit:runtime | n/a | unit:runtime (dropped in launcher) |
| Runtime exitToMenu no-op in launcher | unit:runtime | n/a | n/a |
| Runtime launchGame teardown of previous | unit:runtime | n/a | n/a |
| Runtime setDifficulty applies to next game | unit:runtime | n/a | n/a |
| Runtime launchGame unknown id | n/a | unit:runtime | n/a |
| Runtime render() manual refresh | unit:runtime | n/a | n/a |

## By dimension

### Static
- [x] tsc strict: passes (`npx tsc --noEmit`)
- [ ] Lint: not wired (no ESLint config)
- [ ] Secret scan: n/a — library has no credentials
- [x] Bundle size: n/a — library, consumed via `file:` dep, no bundling here

### Unit
- **78 tests** across 8 files (card, deck, hand-row, plus-trick, frame,
  storage, launcher, runtime). All passing.
- Coverage is dense — every public export has at least one test, most
  have edge-case coverage too.

### Integration
- Not applicable at the library level. Integration is the consumer's job
  (CardPack, HouseGames each test their own integration with the platform).

### End-to-end
- Not applicable — no app to boot. The platform is exercised end-to-end
  through CardPack's `scripts/regression.mjs`.

### Performance
- Pixel-aware rendering uses `@evenrealities/pretext.getTextWidth` which
  is O(n) over the string. All renderers run sub-millisecond in tests.
- No bundle budget — library distribution is source.

### Hardware
- Not applicable — no hardware access in the library.

### Documentation
- [x] STYLE.md is current — Phase A.4 added the gesture-model correction
- [x] README current — describes v0.1.0 state honestly
- [x] Public exports in `src/index.ts` match what's tested

### Regression
- None yet — the platform has had no field-bugs surfaced. Will populate
  as CardPack's real-glasses testing exposes platform-level issues.

## Acceptance gate for v0.2.0 (when CardPack proves the contract works)

- [ ] All cells above remain green
- [ ] Any platform-level issues surfaced during CardPack's Phase A gate
      (5 real hands of Hearts) have regression tests added BEFORE the fix
- [ ] If a new primitive is added (e.g. CribbagePegTrack renderer for
      Phase B's Cribbage port), it gets matrix rows + tests in the same
      PR
- [ ] STYLE.md edits land with at least a snapshot test if they constrain
      rendering output

The library is in a good shape today. The discipline going forward is
making sure new code arrives with new rows + new tests in the same PR.
