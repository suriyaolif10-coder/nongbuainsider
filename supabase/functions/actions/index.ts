// Supabase Edge Function: endpoint 'actions' สำหรับหน้าเว็บ (เรียกผ่าน fetch(ACTIONS_URL))
// deploy:  supabase functions deploy actions --no-verify-jwt
// แล้วตั้ง VITE_ACTIONS_URL = https://<project>.functions.supabase.co/actions
// รองรับ: { action: 'fetch_og', url } -> { ok, data: { title, description, image, site_name } }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
function meta(html: string, keys: string[]) {
  for (const k of keys) {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i'))
    if (m && m[1].trim()) return decode(m[1])
  }
  return ''
}

async function fetchOg(url: string) {
  const u = new URL(url)
  if (!/^https?:$/.test(u.protocol)) throw new Error('รองรับเฉพาะ http/https')
  // กันการเรียกเครือข่ายภายใน
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)) throw new Error('ไม่อนุญาตที่อยู่นี้')
  const isFb = /facebook\.com|fb\.watch/i.test(u.hostname)
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(12000),
    headers: {
      'User-Agent': isFb ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' : 'Mozilla/5.0 (compatible; NongbuaInsiderBot/1.0)',
      'Accept-Language': 'th,en;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`เว็บต้นทางตอบ HTTP ${res.status}`)
  const html = (await res.text()).slice(0, 600000)
  const base = res.url || url
  const img = meta(html, ['og:image:secure_url', 'og:image', 'twitter:image'])
  return {
    title: meta(html, ['og:title', 'twitter:title']) || decode((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || ''),
    description: meta(html, ['og:description', 'twitter:description', 'description']),
    image: img ? new URL(img, base).href : '',
    site_name: meta(html, ['og:site_name']),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405)
  try {
    const body = await req.json()
    if (body.action === 'fetch_og') return json({ ok: true, data: await fetchOg(String(body.url || '')) })
    return json({ ok: false, error: `ไม่รู้จัก action: ${body.action}` }, 400)
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 400)
  }
})
