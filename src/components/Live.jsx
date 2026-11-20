import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SafeImg } from './ui.jsx'
import { timeAgo, districtShort } from '../db.js'
import { addView, getViews, aiRandomHeadline, seeded, currentMonthLabel } from '../lib/news.js'
import { useAppState } from '../state.jsx'

const tagOf = (n) => (n.district ? districtShort(n.district) : 'หนองบัวลำภู')

// พาดหัวที่แสดง: ปกติ = หัวข้อจริง / โหมด AI สุ่ม = เติมคำนำ/อีโมจิ (ไม่แก้ข้อมูลจริง)
export function useHeadline() {
  const { aiMode } = useAppState()
  return (n, salt = '') => (aiMode ? aiRandomHeadline(n.title, n.district, seeded(n.id + salt)) : n.title)
}

// เปิดข่าว: นับวิว แล้วไปหน้าอ่านข่าว / หน้าต้นทาง
export function useOpenNews() {
  const navigate = useNavigate()
  return (n) => {
    addView(n)
    if (n.href) window.open(n.href, '_blank', 'noopener')
    else navigate(`/news/${n.id}`)
  }
}

// ---------- แถบข่าววิ่ง (Breaking ticker) ----------
export function Ticker({ items }) {
  const open = useOpenNews()
  const headline = useHeadline()
  if (!items.length) return null
  const loop = [...items, ...items] // วนต่อเนื่อง
  return (
    <div className="flex items-stretch overflow-hidden border-b border-white/10 bg-black" role="region" aria-label="ข่าววิ่ง">
      <div className="z-10 flex shrink-0 items-center gap-2 bg-black py-2 pl-4 pr-3 shadow-[8px_0_12px_#000]">
        <span className="flex items-center gap-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
        </span>
        <span className="animate-blink font-display text-sm font-bold text-brand">พาดหัวข่าว</span>
      </div>
      <div className="group relative flex-1 overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap py-2 group-hover:[animation-play-state:paused]">
          {loop.map((n, i) => (
            <button key={n.id + i} onClick={() => open(n)} className="text-sm text-neutral-200 hover:text-brand">
              <span className="mr-2 text-brand">●</span>{headline(n, 'ticker')}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- พาดหัวข่าว LIVE (ยอดนิยม 5 อันดับ สลับทุก 5 วินาที) ----------
export function MainHeadline({ items, ext }) {
  const [idx, setIdx] = useState(0)
  const touch = useRef(null)
  const open = useOpenNews()
  const headline = useHeadline()
  const count = items.length
  useEffect(() => { setIdx(0) }, [count])
  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 5000)
    return () => clearInterval(t)
  }, [count, idx])
  if (!count) return null
  const n = items[Math.min(idx, count - 1)]
  const go = (d) => setIdx((i) => (i + d + count) % count)

  return (
    <section
      aria-roledescription="carousel"
      aria-label="พาดหัวข่าวยอดนิยม"
      className="relative -mx-4 overflow-hidden bg-ink-900 sm:mx-0 sm:rounded-2xl"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <SafeImg key={n.id} src={n.image_url} alt="" className="absolute inset-0 h-full w-full animate-fadein" />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative flex min-h-[340px] flex-col justify-end p-5 pb-10 sm:min-h-[420px] sm:p-8 sm:pb-12">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">🔥 ยอดนิยม</span>
          <span className="rounded-full border border-brand/70 bg-brand/20 px-3 py-1 text-xs font-semibold text-brand">{tagOf(n)}</span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE</span>
        </div>
        <h2 className="mt-3 line-clamp-4 font-display text-[32px] font-bold leading-tight text-white [text-shadow:0_3px_12px_rgba(0,0,0,.85)] sm:text-[48px]">
          {headline(n, 'main')}
        </h2>
        <p className="mt-3 text-sm text-neutral-300">
          {n.source} • {timeAgo(n.created_at)} • 👁 {getViews(n, ext).toLocaleString('th-TH')} วิว
        </p>
        <div className="mt-4">
          <button onClick={() => open(n)} className="btn-brand px-5 py-2.5">อ่านต่อ {n.href ? '↗' : '→'}</button>
        </div>
      </div>
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {items.map((x, i) => (
            <button key={x.id} aria-label={`พาดหัวที่ ${i + 1}`} onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-brand' : 'w-2 bg-white/40'}`} />
          ))}
        </div>
      )}
    </section>
  )
}

// ---------- ข่าวเด่น: การ์ดใหญ่ 1 + grid การ์ดเล็ก ----------
export function FeaturedNews({ items, onShuffle }) {
  const open = useOpenNews()
  const headline = useHeadline()
  if (!items.length) return null
  const [lead, ...rest] = items
  return (
    <section aria-label="ข่าวเด่น">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-white"><span className="h-6 w-1.5 rounded-full bg-brand" />ข่าวเด่น</h2>
        {onShuffle && <button onClick={onShuffle} className="rounded-full bg-ink-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-brand hover:text-white">🔀 สุ่มใหม่</button>}
      </div>
      <button onClick={() => open(lead)} className="group relative block h-[380px] w-full overflow-hidden rounded-2xl bg-ink-800 text-left sm:h-[480px]">
        <SafeImg src={lead.image_url} alt="" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">{tagOf(lead)}</span>
          <h3 className="mt-3 line-clamp-3 font-display text-2xl font-bold leading-snug text-white [text-shadow:0_2px_8px_rgba(0,0,0,.7)] sm:text-[32px] sm:leading-tight">{headline(lead, 'lead')}</h3>
          <p className="mt-2 text-xs text-neutral-300">{lead.source} • {timeAgo(lead.created_at)}{lead.href && ' ↗'}</p>
        </div>
      </button>
      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rest.map((n) => (
            <button key={n.id} onClick={() => open(n)} className="group overflow-hidden rounded-2xl bg-ink-900 text-left ring-1 ring-white/5 transition hover:ring-brand/40">
              <SafeImg src={n.image_url} alt="" className="h-[180px] w-full transition duration-500 group-hover:scale-105" />
              <div className="p-3.5">
                <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-white">{tagOf(n)}</span>
                <h4 className="mt-2 line-clamp-2 text-base font-medium leading-snug text-neutral-100 group-hover:text-brand">{headline(n, 'card')}</h4>
                <p className="mt-1.5 truncate text-xs text-neutral-500">{n.source} • {timeAgo(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

// ---------- แถบเดือนปัจจุบัน ----------
export function MonthBar({ count }) {
  const { showAll, setShowAll } = useAppState()
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 text-sm">
      <span className="min-w-0 truncate text-neutral-300">
        {showAll ? <>แสดง<b className="text-white">ข่าวทั้งหมด</b></> : <>แสดงข่าวเดือน <b className="text-white">{currentMonthLabel()}</b></>} • <b className="text-brand">{count}</b> ข่าว
      </span>
      <button onClick={() => setShowAll(!showAll)} className="shrink-0 rounded-full border border-brand/60 px-3 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-white">
        {showAll ? 'เฉพาะเดือนนี้' : 'ดูทั้งหมด'}
      </button>
    </div>
  )
}

export function EmptyMonth() {
  const { setShowAll } = useAppState()
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
      <p className="text-neutral-400">ยังไม่มีข่าวเดือนนี้</p>
      <button onClick={() => setShowAll(true)} className="mt-3 text-sm font-semibold text-brand hover:underline">กดดูทั้งหมด ›</button>
    </div>
  )
}
