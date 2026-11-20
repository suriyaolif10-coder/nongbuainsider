import { useEffect, useState } from 'react'
import { SafeImg } from './ui.jsx'
import { timeAgo, districtShort } from '../db.js'

// ข่าวจากมติชน: ไฟล์ data/matichon.json สร้างโดย scripts/fetch-matichon.mjs (GitHub Actions ทุกชั่วโมง)
let cached = null
export function useMatichon() {
  const [data, setData] = useState(cached)
  useEffect(() => {
    if (cached) return
    fetch('./data/matichon.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { cached = d || { items: [] }; setData(cached) })
      .catch(() => setData({ items: [] }))
  }, [])
  return data
}

export default function MatichonNews({ district, localOnly = false, limit = 8 }) {
  const data = useMatichon()
  if (!data) return null
  let items = data.items || []
  if (district) items = items.filter((i) => i.district === district)
  if (localOnly) items = items.filter((i) => i.local)
  items = items.slice(0, limit)
  if (!items.length) return null

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="font-display text-2xl font-bold text-white">
          ข่าวจาก<span className="text-brand">มติชน</span>
        </h2>
        <a href={data.source} target="_blank" rel="noreferrer" className="shrink-0 text-xs text-neutral-400 hover:text-brand">
          matichon.co.th ›
        </a>
      </div>
      <div className="space-y-3">
        {items.map((n) => (
          <a key={n.link} href={n.link} target="_blank" rel="noreferrer" className="group flex gap-3.5 rounded-xl py-1.5 transition sm:p-2 sm:hover:bg-ink-900">
            <SafeImg src={n.image} alt="" className="aspect-[4/3] w-[30%] max-w-[150px] shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <h3 className="line-clamp-2 text-base leading-snug text-neutral-100 group-hover:text-brand sm:text-lg">{n.title}</h3>
              {n.excerpt && <p className="line-clamp-1 text-xs text-neutral-500">{n.excerpt}</p>}
              <p className="truncate text-xs text-neutral-500">
                {n.local && (
                  <span className="mr-1 rounded bg-brand/15 px-1.5 py-0.5 font-semibold text-brand">
                    {n.district ? districtShort(n.district) : 'หนองบัวลำภู'}
                  </span>
                )}
                {n.source} • {timeAgo(n.published_at)} ↗
              </p>
            </div>
          </a>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-neutral-600">
        หัวข้อข่าวจากมติชนออนไลน์ อัปเดตอัตโนมัติทุกชั่วโมง กดเพื่ออ่านฉบับเต็มที่เว็บไซต์ต้นทาง
      </p>
    </section>
  )
}
