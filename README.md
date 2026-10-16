# Geography-test

## Capy's Map Safari

A kids' geography game, recreated from [Capy's State Safari](https://cappystates.lovable.app),
with two more tests added: the 18 regions of France (13 in mainland France + 5 overseas)
and the 47 prefectures of Japan (Okinawa in a box, as on Japanese school maps).

Open `index.html` and pick a test with the **🇺🇸 US States / 🇫🇷 French Regions / 🇯🇵 Japanese Prefectures** buttons
(or the *Activities* menu, or the `#us` / `#fr` / `#jp` URL hash).

- Click the place Capy names. Streaks give bonus points; every level unlocks a squishy.
- Two misses make the answer glow. Missed places go into **Practice Missed**.
- **Explore Mode** names whatever you tap; **Name Tags** shows short labels.
- **Ask Capy for a hint** gives direction, neighbours, water and spelling hints, all worked out in the
  page (the original used an online AI for hints).
- Zoom the map with the **+ / −** buttons, a two-finger pinch, or ctrl + mouse wheel.
- Score, best score, missed list and squishies are saved per test in the browser.

Libraries in `lib/` (d3, topojson-client, canvas-confetti, all ISC licence) are stored in the repo so the game also runs through
[htmlpreview.github.io](https://htmlpreview.github.io/?https://github.com/Bolotaure/Geography-test/blob/main/index.html), which only loads scripts kept in GitHub.

US map: `us-states.js`, from `us-atlas`. France map: `fr-regions.js`, simplified from
[gregoiredavid/france-geojson](https://github.com/gregoiredavid/france-geojson) (Licence Ouverte / Etalab).
Japan map: `jp-prefectures.js`, simplified from [dataofjapan/land](https://github.com/dataofjapan/land).
