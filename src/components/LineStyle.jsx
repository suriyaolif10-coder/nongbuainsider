// ส่วนประกอบหน้าแรกสไตล์แอปข่าว (โครงแบบ LINE TODAY แต่เป็นแบรนด์/ข่าวหนองบัว INSIDER)
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SafeImg, Icon } from './ui.jsx'
import { db, useCollection, timeAgo, districtShort, DISTRICTS } from '../db.js'
import { getViews } from '../lib/news.js'
import { useHeadline, useOpenNews } from './Live.jsx'
import { useAppState } from '../state.jsx'
import logoMark from '../assets/logo-mark.png'

const tagOf = (n) => (n.district ? districtShort(n.district) : 'หนองบัวลำภู')

// ---------- การ์ดโฆษณาแบบ native (นับ views++ เมื่อแสดง) ----------
export function NativeAd({ position = 'top' }) {
  const ads = useCollection('ad_banners').filter((a) => a.active && a.position === position)
  const fbPage = useCollection('fb_posts')[0]?.embed_url || '#'
  const [pickedId] = useState(() => {
    const pool = db.list('ad_banners').filter((a) => a.active && a.position === position)
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null
  })
  const ad = ads.find((a) => a.id === pickedId) || ads[0]
  useEffect(() => { if (ad?.id) db.incrementViews(ad.id) }, [ad?.id])

  const row = (img, title, by, cta, href, rel) => (
    <a href={href} target="_blank" rel={rel} className="flex gap-3.5 py-1">
      <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24">{img}</div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base font-semibold leading-snug text-white">{title}</p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-neutral-400">
          <img src={logoMark} alt="" className="h-4 w-4 rounded-full bg-white object-contain p-0.5" /> {by}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-neutral-300">
          <span className="rounded border border-neutral-500 px-1 text-[11px] leading-4 text-neutral-400">โฆษณา</span> {cta}
        </p>
      </div>
    </a>
  )
  if (!ad) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-700 p-3">
        {row(<div className="grid h-full w-full place-items-center bg-ink-800"><img src={logoMark} alt="" className="w-1/2" /></div>,
          'พื้นที่โฆษณา', 'หนองบัว INSIDER', <span className="text-brand">ลงโฆษณากับหนองบัว INSIDER ติดต่อทางเพจ ›</span>, fbPage, 'noreferrer')}
      </div>
    )
  }
  return row(
    ad.image_url ? <SafeImg src={ad.image_url} alt={ad.title} className="h-full w-full" /> : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand/40 to-ink-800 p-2 text-center text-xs font-bold text-white">{ad.title}</div>,
    ad.title, ad.owner || 'ผู้สนับสนุน', 'ดูเพิ่มเติม', ad.link || '#', 'noreferrer sponsored',
  )
}

// ---------- แฮชแท็กยอดนิยม ----------
export function HashtagChips({ news }) {
  const counts = {}
  news.forEach((n) => { if (n.district) counts[n.district] = (counts[n.district] || 0) + 1 })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([d]) => d)
  const tags = [...top, ...DISTRICTS.map((d) => d.name)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)
  return (
    <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
      {tags.map((d) => (
        <Link key={d} to={`/tab/${encodeURIComponent(d)}`} className="shrink-0 rounded-full bg-[#4a1f14] px-4 py-2 text-[15px] text-white hover:bg-brand">
          #{d.replace('เมืองหนองบัวลำภู', 'เมืองหนองบัว')}
        </Link>
      ))}
    </div>
  )
}

// ---------- สไลด์ข่าวใหญ่ + กล่องหัวข้อซ้อนด้านล่าง ----------
export function HeadlineCarousel({ items, ext }) {
  const [idx, setIdx] = useState(0)
  const touch = useRef(null)
  const open = useOpenNews()
  const headline = useHeadline()
  const { aiMode } = useAppState()
  const count = items.length
  useEffect(() => { setIdx(0) }, [count])
  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 5000)
    return () => clearInterval(t)
  }, [count, idx])
  if (!count) return null
  const go = (d) => setIdx((i) => (i + d + count) % count)
  const n = items[Math.min(idx, count - 1)]

  return (
    <section aria-roledescription="carousel" aria-label="พาดหัวข่าวยอดนิยม" className="-mx-4 bg-ink-900 pb-4 sm:mx-0 sm:overflow-hidden sm:rounded-2xl">
      <div className="relative"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return
          const dx = e.changedTouches[0].clientX - touch.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          touch.current = null
        }}>
        <button onClick={() => open(n)} className="block w-full" aria-label={n.title}>
          <SafeImg key={n.id} src={n.image_url} alt="" className="aspect-[16/10] w-full animate-fadein sm:aspect-[16/8]" />
        </button>
        {/* แถบตำแหน่ง */}
        <div className="absolute inset-x-4 bottom-3 flex gap-1">
          {items.map((x, i) => (
            <button key={x.id} onClick={() => setIdx(i)} aria-label={`ข่าวที่ ${i + 1}`}
              className={`h-[3px] flex-1 rounded-full ${i === idx ? 'bg-white' : 'bg-white/35'}`} />
          ))}
        </div>
      </div>
      {/* กล่องหัวข้อ */}
      <button onClick={() => open(n)} className="relative mx-4 -mt-2 block w-[calc(100%-2rem)] rounded-xl bg-ink-800 px-4 py-3.5 text-left shadow-lg">
        <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-brand px-2 py-0.5 font-bold text-white">🔥 ยอดนิยม</span>
          <span className="rounded-full border border-brand/60 px-2 py-0.5 font-semibold text-brand">{tagOf(n)}</span>
          <span className="flex items-center gap-1 font-semibold text-red-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />LIVE</span>
        </p>
        <h2 className="line-clamp-3 font-display text-[22px] font-bold leading-snug text-white sm:text-[30px]">
          {aiMode && <span className="mr-1.5 inline-block rounded-md bg-white/15 px-1.5 align-middle text-sm font-medium text-neutral-200">AI</span>}
          {headline(n, 'main')}
        </h2>
        <p className="mt-1.5 text-xs text-neutral-400">{n.source} • {timeAgo(n.created_at)} • 👁 {getViews(n, ext).toLocaleString('th-TH')} วิว{n.href && ' ↗'}</p>
      </button>
    </section>
  )
}

// ---------- แถบเมนูล่าง (มือถือ) + ปุ่มแจ้งข่าว ----------
export function BottomNav({ onSearch }) {
  const { pathname } = useLocation()
  const fbPage = useCollection('fb_posts')[0]?.embed_url
  const item = (to, label, icon, active) => (
    <Link to={to} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${active ? 'text-white' : 'text-neutral-400'}`}>
      {icon}{label}
    </Link>
  )
  const I = (d) => <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  return (
    <>
      {fbPage && (
        <a href={fbPage} target="_blank" rel="noreferrer"
          className="fixed bottom-[76px] right-4 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-[0_6px_20px_rgba(255,106,0,.45)] hover:bg-brand-600 lg:bottom-6">
          💬 แจ้งข่าว
        </a>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="เมนูหลัก">
        {item('/', 'หน้าแรก', I(<><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>), pathname === '/')}
        {item('/tab/community', 'ข่าวชุมชน', I(<><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.3A8 8 0 1 1 21 12Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>), pathname === '/tab/community')}
        <button onClick={onSearch} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-neutral-400">
          <Icon.Search className="h-6 w-6" />ค้นหา
        </button>
        {item('/tab/agency', 'หน่วยงาน', I(<><path d="M3 21h18M5 21V10m14 11V10M4 10h16L12 4 4 10Z" /><path d="M9 21v-6h6v6" /></>), pathname === '/tab/agency')}
        {item('/admin/login', 'เพิ่มข่าว', I(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>), false)}
      </nav>
    </>
  )
}
