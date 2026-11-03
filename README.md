# Wizard's Quiz Academy

A quiz castle for curious minds. Geography is still here — the 50 US states, the 18 regions of France, and the 47 prefectures of Japan — and two new subjects sit beside the maps: advanced vocabulary (English or French) and number-pattern logic.

Open `index.html`. The academy doors are the home screen. You can also jump straight in with a hash: `#us`, `#fr`, `#jp`, `#vocab-en`, `#vocab-fr`, or `#logic`.

## Subjects

- **Geography.** Tap the place Rowan names. A streak adds bonus house points. Two misses make the answer glow. Missed places go to **Practice missed**. **Explore** names whatever you tap. **Name tags** shows short labels. **Ask Rowan for a hint** gives direction, neighbours, water, and spelling, all worked out in the page. Zoom with **+ / −**, a two-finger pinch, or ctrl + mouse wheel.
- **Vocabulary.** A hard word, four choices, one real synonym. Pick English (100 words) or French (100 words). A wrong answer is plainly wrong; the note after you answer says why the synonym fits. One hint brushes a single distractor aside.
- **Logic.** 100 number sequences, from steady steps up to interleaved patterns and digit rules. Four choices, one next number. The rule is shown after you answer.

Every subject keeps a streak, a best score, a missed list, and a shelf of six relics. Those are saved per quiz in the browser. The four houses — Emberwyck, Verdant Hollow, Azure Quill, and Amberkeep — only change the accent colour.

## Question files

Vocabulary and logic follow the same pattern as the maps: a script that sets a global.

- `vocab-en.js` — `window.VOCAB_EN`
- `vocab-fr.js` — `window.VOCAB_FR`
- `logic.js` — `window.LOGIC_QUESTIONS`, generated from the rules in `scripts/logic-rules.js`

Check the banks (100 each, four unique choices, the correct answer among them, logic recomputed from its rule):

```bash
node scripts/validate-questions.js
```

Regenerate `logic.js` after editing a rule:

```bash
node scripts/logic-rules.js
```

## Maps and libraries

Libraries in `lib/` (d3, topojson-client, canvas-confetti, all ISC licence) are stored in the repo so the game also runs through [htmlpreview.github.io](https://htmlpreview.github.io/?https://github.com/Bolotaure/Geography-test/blob/main/index.html), which only loads scripts kept in GitHub.

US map: `us-states.js`, from `us-atlas`. France map: `fr-regions.js`, simplified from [gregoiredavid/france-geojson](https://github.com/gregoiredavid/france-geojson) (Licence Ouverte / Etalab). Japan map: `jp-prefectures.js`, simplified from [dataofjapan/land](https://github.com/dataofjapan/land).

The owl, relics, and castle are original drawings in the page. No studio logos, film stills, or proprietary fonts.
