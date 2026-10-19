import { useCallback, useState } from 'react'
import { Starfield } from './components/Starfield'
import { IntroSequence } from './components/intro/IntroSequence'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { CosmicDiscovery } from './sections/CosmicDiscovery'
import { ExploreEarth } from './sections/ExploreEarth'
import { ExploreSpace } from './sections/ExploreSpace'
import { Hero } from './sections/Hero'
import { HumanExploration } from './sections/HumanExploration'
import { UnderstandScience } from './sections/UnderstandScience'
import { shouldAutoplayIntro } from './lib/introStorage'

export default function App() {
  // Decided once, before first paint: repeat visits and deep links skip it.
  const [introActive, setIntroActive] = useState(() => shouldAutoplayIntro())

  const finishIntro = useCallback(() => setIntroActive(false), [])

  const replayIntro = useCallback(() => {
    // Replaying is a deliberate "take me back to the start", so put the page
    // back at the top first; otherwise the sequence lifts onto a scrolled page.
    window.scrollTo({ top: 0, behavior: 'auto' })
    setIntroActive(true)
  }, [])

  return (
    <div className="relative min-h-screen bg-void">
      {/* Skip link: the first tab stop on the page. */}
      <a
        href="#space"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-full focus:bg-ion focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-void"
      >
        Skip to content
      </a>

      <Starfield />
      <Navbar />

      <main>
        <Hero onReplayIntro={replayIntro} />
        <ExploreSpace />
        <ExploreEarth />
        <UnderstandScience />
        <HumanExploration />
        <CosmicDiscovery />
      </main>

      <Footer />

      {/* Last in the DOM, above everything: the opening sequence. */}
      {introActive ? <IntroSequence onDone={finishIntro} /> : null}
    </div>
  )
}
