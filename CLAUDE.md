# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Liv ai

A PWA that scans food via camera and shows how many minutes of life each serving adds or removes. Uses GPT-4o Vision to identify food and estimate nutrition, then scores it using the Spiegelhalter (2012) BMJ microlife framework.

The numbers represent **per-serving impact on total life expectancy** — one banana ≈ +33 min, one cigarette ≈ -11 min (same epidemiological framework). These accumulate: daily consumption × days = total lifespan impact.

## Serving

```
cd ~/lifespan && python3 -m http.server 8090
```

No build step. No bundler. No framework. Tailwind via CDN. Open on phone via `http://<local-ip>:8090`.

## Architecture

Four files, no dependencies:

- **index.html** — entire UI (HTML + inline Tailwind + all JS logic in a `<script type="module">` block). Manages overlays (onboarding, result, settings, camera, loading, shared result) by toggling `hidden` class. All state in `localStorage`.
- **microlife.js** — pure scoring function. Takes a nutrition JSON object, returns `{ minutes, factors[] }`. Factors stack additively.
- **api.js** — single GPT-4o Vision API call. Sends base64 JPEG, expects structured JSON nutrition response. API key from localStorage.
- **manifest.json** — PWA manifest for "Add to Home Screen".

## Data flow

Scan → camera capture/file input → base64 JPEG → `api.js:analyzeFood()` → nutrition JSON → `microlife.js:score()` → `{ minutes, factors }` → result overlay + history + Life Bar update → persist to localStorage.

## Scoring table (microlife.js)

| Factor | Minutes |
|---|---|
| Fruit/veg serving | +30 |
| Processed meat serving | -30 |
| Red meat serving (non-processed) | -15 |
| Per 5g saturated fat (above 2g) | -9 |
| Per 1g trans fat | -15 |
| Per 500mg sodium (above 500mg) | -6 |
| Per 10g added sugar (above 5g) | -4.5 |
| Per 5g fibre | +6 |
| Whole food bonus | +3 |

## localStorage keys

- `openai_api_key` — user's OpenAI API key (entered via settings overlay)
- `lifespan_profile` — JSON: name, age, gender, weight, height (collected at onboarding, reserved for future personalization)
- `lifespan_history` — JSON array of scan entries (food_name, portion, minutes, factors, calories, timestamp)

## Design system

- Dark theme: `#0a0a0a` background, white text
- Green `#22c55e` (gain/positive), Red `#ef4444` (loss/negative)
- Inter font, Tailwind utility classes
- UI pattern: single screen + overlay system (no routing)

## Share feature

Results can be shared via Web Share API (native share sheet) with clipboard fallback. Shared links encode food/minutes/portion as URL params. Opening a shared link shows a landing overlay prompting the recipient to scan their own food.
