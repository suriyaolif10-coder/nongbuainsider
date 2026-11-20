import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './ui.jsx'
import { useAppState } from '../state.jsx'
import logoMark from '../assets/logo-mark.png'
import { DISTRICTS, GITHUB_URL } from '../db.js'

export const TABS = [
  { key: 'top', label: 'TOP' },
  { key: 'community', label: 'ข่าวชุมชน' },
  { key: 'nongbua', label: 'ข่าวหนองบัว' },
  ...DISTRICTS.map((d) => ({ key: d.name, label: d.short })),
]

// แท็บที่มีข่าวใหม่ใน 24 ชม. แสดงจุดส้ม
export default function Header({ activeTab = 'top', search, onSearch, newTabs = [], searchOpen: searchOpenProp, onSearchOpen }) {
  const { aiMode, setAiMode } = useAppState()
  const [searchOpenState, setSearchOpenState] = useState(false)
  const searchOpen = searchOpenProp ?? searchOpenState
  const setSearchOpen = (v) => { const next = typeof v === 'function' ? v(searchOpen) : v; onSearchOpen ? onSearchOpen(next) : setSearchOpenState(next) }
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (searchOpen) inputRef.current?.focus() }, [searchOpen])
  useEffect(() => {
    if (!menuOpen) return
    const esc = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [menuOpen])

  const tabHref = (key) => (key === 'top' ? '/' : `/tab/${encodeURIComponent(key)}`)
  const ALL = [...TABS, { key: 'agency', label: 'หน่วยงาน' }]

  return (
    <header className="sticky top-0 z-40 bg-ink-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-1 px-4">
        <Link to="/" aria-label="หนองบัว INSIDER หน้าแรก" className="flex min-w-0 items-center gap-2 font-display text-[22px] font-bold leading-none tracking-tight">
          <img src={logoMark} alt="" className="h-7 w-auto" />
          <span className="truncate"><span className="text-white">หนองบัว</span> <span className="text-brand">INSIDER</span></span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center">
          <button aria-label="ค้นหา" onClick={() => setSearchOpen((v) => !v)} className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10">
            {searchOpen ? <Icon.Close className="h-6 w-6" /> : <Icon.Search className="h-6 w-6" />}
          </button>
          <button
            role="switch"
            aria-checked={aiMode}
            aria-label="AIสุ่ม พาดหัว"
            title="AIสุ่ม 🤖 — สุ่มพาดหัวข่าว (ไม่แก้ข่าวจริง)"
            onClick={() => setAiMode(!aiMode)}
            className="relative grid h-11 w-11 place-items-center rounded-full text-xl hover:bg-white/10"
          >
            <span className={aiMode ? '' : 'opacity-60 grayscale'}>🤖</span>
            {aiMode && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-ink-950" />}
          </button>
          <Link to="/admin/login" aria-label="เพิ่มข่าว / หลังบ้าน" className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <label className="relative block">
            <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input ref={inputRef} type="search" value={search || ''} onChange={(e) => onSearch?.(e.target.value)}
              placeholder="ค้นหาข่าว อำเภอ แหล่งข่าว..." aria-label="ค้นหาข่าว" className="input rounded-full py-2.5 pl-9 pr-4" />
          </label>
        </div>
      )}

      {/* แถบแท็บ / หมวดหมู่ */}
      <nav className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-stretch">
          {menuOpen ? (
            <p className="flex flex-1 items-center px-4 py-3.5 text-base text-neutral-200">หมวดหมู่</p>
          ) : (
            <div className="no-scrollbar flex flex-1 overflow-x-auto px-1 sm:px-0">
              {TABS.map((t) => {
                const active = activeTab === t.key
                const dot = newTabs.includes(t.key)
                return (
                  <Link key={t.key} to={tabHref(t.key)}
                    className={`relative shrink-0 px-3.5 py-3.5 text-base transition ${active ? 'font-display font-bold text-white' : 'text-neutral-400 hover:text-white'}`}>
                    {t.label}
                    {dot && !active && <span className="absolute right-1.5 top-2.5 h-2 w-2 rounded-full bg-brand" aria-label="มีข่าวใหม่" />}
                    {active && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-white" />}
                  </Link>
                )
              })}
            </div>
          )}
          <button aria-label={menuOpen ? 'ปิดหมวดหมู่' : 'หมวดหมู่ทั้งหมด'} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}
            className="my-2 grid w-12 shrink-0 place-items-center border-l border-white/15 text-neutral-200 hover:text-white">
            <Icon.Chevron className={`h-5 w-5 transition ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {menuOpen && (
          <>
            <div className="absolute inset-x-0 top-full z-40 h-[100vh] bg-black/70" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div className="absolute inset-x-0 top-full z-50 border-b border-white/10 bg-ink-900">
              <div className="mx-auto flex max-w-6xl flex-wrap gap-2.5 px-4 py-5">
                {ALL.map((t) => {
                  const active = activeTab === t.key
                  return (
                    <Link key={t.key} to={tabHref(t.key)} onClick={() => setMenuOpen(false)}
                      className={`relative rounded-full border px-5 py-2 text-[15px] transition ${active ? 'border-white bg-white font-semibold text-black' : 'border-white/25 text-neutral-200 hover:border-white/60'}`}>
                      {t.key === 'top' ? 'TOP' : t.label}
                      {newTabs.includes(t.key) && !active && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand" />}
                    </Link>
                  )
                })}
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-white/25 px-5 py-2 text-[15px] text-neutral-200 hover:border-white/60">
                  <Icon.GitHub className="h-4 w-4" /> GitHub
                </a>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  )
}
