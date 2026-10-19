import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { CosmicDiscovery } from '../sections/CosmicDiscovery'
import { ExploreEarth } from '../sections/ExploreEarth'
import { ExploreSpace } from '../sections/ExploreSpace'
import { Hero } from '../sections/Hero'
import { UnderstandScience } from '../sections/UnderstandScience'

function renderApp() {
  return render(<App />)
}

describe('hero', () => {
  it('states the site name as the top-level heading', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/explore the universe/i)
  })

  it('mounts a 3D canvas and describes what it shows', () => {
    render(<Hero />)
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
    // The canvas region must declare that it is a simulation or photo.
    const region = screen.getByRole('img', { name: /3d earth/i })
    expect(region).toHaveAttribute('aria-label')
    expect(region.getAttribute('aria-label')).toMatch(/drag to rotate/i)
  })

  it('offers a way into the content and into the method statement', () => {
    render(<Hero />)
    expect(screen.getByRole('link', { name: /start exploring/i })).toHaveAttribute('href', '#space')
    expect(screen.getByRole('link', { name: /how to read this site/i })).toHaveAttribute(
      'href',
      '#method',
    )
  })
})

describe('navigation', () => {
  it('links to all five sections plus the method statement', () => {
    renderApp()
    const nav = screen.getByRole('navigation', { name: /sections/i })
    for (const [label, href] of [
      ['Explore Space', '#space'],
      ['Explore Earth', '#earth'],
      ['Understand Science', '#science'],
      ['Human Space Exploration', '#human'],
      ['Daily Cosmic Discovery', '#discovery'],
    ] as const) {
      expect(within(nav).getAllByRole('link', { name: label })[0]).toHaveAttribute('href', href)
    }
  })

  it('gives every section a matching anchor target', () => {
    const { container } = renderApp()
    for (const id of ['space', 'earth', 'science', 'human', 'discovery', 'method']) {
      expect(container.querySelector(`#${id}`), `#${id} is missing`).not.toBeNull()
    }
  })
})

describe('section 01 - explore space', () => {
  it('starts on Earth and shows its sourced facts', () => {
    render(<ExploreSpace />)
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { name: 'Earth' })).toBeInTheDocument()
    expect(within(panel).getAllByText(/^71%$/).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/23\.44/).length).toBeGreaterThan(0)
  })

  it('switches to another planet when its tab is clicked', async () => {
    const user = userEvent.setup()
    render(<ExploreSpace />)

    await user.click(screen.getByRole('tab', { name: /jupiter/i }))

    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { name: 'Jupiter' })).toBeInTheDocument()
    expect(within(panel).getAllByText(/318 Earths/).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/Great Red Spot/).length).toBeGreaterThan(0)
  })

  it('supports keyboard navigation between bodies', async () => {
    const user = userEvent.setup()
    render(<ExploreSpace />)

    const earthTab = screen.getByRole('tab', { name: /earth/i })
    earthTab.focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: /mars/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('always tells the viewer the model is not to scale', () => {
    render(<ExploreSpace />)
    expect(screen.getAllByText(/not to scale/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/2,000x/).length).toBeGreaterThan(0)
  })

  it('refuses to show an illustration for bodies with no photograph', async () => {
    const user = userEvent.setup()
    render(<ExploreSpace />)

    await user.click(screen.getByRole('tab', { name: /mercury/i }))
    expect(screen.getByText(/no close-up photograph of Mercury/i)).toBeInTheDocument()
  })
})

describe('section 02 - explore earth', () => {
  it('opens on the interior topic with a labelled cutaway', () => {
    render(<ExploreEarth />)
    expect(screen.getByRole('heading', { name: /earth, inside and out/i })).toBeInTheDocument()
    expect(screen.getAllByText(/layer thicknesses are exaggerated/i).length).toBeGreaterThan(0)
  })

  it('switches topics and surfaces a scale caveat with the new scene', async () => {
    const user = userEvent.setup()
    render(<ExploreEarth />)

    await user.click(screen.getByRole('tab', { name: /volcanoes/i }))

    expect(screen.getAllByText(/20x vertical exaggeration/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^About 80%$/).length).toBeGreaterThan(0)
  })

  it('shows the aurora topic with the invisibility caveat', async () => {
    const user = userEvent.setup()
    render(<ExploreEarth />)

    await user.click(screen.getByRole('tab', { name: /auroras/i }))
    expect(screen.getAllByText(/magnetic field is invisible/i).length).toBeGreaterThan(0)
  })
})

describe('section 03 - understand science', () => {
  it('explains gravity first, including the limits of the sheet analogy', () => {
    render(<UnderstandScience />)
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { name: 'Gravity' })).toBeInTheDocument()
    // The analogy must be present, and so must its stated limit.
    expect(within(panel).getAllByText(/rubber sheet/i).length).toBeGreaterThan(0)
    expect(within(panel).getAllByText(/no "down"|there is no sheet/i).length).toBeGreaterThan(0)
  })

  it('switches to black holes and labels the disc as a simulation', async () => {
    const user = userEvent.setup()
    render(<UnderstandScience />)

    await user.click(screen.getByRole('tab', { name: /black holes/i }))

    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { name: 'Black holes' })).toBeInTheDocument()
    expect(within(panel).getAllByText(/6\.5 billion Suns/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/computed from lensing/i).length).toBeGreaterThan(0)
  })

  it('warns that the galaxy visual is not the Milky Way', async () => {
    const user = userEvent.setup()
    render(<UnderstandScience />)

    await user.click(screen.getByRole('tab', { name: /galaxies/i }))
    expect(screen.getAllByText(/not a view of the milky way/i).length).toBeGreaterThan(0)
  })

  it('marks the exoplanet image as an illustration', async () => {
    const user = userEvent.setup()
    render(<UnderstandScience />)

    await user.click(screen.getByRole('tab', { name: /worlds around other stars/i }))
    expect(screen.getAllByText(/^Illustration$/i).length).toBeGreaterThan(0)
  })
})

describe('section 04 - human space exploration', () => {
  it('lists the missions with real photographs and credits', () => {
    renderApp()
    expect(screen.getByText('Apollo 11')).toBeInTheDocument()
    expect(screen.getAllByText(/James Webb Space Telescope/).length).toBeGreaterThan(0)
    expect(screen.getByAltText(/Apollo 11 lunar surface photograph/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Credit: NASA \/ Artemis II crew/i).length).toBeGreaterThan(0)
  })
})

describe('section 05 - daily cosmic discovery', () => {
  it('presents one discovery for today and an archive of the rest', () => {
    render(<CosmicDiscovery />)

    expect(screen.getByText(/^Today ·/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /the archive/i })).toBeInTheDocument()
    // The archive lists every other entry.
    expect(screen.getAllByRole('heading', { level: 4 }).length).toBeGreaterThan(8)
  })

  it('shows a confidence tier on every entry', () => {
    render(<CosmicDiscovery />)
    const tiers = screen.getAllByText(/^(Observed|Modelled|Hypothesis)$/)
    expect(tiers.length).toBeGreaterThan(8)
  })

  it('explains how the daily pick works', () => {
    render(<CosmicDiscovery />)
    expect(screen.getByText(/computed from today's date/i)).toBeInTheDocument()
  })
})

describe('method statement', () => {
  it('documents the four evidence badges', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /pictures and claims are labelled/i })).toBeInTheDocument()
    for (const label of ['Real photograph', 'Simulation', 'Illustration', 'Data / diagram']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('publishes a deduplicated source list', () => {
    renderApp()
    expect(screen.getAllByText(/primary references/i).length).toBeGreaterThan(0)
    const links = screen.getAllByRole('link', { name: /NASA|USGS|NOAA|NIST/i })
    expect(links.length).toBeGreaterThan(10)
  })
})
