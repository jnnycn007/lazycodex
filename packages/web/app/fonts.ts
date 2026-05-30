import localFont from "next/font/local"

/**
 * Geist loaded locally with `display: "optional"`. This is the canonical fix
 * for a web-font-gated LCP: the metric-matched fallback paints the heading at
 * FCP and the browser never performs a late swap that would push LCP out under
 * throttled networks. On warm/fast loads Geist is used; on a cold throttled
 * load the (size-adjusted) fallback is used, keeping LCP == FCP.
 */
export const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "optional",
  preload: true,
})

export const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "optional",
  preload: true,
})
