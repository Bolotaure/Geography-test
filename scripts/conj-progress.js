// One-time compatibility for the conjugation cycle (1er → 2e → 3e).
//
// Storage that matters:
//   wqa-conj-session.found     question ids already credited
//   wqa-conj-session.score     points (left untouched)
//   wqa-conj-best              best score (left untouched)
//   wqa-conj-session.unlocked  relic levels already earned (left untouched)
//   wqa-conj-lesson-stars      stars per lesson number (left untouched)
//   wqa-conj-missed            review ids (dropped ids are removed)
//
// Old lessons were five ids wide and the ids were positional: lesson 1 was
// C001–C005, lesson 2 was C006–C010, and so on through C100.
//
// What changed: 37 third-group prompts left the bank. Their ids no longer
// exist, so a plain load would drop them from `found` and could reopen a
// lesson whose five ids moved. This migration does two separate things:
//
// 1. Credit exchange. Each removed id that was in `found` is exchanged for
//    exactly one new question id (C101+) that is not already credited.
//    Preference: same verb group and same lesson number, then same group,
//    then any remaining new question, in id order. A new id is used at most
//    once. Questions whose ids survived stay credited as themselves.
//    `found` therefore stays the same size. Score, best, and unlocked relics
//    are not rewritten, so a relic is not granted or taken away here.
//
// 2. Finished slots. If all five OLD ids of a lesson were credited, that
//    lesson number is recorded in wqa-conj-lesson-kept. The lesson node and
//    the matching home-path node stay closed. The new questions in that slot
//    are not marked found unless step 1 chose them as an exchange. Replaying
//    the node still asks any question that is not actually in `found`.
//
// The raw session is copied to wqa-conj-cycle-backup once. The record
// wqa-conj-cycle-migration.version === 1 makes a later load a no-op.
"use strict";

const VERB_GROUP = {
  parler: 1, aimer: 1, jouer: 1, chanter: 1, regarder: 1, écouter: 1, travailler: 1,
  finir: 2, choisir: 2, réussir: 2, grandir: 2, remplir: 2, obéir: 2,
  être: 3, avoir: 3, aller: 3, partir: 3, faire: 3, venir: 3,
  pouvoir: 3, vouloir: 3, prendre: 3, voir: 3, devoir: 3,
};

const DROPPED = {
  C040: { group: 3, lesson: 8, verb: "être" },
  C041: { group: 3, lesson: 9, verb: "être" },
  C042: { group: 3, lesson: 9, verb: "être" },
  C046: { group: 3, lesson: 10, verb: "avoir" },
  C047: { group: 3, lesson: 10, verb: "avoir" },
  C048: { group: 3, lesson: 10, verb: "avoir" },
  C052: { group: 3, lesson: 11, verb: "aller" },
  C053: { group: 3, lesson: 11, verb: "aller" },
  C054: { group: 3, lesson: 11, verb: "aller" },
  C058: { group: 3, lesson: 12, verb: "faire" },
  C059: { group: 3, lesson: 12, verb: "faire" },
  C060: { group: 3, lesson: 12, verb: "faire" },
  C063: { group: 3, lesson: 13, verb: "venir" },
  C064: { group: 3, lesson: 13, verb: "venir" },
  C065: { group: 3, lesson: 13, verb: "venir" },
  C066: { group: 3, lesson: 14, verb: "venir" },
  C070: { group: 3, lesson: 14, verb: "pouvoir" },
  C071: { group: 3, lesson: 15, verb: "pouvoir" },
  C072: { group: 3, lesson: 15, verb: "pouvoir" },
  C075: { group: 3, lesson: 15, verb: "vouloir" },
  C076: { group: 3, lesson: 16, verb: "vouloir" },
  C077: { group: 3, lesson: 16, verb: "vouloir" },
  C078: { group: 3, lesson: 16, verb: "vouloir" },
  C082: { group: 3, lesson: 17, verb: "prendre" },
  C083: { group: 3, lesson: 17, verb: "prendre" },
  C084: { group: 3, lesson: 17, verb: "prendre" },
  C087: { group: 3, lesson: 18, verb: "voir" },
  C088: { group: 3, lesson: 18, verb: "voir" },
  C089: { group: 3, lesson: 18, verb: "voir" },
  C090: { group: 3, lesson: 18, verb: "voir" },
  C094: { group: 3, lesson: 19, verb: "devoir" },
  C095: { group: 3, lesson: 19, verb: "devoir" },
  C096: { group: 3, lesson: 20, verb: "devoir" },
  C097: { group: 3, lesson: 20, verb: "être" },
  C098: { group: 3, lesson: 20, verb: "être" },
  C099: { group: 3, lesson: 20, verb: "avoir" },
  C100: { group: 3, lesson: 20, verb: "faire" },
};

function groupOf(inf) {
  const g = VERB_GROUP[inf];
  if (!g) throw new Error("no verb group for " + inf);
  return g;
}

function verbOf(q) {
  const t = String((q && q.prompt) || "");
  const named = t.match(/^Verbe ([^,]+),/) || t.match(/du verbe (.+)$/);
  if (named) return named[1].trim();
  if (/infinitif/i.test(t)) return String(q.answer || "").trim();
  return "";
}

function oldLessonIds(lesson) {
  const ids = [];
  for (let i = 0; i < 5; i++) ids.push("C" + String((lesson - 1) * 5 + i + 1).padStart(3, "0"));
  return ids;
}

function idNum(id) {
  const n = parseInt(String(id).replace(/^C/, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function migrateConjFound(foundIds, bank) {
  const items = (bank || []).map((q, i) => ({
    id: q.id,
    lesson: Math.floor(i / 5) + 1,
    group: groupOf(verbOf(q)),
    fresh: idNum(q.id) > 100,
  }));
  const live = new Set(items.map(q => q.id));
  const found = [];
  const seen = new Set();
  (foundIds || []).forEach(id => {
    const key = String(id);
    if (seen.has(key)) return;
    seen.add(key);
    found.push(key);
  });
  const credit = [];
  const creditSet = new Set();
  found.forEach(id => {
    if (live.has(id) && !DROPPED[id]) {
      credit.push(id);
      creditSet.add(id);
    }
  });
  const fresh = items.filter(q => q.fresh && !creditSet.has(q.id)).sort((a, b) => idNum(a.id) - idNum(b.id));
  const taken = new Set(creditSet);
  function take(pred) {
    const q = fresh.find(item => !taken.has(item.id) && pred(item));
    if (!q) return null;
    taken.add(q.id);
    return q;
  }
  const droppedFound = found.filter(id => DROPPED[id]).sort((a, b) => idNum(a) - idNum(b));
  const replacements = [];
  droppedFound.forEach(oldId => {
    const meta = DROPPED[oldId];
    const pick = take(q => q.group === meta.group && q.lesson === meta.lesson)
      || take(q => q.group === meta.group)
      || take(() => true);
    if (!pick) return;
    credit.push(pick.id);
    creditSet.add(pick.id);
    replacements.push({ from: oldId, to: pick.id, group: meta.group, lesson: meta.lesson, placedIn: pick.lesson });
  });
  const keptLessons = [];
  for (let n = 1; n <= 20; n++) {
    if (oldLessonIds(n).every(id => seen.has(id))) keptLessons.push(n);
  }
  return {
    found: credit,
    replacements,
    keptLessons,
    foundBefore: found.filter(id => live.has(id) || DROPPED[id]).length,
  };
}

const MIGRATION_VERSION = 1;

function applyConjMigration(store, bank) {
  const existing = store.get("wqa-conj-cycle-migration", null);
  if (existing && existing.version === MIGRATION_VERSION) return existing;
  const session = store.get("wqa-conj-session", null);
  if (!store.get("wqa-conj-cycle-backup", null)) {
    store.set("wqa-conj-cycle-backup", {
      session: session,
      stars: store.get("wqa-conj-lesson-stars", null),
      best: store.get("wqa-conj-best", null),
      unlocked: store.get("wqa-conj-unlocked", null),
      missed: store.get("wqa-conj-missed", null),
    });
  }
  const result = migrateConjFound((session && session.found) || [], bank || []);
  const live = new Set((bank || []).map(q => q.id));
  if (session && typeof session === "object") {
    const next = Object.assign({}, session);
    next.found = result.found;
    if (Array.isArray(next.missed)) next.missed = next.missed.filter(id => live.has(id));
    if (Array.isArray(next.queue)) next.queue = next.queue.filter(id => live.has(id));
    if (next.lock && next.lock.id && !live.has(next.lock.id)) next.lock = null;
    store.set("wqa-conj-session", next);
  }
  store.set("wqa-conj-lesson-kept", { version: MIGRATION_VERSION, lessons: result.keptLessons });
  const record = {
    version: MIGRATION_VERSION,
    replacements: result.replacements,
    keptLessons: result.keptLessons,
    foundBefore: result.foundBefore,
    foundAfter: result.found.length,
  };
  store.set("wqa-conj-cycle-migration", record);
  return record;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { migrateConjFound, applyConjMigration, groupOf, verbOf, DROPPED, VERB_GROUP, oldLessonIds, MIGRATION_VERSION };
}
if (typeof window !== "undefined") {
  window.applyConjMigration = applyConjMigration;
  window.migrateConjFound = migrateConjFound;
}
