import test from "node:test";
import assert from "node:assert/strict";
import { banks, questionKey } from "./load-banks.mjs";

const names = Object.keys(banks);

test("each quiz type has 100 questions in 20 lessons of 5", () => {
  for (const name of names) {
    const items = banks[name];
    assert.equal(items.length, 100, name);
    const buckets = {};
    items.forEach((q, i) => {
      const lesson = q.lesson || Math.floor(i / 5) + 1;
      assert.equal(lesson, Math.floor(i / 5) + 1, name + " " + q.id + " lesson order");
      buckets[lesson] = (buckets[lesson] || 0) + 1;
    });
    for (let n = 1; n <= 20; n++) assert.equal(buckets[n], 5, name + " lesson " + n);
  }
});

test("multiple choice items have four unique choices and one correct answer", () => {
  for (const name of names) {
    for (const q of banks[name]) {
      if (q.kind === "map") {
        assert.ok(q.geoId, name + " " + q.id + " map target");
        continue;
      }
      assert.ok(Array.isArray(q.choices), name + " " + q.id);
      assert.equal(q.choices.length, 4, name + " " + q.id);
      assert.equal(new Set(q.choices.map(String)).size, 4, name + " " + q.id + " unique");
      const hits = q.choices.filter(c => String(c) === String(q.answer));
      assert.equal(hits.length, 1, name + " " + q.id + " exactly one correct");
    }
  }
});

test("questions are not duplicated inside a type", () => {
  for (const name of names) {
    const ids = new Set();
    const keys = new Set();
    for (const q of banks[name]) {
      assert.equal(ids.has(q.id), false, name + " duplicate id " + q.id);
      ids.add(q.id);
      const key = questionKey(q);
      assert.equal(keys.has(key), false, name + " duplicate question " + key);
      keys.add(key);
    }
  }
});
