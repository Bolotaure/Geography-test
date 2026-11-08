# Wizard's Quiz Academy

A quiz castle for curious minds. Geography is still here — the 50 US states, the 18 regions of France, and the 47 prefectures of Japan — beside advanced vocabulary, number-pattern logic, and French conjugation.

The live page is [bolotaure.github.io/Geography-test](https://bolotaure.github.io/Geography-test/). Open `index.html` locally for the same app. Everything the player sees is in that one file. Question banks are separate scripts.

On a phone or tablet the app works only upright. Turn it sideways and a portrait screen covers the quiz until you rotate it back.

## Home

The home screen is a list of eight quizzes. **Grand Quest** is first. Each card is split in two: on the left the title, the next lesson (1 to 21 for Grand Quest, 1 to 20 for the others) and a progress bar; on the right the same image as that quiz's banner. Tap a card and the screen fades through black into that quiz. The home icon fades back through black.

The title stays pinned above the banner. Inside a quiz, the page itself does not scroll: the title and the banner stay fixed and only the lesson path scrolls, so the browser bars never collapse. Inside a quiz the title is centred, with the home icon to its left and the menu button to its right. On home the title sits on the left and the menu button to its right. It opens four items:

- **Reset a quiz.** From home, pick which quiz to clear. Inside a quiz, it resets that quiz. Either way it asks first, and nothing behind the question can scroll or move while it is open. Score, progress, and relics for that quiz go back to the start. Other quizzes are left alone.
- **Relics.** Opens as a sheet over the page, like Reset, with its own home icon.
- **Profile.** Opens as a sheet over the page, with its own home icon. Choose a house. The house only changes the accent colour: Emberwyck, Verdant Hollow, Azure Quill, or Amberkeep.
- **Display.** Opens Dark or Light. Dark is the default; the choice is kept in the browser (`wqa-theme`). The menu itself is dark in Dark and cream in Light.

There is no bottom tab bar.

Hashes: `#home`, `#mixed` (Grand Quest), `#us`, `#fr`, `#jp`, `#vocab-en`, `#vocab-fr`, `#logic`, `#conj`.

## A quiz

Every quiz has lessons of 5 questions in three sections. Grand Quest has 21 lessons; every other quiz has 20.

| Section | Lessons |
|---|---|
| Apprentice | 1–7 |
| Scholar | 8–14 |
| Archmage | 15–20 (Grand Quest: 15–21) |

The next lesson of a quiz opens only when the previous one is finished. Finishing a lesson in one quiz does not unlock or lock another. The owl stands just to the right of the current lesson.

Tap a lesson, pick an answer, then **Check**. A banner shows the result and **Continue**. Leaving a lesson asks first. Correct answers stay saved. A day streak counts each local day you finish a lesson. Points and the day streak show under the banner.

Each quiz keeps its own score, found questions, and relics in the browser (`wqa-<quiz>-session` and the matching best, missed, and lesson-star keys). An older save keeps its score and any question it already knew.

### Grand Quest

Three series of seven lessons, one per section. Each lesson is a single subject, always in this order: French synonyms, English synonyms, Number Charms, State Atlas, Regions of France, Prefectures of Japan, French conjugation. Lesson N uses the five questions of that subject's own lesson N (lesson 21 uses conjugation lesson 20), so the two quizzes share questions but not progress, relics, or unlocks.

### Geography

State Atlas, Regions of France, and Prefectures of Japan. The lesson names a place. Tap it, then Check. **Explore** names whatever you tap. **Name tags** shows short labels. **Ask Rowan for a hint** gives direction, neighbours, water, and spelling. A wrong tap says which region the answer is in and one place it touches. Zoom with **+ / −**, a two-finger pinch, or ctrl + mouse wheel.

### Vocabulary

A hard word, four choices, one real synonym. English and French each have 100 words. The two lists do not share a prompt, an answer, or an obvious cognate of the same word (éphémère does not sit beside ephemeral). After Check, the banner includes an example sentence that uses the prompt word, right or wrong. A wrong choice also keeps its info mark, with a definition and an example. The French quiz is in French.

### Number Charms

100 number sequences. The rule appears in the banner after Check.

### French conjugation

100 checked forms: présent, futur, imparfait, passé composé, infinitif, and participe passé. Consecutive questions change verb and do not repeat the same tense. A lesson uses at least three tenses. Ending in -ir is not the 2e groupe: partir and aller are 3e groupe. Passé composé with être agrees in the masculine, and vous is treated as masculine singular. The quiz chrome is in French.

## Relics

Relics are not shared between quizzes.

- **Grand Quest** has twenty-one relics, one when you finish each of its lessons.
- **Every other quiz** has three relics, one when you finish a whole section: Apprentice, Scholar, or Archmage.

A question you already got right does not count again. The relic shelf in the menu shows only the relics for the quiz you are in, or every quiz when you open it from home.

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

The owl, the relics in `relics.js`, and the castle are original drawings. Each quiz's lesson path sits on its own background picture, `img/bg-<quiz>.webp`, generated for this project. The pictures are square and shown whole, fixed in the space under the banner. They show behind the path and the Relics and Profile screens of that quiz, not on home or during a lesson. No studio logos, film stills, or proprietary fonts. The interface uses [Nunito](https://fonts.google.com/specimen/Nunito).
