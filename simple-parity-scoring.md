# Simple Parity Scoring (experiment, 15 Jun 2026)

A pen-and-paper handicap you can do at the table without the Arsenal calculator. Add up
small numbers per platoon, run the FPP pairing, the stronger force drops Break Limit by the
gap. No cap — bring a blowout list, eat a blowout penalty.

This is a **deliberately coarse alternative** to the live calculator model
([scoring-redesign.md](scoring-redesign.md), the firepower×longevity math in
`calcTeamScore()`). That one is more accurate; this one you can run in your head.

## Quick terms

- Unit = platoon. BL (Break Limit) = 5 + 2 per platoon.
- Every team gets a small point cost. Add teams → platoon score. Rank platoons, pair them,
  count who wins. Difference in pairing points = BL reduction on the stronger force.

## Team cost

Start at **1**, then **+1 for each point of**: RoF, AT, FP, Front Armor, Flank Armor.
(Blank stat = 0.)

Then the modifiers:

- **Leaders & Forward Observers cost 0.** No stats, free.
- **+2** if the team carries a **Panzerfaust** (or equivalent one-shot faust).
- **+1** if it's a **tracked or wheeled vehicle** (tank, SP gun, armoured car, transport —
  not a towed gun or foot infantry).
- **Range:** **+1** at **24"+**, and **+1 more** at **32"+** (so a 36" gun is +2).
- **Vehicle MGs:** **+3** for the first MG, **+1** each additional (MGs are in the
  vehicle's armament line; coax + hull = 2 MGs = +4).
- **Transport MGs:** just **+1**, regardless of count — a transport only fires its MG when
  it's carrying passengers, so it isn't a real weapon system.

Not charged: secondary stats that aren't in the profile, and the main gun's MG is the only
MG count that matters (we read it off the armament text).

### Reference values

| Team | Cost | | Team | Cost |
|---|--:|---|---|--:|
| Platoon Leader / FO | 0 | | M4 Sherman / Cromwell (2 MG) | 17 |
| Rifle Team | 3 | | T-34 (2 MG) | 16 |
| Rifle/MG Team | 4 | | Panzer IV H (2 MG) | 18 |
| MG Team | 5 | | StuG III G (1 MG) | 18 |
| HMG (Maksim/Vickers, RoF4) | 6 | | Sherman Firefly (1 MG, 28") | 18 |
| AT Rifle (PTRD) | 5 | | Churchill III/IV (2 MG, armor 3/3) | 20 |
| Bazooka / PIAT | 7 | | Stuart / M5 (2 MG) | 13 |
| Panzerschreck | 8 | | Puma (1 MG) | 12 |
| Rifle/MG + Panzerfaust | 6 | | BA-64 (1 MG) | 10 |
| Light mortar (24") | 5 | | M7 Priest / Wespe (SP arty, 1 MG) | 12 |
| 57mm / 45mm (RoF3 AT3) | 8 | | Sexton (SP arty, 1 MG) | 13 |
| OQF 6 pdr (RoF3 AT4) | 9 | | Katyusha (SP rocket, no MG) | 4 |
| 7.5cm PaK40 (AT5, 28") | 10 | | Half-track (no MG) | 3 |
| 8.8cm FlaK (AT6, 36") | 12 | | Sd Kfz 251 / U.Carrier (passenger MG) | 4 |
| M2A1 105mm / 25 pdr (arty) | 8 | | | |

## Force Parity Procedure (with these points)

The points don't get summed into one budget — they rank your platoons and decide who wins
each head-to-head. Same FPP spirit, just counted instead of argued.

1. **Reveal** both forces (4–10 platoons each).
2. **Score** every platoon (sum its teams).
3. **Rank** each side's platoons high → low.
4. **Pair** strongest vs strongest, second vs second, down the line.
5. **Compare each pairing:** the higher score scores its player **1 point**, plus **+1 for
   every full 10 points of margin**. Exact tie → defender's edge (defender scores it).
6. **Extra units:** if one side has more platoons, each unpaired platoon scores its owner
   **2 points**.
7. **Handicap:** total each side. The higher total reduces its **Break Limit by the
   difference**. No cap.

### Why these weights

- **Win = 1** rewards being better *across the board* (breadth).
- **+1 per 10-pt margin** rewards winning a pairing *big* (depth) — without it, a force of
  near-equal total cost can rack up a handicap just from how the pairings line up. The
  margin term pulls equal-cost forces back toward even.
- **Extra unit = 2** values the extra platoon: more board presence, more Order Dice — and
  it already bought you +2 BL, so the handicap claws some of that back.
- **No cap** is the point. A cap turns the handicap into a budget and *rewards* building a
  list that maximally blows out the opponent. Uncapped, the blowout list pays for itself —
  the threat of an escalating penalty is what keeps both players reasonable.

## How it plays out on the example forces

All 8 rulebook example forces, every matchup, handicap = BL reduction on the stronger side:

- **Armour mirror-matches are tight:** US Tank / DE Panzer / BR Tank vs each other → 1–2.
- **The cheap list gets flagged:** USSR Tankovy (lightest) eats 8–9 vs any Western tank
  company. That's the system saying "this list is under-built," not a bug.
- **BR Rifle is the quiet heavyweight** (Churchills + 25-pdrs): imposes 3–6 on most.
- Spread across 28 matchups: min 1, max 9, mean ~4.5 (on Break Limits of 15–19).

## Simpler: just compare totals

You can skip the pairing almost entirely, because of a math identity. The handicap has two
parts — **+1 per pairing won** (breadth) and **+1 per 10-pt margin** (depth). Net out the
depth part and every pairing contributes `(a_i − b_i)/10` to the difference *whether A or B
won it*, so it sums to `(totalA − totalB)/10`. **The margin/depth term equals the difference
of point totals ÷ 10, and the pairing is irrelevant to it.**

So the dead-simple version is:

> **Handicap = round( |totalA − totalB| ÷ 10 )**, applied to the stronger force.

One subtraction, one division. (Nothing is divided except the final gap → BL exchange rate:
*10 points of gap = 1 handicap point*.)

What you lose is only the **breadth** term (winning many pairings). Across the 8 example
forces, `FPP ≈ total/10 + breadth`, where breadth adds **0–4** (mean ~1.9). They agree
exactly when one force dominates uniformly, and diverge when forces *trade* roles — e.g. US
Tank vs BR Rifle are near-equal totals (→ 0) but the FPP charges 4 because US Tank's
concentrated platoons win more pairings.

Bonus: totals are arguably more *intuitive* — equal points → 0 handicap, full stop. The FPP
breadth term quietly handicaps some equal-cost forces, which players don't expect.

### Accuracy vs robustness (why you might still pair)

The two methods don't just differ in effort — they make different demands on the points:

- **Totals are purely *cardinal*.** Every unit's exact value feeds straight into the gap, so
  a systematic mispricing of a category (say all AT guns are +2 too high) biases the
  handicap in proportion to how many of that category the two forces *differ* by. Totals are
  only as trustworthy as the absolute numbers.
- **The pairing's win-count is *ordinal*.** It only needs the *ranking* right — "is my tank
  platoon scarier than yours?" — and because it pairs like-with-like, a category-wide
  mispricing shifts both sides' paired platoons together and **cancels**. It tolerates a
  rough points system.
- **But the margin term is exactly as fragile as totals** (it *is* the total difference). So
  robustness comes specifically from leaning on **wins, not margins** — not from pairing per
  se.

Trade-off in one line: **margin/cardinal = high resolution, needs an accurate points system;
win-count/ordinal = low resolution, forgives a rough one.** Pick the blend that matches how
much you trust the costs. With the coarse hand-formula here, a **win-count-heavy** FPP
(small or no margin) is the safest; if you drive it off the calibrated calculator model
([scoring-redesign.md](scoring-redesign.md)), totals become reliable and simpler.

Handy diagnostic: where the totals and FPP answers *disagree* is exactly where your pricing
is doing the most work — a good place to sanity-check the costs.

## Spending the gap (instead of just cutting BL)

A raw BL cut makes the weaker force *start near-broken*, which isn't fun. Better: the gap is
a currency the **underdog spends** on advantages. **1 point ≈ 1 BL of value** (~1.67 BP of
cushion), and every dial is pegged against that.

**Default sink: Hero Points.** Each player already rolls 1d6 secretly at the start for Hero
Points (a pool to double-activate, re-activate, or interrupt on the enemy's turn). The
simplest handicap is just: **the underdog adds the gap to their secret Hero-Point roll**
(capped, see below), overflow → +1 BL each. One number, no new bookkeeping, and it stays
hidden so it adds bluff instead of "I start with less."

For groups that want texture, swap points for menu items:

**Universal**

| Cost | Dial | Cap |
|--:|---|---|
| 1 | +1 Hero Point (secret) | max +3 |
| 1 | +1 BL | the overflow sink |
| 2 | Pre-Registered Target — one free barrage, no FO / Range-In | once |
| 2 | Spotter — one Unit gains Recon (Hidden detection 20", re-activate on Training Check) | once |
| 2 | Harassing fire — one RFP-only barrage before turn 1 | once |
| 1 | Seize initiative — take the first activation of turn 1 | once |
| 3 | Elite — one Unit re-rolls 1s on all Checks and vehicle fire | 1 Unit only |

**Conquest-specific** (see [conquest-rules.md](conquest-rules.md))

| Cost | Dial | Side |
|--:|---|---|
| 2 | Win the attack without bidding BL | underdog who'd defend |
| 2 | Deploy one reserve Unit on-table at start | Defender |
| 1 | +1 to Reserves Checks (as if a free 2nd Order Point) | Defender |
| 2 | Shift one objective after edges are known | Attacker |

**Two rules that keep it honest**

1. **Anti-stacking caps.** Without them a big gap dumped into one lever breaks (+9 Hero
   Points is a second army; whole-force Elite). Caps above; excess overflows to +1 BL. Also
   reads true — a points gap can't make your whole force veteran.
2. **Stronger player's per-point choice.** For each gap point, the strong side decides:
   grant the dial, or take −1 BL themselves. They pick what hurts least, so it can't be
   gamed, and the no-cap escalation stays intact.

Note: ambush/hidden deployment is **not** a dial — Defender non-vehicle Units already deploy
Hidden and Dug-In by default.

## Open questions / calibration

- **Margin step** (per 10): per-15 softens, per-5 sharpens.
- **Doubles instead of margin:** simpler table-side variant — +1 if the winner's score is
  ≥ 2× the loser's, instead of the per-10 margin. Coarser, under-credits depth.
- **Churchill (20) and Soviet kit** are the two calibration flags — Churchill's 3/3 armor +
  2 MGs stack fast; Soviet gear runs cheap (short range, no 24"+ bonus on the T-34).
- This shares the exact application as Conquest's optional **Weight count** (heavier force
  drops BL by the difference). They're the same socket at different resolutions — use one or
  the other, not both.
