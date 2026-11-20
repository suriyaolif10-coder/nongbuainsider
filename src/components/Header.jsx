import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

export default function Header({ activeTab = 'top', search, onSearch }) {
  const navigate = useNavigate()
  const { aiMode, setAiMode } = useAppState()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (searchOpen) inputRef.current?.focus() }, [searchOpen])

  const tabHref = (key) => (key === 'top' ? '/' : `/tab/${encodeURIComponent(key)}`)
  const searchBox = (cls) => (
    <label className={`relative block ${cls}`}>
      <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      <input
        ref={inputRef}
        type="search"
        value={search || ''}
        onChange={(e) => onSearch?.(e.target.value)}
        placeholder="ค้นหาข่าว อำเภอ แหล่งข่าว..."
        aria-label="ค้นหาข่าว"
        className="input rounded-full py-2 pl-9 pr-4"
      />
    </label>
  )

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3">
        <Link to="/" aria-label="หนองบัว INSIDER หน้าแรก" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold leading-none sm:text-xl">
          <img src={logoMark} alt="" className="h-9 w-auto" />
          <span className="hidden sm:inline"><span className="text-white">หนองบัว</span> <span className="text-brand">INSIDER</span></span>
        </Link>
        {searchBox('ml-auto hidden w-full max-w-xs md:block')}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          <button aria-label="ค้นหา" onClick={() => setSearchOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10 md:hidden">
            {searchOpen ? <Icon.Close className="h-5 w-5" /> : <Icon.Search className="h-5 w-5" />}
          </button>
          <button
            role="switch"
            aria-checked={aiMode}
            onClick={() => setAiMode(!aiMode)}
            title="สุ่มพาดหัวข่าวแบบ AI (ไม่แก้ข่าวจริง)"
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${aiMode ? 'border-brand bg-brand/20 text-brand' : 'border-white/15 text-neutral-300 hover:border-white/40'}`}
          >
            <span className={`relative hidden h-4 w-7 rounded-full transition min-[400px]:block ${aiMode ? 'bg-brand' : 'bg-ink-600'}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${aiMode ? 'left-3.5' : 'left-0.5'}`} />
            </span>
            AIสุ่ม 🤖
          </button>
          <button onClick={() => navigate('/admin/login')} className="btn-brand whitespace-nowrap px-3.5 py-2 text-sm font-bold">
            + เพิ่มข่าว
          </button>
        </div>
      </div>

      {searchOpen && <div className="mx-auto max-w-6xl px-4 pb-3 md:hidden">{searchBox('')}</div>}

      {/* แถบแท็บ */}
      <nav className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-stretch">
          <div className="no-scrollbar flex flex-1 overflow-x-auto px-1 sm:px-0">
            {TABS.map((t) => {
              const active = activeTab === t.key
              return (
                <Link
                  key={t.key}
                  to={tabHref(t.key)}
                  className={`relative shrink-0 px-3 py-3.5 text-base transition sm:px-4 ${active ? 'font-display font-bold text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  {t.label}
                  {active && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-brand" />}
                </Link>
              )
            })}
          </div>
          <button
            aria-label="เมนูทั้งหมด"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="my-2 grid w-12 shrink-0 place-items-center border-l border-white/15 bg-black text-neutral-200 hover:text-white"
          >
            <Icon.Chevron className={`h-5 w-5 transition ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {menuOpen && (
          <div className="absolute inset-x-0 top-full z-50 border-b border-white/10 bg-ink-900 shadow-2xl">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-1 p-3 sm:grid-cols-3 md:grid-cols-5">
              {TABS.map((t) => (
                <Link
                  key={t.key}
                  to={tabHref(t.key)}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm ${activeTab === t.key ? 'bg-brand/15 text-brand' : 'text-neutral-300 hover:bg-white/5'}`}
                >
                  {DISTRICTS.some((d) => d.name === t.key) ? `อ.${t.key}` : t.label}
                </Link>
              ))}
              <Link to="/tab/agency" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-white/5">หน่วยงานราชการ</Link>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-white/5">
                <Icon.GitHub className="h-4 w-4" /> GitHub
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
