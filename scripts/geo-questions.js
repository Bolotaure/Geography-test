// Geography question banks: 100 items each, lessons 1–20, five questions each.
// Map finds keep the old place id so a saved quest still counts.
// Facts are the tables below. Regenerating rewrites us/fr/jp-questions.js.
"use strict";

const fs = require("fs");
const path = require("path");

const US = {
  "01": ["Alabama", "Montgomery"], "02": ["Alaska", "Juneau"], "04": ["Arizona", "Phoenix"],
  "05": ["Arkansas", "Little Rock"], "06": ["California", "Sacramento"], "08": ["Colorado", "Denver"],
  "09": ["Connecticut", "Hartford"], "10": ["Delaware", "Dover"], "12": ["Florida", "Tallahassee"],
  "13": ["Georgia", "Atlanta"], "15": ["Hawaii", "Honolulu"], "16": ["Idaho", "Boise"],
  "17": ["Illinois", "Springfield"], "18": ["Indiana", "Indianapolis"], "19": ["Iowa", "Des Moines"],
  "20": ["Kansas", "Topeka"], "21": ["Kentucky", "Frankfort"], "22": ["Louisiana", "Baton Rouge"],
  "23": ["Maine", "Augusta"], "24": ["Maryland", "Annapolis"], "25": ["Massachusetts", "Boston"],
  "26": ["Michigan", "Lansing"], "27": ["Minnesota", "St. Paul"], "28": ["Mississippi", "Jackson"],
  "29": ["Missouri", "Jefferson City"], "30": ["Montana", "Helena"], "31": ["Nebraska", "Lincoln"],
  "32": ["Nevada", "Carson City"], "33": ["New Hampshire", "Concord"], "34": ["New Jersey", "Trenton"],
  "35": ["New Mexico", "Santa Fe"], "36": ["New York", "Albany"], "37": ["North Carolina", "Raleigh"],
  "38": ["North Dakota", "Bismarck"], "39": ["Ohio", "Columbus"], "40": ["Oklahoma", "Oklahoma City"],
  "41": ["Oregon", "Salem"], "42": ["Pennsylvania", "Harrisburg"], "44": ["Rhode Island", "Providence"],
  "45": ["South Carolina", "Columbia"], "46": ["South Dakota", "Pierre"], "47": ["Tennessee", "Nashville"],
  "48": ["Texas", "Austin"], "49": ["Utah", "Salt Lake City"], "50": ["Vermont", "Montpelier"],
  "51": ["Virginia", "Richmond"], "53": ["Washington", "Olympia"], "54": ["West Virginia", "Charleston"],
  "55": ["Wisconsin", "Madison"], "56": ["Wyoming", "Cheyenne"],
};

const FR = {
  "11": ["Île-de-France", "Paris"],
  "24": ["Centre-Val de Loire", "Orléans"],
  "27": ["Bourgogne-Franche-Comté", "Besançon"],
  "28": ["Normandie", "Rouen"],
  "32": ["Hauts-de-France", "Lille"],
  "44": ["Grand Est", "Strasbourg"],
  "52": ["Pays de la Loire", "Nantes"],
  "53": ["Bretagne", "Rennes"],
  "75": ["Nouvelle-Aquitaine", "Bordeaux"],
  "76": ["Occitanie", "Toulouse"],
  "84": ["Auvergne-Rhône-Alpes", "Lyon"],
  "93": ["Provence-Alpes-Côte d'Azur", "Marseille"],
  "94": ["Corse", "Ajaccio"],
  "01": ["Guadeloupe", "Basse-Terre"],
  "02": ["Martinique", "Fort-de-France"],
  "03": ["Guyane", "Cayenne"],
  "04": ["La Réunion", "Saint-Denis"],
  "06": ["Mayotte", "Mamoudzou"],
};

const JP = {
  "01": ["Hokkaido", "Sapporo"], "02": ["Aomori", "Aomori"], "03": ["Iwate", "Morioka"],
  "04": ["Miyagi", "Sendai"], "05": ["Akita", "Akita"], "06": ["Yamagata", "Yamagata"],
  "07": ["Fukushima", "Fukushima"], "08": ["Ibaraki", "Mito"], "09": ["Tochigi", "Utsunomiya"],
  "10": ["Gunma", "Maebashi"], "11": ["Saitama", "Saitama"], "12": ["Chiba", "Chiba"],
  "13": ["Tokyo", "Tokyo"], "14": ["Kanagawa", "Yokohama"], "15": ["Niigata", "Niigata"],
  "16": ["Toyama", "Toyama"], "17": ["Ishikawa", "Kanazawa"], "18": ["Fukui", "Fukui"],
  "19": ["Yamanashi", "Kofu"], "20": ["Nagano", "Nagano"], "21": ["Gifu", "Gifu"],
  "22": ["Shizuoka", "Shizuoka"], "23": ["Aichi", "Nagoya"], "24": ["Mie", "Tsu"],
  "25": ["Shiga", "Otsu"], "26": ["Kyoto", "Kyoto"], "27": ["Osaka", "Osaka"],
  "28": ["Hyogo", "Kobe"], "29": ["Nara", "Nara"], "30": ["Wakayama", "Wakayama"],
  "31": ["Tottori", "Tottori"], "32": ["Shimane", "Matsue"], "33": ["Okayama", "Okayama"],
  "34": ["Hiroshima", "Hiroshima"], "35": ["Yamaguchi", "Yamaguchi"], "36": ["Tokushima", "Tokushima"],
  "37": ["Kagawa", "Takamatsu"], "38": ["Ehime", "Matsuyama"], "39": ["Kochi", "Kochi"],
  "40": ["Fukuoka", "Fukuoka"], "41": ["Saga", "Saga"], "42": ["Nagasaki", "Nagasaki"],
  "43": ["Kumamoto", "Kumamoto"], "44": ["Oita", "Oita"], "45": ["Miyazaki", "Miyazaki"],
  "46": ["Kagoshima", "Kagoshima"], "47": ["Okinawa", "Naha"],
};

function arrange(answer, wrong) {
  if (!Array.isArray(wrong) || wrong.length !== 3) throw new Error("need 3 distractors for " + answer);
  if (wrong.includes(answer) || new Set(wrong).size !== 3) throw new Error("bad distractors for " + answer);
  let h = 0;
  for (const c of String(answer)) h = (h + c.charCodeAt(0)) % 4;
  const opts = wrong.slice();
  opts.splice(h, 0, answer);
  return opts;
}

function mapItem(table, geo, lesson) {
  const name = table[geo][0];
  return {
    id: geo, lesson, kind: "map", format: "map", geoId: geo,
    prompt: "Find " + name + " on the map.",
    explain: name + " is the place to tap.",
  };
}

function mcqItem(table, spec) {
  const answer = spec.answer || table[spec.geo][spec.field || 0];
  return {
    id: spec.id, lesson: spec.lesson, kind: "mcq", format: spec.format, geoId: spec.geo || "",
    prompt: spec.prompt, choices: arrange(answer, spec.wrong), answer,
    explain: spec.explain || (answer + " is the right one."),
  };
}

function finish(table, items, prefix) {
  if (items.length !== 100) throw new Error(prefix + " has " + items.length);
  const seen = new Set();
  const buckets = {};
  items.forEach(q => {
    if (seen.has(q.id)) throw new Error("duplicate " + q.id);
    seen.add(q.id);
    if (!q.explain.includes(q.kind === "map" ? table[q.geoId][0] : q.answer)) {
      throw new Error(q.id + " explain misses the answer");
    }
    if (q.kind === "map" && !table[q.geoId]) throw new Error("unknown place " + q.geoId);
    if (q.kind === "mcq" && q.choices.filter(c => c === q.answer).length !== 1) throw new Error("answer missing " + q.id);
    buckets[q.lesson] = (buckets[q.lesson] || 0) + 1;
  });
  for (let n = 1; n <= 20; n++) if (buckets[n] !== 5) throw new Error(prefix + " lesson " + n + " has " + buckets[n]);
  const ordered = items.slice().sort((a, b) => a.lesson - b.lesson || String(a.id).localeCompare(String(b.id)));
  // Keep authored order within a lesson; only check lessons increase across the array.
  let prev = 0;
  items.forEach(q => {
    if (q.lesson < prev) throw new Error(prefix + " lesson went backwards at " + q.id);
    prev = q.lesson;
  });
  return items;
}

function buildUS() {
  const maps = [
    ["06", "48", "12", "36", "02"],
    ["15", "53", "08", "17", "26"],
    ["13", "42", "39", "37", "04"],
    ["41", "32", "35", "49", "22"],
    ["25", "51", "47", "21", "55"],
    ["27", "29", "18", "01", "45"],
    ["24", "34", "09", "40", "19"],
    ["20", "05", "28", "31", "54"],
    ["16", "30", "56", "23", "33"],
    ["50", "44", "10", "38", "46"],
  ].flatMap((row, i) => row.map(geo => mapItem(US, geo, i + 1)));
  const caps = [
    ["13", 11, ["Savannah", "Augusta", "Macon"], "Atlanta is the capital of Georgia."],
    ["08", 11, ["Boulder", "Aspen", "Colorado Springs"], "Denver is the capital of Colorado."],
    ["25", 11, ["Cambridge", "Worcester", "Springfield"], "Boston is the capital of Massachusetts."],
    ["15", 11, ["Hilo", "Kailua", "Lahaina"], "Honolulu is the capital of Hawaii."],
    ["49", 11, ["Provo", "Ogden", "Park City"], "Salt Lake City is the capital of Utah."],
    ["48", 12, ["Houston", "Dallas", "San Antonio"], "Austin is the capital of Texas. Houston is larger, but it is not the capital."],
    ["47", 12, ["Memphis", "Knoxville", "Chattanooga"], "Nashville is the capital of Tennessee."],
    ["39", 12, ["Cleveland", "Cincinnati", "Toledo"], "Columbus is the capital of Ohio."],
    ["04", 12, ["Tucson", "Flagstaff", "Mesa"], "Phoenix is the capital of Arizona."],
    ["35", 12, ["Albuquerque", "Las Cruces", "Roswell"], "Santa Fe is the capital of New Mexico. Albuquerque is larger."],
    ["36", 13, ["New York City", "Buffalo", "Rochester"], "Albany is the capital of New York. New York City is not the capital."],
    ["06", 13, ["Los Angeles", "San Francisco", "San Diego"], "Sacramento is the capital of California."],
    ["17", 13, ["Chicago", "Rockford", "Peoria"], "Springfield is the capital of Illinois. Chicago is not the capital."],
    ["12", 13, ["Miami", "Orlando", "Tampa"], "Tallahassee is the capital of Florida."],
    ["53", 13, ["Seattle", "Spokane", "Tacoma"], "Olympia is the capital of Washington. Seattle is not the capital."],
    ["42", 14, ["Philadelphia", "Pittsburgh", "Allentown"], "Harrisburg is the capital of Pennsylvania."],
    ["32", 14, ["Las Vegas", "Reno", "Henderson"], "Carson City is the capital of Nevada. Las Vegas is not the capital."],
    ["21", 14, ["Louisville", "Lexington", "Bowling Green"], "Frankfort is the capital of Kentucky."],
    ["24", 14, ["Baltimore", "Frederick", "Rockville"], "Annapolis is the capital of Maryland. Baltimore is not the capital."],
    ["22", 14, ["New Orleans", "Shreveport", "Lafayette"], "Baton Rouge is the capital of Louisiana."],
  ].map(([geo, lesson, wrong, explain]) => mcqItem(US, {
    id: "us-cap-" + geo, lesson, format: "capital", geo,
    prompt: "What is the capital of " + US[geo][0] + "?",
    answer: US[geo][1], wrong, explain,
  }));
  const cities = [
    ["Los Angeles", "06", 15, ["Nevada", "Arizona", "Oregon"]],
    ["Houston", "48", 15, ["Louisiana", "Oklahoma", "New Mexico"]],
    ["Chicago", "17", 15, ["Indiana", "Wisconsin", "Michigan"]],
    ["Seattle", "53", 15, ["Oregon", "Idaho", "California"]],
    ["Miami", "12", 15, ["Georgia", "Alabama", "South Carolina"]],
    ["Philadelphia", "42", 16, ["New Jersey", "Delaware", "Maryland"]],
    ["Detroit", "26", 16, ["Ohio", "Indiana", "Illinois"]],
    ["Boston", "25", 16, ["Rhode Island", "Connecticut", "New Hampshire"]],
    ["Denver", "08", 16, ["Utah", "Wyoming", "New Mexico"]],
    ["New Orleans", "22", 16, ["Mississippi", "Texas", "Alabama"]],
    ["Las Vegas", "32", 17, ["California", "Arizona", "Utah"]],
    ["Anchorage", "02", 17, ["Washington", "Hawaii", "Montana"]],
    ["Minneapolis", "27", 17, ["Wisconsin", "Iowa", "North Dakota"]],
    ["Atlanta", "13", 17, ["Alabama", "South Carolina", "Tennessee"]],
    ["San Francisco", "06", 17, ["Nevada", "Oregon", "Arizona"]],
  ].map(([city, geo, lesson, wrong]) => mcqItem(US, {
    id: "us-city-" + city.toLowerCase().replace(/[^a-z]+/g, "-"),
    lesson, format: "city", geo,
    prompt: "Which state is " + city + " in?",
    answer: US[geo][0], wrong,
    explain: city + " is in " + US[geo][0] + ".",
  }));
  const marks = [
    ["us-mark-canyon", 18, "The Grand Canyon is in which state?", "04", ["Utah", "Nevada", "Colorado"], "The Grand Canyon is in Arizona."],
    ["us-mark-gate", 18, "The Golden Gate Bridge is in which state?", "06", ["Oregon", "Washington", "Nevada"], "The Golden Gate Bridge is in California."],
    ["us-mark-liberty", 18, "Liberty Island, home of the Statue of Liberty, is part of which state?", "36", ["New Jersey", "Pennsylvania", "Connecticut"], "Liberty Island is part of New York, even though the statue faces New Jersey."],
    ["us-mark-alamo", 18, "The Alamo is in which state?", "48", ["New Mexico", "Arizona", "Oklahoma"], "The Alamo is in Texas, in San Antonio."],
    ["us-mark-quarter", 18, "The French Quarter is in which state?", "22", ["Mississippi", "Alabama", "Florida"], "The French Quarter is in Louisiana, in New Orleans."],
    ["us-mark-rushmore", 19, "Mount Rushmore is in which state?", "46", ["North Dakota", "Wyoming", "Montana"], "Mount Rushmore is in South Dakota."],
    ["us-mark-denali", 19, "Denali, the highest peak in the United States, is in which state?", "02", ["Washington", "Colorado", "Hawaii"], "Denali is in Alaska."],
    ["us-mark-needle", 19, "The Space Needle is in which state?", "53", ["Oregon", "California", "Idaho"], "The Space Needle is in Washington, in Seattle."],
    ["us-mark-arch", 19, "The Gateway Arch is in which state?", "29", ["Illinois", "Kansas", "Iowa"], "The Gateway Arch is in Missouri, in St. Louis."],
    ["us-mark-pearl", 19, "Pearl Harbor is in which state?", "15", ["California", "Alaska", "Florida"], "Pearl Harbor is in Hawaii, on Oahu."],
    ["us-mark-crater", 20, "Crater Lake is in which state?", "41", ["Washington", "California", "Idaho"], "Crater Lake is in Oregon."],
    ["us-mark-acadia", 20, "Acadia National Park is in which state?", "23", ["New Hampshire", "Vermont", "Massachusetts"], "Acadia National Park is in Maine."],
    ["us-mark-glades", 20, "The Everglades are in which state?", "12", ["Georgia", "Louisiana", "Alabama"], "The Everglades are in Florida."],
    ["us-mark-niagara", 20, "The United States side of Niagara Falls is in which state?", "36", ["Pennsylvania", "Ohio", "Michigan"], "The United States side of Niagara Falls is in New York."],
    ["us-mark-yellow", 20, "Most of Yellowstone National Park is in which state?", "56", ["Montana", "Idaho", "Colorado"], "Most of Yellowstone National Park is in Wyoming."],
  ].map(([id, lesson, prompt, geo, wrong, explain]) => mcqItem(US, {
    id, lesson, format: "landmark", geo, prompt, answer: US[geo][0], wrong, explain,
  }));
  return finish(US, maps.concat(caps, cities, marks), "US");
}

function buildFR() {
  const mapOrder = [
    ["11", "53", "94", "93", "84"],
    ["75", "76", "44", "32", "52"],
    ["28", "24", "27", "01", "02"],
    ["03", "04", "06"],
  ];
  const maps = [];
  mapOrder.forEach((row, i) => row.forEach(geo => maps.push(mapItem(FR, geo, i + 1))));
  const extra = [
    mcqItem(FR, { id: "fr-city-paris", lesson: 4, format: "city", geo: "11", prompt: "Which region is Paris in?", answer: FR["11"][0], wrong: ["Centre-Val de Loire", "Normandie", "Hauts-de-France"], explain: "Paris is in Île-de-France." }),
    mcqItem(FR, { id: "fr-city-lyon", lesson: 4, format: "city", geo: "84", prompt: "Which region is Lyon in?", answer: FR["84"][0], wrong: ["Provence-Alpes-Côte d'Azur", "Bourgogne-Franche-Comté", "Occitanie"], explain: "Lyon is in Auvergne-Rhône-Alpes." }),
  ];
  const caps = [
    ["11", 5, ["Versailles", "Lyon", "Orléans"]],
    ["84", 5, ["Grenoble", "Saint-Étienne", "Clermont-Ferrand"]],
    ["93", 5, ["Nice", "Toulon", "Avignon"]],
    ["76", 5, ["Montpellier", "Perpignan", "Nîmes"]],
    ["75", 5, ["Limoges", "Poitiers", "Bayonne"]],
    ["32", 6, ["Amiens", "Reims", "Rouen"]],
    ["52", 6, ["Rennes", "Angers", "Tours"]],
    ["44", 6, ["Metz", "Nancy", "Reims"]],
    ["53", 6, ["Brest", "Nantes", "Vannes"]],
    ["94", 6, ["Bastia", "Nice", "Marseille"]],
    ["28", 7, ["Caen", "Le Havre", "Cherbourg"]],
    ["24", 7, ["Tours", "Bourges", "Blois"]],
    ["27", 7, ["Dijon", "Lyon", "Besançon wait"]],
  ];
  // Fix Besançon distractors properly below — the placeholder above is invalid.
  caps.pop();
  const capItems = caps.map(([geo, lesson, wrong]) => mcqItem(FR, {
    id: "fr-cap-" + geo, lesson, format: "capital", geo,
    prompt: "What is the regional capital of " + FR[geo][0] + "?",
    answer: FR[geo][1], wrong,
    explain: FR[geo][1] + " is the regional capital of " + FR[geo][0] + ".",
  }));
  capItems.push(mcqItem(FR, {
    id: "fr-cap-27", lesson: 7, format: "capital", geo: "27",
    prompt: "What is the regional capital of Bourgogne-Franche-Comté?",
    answer: "Besançon", wrong: ["Dijon", "Lyon", "Orléans"],
    explain: "Besançon is the regional capital of Bourgogne-Franche-Comté. Dijon is larger, but it is not the préfecture de région.",
  }));
  const capsRest = [
    ["01", 7, ["Pointe-à-Pitre", "Fort-de-France", "Cayenne"]],
    ["02", 7, ["Basse-Terre", "Cayenne", "Saint-Denis"]],
  ].map(([geo, lesson, wrong]) => mcqItem(FR, {
    id: "fr-cap-" + geo, lesson, format: "capital", geo,
    prompt: "What is the regional capital of " + FR[geo][0] + "?",
    answer: FR[geo][1], wrong,
    explain: FR[geo][1] + " is the regional capital of " + FR[geo][0] + ".",
  }));
  // Lesson 7 now has Rouen, Orléans, Besançon, Basse-Terre, Fort-de-France = 5.
  // Wait, caps array still has 28, 24 and I pushed 27, then 01 and 02. That's 5. Good.
  // Remaining capitals: 03 Cayenne, 04 Saint-Denis, 06 Mamoudzou → lesson 8 with 2 cities.
  const capsLast = [
    ["03", 8, ["Saint-Denis", "Fort-de-France", "Mamoudzou"]],
    ["04", 8, ["Saint-Paul", "Mamoudzou", "Cayenne"]],
    ["06", 8, ["Dzaoudzi", "Saint-Denis", "Cayenne"]],
  ].map(([geo, lesson, wrong]) => mcqItem(FR, {
    id: "fr-cap-" + geo, lesson, format: "capital", geo,
    prompt: "What is the regional capital of " + FR[geo][0] + "?",
    answer: FR[geo][1], wrong,
    explain: FR[geo][1] + " is the regional capital of " + FR[geo][0] + ".",
  }));
  const cities = [
    ["Nice", "93", 8, ["Occitanie", "Auvergne-Rhône-Alpes", "Corse"]],
    ["Dijon", "27", 8, ["Auvergne-Rhône-Alpes", "Grand Est", "Centre-Val de Loire"]],
    ["Marseille", "93", 9, ["Occitanie", "Auvergne-Rhône-Alpes", "Corse"]],
    ["Toulouse", "76", 9, ["Nouvelle-Aquitaine", "Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes"]],
    ["Bordeaux", "75", 9, ["Occitanie", "Pays de la Loire", "Bretagne"]],
    ["Lille", "32", 9, ["Normandie", "Grand Est", "Île-de-France"]],
    ["Strasbourg", "44", 9, ["Bourgogne-Franche-Comté", "Hauts-de-France", "Auvergne-Rhône-Alpes"]],
    ["Rennes", "53", 10, ["Pays de la Loire", "Normandie", "Nouvelle-Aquitaine"]],
    ["Nantes", "52", 10, ["Bretagne", "Normandie", "Centre-Val de Loire"]],
    ["Reims", "44", 10, ["Hauts-de-France", "Île-de-France", "Normandie"]],
    ["Le Havre", "28", 10, ["Hauts-de-France", "Bretagne", "Île-de-France"]],
    ["Grenoble", "84", 10, ["Provence-Alpes-Côte d'Azur", "Occitanie", "Bourgogne-Franche-Comté"]],
    ["Montpellier", "76", 11, ["Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine"]],
    ["Angers", "52", 11, ["Bretagne", "Centre-Val de Loire", "Normandie"]],
    ["Nîmes", "76", 11, ["Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine"]],
    ["Clermont-Ferrand", "84", 11, ["Nouvelle-Aquitaine", "Centre-Val de Loire", "Occitanie"]],
    ["Tours", "24", 11, ["Pays de la Loire", "Île-de-France", "Nouvelle-Aquitaine"]],
    ["Limoges", "75", 12, ["Occitanie", "Centre-Val de Loire", "Auvergne-Rhône-Alpes"]],
    ["Amiens", "32", 12, ["Normandie", "Grand Est", "Île-de-France"]],
    ["Metz", "44", 12, ["Hauts-de-France", "Bourgogne-Franche-Comté", "Île-de-France"]],
    ["Brest", "53", 12, ["Normandie", "Pays de la Loire", "Nouvelle-Aquitaine"]],
    ["Caen", "28", 12, ["Bretagne", "Hauts-de-France", "Île-de-France"]],
    ["Nancy", "44", 13, ["Bourgogne-Franche-Comté", "Hauts-de-France", "Île-de-France"]],
    ["Orléans", "24", 13, ["Île-de-France", "Pays de la Loire", "Centre wait"]],
    ["Rouen", "28", 13, ["Hauts-de-France", "Île-de-France", "Bretagne"]],
    ["Avignon", "93", 13, ["Occitanie", "Auvergne-Rhône-Alpes", "Centre-Val de Loire"]],
    ["Poitiers", "75", 13, ["Pays de la Loire", "Centre-Val de Loire", "Bretagne"]],
  ];
  // Fix Orléans distractor that I typed badly.
  cities.forEach(row => {
    if (row[0] === "Orléans") row[3] = ["Île-de-France", "Pays de la Loire", "Normandie"];
  });
  const cityItems = cities.map(([city, geo, lesson, wrong]) => mcqItem(FR, {
    id: "fr-city-" + city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, "-"),
    lesson, format: "city", geo,
    prompt: "Which region is " + city + " in?",
    answer: FR[geo][0], wrong,
    explain: city + " is in " + FR[geo][0] + ".",
  }));
  const deps = [
    ["Paris", "11", 14, ["Centre-Val de Loire", "Normandie", "Hauts-de-France"]],
    ["Rhône", "84", 14, ["Bourgogne-Franche-Comté", "Provence-Alpes-Côte d'Azur", "Occitanie"]],
    ["Bouches-du-Rhône", "93", 14, ["Occitanie", "Auvergne-Rhône-Alpes", "Corse"]],
    ["Nord", "32", 14, ["Normandie", "Grand Est", "Île-de-France"]],
    ["Gironde", "75", 14, ["Occitanie", "Pays de la Loire", "Bretagne"]],
    ["Loire-Atlantique", "52", 15, ["Bretagne", "Normandie", "Centre-Val de Loire"]],
    ["Bas-Rhin", "44", 15, ["Bourgogne-Franche-Comté", "Hauts-de-France", "Île-de-France"]],
    ["Haute-Garonne", "76", 15, ["Nouvelle-Aquitaine", "Auvergne-Rhône-Alpes", "Provence-Alpes-Côte d'Azur"]],
    ["Finistère", "53", 15, ["Normandie", "Pays de la Loire", "Nouvelle-Aquitaine"]],
    ["Alpes-Maritimes", "93", 15, ["Auvergne-Rhône-Alpes", "Occitanie", "Corse"]],
    ["Calvados", "28", 16, ["Bretagne", "Hauts-de-France", "Île-de-France"]],
    ["Corse-du-Sud", "94", 16, ["Provence-Alpes-Côte d'Azur", "Occitanie", "Auvergne-Rhône-Alpes"]],
    ["Haute-Savoie", "84", 16, ["Provence-Alpes-Côte d'Azur", "Bourgogne-Franche-Comté", "Grand Est"]],
    ["Hérault", "76", 16, ["Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine"]],
    ["Var", "93", 16, ["Occitanie", "Auvergne-Rhône-Alpes", "Corse"]],
    ["Côte-d'Or", "27", 17, ["Grand Est", "Auvergne-Rhône-Alpes", "Île-de-France"]],
    ["Puy-de-Dôme", "84", 17, ["Nouvelle-Aquitaine", "Centre-Val de Loire", "Occitanie"]],
    ["Indre-et-Loire", "24", 17, ["Pays de la Loire", "Nouvelle-Aquitaine", "Île-de-France"]],
    ["Somme", "32", 17, ["Normandie", "Grand Est", "Île-de-France"]],
    ["Moselle", "44", 17, ["Hauts-de-France", "Bourgogne-Franche-Comté", "Grand Est wait"]],
  ];
  deps.forEach(row => { if (row[0] === "Moselle") row[3] = ["Hauts-de-France", "Bourgogne-Franche-Comté", "Île-de-France"]; });
  const depItems = deps.map(([name, geo, lesson, wrong]) => mcqItem(FR, {
    id: "fr-dep-" + name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-"),
    lesson, format: "departement", geo,
    prompt: "The département of " + name + " is in which region?",
    answer: FR[geo][0], wrong,
    explain: name + " is in " + FR[geo][0] + ".",
  }));
  const marks = [
    ["fr-mark-louvre", 18, "The Louvre is in which region?", "11", ["Centre-Val de Loire", "Normandie", "Grand Est"], "The Louvre is in Île-de-France, in Paris."],
    ["fr-mark-michel", 18, "Mont-Saint-Michel is in which region?", "28", ["Bretagne", "Pays de la Loire", "Hauts-de-France"], "Mont-Saint-Michel is in Normandie, in the département of Manche."],
    ["fr-mark-blanc", 18, "The French side of Mont Blanc is in which region?", "84", ["Provence-Alpes-Côte d'Azur", "Occitanie", "Bourgogne-Franche-Comté"], "The French side of Mont Blanc is in Auvergne-Rhône-Alpes, in Haute-Savoie."],
    ["fr-mark-gard", 18, "The Pont du Gard is in which region?", "76", ["Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine"], "The Pont du Gard is in Occitanie, in the Gard."],
    ["fr-mark-chambord", 18, "The Château de Chambord is in which region?", "24", ["Île-de-France", "Pays de la Loire", "Centre-Val de Loire wait"]],
    ["fr-mark-carnac", 19, "The standing stones at Carnac are in which region?", "53", ["Normandie", "Pays de la Loire", "Nouvelle-Aquitaine"], "The standing stones at Carnac are in Bretagne, in Morbihan."],
    ["fr-mark-pilat", 19, "The Dune du Pilat is in which region?", "75", ["Occitanie", "Pays de la Loire", "Bretagne"], "The Dune du Pilat is in Nouvelle-Aquitaine, on the Gironde coast."],
    ["fr-mark-calanques", 19, "The calanques near Marseille are in which region?", "93", ["Occitanie", "Corse", "Auvergne-Rhône-Alpes"], "The calanques near Marseille are in Provence-Alpes-Côte d'Azur."],
    ["fr-mark-piton", 19, "The Piton de la Fournaise volcano is in which region?", "04", ["Mayotte", "Guyane", "Guadeloupe"], "The Piton de la Fournaise is in La Réunion."],
    ["fr-mark-chenonceau", 19, "The Château de Chenonceau is in which region?", "24", ["Pays de la Loire", "Nouvelle-Aquitaine", "Île-de-France"], "The Château de Chenonceau is in Centre-Val de Loire, in Indre-et-Loire."],
    ["fr-mark-dame", 20, "Notre-Dame de Paris is in which region?", "11", ["Centre-Val de Loire", "Normandie", "Hauts-de-France"], "Notre-Dame de Paris is in Île-de-France."],
    ["fr-mark-raz", 20, "The Pointe du Raz is in which region?", "53", ["Normandie", "Pays de la Loire", "Nouvelle-Aquitaine"], "The Pointe du Raz is in Bretagne, in Finistère."],
    ["fr-mark-annecy", 20, "Lake Annecy is in which region?", "84", ["Provence-Alpes-Côte d'Azur", "Bourgogne-Franche-Comté", "Auvergne-Rhône-Alpes wait"]],
    ["fr-mark-strasbourg", 20, "Strasbourg Cathedral is in which region?", "44", ["Hauts-de-France", "Bourgogne-Franche-Comté", "Île-de-France"], "Strasbourg Cathedral is in Grand Est."],
    ["fr-mark-napoleon", 20, "Napoleon was born in Ajaccio, in which region?", "94", ["Provence-Alpes-Côte d'Azur", "Occitanie", "Auvergne-Rhône-Alpes"], "Napoleon was born in Ajaccio, in Corse."],
  ];
  marks.forEach(row => {
    if (String(row[4][2]).includes("wait")) {
      if (row[0] === "fr-mark-chambord") row[4] = ["Île-de-France", "Pays de la Loire", "Nouvelle-Aquitaine"];
      if (row[0] === "fr-mark-annecy") row[4] = ["Provence-Alpes-Côte d'Azur", "Bourgogne-Franche-Comté", "Grand Est"];
    }
  });
  const markItems = marks.map(([id, lesson, prompt, geo, wrong, explain]) => mcqItem(FR, {
    id, lesson, format: "landmark", geo, prompt,
    answer: FR[geo][0],
    wrong,
    explain: explain || (FR[geo][0] + " is the right region."),
  }));
  // Chambord explain must name Centre-Val de Loire. The 6th field was dropped when I used a short row.
  markItems.forEach(q => {
    if (q.id === "fr-mark-chambord") q.explain = "The Château de Chambord is in Centre-Val de Loire, in Loir-et-Cher.";
  });
  return finish(FR, maps.concat(extra, capItems, capsRest, capsLast, cityItems, depItems, markItems), "FR");
}

function buildJP() {
  const mapRows = [
    ["13", "27", "01", "26", "47"],
    ["40", "23", "14", "34", "28"],
    ["29", "04", "15", "20", "22"],
    ["12", "11", "08", "09", "10"],
    ["33", "43", "46", "42", "44"],
    ["02", "03", "05", "06", "07"],
    ["17", "16", "21", "24", "25"],
    ["30", "35", "38", "39", "45"],
  ];
  const maps = mapRows.flatMap((row, i) => row.map(geo => mapItem(JP, geo, i + 1)));
  const caps = [
    ["13", 9, ["Yokohama", "Chiba", "Saitama"]],
    ["26", 9, ["Osaka", "Nara", "Otsu"]],
    ["27", 9, ["Kyoto", "Kobe", "Nara"]],
    ["01", 9, ["Hakodate", "Asahikawa", "Tokyo"]],
    ["47", 9, ["Ishigaki", "Nago", "Kagoshima"]],
    ["14", 10, ["Tokyo", "Chiba", "Shizuoka"]],
    ["23", 10, ["Gifu", "Shizuoka", "Kyoto"]],
    ["40", 10, ["Kitakyushu", "Nagasaki", "Kumamoto"]],
    ["34", 10, ["Kure", "Okayama", "Yamaguchi"]],
    ["28", 10, ["Himeji", "Osaka", "Okayama"]],
    ["11", 11, ["Tokyo", "Yokohama", "Chiba"]],
    ["12", 11, ["Tokyo", "Yokohama", "Mito"]],
    ["04", 11, ["Morioka", "Aomori", "Fukushima"]],
    ["17", 11, ["Toyama", "Fukui", "Nagano"]],
    ["15", 11, ["Nagano", "Toyama", "Kanazawa"]],
    ["19", 12, ["Shizuoka", "Nagano", "Tokyo"]],
    ["22", 12, ["Hamamatsu", "Nagoya", "Kofu"]],
    ["21", 12, ["Nagoya", "Nagano", "Kanazawa"]],
    ["20", 12, ["Matsumoto", "Niigata", "Kofu"]],
    ["29", 12, ["Osaka", "Kyoto", "Wakayama"]],
    ["31", 13, ["Matsue", "Okayama", "Kobe"]],
    ["32", 13, ["Tottori", "Hiroshima", "Okayama"]],
    ["18", 13, ["Kanazawa", "Toyama", "Kyoto"]],
    ["41", 13, ["Nagasaki", "Fukuoka", "Kumamoto"]],
    ["37", 13, ["Tokushima", "Matsuyama", "Okayama"]],
  ].map(([geo, lesson, wrong]) => mcqItem(JP, {
    id: "jp-cap-" + geo, lesson, format: "capital", geo,
    prompt: "What is the capital of " + JP[geo][0] + "?",
    answer: JP[geo][1], wrong,
    explain: JP[geo][1] + " is the capital of " + JP[geo][0] + ".",
  }));
  const cities = [
    ["Yokohama", "14", 14, ["Tokyo", "Chiba", "Shizuoka"]],
    ["Nagoya", "23", 14, ["Gifu", "Shizuoka", "Mie"]],
    ["Sapporo", "01", 14, ["Aomori", "Akita", "Miyagi"]],
    ["Naha", "47", 14, ["Kagoshima", "Miyazaki", "Fukuoka"]],
    ["Sendai", "04", 14, ["Fukushima", "Iwate", "Yamagata"]],
    ["Kobe", "28", 15, ["Osaka", "Kyoto", "Okayama"]],
    ["Fukuoka", "40", 15, ["Saga", "Nagasaki", "Oita"]],
    ["Hiroshima", "34", 15, ["Okayama", "Yamaguchi", "Shimane"]],
    ["Kanazawa", "17", 15, ["Toyama", "Fukui", "Niigata"]],
    ["Nagasaki", "42", 15, ["Saga", "Fukuoka", "Kumamoto"]],
    ["Nara", "29", 16, ["Kyoto", "Osaka", "Wakayama"]],
    ["Kyoto", "26", 16, ["Osaka", "Nara", "Shiga"]],
    ["Osaka", "27", 16, ["Kyoto", "Hyogo", "Nara"]],
    ["Saitama", "11", 16, ["Tokyo", "Chiba", "Gunma"]],
    ["Chiba", "12", 16, ["Tokyo", "Ibaraki", "Kanagawa"]],
  ].map(([city, geo, lesson, wrong]) => mcqItem(JP, {
    id: "jp-city-" + city.toLowerCase(), lesson, format: "city", geo,
    prompt: city + " is in which prefecture?",
    answer: JP[geo][0], wrong,
    explain: city + " is in " + JP[geo][0] + ".",
  }));
  const marks = [
    ["jp-mark-inari", 17, "Fushimi Inari Shrine is in which prefecture?", "26", ["Nara", "Osaka", "Shiga"], "Fushimi Inari Shrine is in Kyoto."],
    ["jp-mark-senso", 17, "Sensō-ji in Asakusa is in which prefecture?", "13", ["Kanagawa", "Chiba", "Saitama"], "Sensō-ji in Asakusa is in Tokyo."],
    ["jp-mark-miyajima", 17, "Itsukushima Shrine, on Miyajima, is in which prefecture?", "34", ["Yamaguchi", "Okayama", "Ehime"], "Itsukushima Shrine is in Hiroshima."],
    ["jp-mark-himeji", 17, "Himeji Castle is in which prefecture?", "28", ["Osaka", "Kyoto", "Okayama"], "Himeji Castle is in Hyogo."],
    ["jp-mark-todai", 17, "Tōdai-ji, the great Buddha hall, is in which prefecture?", "29", ["Kyoto", "Osaka", "Wakayama"], "Tōdai-ji is in Nara."],
    ["jp-mark-kenroku", 18, "Kenroku-en garden is in which prefecture?", "17", ["Toyama", "Fukui", "Niigata"], "Kenroku-en is in Ishikawa, in Kanazawa."],
    ["jp-mark-shuri", 18, "Shuri Castle is in which prefecture?", "47", ["Kagoshima", "Miyazaki", "Fukuoka"], "Shuri Castle is in Okinawa, in Naha."],
    ["jp-mark-nikko", 18, "The shrines of Nikkō are in which prefecture?", "09", ["Gunma", "Ibaraki", "Fukushima"], "The shrines of Nikkō are in Tochigi."],
    ["jp-mark-shirakawa", 18, "The historic village of Shirakawa-go is in which prefecture?", "21", ["Nagano", "Toyama", "Ishikawa"], "Shirakawa-go is in Gifu."],
    ["jp-mark-biwa", 18, "Lake Biwa is in which prefecture?", "25", ["Kyoto", "Fukui", "Gifu"], "Lake Biwa is in Shiga."],
    ["jp-mark-skytree", 19, "Tokyo Skytree is in which prefecture?", "13", ["Chiba", "Saitama", "Kanagawa"], "Tokyo Skytree is in Tokyo."],
    ["jp-mark-kamakura", 19, "The Great Buddha of Kamakura is in which prefecture?", "14", ["Tokyo", "Shizuoka", "Chiba"], "The Great Buddha of Kamakura is in Kanagawa."],
    ["jp-mark-kumamoto", 19, "Kumamoto Castle is in which prefecture?", "43", ["Fukuoka", "Oita", "Kagoshima"], "Kumamoto Castle is in Kumamoto."],
    ["jp-mark-nagasaki", 19, "The Nagasaki Peace Park is in which prefecture?", "42", ["Saga", "Fukuoka", "Kumamoto"], "The Nagasaki Peace Park is in Nagasaki."],
    ["jp-mark-snow", 19, "The Sapporo Snow Festival is in which prefecture?", "01", ["Aomori", "Akita", "Iwate"], "The Sapporo Snow Festival is in Hokkaido."],
    ["jp-mark-kawaguchi", 20, "Lake Kawaguchi, one of the Fuji Five Lakes, is in which prefecture?", "19", ["Shizuoka", "Kanagawa", "Yamanashi wait"]],
    ["jp-mark-fujinomiya", 20, "Fujinomiya, on the southern side of Mount Fuji, is in which prefecture?", "22", ["Yamanashi", "Kanagawa", "Nagano"], "Fujinomiya, on the southern side of Mount Fuji, is in Shizuoka."],
    ["jp-mark-naoshima", 20, "The art island of Naoshima is in which prefecture?", "37", ["Okayama", "Hiroshima", "Ehime"], "Naoshima is in Kagawa."],
    ["jp-mark-awa", 20, "The Awa Odori dance festival is held in which prefecture?", "36", ["Kagawa", "Kochi", "Ehime"], "The Awa Odori festival is held in Tokushima."],
    ["jp-mark-yaku", 20, "The island of Yakushima is part of which prefecture?", "46", ["Okinawa", "Miyazaki", "Kumamoto"], "Yakushima is part of Kagoshima."],
  ];
  marks.forEach(row => {
    if (row[0] === "jp-mark-kawaguchi") {
      row[4] = ["Shizuoka", "Kanagawa", "Nagano"];
      row[5] = "Lake Kawaguchi, one of the Fuji Five Lakes, is in Yamanashi.";
    }
  });
  const markItems = marks.map(([id, lesson, prompt, geo, wrong, explain]) => mcqItem(JP, {
    id, lesson, format: "landmark", geo, prompt, answer: JP[geo][0], wrong, explain,
  }));
  return finish(JP, maps.concat(caps, cities, markItems), "JP");
}

function serialize(varName, items) {
  return "// Generated by scripts/geo-questions.js — do not edit by hand.\n" +
    "// 100 questions, lessons 1–20, five each, easier lessons first.\n" +
    "window." + varName + " = " + JSON.stringify(items, null, 2) + ";\n";
}

function buildAll() {
  return { us: buildUS(), fr: buildFR(), jp: buildJP() };
}

if (require.main === module) {
  const all = buildAll();
  const root = path.join(__dirname, "..");
  fs.writeFileSync(path.join(root, "us-questions.js"), serialize("US_QUESTIONS", all.us));
  fs.writeFileSync(path.join(root, "fr-questions.js"), serialize("FR_QUESTIONS", all.fr));
  fs.writeFileSync(path.join(root, "jp-questions.js"), serialize("JP_QUESTIONS", all.jp));
  console.log("wrote", all.us.length, all.fr.length, all.jp.length);
}

module.exports = { buildAll, serialize, buildUS, buildFR, buildJP, US, FR, JP };
