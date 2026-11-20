import { useMemo } from 'react'
import { useCollection } from '../db.js'
import { useLinkNews } from '../components/links.js'
import { useMatichonNews } from '../components/matichon.js'

// ข่าวทั้งหมด: ข่าวในเว็บ (หลังบ้าน) + ข่าวจากลิงก์โพสต์เพจ + ข่าวมติชนหมวดหนองบัวลำภู (ไม่ซ้ำ) เรียงใหม่สุด
export function useAllNews() {
  const tips = useCollection('insider_tips')
  const links = useLinkNews()
  const matichon = useMatichonNews()
  return useMemo(() => {
    const own = tips.map((t) => (t.link ? { ...t, href: t.link } : t))
    const seen = new Set(own.map((n) => n.href).filter(Boolean))
    const ext = [...links, ...matichon].filter((n) => !seen.has(n.href) && seen.add(n.href))
    return [...own, ...ext].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  }, [tips, links, matichon])
}
