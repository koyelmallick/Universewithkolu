import { Starfield } from './components/Starfield'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { CosmicDiscovery } from './sections/CosmicDiscovery'
import { ExploreEarth } from './sections/ExploreEarth'
import { ExploreSpace } from './sections/ExploreSpace'
import { Hero } from './sections/Hero'
import { HumanExploration } from './sections/HumanExploration'
import { UnderstandScience } from './sections/UnderstandScience'

export default function App() {
  return (
    <div className="relative min-h-screen bg-void">
      {/* Skip link: the first tab stop on the page. */}
      <a
        href="#space"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-ion focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-void"
      >
        Skip to content
      </a>

      <Starfield />
      <Navbar />

      <main>
        <Hero />
        <ExploreSpace />
        <ExploreEarth />
        <UnderstandScience />
        <HumanExploration />
        <CosmicDiscovery />
      </main>

      <Footer />
    </div>
  )
}
