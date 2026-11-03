// Checks the three question banks: counts, unique choices, and that each
// correct answer is one of the four choices. Logic answers are recomputed
// from the rules in logic-rules.js, so a hand-edited wrong answer fails.
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { buildLogicQuestions, serializeLogic, assertConsistent } = require("./logic-rules");
const { buildConjugationQuestions, serializeConj } = require("./conjugation-rules");

const root = path.join(__dirname, "..");
const errors = [];
function fail(msg) { errors.push(msg); }

function loadWindow(file) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), ctx, { filename: file });
  return ctx.window;
}

function checkBank(name, items, fields) {
  if (!Array.isArray(items)) return fail(name + " is not an array");
  if (items.length !== 100) fail(name + " has " + items.length + " items, expected 100");
  const ids = new Set();
  const prompts = new Set();
  items.forEach((q, i) => {
    const where = name + "[" + i + "] " + (q && q.id);
    if (!q || typeof q !== "object") return fail(where + " is not an object");
    fields.forEach(f => {
      if (q[f] == null || q[f] === "") fail(where + " missing " + f);
    });
    if (ids.has(q.id)) fail(where + " duplicate id");
    ids.add(q.id);
    const choices = q.choices;
    if (!Array.isArray(choices) || choices.length !== 4) fail(where + " needs 4 choices");
    else {
      const norm = choices.map(c => String(c).trim());
      if (norm.some(c => c === "")) fail(where + " has an empty choice");
      if (new Set(norm).size !== 4) fail(where + " choices are not unique: " + norm.join(" | "));
      if (!norm.includes(String(q.answer).trim())) fail(where + " answer is not among the choices");
      if (norm.includes(String(q.word || "").trim())) fail(where + " lists the prompt word as a choice");
    }
    if (q.word) {
      if (prompts.has(q.word)) fail(where + " duplicate prompt " + q.word);
      prompts.add(q.word);
      if (q.word === q.answer) fail(where + " answer equals the prompt");
      if (!String(q.gloss).includes(q.answer)) fail(where + " gloss does not name the answer");
    }
  });
}

// Extra synonyms that must not sneak in as a second correct choice.
const CLUSTERS = [
  ["ephemeral", "transitory", "fleeting", "momentary", "transient"],
  ["ubiquitous", "omnipresent", "widespread"],
  ["laconic", "terse", "curt"],
  ["succinct", "concise", "pithy", "brief"],
  ["verbose", "prolix", "wordy", "long-winded"],
  ["loquacious", "garrulous", "talkative", "voluble"],
  ["erudite", "scholarly", "learned"],
  ["pragmatic", "practical"],
  ["ambiguous", "equivocal", "vague"],
  ["benevolent", "kindhearted", "kindly"],
  ["candid", "forthright", "frank"],
  ["assiduous", "diligent", "sedulous"],
  ["industrious", "sedulous", "hardworking"],
  ["meticulous", "painstaking", "fastidious", "finicky"],
  ["resilient", "hardy", "tough"],
  ["tenacious", "dogged", "persistent"],
  ["chronic", "persistent", "lingering"],
  ["lucid", "intelligible", "clear"],
  ["abstruse", "esoteric", "recondite"],
  ["recondite", "obscure", "arcane"],
  ["arcane", "mysterious", "esoteric"],
  ["prolific", "productive", "fruitful"],
  ["nascent", "emerging", "budding"],
  ["obsolete", "outmoded", "outdated"],
  ["arduous", "strenuous", "laborious"],
  ["magnanimous", "generous"],
  ["parsimonious", "miserly", "stingy"],
  ["voracious", "ravenous", "insatiable"],
  ["zealous", "fervent", "ardent"],
  ["apathetic", "indifferent", "unconcerned"],
  ["cogent", "convincing", "persuasive"],
  ["eloquent", "articulate", "fluent"],
  ["redundant", "superfluous", "unnecessary"],
  ["profound", "deep"],
  ["superficial", "shallow"],
  ["impartial", "unbiased", "neutral"],
  ["partisan", "biased", "prejudiced"],
  ["clandestine", "covert", "secret", "furtive", "surreptitious"],
  ["overt", "undisguised", "open"],
  ["exorbitant", "excessive"],
  ["meager", "scanty", "sparse", "scattered"],
  ["copious", "abundant", "plentiful"],
  ["pellucid", "transparent", "limpid"],
  ["perpetual", "everlasting", "endless"],
  ["intermittent", "sporadic"],
  ["dire", "desperate", "dreadful"],
  ["benign", "harmless"],
  ["malignant", "virulent"],
  ["innocuous", "inoffensive", "harmless"],
  ["pernicious", "harmful", "destructive"],
  ["salutary", "wholesome", "beneficial"],
  ["deleterious", "injurious", "harmful"],
  ["noxious", "toxic", "poisonous"],
  ["robust", "sturdy", "strong"],
  ["frail", "fragile", "delicate"],
  ["feeble", "infirm", "weak"],
  ["vigorous", "hearty", "energetic"],
  ["lethargic", "torpid", "sluggish"],
  ["indolent", "slothful", "lazy"],
  ["boisterous", "rowdy", "raucous"],
  ["desolate", "bleak", "barren"],
  ["serene", "peaceful", "calm"],
  ["turbulent", "tumultuous", "chaotic"],
  ["placid", "tranquil", "calm"],
  ["irate", "incensed", "furious"],
  ["jovial", "merry", "jolly"],
  ["morose", "gloomy", "sullen"],
  ["sanguine", "optimistic"],
  ["cynical", "distrustful"],
  ["credulous", "gullible"],
  ["skeptical", "doubtful"],
  ["dubious", "questionable", "doubtful"],
  ["inevitable", "unavoidable"],
  ["contingent", "dependent"],
  ["autonomous", "independent"],
  ["subordinate", "secondary"],
  ["paramount", "supreme"],
  ["trivial", "trifling", "insignificant"],
  ["crucial", "essential", "vital"],
  ["pivotal", "decisive"],
  ["peripheral", "marginal"],
  ["intrinsic", "inherent"],
  ["extrinsic", "external"],
  ["innate", "inborn"],
  ["hereditary", "inherited"],
  ["unprecedented", "unheard-of"],
  ["banal", "trite", "hackneyed", "stale"],
  ["innovative", "inventive"],
  ["conventional", "traditional"],
  ["radical", "extreme"],
  ["moderate", "temperate"],
  ["taciturn", "reserved"],
  ["bombastic", "pompous"],
  ["ostentatious", "flamboyant", "showy"],
  ["éphémère", "fugace"],
  ["passager", "temporaire"],
  ["ubiquiste", "omniprésent"],
  ["laconique", "lapidaire"],
  ["érudit", "savant"],
  ["pragmatique", "pratique"],
  ["ambigu", "équivoque"],
  ["altruiste", "désintéressé"],
  ["candide", "ingénu", "naïf"],
  ["crédule", "naïf", "ingénu"],
  ["assidu", "appliqué"],
  ["austère", "dépouillé"],
  ["loquace", "bavard"],
  ["méticuleux", "minutieux"],
  ["résilient", "résistant"],
  ["opiniâtre", "entêté"],
  ["prolixe", "verbeux"],
  ["lucide", "clair"],
  ["abscons", "obscur"],
  ["prolifique", "fécond"],
  ["embryonnaire", "naissant"],
  ["désuet", "obsolète"],
  ["ardu", "pénible"],
  ["magnanime", "généreux"],
  ["parcimonieux", "chiche"],
  ["vorace", "glouton"],
  ["zélé", "fervent"],
  ["apathique", "indifférent"],
  ["probant", "concluant"],
  ["éloquent", "disert"],
  ["succinct", "bref"],
  ["redondant", "superflu"],
  ["profond", "pénétrant"],
  ["superficiel", "sommaire"],
  ["impartial", "équitable"],
  ["tendancieux", "biaisé"],
  ["clandestin", "secret"],
  ["manifeste", "évident"],
  ["furtif", "sournois"],
  ["exorbitant", "excessif"],
  ["dérisoire", "négligeable"],
  ["copieux", "abondant"],
  ["clairsemé", "épars"],
  ["limpide", "transparent"],
  ["perpétuel", "éternel"],
  ["sporadique", "intermittent"],
  ["chronique", "persistant"],
  ["anodin", "inoffensif"],
  ["virulent", "venimeux"],
  ["pernicieux", "néfaste"],
  ["salutaire", "bénéfique"],
  ["délétère", "nocif"],
  ["vénéneux", "toxique"],
  ["salubre", "sain"],
  ["robuste", "solide"],
  ["frêle", "fragile"],
  ["chétif", "faible"],
  ["vigoureux", "énergique"],
  ["léthargique", "somnolent"],
  ["indolent", "paresseux"],
  ["industrieux", "travailleur"],
  ["serein", "paisible"],
  ["turbulent", "agité"],
  ["placide", "tranquille"],
  ["irascible", "colérique"],
  ["courroucé", "furieux"],
  ["jovial", "enjoué"],
  ["morose", "maussade"],
  ["allègre", "joyeux"],
  ["sceptique", "dubitatif"],
  ["douteux", "incertain"],
  ["inéluctable", "inévitable"],
  ["tributaire", "dépendant"],
  ["autonome", "indépendant"],
  ["accessoire", "secondaire"],
  ["primordial", "capital"],
  ["insignifiant", "mineur"],
  ["crucial", "vital"],
  ["déterminant", "décisif"],
  ["périphérique", "marginal"],
  ["intrinsèque", "inhérent"],
  ["extrinsèque", "extérieur"],
  ["inné", "congénital"],
  ["héréditaire", "hérité"],
  ["inédit", "original"],
  ["banal", "rebattu"],
  ["éculé", "usé"],
  ["novateur", "inventif"],
  ["conventionnel", "traditionnel"],
  ["radical", "extrême"],
  ["modéré", "tempéré"],
  ["hermétique", "impénétrable"],
  ["sibyllin", "énigmatique"],
  ["taciturne", "réservé"],
  ["pompeux", "grandiloquent"],
  ["ostentatoire", "tape-à-l'œil"],
  ["fastidieux", "ennuyeux"],
  ["actuel", "présent"],
  ["sympathique", "aimable"],
  ["versatile", "changeant"],
];

function checkClusters(items) {
  items.forEach(q => {
    CLUSTERS.forEach(cluster => {
      const set = new Set(cluster);
      if (!set.has(q.word) && !set.has(q.answer)) return;
      const hits = q.choices.filter(c => set.has(c) && c !== q.answer);
      if (hits.length) fail(q.id + " distractor is also a synonym: " + hits.join(", ") + " (answer " + q.answer + ")");
    });
  });
}

const win = loadWindow("vocab-en.js");
const wfr = loadWindow("vocab-fr.js");
const wlogic = loadWindow("logic.js");
const wconj = loadWindow("conj-fr.js");
const enLex = require(path.join(root, "vocab-en-lex.js"));
const frLex = require(path.join(root, "vocab-fr-lex.js"));
checkBank("VOCAB_EN", win.VOCAB_EN, ["id", "word", "answer", "choices", "gloss"]);
checkBank("VOCAB_FR", wfr.VOCAB_FR, ["id", "word", "answer", "choices", "gloss"]);
checkBank("LOGIC", wlogic.LOGIC_QUESTIONS, ["id", "seq", "answer", "choices", "explain", "level"]);
checkBank("CONJ_FR", wconj.CONJ_FR, ["id", "prompt", "ask", "answer", "choices", "explain"]);
checkClusters([].concat(win.VOCAB_EN || [], wfr.VOCAB_FR || []));

function checkLex(name, bank, lex) {
  (bank || []).forEach(q => {
    q.choices.forEach(word => {
      const entry = lex[word];
      if (!entry) return fail(name + " " + q.id + " choice has no lexicon entry: " + word);
      if (!entry.def || String(entry.def).trim().length < 12) fail(name + " " + word + " definition is missing or too short");
      if (!entry.ex || String(entry.ex).trim().length < 12) fail(name + " " + word + " example is missing or too short");
    });
  });
}
checkLex("EN", win.VOCAB_EN, enLex);
checkLex("FR", wfr.VOCAB_FR, frLex);

const logic = wlogic.LOGIC_QUESTIONS || [];
logic.forEach(q => {
  if (!Array.isArray(q.seq) || q.seq.length < 5) fail(q.id + " sequence shorter than 5");
  if (q.seq.some(n => !Number.isInteger(n))) fail(q.id + " non-integer term");
  if (!Number.isInteger(Number(q.answer))) fail(q.id + " non-integer answer");
  if (!String(q.explain).includes(String(q.answer))) fail(q.id + " explanation omits the answer");
  if (!["apprentice", "scholar", "archmage"].includes(q.level)) fail(q.id + " bad level");
});
const seqs = new Set(logic.map(q => (q.seq || []).join(",")));
if (seqs.size !== logic.length) fail("duplicate logic sequences");

let built;
try {
  built = buildLogicQuestions();
  assertConsistent(built);
} catch (e) {
  fail("logic rules failed: " + e.message);
}
if (built) {
  const expected = serializeLogic(built);
  const actual = fs.readFileSync(path.join(root, "logic.js"), "utf8");
  if (actual !== expected) fail("logic.js does not match scripts/logic-rules.js — regenerate it");
  const positions = {};
  built.forEach(q => {
    const i = q.choices.indexOf(q.answer);
    positions[i] = (positions[i] || 0) + 1;
  });
  if (Object.keys(positions).length < 3) fail("correct answers are not spread across the four choices");
}

const conj = wconj.CONJ_FR || [];
conj.forEach(q => {
  if (!String(q.explain).includes(String(q.answer))) fail(q.id + " explanation omits the answer");
});
let builtConj;
try { builtConj = buildConjugationQuestions(); }
catch (e) { fail("conjugation rules failed: " + e.message); }
if (builtConj) {
  const expected = serializeConj(builtConj);
  const actual = fs.readFileSync(path.join(root, "conj-fr.js"), "utf8");
  if (actual !== expected) fail("conj-fr.js does not match scripts/conjugation-rules.js — regenerate it");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const levels = logic.reduce((m, q) => (m[q.level] = (m[q.level] || 0) + 1, m), {});
console.log("OK", {
  english: win.VOCAB_EN.length,
  french: wfr.VOCAB_FR.length,
  logic: logic.length,
  conjugation: conj.length,
  levels,
});
