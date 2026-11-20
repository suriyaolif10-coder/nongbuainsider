import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header, { TABS } from '../components/Header.jsx'
import { Hero, NewsSlider, AdSlot, LatestNews, FbFeed, FbPagesRow, AgencyList, Footer } from '../components/Sections.jsx'
import DistrictSliders from '../components/DistrictSliders.jsx'
import { Ticker, FeaturedNews, MonthBar, EmptyMonth } from '../components/Live.jsx'
import { NativeAd, HashtagChips, HeadlineCarousel, BottomNav } from '../components/LineStyle.jsx'
import { mixBySource, onePerSource } from '../components/mix.js'
import { useAllNews } from '../lib/useNews.js'
import { filterCurrentMonth, rankPopular, useExtViews } from '../lib/news.js'
import { useAppState } from '../state.jsx'

export default function Home() {
  const { tab = 'top' } = useParams()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
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

  // แท็บที่มีข่าวใหม่ใน 24 ชม. -> จุดส้ม
  const newTabs = useMemo(() => {
    const since = Date.now() - 864e5
    const fresh = all.filter((n) => new Date(n.created_at).getTime() > since)
    const t = new Set(fresh.map((n) => n.district).filter(Boolean))
    if (fresh.length) t.add('nongbua')
    if (t.has('ข่าวชุมชน')) t.add('community')
    return [...t]
  }, [all])

  const title = q ? `ผลการค้นหา "${search}"` : isDistrict ? `ข่าว อ.${tab}` : tab === 'community' ? 'ข่าวชุมชน' : 'ข่าวใหม่ล่าสุด'
  const empty = pool.length === 0

  const openSearch = () => { setSearchOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="min-h-screen bg-ink-950 pb-20 lg:pb-0">
      <Header activeTab={tab} search={search} onSearch={setSearch} newTabs={newTabs} searchOpen={searchOpen} onSearchOpen={setSearchOpen} />
      {tab === 'top' && !q && <Ticker items={top5} />}

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pt-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {tab === 'agency' ? (
            <AgencyList />
          ) : tab === 'community' ? (
            <>
              <MonthBar count={filtered.length} />
              <FbFeed />
              {filtered.length > 0 && <LatestNews items={filtered} title={title} />}
            </>
          ) : tab === 'top' && !q ? (
            <>
              <NativeAd position="top" />
              <HashtagChips news={pool} />
              {empty ? <EmptyMonth /> : <HeadlineCarousel items={top5} ext={ext} />}
              <MonthBar count={pool.length} />
              {latest.length > 0 && <LatestNews items={latest} title={title} />}
              <FeaturedNews items={featured} onShuffle={() => setSeed(String(Math.random()))} />
              <FbPagesRow seed={seed} />
              <DistrictSliders tips={pool} />
            </>
          ) : (
            <>
              <MonthBar count={filtered.length} />
              {!q && filtered.length > 0 && <NewsSlider items={rankPopular(filtered, ext).slice(0, 5)} />}
              <NativeAd position="top" />
              {filtered.length === 0 && !q && !showAll ? <EmptyMonth /> : <LatestNews items={filtered} title={title} />}
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <AdSlot position="side" />
          {tab !== 'agency' && <AgencyList compact />}
        </aside>
      </main>

      {tab === 'top' && !q && <div className="mt-10"><Hero /></div>}
      <Footer />
      <BottomNav onSearch={openSearch} />
    </div>
  )
}
