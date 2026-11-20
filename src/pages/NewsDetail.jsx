import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { AdSlot, Footer, NewsRow } from '../components/Sections.jsx'
import { SafeImg } from '../components/ui.jsx'
import { db, useCollection, timeAgo, districtShort } from '../db.js'

export default function NewsDetail() {
  const { id } = useParams()
  const tips = useCollection('insider_tips')
  const n = tips.find((t) => t.id === id)
  const related = tips.filter((t) => t.id !== id && t.district === n?.district).slice(0, 4)
  // views++ ครั้งเดียวต่อการเปิดข่าว (กดจากหน้าแรกนับไปแล้ว จึงนับเฉพาะเข้าลิงก์ตรง)
  const counted = useRef(false)
  useEffect(() => {
    if (!n || counted.current) return
    counted.current = true
    const k = 'nongbua_viewed_' + n.id
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1') } catch { /* */ }
    db.update('insider_tips', n.id, { views: (Number(n.views) || 0) + 1 })
  }, [n])

  return (
    <div className="min-h-screen bg-ink-950">
      <Header activeTab={n?.district} />
      <main className="mx-auto max-w-3xl px-4 pt-5">
        {!n ? (
          <div className="py-20 text-center text-neutral-400">
            ไม่พบข่าวนี้ <Link to="/" className="text-brand">กลับหน้าแรก</Link>
          </div>
        ) : (
          <article>
            <SafeImg src={n.image_url} alt={n.title} className="aspect-[16/9] w-full rounded-2xl" />
            <span className="mt-4 inline-block rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white">{districtShort(n.district)}</span>
            <h1 className="mt-3 font-display text-2xl font-bold leading-snug text-white sm:text-3xl">{n.title}</h1>
            <p className="mt-2 text-xs text-neutral-500">{n.source} • {timeAgo(n.created_at)} • 👁 {(Number(n.views) || 0).toLocaleString('th-TH')} วิว</p>
            <div className="mt-5 whitespace-pre-line text-base leading-relaxed text-neutral-200">{n.content}</div>
            <AdSlot position="feed" className="my-8" />
            {related.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-lg font-bold text-white">ข่าวอื่นใน อ.{n.district}</h2>
                <div className="space-y-2.5">{related.map((r) => <NewsRow key={r.id} n={r} />)}</div>
              </section>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}
