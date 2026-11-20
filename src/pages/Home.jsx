import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header, { TABS } from '../components/Header.jsx'
import { Hero, NewsSlider, AdSlot, LatestNews, FbFeed, AgencyList, Footer } from '../components/Sections.jsx'
import { useCollection } from '../db.js'
import MatichonNews from '../components/Matichon.jsx'
import DistrictSliders from '../components/DistrictSliders.jsx'
import { useLinkNews } from '../components/links.js'
import { useMatichon } from '../components/Matichon.jsx'
import { mixBySource } from '../components/mix.js'

export default function Home() {
  const { tab = 'top' } = useParams()
  const [search, setSearch] = useState('')
  const tips = useCollection('insider_tips')

  const linkNews = useLinkNews()
  // ข่าวจากหลังบ้าน + ข่าวจากลิงก์ (content/news-links.txt)
  const sorted = useMemo(
    () => [...tips, ...linkNews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [tips, linkNews],
  )

  const isDistrict = TABS.some((t) => t.key === tab) && !['top', 'community', 'nongbua'].includes(tab)
  const q = search.trim().toLowerCase()
  const filtered = sorted.filter((n) => {
    if (isDistrict && n.district !== tab) return false
    if (!q) return true
    return [n.title, n.content, n.district, n.source].some((v) => (v || '').toLowerCase().includes(q))
  })

  // สไลด์หน้า TOP: ข่าวปักหมุด + สุ่มข่าวล่าสุดจากแต่ละแหล่ง (เว็บเรา / ลิงก์ข่าว / มติชน)
  const matichon = useMatichon()
  const [seed, setSeed] = useState(() => String(Math.random()))
  const featured = useMemo(() => {
    if (tab !== 'top' || q) return [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 5)
    const pinned = sorted.filter((n) => n.featured)
    const ext = (matichon?.items || []).map((m) => ({
      id: 'm-' + m.link, title: m.title, image_url: m.image, source: m.source, district: m.district, created_at: m.published_at, href: m.link, local: m.local,
    }))
    const pool = [...sorted.filter((n) => !n.featured), ...ext.filter((m) => !sorted.some((n) => n.href === m.href))]
    return [...pinned, ...mixBySource(pool, { seed, perSource: 3, limit: 8 })].slice(0, 8)
  }, [tab, q, filtered, sorted, matichon, seed])
  // หน้า TOP: ข่าวใหม่ล่าสุด = ข่าวในเว็บ/ลิงก์ข่าว + ข่าวมติชนเกี่ยวกับหนองบัวลำภู (เติมข่าวมติชนทั่วไปที่มีภาพถ้ายังน้อย)
  const latest = useMemo(() => {
    if (tab !== 'top' || q) return filtered
    const ext = (matichon?.items || []).map((m) => ({
      id: 'm-' + m.link, title: m.title, image_url: m.image, source: m.source, district: m.district, created_at: m.published_at, href: m.link, local: m.local,
    })).filter((m) => !sorted.some((n) => n.href === m.href))
    const byDate = (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    let list = [...sorted, ...ext.filter((m) => m.local)].sort(byDate)
    if (list.length < 10) list = [...list, ...ext.filter((m) => !m.local && m.image_url).sort(byDate)]
    return list.slice(0, 10)
  }, [tab, q, filtered, sorted, matichon])
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
              {!q && <NewsSlider items={featured} onShuffle={tab === 'top' ? () => setSeed(String(Math.random())) : undefined} />}
              <AdSlot position="top" />
              <LatestNews items={latest} title={title} />
              {tab === 'top' && !q && <DistrictSliders tips={sorted} />}
              {!q && tab !== 'top' && <MatichonNews district={isDistrict ? tab : undefined} localOnly={tab === 'nongbua'} limit={tab === 'top' ? 8 : 20} />}
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
