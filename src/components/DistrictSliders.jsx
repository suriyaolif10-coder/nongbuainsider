import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { SafeImg, Icon } from './ui.jsx'
import { useMatichon } from './Matichon.jsx'
import { DISTRICTS, timeAgo } from '../db.js'

// ข่าวแต่ละอำเภอ: แถวสไลด์ (ปัดซ้าย-ขวา) อำเภอละ 1 แถว
// รวมข่าวจากหลังบ้าน (insider_tips) + ข่าวมติชนที่ระบุอำเภอ
export default function DistrictSliders({ tips }) {
  const matichon = useMatichon()
  const rows = DISTRICTS.map((d) => {
    const own = tips
      .filter((t) => t.district === d.name)
      .map((t) => ({ key: 'i' + t.id, to: `/news/${t.id}`, title: t.title, image: t.image_url, source: t.source, at: t.created_at }))
    const ext = (matichon?.items || [])
      .filter((m) => m.district === d.name)
      .map((m) => ({ key: m.link, href: m.link, title: m.title, image: m.image, source: m.source, at: m.published_at }))
    const items = [...own, ...ext].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).slice(0, 10)
    return { d, items }
  }).filter((r) => r.items.length)

  if (!rows.length) return null
  return (
    <section className="space-y-7">
      <h2 className="font-display text-2xl font-bold text-white">ข่าวแต่ละอำเภอ</h2>
      {rows.map((r) => <Row key={r.d.name} {...r} />)}
    </section>
  )
}

function Row({ d, items }) {
  const ref = useRef(null)
  const scroll = (dir) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-brand" />
        <h3 className="font-display text-lg font-bold text-white">อ.{d.name}</h3>
        <span className="text-xs text-neutral-500">{items.length} ข่าว</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => scroll(-1)} aria-label={`เลื่อนข่าว อ.${d.name} ไปทางซ้าย`} className="hidden h-8 w-8 place-items-center rounded-full bg-ink-800 text-neutral-300 hover:bg-ink-700 hover:text-white sm:grid">
            <Icon.Chevron className="h-4 w-4 rotate-90" />
          </button>
          <button onClick={() => scroll(1)} aria-label={`เลื่อนข่าว อ.${d.name} ไปทางขวา`} className="hidden h-8 w-8 place-items-center rounded-full bg-ink-800 text-neutral-300 hover:bg-ink-700 hover:text-white sm:grid">
            <Icon.Chevron className="h-4 w-4 -rotate-90" />
          </button>
          <Link to={`/tab/${encodeURIComponent(d.name)}`} className="ml-1 text-sm font-medium text-brand hover:underline">ดูทั้งหมด ›</Link>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {items.map((n) => {
          const body = (
            <>
              <div className="relative">
                <SafeImg src={n.image} alt="" className="aspect-[16/10] w-full rounded-xl" />
                {n.href && <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-neutral-200">มติชน ↗</span>}
              </div>
              <h4 className="mt-2 line-clamp-2 text-[15px] leading-snug text-neutral-100 group-hover:text-brand">{n.title}</h4>
              <p className="mt-1 truncate text-xs text-neutral-500">{n.source} • {timeAgo(n.at)}</p>
            </>
          )
          const cls = 'group block w-[72%] shrink-0 snap-start sm:w-[calc((100%-24px)/3)]'
          return n.href
            ? <a key={n.key} href={n.href} target="_blank" rel="noreferrer" className={cls}>{body}</a>
            : <Link key={n.key} to={n.to} className={cls}>{body}</Link>
        })}
      </div>
    </div>
  )
}
