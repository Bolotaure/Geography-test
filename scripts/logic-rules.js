// Builds the 100 number-pattern questions for Wizard's Quiz Academy.
// Each question is produced from an explicit rule, so the next term is
// computed rather than typed by hand. Run directly to write ../logic.js.
"use strict";

const fs = require("fs");
const path = require("path");

function isPrime(n) {
  if (n < 2 || !Number.isInteger(n)) return false;
  if (n % 2 === 0) return n === 2;
  if (n % 3 === 0) return n === 3;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

function primes(n) {
  const out = [];
  for (let x = 2; out.length < n; x++) if (isPrime(x)) out.push(x);
  return out;
}

function sumDigits(n) {
  return String(Math.abs(n)).split("").reduce((s, d) => s + Number(d), 0);
}

function polyAt(n, coeffs) {
  return coeffs.reduce((sum, c, k) => sum + c * n ** k, 0);
}

function seriesTerm(spec, k) {
  if (spec.op === "add") return spec.start + k * spec.step;
  if (spec.op === "mul") {
    const v = spec.start * spec.factor ** k;
    if (!Number.isInteger(v)) throw new Error("non-integer geometric subseries");
    return v;
  }
  throw new Error("bad subseries " + spec.op);
}

function termsOf(spec) {
  const count = spec.count;
  let terms;
  if (spec.op === "add") {
    terms = Array.from({ length: count }, (_, i) => spec.start + i * spec.step);
  } else if (spec.op === "mul") {
    terms = [];
    let x = spec.start;
    for (let i = 0; i < count; i++) {
      terms.push(x);
      x *= spec.factor;
    }
  } else if (spec.op === "div") {
    terms = [];
    let x = spec.start;
    for (let i = 0; i < count; i++) {
      if (!Number.isInteger(x)) throw new Error("div hit a fraction");
      terms.push(x);
      if (i === count - 1) break;
      if (x % spec.divisor !== 0) throw new Error("not divisible: " + x);
      x /= spec.divisor;
    }
  } else if (spec.op === "poly") {
    terms = Array.from({ length: count }, (_, i) => polyAt(spec.n0 + i, spec.coeffs));
  } else if (spec.op === "fib") {
    const seeds = spec.seeds;
    terms = seeds.slice();
    while (terms.length < count) {
      const n = seeds.length;
      const next = terms.slice(-n).reduce((s, v) => s + v, 0);
      terms.push(next);
    }
    if (terms.length !== count) terms = terms.slice(0, count);
  } else if (spec.op === "diffadd") {
    terms = [];
    let x = spec.start;
    let d = spec.diff;
    for (let i = 0; i < count; i++) {
      terms.push(x);
      x += d;
      d += spec.diffStep;
    }
  } else if (spec.op === "diffmul") {
    terms = [];
    let x = spec.start;
    let d = spec.diff;
    for (let i = 0; i < count; i++) {
      terms.push(x);
      x += d;
      d *= spec.factor;
    }
  } else if (spec.op === "alt") {
    terms = [spec.start];
    let x = spec.start;
    for (let i = 0; i < count - 1; i++) {
      const [op, v] = spec.steps[i % spec.steps.length];
      if (op === "add") x += v;
      else if (op === "sub") x -= v;
      else if (op === "mul") x *= v;
      else throw new Error("bad alt op");
      terms.push(x);
    }
  } else if (spec.op === "recur") {
    terms = [spec.start];
    let x = spec.start;
    for (let i = 0; i < count - 1; i++) {
      x = spec.mul * x + spec.add;
      terms.push(x);
    }
  } else if (spec.op === "fact") {
    terms = [];
    let f = 1;
    for (let n = 1; n < spec.n0; n++) f *= n;
    for (let n = spec.n0; terms.length < count; n++) {
      f *= n;
      terms.push(f);
    }
  } else if (spec.op === "rising") {
    // start, then × firstMul, × (firstMul+1), × (firstMul+2), ...
    terms = [spec.start];
    let x = spec.start;
    let m = spec.firstMul;
    for (let i = 0; i < count - 1; i++) {
      x *= m;
      terms.push(x);
      m += 1;
    }
  } else if (spec.op === "primes") {
    terms = primes(spec.skip + count).slice(spec.skip);
  } else if (spec.op === "primesq") {
    terms = primes(spec.skip + count).slice(spec.skip).map(p => p * p);
  } else if (spec.op === "weave") {
    terms = [];
    for (let i = 0; i < count; i++) {
      const sub = i % 2 === 0 ? spec.a : spec.b;
      terms.push(seriesTerm(sub, Math.floor(i / 2)));
    }
  } else if (spec.op === "digitadd") {
    terms = [spec.start];
    let x = spec.start;
    for (let i = 0; i < count - 1; i++) {
      x = x + sumDigits(x);
      terms.push(x);
    }
  } else {
    throw new Error("unknown op " + spec.op);
  }
  if (terms.length !== count) throw new Error("term count " + terms.length);
  if (terms.some(n => !Number.isInteger(n))) throw new Error("non-integer term");
  return terms;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seed) {
  const rand = mulberry32(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wrongsFor(answer, seq, spec) {
  const last = seq[seq.length - 1];
  const d = last - seq[seq.length - 2];
  const positive = answer > 0 && seq.every(n => n >= 0);
  const candidates = [answer + 1, answer - 1, answer + 2, answer - 2, last + d, last + 2 * d, last];
  if (spec && spec.op === "weave") {
    const idx = seq.length;
    candidates.unshift(seriesTerm(spec.a, Math.floor((idx + 1) / 2)));
    const bIndex = Math.floor(idx / 2) + (idx % 2 === 0 ? 0 : 1);
    candidates.unshift(seriesTerm(spec.b, bIndex));
  }
  const seen = new Set([String(answer)]);
  const wrongs = [];
  for (const n of candidates) {
    if (!Number.isInteger(n)) continue;
    if (positive && n <= 0) continue;
    const s = String(n);
    if (seen.has(s)) continue;
    seen.add(s);
    wrongs.push(n);
    if (wrongs.length === 3) break;
  }
  let bump = 3;
  while (wrongs.length < 3) {
    const n = answer + bump;
    bump += 1;
    if (positive && n <= 0) continue;
    const s = String(n);
    if (!seen.has(s)) {
      seen.add(s);
      wrongs.push(n);
    }
  }
  return wrongs;
}

function joinList(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

function explain(spec, terms) {
  const seq = terms.slice(0, -1);
  const answer = terms[terms.length - 1];
  const last = seq[seq.length - 1];
  const prev = seq[seq.length - 2];
  if (spec.op === "add") {
    if (spec.step > 0) return `Add ${spec.step} each time. ${last} + ${spec.step} = ${answer}.`;
    return `Subtract ${-spec.step} each time. ${last} − ${-spec.step} = ${answer}.`;
  }
  if (spec.op === "mul") return `Multiply by ${spec.factor} each time. ${last} × ${spec.factor} = ${answer}.`;
  if (spec.op === "div") return `Divide by ${spec.divisor} each time. ${last} ÷ ${spec.divisor} = ${answer}.`;
  if (spec.op === "poly") {
    const ns = terms.map((_, i) => spec.n0 + i);
    const nextN = ns[ns.length - 1];
    if (spec.kind === "square") {
      const shown = seq.map((v, i) => `${ns[i]}² = ${v}`).join(", ");
      return `These are consecutive square numbers: ${shown}. The next is ${nextN}² = ${answer}.`;
    }
    if (spec.kind === "cube") {
      const shown = seq.map((v, i) => `${ns[i]}³ = ${v}`).join(", ");
      return `These are consecutive cubes: ${shown}. The next is ${nextN}³ = ${answer}.`;
    }
    if (spec.kind === "squarePlus") {
      return `Each term is one more than a square (n² + 1) for n = ${ns[0]}, ${ns[1]}, ${ns[2]}, …. The next is ${nextN}² + 1 = ${answer}.`;
    }
    if (spec.kind === "squarePlusN") {
      return `Each term is n² + n for n = ${ns[0]}, ${ns[1]}, ${ns[2]}, …. The next is ${nextN}² + ${nextN} = ${answer}.`;
    }
    if (spec.kind === "cubePlus") {
      return `Each term is one more than a cube (n³ + 1) for n = ${ns[0]}, ${ns[1]}, ${ns[2]}, …. The next is ${nextN}³ + 1 = ${answer}.`;
    }
    if (spec.kind === "cubeMinusN") {
      return `Each term is n³ − n for n = ${ns[0]}, ${ns[1]}, ${ns[2]}, …. The next is ${nextN}³ − ${nextN} = ${answer}.`;
    }
    if (spec.kind === "oddSquare") {
      const odds = ns.map(n => 2 * n - 1);
      const shown = seq.map((v, i) => `${odds[i]}² = ${v}`).join(", ");
      return `These are squares of consecutive odd numbers: ${shown}. The next is ${odds[odds.length - 1]}² = ${answer}.`;
    }
    if (spec.kind === "evenSquare") {
      const evens = ns.map(n => 2 * n);
      const shown = seq.map((v, i) => `${evens[i]}² = ${v}`).join(", ");
      return `These are squares of consecutive even numbers: ${shown}. The next is ${evens[evens.length - 1]}² = ${answer}.`;
    }
    throw new Error("poly kind");
  }
  if (spec.op === "fib") {
    const k = spec.seeds.length;
    const parts = seq.slice(-k);
    if (k === 2) return `Each number is the sum of the two before it. ${parts[0]} + ${parts[1]} = ${answer}.`;
    return `Each number is the sum of the three before it. ${parts[0]} + ${parts[1]} + ${parts[2]} = ${answer}.`;
  }
  if (spec.op === "diffadd" || spec.op === "diffmul") {
    const gaps = [];
    for (let i = 1; i < seq.length; i++) gaps.push(seq[i] - seq[i - 1]);
    const nextGap = answer - last;
    const stepText = nextGap >= 0 ? `${last} + ${nextGap} = ${answer}` : `${last} − ${-nextGap} = ${answer}`;
    if (spec.op === "diffadd") {
      const dir = spec.diffStep === 0 ? "stay the same" : spec.diffStep > 0 ? `grow by ${spec.diffStep}` : `shrink by ${-spec.diffStep}`;
      return `The gap between terms starts at ${gaps[0]} and the gaps ${dir}: ${gaps.join(", ")}. The next gap is ${nextGap}, so ${stepText}.`;
    }
    return `The gaps double each time: ${gaps.join(", ")}. The next gap is ${nextGap}, so ${stepText}.`;
  }
  if (spec.op === "alt") {
    const words = spec.steps.map(([op, v]) => {
      if (op === "add") return `add ${v}`;
      if (op === "sub") return `subtract ${v}`;
      if (op === "mul") return `multiply by ${v}`;
      return op;
    });
    return `The steps alternate: ${words.join(", then ")}, and then repeat. Following that rule from ${seq[0]} gives ${seq.concat(answer).join(", ")}. The next number is ${answer}.`;
  }
  if (spec.op === "recur") {
    if (spec.add === 0) return `Multiply by ${spec.mul} each time. ${spec.mul} × ${last} = ${answer}.`;
    if (spec.add > 0) return `Each term is ${spec.mul} × the previous term, plus ${spec.add}. ${spec.mul} × ${last} + ${spec.add} = ${answer}.`;
    return `Each term is ${spec.mul} × the previous term, minus ${-spec.add}. ${spec.mul} × ${last} − ${-spec.add} = ${answer}.`;
  }
  if (spec.op === "fact") {
    const ns = terms.map((_, i) => spec.n0 + i);
    const shown = seq.map((v, i) => `${ns[i]}! = ${v}`).join(", ");
    return `These are factorials (n! = 1 × 2 × … × n): ${shown}. The next is ${ns[ns.length - 1]}! = ${answer}.`;
  }
  if (spec.op === "rising") return risingExplain(spec, seq, answer);
  if (spec.op === "primes") {
    return `These are consecutive prime numbers. The next prime after ${last} is ${answer}.`;
  }
  if (spec.op === "primesq") {
    const ps = primes(spec.skip + terms.length).slice(spec.skip);
    const shown = seq.map((v, i) => `${ps[i]}² = ${v}`).join(", ");
    const p = ps[ps.length - 1];
    return `These are squares of consecutive primes: ${shown}. The next prime is ${p}, and ${p}² = ${answer}.`;
  }
  if (spec.op === "weave") {
    const pos = seq.length + 1;
    const even = pos % 2 === 0;
    const sub = even ? spec.b : spec.a;
    const which = even ? "even" : "odd";
    const desc = s => s.op === "add"
      ? (s.step >= 0 ? `start at ${s.start} and add ${s.step}` : `start at ${s.start} and subtract ${-s.step}`)
      : `start at ${s.start} and multiply by ${s.factor}`;
    return `Two patterns alternate, one on odd positions and one on even positions. Odd positions ${desc(spec.a)}. Even positions ${desc(spec.b)}. Position ${pos} is ${which}, so the next number is ${answer}.`;
  }
  if (spec.op === "digitadd") {
    const digits = String(Math.abs(last)).split("").join(" + ");
    return `Add the digits of a number to the number itself. ${last} + ${digits} = ${answer}.`;
  }
  throw new Error("no explain");
}

function risingExplain(spec, seq, answer) {
  const last = seq[seq.length - 1];
  const nextMul = spec.firstMul + seq.length - 1;
  const shownMuls = [];
  for (let i = 0; i < seq.length - 1; i++) shownMuls.push(spec.firstMul + i);
  return `Each term multiplies the one before it by the next integer, starting at × ${spec.firstMul}: ${shownMuls.join(", then ")}. ${last} × ${nextMul} = ${answer}.`;
}

// The rising branch above calls a messy replace; do the real one here by patching explain.
function explainFixed(spec, terms) {
  if (spec.op === "rising") {
    const seq = terms.slice(0, -1);
    const answer = terms[terms.length - 1];
    return risingExplain(spec, seq, answer);
  }
  return explain(spec, terms);
}

function buildLogicQuestions() {
  const rules = RULES.map(r => {
    const terms = termsOf(r.spec);
    const seq = terms.slice(0, -1);
    const answer = terms[terms.length - 1];
    if (seq.length < 5) throw new Error(r.id + " shows fewer than 5 terms");
    const text = explainFixed(r.spec, terms);
    if (!text.includes(String(answer))) throw new Error(r.id + " explain missing answer: " + text);
    const choices = seededShuffle([answer, ...wrongsFor(answer, seq, r.spec)].map(String), Number(r.id.slice(1)));
    return { id: r.id, level: r.level, seq, choices, answer: String(answer), explain: text };
  });
  if (rules.length !== 100) throw new Error("expected 100 rules, got " + rules.length);
  const ids = new Set(rules.map(r => r.id));
  if (ids.size !== 100) throw new Error("duplicate ids");
  const sigs = new Set(rules.map(r => r.seq.join(",")));
  if (sigs.size !== 100) throw new Error("duplicate sequences");
  return rules;
}

function serializeLogic(qs) {
  const body = qs.map(q => {
    return [
      "  {",
      `    id: ${JSON.stringify(q.id)},`,
      `    level: ${JSON.stringify(q.level)},`,
      `    seq: [${q.seq.join(", ")}],`,
      `    choices: ${JSON.stringify(q.choices)},`,
      `    answer: ${JSON.stringify(q.answer)},`,
      `    explain: ${JSON.stringify(q.explain)}`,
      "  }",
    ].join("\n");
  }).join(",\n");
  return `// Number-pattern questions for Wizard's Quiz Academy.
// Generated by scripts/logic-rules.js — do not edit by hand.
// Each answer is the next term of an explicit rule; distractors are nearby mistakes.
window.LOGIC_QUESTIONS = [
${body}
];
`;
}

const A = "apprentice";
const S = "scholar";
const M = "archmage";

const RULES = [
  // Constant step
  { id: "L001", level: A, spec: { op: "add", start: 4, step: 4, count: 6 } },
  { id: "L002", level: A, spec: { op: "add", start: 7, step: 7, count: 6 } },
  { id: "L003", level: A, spec: { op: "add", start: 15, step: -2, count: 6 } },
  { id: "L004", level: A, spec: { op: "add", start: 90, step: -9, count: 6 } },
  { id: "L005", level: A, spec: { op: "add", start: 6, step: 5, count: 7 } },
  { id: "L006", level: A, spec: { op: "add", start: 100, step: -12, count: 6 } },
  { id: "L007", level: A, spec: { op: "add", start: 2, step: 7, count: 7 } },
  { id: "L008", level: A, spec: { op: "add", start: 50, step: -4, count: 7 } },
  { id: "L009", level: A, spec: { op: "add", start: 1, step: 5, count: 8 } },
  { id: "L010", level: A, spec: { op: "add", start: 8, step: 9, count: 6 } },
  { id: "L011", level: A, spec: { op: "add", start: 120, step: -11, count: 6 } },
  { id: "L012", level: A, spec: { op: "add", start: 3, step: 7, count: 7 } },
  { id: "L013", level: A, spec: { op: "add", start: 64, step: -7, count: 7 } },
  { id: "L014", level: A, spec: { op: "add", start: 5, step: 10, count: 7 } },
  { id: "L015", level: A, spec: { op: "add", start: 200, step: -25, count: 6 } },
  { id: "L016", level: A, spec: { op: "add", start: 13, step: 4, count: 7 } },
  { id: "L017", level: A, spec: { op: "add", start: 80, step: -6, count: 7 } },
  { id: "L018", level: A, spec: { op: "add", start: 9, step: 8, count: 6 } },
  { id: "L019", level: A, spec: { op: "add", start: 250, step: -30, count: 6 } },
  { id: "L020", level: A, spec: { op: "add", start: 4, step: 11, count: 6 } },
  // Geometric
  { id: "L021", level: A, spec: { op: "mul", start: 3, factor: 2, count: 6 } },
  { id: "L022", level: A, spec: { op: "mul", start: 2, factor: 3, count: 6 } },
  { id: "L023", level: A, spec: { op: "mul", start: 5, factor: 2, count: 7 } },
  { id: "L024", level: A, spec: { op: "mul", start: 7, factor: 2, count: 6 } },
  { id: "L025", level: A, spec: { op: "mul", start: 4, factor: 3, count: 6 } },
  { id: "L026", level: A, spec: { op: "div", start: 256, divisor: 2, count: 6 } },
  { id: "L027", level: A, spec: { op: "mul", start: 3, factor: 3, count: 6 } },
  { id: "L028", level: A, spec: { op: "mul", start: 6, factor: 2, count: 6 } },
  { id: "L029", level: S, spec: { op: "div", start: 3125, divisor: 5, count: 6 } },
  { id: "L030", level: S, spec: { op: "mul", start: 2, factor: 4, count: 6 } },
  { id: "L031", level: A, spec: { op: "mul", start: 9, factor: 2, count: 7 } },
  { id: "L032", level: A, spec: { op: "mul", start: 11, factor: 2, count: 6 } },
  { id: "L033", level: A, spec: { op: "div", start: 243, divisor: 3, count: 6 } },
  { id: "L034", level: S, spec: { op: "mul", start: 5, factor: 3, count: 6 } },
  { id: "L035", level: A, spec: { op: "div", start: 100000, divisor: 10, count: 6 } },
  // Closed forms
  { id: "L036", level: A, spec: { op: "poly", n0: 1, coeffs: [0, 0, 1], count: 8, kind: "square" } },
  { id: "L037", level: A, spec: { op: "poly", n0: 5, coeffs: [0, 0, 1], count: 7, kind: "square" } },
  { id: "L038", level: S, spec: { op: "poly", n0: 1, coeffs: [0, 0, 0, 1], count: 7, kind: "cube" } },
  { id: "L039", level: S, spec: { op: "poly", n0: 1, coeffs: [1, 0, 1], count: 7, kind: "squarePlus" } },
  { id: "L040", level: S, spec: { op: "poly", n0: 1, coeffs: [0, 1, 1], count: 7, kind: "squarePlusN" } },
  // Fibonacci-like
  { id: "L041", level: S, spec: { op: "fib", seeds: [1, 1], count: 8 } },
  { id: "L042", level: S, spec: { op: "fib", seeds: [2, 2], count: 8 } },
  { id: "L043", level: S, spec: { op: "fib", seeds: [1, 3], count: 8 } },
  { id: "L044", level: S, spec: { op: "fib", seeds: [3, 5], count: 8 } },
  { id: "L045", level: S, spec: { op: "fib", seeds: [4, 6], count: 8 } },
  { id: "L046", level: S, spec: { op: "fib", seeds: [2, 5], count: 8 } },
  { id: "L047", level: S, spec: { op: "fib", seeds: [1, 4], count: 8 } },
  { id: "L048", level: S, spec: { op: "fib", seeds: [6, 1], count: 8 } },
  { id: "L049", level: S, spec: { op: "fib", seeds: [2, 7], count: 8 } },
  { id: "L050", level: M, spec: { op: "fib", seeds: [1, 1, 1], count: 9 } },
  // Growing or shrinking gaps
  { id: "L051", level: S, spec: { op: "diffadd", start: 1, diff: 1, diffStep: 1, count: 8 } },
  { id: "L052", level: S, spec: { op: "diffadd", start: 3, diff: 2, diffStep: 2, count: 7 } },
  { id: "L053", level: S, spec: { op: "diffadd", start: 10, diff: 1, diffStep: 1, count: 8 } },
  { id: "L054", level: S, spec: { op: "diffadd", start: 5, diff: 4, diffStep: 2, count: 7 } },
  { id: "L055", level: S, spec: { op: "diffadd", start: 20, diff: 5, diffStep: 5, count: 7 } },
  { id: "L056", level: S, spec: { op: "diffadd", start: 1, diff: 2, diffStep: 1, count: 8 } },
  { id: "L057", level: S, spec: { op: "diffadd", start: 8, diff: 3, diffStep: 3, count: 7 } },
  { id: "L058", level: S, spec: { op: "diffadd", start: 15, diff: 1, diffStep: 2, count: 7 } },
  { id: "L059", level: M, spec: { op: "diffmul", start: 10, diff: 2, factor: 2, count: 7 } },
  { id: "L060", level: M, spec: { op: "diffmul", start: 5, diff: 1, factor: 2, count: 8 } },
  // Alternating operations
  { id: "L061", level: S, spec: { op: "alt", start: 3, steps: [["add", 2], ["mul", 2]], count: 7 } },
  { id: "L062", level: M, spec: { op: "alt", start: 2, steps: [["mul", 2], ["add", 3]], count: 8 } },
  { id: "L063", level: A, spec: { op: "alt", start: 4, steps: [["add", 1], ["add", 2]], count: 8 } },
  { id: "L064", level: S, spec: { op: "alt", start: 30, steps: [["sub", 3], ["add", 1]], count: 8 } },
  { id: "L065", level: M, spec: { op: "alt", start: 2, steps: [["mul", 3], ["sub", 1]], count: 8 } },
  { id: "L066", level: S, spec: { op: "alt", start: 1, steps: [["add", 5], ["sub", 2]], count: 8 } },
  { id: "L067", level: M, spec: { op: "alt", start: 1, steps: [["mul", 2], ["add", 2]], count: 8 } },
  { id: "L068", level: S, spec: { op: "alt", start: 2, steps: [["add", 9], ["sub", 4]], count: 8 } },
  // Linear recurrences: ×m + b
  { id: "L069", level: M, spec: { op: "recur", start: 1, mul: 2, add: 1, count: 7 } },
  { id: "L070", level: M, spec: { op: "recur", start: 2, mul: 2, add: 1, count: 7 } },
  { id: "L071", level: M, spec: { op: "recur", start: 3, mul: 2, add: -1, count: 7 } },
  { id: "L072", level: M, spec: { op: "recur", start: 1, mul: 3, add: 1, count: 6 } },
  { id: "L073", level: M, spec: { op: "recur", start: 2, mul: 3, add: -2, count: 6 } },
  { id: "L074", level: M, spec: { op: "recur", start: 4, mul: 2, add: -2, count: 7 } },
  { id: "L075", level: M, spec: { op: "recur", start: 6, mul: 2, add: 1, count: 6 } },
  { id: "L076", level: M, spec: { op: "recur", start: 8, mul: 2, add: -5, count: 7 } },
  { id: "L077", level: M, spec: { op: "recur", start: 7, mul: 2, add: -4, count: 6 } },
  // Factorials, rising products, primes
  { id: "L078", level: M, spec: { op: "fact", n0: 1, count: 7 } },
  { id: "L079", level: M, spec: { op: "diffadd", start: 8, diff: -1, diffStep: -1, count: 7 } },
  { id: "L080", level: M, spec: { op: "rising", start: 2, firstMul: 2, count: 7 } },
  { id: "L081", level: M, spec: { op: "rising", start: 3, firstMul: 2, count: 6 } },
  { id: "L082", level: S, spec: { op: "primes", skip: 0, count: 8 } },
  { id: "L083", level: S, spec: { op: "primes", skip: 3, count: 8 } },
  { id: "L084", level: S, spec: { op: "primes", skip: 5, count: 7 } },
  { id: "L085", level: M, spec: { op: "primesq", skip: 0, count: 7 } },
  // Interleaved patterns. Odd positions use `a`, even positions use `b`.
  { id: "L086", level: S, spec: { op: "weave", count: 8, a: { op: "add", start: 1, step: 1 }, b: { op: "add", start: 10, step: 10 } } },
  { id: "L087", level: M, spec: { op: "weave", count: 8, a: { op: "add", start: 2, step: 3 }, b: { op: "add", start: 4, step: 5 } } },
  { id: "L088", level: M, spec: { op: "weave", count: 8, a: { op: "add", start: 8, step: -1 }, b: { op: "add", start: 1, step: 1 } } },
  { id: "L089", level: M, spec: { op: "weave", count: 8, a: { op: "add", start: 15, step: -2 }, b: { op: "add", start: 1, step: 1 } } },
  { id: "L090", level: M, spec: { op: "weave", count: 8, a: { op: "add", start: 4, step: 4 }, b: { op: "add", start: 30, step: -3 } } },
  { id: "L091", level: M, spec: { op: "weave", count: 8, a: { op: "add", start: 7, step: 1 }, b: { op: "add", start: 100, step: -10 } } },
  { id: "L092", level: M, spec: { op: "weave", count: 8, a: { op: "mul", start: 2, factor: 2 }, b: { op: "add", start: 5, step: 4 } } },
  // Add the digits
  { id: "L093", level: M, spec: { op: "digitadd", start: 19, count: 8 } },
  { id: "L094", level: M, spec: { op: "digitadd", start: 28, count: 7 } },
  { id: "L095", level: M, spec: { op: "digitadd", start: 49, count: 7 } },
  { id: "L096", level: M, spec: { op: "digitadd", start: 68, count: 7 } },
  // Harder closed forms
  { id: "L097", level: M, spec: { op: "poly", n0: 1, coeffs: [1, 0, 0, 1], count: 7, kind: "cubePlus" } },
  { id: "L098", level: M, spec: { op: "poly", n0: 2, coeffs: [0, -1, 0, 1], count: 7, kind: "cubeMinusN" } },
  { id: "L099", level: M, spec: { op: "poly", n0: 1, coeffs: [1, -4, 4], count: 7, kind: "oddSquare" } },
  { id: "L100", level: S, spec: { op: "poly", n0: 1, coeffs: [0, 0, 4], count: 7, kind: "evenSquare" } },
];

function arithStep(seq) {
  const d = seq[1] - seq[0];
  for (let i = 2; i < seq.length; i++) if (seq[i] - seq[i - 1] !== d) return null;
  return d;
}

function geomFactor(seq) {
  if (seq.some(v => v === 0)) return null;
  const f = seq[1] / seq[0];
  if (!Number.isInteger(f)) return null;
  for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1] * f) return null;
  return f;
}

function assertConsistent(qs) {
  qs.forEach(q => {
    const nums = q.seq.map(Number);
    const ans = Number(q.answer);
    const a = arithStep(nums);
    if (a !== null && nums[nums.length - 1] + a !== ans) {
      throw new Error(q.id + " is arithmetic but the answer disagrees");
    }
    const g = geomFactor(nums);
    if (g !== null && nums[nums.length - 1] * g !== ans) {
      throw new Error(q.id + " is geometric but the answer disagrees");
    }
    if (new Set(q.choices).size !== 4) throw new Error(q.id + " choices");
    if (!q.choices.includes(q.answer)) throw new Error(q.id + " answer missing");
  });
}

function main() {
  const qs = buildLogicQuestions();
  assertConsistent(qs);
  const out = path.join(__dirname, "..", "logic.js");
  fs.writeFileSync(out, serializeLogic(qs));
  const levels = qs.reduce((m, q) => (m[q.level] = (m[q.level] || 0) + 1, m), {});
  console.log("wrote", out, levels);
}

module.exports = { buildLogicQuestions, serializeLogic, assertConsistent, RULES, termsOf };

if (require.main === module) main();
