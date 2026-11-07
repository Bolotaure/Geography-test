import { test, expect } from "@playwright/test";
import { banks, TYPE_ORDER, findQuestion } from "../load-banks.mjs";

const COURSES = TYPE_ORDER;

function errorsOf(page) {
  const errors = [];
  page.on("pageerror", err => errors.push(String(err)));
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

function assertQuiet(errors) {
  const noise = errors.filter(e => !/favicon|Failed to load resource|net::ERR/i.test(e));
  expect(noise, noise.join("\n")).toEqual([]);
}

async function fresh(page, hash) {
  const errors = errorsOf(page);
  await page.goto("/index.html?e2e=1" + hash, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.goto("/index.html?e2e=2" + hash, { waitUntil: "domcontentloaded" });
  return errors;
}

async function assertTargetClickable(page, name) {
  await page.locator("#map").scrollIntoViewIfNeeded();
  const result = await page.evaluate(name => {
    const path = [...document.querySelectorAll("#map path[aria-label]")].find(p => p.getAttribute("aria-label") === name);
    if (!path) return { ok: false, reason: "missing " + name };
    path.scrollIntoView({ block: "center", inline: "center" });
    const card = document.querySelector("#mapCard").getBoundingClientRect();
    const box = path.getBoundingClientRect();
    if (box.width < 4 || box.height < 4) return { ok: false, reason: "tiny", w: box.width, h: box.height };
    const local = path.getBBox();
    const probe = path.ownerSVGElement.createSVGPoint();
    const ctm = path.getScreenCTM();
    const want = path.getAttribute("data-id");
    for (let gy = 0.08; gy <= 0.92; gy += 0.12) {
      for (let gx = 0.08; gx <= 0.92; gx += 0.12) {
        probe.x = local.x + local.width * gx;
        probe.y = local.y + local.height * gy;
        if (!path.isPointInFill(probe)) continue;
        const screen = probe.matrixTransform(ctm);
        if (screen.x < card.left + 1 || screen.x > card.right - 1 || screen.y < card.top + 1 || screen.y > card.bottom - 1) continue;
        const stack = document.elementsFromPoint(screen.x, screen.y);
        for (const el of stack) {
          if (el === path) return { ok: true, w: Math.round(box.width), h: Math.round(box.height) };
          const id = el.getAttribute && el.getAttribute("data-id");
          if (id === want) return { ok: true, w: Math.round(box.width), h: Math.round(box.height) };
          if (id) break;
          if (el.classList && el.classList.contains("zoom-btn")) return { ok: false, reason: "under zoom" };
        }
      }
    }
    return { ok: false, reason: "no clickable fill", w: Math.round(box.width), h: Math.round(box.height) };
  }, name);
  expect(result.ok, name + " " + JSON.stringify(result)).toBe(true);
}

async function readQuestion(page) {
  await page.waitForFunction(() => {
    const bar = document.querySelector("#checkBar");
    const prompt = document.querySelector("#lessonPrompt");
    const word = document.querySelector("#quizCard:not([hidden]) .quiz-word");
    return bar && !bar.hidden && ((prompt && !prompt.hidden && prompt.textContent) || (word && word.textContent));
  });
  return page.evaluate(() => {
    const prompt = document.querySelector("#lessonPrompt");
    if (prompt && !prompt.hidden) return { kind: "map", text: prompt.textContent, choices: [] };
    return {
      kind: "mcq",
      text: document.querySelector(".quiz-word").textContent.replace(/\s+/g, " ").trim(),
      choices: [...document.querySelectorAll("#quizCard [data-choice]")].map(b => (b.querySelector("span:last-child") || b).textContent.trim()),
    };
  });
}

async function answerCurrent(page, { wrong = false } = {}) {
  const q = await readQuestion(page);
  if (q.kind === "map") {
    const name = q.text.split("Find ").pop().trim();
    const pick = wrong
      ? await page.evaluate(name => {
          const labels = [...document.querySelectorAll("#map path[aria-label]")].map(p => p.getAttribute("aria-label"));
          return labels.find(label => label && label !== name);
        }, name)
      : name;
    await page.evaluate(pick => {
      const el = [...document.querySelectorAll("#map path[aria-label]")].find(p => p.getAttribute("aria-label") === pick);
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }, pick);
    await page.waitForFunction(() => !document.querySelector("#checkBtn").disabled);
    await page.click("#checkBtn");
    return { kind: "map", name, picked: pick, wrong };
  }
  const bank = findQuestion(q.text, q.choices);
  expect(bank, "no bank match for " + q.text).toBeTruthy();
  const picked = wrong ? bank.choices.find(c => String(c) !== String(bank.answer)) : String(bank.answer);
  await page.evaluate(picked => {
    const btn = [...document.querySelectorAll("#quizCard [data-choice]")].find(b => (b.querySelector("span:last-child") || b).textContent.trim() === picked);
    if (!btn) throw new Error("choice not on screen: " + picked);
    btn.click();
  }, picked);
  await page.waitForFunction(() => !document.querySelector("#checkBtn").disabled);
  await page.click("#checkBtn");
  return { kind: "mcq", answer: String(bank.answer), picked, wrong, source: bank.source || "" };
}

async function expectBanner(page, played) {
  await page.waitForSelector("#feedback:not([hidden])");
  const banner = await page.evaluate(() => ({
    title: document.querySelector("#feedbackTitle").textContent,
    body: document.querySelector("#feedbackBody").textContent,
    cls: document.querySelector("#feedback").className,
    info: document.querySelectorAll(".info-btn").length,
  }));
  if (played.wrong) {
    expect(banner.title).toBe("Not quite!");
    expect(banner.cls).toContain("feedback-no");
    expect(banner.body).toContain("You tapped " + played.picked);
    expect(banner.body).toContain("The answer is " + (played.kind === "map" ? played.name : played.answer));
  } else {
    expect(banner.title).toBe("Correct!");
    expect(banner.cls).toContain("feedback-ok");
  }
  return banner;
}

async function finishNode(page, { wrongFirst = false, expectInfo = false } = {}) {
  if (wrongFirst) {
    const played = await answerCurrent(page, { wrong: true });
    const banner = await expectBanner(page, played);
    if (expectInfo) expect(banner.info).toBeGreaterThan(0);
    await page.click("#quitLesson");
    await page.waitForSelector(".node-current:not([disabled])");
    await page.locator(".node-current").click({ force: true });
  }
  for (let i = 0; i < 5; i++) {
    const played = await answerCurrent(page);
    await expectBanner(page, played);
    await page.click("#continueBtn");
  }
  await page.waitForSelector("#summary:not([hidden])");
  await expect(page.locator("#summaryXp")).toContainText("XP");
  await expect(page.locator("#summaryAcc")).toContainText("%");
  await page.click("#summaryContinue");
}

test("every map target is visible and clickable", async ({ page }) => {
  const errors = await fresh(page, "#fr");
  const audits = [];
  for (const hash of ["#fr", "#us", "#jp"]) {
    await page.goto("/index.html?v=map" + hash, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".node-current");
    await page.locator(".node-current").click({ force: true });
    await page.waitForSelector("#map svg path");
    const names = hash === "#fr"
      ? banks.fr.filter(q => q.kind === "map").map(q => q.prompt.replace(/^Find /, "").replace(/ on the map\.$/, ""))
      : hash === "#us"
        ? banks.us.filter(q => q.kind === "map").map(q => q.prompt.replace(/^Find /, "").replace(/ on the map\.$/, ""))
        : banks.jp.filter(q => q.kind === "map").map(q => q.prompt.replace(/^Find /, "").replace(/ on the map\.$/, ""));
    for (const name of names) await assertTargetClickable(page, name);
    audits.push(names.length);
    await page.click("#quitLesson");
  }
  expect(audits).toEqual([
    banks.fr.filter(q => q.kind === "map").length,
    banks.us.filter(q => q.kind === "map").length,
    banks.jp.filter(q => q.kind === "map").length,
  ]);
  assertQuiet(errors);
});

test("home path alternates types and plays every lesson", async ({ page }) => {
  test.setTimeout(600_000);
  const errors = await fresh(page, "#home");
  await page.waitForSelector('button[data-type="us"][data-lecon="1"]');
  const labels = await page.locator(".unit").first().locator("button[data-type]").evaluateAll(nodes => nodes.map(n => n.getAttribute("aria-label")));
  expect(labels).toEqual([
    "Leçon 1 · Niveau 1 · États",
    "Leçon 1 · Niveau 2 · Régions",
    "Leçon 1 · Niveau 3 · Préfectures",
    "Leçon 1 · Niveau 4 · Anglais",
    "Leçon 1 · Niveau 5 · Français",
    "Leçon 1 · Niveau 6 · Nombres",
    "Leçon 1 · Niveau 7 · Conjugaison",
  ]);
  await expect(page.locator('button[data-lecon="2"][data-type="us"]')).toBeDisabled();

  for (let lesson = 1; lesson <= 20; lesson++) {
    for (let i = 0; i < TYPE_ORDER.length; i++) {
      const type = TYPE_ORDER[i];
      const selector = `button[data-type="${type}"][data-lecon="${lesson}"]:not([disabled])`;
      await page.waitForSelector(selector);
      await page.locator(selector).click({ force: true });
      const wrongFirst = lesson === 1 && (type === "fr" || type === "vocab-en");
      await finishNode(page, { wrongFirst, expectInfo: type === "vocab-en" });
      if (lesson === 1 && i < 6) {
        await expect(page.locator('button[data-lecon="2"][data-type="us"]')).toBeDisabled();
      }
    }
    if (lesson < 20) {
      await expect(page.locator(`button[data-lecon="${lesson + 1}"][data-type="us"]`)).toBeEnabled();
      await expect(page.locator(`button[data-lecon="${lesson + 1}"][data-type="fr"]`)).toBeDisabled();
    }
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('button[data-type="us"][data-lecon="1"]')).toHaveClass(/node-done/);
  await expect(page.locator('button[data-type="us"][data-lecon="1"]')).toContainText("♛");
  const saved = await page.evaluate(() => ({
    score: JSON.parse(localStorage.getItem("wqa-us-session")).score,
    streak: JSON.parse(localStorage.getItem("wqa-day-streak")).n,
  }));
  expect(saved.score).toBeGreaterThan(0);
  expect(saved.streak).toBeGreaterThan(0);
  assertQuiet(errors);
});

test("tap to quiz leaves explore and accepts a map answer", async ({ page }) => {
  const errors = await fresh(page, "#fr");
  await page.waitForSelector(".node-current");
  await page.locator(".node-current").click({ force: true });
  await page.waitForSelector("#map svg path");
  await expect(page.locator("#quizBanner")).toBeVisible();
  await expect(page.locator("#quizBanner")).toHaveAttribute("src", /banner-fr\.webp/);
  await expect(page.locator("#lessonPrompt")).toContainText("Find ");
  await page.click("#exploreBtn");
  await expect(page.locator("#exploreBtn")).toContainText("tap to quiz");
  await expect(page.locator("#checkBar")).toBeHidden();
  await expect(page.locator("#lessonPrompt")).toContainText("Exploring");
  const sample = await page.evaluate(() => {
    const path = document.querySelector("#map path[aria-label]");
    path.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return path.getAttribute("aria-label");
  });
  await expect(page.locator("#lessonPrompt")).toContainText(sample);
  await page.click("#exploreBtn");
  await expect(page.locator("#exploreBtn")).toHaveText("Explore");
  await expect(page.locator("#checkBar")).toBeVisible();
  await expect(page.locator("#lessonPrompt")).toContainText("Find ");
  await expect(page.locator("#checkBtn")).toBeDisabled();
  const target = (await page.locator("#lessonPrompt").innerText()).split("Find ").pop().trim();
  await page.evaluate(name => {
    const el = [...document.querySelectorAll("#map path[aria-label]")].find(p => p.getAttribute("aria-label") === name);
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, target);
  await expect(page.locator("#checkBtn")).toBeEnabled();
  await page.click("#checkBtn");
  await expect(page.locator("#feedbackTitle")).toHaveText("Correct!");
  await expect(page.locator(".game-subtitle")).toBeHidden();
  assertQuiet(errors);
});

async function assertInfoIconsReachable(page) {
  const buttons = page.locator("#quizCard .info-btn");
  await expect(buttons).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    const btn = buttons.nth(i);
    await btn.scrollIntoViewIfNeeded();
    const hit = await btn.evaluate(el => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!top && (top === el || el.contains(top));
    });
    expect(hit, "info icon " + (i + 1) + " is covered").toBe(true);
    await btn.click();
    const pop = btn.locator("xpath=ancestor::*[contains(@class,'choice-wrap')]//*[contains(@class,'info-pop')]");
    await expect(pop).toBeVisible();
  }
  await page.locator("#continueBtn").scrollIntoViewIfNeeded();
  const cont = await page.locator("#continueBtn").evaluate(el => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, Math.min(r.top + r.height / 2, window.innerHeight - 2));
    return r.top >= 0 && r.bottom <= window.innerHeight + 1 && !!top && (top === el || el.contains(top));
  });
  expect(cont).toBe(true);
}

test("synonym feedback shows an example sentence", async ({ page }) => {
  const errors = errorsOf(page);
  for (const [hash, label] of [["#vocab-fr", "Exemple : "], ["#vocab-en", "Example: "]]) {
    await page.goto("/index.html?syn=1" + hash, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.goto("/index.html?syn=2" + hash, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".node-current");
    await page.locator(".node-current").click({ force: true });
    const word = (await page.locator(".quiz-word").innerText()).trim();
    const wrong = hash === "#vocab-fr";
    await answerCurrent(page, { wrong });
    await page.waitForSelector("#feedbackExample:not([hidden])");
    await page.locator("#continueBtn").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const btn = document.querySelector("#continueBtn").getBoundingClientRect();
      return btn.height >= 44 && btn.top >= 0 && btn.bottom <= window.innerHeight + 1;
    });
    const line = await page.locator("#feedbackExample").innerText();
    expect(line.startsWith(label)).toBe(true);
    expect(line.toLocaleLowerCase("fr")).toContain(word.toLocaleLowerCase("fr"));
    if (wrong) await expect(page.locator("#feedback")).toHaveClass(/feedback-no/);
    else await expect(page.locator("#feedback")).toHaveClass(/feedback-ok/);
    const layout = await page.evaluate(() => {
      const fb = document.querySelector("#feedback");
      const cs = getComputedStyle(fb);
      const btn = document.querySelector("#continueBtn").getBoundingClientRect();
      const banner = document.querySelector("#quizBanner").getBoundingClientRect();
      const box = fb.getBoundingClientRect();
      let choiceThrough = false;
      document.querySelectorAll("#quizCard .choice").forEach(choice => {
        const r = choice.getBoundingClientRect();
        const y = (Math.max(r.top, box.top) + Math.min(r.bottom, box.bottom)) / 2;
        const x = Math.min(r.right - 6, box.right - 12);
        if (y < box.top + 2 || y > box.bottom - 2 || x < box.left) return;
        const top = document.elementFromPoint(x, y);
        if (top && top.closest(".choice")) choiceThrough = true;
      });
      const scroll = fb.querySelector(".feedback-scroll");
      return {
        opacity: cs.opacity,
        bg: cs.backgroundColor,
        btn: { t: btn.top, b: btn.bottom, h: btn.height },
        innerH: window.innerHeight,
        btnInView: btn.top >= 0 && btn.bottom <= window.innerHeight + 1 && btn.height >= 44,
        bannerTop: banner.top,
        bannerSeen: banner.bottom > 24 && banner.width >= window.innerWidth - 2,
        choiceThrough,
        canScroll: !!scroll,
      };
    });
    expect(layout.opacity, JSON.stringify(layout)).toBe("1");
    expect(layout.bg, JSON.stringify(layout)).not.toBe("rgba(0, 0, 0, 0)");
    expect(layout.choiceThrough, JSON.stringify(layout)).toBe(false);
    expect(layout.btnInView, JSON.stringify(layout)).toBe(true);
    expect(layout.bannerSeen).toBe(true);
    expect(layout.bannerTop).toBeLessThan(8);
    await assertInfoIconsReachable(page);
    if (wrong) {
      await page.setViewportSize({ width: 390, height: 640 });
      await assertInfoIconsReachable(page);
      await page.setViewportSize({ width: 390, height: 844 });
    }
  }
  assertQuiet(errors);
});

test("question count follows the lesson and the home title is single", async ({ page }) => {
  const errors = await fresh(page, "#home");
  await expect(page.locator("#brand")).toBeHidden();
  await expect(page.locator("#title")).toHaveText("Wizard's Quiz Academy");
  await expect(page.locator("#homeOwl")).toHaveCount(0);
  await expect(page.locator(".node-current .node-owl")).toHaveCount(1);

  await page.locator(".node-current").click({ force: true });
  await expect(page.locator("#questionCount")).toBeVisible();
  await expect(page.locator("#questionCount")).toHaveText("Question 1/5");
  await answerCurrent(page);
  await page.click("#continueBtn");
  await expect(page.locator("#questionCount")).toHaveText("Question 2/5");
  await page.click("#quitLesson");

  await page.goto("/index.html?count=en#vocab-en", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".node-current");
  await page.locator(".node-current").click({ force: true });
  await expect(page.locator("#quizCard .question-count")).toHaveText("Question 1/5");
  await answerCurrent(page, { wrong: true });
  await expect(page.locator("#questionCount")).toHaveText("Question 1/5");
  await page.click("#continueBtn");
  await expect(page.locator("#quizCard .question-count")).toHaveText("Question 2/5");

  await page.click("#quitLesson");
  await page.goto("/index.html?count=fr#fr", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".node-current");
  await page.locator(".node-current").click({ force: true });
  await expect(page.locator("#questionCount")).toHaveText("Question 1/5");
  await expect(page.locator("#lessonPrompt")).toContainText("Find ");
  await page.click("#quitLesson");
  await expect(page.locator("#brand")).toBeVisible();
  await expect(page.locator("#title")).toHaveText("Regions of France");
  assertQuiet(errors);
});

test("each single-subject course plays lesson 1", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "subject courses are played on desktop");
  test.setTimeout(300_000);
  const errors = await fresh(page, "#us");
  for (const course of COURSES) {
    await page.goto("/index.html?course=" + course + "#" + course, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.goto("/index.html?course=" + course + "b#" + course, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".node-current");
    await page.locator(".node-current").click({ force: true });
    await finishNode(page, { wrongFirst: course === "us" || course === "vocab-fr", expectInfo: course === "vocab-fr" });
    await expect(page.locator('button[data-lesson="1"]')).toHaveClass(/node-done/);
    await expect(page.locator('button[data-lesson="2"]')).toBeEnabled();
    await expect(page.locator('button[data-lesson="3"]')).toBeDisabled();
  }
  assertQuiet(errors);
});

function conjId(n) {
  return "C" + String(n).padStart(3, "0");
}

test("old conjugation progress migrates once and keeps finished lessons", async ({ page }) => {
  const errors = errorsOf(page);
  const all = Array.from({ length: 100 }, (_, i) => conjId(i + 1));
  const partial = all.slice(0, 10).concat(["C040", "C041", "C096"]);
  const saves = {
    full: {
      "wqa-conj-session": {
        queue: ["C001"], found: all, score: 4200, streak: 2, misses: 0,
        missed: ["C040"], unlocked: [1, 2, 3, 4, 5, 6], best: 4200, won: true, tags: false, lock: null,
      },
      "wqa-conj-best": 4200,
      "wqa-conj-unlocked": [1, 2, 3, 4, 5, 6],
      "wqa-conj-lesson-stars": Object.fromEntries(all.slice(0, 20).map((_, i) => [String(i + 1), 3])),
    },
    partial: {
      "wqa-conj-session": {
        queue: partial.slice(), found: partial, score: 800, streak: 1, misses: 0,
        missed: ["C041", "C002"], unlocked: [1], best: 900, won: false, tags: false, lock: null,
      },
      "wqa-conj-best": 900,
      "wqa-conj-unlocked": [1],
      "wqa-conj-lesson-stars": { 1: 3, 2: 2 },
    },
  };
  async function load(name) {
    await page.goto("/index.html?mig=a#" + name, { waitUntil: "domcontentloaded" });
    await page.evaluate(data => {
      localStorage.clear();
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
    }, saves[name]);
    await page.goto("/index.html?mig=b#conj", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('button[data-lesson="1"]');
  }
  await load("full");
  await expect(page.locator('button[data-lesson="1"]')).toHaveClass(/node-done/);
  await expect(page.locator('button[data-lesson="20"]')).toHaveClass(/node-done/);
  await expect(page.locator(".node-current")).toHaveCount(0);
  const fullOnce = await page.evaluate(() => ({
    found: JSON.parse(localStorage.getItem("wqa-conj-session")).found,
    score: JSON.parse(localStorage.getItem("wqa-conj-session")).score,
    unlocked: JSON.parse(localStorage.getItem("wqa-conj-session")).unlocked,
    best: JSON.parse(localStorage.getItem("wqa-conj-best")),
    kept: JSON.parse(localStorage.getItem("wqa-conj-lesson-kept")).lessons,
    backup: JSON.parse(localStorage.getItem("wqa-conj-cycle-backup")).session.found.length,
    version: JSON.parse(localStorage.getItem("wqa-conj-cycle-migration")).version,
  }));
  expect(fullOnce.found.length).toBe(100);
  expect(new Set(fullOnce.found).size).toBe(100);
  expect(fullOnce.score).toBe(4200);
  expect(fullOnce.unlocked).toEqual([1, 2, 3, 4, 5, 6]);
  expect(fullOnce.best).toBe(4200);
  expect(fullOnce.kept).toHaveLength(20);
  expect(fullOnce.backup).toBe(100);
  expect(fullOnce.version).toBe(1);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('button[data-lesson="20"]');
  const fullTwice = await page.evaluate(() => JSON.parse(localStorage.getItem("wqa-conj-session")).found);
  expect(fullTwice).toEqual(fullOnce.found);

  await load("partial");
  await expect(page.locator('button[data-lesson="1"]')).toHaveClass(/node-done/);
  await expect(page.locator('button[data-lesson="2"]')).toHaveClass(/node-done/);
  await expect(page.locator('button[data-lesson="3"]')).not.toHaveClass(/node-done/);
  await expect(page.locator('button[data-lesson="20"]')).not.toHaveClass(/node-done/);
  const part = await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem("wqa-conj-session"));
    return {
      found: session.found,
      score: session.score,
      unlocked: session.unlocked,
      best: JSON.parse(localStorage.getItem("wqa-conj-best")),
      kept: JSON.parse(localStorage.getItem("wqa-conj-lesson-kept")).lessons,
      missed: session.missed,
    };
  });
  expect(part.found.length).toBe(13);
  expect(new Set(part.found).size).toBe(13);
  expect(part.score).toBe(800);
  expect(part.unlocked).toEqual([1]);
  expect(part.best).toBe(900);
  expect(part.kept).toEqual([1, 2]);
  expect(part.missed).toEqual(["C002"]);
  expect(part.found).toContain("C001");
  expect(part.found).not.toContain("C040");
  const snap = JSON.stringify(part.found);
  await page.reload({ waitUntil: "domcontentloaded" });
  const again = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("wqa-conj-session")).found));
  expect(again).toBe(snap);

  await page.goto("/index.html?mig=home#home", { waitUntil: "domcontentloaded" });
  await expect(page.locator('button[data-type="conj"][data-lecon="1"]')).toHaveClass(/node-done/);
  await expect(page.locator('button[data-type="conj"][data-lecon="2"]')).toHaveClass(/node-done/);
  await expect(page.locator('button[data-type="conj"][data-lecon="3"]')).not.toHaveClass(/node-done/);
  assertQuiet(errors);
});
