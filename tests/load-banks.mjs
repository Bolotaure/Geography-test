import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadWindow(file) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), ctx, { filename: file });
  return ctx.window;
}

export const banks = {
  us: loadWindow("us-questions.js").US_QUESTIONS,
  fr: loadWindow("fr-questions.js").FR_QUESTIONS,
  jp: loadWindow("jp-questions.js").JP_QUESTIONS,
  "vocab-en": loadWindow("vocab-en.js").VOCAB_EN,
  "vocab-fr": loadWindow("vocab-fr.js").VOCAB_FR,
  logic: loadWindow("logic.js").LOGIC_QUESTIONS,
  conj: loadWindow("conj-fr.js").CONJ_FR,
};

export const TYPE_ORDER = ["us", "fr", "jp", "vocab-en", "vocab-fr", "logic", "conj"];

export function questionKey(q) {
  if (q.word) return "word:" + q.word;
  if (q.seq) return "seq:" + q.seq.join(",");
  if (q.prompt) return "prompt:" + q.prompt;
  return "id:" + q.id;
}

export function findQuestion(text, visibleChoices) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  const seqText = t.replace(/,?\s*\?\s*$/, "").trim();
  const hits = [];
  for (const items of Object.values(banks)) {
    for (const q of items) {
      if (q.word === t || q.prompt === t) hits.push(q);
      else if (q.seq && q.seq.join(", ") === seqText) hits.push(q);
    }
  }
  if (visibleChoices && visibleChoices.length) {
    const seen = new Set(visibleChoices.map(String));
    hits.sort((a, b) => {
      const score = q => (q.choices || []).filter(c => seen.has(String(c))).length;
      return score(b) - score(a);
    });
  }
  return hits[0] || null;
}
