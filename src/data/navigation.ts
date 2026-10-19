export interface NavItem {
  id: string
  label: string
  /** Short form for narrow screens. */
  short: string
}

/** The five main sections, in page order. Drives the navbar and its anchors. */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'space', label: 'Explore Space', short: 'Space' },
  { id: 'earth', label: 'Explore Earth', short: 'Earth' },
  { id: 'science', label: 'Understand Science', short: 'Science' },
  { id: 'human', label: 'Human Space Exploration', short: 'Missions' },
  { id: 'discovery', label: 'Daily Cosmic Discovery', short: 'Discovery' },
]

export const SECTION_IDS: readonly string[] = NAV_ITEMS.map((item) => item.id)
