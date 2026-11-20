import { useEffect, useState } from 'react'

// ข่าวจากลิงก์ (content/news-links.txt -> public/data/links.json สร้างบน GitHub Actions)
// แปลงเป็นรูปแบบเดียวกับ insider_tips + href ไปหน้าต้นทาง
let cache = null
let pending = null
export function useLinkNews() {
  const [items, setItems] = useState(cache || [])
  useEffect(() => {
    if (cache) return
    pending ||= fetch('./data/links.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (cache = (d?.items || []).map((n) => ({
        id: 'link-' + n.link,
        title: n.title,
        content: n.excerpt,
        image_url: n.image,
        source: n.source,
        district: n.district,
        created_at: n.published_at,
        href: n.link,
      }))))
      .catch(() => (cache = []))
    pending.then(setItems)
  }, [])
  return items
}
