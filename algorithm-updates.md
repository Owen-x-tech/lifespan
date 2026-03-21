# Algorithm & Scoring Updates Log

Ongoing record of changes to `microlife.js` scoring and related logic. Each entry captures what changed, why, and the evidence behind it — so we can trace what's been tried and revisit decisions.

---

## 2026-03-21 — Fruit/veg scoring reduced from +15 to +7 min/serving

**Problem:** Scanning a banana returned +30 min (2 servings x +15). Laughably high — undermines credibility.

**Root cause:** The +15 min/serving value was attributed to "HENI midpoint for fruits" but was ~2x the actual literature consensus.

**Literature review:**

| Source | Per-serving estimate |
|--------|---------------------|
| Fadnes 2022 (PLOS Medicine) — life-table modeling, fruit optimal 400g/day vs typical 200g/day | ~7.5 min |
| Spiegelhalter 2012 — microlives (~0.2 microlives per serving) | ~6 min |
| GBD 2019 dietary risk factors | ~4-8 min |
| Wang 2021 (Circulation) — meta-analysis of 26 cohorts, HR 0.87 at 5 servings/day | supports ~6-8 min range |

**Conversion math (Fadnes 2022):**
- Optimal fruit = 400g/day (~5 servings), typical = 200g/day (~2.5 servings)
- Fruit contribution to life expectancy: ~0.5-0.8 years for a 20-year-old
- Extra servings over 50 years: 2.5/day x 365 x 50 = 45,625
- 0.65 years x 525,600 min/year = 341,640 min / 45,625 servings = **~7.5 min/serving**

**Change:** `microlife.js` line 43 — `fvServings * 15` → `fvServings * 7`

**Impact:**

| Food | Before | After |
|------|--------|-------|
| 1 banana (1 serving) | +15 min | +7 min |
| Mixed salad (3 servings) | +45 min | +21 min |
| 5 servings fruit/veg (cap) | +75 min | +35 min |

**Decision on fibre/sugar skip logic:** Kept unchanged. At +7 min the categorical score is conservative enough that the skip guards (no separate fibre bonus or sugar penalty when fruit/veg present) remain appropriate.
