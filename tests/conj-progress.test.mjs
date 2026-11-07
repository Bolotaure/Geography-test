import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyConjMigration, migrateConjFound, DROPPED } from "../scripts/conj-progress.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "conj-fr.js"), "utf8"), ctx);
const bank = ctx.window.CONJ_FR;

function ids(from, to) {
  const out = [];
  for (let n = from; n <= to; n++) out.push("C" + String(n).padStart(3, "0"));
  return out;
}

function memoryStore(seed) {
  const data = {};
  Object.entries(seed || {}).forEach(([k, v]) => {
    data[k] = JSON.parse(JSON.stringify(v));
  });
  return {
    get(k, d) {
      return Object.prototype.hasOwnProperty.call(data, k) ? JSON.parse(JSON.stringify(data[k])) : d;
    },
    set(k, v) { data[k] = JSON.parse(JSON.stringify(v)); },
    snapshot() { return JSON.parse(JSON.stringify(data)); },
  };
}

test("full old conjugation save keeps its count, relics, and every lesson", () => {
  const found = ids(1, 100);
  const store = memoryStore({
    "wqa-conj-session": {
      queue: ["C001"], found, score: 4200, streak: 4, misses: 0,
      missed: ["C040"], unlocked: [1, 2, 3, 4, 5, 6], best: 4200, won: true, tags: false, lock: { id: "C040", picked: "x" },
    },
    "wqa-conj-best": 4200,
    "wqa-conj-unlocked": [1, 2, 3, 4, 5, 6],
    "wqa-conj-lesson-stars": Object.fromEntries(ids(1, 20).map((_, i) => [i + 1, 3])),
  });
  const record = applyConjMigration(store, bank);
  const session = store.get("wqa-conj-session");
  assert.equal(session.found.length, 100);
  assert.equal(new Set(session.found).size, 100);
  assert.equal(session.score, 4200);
  assert.equal(session.best, 4200);
  assert.deepEqual(session.unlocked, [1, 2, 3, 4, 5, 6]);
  assert.equal(session.won, true);
  assert.equal(session.lock, null);
  assert.deepEqual(session.missed, []);
  assert.equal(store.get("wqa-conj-best"), 4200);
  assert.deepEqual(store.get("wqa-conj-unlocked"), [1, 2, 3, 4, 5, 6]);
  assert.equal(store.get("wqa-conj-lesson-stars")[20], 3);
  assert.deepEqual(record.keptLessons, ids(1, 20).map((_, i) => i + 1));
  assert.equal(record.replacements.length, 37);
  const targets = record.replacements.map(r => r.to);
  assert.equal(new Set(targets).size, 37);
  assert.ok(record.replacements.every(r => DROPPED[r.from]));
  assert.ok(session.found.includes("C001"));
  assert.ok(!session.found.includes("C040"));
  const again = applyConjMigration(store, bank);
  assert.deepEqual(again, record);
  assert.deepEqual(store.get("wqa-conj-session").found, session.found);
  assert.deepEqual(store.get("wqa-conj-cycle-backup").session.found, found);
  assert.equal(store.get("wqa-conj-cycle-backup").session.score, 4200);
});

test("partial save exchanges removed credits and closes only finished lessons", () => {
  const found = ids(1, 10).concat(["C040", "C041", "C096"]);
  const store = memoryStore({
    "wqa-conj-session": {
      queue: found.slice(), found, score: 800, streak: 1, misses: 2,
      missed: ["C041", "C002"], unlocked: [1], best: 900, won: false, tags: true, lock: null,
    },
    "wqa-conj-best": 900,
    "wqa-conj-unlocked": [1],
    "wqa-conj-lesson-stars": { 1: 3, 2: 2 },
  });
  const record = applyConjMigration(store, bank);
  const session = store.get("wqa-conj-session");
  assert.equal(session.found.length, found.length);
  assert.equal(new Set(session.found).size, found.length);
  assert.equal(session.score, 800);
  assert.equal(session.best, 900);
  assert.deepEqual(session.unlocked, [1]);
  assert.equal(store.get("wqa-conj-best"), 900);
  assert.equal(store.get("wqa-conj-lesson-stars")[1], 3);
  assert.deepEqual(record.keptLessons, [1, 2]);
  assert.equal(record.replacements.length, 3);
  assert.deepEqual(session.missed, ["C002"]);
  ids(1, 10).forEach(id => assert.ok(session.found.includes(id), id));
  ["C040", "C041", "C096"].forEach(id => assert.ok(!session.found.includes(id)));
  const freshTargets = new Set(record.replacements.map(r => r.to));
  assert.equal(freshTargets.size, 3);
  record.replacements.forEach(r => assert.ok(!ids(1, 100).includes(r.to)));
  const first = store.snapshot();
  applyConjMigration(store, bank);
  assert.deepEqual(store.snapshot(), first);
});

test("an empty save only writes the version marker", () => {
  const store = memoryStore({});
  const record = applyConjMigration(store, bank);
  assert.equal(record.version, 1);
  assert.deepEqual(record.keptLessons, []);
  assert.equal(record.replacements.length, 0);
  assert.equal(store.get("wqa-conj-session", null), null);
  applyConjMigration(store, bank);
  assert.equal(store.get("wqa-conj-session", null), null);
});

test("a fresh id already credited is not used as a second exchange", () => {
  const already = bank.find(q => Number(String(q.id).slice(1)) > 100).id;
  const result = migrateConjFound(["C040", already, "C040"], bank);
  assert.equal(result.found.length, 2);
  assert.ok(result.found.includes(already));
  assert.ok(result.found.includes(result.replacements[0].to));
  assert.notEqual(result.replacements[0].to, already);
});
