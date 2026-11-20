import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, useNavigate, useParams } from 'react-router-dom'
import { Brand, Icon } from '../components/ui.jsx'
import CrudTable from './CrudTable.jsx'
import FeaturedFetcher from './FeaturedFetcher.jsx'
import { auth, db, useAuth, useCollection, remoteError, IS_REMOTE, DISTRICTS, AD_POSITIONS, AD_PRICES, GITHUB_URL } from '../db.js'

const SECTIONS = [
  { key: 'tips', label: 'จัดการข่าว', icon: '📰', col: 'insider_tips' },
  { key: 'agencies', label: 'จัดการหน่วยงาน', icon: '🏛️', col: 'agency_sites' },
  { key: 'fb', label: 'จัดการเพจ Facebook', icon: '📘', col: 'fb_posts' },
  { key: 'ads', label: 'จัดการโฆษณา', icon: '📢', col: 'ad_banners' },
  { key: 'settings', label: 'ตั้งค่าระบบ', icon: '⚙️', col: 'app_config' },
]

const FIELDS = {
  insider_tips: [
    { key: 'title', label: 'หัวข้อข่าว', required: true },
    { key: 'district', label: 'อำเภอ (เว้นว่าง = ทั้งจังหวัด)', type: 'select', options: DISTRICTS.map((d) => d.name) },
    { key: 'image_url', label: 'ลิงก์รูปภาพ', placeholder: 'https://...' },
    { key: 'link', label: 'ลิงก์ข่าวต้นทาง (ถ้ามี กดข่าวแล้วเปิดหน้านี้)', type: 'url', list: false },
    { key: 'content', label: 'เนื้อหา', type: 'textarea', list: false },
    { key: 'source', label: 'แหล่งข่าว', default: 'หนองบัว INSIDER' },
    { key: 'featured', label: 'ปักหมุดข่าวเด่น (สไลด์)', type: 'boolean', default: false },
  ],
  agency_sites: [
    { key: 'name', label: 'ชื่อหน่วยงาน', required: true },
    { key: 'url', label: 'URL', type: 'url', required: true },
    { key: 'category', label: 'หมวดหมู่', placeholder: 'ราชการ / ท่องเที่ยว / สาธารณสุข' },
  ],
  fb_posts: [
    { key: 'page_name', label: 'ชื่อเพจ', required: true },
    { key: 'embed_url', label: 'ลิงก์เพจ / Embed URL', type: 'url', required: true },
  ],
  ad_banners: [
    { key: 'title', label: 'ชื่อโฆษณา', required: true },
    { key: 'image_url', label: 'ลิงก์รูปแบนเนอร์' },
    { key: 'link', label: 'ลิงก์ปลายทาง', type: 'url', list: false },
    { key: 'position', label: 'ตำแหน่ง', type: 'select', options: AD_POSITIONS, required: true, default: 'top' },
    { key: 'price', label: 'ราคา (บาท)', type: 'select', options: AD_PRICES.map(String), numeric: true, required: true, default: '300' },
    { key: 'active', label: 'เปิดใช้งาน', type: 'boolean', default: true },
    { key: 'views', label: 'ยอดวิว', type: 'number', default: 0 },
    { key: 'owner', label: 'เจ้าของ' },
  ],
}

const baht = (n) => '฿' + Number(n || 0).toLocaleString('th-TH')

export default function Dashboard() {
  const { section = 'tips' } = useParams()
  const navigate = useNavigate()
  const [sideOpen, setSideOpen] = useState(false)

  const { ready, loggedIn } = useAuth()

  if (!ready) return <div className="grid min-h-screen place-items-center bg-black text-sm text-neutral-500">กำลังโหลด...</div>
  if (!loggedIn) return <Navigate to="/admin/login" replace />
  const current = SECTIONS.find((s) => s.key === section) || SECTIONS[0]

  const logout = async () => { await auth.logout(); navigate('/admin/login', { replace: true }) }

  return (
    <div className="min-h-screen bg-black text-neutral-200 lg:flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-ink-950 transition lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center border-b border-white/10 px-4"><Brand /></div>
        <p className="px-4 pt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">หลังบ้าน</p>
        <nav className="space-y-1 p-3">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.key}
              to={`/admin/${s.key}`}
              onClick={() => setSideOpen(false)}
              className={() => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${current.key === s.key ? 'bg-brand text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span aria-hidden="true">{s.icon}</span> {s.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 space-y-2 border-t border-white/10 p-3">
          <Link to="/" className="block rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-white/5 hover:text-white">🌐 ดูหน้าเว็บไซต์</Link>
          <button onClick={logout} className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10">⎋ ออกจากระบบ</button>
        </div>
      </aside>
      {sideOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* Main */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/10 bg-black/95 px-4 backdrop-blur">
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={() => setSideOpen(true)} aria-label="เปิดเมนู">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <h1 className="font-display text-lg font-bold text-white">Dashboard</h1>
          <span className={`hidden rounded-full px-2 py-0.5 text-[11px] sm:inline ${IS_REMOTE ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
            {IS_REMOTE ? '● ออนไลน์ (Supabase)' : '● โหมดเดโม (เก็บในเครื่องนี้)'}
          </span>
          <button onClick={logout} className="btn-ghost ml-auto px-3 py-1.5 text-xs">Logout</button>
        </header>

        <main className="space-y-6 p-4 sm:p-6">
          {remoteError.message && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              บันทึก/โหลดข้อมูลไม่สำเร็จ: {remoteError.message}
            </div>
          )}
          <Stats />
          <div className="rounded-2xl border border-white/10 bg-ink-950 p-4 sm:p-5">
            {current.key === 'settings' ? (
              <Settings />
            ) : (
              <>
              {current.key === 'tips' && <FeaturedFetcher />}
              <CrudTable
                key={current.col}
                collection={current.col}
                title={current.label}
                fields={FIELDS[current.col]}
                renderCell={current.col === 'ad_banners' ? adCell : undefined}
              />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function adCell(f, r) {
  if (f.key === 'price') return baht(r.price)
  if (f.key === 'active') {
    return (
      <button
        onClick={() => db.update('ad_banners', r.id, { active: !r.active })}
        className={`rounded-full px-2 py-0.5 text-xs ${r.active ? 'bg-green-500/15 text-green-400' : 'bg-neutral-700/50 text-neutral-400'}`}
      >{r.active ? 'เปิด' : 'ปิด'}</button>
    )
  }
  return undefined
}

function Stats() {
  const ads = useCollection('ad_banners')
  const tips = useCollection('insider_tips')
  const totalViews = ads.reduce((s, a) => s + (Number(a.views) || 0), 0)
  const totalRevenue = ads.reduce((s, a) => s + (Number(a.views) || 0) * (Number(a.price) || 0), 0)
  const activeAds = ads.filter((a) => a.active).length
  const cards = [
    { label: 'ยอดวิวโฆษณารวม', value: totalViews.toLocaleString('th-TH'), sub: 'Total views' },
    { label: 'รายได้รวม', value: baht(totalRevenue), sub: 'views × price', accent: true },
    { label: 'โฆษณาที่เปิดอยู่', value: activeAds, sub: `จากทั้งหมด ${ads.length}` },
    { label: 'ข่าวทั้งหมด', value: tips.length, sub: 'insider_tips' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-2xl border p-4 ${c.accent ? 'border-brand/40 bg-brand/10' : 'border-white/10 bg-ink-900'}`}>
          <p className="text-xs text-neutral-400">{c.label}</p>
          <p className={`mt-1 truncate font-display text-2xl font-bold ${c.accent ? 'text-brand' : 'text-white'}`}>{c.value}</p>
          <p className="text-[11px] text-neutral-500">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}

function Settings() {
  useCollection('app_config')
  const cfg = db.config()
  const pick = (c) => ({ promptpay_number: c.promptpay_number || '', repo_url: c.repo_url || GITHUB_URL, hero_image_url: c.hero_image_url || '' })
  const [form, setForm] = useState(() => pick(cfg))
  const [saved, setSaved] = useState(false)
  const [touched, setTouched] = useState(false)
  // โหมด Supabase: เติมค่าจากฐานข้อมูลเมื่อโหลดเสร็จ (ถ้ายังไม่ได้แก้ฟอร์ม)
  useEffect(() => {
    if (!touched) setForm(pick(cfg))
  }, [cfg.promptpay_number, cfg.repo_url, cfg.hero_image_url]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault()
    db.saveConfig(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <h2 className="font-display text-xl font-bold text-white">ตั้งค่าระบบ</h2>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">เบอร์ / เลข PromptPay <span className="text-neutral-600">(promptpay_number)</span></label>
        <input
          value={form.promptpay_number}
          onChange={(e) => setTouched(true) || setForm({ ...form, promptpay_number: e.target.value.replace(/[^\d-]/g, '') })}
          inputMode="numeric"
          placeholder="08x-xxx-xxxx หรือเลขบัตรประชาชน"
          className="input"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">รูปพื้นหลัง Hero <span className="text-neutral-600">(hero_image_url)</span></label>
        <input
          type="url"
          value={form.hero_image_url}
          onChange={(e) => setTouched(true) || setForm({ ...form, hero_image_url: e.target.value })}
          placeholder="เว้นว่าง = ใช้แบนเนอร์โลโก้หนองบัว INSIDER (ถ้าใส่ ควรเป็นรูปไม่มีตัวหนังสือ)"
          className="input"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">GitHub Repository <span className="text-neutral-600">(repo_url)</span></label>
        <input type="url" value={form.repo_url} onChange={(e) => setTouched(true) || setForm({ ...form, repo_url: e.target.value })} className="input" />
        <a href={form.repo_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-brand">
          <Icon.GitHub className="h-4 w-4" /> เปิด repository
        </a>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-brand">บันทึกการตั้งค่า</button>
        {saved && <span className="text-sm text-green-400">✓ บันทึกแล้ว</span>}
      </div>
      {!IS_REMOTE && (
        <div className="border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => confirm('รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น?') && db.resetLocal()}
            className="text-xs text-red-400 hover:underline"
          >รีเซ็ตข้อมูลตัวอย่าง</button>
        </div>
      )}
    </form>
  )
}
