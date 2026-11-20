import { useEffect, useState } from 'react'

// ข่าวหนองบัวลำภูจากมติชน (public/data/matichon.json สร้างบน GitHub Actions) แปลงเป็นรูปแบบข่าวของเว็บ
let cache = null
let pending = null
export function useMatichonNews() {
  const [items, setItems] = useState(cache || [])
  useEffect(() => {
    if (cache) return
    pending ||= fetch('./data/matichon.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (cache = (d?.items || []).map((m) => ({
        id: 'm-' + m.link, title: m.title, content: m.excerpt, image_url: m.image, source: m.source || 'มติชน',
        district: m.district, created_at: m.published_at, href: m.link,
      }))))
      .catch(() => (cache = []))
    pending.then(setItems)
  }, [])
  return items
}
