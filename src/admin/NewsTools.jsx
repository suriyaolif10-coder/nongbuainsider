import { useState } from 'react'
import { db, useCollection } from '../db.js'
import { aiRandomHeadline, filterCurrentMonth, currentMonthLabel } from '../lib/news.js'
import { fetchOg } from '../lib/actions.js'

// ปุ่มข้างช่องหัวข้อ: สุ่มพาดหัวแบบ AI (กดซ้ำได้จนพอใจ)
export function AiTitleButton({ form, set }) {
  return (
    <button type="button" onClick={() => set('title', aiRandomHeadline(form.title, form.district))} disabled={!form.title}
      className="rounded-full border border-brand/50 px-3 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-40">
      🤖 AI พาดหัวสุ่ม
    </button>
  )
}

// ปุ่มข้างช่องรูป: ดึง og:image จากลิงก์ข่าวต้นทาง ผ่าน fetch('actions')
export function FetchImageButton({ form, set }) {
  const [state, setState] = useState('')
  const run = async () => {
    const url = (form.link || '').trim()
    if (!/^https?:\/\//.test(url)) return setState('ใส่ "ลิงก์ข่าวต้นทาง" ก่อน')
    setState('กำลังดึง...')
    try {
      const og = await fetchOg(url)
      if (og.image_url) set('image_url', og.image_url)
      if (!form.title && og.title) set('title', og.title)
      if (!form.content && og.content) set('content', og.content)
      if (og.source && (!form.source || form.source === 'หนองบัว INSIDER')) set('source', og.source)
      setState(og.image_url ? '✓ ได้ภาพแล้ว' : 'ไม่พบภาพในหน้านั้น')
    } catch (e) { setState(e.message) }
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={run} className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-neutral-200 hover:border-brand hover:text-brand">🔍 ดึงภาพ</button>
      {state && <span className="text-xs text-neutral-400">{state}</span>}
    </span>
  )
}

// ปุ่มทำทีละหลายข่าว
export function NewsBatchTools() {
  const tips = useCollection('insider_tips')
  const [msg, setMsg] = useState('')
  const month = filterCurrentMonth(tips)

  const aiAll = () => {
    if (!month.length) return setMsg('ไม่มีข่าวเดือนนี้')
    if (!confirm(`สุ่มพาดหัวใหม่ให้ข่าวเดือน ${currentMonthLabel()} ทั้งหมด ${month.length} ข่าว?\n(หัวข้อจริงจะถูกแทนที่ — พาดหัวอย่าง "ด่วน!" ควรใช้กับข่าวที่ด่วนจริงเท่านั้น)`)) return
    month.forEach((t) => db.update('insider_tips', t.id, { title: aiRandomHeadline(t.title, t.district) }))
    setMsg(`✓ สุ่มพาดหัวแล้ว ${month.length} ข่าว`)
  }
  const fillImages = async () => {
    const need = tips.filter((t) => !t.image_url && /^https?:\/\//.test(t.link || ''))
    if (!need.length) return setMsg('ไม่มีข่าวที่ขาดภาพ (ต้องมีลิงก์ข่าวต้นทาง)')
    let ok = 0, fail = ''
    setMsg(`กำลังเติมภาพ 0/${need.length}...`)
    for (const [i, t] of need.entries()) {
      try { const og = await fetchOg(t.link); if (og.image_url) { db.update('insider_tips', t.id, { image_url: og.image_url }); ok++ } }
      catch (e) { fail = e.message; if (/ยังไม่ได้ติดตั้ง/.test(e.message)) break }
      setMsg(`กำลังเติมภาพ ${i + 1}/${need.length}...`)
    }
    setMsg(`✓ เติมภาพได้ ${ok}/${need.length} ข่าว${fail ? ` — ${fail}` : ''}`)
  }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button onClick={aiAll} className="btn-ghost px-3 py-1.5 text-xs">🎲 AI สุ่มพาดหัวทั้งเดือน</button>
      <button onClick={fillImages} className="btn-ghost px-3 py-1.5 text-xs">🖼️ เติมภาพที่ขาด</button>
      {msg && <span className="text-xs text-neutral-400">{msg}</span>}
    </div>
  )
}
