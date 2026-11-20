import { useEffect, useState } from 'react'

// ภาพตัวอย่างของลิงก์ (สร้างโดย scripts/fetch-previews.mjs บน GitHub Actions)
let cache = null
let pending = null
export function usePreviews() {
  const [data, setData] = useState(cache)
  useEffect(() => {
    if (cache) return
    pending ||= fetch('./data/previews.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (cache = d?.items || {}))
      .catch(() => (cache = {}))
    pending.then(setData)
  }, [])
  return data || {}
}
export const previewOf = (map, url) => map[(url || '').replace(/\/+$/, '')] || null
export const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } }
