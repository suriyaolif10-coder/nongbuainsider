import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header, { TABS } from '../components/Header.jsx'
import { Hero, NewsSlider, AdSlot, LatestNews, FbFeed, FbPagesRow, AgencyList, Footer } from '../components/Sections.jsx'
import { useCollection } from '../db.js'
import DistrictSliders from '../components/DistrictSliders.jsx'
import { useLinkNews } from '../components/links.js'
import { mixBySource } from '../components/mix.js'
import { useMatichonNews } from '../components/matichon.js'
import TopStories from '../components/TopStories.jsx'

export default function Home() {
  const { tab = 'top' } = useParams()
  const [search, setSearch] = useState('')
  const tips = useCollection('insider_tips')

  const linkNews = useLinkNews()
  const matichonNews = useMatichonNews()
  // ข่าวจากหลังบ้าน + ข่าวจากลิงก์ (content/news-links.txt)
  const sorted = useMemo(
    () => [...tips.map((t) => (t.link ? { ...t, href: t.link } : t)), ...linkNews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [tips, linkNews],
  )

  const isDistrict = TABS.some((t) => t.key === tab) && !['top', 'community', 'nongbua'].includes(tab)
  const q = search.trim().toLowerCase()
  const filtered = sorted.filter((n) => {
    if (isDistrict && n.district !== tab) return false
    if (!q) return true
    return [n.title, n.content, n.district, n.source].some((v) => (v || '').toLowerCase().includes(q))
  })

  // ข่าวเด่น TOP: ข่าวปักหมุด + สุ่มจากแต่ละแหล่งในจังหวัด (ข่าวในเว็บ/ลิงก์โพสต์เพจ) แล้วเติมด้วยข่าวมติชนหมวดหนองบัวลำภู
  const [seed, setSeed] = useState(() => String(Math.random()))
  const byDate = (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  const extra = useMemo(() => matichonNews.filter((m) => !sorted.some((n) => n.href === m.href)), [matichonNews, sorted])
  const featured = useMemo(() => {
    if (tab !== 'top' || q) return [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 5)
    const pinned = sorted.filter((n) => n.featured)
    const local = mixBySource(sorted.filter((n) => !n.featured), { seed, perSource: 3, limit: 7 })
    const fill = [...extra.filter((m) => m.image_url)].sort(byDate)
    return [...pinned, ...local, ...fill].slice(0, 7)
  }, [tab, q, filtered, sorted, extra, seed])
  // ข่าวใหม่ล่าสุด (TOP): ข่าวในเว็บ/ลิงก์ + มติชน เรียงตามเวลา ไม่ซ้ำกับข่าวเด่น
  const latest = useMemo(() => {
    if (tab !== 'top' || q) return [...filtered, ...(isDistrict ? extra.filter((m) => m.district === tab) : [])].sort(byDate)
    const shown = new Set(featured.map((n) => n.id))
    return [...sorted, ...extra].filter((n) => !shown.has(n.id)).sort(byDate).slice(0, 10)
  }, [tab, q, filtered, sorted, extra, featured, isDistrict])
  const sliderFirst = !q && !['community', 'agency', 'top'].includes(tab) && featured.length > 0
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
              {!q && tab === 'top' && <TopStories items={featured} onShuffle={() => setSeed(String(Math.random()))} />}
              {!q && tab !== 'top' && <NewsSlider items={featured} />}
              <AdSlot position="top" />
              {tab === 'top' && !q && <FbPagesRow seed={seed} />}
              {(latest.length > 0 || tab !== 'top' || q) && <LatestNews items={latest} title={title} />}
              {tab === 'top' && !q && <DistrictSliders tips={[...sorted, ...extra]} />}
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
