import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header, { TABS } from '../components/Header.jsx'
import { Hero, NewsSlider, AdSlot, LatestNews, FbFeed, FbPagesRow, AgencyList, Footer } from '../components/Sections.jsx'
import DistrictSliders from '../components/DistrictSliders.jsx'
import { Ticker, MainHeadline, FeaturedNews, MonthBar, EmptyMonth } from '../components/Live.jsx'
import { mixBySource, onePerSource } from '../components/mix.js'
import { useAllNews } from '../lib/useNews.js'
import { filterCurrentMonth, rankPopular, useExtViews } from '../lib/news.js'
import { useAppState } from '../state.jsx'

export default function Home() {
  const { tab = 'top' } = useParams()
  const [search, setSearch] = useState('')
  const { showAll } = useAppState()
  const ext = useExtViews()
  const all = useAllNews()

  // กรองเดือนปัจจุบัน (ใช้กับทุกส่วน) เว้นแต่กด "ดูทั้งหมด"
  const pool = useMemo(() => (showAll ? all : filterCurrentMonth(all)), [all, showAll])

  const isDistrict = TABS.some((t) => t.key === tab) && !['top', 'community', 'nongbua'].includes(tab)
  const q = search.trim().toLowerCase()
  const filtered = pool.filter((n) => {
    if (isDistrict && n.district !== tab) return false
    if (tab === 'community' && n.district !== 'ข่าวชุมชน') return false
    if (!q) return true
    return [n.title, n.content, n.district, n.source].some((v) => (v || '').toLowerCase().includes(q))
  })

  // ยอดนิยม 5 อันดับของเดือน (ปักหมุดก่อน > วิวมากสุด > ใหม่สุด) -> ticker + พาดหัว LIVE
  const top5 = useMemo(() => rankPopular(pool, ext).slice(0, 5), [pool, ext])

  // ข่าวเด่น: ปักหมุด > สุ่มเพจละ 1 ข่าวที่คัดไว้ > สุ่มจากแต่ละแหล่ง (มีภาพก่อน)
  const [seed, setSeed] = useState(() => String(Math.random()))
  const featured = useMemo(() => {
    const pinned = pool.filter((n) => n.featured)
    const picks = onePerSource(pool.filter((n) => n.pick && !n.featured), seed)
    const used = new Set([...pinned, ...picks].map((n) => n.id))
    const rest = mixBySource(pool.filter((n) => !used.has(n.id)), { seed, perSource: 2, limit: 9 })
    const chosen = [...pinned, ...picks, ...rest]
    // แหล่งข่าวน้อย: เติมด้วยข่าวล่าสุดที่มีภาพให้ครบ 7
    const left = pool.filter((n) => !chosen.some((c) => c.id === n.id)).sort((a, b) => (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0))
    return [...chosen, ...left].slice(0, 7)
  }, [pool, seed])

  const latest = useMemo(() => {
    if (tab !== 'top' || q) return filtered
    const shown = new Set(featured.map((n) => n.id))
    return filtered.filter((n) => !shown.has(n.id)).slice(0, 10)
  }, [tab, q, filtered, featured])

  const title = q ? `ผลการค้นหา "${search}"` : isDistrict ? `ข่าว อ.${tab}` : tab === 'community' ? 'ข่าวชุมชน' : 'ข่าวใหม่ล่าสุด'
  const empty = pool.length === 0

  return (
    <div className="min-h-screen bg-ink-950">
      <Header activeTab={tab} search={search} onSearch={setSearch} />
      {tab === 'top' && !q && <Ticker items={top5} />}
      {tab === 'top' && !q && <Hero />}

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pt-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {tab !== 'agency' && <MonthBar count={q || tab !== 'top' ? filtered.length : pool.length} />}

          {tab === 'agency' ? (
            <AgencyList />
          ) : tab === 'community' ? (
            <>
              <FbFeed />
              {filtered.length > 0 && <LatestNews items={filtered} title={title} />}
            </>
          ) : tab === 'top' && !q ? (
            <>
              {empty ? <EmptyMonth /> : <MainHeadline items={top5} ext={ext} />}
              <AdSlot position="top" />
              <FeaturedNews items={featured} onShuffle={() => setSeed(String(Math.random()))} />
              <FbPagesRow seed={seed} />
              {latest.length > 0 && <LatestNews items={latest} title={title} />}
              <DistrictSliders tips={pool} />
            </>
          ) : (
            <>
              {!q && filtered.length > 0 && <NewsSlider items={rankPopular(filtered, ext).slice(0, 5)} />}
              <AdSlot position="top" />
              {filtered.length === 0 && !q && !showAll ? <EmptyMonth /> : <LatestNews items={filtered} title={title} />}
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <AdSlot position="side" />
          {tab !== 'agency' && <AgencyList compact />}
        </aside>
      </main>

      <Footer />
    </div>
  )
}
