import { useState } from 'react'
import { db, useCollection } from '../db.js'
import { SafeImg } from '../components/ui.jsx'

// fields: [{ key, label, type: text|textarea|url|select|number|boolean, options, required, list, default }]
export default function CrudTable({ collection, fields, title, renderCell }) {
  const rows = useCollection(collection)
  const [editing, setEditing] = useState(null) // null | 'new' | row
  const [q, setQ] = useState('')

  const shown = rows.filter((r) => !q || fields.some((f) => String(r[f.key] ?? '').toLowerCase().includes(q.toLowerCase())))
  const listFields = fields.filter((f) => f.list !== false)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-neutral-400">{rows.length} รายการ</span>
        <div className="ml-auto flex w-full gap-2 sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา..." className="input sm:w-56" />
          <button className="btn-brand shrink-0" onClick={() => setEditing('new')}>+ เพิ่ม</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-ink-800 text-xs uppercase text-neutral-400">
            <tr>
              {listFields.map((f) => <th key={f.key} className="px-3 py-2.5 font-medium">{f.label}</th>)}
              <th className="px-3 py-2.5 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {shown.map((r) => (
              <tr key={r.id} className="bg-ink-900 hover:bg-ink-800/60">
                {listFields.map((f) => (
                  <td key={f.key} className="max-w-[260px] px-3 py-2.5 align-middle text-neutral-200">
                    {renderCell?.(f, r) ?? <Cell f={f} v={r[f.key]} />}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <button onClick={() => setEditing(r)} className="rounded-md px-2 py-1 text-brand hover:bg-brand/10">แก้ไข</button>
                  <button
                    onClick={() => confirm('ยืนยันการลบรายการนี้?') && db.remove(collection, r.id)}
                    className="rounded-md px-2 py-1 text-red-400 hover:bg-red-500/10"
                  >ลบ</button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={listFields.length + 1} className="bg-ink-900 px-3 py-8 text-center text-neutral-500">ไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal
          fields={fields}
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing === 'new') db.create(collection, data)
            else db.update(collection, editing.id, data)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

// ISO -> ค่า input datetime-local (เวลาท้องถิ่น)
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function Cell({ f, v }) {
  if (f.type === 'boolean') {
    return <span className={`rounded-full px-2 py-0.5 text-xs ${v ? 'bg-green-500/15 text-green-400' : 'bg-neutral-700/50 text-neutral-400'}`}>{v ? 'เปิด' : 'ปิด'}</span>
  }
  if (f.key === 'image_url') return <SafeImg src={v} className="h-10 w-16 rounded" />
  if (f.type === 'url') return v ? <a href={v} target="_blank" rel="noreferrer" className="block truncate text-sky-400 hover:underline">{v}</a> : '-'
  if (f.type === 'number') return Number(v || 0).toLocaleString('th-TH')
  if (f.type === 'datetime') return v ? new Date(v).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'
  return <span className="line-clamp-2">{v || '-'}</span>
}

function EditModal({ fields, initial, onClose, onSave }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, initial?.[f.key] ?? f.default ?? (f.type === 'boolean' ? false : '')])),
  )
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    const data = { ...form }
    fields.forEach((f) => {
      if (f.type === 'number' || f.numeric) data[f.key] = Number(data[f.key]) || 0
    })
    onSave(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900 p-5 sm:rounded-2xl"
      >
        <h3 className="mb-4 font-display text-lg font-bold text-white">{initial ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h3>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs font-medium text-neutral-400">
                {f.label} <span className="text-neutral-600">({f.key})</span>{f.required && <span className="text-brand"> *</span>}
              </label>
              {f.type === 'datetime' ? (
                <input
                  type="datetime-local"
                  value={toLocalInput(form[f.key])}
                  onChange={(e) => set(f.key, e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="input"
                />
              ) : f.type === 'textarea' ? (
                <textarea rows={5} required={f.required} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className="input" />
              ) : f.type === 'select' ? (
                <select required={f.required} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className="input">
                  <option value="">-- เลือก --</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'boolean' ? (
                <button
                  type="button"
                  onClick={() => set(f.key, !form[f.key])}
                  className={`relative h-6 w-11 rounded-full transition ${form[f.key] ? 'bg-brand' : 'bg-ink-600'}`}
                  aria-pressed={form[f.key]}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${form[f.key] ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'}
                  required={f.required}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="input"
                  placeholder={f.placeholder}
                />
              )}
              {f.addon && <div className="mt-1.5">{f.addon(form, set)}</div>}
              {f.key === 'image_url' && form.image_url && <SafeImg src={form.image_url} className="mt-2 aspect-video w-full rounded-lg" />}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">ยกเลิก</button>
          <button type="submit" className="btn-brand">บันทึก</button>
        </div>
      </form>
    </div>
  )
}
