# FPP Scoring Formula Redesign

**Status: IMPLEMENTED and live** in `calcTeamScore()` (index.html ~line 7041). In testing.

## Live model (as shipped)

A team's value = its per-turn firepower × how many turns it survives to deliver it, plus
a residual armor term, plus a board-presence value for non-vehicle combat teams:

```
firepower = ai + atScore + mgScore + fpBonus + barrageScore
vehicles:           1 + mobility + firepower × longevity(front armor) + 0.4 × defScore
infantry / on-table guns:  1 + firepower + 0.4 × defScore + 3 (presence)   (longevity = 1)
command teams (PL/CC):     0     forward observer: 1     sniper: 12     upgrade: 2
```

Tuning knobs are named constants just above the function:
- `FS_LONGEVITY` — damped longevity multiplier by front armor (anchor armor 2 = 1.0)
- `FS_TURRET_MULT = 1.3` — AT multiplier for turreted vehicles (was 1.5)
- `FS_RESIDUAL_DEF = 0.4` — standalone armor value on top of longevity
- `FS_PRESENCE = 3` — per non-vehicle combat team (infantry + on-table guns with a range)

Presence applies to infantry and on-table gun teams (those with a listed range). It does
NOT apply to PL/FO/CC (no range), snipers (fixed value), or off-board indirect weapons
with no range (Katyusha, NW41, 120mm mortar). Panzerfaust and other upgrades are flat +2
and are meant to be applied per combat team in the platoon (force-builder change pending).

The score is NOT budget-rescaled: the FPP compares ratios and pairing wins, so absolute
scale does not change any FPP outcome. (Numbers run ~3% above the rescaled prototype
figures discussed during design; relationships are identical.)

Live reference values: Rifle/MG 6, MG team 7, HMG 9, Bazooka ~6.3, M4 Sherman 24.3,
StuG 28.9, Panzer IV H 30.9, Panther 59.7, Tiger II 99, PaK40 23.7, Hummel 40.

---

## Design rationale (kept for reference)

This documents a proposed replacement for the team-scoring math used by the Force
Parity Procedure. The live formula is `calcTeamScore()` in
[index.html](index.html) (around line 7041), with the tier tables `FS_AT_TIERS`,
`FS_DEF_TIERS`, `FS_FP_BONUS` just above it (around line 7028).

---

## Why change it

The live formula is purely **additive**: `score = base + ai + atScore + defScore +
mob + fpBonus + mgScore + barrageScore`. Two problems fell out of analysis:

1. **AT is overvalued, armor is undervalued.** AT carries three compounding
   multipliers (turret x1.5, range, sqrt(RoF)) while armor gets none and is diluted
   by flank-averaging. In practice AT is 40 to 70 percent of every gun-armed unit's
   score; armor is only 10 to 16 percent even on heavies.

2. **The additive structure misses how the game actually works.** Offense is
   conditional on survival: a gun only fires repeatedly if it lives to the next turn,
   and the thing that buys those turns is armor. So armor is not a parallel stat to
   add alongside firepower; it is a **multiplier on all the firepower it protects**.
   A dead tank has an AT rating of zero.

## Grounding mechanic

From the book's AT rule:

- **If AT > Armor:** roll (AT minus Armor) dice, any 6 destroys.
- **If AT <= Armor:** roll AT dice, any 6 is only an RFP (suppression, no kill).

So armor is a hard immunity threshold. Front Armor 4 is immune to kills from
everything with AT <= 4 (it can only be suppressed). Across the real roster, AT 4 is
the single most common gun (37 weapons), and AT <= 4 covers 65 percent of all AT
shooters. The armor 3 to 4 step is the biggest single jump on either axis, because it
clears the modal gun.

## The model

A unit's value is **per-turn firepower multiplied by how many turns it survives to
deliver it** (capped by game length), plus a residual standalone armor term for
holding ground.

**Vehicles:**

```
value = base(1) + mobility
      + (ai + atScore + mgScore) * longevity(front_armor)
      + 0.4 * defScore
```

**Infantry:**

```
value = firepower(ai + atScore + mgScore) + 4 (presence per team)
```

Infantry get no armor-longevity multiplier (their survivability comes from cover,
RFP, and rally, not an armor rating). The flat **+4 presence per team** stands in for
durability and board control: a rifle team's value was never its 2-point gun, it is
that the team is hard to dig out, holds objectives, and soaks activations.

The whole roster is then rescaled so the **total points budget is held constant**:
this is a redistribution, not inflation. (Note: this is why lowering the turret
multiplier appears to raise casemate units. Their raw value is unchanged; the rescale
spreads the freed-up points across every non-turreted unit.)

## Parameters

| Parameter | Value | Was | Meaning |
|---|---|---|---|
| Turret multiplier | **1.3** | 1.5 | AT bonus for turreted vehicles. At 1.3 a turret on the same gun is worth about one point of front armor. |
| Longevity anchor | armor 2 = 1.0x | n/a | Medium armor is the 1.0x reference. |
| Longevity damping | 50 percent | n/a | Halves the deviation of the raw longevity multiplier from 1.0, so heavies do not run away. |
| Residual armor weight | 0.4 | n/a | Standalone "holds ground" value, on top of the longevity multiplier. |
| Infantry presence | +4 / team | n/a | Per-team durability / board-presence value. |
| Game length T | 6 turns | n/a | Caps longevity (survival past game end is wasted). |
| Shots per turn k | 1.5 | n/a | Incoming fire assumption used to convert per-shot survival into expected activations. |

### Longevity derivation

1. Per-shot survival by front armor is computed against the roster's actual AT
   distribution: `survive = mean over AT shooters of (1 - P(kill))`, where
   `P(kill) = 0 if AT <= armor, else 1 - (5/6)^(AT - armor)`.
2. Per-turn survival `q = survive ^ k`.
3. Expected activations over the game `L = sum_{t=0}^{T-1} q^t` (naturally caps at T
   as q approaches 1).
4. Normalize to the armor-2 anchor, then damp: `Lnorm = 1 + (L/L_armor2 - 1) * 0.5`.

## Calibration targets it hits

At the parameters above (turret 1.3), with the MG sync now applied (live data):

| Unit | Value | Target met |
|---|---|---|
| M4 Sherman 75 | 28.7 | reference medium |
| M4 Sherman 76 | 43.6 | strong medium (flag: possibly a touch high) |
| Panzer IV H | 33.8 | near the StuG |
| StuG | 31.5 | >= M4-75, near the PzIV |
| Panther | 65.1 | beats 2 M4-75s (57), not 3 (86) |
| Marder (open-top TD) | ~24 | glass cannon, drops |
| Infantry platoon (4 rifle + 2 MG + bazooka) | ~50 | between 1 and 2 M4s (1.7x) |
| Rifle / MG / Bazooka team | ~6 / 8 / 8 | up from ~2 / 4 / 4 |

Design goals confirmed: StuG >= M4, PzIV and StuG close, Panther beats 2 M4s but not
3, glass cannons punished, infantry platoon between 1 and 2 M4s.

## Open items before shipping

- **Validate on real forces.** Unit values can look wild but wash out at the force
  level. The number that matters is how Break Limit reductions shift in actual FPP
  runs.
- **M4-76 may be a notch high** (~44). It gains on both rewarded axes (AT 5 and
  front-3 armor). Reconsider when the roster is in front of us.
- **MG sync: DONE** (committed). Sherman to 2 MGs (Coax/Hull), StuG keeps 1 (coax),
  Brummbar gained a hull MG. Baselines above reflect this.
- **Tune T and k** if the longevity feels too strong or weak after force-level tests.
