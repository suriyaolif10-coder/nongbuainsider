import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand, Icon } from './ui.jsx'
import { DISTRICTS, GITHUB_URL } from '../db.js'

export const TABS = [
  { key: 'top', label: 'TOP' },
  { key: 'community', label: 'ข่าวชุมชน' },
  { key: 'nongbua', label: 'ข่าวหนองบัว' },
  ...DISTRICTS.map((d) => ({ key: d.name, label: d.short })),
]

export default function Header({ activeTab = 'top', search, onSearch }) {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(!!search)
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (searchOpen) inputRef.current?.focus() }, [searchOpen])

  const tabHref = (key) => (key === 'top' ? '/' : `/tab/${encodeURIComponent(key)}`)

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" aria-label="หนองบัว INSIDER หน้าแรก"><Brand /></Link>
        <div className="flex items-center gap-2">
          <button
            aria-label="ค้นหา"
            onClick={() => { setSearchOpen((v) => !v); if (searchOpen) onSearch?.('') }}
            className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/10"
          >
            {searchOpen ? <Icon.Close className="h-6 w-6" /> : <Icon.Search className="h-6 w-6" />}
          </button>
          {/* ปุ่มเพิ่มข่าว -> ไปหน้า Login หลังบ้าน */}
          <button onClick={() => navigate('/admin/login')} className="btn-brand whitespace-nowrap px-4 py-2.5 text-[15px] font-bold">
            <span className="text-base leading-none">+</span> เพิ่มข่าว
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <input
            ref={inputRef}
            value={search || ''}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="ค้นหาข่าว อำเภอ หรือแหล่งข่าว..."
            className="input rounded-full px-4 py-2.5"
          />
        </div>
      )}

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
