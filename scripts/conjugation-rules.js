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

// 1 = -er (except aller). 2 = regular -ir with -iss-. 3 = everything else.
// Ending in -ir is not enough: partir and aller are 3rd group.
const VERB_GROUP = {
  parler: 1, aimer: 1, jouer: 1, chanter: 1, regarder: 1, écouter: 1, travailler: 1,
  manger: 1, commencer: 1, appeler: 1, acheter: 1, envoyer: 1,
  arriver: 1, tomber: 1, rester: 1, entrer: 1,
  finir: 2, choisir: 2, réussir: 2, grandir: 2, remplir: 2, obéir: 2, rougir: 2, réfléchir: 2,
  être: 3, avoir: 3, aller: 3, partir: 3, faire: 3, venir: 3,
  pouvoir: 3, vouloir: 3, prendre: 3, voir: 3, devoir: 3,
  sortir: 3, dire: 3, mettre: 3, savoir: 3, lire: 3, écrire: 3, boire: 3, dormir: 3,
};
function groupOf(inf) {
  const g = VERB_GROUP[inf];
  if (!g) throw new Error("no verb group for " + inf);
  return g;
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
  V("chanter", "avoir", "chanté",
    ["chante", "chantes", "chante", "chantons", "chantez", "chantent"],
    ["chantais", "chantais", "chantait", "chantions", "chantiez", "chantaient"],
    ["chanterai", "chanteras", "chantera", "chanterons", "chanterez", "chanteront"],
    "Verbe régulier en -er."),
  V("regarder", "avoir", "regardé",
    ["regarde", "regardes", "regarde", "regardons", "regardez", "regardent"],
    ["regardais", "regardais", "regardait", "regardions", "regardiez", "regardaient"],
    ["regarderai", "regarderas", "regardera", "regarderons", "regarderez", "regarderont"],
    "Verbe régulier en -er."),
  V("écouter", "avoir", "écouté",
    ["écoute", "écoutes", "écoute", "écoutons", "écoutez", "écoutent"],
    ["écoutais", "écoutais", "écoutait", "écoutions", "écoutiez", "écoutaient"],
    ["écouterai", "écouteras", "écoutera", "écouterons", "écouterez", "écouteront"],
    "Verbe régulier en -er."),
  V("travailler", "avoir", "travaillé",
    ["travaille", "travailles", "travaille", "travaillons", "travaillez", "travaillent"],
    ["travaillais", "travaillais", "travaillait", "travaillions", "travailliez", "travaillaient"],
    ["travaillerai", "travailleras", "travaillera", "travaillerons", "travaillerez", "travailleront"],
    "Verbe régulier en -er."),
  V("grandir", "avoir", "grandi",
    ["grandis", "grandis", "grandit", "grandissons", "grandissez", "grandissent"],
    ["grandissais", "grandissais", "grandissait", "grandissions", "grandissiez", "grandissaient"],
    ["grandirai", "grandiras", "grandira", "grandirons", "grandirez", "grandiront"],
    "Verbe du 2e groupe : le pluriel du présent et l'imparfait prennent -iss-."),
  V("remplir", "avoir", "rempli",
    ["remplis", "remplis", "remplit", "remplissons", "remplissez", "remplissent"],
    ["remplissais", "remplissais", "remplissait", "remplissions", "remplissiez", "remplissaient"],
    ["remplirai", "rempliras", "remplira", "remplirons", "remplirez", "rempliront"],
    "Verbe du 2e groupe, comme finir."),
  V("obéir", "avoir", "obéi",
    ["obéis", "obéis", "obéit", "obéissons", "obéissez", "obéissent"],
    ["obéissais", "obéissais", "obéissait", "obéissions", "obéissiez", "obéissaient"],
    ["obéirai", "obéiras", "obéira", "obéirons", "obéirez", "obéiront"],
    "Verbe du 2e groupe."),
  V("partir", "être", "parti",
    ["pars", "pars", "part", "partons", "partez", "partent"],
    ["partais", "partais", "partait", "partions", "partiez", "partaient"],
    ["partirai", "partiras", "partira", "partirons", "partirez", "partiront"],
    "Partir est du 3e groupe, malgré -ir : pas de -iss-. Le passé composé se forme avec être."),
  V("manger", "avoir", "mangé",
    ["mange", "manges", "mange", "mangeons", "mangez", "mangent"],
    ["mangeais", "mangeais", "mangeait", "mangions", "mangiez", "mangeaient"],
    ["mangerai", "mangeras", "mangera", "mangerons", "mangerez", "mangeront"],
    "Verbe en -ger : on garde le e devant a et o pour que le g reste doux (nous mangeons, je mangeais)."),
  V("commencer", "avoir", "commencé",
    ["commence", "commences", "commence", "commençons", "commencez", "commencent"],
    ["commençais", "commençais", "commençait", "commencions", "commenciez", "commençaient"],
    ["commencerai", "commenceras", "commencera", "commencerons", "commencerez", "commenceront"],
    "Verbe en -cer : le c devient ç devant a et o (nous commençons, il commençait)."),
  V("appeler", "avoir", "appelé",
    ["appelle", "appelles", "appelle", "appelons", "appelez", "appellent"],
    ["appelais", "appelais", "appelait", "appelions", "appeliez", "appelaient"],
    ["appellerai", "appelleras", "appellera", "appellerons", "appellerez", "appelleront"],
    "Appeler double le l devant un e muet : j'appelle, ils appellent, j'appellerai ; mais nous appelons."),
  V("acheter", "avoir", "acheté",
    ["achète", "achètes", "achète", "achetons", "achetez", "achètent"],
    ["achetais", "achetais", "achetait", "achetions", "achetiez", "achetaient"],
    ["achèterai", "achèteras", "achètera", "achèterons", "achèterez", "achèteront"],
    "Acheter prend un accent grave devant un e muet : j'achète, j'achèterai ; mais nous achetons."),
  V("envoyer", "avoir", "envoyé",
    ["envoie", "envoies", "envoie", "envoyons", "envoyez", "envoient"],
    ["envoyais", "envoyais", "envoyait", "envoyions", "envoyiez", "envoyaient"],
    ["enverrai", "enverras", "enverra", "enverrons", "enverrez", "enverront"],
    "Envoyer change y en i devant un e muet (il envoie) et son futur est irrégulier : j'enverrai."),
  V("arriver", "être", "arrivé",
    ["arrive", "arrives", "arrive", "arrivons", "arrivez", "arrivent"],
    ["arrivais", "arrivais", "arrivait", "arrivions", "arriviez", "arrivaient"],
    ["arriverai", "arriveras", "arrivera", "arriverons", "arriverez", "arriveront"],
    "Arriver est un verbe de mouvement : son passé composé se forme avec être."),
  V("tomber", "être", "tombé",
    ["tombe", "tombes", "tombe", "tombons", "tombez", "tombent"],
    ["tombais", "tombais", "tombait", "tombions", "tombiez", "tombaient"],
    ["tomberai", "tomberas", "tombera", "tomberons", "tomberez", "tomberont"],
    "Tomber se conjugue avec être au passé composé."),
  V("rester", "être", "resté",
    ["reste", "restes", "reste", "restons", "restez", "restent"],
    ["restais", "restais", "restait", "restions", "restiez", "restaient"],
    ["resterai", "resteras", "restera", "resterons", "resterez", "resteront"],
    "Rester se conjugue avec être au passé composé."),
  V("entrer", "être", "entré",
    ["entre", "entres", "entre", "entrons", "entrez", "entrent"],
    ["entrais", "entrais", "entrait", "entrions", "entriez", "entraient"],
    ["entrerai", "entreras", "entrera", "entrerons", "entrerez", "entreront"],
    "Entrer se conjugue avec être au passé composé."),
  V("rougir", "avoir", "rougi",
    ["rougis", "rougis", "rougit", "rougissons", "rougissez", "rougissent"],
    ["rougissais", "rougissais", "rougissait", "rougissions", "rougissiez", "rougissaient"],
    ["rougirai", "rougiras", "rougira", "rougirons", "rougirez", "rougiront"],
    "Verbe du 2e groupe, comme finir."),
  V("réfléchir", "avoir", "réfléchi",
    ["réfléchis", "réfléchis", "réfléchit", "réfléchissons", "réfléchissez", "réfléchissent"],
    ["réfléchissais", "réfléchissais", "réfléchissait", "réfléchissions", "réfléchissiez", "réfléchissaient"],
    ["réfléchirai", "réfléchiras", "réfléchira", "réfléchirons", "réfléchirez", "réfléchiront"],
    "Verbe du 2e groupe : -iss- au pluriel du présent et à l'imparfait."),
  V("sortir", "être", "sorti",
    ["sors", "sors", "sort", "sortons", "sortez", "sortent"],
    ["sortais", "sortais", "sortait", "sortions", "sortiez", "sortaient"],
    ["sortirai", "sortiras", "sortira", "sortirons", "sortirez", "sortiront"],
    "Sortir est du 3e groupe, comme partir. Son passé composé se forme avec être."),
  V("dire", "avoir", "dit",
    ["dis", "dis", "dit", "disons", "dites", "disent"],
    ["disais", "disais", "disait", "disions", "disiez", "disaient"],
    ["dirai", "diras", "dira", "dirons", "direz", "diront"],
    "Dire est irrégulier : vous dites. Le participe passé est « dit »."),
  V("mettre", "avoir", "mis",
    ["mets", "mets", "met", "mettons", "mettez", "mettent"],
    ["mettais", "mettais", "mettait", "mettions", "mettiez", "mettaient"],
    ["mettrai", "mettras", "mettra", "mettrons", "mettrez", "mettront"],
    "Mettre est irrégulier. Le participe passé est « mis »."),
  V("savoir", "avoir", "su",
    ["sais", "sais", "sait", "savons", "savez", "savent"],
    ["savais", "savais", "savait", "savions", "saviez", "savaient"],
    ["saurai", "sauras", "saura", "saurons", "saurez", "sauront"],
    "Savoir est irrégulier : je sais, je saurai. Le participe passé est « su »."),
  V("lire", "avoir", "lu",
    ["lis", "lis", "lit", "lisons", "lisez", "lisent"],
    ["lisais", "lisais", "lisait", "lisions", "lisiez", "lisaient"],
    ["lirai", "liras", "lira", "lirons", "lirez", "liront"],
    "Lire est irrégulier. Le participe passé est « lu »."),
  V("écrire", "avoir", "écrit",
    ["écris", "écris", "écrit", "écrivons", "écrivez", "écrivent"],
    ["écrivais", "écrivais", "écrivait", "écrivions", "écriviez", "écrivaient"],
    ["écrirai", "écriras", "écrira", "écrirons", "écrirez", "écriront"],
    "Écrire prend un v au pluriel du présent et à l'imparfait : nous écrivons, ils écrivaient."),
  V("boire", "avoir", "bu",
    ["bois", "bois", "boit", "buvons", "buvez", "boivent"],
    ["buvais", "buvais", "buvait", "buvions", "buviez", "buvaient"],
    ["boirai", "boiras", "boira", "boirons", "boirez", "boiront"],
    "Boire est irrégulier : nous buvons, ils boivent, je buvais. Le participe passé est « bu »."),
  V("dormir", "avoir", "dormi",
    ["dors", "dors", "dort", "dormons", "dormez", "dorment"],
    ["dormais", "dormais", "dormait", "dormions", "dormiez", "dormaient"],
    ["dormirai", "dormiras", "dormira", "dormirons", "dormirez", "dormiront"],
    "Dormir est du 3e groupe, malgré -ir : pas de -iss- (tu dors, nous dormons)."),
];

function joinPronoun(pronoun, rest) {
  if (pronoun === "je" && /^[aeiouàâäéèêëîïôùûühœ]/i.test(rest)) return "j'" + rest;
  return pronoun + " " + rest;
}

function ppFor(verb, person, fem) {
  if (verb.aux !== "être") return verb.pp;
  // Agreement with the subject. vous is treated as masculine singular.
  const plural = person === 3 || person === 5;
  return verb.pp + (fem ? "e" : "") + (plural ? "s" : "");
}

function stemOf(verb, tense, person, fem) {
  if (tense === "present") return verb.present[person];
  if (tense === "imparfait") return verb.imparfait[person];
  if (tense === "futur") return verb.futur[person];
  if (tense === "pc") {
    const aux = verb.aux === "être"
      ? ["suis", "es", "est", "sommes", "êtes", "sont"][person]
      : ["ai", "as", "a", "avons", "avez", "ont"][person];
    return aux + " " + ppFor(verb, person, fem);
  }
  throw new Error("tense " + tense);
}

function pronounOf(person, fem) {
  if (fem && person === 2) return "elle";
  if (fem && person === 5) return "elles";
  return PRONOUNS[person];
}
function fullForm(verb, tense, person, fem) {
  return joinPronoun(pronounOf(person, fem), stemOf(verb, tense, person, fem));
}

const TENSE_FR = {
  present: "au présent",
  imparfait: "à l'imparfait",
  futur: "au futur",
  pc: "au passé composé",
};

function personLabel(verb, tense, person, fem) {
  let label = PERSON_LABEL[person];
  if (fem) label += person === 2 ? ", féminin (elle)" : ", féminin (elles)";
  if (tense === "pc" && verb.aux === "être" && person === 4) label += ", masculin singulier";
  return label;
}

function explainConj(verb, tense, person, answer, fem) {
  const who = personLabel(verb, tense, person, fem);
  if (tense === "pc" && verb.aux === "être") {
    return `« ${verb.inf} » se conjugue au passé composé avec être. ${who.charAt(0).toUpperCase() + who.slice(1)} : « ${answer} ». Le participe s'accorde avec le sujet ${fem ? "féminin" : "masculin"}${person === 3 || person === 5 ? " pluriel" : ""}. ${verb.note}`;
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
  check("chanter", "present", 3, "nous chantons");
  check("écouter", "present", 0, "j'écoute");
  check("grandir", "present", 5, "ils grandissent");
  check("obéir", "present", 0, "j'obéis");
  check("partir", "present", 4, "vous partez");
  check("partir", "present", 5, "ils partent");
  check("partir", "pc", 0, "je suis parti");
  check("partir", "pc", 3, "nous sommes partis");
  check("partir", "pc", 4, "vous êtes parti");
  check("partir", "futur", 0, "je partirai");

  const questions = [];
  const usedPrompts = new Set();
  function add(q) {
    if (usedPrompts.has(q.prompt)) throw new Error("duplicate prompt " + q.prompt);
    if (new Set(q.choices).size !== 4) throw new Error("choices " + q.prompt);
    if (!q.choices.includes(q.answer)) throw new Error("answer missing " + q.prompt);
    usedPrompts.add(q.prompt);
    questions.push(q);
  }

  // The bank, by hand: every tense at all six persons, all three groups,
  // passé composé with être (some feminine), irregular participles, and the
  // -cer / -ger / -eler / -eter / -yer spelling changes. [verb, tense, person, feminine]
  const PLAN = [
    // 1er groupe (34)
    ["manger", "present", 3], ["commencer", "present", 3], ["appeler", "present", 5], ["acheter", "present", 0],
    ["envoyer", "present", 2], ["parler", "present", 1], ["chanter", "present", 4],
    ["appeler", "futur", 0], ["acheter", "futur", 3], ["envoyer", "futur", 1], ["jouer", "futur", 2],
    ["travailler", "futur", 4], ["regarder", "futur", 5],
    ["manger", "imparfait", 0], ["commencer", "imparfait", 2], ["écouter", "imparfait", 1], ["aimer", "imparfait", 3],
    ["parler", "imparfait", 4], ["jouer", "imparfait", 5],
    ["arriver", "pc", 2, true], ["tomber", "pc", 5, true], ["rester", "pc", 0], ["entrer", "pc", 3],
    ["manger", "pc", 1], ["écouter", "pc", 4],
    ["appeler", "inf", 0], ["acheter", "inf", 2], ["envoyer", "inf", 1], ["commencer", "inf", 3],
    ["chanter", "pp"], ["tomber", "pp"], ["envoyer", "pp"], ["regarder", "pp"], ["commencer", "pp"],
    // 2e groupe (33)
    ["finir", "present", 0], ["choisir", "present", 1], ["grandir", "present", 2], ["obéir", "present", 3],
    ["réfléchir", "present", 4], ["remplir", "present", 5], ["rougir", "present", 2],
    ["finir", "futur", 3], ["réussir", "futur", 0], ["remplir", "futur", 1], ["choisir", "futur", 4],
    ["grandir", "futur", 5], ["obéir", "futur", 2],
    ["choisir", "imparfait", 0], ["grandir", "imparfait", 1], ["réussir", "imparfait", 2], ["remplir", "imparfait", 3],
    ["finir", "imparfait", 4], ["réfléchir", "imparfait", 5],
    ["finir", "pc", 2], ["obéir", "pc", 0], ["réussir", "pc", 3], ["choisir", "pc", 5], ["rougir", "pc", 1],
    ["grandir", "inf", 3], ["obéir", "inf", 5], ["choisir", "inf", 4], ["réfléchir", "inf", 0],
    ["finir", "pp"], ["remplir", "pp"], ["obéir", "pp"], ["réfléchir", "pp"], ["grandir", "pp"],
    // 3e groupe (33)
    ["être", "present", 3], ["avoir", "present", 5], ["aller", "present", 0], ["faire", "present", 4], ["dormir", "present", 1],
    ["être", "futur", 0], ["avoir", "futur", 1], ["aller", "futur", 3], ["venir", "futur", 2], ["voir", "futur", 4], ["faire", "futur", 5],
    ["être", "imparfait", 2], ["devoir", "imparfait", 0], ["dire", "imparfait", 4], ["boire", "imparfait", 3], ["écrire", "imparfait", 5],
    ["aller", "pc", 2, true], ["venir", "pc", 5, true], ["partir", "pc", 0], ["sortir", "pc", 3],
    ["faire", "pc", 1], ["prendre", "pc", 4], ["voir", "pc", 2],
    ["aller", "inf", 5], ["pouvoir", "inf", 0], ["faire", "inf", 3], ["boire", "inf", 5], ["savoir", "inf", 1],
    ["mettre", "pp"], ["lire", "pp"], ["être", "pp"], ["avoir", "pp"], ["vouloir", "pp"],
  ];
  // Wrong participles a child really writes (a manger, il a finit, tu as fais).
  const PP_WRONG = {
    chanté: ["chanter", "chantez", "chantait"], tombé: ["tomber", "tombez", "tombait"],
    envoyé: ["envoyer", "envoié", "envoyait"], regardé: ["regarder", "regardez", "regardait"],
    commencé: ["commencer", "commençé", "commençait"], fini: ["finit", "finis", "finé"],
    rempli: ["remplit", "remplis", "remplé"], obéi: ["obéit", "obéis", "obéissé"],
    réfléchi: ["réfléchit", "réfléchis", "réfléchissé"], grandi: ["grandit", "grandis", "grandu"],
    mis: ["mit", "mi", "mettu"], lu: ["lut", "lis", "lisé"], été: ["était", "étais", "êtu"],
    eu: ["eut", "eus", "avu"], voulu: ["voulut", "voulus", "voulé"],
  };
  const slip = pp => (PP_WRONG[pp] && PP_WRONG[pp][0]) || { fait: "fais", pris: "prit", vu: "vus" }[pp]
    || (pp.endsWith("é") ? pp.slice(0, -1) + "er" : pp.endsWith("i") ? pp + "t" : pp + "s");
  const byInf = inf => {
    const v = VERBS.find(x => x.inf === inf);
    if (!v) throw new Error("no verb " + inf);
    return v;
  };
  PLAN.forEach(([inf, tense, person, fem], k) => {
    const verb = byInf(inf);
    const seed = 2000 + k;
    if (tense === "inf") {
      const shown = fullForm(verb, "present", person);
      const g = groupOf(inf);
      const same = VERBS.map(v => v.inf).filter(x => x !== inf && groupOf(x) === g);
      const other = VERBS.map(v => v.inf).filter(x => x !== inf && groupOf(x) !== g);
      const wrong = [same[k % same.length], same[(k + 3) % same.length], other[k % other.length]];
      add({
        prompt: `Quel est l'infinitif de « ${shown} » ?`,
        ask: "Choisis l'infinitif.",
        answer: inf,
        choices: seededShuffle([inf, ...pickDistractors(inf, wrong)], seed),
        explain: `« ${shown} » est le présent, ${PERSON_LABEL[person]}, de « ${inf} ». L'infinitif est donc ${inf}.`,
      });
      return;
    }
    if (tense === "pp") {
      const ppWrongs = PP_WRONG[verb.pp];
      if (!ppWrongs) throw new Error("no participle distractors for " + verb.pp);
      add({
        prompt: `Participe passé, masculin singulier, du verbe ${inf}`,
        ask: "Quel est le participe passé ?",
        answer: verb.pp,
        choices: seededShuffle([verb.pp, ...pickDistractors(verb.pp, ppWrongs)], seed),
        explain: verb.aux === "être"
          ? `Le participe passé masculin singulier de « ${inf} » est « ${verb.pp} ». Avec être, il s'accorde : « il est ${verb.pp} », « elle est ${verb.pp}e ».`
          : `Le participe passé masculin singulier de « ${inf} » est « ${verb.pp} ». Avec avoir, il reste en général invariable : « il a ${verb.pp} ».`,
      });
      return;
    }
    const answer = fullForm(verb, tense, person, fem);
    let pool;
    if (tense === "pc") {
      // With être, the classic slip is avoir (j'ai parti). With avoir, être
      // would give a real passive (il est vu), so use a misspelt participle.
      const auxAvoir = ["ai", "as", "a", "avons", "avez", "ont"][person];
      pool = [
        joinPronoun(pronounOf(person, fem), verb.aux === "être" ? auxAvoir + " " + verb.pp : auxAvoir + " " + slip(verb.pp)),
        fem ? fullForm(verb, "pc", person, false).replace(/^il(s?) /, "elle$1 ") : fullForm(verb, "pc", (person + 3) % 6),
        fullForm(verb, "imparfait", person, fem),
        fullForm(verb, "present", person, fem),
      ];
    } else {
      const others = ["present", "imparfait", "futur"].filter(t => t !== tense);
      pool = [
        fullForm(verb, others[0], person, fem),
        fullForm(verb, others[1], person, fem),
        fullForm(verb, tense, (person + 3) % 6),
        fullForm(verb, tense, (person + 1) % 6),
      ];
    }
    add({
      prompt: `Verbe ${inf}, ${personLabel(verb, tense, person, fem)}, ${TENSE_FR[tense]}`,
      ask: "Quelle est la forme correcte ?",
      answer,
      choices: seededShuffle([answer, ...pickDistractors(answer, pool)], seed),
      explain: explainConj(verb, tense, person, answer, fem),
    });
  });

  if (questions.length < 100) throw new Error("only " + questions.length);

  const legacy = require("./conj-legacy-ids.json");
  questions.forEach((q, i) => {
    q._seq = i;
    if (legacy[q.prompt]) {
      q.id = legacy[q.prompt];
      q._legacy = true;
    }
  });
  let nextId = 101;
  questions.filter(q => !q.id).sort((a, b) => a.prompt.localeCompare(b.prompt, "fr")).forEach(q => {
    q.id = "C" + String(nextId).padStart(3, "0");
    nextId += 1;
  });

  function verbFromQuestion(q) {
    const t = q.prompt;
    const named = t.match(/^Verbe ([^,]+),/) || t.match(/du verbe (.+)$/);
    if (named) return named[1].trim();
    if (/infinitif/i.test(t)) return q.answer;
    throw new Error("no verb in " + t);
  }
  function roundRobin(items, quota) {
    const byVerb = new Map();
    items.forEach(q => {
      const v = verbFromQuestion(q);
      if (!byVerb.has(v)) byVerb.set(v, []);
      byVerb.get(v).push(q);
    });
    const verbs = [...byVerb.keys()].sort((a, b) => a.localeCompare(b, "fr"));
    verbs.forEach(v => byVerb.get(v).sort((a, b) => a._seq - b._seq));
    const out = [];
    let guard = 0;
    while (out.length < quota && guard < 10000) {
      guard += 1;
      let progressed = false;
      for (const v of verbs) {
        const list = byVerb.get(v);
        if (!list.length) continue;
        out.push(list.shift());
        progressed = true;
        if (out.length >= quota) break;
      }
      if (!progressed) break;
    }
    if (out.length < quota) throw new Error("not enough questions for quota " + quota + " (got " + out.length + ")");
    return out;
  }
  function legacyFirst(items, quota) {
    const legacyQs = roundRobin(items.filter(q => q._legacy), Math.min(quota, items.filter(q => q._legacy).length));
    const fresh = quota > legacyQs.length ? roundRobin(items.filter(q => !q._legacy), quota - legacyQs.length) : [];
    return roundRobin(legacyQs.concat(fresh), quota);
  }
  const buckets = { 1: [], 2: [], 3: [] };
  questions.forEach(q => buckets[groupOf(verbFromQuestion(q))].push(q));
  const partir = buckets[3].filter(q => verbFromQuestion(q) === "partir");
  const other3 = buckets[3].filter(q => verbFromQuestion(q) !== "partir");
  const picked = {
    1: legacyFirst(buckets[1], 34),
    2: legacyFirst(buckets[2], 33),
    3: roundRobin(partir.concat(legacyFirst(other3, 33 - partir.length)), 33),
  };
  const pools = { 1: picked[1].slice(), 2: picked[2].slice(), 3: picked[3].slice() };
  const TENSE_CYCLE = ["fut", "pre", "imp", "pc", "inf", "pp"];
  function tenseOf(q) {
    const p = q.prompt;
    if (/passé composé/.test(p)) return "pc";
    if (/imparfait/.test(p)) return "imp";
    if (/futur/.test(p)) return "fut";
    if (/présent/.test(p)) return "pre";
    if (/infinitif/i.test(p)) return "inf";
    if (/[Pp]articipe/.test(p)) return "pp";
    return "other";
  }
  function personOf(q) {
    if (/1re personne du singulier/.test(q.prompt)) return "1s";
    if (/2e personne du singulier/.test(q.prompt)) return "2s";
    if (/3e personne du singulier/.test(q.prompt)) return "3s";
    if (/1re personne du pluriel/.test(q.prompt)) return "1p";
    if (/2e personne du pluriel/.test(q.prompt)) return "2p";
    if (/3e personne du pluriel/.test(q.prompt)) return "3p";
    if (/infinitif/i.test(q.prompt)) return "inf";
    if (/[Pp]articipe/.test(q.prompt)) return "pp";
    return "x";
  }
  const ordered = [];
  const taken = { 1: 0, 2: 0, 3: 0 };
  let g = 1;
  let prevPerson = "";
  while (ordered.length < 100) {
    const pool = pools[g];
    if (!pool.length) throw new Error("group " + g + " ran out at " + ordered.length);
    const prev = ordered.length ? tenseOf(ordered[ordered.length - 1]) : "";
    const want = TENSE_CYCLE[(taken[g] + (g - 1) * 2) % TENSE_CYCLE.length];
    const tagged = pool.map((q, i) => ({ q, i, tense: tenseOf(q), person: personOf(q) }));
    let choices = tagged.filter(x => x.tense === want && x.tense !== prev);
    if (!choices.length) choices = tagged.filter(x => x.tense !== prev);
    if (!choices.length) choices = tagged.filter(x => x.tense === want);
    if (!choices.length) choices = tagged;
    const choice = choices.find(x => x.person !== prevPerson) || choices[0];
    pool.splice(choice.i, 1);
    ordered.push(choice.q);
    prevPerson = choice.person;
    taken[g] += 1;
    g = g === 3 ? 1 : g + 1;
  }
  function tenseAt(i) { return i >= 0 && i < ordered.length ? tenseOf(ordered[i]) : ""; }
  for (let pass = 0; pass < 12; pass++) {
    for (let i = 1; i < ordered.length; i++) {
      if (tenseAt(i) !== tenseAt(i - 1)) continue;
      for (let j = 0; j < ordered.length; j++) {
        if (j % 3 !== i % 3 || j === i) continue;
        const tj = tenseAt(j);
        if (tj === tenseAt(i - 1)) continue;
        if (i + 1 < ordered.length && tj === tenseAt(i + 1)) continue;
        if (j > 0 && tenseAt(i) === tenseAt(j - 1)) continue;
        if (j + 1 < ordered.length && tenseAt(i) === tenseAt(j + 1)) continue;
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        break;
      }
    }
  }
  for (let n = 0; n < 20; n++) {
    const slice = [0, 1, 2, 3, 4].map(k => n * 5 + k);
    const kinds = new Set(slice.map(i => tenseAt(i)));
    if (kinds.size >= 3) continue;
    const slot = slice.find(i => {
      const others = slice.filter(x => x !== i).map(tenseAt);
      return others.filter(t => t === tenseAt(i)).length >= 1 || kinds.size < 3;
    }) || slice[0];
    for (let j = slot % 3; j < ordered.length; j += 3) {
      if (slice.includes(j)) continue;
      const nextKinds = new Set(slice.map(i => i === slot ? tenseAt(j) : tenseAt(i)));
      if (nextKinds.size < 3) continue;
      const neighborsOk = (idx, tense) => (idx === 0 || tense !== tenseAt(idx - 1)) && (idx === ordered.length - 1 || tense !== tenseAt(idx + 1) || slice.includes(idx + 1));
      if (!neighborsOk(slot, tenseAt(j)) || !neighborsOk(j, tenseAt(slot))) continue;
      [ordered[slot], ordered[j]] = [ordered[j], ordered[slot]];
      break;
    }
  }
  return ordered.map(q => ({
    id: q.id,
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
// Passé composé with être agrees with the subject (vous = masculine singular).
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

function verbFromQuestion(q) {
  const t = String(q.prompt || "");
  const named = t.match(/^Verbe ([^,]+),/) || t.match(/du verbe (.+)$/);
  if (named) return named[1].trim();
  if (/infinitif/i.test(t)) return q.answer;
  return "";
}

module.exports = { buildConjugationQuestions, serializeConj, VERBS, fullForm, groupOf, verbFromQuestion, VERB_GROUP };

if (require.main === module) main();
