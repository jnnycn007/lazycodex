export const SITE_CONFIG = {
  installCommand: "bunx lazycodex install",
  installCommandAutonomous: "bunx lazycodex install --no-tui --codex-autonomous",
  installEquivalent: "bunx omo install --platform=codex",
  githubUrl: "https://github.com/code-yeongyu/lazycodex",
  githubStarsUrl: "https://github.com/code-yeongyu/lazycodex/stargazers",
  omoUrl: "https://github.com/code-yeongyu/oh-my-openagent",
  sisyphusUrl: "https://sisyphuslabs.ai",
  siteUrl: "https://lazycodex.ai",
  docsPath: "/docs",
  eyebrow: "CODEX FOR NO-BRAINERS",
  wordmark: "LazyCodex",
  heroLineA: "You don't need to ultrathink.",
  heroLineB: {
    prefix: "Just prompt ",
    slot: "{your prompt}",
    suffix: " ",
    keyword: "ultrawork",
    period: ".",
  },
  status: "Currently on OpenCode · Codex coming June 2026",
  ultraworkTagline: "One word. Every agent activates. Doesn't stop until done.",
  ultraworkExample: "ulw add authentication",
} as const;

export type SiteConfig = typeof SITE_CONFIG;
