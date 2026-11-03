# Wizard's Quiz Academy

A quiz castle for curious minds. Geography is still here — the 50 US states, the 18 regions of France, and the 47 prefectures of Japan — and two new subjects sit beside the maps: advanced vocabulary (English or French) and number-pattern logic.

Open `index.html`. Pick a quiz from **Choose a quiz**. You can also jump straight in with a hash: `#us`, `#fr`, `#jp`, `#vocab-en`, `#vocab-fr`, `#logic`, `#conj`, or `#mixed`.

Each quiz keeps its own score, streak, place in the queue, and relics in the browser. Leave and come back, and that quiz resumes. Play again starts the queue over and keeps the relics you already earned.

## Subjects

- **Geography.** Tap the place Rowan names. A streak adds bonus house points. Two misses make the answer glow. Missed places go to **Practice missed**. **Explore** names whatever you tap. **Name tags** shows short labels. **Ask Rowan for a hint** gives direction, neighbours, water, and spelling, all worked out in the page. Zoom with **+ / −**, a two-finger pinch, or ctrl + mouse wheel.
- **Vocabulary.** A hard word, four choices, one real synonym. Pick English (100 words) or French (100 words). A wrong answer is plainly wrong; the note after you answer says why the synonym fits. One hint brushes a single distractor aside.
- **Logic.** 100 number sequences, from steady steps up to interleaved patterns and digit rules. Four choices, one next number. The rule is shown after you answer.
- **French conjugation.** 100 checked forms: présent, futur, imparfait, passé composé, infinitif, and participe passé. Regular -er and -ir verbs sit with the common irregulars. Passé composé with être agrees in the masculine, and vous is treated as masculine singular.
- **Mixed quest.** French vocabulary, a number charm, a US state, and a French region, then round again. The page switches between the card and the map.
- **Synonym notes.** After an English or French answer, each choice has an info mark with a definition and an example sentence.

The four houses — Emberwyck, Verdant Hollow, Azure Quill, and Amberkeep — only change the accent colour.

## Question files

Vocabulary and logic follow the same pattern as the maps: a script that sets a global.

- `vocab-en.js` — `window.VOCAB_EN`
- `vocab-fr.js` — `window.VOCAB_FR`
- `logic.js` — `window.LOGIC_QUESTIONS`, generated from the rules in `scripts/logic-rules.js`
- `conj-fr.js` — `window.CONJ_FR`, generated from `scripts/conjugation-rules.js`
- `vocab-en-lex.js` and `vocab-fr-lex.js` — a definition and an example for every synonym choice

Check the banks (100 each, four unique choices, the correct answer among them, logic recomputed from its rule):

```bash
node scripts/validate-questions.js
```

Regenerate a bank after editing its rules:

```bash
node scripts/logic-rules.js
node scripts/conjugation-rules.js
```

## Maps and libraries

Libraries in `lib/` (d3, topojson-client, canvas-confetti, all ISC licence) are stored in the repo so the game also runs through [htmlpreview.github.io](https://htmlpreview.github.io/?https://github.com/Bolotaure/Geography-test/blob/main/index.html), which only loads scripts kept in GitHub.

US map: `us-states.js`, from `us-atlas`. France map: `fr-regions.js`, simplified from [gregoiredavid/france-geojson](https://github.com/gregoiredavid/france-geojson) (Licence Ouverte / Etalab). Japan map: `jp-prefectures.js`, simplified from [dataofjapan/land](https://github.com/dataofjapan/land).

The owl, the relics in `relics.js`, and the castle are original drawings. No studio logos, film stills, or proprietary fonts.
