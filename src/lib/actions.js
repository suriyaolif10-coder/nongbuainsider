// เรียกงานฝั่งเซิร์ฟเวอร์ผ่าน endpoint 'actions' เท่านั้น (ไม่เรียกบริการภายนอกจากเบราว์เซอร์ตรงๆ)
// ค่าเริ่มต้น: 'actions' (relative) / ตั้ง VITE_ACTIONS_URL เป็น URL ของ Supabase Edge Function ได้
// ตัวอย่างฟังก์ชัน: supabase/functions/actions/index.ts (รองรับ action: 'fetch_og')
const ACTIONS_URL = import.meta.env.VITE_ACTIONS_URL || 'actions'

export async function callAction(action, payload = {}) {
  let res
  try {
    res = await fetch(ACTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    })
  } catch {
    throw new Error('เชื่อมต่อบริการดึงข้อมูลไม่ได้')
  }
  const json = await res.json().catch(() => null)
  if (!res.ok || !json || json.ok === false) {
    if (res.status === 404 || res.status === 405 || !json) throw new Error('ยังไม่ได้ติดตั้งบริการดึงข้อมูล (actions) — กรอกข้อมูลเองได้')
    throw new Error(json.error || `ดึงข้อมูลไม่ได้ (HTTP ${res.status})`)
  }
  return json.data ?? json
}

// ดึง og:title / og:image / og:description ของลิงก์
export async function fetchOg(url) {
  const d = await callAction('fetch_og', { url })
  return {
    title: (d.title || '').trim(),
    content: (d.description || '').trim(),
    image_url: d.image || '',
    source: d.site_name || '',
  }
}
