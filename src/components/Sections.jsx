import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SafeImg, Icon, Brand, MountainOutline } from './ui.jsx'
import { usePreviews, previewOf, hostOf } from './previews.js'
import { db, useCollection, timeAgo, districtShort, GITHUB_URL } from '../db.js'

export function Hero() {
  const custom = useCollection('app_config')[0]?.hero_image_url
  // ค่าเริ่มต้น: แบนเนอร์ที่มีโลโก้และข้อความในภาพแล้ว แสดงภาพเต็ม ๆ
  if (!custom) {
    return (
      <section className="border-b border-brand/40 bg-black">
        <h1 className="sr-only">หนองบัว INSIDER รู้ลึก รู้จริง เรื่องหนองบัวลำภู</h1>
        <img
          src="./img/hero-banner.jpg"
          alt="หนองบัว INSIDER รู้ลึก รู้จริง เรื่องหนองบัวลำภู — LOCAL NEWS • NONG BUA LAMPHU • ISAN REGION"
          width="2000"
          height="667"
          className="mx-auto block aspect-[3/1] w-full max-w-[1600px] object-cover"
        />
      </section>
    )
  }
  // ใส่รูปเองจากหลังบ้าน (รูปไม่มีตัวหนังสือ): วางข้อความทับ
  const heroImg = custom
  return (
    <section className="relative overflow-hidden border-b border-brand/40 bg-black">
      <img src={heroImg} alt="ภูเขาหนองบัวลำภู" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      <div className="relative mx-auto max-w-6xl px-4 py-9 sm:py-16">
        <h1 className="font-display text-[44px] font-bold leading-[1.05] text-brand drop-shadow-[0_2px_12px_rgba(0,0,0,.6)] min-[400px]:text-5xl sm:text-7xl">
          หนองบัว INSIDER
        </h1>
        <p className="mt-1 font-display text-2xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.7)] min-[400px]:text-[27px] sm:mt-2 sm:text-4xl">
          รู้ลึก รู้จริง เรื่องหนองบัวลำภู
        </p>
        <div className="mt-3 h-px w-56 bg-gradient-to-r from-brand to-brand/0 sm:w-80" />
        <div className="mt-3 flex items-center gap-3">
          <MountainOutline className="h-5 w-10 shrink-0 sm:h-6 sm:w-12" />
          <p className="text-[10px] font-medium tracking-wide text-neutral-200 min-[400px]:text-[11px] sm:text-sm">
            LOCAL NEWS • NONG BUA LAMPHU • ISAN REGION
          </p>
        </div>
      </div>
    </section>
  )
}

export function NewsSlider({ items }) {
  const [idx, setIdx] = useState(0)
  const touch = useRef(null)
  const count = items.length

  useEffect(() => { setIdx(0) }, [count])
  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 5000)
    return () => clearInterval(t)
  }, [count, idx])

  if (!count) return null
  const go = (d) => setIdx((i) => (i + d + count) % count)

  return (
    <section aria-roledescription="carousel" aria-label="ข่าวเด่น" className="-mx-4 sm:mx-0">
      <div
        className="relative overflow-hidden bg-ink-800 sm:rounded-2xl"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return
          const dx = e.changedTouches[0].clientX - touch.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          touch.current = null
        }}
      >
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {items.map((n) => (
            <Link key={n.id} to={`/news/${n.id}`} className="relative block aspect-[3/2] w-full shrink-0 sm:aspect-[16/9]">
              <SafeImg src={n.image_url} alt={n.title} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-4 pb-7 sm:px-6 sm:pb-9">
                <span className="inline-block rounded-full bg-brand px-3.5 py-1 text-sm font-semibold text-white shadow-lg">
                  {districtShort(n.district)}
                </span>
                <h2 className="mt-2 line-clamp-3 font-display text-[22px] font-bold leading-snug text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.8)] sm:text-3xl">
                  {n.title}
                </h2>
                <p className="mt-1.5 text-sm text-neutral-300">{n.source} • {timeAgo(n.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
        {/* แถบ indicator */}
        <div className="absolute inset-x-4 bottom-3 flex gap-1.5 sm:inset-x-6">
          {items.map((n, i) => (
            <button
              key={n.id}
              aria-label={`ข่าวที่ ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1 flex-1 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/35 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ช่องโฆษณา: แสดงโฆษณาที่ active ตามตำแหน่ง และนับ views++ ทุกครั้งที่ render
export function AdSlot({ position = 'top', className = '' }) {
  const ads = useCollection('ad_banners').filter((a) => a.active && a.position === position)
  const fbPage = useCollection('fb_posts')[0]?.embed_url || '#'
  const [pickedId] = useState(() => {
    const pool = db.list('ad_banners').filter((a) => a.active && a.position === position)
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null
  })
  const ad = ads.find((a) => a.id === pickedId) || ads[0]

  useEffect(() => {
    if (ad?.id) db.incrementViews(ad.id)
  }, [ad?.id])

  if (!ad) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-700 px-4 py-9 text-center ${className}`}>
        <span className="font-display text-lg font-semibold text-white">พื้นที่โฆษณา</span>
        <a href={fbPage} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand hover:underline">
          ลงโฆษณากับหนองบัว INSIDER ติดต่อทางเพจ ›
        </a>
      </div>
    )
  }

  return (
    <a href={ad.link || '#'} target="_blank" rel="noreferrer sponsored" className={`group relative block overflow-hidden rounded-xl border border-white/10 ${className}`}>
      {ad.image_url ? (
        <SafeImg src={ad.image_url} alt={ad.title} className={`w-full ${position === 'side' ? 'aspect-square' : 'aspect-[16/5]'}`} />
      ) : (
        <div className={`flex w-full items-center justify-center bg-gradient-to-r from-brand/30 to-ink-800 p-6 font-display text-xl font-bold text-white ${position === 'side' ? 'aspect-square' : 'aspect-[16/5]'}`}>
          {ad.title}
        </div>
      )}
      <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-neutral-300">โฆษณา</span>
    </a>
  )
}

export function NewsRow({ n }) {
  return (
    <Link to={`/news/${n.id}`} className="group flex gap-3.5 rounded-xl py-1.5 transition sm:p-2 sm:hover:bg-ink-900">
      <SafeImg src={n.image_url} alt={n.title} className="aspect-[4/3] w-[30%] max-w-[150px] shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <h3 className="line-clamp-2 text-base leading-snug text-neutral-100 group-hover:text-brand sm:text-lg">{n.title}</h3>
        <p className="truncate text-xs text-neutral-500">
          <span className="font-semibold text-brand">{districtShort(n.district)}</span> • {n.source} • {timeAgo(n.created_at)}
        </p>
      </div>
    </Link>
  )
}

export function LatestNews({ items, title = 'ข่าวใหม่ล่าสุด' }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-bold text-white">
        {title} <span aria-hidden="true">⚡</span>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-xl bg-ink-900 p-6 text-center text-sm text-neutral-500">ยังไม่มีข่าวในหมวดนี้</p>
      ) : (
        <div className="space-y-3">
          {items.map((n, i) => (
            <div key={n.id}>
              <NewsRow n={n} />
              {i === 2 && <AdSlot position="feed" className="mt-2.5" />}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function fbEmbedSrc(url) {
  if (!url) return ''
  if (url.includes('/plugins/')) return url
  return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(url)}&tabs=timeline&width=500&height=600&small_header=true&hide_cover=false`
}

export function FbFeed() {
  const posts = useCollection('fb_posts')
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-bold text-white">ข่าวชุมชน <span className="text-brand">•</span> เพจ Facebook</h2>
      {posts.length === 0 && <p className="rounded-xl bg-ink-900 p-6 text-center text-sm text-neutral-500">ยังไม่มีเพจ</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl bg-ink-900">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-semibold text-white">{p.page_name}</span>
              <a href={p.embed_url} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">เปิดเพจ &gt;</a>
            </div>
            <iframe title={p.page_name} src={fbEmbedSrc(p.embed_url)} className="h-[520px] w-full border-0 bg-white" loading="lazy" allow="encrypted-media" />
          </div>
        ))}
      </div>
    </section>
  )
}

const AGENCY_ORDER = ['หน่วยงานจังหวัด', 'ที่ว่าการอำเภอ', 'ตำรวจ', 'กู้ภัย / กู้ชีพ', 'สาธารณสุข', 'การศึกษา', 'ท้องถิ่น', 'ท่องเที่ยว']
const DISTRICT_ORDER = ['เมืองหนองบัวลำภู', 'นากลาง', 'โนนสัง', 'ศรีบุญเรือง', 'สุวรรณคูหา', 'นาวัง']
const COMPACT_LIMIT = 6

export function AgencyList({ compact = false }) {
  const sites = useCollection('agency_sites')
  const groups = sites.reduce((acc, s) => ((acc[s.category || 'อื่นๆ'] ||= []).push(s), acc), {})
  const rank = (c) => {
    if (AGENCY_ORDER.includes(c)) return AGENCY_ORDER.indexOf(c)
    // หมวด 'อปท. อ.xxx' ต่อท้ายหมวดท้องถิ่น เรียงตามอำเภอ
    if (c.startsWith('อปท.')) return AGENCY_ORDER.indexOf('ท้องถิ่น') + 0.1 + DISTRICT_ORDER.findIndex((d) => c.endsWith(d)) / 100
    return c === 'อื่นๆ' ? 999 : 500
  }
  let entries = Object.entries(groups).sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b, 'th'))
  // แถบข้าง: แสดงแค่ 6 รายการแรก + ลิงก์ดูทั้งหมด
  if (compact) {
    let left = COMPACT_LIMIT
    entries = entries.map(([c, l]) => { const take = l.slice(0, Math.max(0, left)); left -= take.length; return [c, take] }).filter(([, l]) => l.length)
  }
  const previews = usePreviews()
  return (
    <section className="min-w-0 rounded-xl bg-ink-900 p-4">
      <h2 className="mb-3 font-display text-lg font-bold text-white">
        หน่วยงานราชการ <span className="text-sm font-normal text-neutral-500">จ.หนองบัวลำภู</span>
      </h2>
      {entries.map(([cat, list]) => (
        <div key={cat} className={compact ? 'mb-3 last:mb-0' : 'mb-5 last:mb-0'}>
          <p className="mb-1.5 text-xs font-semibold text-brand">{cat}</p>
          {compact ? (
            <ul className="space-y-1">
              {list.map((s) => (
                <li key={s.id} className="min-w-0">
                  <a href={s.url} target="_blank" rel="noreferrer" title={s.name} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white">
                    <SiteIcon site={s} p={previewOf(previews, s.url)} className="h-8 w-8" />
                    <span className="truncate">{s.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {list.map((s) => {
                const p = previewOf(previews, s.url)
                return (
                  <li key={s.id} className="min-w-0">
                    <a href={s.url} target="_blank" rel="noreferrer" title={s.name} className="group block overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/5 transition hover:ring-brand/50">
                      <div className="relative aspect-[1.91/1] bg-ink-700">
                        {p?.image ? (
                          <SafeImg src={p.image} alt="" className="absolute inset-0 h-full w-full" />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink-700 to-ink-900">
                            <SiteIcon site={s} p={p} className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="line-clamp-2 text-[13px] leading-snug text-neutral-100 group-hover:text-brand">{s.name}</p>
                        <p className="mt-1 truncate text-[11px] text-neutral-500">{hostOf(s.url)} ↗</p>
                      </div>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ))}
      {compact && sites.length > COMPACT_LIMIT && (
        <Link to="/tab/agency" className="mt-2 block text-sm font-medium text-brand hover:underline">
          ดูทั้งหมด {sites.length} หน่วยงาน ›
        </Link>
      )}
      {sites.length === 0 && <p className="text-sm text-neutral-500">ยังไม่มีข้อมูล</p>}
    </section>
  )
}

// ไอคอนเว็บ: ภาพตัวอย่าง > ไอคอนเว็บ > โลโก้ Facebook > ตัวอักษรแรก
function SiteIcon({ site, p, className = 'h-8 w-8' }) {
  const [broken, setBroken] = useState(false)
  const isFb = /facebook\.com/i.test(site.url)
  const src = !broken && (p?.icon || (isFb ? p?.image : ''))
  if (src) return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className={`${className} shrink-0 rounded-lg bg-white object-cover`} />
  if (isFb) return <span className={`${className} grid shrink-0 place-items-center rounded-lg bg-[#1877f2] font-bold text-white`}>f</span>
  return <span className={`${className} grid shrink-0 place-items-center rounded-lg bg-ink-700 font-display font-bold text-brand`}>{(site.name || '?').replace(/^(สำนักงาน|ที่ว่าการ|อบต\.|เทศบาล(ตำบล|เมือง)?)/, '').trim().charAt(0)}</span>
}

export function Footer() {
  const repo = useCollection('app_config')[0]?.repo_url || GITHUB_URL
  return (
    <footer className="mt-12 border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center">
        <Brand />
        <p className="text-sm text-neutral-400">รู้ลึก รู้จริง เรื่องหนองบัวลำภู</p>
        <p className="text-xs text-neutral-500">เมืองหนองบัวลำภู • นากลาง • โนนสัง • ศรีบุญเรือง • สุวรรณคูหา • นาวัง</p>
        <a href={repo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-brand">
          <Icon.GitHub className="h-4 w-4" /> github.com/suriyaolif10-coder/nongbuainsider
        </a>
        <p className="text-[11px] text-neutral-600">© {new Date().getFullYear()} หนองบัว INSIDER</p>
      </div>
    </footer>
  )
}
