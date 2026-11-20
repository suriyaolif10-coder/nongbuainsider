import { SafeImg } from './ui.jsx'
import { NewsLink } from './Sections.jsx'
import { timeAgo, districtShort } from '../db.js'

const tag = (n) => (n.district ? districtShort(n.district) : 'หนองบัวลำภู')

// ข่าวเด่น TOP แบบหน้าแรกเว็บข่าว: ข่าวใหญ่ 1 ข่าว + ข่าวรอง
export default function TopStories({ items, onShuffle }) {
  if (!items.length) return null
  const [lead, ...rest] = items
  const side = rest.slice(0, 2)
  const bottom = rest.slice(2, 6)
  return (
    <section aria-label="ข่าวเด่น" className="-mx-4 sm:mx-0">
      <div className="mb-3 flex items-center justify-between px-4 sm:px-0">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
          <span className="h-6 w-1.5 rounded-full bg-brand" /> ข่าวเด่น
        </h2>
        {onShuffle && <button onClick={onShuffle} className="rounded-full bg-ink-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-brand hover:text-white">🔀 สุ่มใหม่</button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* ข่าวใหญ่ */}
        <NewsLink n={lead} className="group relative block overflow-hidden bg-ink-800 sm:col-span-2 sm:row-span-2 sm:rounded-2xl">
          <SafeImg src={lead.image_url} alt={lead.title} className="aspect-[16/10] w-full transition duration-500 group-hover:scale-105 sm:h-full sm:min-h-[340px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">{tag(lead)}</span>
            <h3 className="mt-2 line-clamp-3 font-display text-[22px] font-bold leading-snug text-white drop-shadow sm:text-3xl">{lead.title}</h3>
            <p className="mt-1.5 text-xs text-neutral-300">{lead.source} • {timeAgo(lead.created_at)}{lead.href && ' ↗'}</p>
          </div>
        </NewsLink>
        {/* ข่าวรองข้างข่าวใหญ่ (คอม) / ใต้ข่าวใหญ่ (มือถือ) */}
        {side.map((n) => <Card key={n.id} n={n} className="hidden sm:block" />)}
      </div>

      {/* ข่าวรอง: มือถือ 2 คอลัมน์ รวมข่าวข้าง */}
      <div className="mt-3 grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-0">
        {side.map((n) => <Card key={n.id} n={n} className="sm:hidden" />)}
        {bottom.map((n) => <Card key={n.id} n={n} />)}
      </div>
    </section>
  )
}

function Card({ n, className = '' }) {
  return (
    <NewsLink n={n} className={`group block min-w-0 ${className}`}>
      <div className="relative overflow-hidden rounded-xl bg-ink-800">
        <SafeImg src={n.image_url} alt="" className="aspect-[16/10] w-full transition duration-500 group-hover:scale-105" />
        <span className="absolute left-2 top-2 rounded-full bg-brand/90 px-2 py-0.5 text-[10px] font-semibold text-white">{tag(n)}</span>
      </div>
      <h4 className="mt-2 line-clamp-3 text-sm font-medium leading-snug text-neutral-100 group-hover:text-brand">{n.title}</h4>
      <p className="mt-1 truncate text-[11px] text-neutral-500">{n.source} • {timeAgo(n.created_at)}</p>
    </NewsLink>
  )
}
