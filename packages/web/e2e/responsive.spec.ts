import { test, expect, devices } from "@playwright/test"
import { SITE_CONFIG } from "../lib/site-config"
import { COMMANDS } from "../lib/commands"

/**
 * Responsive contract: the page MUST render perfectly across the device
 * spectrum the user explicitly called out — mobile, iPad, desktop.
 *
 * For each viewport, we assert:
 *   1. No horizontal overflow (the page fits).
 *   2. The wordmark is visible AND fits inside the viewport width.
 *   3. The hero keyword "ultrawork" is visible.
 *   4. The launch-window status (/June 2026/i) is visible.
 *   5. All three command names are visible.
 *   6. The footer ("lazycodex.ai") is visible.
 *
 * If a future change breaks any breakpoint, this spec catches it before
 * Lighthouse a11y/SEO scores even get a chance to fail.
 */

type Viewport = { name: string; width: number; height: number; device?: string }

const VIEWPORTS: ReadonlyArray<Viewport> = [
  { name: "mobile-small", width: 360, height: 640 },
  { name: "mobile-iphone-se", width: 375, height: 667 },
  { name: "mobile-iphone-14", width: 390, height: 844 },
  { name: "mobile-large-android", width: 412, height: 915 },
  { name: "tablet-ipad-portrait", width: 768, height: 1024 },
  { name: "tablet-ipad-landscape", width: 1024, height: 768 },
  { name: "tablet-ipad-pro-portrait", width: 1024, height: 1366 },
  { name: "desktop-laptop", width: 1280, height: 800 },
  { name: "desktop-fullhd", width: 1440, height: 900 },
  { name: "desktop-wide", width: 1536, height: 864 },
  { name: "desktop-ultrawide", width: 1920, height: 1080 },
]

for (const viewport of VIEWPORTS) {
  test(`@responsive renders correctly at ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    })
    const page = await context.newPage()

    try {
      await page.goto("/", { waitUntil: "networkidle" })

      // No horizontal scroll. document body width <= viewport width.
      const overflowed = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(overflowed, "page must not overflow horizontally").toBe(false)

      // Wordmark visible and bounded.
      const wordmark = page.getByRole("heading", { level: 1, name: SITE_CONFIG.wordmark })
      await expect(wordmark).toBeVisible()
      const wordmarkBox = await wordmark.boundingBox()
      expect(wordmarkBox, "wordmark must have a bounding box").not.toBeNull()
      if (wordmarkBox) {
        expect(wordmarkBox.width).toBeLessThanOrEqual(viewport.width)
      }

      // Hero keyword visible (replaces the old single-line tagline check).
      await expect(
        page.getByText(SITE_CONFIG.heroLineB.keyword, { exact: false }).first(),
      ).toBeVisible()

      // Status pill visible.
      await expect(page.getByText(/June 2026/i).first()).toBeVisible()

      // Command card names visible.
      for (const command of COMMANDS) {
        await expect(page.getByText(command.name, { exact: false }).first()).toBeVisible()
      }

      // Footer visible.
      await expect(page.getByText("lazycodex.ai", { exact: false }).first()).toBeVisible()
    } finally {
      await context.close()
    }
  })
}

test("@responsive iPhone-13 device profile (Playwright preset)", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone 13"] })
  const page = await context.newPage()
  try {
    await page.goto("/", { waitUntil: "networkidle" })
    await expect(
      page.getByRole("heading", { level: 1, name: SITE_CONFIG.wordmark }),
    ).toBeVisible()
    const overflowed = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflowed).toBe(false)
  } finally {
    await context.close()
  }
})

test("@responsive iPad-Pro device profile (Playwright preset)", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPad Pro 11"] })
  const page = await context.newPage()
  try {
    await page.goto("/", { waitUntil: "networkidle" })
    await expect(
      page.getByRole("heading", { level: 1, name: SITE_CONFIG.wordmark }),
    ).toBeVisible()
    const overflowed = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflowed).toBe(false)
  } finally {
    await context.close()
  }
})
