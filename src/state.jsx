import { createContext, useContext, useEffect, useState } from 'react'

// สถานะทั้งเว็บ: ดูข่าวทั้งหมด/เฉพาะเดือนนี้, โหมด AI สุ่มพาดหัว
const Ctx = createContext(null)
const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === 'true' } catch { return d } }

export function AppStateProvider({ children }) {
  const [showAll, setShowAll] = useState(() => load('nongbua_show_all', false))
  const [aiMode, setAiMode] = useState(() => load('nongbua_ai_mode', false))
  useEffect(() => { try { localStorage.setItem('nongbua_show_all', showAll) } catch { /* */ } }, [showAll])
  useEffect(() => { try { localStorage.setItem('nongbua_ai_mode', aiMode) } catch { /* */ } }, [aiMode])
  return <Ctx.Provider value={{ showAll, setShowAll, aiMode, setAiMode }}>{children}</Ctx.Provider>
}
export const useAppState = () => useContext(Ctx) || { showAll: false, setShowAll() {}, aiMode: false, setAiMode() {} }
