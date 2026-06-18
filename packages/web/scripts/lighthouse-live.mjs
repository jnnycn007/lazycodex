import { chromium } from "@playwright/test"
import lighthouse from "lighthouse"
import { createServer } from "node:net"

const url = process.argv[2] ?? "https://lazycodex.ai/"
const categoryKeys = ["performance", "accessibility", "best-practices", "seo"]

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        server.close()
        reject(new Error("Unable to allocate a CDP port"))
        return
      }
      const { port } = address
      server.close((error) => (error ? reject(error) : resolve(port)))
    })
  })
}

function settingsFor(formFactor) {
  if (formFactor === "mobile") {
    return {
      formFactor: "mobile",
      disableStorageReset: true,
      throttlingMethod: "provided",
      screenEmulation: {
        mobile: true,
        width: 412,
        height: 823,
        deviceScaleFactor: 1.75,
        disabled: false,
      },
    }
  }

  return {
    formFactor: "desktop",
    disableStorageReset: true,
    throttlingMethod: "provided",
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  }
}

async function audit(formFactor) {
  const cdpPort = await findFreePort()
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [`--remote-debugging-port=${cdpPort}`, "--no-sandbox", "--disable-dev-shm-usage"],
  })

  try {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 })
    await page.goto("about:blank")

    const result = await lighthouse(
      url,
      {
        port: cdpPort,
        output: ["json"],
        logLevel: "error",
        onlyCategories: categoryKeys,
      },
      {
        extends: "lighthouse:default",
        settings: settingsFor(formFactor),
      },
    )

    if (!result || result.lhr.runtimeError) {
      const runtimeError = result?.lhr.runtimeError
      const message = runtimeError ? `${runtimeError.code}: ${runtimeError.message}` : "no result"
      throw new Error(`Lighthouse ${formFactor} failed: ${message}`)
    }

    const scores = Object.fromEntries(
      categoryKeys.map((key) => [key, Math.round((result.lhr.categories[key].score ?? 0) * 100)]),
    )
    console.log(
      `[live Lighthouse ${formFactor}] url=${url} perf=${scores.performance} a11y=${scores.accessibility} bp=${scores["best-practices"]} seo=${scores.seo}`,
    )

    const failingAudits = Object.values(result.lhr.audits)
      .filter((audit) => audit.score !== null && audit.score < 1)
      .map((audit) => `  - ${audit.id}: score=${audit.score} (${audit.title})`)
      .slice(0, 30)
    if (failingAudits.length > 0) {
      console.warn(`[live Lighthouse ${formFactor}] Failing audits:\n${failingAudits.join("\n")}`)
    }

    const failingScores = Object.entries(scores).filter(([, score]) => score < 100)
    if (failingScores.length > 0) {
      throw new Error(`Lighthouse ${formFactor} scores below 100: ${JSON.stringify(Object.fromEntries(failingScores))}`)
    }
  } finally {
    await browser.close()
  }
}

for (const formFactor of ["mobile", "desktop"]) {
  await audit(formFactor)
}

console.log("cleanup: closed Playwright Chrome browsers; no Lighthouse CLI used")
