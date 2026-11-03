// French conjugation questions for Wizard's Quiz Academy.
// Every answer is read from an explicit table, then checked against a few
// well-known forms before the file is written.
"use strict";

const fs = require("fs");
const path = require("path");

const PRONOUNS = ["je", "tu", "il", "nous", "vous", "ils"];
const PERSON_LABEL = [
  "1re personne du singulier",
  "2e personne du singulier",
  "3e personne du singulier",
  "1re personne du pluriel",
  "2e personne du pluriel",
  "3e personne du pluriel",
];

function V(inf, aux, pp, present, imparfait, futur, note) {
  return { inf, aux, pp, present, imparfait, futur, note: note || "" };
}

// Forms are the words after the pronoun. "je" + vowel is elided later.
const VERBS = [
  V("parler", "avoir", "parlé",
    ["parle", "parles", "parle", "parlons", "parlez", "parlent"],
    ["parlais", "parlais", "parlait", "parlions", "parliez", "parlaient"],
    ["parlerai", "parleras", "parlera", "parlerons", "parlerez", "parleront"],
    "Verbe régulier en -er : au présent, -e, -es, -e, -ons, -ez, -ent."),
  V("aimer", "avoir", "aimé",
    ["aime", "aimes", "aime", "aimons", "aimez", "aiment"],
    ["aimais", "aimais", "aimait", "aimions", "aimiez", "aimaient"],
    ["aimerai", "aimeras", "aimera", "aimerons", "aimerez", "aimeront"],
    "Verbe régulier en -er."),
  V("jouer", "avoir", "joué",
    ["joue", "joues", "joue", "jouons", "jouez", "jouent"],
    ["jouais", "jouais", "jouait", "jouions", "jouiez", "jouaient"],
    ["jouerai", "joueras", "jouera", "jouerons", "jouerez", "joueront"],
    "Verbe régulier en -er."),
  V("finir", "avoir", "fini",
    ["finis", "finis", "finit", "finissons", "finissez", "finissent"],
    ["finissais", "finissais", "finissait", "finissions", "finissiez", "finissaient"],
    ["finirai", "finiras", "finira", "finirons", "finirez", "finiront"],
    "Verbe régulier en -ir : le présent pluriel et l'imparfait prennent -iss-."),
  V("choisir", "avoir", "choisi",
    ["choisis", "choisis", "choisit", "choisissons", "choisissez", "choisissent"],
    ["choisissais", "choisissais", "choisissait", "choisissions", "choisissiez", "choisissaient"],
    ["choisirai", "choisiras", "choisira", "choisirons", "choisirez", "choisiront"],
    "Verbe régulier en -ir, comme finir."),
  V("réussir", "avoir", "réussi",
    ["réussis", "réussis", "réussit", "réussissons", "réussissez", "réussissent"],
    ["réussissais", "réussissais", "réussissait", "réussissions", "réussissiez", "réussissaient"],
    ["réussirai", "réussiras", "réussira", "réussirons", "réussirez", "réussiront"],
    "Verbe régulier en -ir."),
  V("être", "avoir", "été",
    ["suis", "es", "est", "sommes", "êtes", "sont"],
    ["étais", "étais", "était", "étions", "étiez", "étaient"],
    ["serai", "seras", "sera", "serons", "serez", "seront"],
    "Être est irrégulier. Son passé composé se forme avec avoir : « a été »."),
  V("avoir", "avoir", "eu",
    ["ai", "as", "a", "avons", "avez", "ont"],
    ["avais", "avais", "avait", "avions", "aviez", "avaient"],
    ["aurai", "auras", "aura", "aurons", "aurez", "auront"],
    "Avoir est irrégulier. Son participe passé est « eu »."),
  V("aller", "être", "allé",
    ["vais", "vas", "va", "allons", "allez", "vont"],
    ["allais", "allais", "allait", "allions", "alliez", "allaient"],
    ["irai", "iras", "ira", "irons", "irez", "iront"],
    "Aller est irrégulier (vais / ir-). Le passé composé se forme avec être."),
  V("faire", "avoir", "fait",
    ["fais", "fais", "fait", "faisons", "faites", "font"],
    ["faisais", "faisais", "faisait", "faisions", "faisiez", "faisaient"],
    ["ferai", "feras", "fera", "ferons", "ferez", "feront"],
    "Faire est irrégulier : vous faites, ils font, et le futur est en fer-."),
  V("venir", "être", "venu",
    ["viens", "viens", "vient", "venons", "venez", "viennent"],
    ["venais", "venais", "venait", "venions", "veniez", "venaient"],
    ["viendrai", "viendras", "viendra", "viendrons", "viendrez", "viendront"],
    "Venir est irrégulier (le futur est en viendr-). Le passé composé se forme avec être."),
  V("pouvoir", "avoir", "pu",
    ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"],
    ["pouvais", "pouvais", "pouvait", "pouvions", "pouviez", "pouvaient"],
    ["pourrai", "pourras", "pourra", "pourrons", "pourrez", "pourront"],
    "Pouvoir est irrégulier. Le participe passé est « pu », invariable ici."),
  V("vouloir", "avoir", "voulu",
    ["veux", "veux", "veut", "voulons", "voulez", "veulent"],
    ["voulais", "voulais", "voulait", "voulions", "vouliez", "voulaient"],
    ["voudrai", "voudras", "voudra", "voudrons", "voudrez", "voudront"],
    "Vouloir est irrégulier : le futur est en voudr-."),
  V("prendre", "avoir", "pris",
    ["prends", "prends", "prend", "prenons", "prenez", "prennent"],
    ["prenais", "prenais", "prenait", "prenions", "preniez", "prenaient"],
    ["prendrai", "prendras", "prendra", "prendrons", "prendrez", "prendront"],
    "Prendre est irrégulier. Le participe passé est « pris »."),
  V("voir", "avoir", "vu",
    ["vois", "vois", "voit", "voyons", "voyez", "voient"],
    ["voyais", "voyais", "voyait", "voyions", "voyiez", "voyaient"],
    ["verrai", "verras", "verra", "verrons", "verrez", "verront"],
    "Voir est irrégulier : le futur double le r (verrai)."),
  V("devoir", "avoir", "dû",
    ["dois", "dois", "doit", "devons", "devez", "doivent"],
    ["devais", "devais", "devait", "devions", "deviez", "devaient"],
    ["devrai", "devras", "devra", "devrons", "devrez", "devront"],
    "Devoir est irrégulier. Le participe passé masculin singulier est « dû »."),
];

function joinPronoun(pronoun, rest) {
  if (pronoun === "je" && /^[aeiouàâäéèêëîïôùûühœ]/i.test(rest)) return "j'" + rest;
  return pronoun + " " + rest;
}

function ppFor(verb, person) {
  if (verb.aux !== "être") return verb.pp;
  // Masculine agreement only. vous is treated as masculine singular.
  const plural = person === 3 || person === 5;
  return plural ? verb.pp + "s" : verb.pp;
}

function stemOf(verb, tense, person) {
  if (tense === "present") return verb.present[person];
  if (tense === "imparfait") return verb.imparfait[person];
  if (tense === "futur") return verb.futur[person];
  if (tense === "pc") {
    const aux = verb.aux === "être"
      ? ["suis", "es", "est", "sommes", "êtes", "sont"][person]
      : ["ai", "as", "a", "avons", "avez", "ont"][person];
    return aux + " " + ppFor(verb, person);
  }
  throw new Error("tense " + tense);
}

function fullForm(verb, tense, person) {
  return joinPronoun(PRONOUNS[person], stemOf(verb, tense, person));
}

const TENSE_FR = {
  present: "au présent",
  imparfait: "à l'imparfait",
  futur: "au futur",
  pc: "au passé composé",
};

function personLabel(verb, tense, person) {
  let label = PERSON_LABEL[person];
  if (tense === "pc" && verb.aux === "être" && person === 4) label += ", masculin singulier";
  return label;
}

function explainConj(verb, tense, person, answer) {
  const who = personLabel(verb, tense, person);
  if (tense === "pc" && verb.aux === "être") {
    return `« ${verb.inf} » se conjugue au passé composé avec être. ${who.charAt(0).toUpperCase() + who.slice(1)} : « ${answer} ». Le participe s'accorde avec le sujet masculin${person === 3 || person === 5 ? " pluriel" : ""}. ${verb.note}`;
  }
  if (tense === "pc") {
    return `« ${verb.inf} » se conjugue au passé composé avec avoir. ${who.charAt(0).toUpperCase() + who.slice(1)} : « ${answer} ». Ici le participe ne s'accorde pas avec le sujet. ${verb.note}`;
  }
  return `${who.charAt(0).toUpperCase() + who.slice(1)} ${TENSE_FR[tense]} de « ${verb.inf} » : « ${answer} ». ${verb.note}`;
}

function allForms(verb) {
  const out = [];
  for (const tense of ["present", "imparfait", "futur", "pc"]) {
    for (let p = 0; p < 6; p++) out.push(fullForm(verb, tense, p));
  }
  return out;
}

function misspell(form) {
  if (form.endsWith("ez")) return form.slice(0, -1) + "r";
  if (form.endsWith("ont")) return form.slice(0, -3) + "ent";
  if (form.endsWith("é")) return form.slice(0, -1) + "er";
  if (form.endsWith("s")) return form.slice(0, -1);
  return form + "e";
}

function pickDistractors(answer, pool) {
  const seen = new Set([answer]);
  const wrong = [];
  for (const item of pool) {
    if (seen.has(item) || !item) continue;
    seen.add(item);
    wrong.push(item);
    if (wrong.length === 3) break;
  }
  let n = 2;
  while (wrong.length < 3) {
    const guess = misspell(answer) + (n > 2 ? String(n) : "");
    n += 1;
    if (!seen.has(guess)) { seen.add(guess); wrong.push(guess); }
  }
  return wrong;
}

function seededShuffle(arr, seed) {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildConjugationQuestions() {
  // Fixed famous forms, so a bad table fails before any question is written.
  const check = (inf, tense, person, expected) => {
    const verb = VERBS.find(v => v.inf === inf);
    const got = fullForm(verb, tense, person);
    if (got !== expected) throw new Error(`${inf} ${tense} ${person}: ${got} !== ${expected}`);
  };
  check("finir", "futur", 4, "vous finirez");
  check("finir", "present", 4, "vous finissez");
  check("finir", "present", 5, "ils finissent");
  check("finir", "pc", 0, "j'ai fini");
  check("aller", "present", 0, "je vais");
  check("aller", "present", 5, "ils vont");
  check("aller", "futur", 0, "j'irai");
  check("aller", "pc", 0, "je suis allé");
  check("aller", "pc", 3, "nous sommes allés");
  check("aller", "pc", 4, "vous êtes allé");
  check("aller", "pc", 5, "ils sont allés");
  check("être", "present", 5, "ils sont");
  check("être", "present", 3, "nous sommes");
  check("être", "futur", 0, "je serai");
  check("être", "pc", 2, "il a été");
  check("avoir", "present", 0, "j'ai");
  check("avoir", "pc", 0, "j'ai eu");
  check("venir", "pc", 2, "il est venu");
  check("venir", "pc", 5, "ils sont venus");
  check("venir", "futur", 0, "je viendrai");
  check("faire", "present", 4, "vous faites");
  check("faire", "present", 5, "ils font");
  check("faire", "futur", 2, "il fera");
  check("pouvoir", "present", 5, "ils peuvent");
  check("pouvoir", "pc", 0, "j'ai pu");
  check("vouloir", "futur", 0, "je voudrai");
  check("prendre", "present", 5, "ils prennent");
  check("prendre", "pc", 2, "il a pris");
  check("voir", "futur", 0, "je verrai");
  check("voir", "present", 3, "nous voyons");
  check("devoir", "pc", 0, "j'ai dû");
  check("devoir", "futur", 4, "vous devrez");

  const questions = [];
  const usedPrompts = new Set();
  function add(q) {
    if (usedPrompts.has(q.prompt)) throw new Error("duplicate prompt " + q.prompt);
    if (new Set(q.choices).size !== 4) throw new Error("choices " + q.prompt);
    if (!q.choices.includes(q.answer)) throw new Error("answer missing " + q.prompt);
    usedPrompts.add(q.prompt);
    questions.push(q);
  }

  VERBS.forEach((verb, vi) => {
    // vous + futur, the shape of the owner's example.
    const personFutur = 4;
    const ansF = fullForm(verb, "futur", personFutur);
    const poolF = [
      fullForm(verb, "present", 4),
      fullForm(verb, "imparfait", 4),
      fullForm(verb, "futur", 0),
      fullForm(verb, "pc", 4),
    ];
    add({
      prompt: `Verbe ${verb.inf}, ${personLabel(verb, "futur", personFutur)}, au futur`,
      ask: "Quelle est la forme correcte ?",
      answer: ansF,
      choices: seededShuffle([ansF, ...pickDistractors(ansF, poolF)], 1000 + vi),
      explain: explainConj(verb, "futur", personFutur, ansF),
    });

    const pPres = (vi * 2 + 1) % 6;
    const ansP = fullForm(verb, "present", pPres);
    add({
      prompt: `Verbe ${verb.inf}, ${personLabel(verb, "present", pPres)}, au présent`,
      ask: "Quelle est la forme correcte ?",
      answer: ansP,
      choices: seededShuffle([ansP, ...pickDistractors(ansP, [
        fullForm(verb, "present", (pPres + 1) % 6),
        fullForm(verb, "imparfait", pPres),
        fullForm(verb, "futur", pPres),
        fullForm(verb, "present", (pPres + 3) % 6),
      ])], 1100 + vi),
      explain: explainConj(verb, "present", pPres, ansP),
    });

    const ansI = fullForm(verb, "imparfait", 2);
    add({
      prompt: `Verbe ${verb.inf}, ${personLabel(verb, "imparfait", 2)}, à l'imparfait`,
      ask: "Quelle est la forme correcte ?",
      answer: ansI,
      choices: seededShuffle([ansI, ...pickDistractors(ansI, [
        fullForm(verb, "present", 2),
        fullForm(verb, "futur", 2),
        fullForm(verb, "imparfait", 3),
        fullForm(verb, "imparfait", 5),
      ])], 1200 + vi),
      explain: explainConj(verb, "imparfait", 2, ansI),
    });

    const pcPerson = vi % 2 === 0 ? 0 : 5;
    const ansC = fullForm(verb, "pc", pcPerson);
    const wrongAux = verb.aux === "être"
      ? joinPronoun(PRONOUNS[pcPerson], ["ai", "as", "a", "avons", "avez", "ont"][pcPerson] + " " + verb.pp)
      : joinPronoun(PRONOUNS[pcPerson], ["suis", "es", "est", "sommes", "êtes", "sont"][pcPerson] + " " + verb.pp);
    add({
      prompt: `Verbe ${verb.inf}, ${personLabel(verb, "pc", pcPerson)}, au passé composé`,
      ask: "Quelle est la forme correcte ?",
      answer: ansC,
      choices: seededShuffle([ansC, ...pickDistractors(ansC, [
        wrongAux,
        fullForm(verb, "pc", (pcPerson + 2) % 6),
        fullForm(verb, "present", pcPerson),
        fullForm(verb, "imparfait", pcPerson),
      ])], 1300 + vi),
      explain: explainConj(verb, "pc", pcPerson, ansC),
    });

    // Infinitive from a distinctive form (nous, present — usually unique).
    const shown = fullForm(verb, "present", 3);
    const otherInfs = VERBS.map(v => v.inf).filter(x => x !== verb.inf);
    add({
      prompt: `Quel est l'infinitif de « ${shown} » ?`,
      ask: "Choisis l'infinitif.",
      answer: verb.inf,
      choices: seededShuffle([verb.inf, otherInfs[vi % otherInfs.length], otherInfs[(vi + 3) % otherInfs.length], otherInfs[(vi + 7) % otherInfs.length]], 1400 + vi),
      explain: `« ${shown} » est le présent, 1re personne du pluriel, de « ${verb.inf} ». L'infinitif est donc ${verb.inf}.`,
    });

    const ppWrongs = [
      verb.pp.endsWith("é") ? verb.pp.slice(0, -1) + "er" : verb.pp + "e",
      verb.pp + "s",
      VERBS[(vi + 4) % VERBS.length].pp,
    ];
    add({
      prompt: `Participe passé, masculin singulier, du verbe ${verb.inf}`,
      ask: "Quel est le participe passé ?",
      answer: verb.pp,
      choices: seededShuffle([verb.pp, ...pickDistractors(verb.pp, ppWrongs)], 1500 + vi),
      explain: verb.aux === "être"
        ? `Le participe passé masculin singulier de « ${verb.inf} » est « ${verb.pp} ». Avec être, il s'accorde : « il est ${verb.pp} », « ils sont ${verb.pp}s ».`
        : `Le participe passé masculin singulier de « ${verb.inf} » est « ${verb.pp} ». Avec avoir, et sans complément avant le verbe, il reste « ${verb.pp} » : « il a ${verb.pp} ».`,
    });
  });

  // Ten extra irregular contrasts so the bank is not only one pattern per verb.
  const extras = [
    ["être", "present", 0],
    ["être", "imparfait", 5],
    ["avoir", "futur", 5],
    ["aller", "present", 5],
    ["faire", "present", 5],
    ["venir", "futur", 4],
    ["pouvoir", "present", 2],
    ["vouloir", "present", 4],
    ["prendre", "futur", 3],
    ["voir", "present", 4],
  ];
  extras.forEach(([inf, tense, person], i) => {
    const verb = VERBS.find(v => v.inf === inf);
    const answer = fullForm(verb, tense, person);
    const prompt = `Verbe ${inf}, ${personLabel(verb, tense, person)}, ${TENSE_FR[tense]}`;
    if (usedPrompts.has(prompt)) return;
    add({
      prompt,
      ask: "Quelle est la forme correcte ?",
      answer,
      choices: seededShuffle([answer, ...pickDistractors(answer, allForms(verb))], 1600 + i),
      explain: explainConj(verb, tense, person, answer),
    });
  });

  if (questions.length < 100) throw new Error("only " + questions.length);
  return questions.slice(0, 100).map((q, i) => ({
    id: "C" + String(i + 1).padStart(3, "0"),
    prompt: q.prompt,
    ask: q.ask,
    choices: q.choices,
    answer: q.answer,
    explain: q.explain,
  }));
}

function serializeConj(qs) {
  const body = qs.map(q => `  ${JSON.stringify(q)}`).join(",\n");
  return `// French conjugation questions for Wizard's Quiz Academy.
// Generated by scripts/conjugation-rules.js — do not edit by hand.
// Passé composé with être agrees in the masculine (vous = masculine singular).
window.CONJ_FR = [
${body}
];
`;
}

function main() {
  const qs = buildConjugationQuestions();
  const out = path.join(__dirname, "..", "conj-fr.js");
  fs.writeFileSync(out, serializeConj(qs));
  console.log("wrote", out, qs.length);
}

module.exports = { buildConjugationQuestions, serializeConj, VERBS, fullForm };

if (require.main === module) main();
