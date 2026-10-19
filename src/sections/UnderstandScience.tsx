import { useState } from 'react'
import { Reveal, SectionHeading, SectionShell } from '../components/layout/SectionShell'
import { SceneFrame } from '../components/three/SceneFrame'
import { TabPanel, Tabs } from '../components/ui/Tabs'
import { TopicDetail } from '../components/ui/TopicDetail'
import { SCIENCE_TOPICS } from '../data/scienceTopics'
import type { SceneId } from '../types/content'

const TABS = SCIENCE_TOPICS.map((topic) => ({
  id: topic.id,
  label: topic.title,
}))

/** Section 03 - Understand Science. */
export function UnderstandScience() {
  const [activeId, setActiveId] = useState(SCIENCE_TOPICS[0].id)
  const active = SCIENCE_TOPICS.find((topic) => topic.id === activeId) ?? SCIENCE_TOPICS[0]

  return (
    <SectionShell id="science" accent="nebula">
      <SectionHeading
        eyebrow="03 - Understand science"
        title="Why the universe behaves the way it does"
        lede="Gravity, light, black holes and galaxies. These pages explain the physics first and the words second, because the words are only labels for something simpler underneath."
      />

      <Reveal className="mt-10">
        <Tabs
          items={TABS}
          activeId={activeId}
          onChange={setActiveId}
          accent="nebula"
          label="Choose a science topic"
        />
      </Reveal>

      <Reveal index={1}>
        <TabPanel id={active.id} className="mt-10">
          <TopicDetail
            topic={active}
            accent="nebula"
            visual={
              active.scene ? (
                <SceneFrame scene={active.scene as SceneId} className="mb-8" />
              ) : null
            }
          />
        </TabPanel>
      </Reveal>
    </SectionShell>
  )
}
