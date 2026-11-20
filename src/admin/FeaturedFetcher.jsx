import { useState } from 'react'
import { db, useCollection, DISTRICTS, timeAgo, districtShort } from '../db.js'
import { SafeImg } from '../components/ui.jsx'

// ดึงข้อมูลตัวอย่างจากลิงก์ (หัวข้อ/ภาพ/คำโปรย) ผ่านบริการ Microlink (รองรับเรียกจากเบราว์เซอร์)
// เบราว์เซอร์ดึงหน้าเว็บอื่นตรงๆ ไม่ได้ (CORS) จึงต้องผ่านบริการนี้
async function unfurl(url) {
  const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.status !== 'success') throw new Error(json?.message || `ดึงข้อมูลไม่ได้ (HTTP ${res.status})`)
  const d = json.data || {}
  return {
    title: (d.title || '').trim(),
    content: (d.description || '').trim(),
    image_url: d.image?.url || d.logo?.url || '',
    source: d.publisher || hostOf(url),
    published: d.date || '',
  }
}
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^(www|m)\./, '') } catch { return '' } }
const guessDistrict = (text) =>
  DISTRICTS.slice(1).find((d) => text.includes(d.name))?.name || (/อ\.เมือง|อำเภอเมือง/.test(text) ? DISTRICTS[0].name : '')

const EMPTY = { link: '', title: '', content: '', image_url: '', source: '', district: '', featured: true }

export default function FeaturedFetcher() {
  const tips = useCollection('insider_tips')
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState({ busy: false, error: '', fetched: false, saved: '' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const featured = tips.filter((t) => t.featured)

  const fetchLink = async (e) => {
    e.preventDefault()
    const url = form.link.trim()
    if (!/^https?:\/\//.test(url)) return setState((s) => ({ ...s, error: 'กรุณาวางลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://' }))
    setState({ busy: true, error: '', fetched: false, saved: '' })
    try {
      const d = await unfurl(url)
      setForm((f) => ({ ...f, ...d, link: url, district: guessDistrict(`${d.title} ${d.content}`) }))
      setState({ busy: false, error: d.title ? '' : 'ไม่พบหัวข้อ กรอกเองได้', fetched: true, saved: '' })
    } catch (err) {
      setForm((f) => ({ ...f, link: url, source: f.source || hostOf(url) }))
      setState({ busy: false, error: `${err.message} — กรอกหัวข้อ/ลิงก์รูปเองได้`, fetched: true, saved: '' })
    }
  }

  const save = () => {
    if (!form.title.trim()) return setState((s) => ({ ...s, error: 'กรุณาใส่หัวข้อข่าว' }))
    const { published, ...data } = form
    db.create('insider_tips', { ...data, title: data.title.trim(), source: data.source || hostOf(data.link) })
    setForm(EMPTY)
    setState({ busy: false, error: '', fetched: false, saved: form.featured ? 'บันทึกแล้ว ข่าวขึ้นสไลด์หน้าแรก' : 'บันทึกแล้ว' })
  }

  return (
    <section className="mb-6 rounded-2xl border border-brand/30 bg-brand/5 p-4 sm:p-5">
      <h2 className="font-display text-lg font-bold text-white">⭐ ดึงข่าวเด่นขึ้นสไลด์</h2>
      <p className="mt-1 text-xs text-neutral-400">วางลิงก์ข่าว (เว็บข่าว หรือโพสต์เพจ Facebook สาธารณะ) ระบบจะดึงหัวข้อ ภาพ และคำโปรยมาให้ ตรวจแล้วกดบันทึก</p>

      <form onSubmit={fetchLink} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input value={form.link} onChange={(e) => set('link', e.target.value)} type="url" inputMode="url" placeholder="https://ลิงก์ข่าว หรือ โพสต์ Facebook" className="input" />
        <button type="submit" disabled={state.busy} className="btn-brand shrink-0 disabled:opacity-60">{state.busy ? 'กำลังดึง...' : 'ดึงข้อมูล'}</button>
      </form>
      {state.error && <p className="mt-2 text-sm text-yellow-400">{state.error}</p>}
      {state.saved && <p className="mt-2 text-sm text-green-400">✓ {state.saved}</p>}

      {state.fetched && (
        <div className="mt-4 grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
          {/* ตัวอย่างการ์ดสไลด์ */}
          <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-ink-800">
            <SafeImg src={form.image_url} alt="" className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">{form.district ? districtShort(form.district) : 'หนองบัวลำภู'}</span>
              <p className="mt-1.5 line-clamp-3 font-display text-base font-bold leading-snug text-white">{form.title || 'หัวข้อข่าว'}</p>
              <p className="mt-0.5 text-[11px] text-neutral-300">{form.source}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <Field label="หัวข้อข่าว *"><input value={form.title} onChange={(e) => set('title', e.target.value)} className="input" /></Field>
            <Field label="ลิงก์รูปภาพ"><input value={form.image_url} onChange={(e) => set('image_url', e.target.value)} className="input" placeholder="https://..." /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="อำเภอ">
                <select value={form.district} onChange={(e) => set('district', e.target.value)} className="input">
                  <option value="">ทั้งจังหวัด</option>
                  {DISTRICTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="แหล่งข่าว"><input value={form.source} onChange={(e) => set('source', e.target.value)} className="input" /></Field>
            </div>
            <Field label="คำโปรย"><textarea rows={2} value={form.content} onChange={(e) => set('content', e.target.value)} className="input" /></Field>
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4 accent-[#ff6a00]" />
              ปักหมุดขึ้นสไลด์ข่าวเด่นหน้าแรก
            </label>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={save} className="btn-brand">บันทึก</button>
              <button type="button" onClick={() => { setForm(EMPTY); setState({ busy: false, error: '', fetched: false, saved: '' }) }} className="btn-ghost">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* ข่าวที่อยู่บนสไลด์ตอนนี้ */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold text-neutral-400">ข่าวบนสไลด์ตอนนี้ ({featured.length})</p>
        {featured.length === 0 && <p className="text-xs text-neutral-600">ยังไม่มีข่าวปักหมุด</p>}
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {featured.map((t) => (
            <div key={t.id} className="w-44 shrink-0 overflow-hidden rounded-lg bg-ink-800">
              <SafeImg src={t.image_url} alt="" className="aspect-video w-full" />
              <div className="p-2">
                <p className="line-clamp-2 text-xs text-neutral-200">{t.title}</p>
                <p className="mt-1 text-[10px] text-neutral-500">{timeAgo(t.created_at)}</p>
                <button onClick={() => db.update('insider_tips', t.id, { featured: false })} className="mt-1 text-[11px] text-red-400 hover:underline">เอาออกจากสไลด์</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-400">{label}</span>
      {children}
    </label>
  )
}
