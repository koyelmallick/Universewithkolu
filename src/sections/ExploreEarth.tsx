import { useState } from 'react'
import { Reveal, SectionHeading, SectionShell } from '../components/layout/SectionShell'
import { SceneFrame } from '../components/three/SceneFrame'
import { TabPanel, Tabs } from '../components/ui/Tabs'
import { TopicDetail } from '../components/ui/TopicDetail'
import { EARTH_TOPICS } from '../data/earthTopics'
import type { SceneId } from '../types/content'

const TABS = EARTH_TOPICS.map((topic) => ({
  id: topic.id,
  label: topic.title,
}))

/** Section 02 - Explore Earth. */
export function ExploreEarth() {
  const [activeId, setActiveId] = useState(EARTH_TOPICS[0].id)
  const active = EARTH_TOPICS.find((topic) => topic.id === activeId) ?? EARTH_TOPICS[0]

  return (
    <SectionShell id="earth" accent="bio">
      <SectionHeading
        eyebrow="02 - Explore Earth"
        title="The only planet we can study from the inside"
        lede="Oceans, volcanoes, mountains, magnetic storms. Most of what we know about other worlds came from working out how this one behaves first."
      />

      <Reveal className="mt-10">
        <Tabs
          items={TABS}
          activeId={activeId}
          onChange={setActiveId}
          accent="bio"
          label="Choose an Earth science topic"
        />
      </Reveal>

      <Reveal index={1}>
        <TabPanel id={active.id} className="mt-10">
          <TopicDetail
            topic={active}
            accent="bio"
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
