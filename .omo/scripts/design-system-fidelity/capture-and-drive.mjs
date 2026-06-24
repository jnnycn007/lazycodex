import { mkdirSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const require = createRequire(new URL("../../../packages/web/package.json", import.meta.url))
const { chromium } = require("@playwright/test")

const [, , controlUrl, currentUrl, outDir] = process.argv

if (!controlUrl || !currentUrl || !outDir) {
  throw new Error("usage: capture-and-drive.mjs <control-url> <current-url> <out-dir>")
}

const viewports = [
  { id: "mobile", width: 390, height: 844 },
  { id: "tablet", width: 768, height: 1024 },
  { id: "desktop", width: 1280, height: 800 },
]

const routes = [
  { id: "landing", path: "/" },
  { id: "docs", path: "/docs" },
]

const starsPayload = {
  stars: 12345,
  formatted: "12.3k",
  source: "github",
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true })
}

async function withPage(context, events, callback) {
  const page = await context.newPage()
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      events.console.push({ type: message.type(), text: message.text() })
    }
  })
  page.on("pageerror", (error) => {
    events.pageErrors.push(error.message)
  })
  try {
    await callback(page)
  } finally {
    await page.close()
  }
}

async function routeStableStars(context) {
  await context.route("**/api/github-stars", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(starsPayload),
    })
  })
}

async function captureSurface(browser, label, baseUrl) {
  const surfaceDir = join(outDir, "screenshots", label)
  ensureDir(surfaceDir)
  const context = await browser.newContext()
  await routeStableStars(context)
  const events = { console: [], pageErrors: [] }
  const captures = []

  for (const viewport of viewports) {
    for (const routeSpec of routes) {
      await withPage(context, events, async (page) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        const target = new URL(routeSpec.path, baseUrl).toString()
        await page.goto(target, { waitUntil: "networkidle" })
        await page.waitForTimeout(950)
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }))
        const fileName = `${routeSpec.id}-${viewport.id}-${viewport.width}x${viewport.height}.png`
        const screenshotPath = join(surfaceDir, fileName)
        await page.screenshot({ path: screenshotPath, fullPage: true })
        captures.push({
          route: routeSpec.path,
          viewport,
          screenshotPath,
          overflow,
        })
      })
    }
  }

  await context.close()
  return { label, baseUrl, captures, events }
}

async function driveCurrent(browser) {
  const interactionDir = join(outDir, "screenshots", "interactions")
  ensureDir(interactionDir)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await routeStableStars(context)
  const events = { console: [], pageErrors: [] }
  const checks = []

  await withPage(context, events, async (page) => {
    await page.goto(new URL("/", currentUrl).toString(), { waitUntil: "networkidle" })
    await page.waitForTimeout(950)
    await page.getByRole("button", { name: "Copy install command" }).click()
    const copied = await page.getByText("Copied", { exact: true }).isVisible()
    checks.push({ id: "copy-install-command", passed: copied })
    await page.getByRole("link", { name: /docs/i }).first().click()
    await page.waitForURL("**/docs")
    checks.push({ id: "landing-docs-navigation", passed: page.url().endsWith("/docs") })
  })

  await withPage(context, events, async (page) => {
    await page.goto(new URL("/docs", currentUrl).toString(), { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "Menu" }).click()
    const expanded = await page.getByRole("button", { name: "Close Menu" }).getAttribute("aria-expanded")
    checks.push({ id: "docs-mobile-menu-opens", passed: expanded === "true" })
    await page.screenshot({
      path: join(interactionDir, "docs-mobile-menu-open-390x844.png"),
      fullPage: true,
    })
  })

  await withPage(context, events, async (page) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(new URL("/docs", currentUrl).toString(), { waitUntil: "networkidle" })
    await page.keyboard.press("Meta+K")
    const focused = await page.locator("#docs-search-input").evaluate((node) => document.activeElement === node)
    checks.push({ id: "docs-command-k-focuses-search", passed: focused })
    await page.locator("#docs-search-input").fill("feature")
    const skillsVisible = await page
      .getByLabel("Documentation", { exact: true })
      .getByRole("link", { name: "Feature coverage" })
      .isVisible()
    const noMatchesHidden = (await page.getByText("No matches.").count()) === 0
    checks.push({ id: "docs-search-filters-skills", passed: skillsVisible && noMatchesHidden })
    await page.locator("#docs-search-input").fill("")
    await page.getByLabel("Documentation", { exact: true }).getByRole("link", { name: "$ulw-loop" }).click()
    await page.waitForURL(/#ulw-loop$/)
    const inViewport = await page.locator("#ulw-loop").evaluate((node) => {
      const rect = node.getBoundingClientRect()
      return rect.top < window.innerHeight && rect.bottom > 0
    })
    checks.push({ id: "docs-hash-navigation", passed: inViewport })
    await page.screenshot({
      path: join(interactionDir, "docs-desktop-search-hash-1280x800.png"),
      fullPage: true,
    })
  })

  await context.close()
  return { checks, events }
}

const browser = await chromium.launch({ channel: "chrome", headless: true })
try {
  ensureDir(outDir)
  const control = await captureSurface(browser, "control", controlUrl)
  const current = await captureSurface(browser, "current", currentUrl)
  const interactions = await driveCurrent(browser)
  const allChecksPassed = interactions.checks.every((check) => check.passed)
  const report = {
    generatedAt: new Date().toISOString(),
    control,
    current,
    interactions,
    allChecksPassed,
    cleanup: "closed Playwright Chrome contexts and browser",
  }
  writeFileSync(join(outDir, "capture-report.json"), `${JSON.stringify(report, null, 2)}\n`)
  if (!allChecksPassed) {
    throw new Error("one or more interaction checks failed")
  }
} finally {
  await browser.close()
}
