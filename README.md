# Wizard's Quiz Academy

A quiz castle for curious minds. Geography is still here — the 50 US states, the 18 regions of France, and the 47 prefectures of Japan — beside advanced vocabulary, number-pattern logic, and French conjugation.

Open `index.html`. The home path is twenty lessons. Each lesson is a unit of seven levels, and the type changes at every node: États, Régions, Préfectures, Anglais, Français, Nombres, then Conjugaison. A node is the five questions of that type's Leçon N. Finishing all seven unlocks the next lesson. **Choose a quiz** still opens a single subject. Hashes: `#home` or `#mixed` for the main path, or `#us`, `#fr`, `#jp`, `#vocab-en`, `#vocab-fr`, `#logic`, `#conj`.

Each course keeps its own score, streak, found questions, and relics in the browser. A day streak counts each local day you finish a lesson. The bottom bar opens Learn, Relics, and Profile. An older save keeps its score and any question it already knew; new questions are added to the path.

## Subjects

- **Lessons.** Every subject has 100 questions in 20 lessons of five. The node shows the lesson number. Tap it, pick an answer, then **Check**. A green or red banner shows the result and **Continue**. The summary shows XP, accuracy, and any new relic. Hearts run out after five misses.
- **Geography.** The lesson names a place. Tap it, then Check. **Explore** names whatever you tap. **Name tags** shows short labels. **Ask Rowan for a hint** gives direction, neighbours, water, and spelling. Zoom with **+ / −**, a two-finger pinch, or ctrl + mouse wheel.
- **Vocabulary.** A hard word, four choices, one real synonym. English and French each have 100 words. The two lists do not share a prompt, an answer, or an obvious cognate of the same word (éphémère does not sit beside ephemeral). After Check, the banner includes an example sentence that uses the prompt word, right or wrong. A wrong choice also keeps its info mark, with a definition and an example.
- **Relics.** The reward counts are unchanged. One relic every 8 new correct answers for US states and Japanese prefectures (8, 16, 24, 32, 40, 48), every 3 for French regions (3, 6, 9, 12, 15, 18), every 15 for English, French, numbers, and verbs (15, 30, 45, 60, 75, 90), and every 40 on the mixed course. A question you already got right does not count again, and finishing a lesson does not give a relic by itself. On a map, finding the last place also unlocks any relic still locked.
- **Logic.** 100 number sequences, grouped as Apprentice, Scholar, and Archmage. The rule appears in the banner after Check.
- **French conjugation.** 100 checked forms: présent, futur, imparfait, passé composé, infinitif, and participe passé. Regular -er and -ir verbs sit with the common irregulars. Passé composé with être agrees in the masculine, and vous is treated as masculine singular.
- **Home path.** Leçon N holds seven nodes, one per subject, in that order. Two nodes in a row are never the same type. The questions are the same five as that subject's own Leçon N, so finishing a node fills the same progress as playing it inside the subject, and the other way around.
- **Synonym notes.** After an English or French answer, each choice has an info mark with a definition and an example sentence.

The four houses — Emberwyck, Verdant Hollow, Azure Quill, and Amberkeep — only change the accent colour.

## Question files

Vocabulary and logic follow the same pattern as the maps: a script that sets a global.

- `vocab-en.js` — `window.VOCAB_EN`
- `vocab-fr.js` — `window.VOCAB_FR`
- `logic.js` — `window.LOGIC_QUESTIONS`, generated from the rules in `scripts/logic-rules.js`
- `conj-fr.js` — `window.CONJ_FR`, generated from `scripts/conjugation-rules.js`
- `us-questions.js`, `fr-questions.js`, `jp-questions.js` — 100 questions each, generated from `scripts/geo-questions.js`
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
