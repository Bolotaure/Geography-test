# Geography-test

## Capy's Map Safari

A kids' geography game, recreated from [Capy's State Safari](https://cappystates.lovable.app),
with a second test added: the 18 regions of France (13 in mainland France + 5 overseas).

Open `index.html` and pick a test with the **🇺🇸 US States / 🇫🇷 French Regions** buttons
(or the *Activities* menu, or the `#us` / `#fr` URL hash).

- Click the place Capy names. Streaks give bonus points; every level unlocks a squishy.
- Two misses make the answer glow. Missed places go into **Practice Missed**.
- **Explore Mode** names whatever you tap; **Name Tags** shows short labels.
- **Ask Capy for a hint** gives direction, neighbours, water and spelling hints, all worked out in the
  page (the original used an online AI for hints).
- Score, best score, missed list and squishies are saved per test in the browser.

US map: `us-states.js`, from `us-atlas`. France map: `fr-regions.js`, simplified from
[gregoiredavid/france-geojson](https://github.com/gregoiredavid/france-geojson) (Licence Ouverte / Etalab).
