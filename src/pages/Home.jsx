import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header, { TABS } from '../components/Header.jsx'
import { Hero, NewsSlider, AdSlot, LatestNews, FbFeed, AgencyList, Footer } from '../components/Sections.jsx'
import { useCollection } from '../db.js'
import MatichonNews from '../components/Matichon.jsx'
import DistrictSliders from '../components/DistrictSliders.jsx'

export default function Home() {
  const { tab = 'top' } = useParams()
  const [search, setSearch] = useState('')
  const tips = useCollection('insider_tips')

  const sorted = useMemo(
    () => [...tips].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [tips],
  )

  const isDistrict = TABS.some((t) => t.key === tab) && !['top', 'community', 'nongbua'].includes(tab)
  const q = search.trim().toLowerCase()
  const filtered = sorted.filter((n) => {
    if (isDistrict && n.district !== tab) return false
    if (!q) return true
    return [n.title, n.content, n.district, n.source].some((v) => (v || '').toLowerCase().includes(q))
  })

  const featured = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 5)
  const latest = tab === 'top' && !q ? filtered.slice(0, 10) : filtered
  const sliderFirst = !q && !['community', 'agency'].includes(tab) && featured.length > 0
  const title = q ? `ผลการค้นหา "${search}"` : isDistrict ? `ข่าว อ.${tab}` : 'ข่าวใหม่ล่าสุด'

  return (
    <div className="min-h-screen bg-ink-950">
      <Header activeTab={tab} search={search} onSearch={setSearch} />
      {tab === 'top' && !q && <Hero />}

      <main className={`mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_320px] ${sliderFirst ? 'pt-0 sm:pt-5' : 'pt-5'}`}>
        <div className="min-w-0 space-y-6">
          {tab === 'community' ? (
            <FbFeed />
          ) : tab === 'agency' ? (
            <AgencyList />
          ) : (
            <>
              {!q && <NewsSlider items={featured} />}
              <AdSlot position="top" />
              <LatestNews items={latest} title={title} />
              {tab === 'top' && !q && <DistrictSliders tips={sorted} />}
              {!q && <MatichonNews district={isDistrict ? tab : undefined} localOnly={tab === 'nongbua'} limit={tab === 'top' ? 8 : 20} />}
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <AdSlot position="side" />
          <AgencyList compact />
        </aside>
      </main>

      <Footer />
    </div>
  )
}
