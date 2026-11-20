// ดึงภาพตัวอย่าง (og:image) + ไอคอนเว็บ ของลิงก์หน่วยงาน/เพจ -> public/data/previews.json
// รันบน GitHub Actions ก่อน build เพราะเบราว์เซอร์ดึงข้ามเว็บเองไม่ได้ (CORS)
import { readFile, writeFile, mkdir } from 'node:fs/promises'

const OUT = new URL('../public/data/previews.json', import.meta.url)
const SRC = new URL('../src/db.js', import.meta.url)

const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
const norm = (u) => u.replace(/\/+$/, '')

// meta property/name=... content=...  (ลำดับ attribute สลับกันได้)
function meta(html, keys) {
  for (const k of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']+)["']`, 'i')
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${k}["']`, 'i')
    const m = html.match(re1) || html.match(re2)
    if (m) return decode(m[1])
  }
  return ''
}
function iconOf(html) {
  const links = html.match(/<link[^>]+>/gi) || []
  const pick = (re) => links.find((l) => re.test(l))
  const l = pick(/rel=["'][^"']*apple-touch-icon/i) || pick(/rel=["'](?:shortcut )?icon["']/i) || pick(/rel=["'][^"']*icon/i)
  const m = l && l.match(/href=["']([^"']+)["']/i)
  return m ? decode(m[1]) : '/favicon.ico'
}
const abs = (u, base) => { try { return u ? new URL(u, base).href : '' } catch { return '' } }

async function preview(url) {
  const isFb = /facebook\.com/i.test(url)
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    headers: {
      // Facebook ส่ง og:image ให้ crawler ของตัวเองโดยไม่ต้อง login
      'User-Agent': isFb ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' : 'Mozilla/5.0 (compatible; NongbuaInsiderBot/1.0; +https://suriyaolif10-coder.github.io/nongbuainsider/)',
      'Accept-Language': 'th,en;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = (await res.text()).slice(0, 400000)
  const base = res.url || url
  let image = abs(meta(html, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']), base)
  if (!image) { const m = html.match(/<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i); image = abs(m && decode(m[1]), base) }
  return {
    image: /^https?:\/\//.test(image) ? image : '',
    icon: isFb ? '' : abs(iconOf(html), base),
    title: meta(html, ['og:title', 'twitter:title']) || decode((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '').slice(0, 120),
  }
}

const src = await readFile(SRC, 'utf8')
const block = src.slice(src.indexOf('agency_sites: ['), src.indexOf('fb_posts: ['))
const urls = [...new Set([...block.matchAll(/url: '(https?:\/\/[^']+)'/g)].map((m) => m[1]))]
// รวมลิงก์เพจ Facebook ของข่าวชุมชนด้วย
const fbBlock = src.slice(src.indexOf('fb_posts: ['), src.indexOf('ad_banners: ['))
for (const m of fbBlock.matchAll(/embed_url: '(https?:\/\/[^']+)'/g)) if (!urls.includes(m[1])) urls.push(m[1])

let old = {}
try { old = JSON.parse(await readFile(OUT, 'utf8')).items || {} } catch { /* none */ }

const items = {}
let ok = 0, fail = 0
const queue = [...urls]
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const url = queue.shift()
    try {
      const p = await preview(url)
      items[norm(url)] = p
      ok++
      console.log(`${p.image ? '🖼 ' : '· '} ${url}${p.image ? '' : ' (ไม่มี og:image)'}`)
    } catch (e) {
      fail++
      if (old[norm(url)]) items[norm(url)] = old[norm(url)] // ใช้ค่าเดิมถ้าดึงรอบนี้ไม่ได้
      console.warn(`✗  ${url}: ${e.message || e}`)
    }
  }
}))

await mkdir(new URL('.', OUT), { recursive: true })
await writeFile(OUT, JSON.stringify({ updated_at: new Date().toISOString(), items }, null, 1))
const withImg = Object.values(items).filter((i) => i.image).length
console.log(`สรุป: ${urls.length} ลิงก์ | ดึงได้ ${ok} | ล้มเหลว ${fail} | มีภาพตัวอย่าง ${withImg}`)
