#!/usr/bin/env python3
"""
Force-scoring / parity cross-check for the Hail of Fire Arsenal.

A standalone Python mirror of calcTeamScore() in index.html (the FPP scoring
model documented in scoring-redesign.md), plus the rulebook's eight Example
Forces, so the per-team / per-platoon / per-force numbers and the FPP handicap
can be reproduced and re-tuned outside the browser.

IMPORTANT: this mirrors index.html's constants and logic. If you change the
scoring there, mirror it here (and vice-versa). Last synced: 2026-06-16.

Usage:
    python3 tools/score_forces.py forces     # force totals (÷2) + handicap matrix
    python3 tools/score_forces.py ladder     # heavy-tank ladder vs M4 Sherman
    python3 tools/score_forces.py team NAME   # one unit's component breakdown
    python3 tools/score_forces.py breakdown FORCE   # per-platoon, per-team detail
"""
import json, math, re, sys, os, itertools

JSON = os.path.join(os.path.dirname(__file__), "..", "hof_arsenal.json")

# ── Model constants (mirror index.html ~line 7162) ─────────────────────────────
AT_TIERS   = {0:0, 1:1, 2:2, 3:3, 4:5, 5:8, 6:12, 7:17, 8:23}
DEF_TIERS  = {0:0, 1:1, 2:4, 3:7, 4:11, 5:16, 6:23, 7:31}
FP_BONUS   = {1:0, 2:5, 3:10}
BARRAGE    = {"Light Artillery":2, "Medium Artillery":6, "Heavy Artillery":12}
LONGEVITY  = {0:0.824, 1:0.891, 2:1.0, 3:1.159, 4:1.382, 5:1.555, 6:1.691, 7:1.65}
UNARMORED_LON = 0.7      # unarmored vehicles: killable by small arms, below armor-0
TURRET_MULT   = 1.3
RESIDUAL_DEF  = 0.4
PRESENCE      = 3
ROF_ACCEL     = 1
DISPLAY_DIV   = 2        # raw -> displayed points
GAP_PER_BL    = 10       # displayed-point gap per 1 Break Limit of handicap
VEHICLES = {"Tank", "SP Artillery", "SP Anti-Air", "Armoured Cars", "Transport"}


def _has(u, n): return n in (u.get("notes") or [])

def _range(u):
    s = u.get("gun_range") or ""
    if not s or s == "-": return None
    return int("".join(c for c in s if c.isdigit()) or 0)

def _mg_count(arm):
    s = (arm or "").replace("Passenger-fired AA MG", "Hull MG")
    coax  = len(re.findall(r"Co-?ax", s, re.I))
    hull  = len(re.findall(r"Hull MG", s, re.I))
    aa    = len(re.findall(r"AA MG", s, re.I))
    fifty = len(re.findall(r"\.50", s))
    return coax + hull + aa + fifty, (aa + fifty)


def score(u, parts=False):
    """Raw combat value. Mirrors calcTeamScore(). (Omits the 1-unit
    secondary_weapon path; add if a multi-weapon unit needs it.)"""
    if u["name"] in ("Platoon Leader", "Company Commander"): return 0
    if _has(u, "Sniper"): return 12
    if u["type"] == "Upgrade": return 2

    utype = u["type"]; r = _range(u)
    rof = u.get("rof") or 0; at = u.get("at"); fp = u.get("fp") or 1
    armor = u.get("armor_front"); arm = u.get("armament") or ""
    no_direct = r is None
    isv = utype in VEHICLES
    ai = ats = fpb = 0

    if not no_direct:
        steps = max(0, (r - 16) // 4)
        adj = rof - (1 if r <= 6 else 0) - (1 if _has(u, "Limited HE") else 0)
        ai = adj + 3 if _has(u, "Flame-Thrower") else adj + max(0, adj - 2) * ROF_ACCEL + steps
        # HE (any AT incl 0) ignores Concealment; Limited HE excluded.
        if at is not None and not _has(u, "Limited HE"): ai += 1
        if at is not None and at > 0:
            eff = at + (fp - 1) * 0.5; lo = int(eff); fr = eff - lo
            tier = AT_TIERS.get(lo, 0) + fr * (AT_TIERS.get(lo + 1, AT_TIERS.get(lo, 0)) - AT_TIERS.get(lo, 0))
            turret = TURRET_MULT if (isv and not _has(u, "Hull Mounted")) else 1.0
            rm = 1 + steps * 0.1
            rfp = 0.5 if _has(u, "May only inflict RFPs") else 1.0
            rofat = math.sqrt(rof) if rof > 0 else 0
            tow = 0.75 if _has(u, "Immobile") else 1.0
            ats = (tier * 0.5 * rfp * rofat) if (not isv and r <= 8) else tier * turret * rm * rfp * rofat * tow
        fpb = FP_BONUS.get(fp, 0)

    fl = u.get("armor_flank"); fl = fl if fl is not None else armor
    defs = 0
    if armor is not None:
        avg = (3 * armor + fl) / 4; lo = int(avg); fr = avg - lo
        defs = DEF_TIERS.get(lo, 0) + fr * (DEF_TIERS.get(lo + 1, DEF_TIERS.get(lo, 0)) - DEF_TIERS.get(lo, 0))
    if _has(u, "Open Topped"): defs = max(0, defs - 1)

    mob = 0
    if isv:
        mob = 3 if _has(u, "Tracked") else (2 if (_has(u, "Half-Tracked") or _has(u, "Wheeled")) else 0)
        for note, d in [("Slow", -1), ("Fast", 1), ("Wide Tracks", 2), ("Unreliable", -2), ("Overloaded", -2)]:
            if _has(u, note): mob += d
        mob = max(0, mob)

    tot, aa = _mg_count(arm)
    mg = (4 if aa else 2) if tot == 1 else (tot * 2 if tot > 1 else 0)

    bar = 0
    if not _has(u, "Light Mortar"):
        for k, v in BARRAGE.items():
            if _has(u, k): bar = v; break
        if bar > 0 and _has(u, "Smoke"): bar += 2
        # NOTE: no ×fp — the Light/Medium/Heavy category already encodes FP scale.

    off = ai + ats + mg + fpb + bar
    lon = 1 if not isv else (LONGEVITY.get(min(7, armor), 1) if armor is not None else UNARMORED_LON)
    pres = PRESENCE if (utype in ("Infantry", "Gun") and not no_direct) else 0
    total = 1 + mob + off * lon + defs * RESIDUAL_DEF + pres
    if parts:
        return dict(ai=round(ai, 1), at=round(ats, 1), mg=mg, fpb=fpb, bar=bar,
                    defr=round(defs * RESIDUAL_DEF, 1), mob=mob, lon=round(lon, 3), total=round(total, 1))
    return total


# ── Example Forces (rulebook p.14). (unit-name, nation, qty) per platoon. ───────
# Leaders/FOs score 0 but are listed for completeness. Panzerfaust = per-team Upgrade.
def load():
    return {(u["name"], u["nation"]): u for u in json.load(open(JSON))["units"]}

def C(units, name, nation):
    u = units.get((name, nation)) or next((v for (n, _), v in units.items() if n == name), None)
    if not u:
        print("  !! missing:", name, nation); return 0
    return score(u)

FORCES = {
 "US Rifle": [("Rifle Plt", [("Platoon Leader","United States",1),("Bazooka","United States",1),("Rifle/MG Team","United States",6)], 3),
   ("Mortar", [("Platoon Leader","United States",1),("Forward Observer","United States",1),("M1 81mm Mortar","United States",3)], 1),
   ("Anti-Tank", [("Platoon Leader","United States",1),("M1 57mm Gun","United States",3)], 1),
   ("Tank", [("M4 Sherman","United States",3)], 1),
   ("Artillery", [("Platoon Leader","United States",1),("Forward Observer","United States",1),("M2A1 105mm Howitzer","United States",3)], 1)],
 "US Tank": [("Tank", [("M4 Sherman","United States",3)], 2),
   ("Armd Rifle", [("Platoon Leader","United States",1),("Bazooka","United States",2),("M2 60mm Mortar","United States",1),("MG Team","United States",6),("M2/M3 Half-Track","United States",4)], 1),
   ("Recon", [("M5 Stuart","United States",3)], 1),
   ("Artillery", [("M7 Priest HMC","United States",3),("Forward Observer","United States",1),("M2/M3 Half-Track","United States",1)], 1)],
 "DE Grenadier": [("Grenadier Plt", [("Platoon Leader","Germany",1),("Rifle/MG Team","Germany",6),("Panzerfaust","Germany",6)], 3),
   ("Mortar", [("Platoon Leader","Germany",1),("Forward Observer","Germany",1),("8cm GW34 Mortar","Germany",3)], 1),
   ("Anti-Tank", [("Platoon Leader","Germany",1),("7.5cm PaK40 Gun","Germany",3)], 1),
   ("Panzer", [("StuG G or IV","Germany",3)], 1),
   ("Heavy AA", [("Platoon Leader","Germany",1),("8.8cm FlaK36 Gun","Germany",1)], 1)],
 "DE Panzer": [("Panzer", [("Panzer IV H","Germany",3)], 2),
   ("Pz Grenadier", [("Platoon Leader","Germany",1),("Panzerschreck","Germany",1),("MG Team","Germany",6),("Panzerfaust","Germany",6),("Sd Kfz 251","Germany",4)], 1),
   ("Recon", [("Sd Kfz 234/2 Puma","Germany",2)], 1),
   ("Artillery", [("Wespe","Germany",3),("Forward Observer","Germany",1),("Sd Kfz 251","Germany",1)], 1)],
 "SU Strelkovy": [("Rifle Plt", [("Platoon Leader","Soviet Union",1),("Maksim HMG","Soviet Union",1),("PTRD Anti-Tank Rifle","Soviet Union",1),("Rifle Team","Soviet Union",6)], 3),
   ("Mortar", [("Platoon Leader","Soviet Union",1),("Forward Observer","Soviet Union",1),("82-BM-41 Mortar","Soviet Union",4)], 1),
   ("Anti-Tank", [("Platoon Leader","Soviet Union",1),("45mm obr 1942 Gun","Soviet Union",3)], 1),
   ("Tank", [("T-34 obr 1941/42","Soviet Union",3)], 1),
   ("Artillery", [("Platoon Leader","Soviet Union",1),("Forward Observer","Soviet Union",1),("122mm obr 1938 Howitzer","Soviet Union",3)], 1)],
 "SU Tankovy": [("Tank (T-34)", [("T-34 obr 1941/42","Soviet Union",3)], 2),
   ("Rifle Plt", [("Platoon Leader","Soviet Union",1),("Maksim HMG","Soviet Union",1),("PTRD Anti-Tank Rifle","Soviet Union",1),("Rifle/MG Team","Soviet Union",6),("ZIS-5/6/Dodge Truck","Soviet Union",4)], 1),
   ("Tank (SU-85)", [("SU-85","Soviet Union",3)], 1),
   ("Recon", [("BA-64","Soviet Union",2)], 1),
   ("Artillery", [("BM-13 Katyusha","Soviet Union",3),("Forward Observer","Soviet Union",1),("ZIS-5/6/Dodge Truck","Soviet Union",1)], 1)],
 "BR Rifle": [("Rifle Plt", [("Platoon Leader","Britain",1),("PIAT","Britain",1),("ML 2\" Mortar","Britain",1),("Rifle/MG Team","Britain",6)], 3),
   ("Anti-Tank", [("Platoon Leader","Britain",1),("OQF 6 pdr Gun","Britain",3)], 1),
   ("Tank", [("Churchill III or IV","Britain",3)], 1),
   ("Mortar", [("Platoon Leader","Britain",1),("Forward Observer","Britain",1),("ML 3\" Mk II Mortar","Britain",3)], 1),
   ("Artillery", [("Platoon Leader","Britain",1),("Forward Observer","Britain",1),("OQF 25 pdr Gun","Britain",3)], 1)],
 "BR Tank": [("Tank", [("Cromwell IV","Britain",2),("Sherman VC Firefly","Britain",1)], 2),
   ("Motor", [("Platoon Leader","Britain",1),("PIAT","Britain",1),("ML 2\" Mortar","Britain",1),("MG Team","Britain",6),("M5 Half-Track","Britain",4)], 1),
   ("Recon", [("Stuart V or VI","Britain",3)], 1),
   ("Artillery", [("Sexton","Britain",3),("Forward Observer","Britain",1),("Universal Carrier","Britain",1)], 1)],
}


def force_total(units, plts):
    """Displayed (÷2) force total; platoons rounded then summed, as the app does."""
    disp = 0; n = 0
    for _, teams, mult in plts:
        praw = sum(C(units, nm, nat) * q for nm, nat, q in teams)
        disp += round(praw / DISPLAY_DIV) * mult; n += mult
    return disp, n


def cmd_forces(units):
    res = {fn: force_total(units, plts) for fn, plts in FORCES.items()}
    print("FORCE TOTALS (÷%d)\n" % DISPLAY_DIV)
    for fn, (t, n) in sorted(res.items(), key=lambda x: -x[1][0]):
        print("  %-14s %3d   (%d units, BL %d)" % (fn, t, n, 5 + 2 * n))
    lo = min(t for t, _ in res.values()); hi = max(t for t, _ in res.values())
    print("  spread: %d .. %d (%d)" % (lo, hi, hi - lo))
    print("\nHANDICAP = round(gap / %d) Break Limit on the stronger force:" % GAP_PER_BL)
    names = list(res)
    for a, b in itertools.combinations(names, 2):
        gap = abs(res[a][0] - res[b][0]); bl = round(gap / GAP_PER_BL)
        if bl: print("  %-14s vs %-14s  gap %2d -> -%d BL" % (a, b, gap, bl))


def cmd_ladder(units):
    sher = C(units, "M4 Sherman", "United States")
    print("HEAVY LADDER (raw, ×Sherman)\n")
    for nm, nat in [("M4 Sherman","United States"),("StuG G or IV","Germany"),("Panzer IV H","Germany"),
                    ("Panther","Germany"),("M26 Pershing","United States"),("IS-2","Soviet Union"),
                    ("Elefant","Germany"),("Tiger II","Germany"),("Jagdtiger","Germany")]:
        v = C(units, nm, nat)
        print("  %-16s %6.1f  %.2fx" % (nm, v, v / sher))


def cmd_team(units, name):
    hit = [(n, nat) for (n, nat) in units if n.lower() == name.lower()] or \
          [(n, nat) for (n, nat) in units if name.lower() in n.lower()]
    for n, nat in hit:
        p = score(units[(n, nat)], parts=True)
        print("%-26s %-14s  raw %s  (÷%d = %d)" % (n, nat, p["total"], DISPLAY_DIV, round(p["total"]/DISPLAY_DIV)))
        print("   AI %s  AT %s  MG %s  fpBonus %s  barrage %s  defResid %s  mob %s  longevity %s"
              % (p["ai"], p["at"], p["mg"], p["fpb"], p["bar"], p["defr"], p["mob"], p["lon"]))


def cmd_breakdown(units, force):
    plts = FORCES.get(force) or next((v for k, v in FORCES.items() if force.lower() in k.lower()), None)
    if not plts: print("unknown force:", force, "\noptions:", ", ".join(FORCES)); return
    tot = 0
    for lab, teams, mult in plts:
        praw = 0
        print("\n %s%s" % (lab, "  x%d" % mult if mult > 1 else ""))
        for nm, nat, q in teams:
            t = C(units, nm, nat); praw += t * q
            print("    %2d x %-26s raw %5.1f" % (q, nm, t))
        pd = round(praw / DISPLAY_DIV); tot += pd * mult
        print("    -> platoon raw %.1f  ÷%d = %d" % (praw, DISPLAY_DIV, pd))
    print("\n  FORCE TOTAL (÷%d): %d" % (DISPLAY_DIV, tot))


def main():
    units = load()
    cmd = sys.argv[1] if len(sys.argv) > 1 else "forces"
    if   cmd == "forces":    cmd_forces(units)
    elif cmd == "ladder":    cmd_ladder(units)
    elif cmd == "team":      cmd_team(units, " ".join(sys.argv[2:]))
    elif cmd == "breakdown": cmd_breakdown(units, " ".join(sys.argv[2:]))
    else: print(__doc__)

if __name__ == "__main__":
    main()
