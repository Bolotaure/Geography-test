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
