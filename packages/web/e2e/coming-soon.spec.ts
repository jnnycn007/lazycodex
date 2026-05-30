import { test, expect } from "@playwright/test"
import { SITE_CONFIG } from "../lib/site-config"

test.describe("coming-soon page — content", () => {
  test("renders the wordmark, hero copy, status, and footer", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { level: 1, name: SITE_CONFIG.wordmark }),
    ).toBeVisible()

    await expect(page.getByText(SITE_CONFIG.eyebrow, { exact: true })).toBeVisible()
    await expect(page.getByText(/June 2026/i).first()).toBeVisible()
    await expect(page.getByText("OpenCode", { exact: false }).first()).toBeVisible()

    // New hero copy (replaces the old "You don't need to think." splash).
    await expect(page.getByText(SITE_CONFIG.heroLineA, { exact: false }).first()).toBeVisible()
    await expect(
      page.getByText(SITE_CONFIG.heroLineB.slot, { exact: false }).first(),
    ).toBeVisible()
    await expect(
      page.getByText(SITE_CONFIG.heroLineB.keyword, { exact: false }).first(),
    ).toBeVisible()

    await expect(page.getByText("lazycodex.ai", { exact: false }).first()).toBeVisible()
  })

  test("has a single h1 and no broken landmarks", async ({ page }) => {
    await page.goto("/")
    const h1s = await page.locator("h1").count()
    expect(h1s).toBe(1)
    await expect(page.locator("main")).toHaveCount(1)
    await expect(page.locator("footer")).toHaveCount(1)
  })

  test("skip-link is hidden until focused", async ({ page }) => {
    await page.goto("/")
    const skip = page.getByRole("link", { name: "Skip to main content" })
    await expect(skip).toHaveClass(/sr-only/)
    await skip.focus()
    await expect(skip).toBeFocused()
  })
})
