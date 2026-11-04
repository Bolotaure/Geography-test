# Wizard's Quiz Academy

A quiz castle for curious minds. Geography is still here — the 50 US states, the 18 regions of France, and the 47 prefectures of Japan — beside advanced vocabulary, number-pattern logic, and French conjugation.

Open `index.html`. The home screen is a winding lesson path. **Choose a quiz** picks the course. You can also jump with a hash: `#us`, `#fr`, `#jp`, `#vocab-en`, `#vocab-fr`, `#logic`, `#conj`, `#mixed`, or `#home` (last course).

Each course keeps its own score, streak, found questions, and relics in the browser. Lessons are ten questions along a stable order, so a saved quest still lines up with the path. A day streak counts each local day you finish a lesson. The bottom bar opens Learn, Relics, and Profile.

## Subjects

- **Lessons.** Tap the glowing node. Pick an answer, then **Check**. A green or red banner shows the result and **Continue**. Ten questions end on a summary with XP, accuracy, and any new relic. Hearts run out after five misses.
- **Geography.** The lesson names a place. Tap it, then Check. **Explore** names whatever you tap. **Name tags** shows short labels. **Ask Rowan for a hint** gives direction, neighbours, water, and spelling. Zoom with **+ / −**, a two-finger pinch, or ctrl + mouse wheel.
- **Vocabulary.** A hard word, four choices, one real synonym. English and French each have 100 words. After Check, a wrong choice keeps its info mark, with a definition and an example.
- **Logic.** 100 number sequences, grouped as Apprentice, Scholar, and Archmage. The rule appears in the banner after Check.
- **French conjugation.** 100 checked forms: présent, futur, imparfait, passé composé, infinitif, and participe passé. Regular -er and -ir verbs sit with the common irregulars. Passé composé with être agrees in the masculine, and vous is treated as masculine singular.
- **Mixed quest.** The path walks every subject in turn: US states, French regions, Japanese prefectures, English synonyms, French synonyms, number charms, and French conjugation. The lesson switches between the card and the map.
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
