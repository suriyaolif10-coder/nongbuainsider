// ดึงหัวข้อข่าวจาก RSS ของมติชน -> public/data/matichon.json
// รันบน GitHub Actions ก่อน build (ทุกชั่วโมง) — แสดงเฉพาะหัวข้อ/ย่อหน้าสั้น + ลิงก์กลับไปต้นฉบับ
import { readFile, writeFile, mkdir } from 'node:fs/promises'

const OUT = new URL('../public/data/matichon.json', import.meta.url)
const LOCAL_KEYWORDS = ['หนองบัวลำภู', 'นากลาง', 'โนนสัง', 'ศรีบุญเรือง', 'สุวรรณคูหา', 'นาวัง']
const DISTRICTS = ['เมืองหนองบัวลำภู', 'นากลาง', 'โนนสัง', 'ศรีบุญเรือง', 'สุวรรณคูหา', 'นาวัง']
const FEEDS = [
  { url: 'https://www.matichon.co.th/feed', label: 'มติชน' },
  { url: 'https://www.matichon.co.th/region/feed', label: 'มติชน ภูมิภาค' },
  // ข่าวที่ติดแท็กหนองบัวลำภูในมติชนโดยตรง (ได้ลิงก์บทความจริง ดึงภาพได้)
  { url: 'https://www.matichon.co.th/tag/' + encodeURIComponent('หนองบัวลำภู') + '/feed', label: 'มติชน', forceLocal: true, direct: true },
  // ข่าวมติชนที่พูดถึงหนองบัวลำภู (ผ่าน Google News)
  {
    url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('หนองบัวลำภู site:matichon.co.th') + '&hl=th&gl=TH&ceid=TH:th',
    label: 'มติชน',
    forceLocal: true,
  },
]

const decode = (s = '') =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim()
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? decode(m[1]) : ''
}
const attr = (xml, name, a) => {
  const m = xml.match(new RegExp(`<${name}\\s[^>]*${a}=["']([^"']+)["']`, 'i'))
  return m ? decode(m[1]) : ''
}
const stripHtml = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

function parse(xml, feed) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || []
  return blocks.map((b) => {
    const desc = tag(b, 'description') || tag(b, 'summary')
    const html = tag(b, 'content:encoded') || desc || tag(b, 'content')
    let title = stripHtml(tag(b, 'title'))
    if (feed.forceLocal && !feed.direct) title = title.replace(/\s+-\s+(มติชน|Matichon)[^-]*$/i, '') // Google News ต่อท้ายชื่อสำนักข่าว
    const link = tag(b, 'link') || attr(b, 'link', 'href')
    const image =
      attr(b, 'media:content', 'url') || attr(b, 'media:thumbnail', 'url') ||
      (/<enclosure[^>]*type=["']image/i.test(b) ? attr(b, 'enclosure', 'url') : '') ||
      (html.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || ''
    let excerpt = feed.forceLocal && !feed.direct ? '' : stripHtml(desc)
    if (excerpt.length > 140) excerpt = excerpt.slice(0, 140).trim() + '…'
    const date = new Date(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'))
    const text = title + ' ' + excerpt
    return {
      title,
      link,
      image: image.startsWith('http') ? image : '',
      excerpt,
      published_at: isNaN(date) ? null : date.toISOString(),
      source: feed.label,
      local: !!feed.forceLocal || LOCAL_KEYWORDS.some((k) => text.includes(k)),
      district: DISTRICTS.slice(1).find((d) => text.includes(d)) || '',
    }
  }).filter((i) => i.title && /^https?:\/\//.test(i.link))
}

const results = await Promise.allSettled(FEEDS.map(async (feed) => {
  const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NongbuaInsiderBot/1.0)' }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const items = parse(await res.text(), feed)
  console.log(`✓ ${feed.url} -> ${items.length} ข่าว`)
  return items
}))
results.forEach((r, i) => r.status === 'rejected' && console.warn(`✗ ${FEEDS[i].url}: ${r.reason?.message || r.reason}`))

const seen = new Set()
const all = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  .filter((i) => { const k = i.link.split('?')[0]; if (seen.has(k) || seen.has(i.title)) return false; seen.add(k); seen.add(i.title); return true })
  .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
// ข่าวเกี่ยวกับหนองบัวลำภูขึ้นก่อน (สูงสุด 30) ตามด้วยข่าวล่าสุดทั่วไปของมติชน (20)
let items = [...all.filter((i) => i.local).slice(0, 30), ...all.filter((i) => !i.local).slice(0, 20)]

// ข่าวที่ยังไม่มีภาพ: เปิดหน้าบทความ (เฉพาะลิงก์ matichon.co.th โดยตรง) แล้วอ่าน og:image
const needImg = items.filter((i) => !i.image && /^https:\/\/(www\.)?matichon\.co\.th\//.test(i.link)).slice(0, 40)
const ogImage = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NongbuaInsiderBot/1.0)' }, signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = (await res.text()).slice(0, 300000)
  const m = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  return m ? decode(m[1]) : ''
}
for (let i = 0; i < needImg.length; i += 6) {
  await Promise.allSettled(needImg.slice(i, i + 6).map(async (it) => { it.image = (await ogImage(it.link)) || '' }))
}
// ข่าวผ่าน Google News ไม่มีภาพ: ตัดออกถ้ามีข่าวหนองบัวลำภูที่มีภาพพอแล้ว (>= 12)
if (items.filter((i) => i.local && i.image).length >= 12) {
  const before = items.length
  items = items.filter((i) => i.image || !/news\.google\.com/.test(i.link))
  console.log(`ตัดข่าว Google News ที่ไม่มีภาพ ${before - items.length} ข่าว`)
}
console.log(`ภาพ: ดึงจากหน้าบทความ ${needImg.filter((i) => i.image).length}/${needImg.length} | ข่าวที่มีภาพทั้งหมด ${items.filter((i) => i.image).length}/${items.length} | ข่าวหนองบัวลำภูที่มีภาพ ${items.filter((i) => i.local && i.image).length}/${items.filter((i) => i.local).length}`)
console.log('ตัวอย่าง:', JSON.stringify(items.slice(0, 2).map((i) => ({ t: i.title.slice(0, 40), img: i.image.slice(0, 80), link: i.link.slice(0, 60) }))))

if (!items.length) {
  // ดึงไม่ได้เลย: เก็บไฟล์เดิมไว้ ไม่ทำให้ deploy ล้ม
  try { await readFile(OUT); console.warn('ไม่ได้ข่าวใหม่ ใช้ไฟล์เดิม'); process.exit(0) } catch { /* ยังไม่มีไฟล์ */ }
}
await mkdir(new URL('.', OUT), { recursive: true })
await writeFile(OUT, JSON.stringify({ updated_at: new Date().toISOString(), source: 'https://www.matichon.co.th/', items }, null, 1))
console.log(`บันทึก ${items.length} ข่าว (เกี่ยวกับหนองบัวลำภู ${items.filter((i) => i.local).length})`)
