import type { JSX } from "react"
import { SiteHeader } from "../components/site/site-header"
import { Hero } from "../components/site/hero"
import { InstallBlock } from "../components/site/install-block"
import { CommandCards } from "../components/site/command-cards"
import { UltraworkSection } from "../components/site/ultrawork-section"
import { DocsCta } from "../components/site/docs-cta"
import { SiteFooter } from "../components/site/site-footer"

export default function LandingPage(): JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[color:var(--card-base)] focus:px-3 focus:py-2 focus:text-sm focus:text-[color:var(--text-primary)]"
      >
        Skip to main content
      </a>

      <SiteHeader />

      <main id="content" className="flex-1 pb-16 pt-8 md:pt-12">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <Hero />
        </div>
        <InstallBlock />
        <CommandCards />
        <UltraworkSection />
        <DocsCta />
      </main>

      <SiteFooter />
    </div>
  )
}
