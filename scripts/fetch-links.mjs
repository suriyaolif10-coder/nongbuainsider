// อ่าน content/news-links.txt -> ดึงหัวข้อ/ภาพ/คำโปรย (og:*) ของแต่ละลิงก์ -> public/data/links.json
import { readFile, writeFile, mkdir } from 'node:fs/promises'

const IN = new URL('../content/news-links.txt', import.meta.url)
const OUT = new URL('../public/data/links.json', import.meta.url)
const DISTRICTS = ['เมืองหนองบัวลำภู', 'นากลาง', 'โนนสัง', 'ศรีบุญเรือง', 'สุวรรณคูหา', 'นาวัง']

const decode = (s = '') => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim()
function meta(html, keys) {
  for (const k of keys) {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${k}["']`, 'i'))
    if (m && m[1].trim()) return decode(m[1])
  }
  return ''
}
const abs = (u, base) => { try { return u ? new URL(u, base).href : '' } catch { return '' } }
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^(www|m)\./, '') } catch { return '' } }
const SITE_NAMES = { 'facebook.com': 'Facebook', 'matichon.co.th': 'มติชน', 'thairath.co.th': 'ไทยรัฐ', 'khaosod.co.th': 'ข่าวสด', 'dailynews.co.th': 'เดลินิวส์', 'mgronline.com': 'ผู้จัดการออนไลน์', 'amarintv.com': 'อมรินทร์ทีวี', 'thaipbs.or.th': 'Thai PBS', 'pptvhd36.com': 'PPTV', 'ch3plus.com': 'ช่อง 3', 'sanook.com': 'Sanook', 'naewna.com': 'แนวหน้า', 'komchadluek.net': 'คมชัดลึก', 'prd.go.th': 'ประชาสัมพันธ์' }
const siteName = (u, og) => og || Object.entries(SITE_NAMES).find(([d]) => hostOf(u).endsWith(d))?.[1] || hostOf(u)
const guessDistrict = (text) => DISTRICTS.slice(1).find((d) => text.includes(d)) || (text.includes('อ.เมือง') || text.includes('อำเภอเมือง') ? DISTRICTS[0] : '')

// อ่านรายการลิงก์
const lines = (await readFile(IN, 'utf8')).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
const entries = []
for (const l of lines) {
  const [url, d] = l.split('|').map((x) => x.trim())
  if (!/^https?:\/\//.test(url)) { console.warn(`ข้าม (ไม่ใช่ลิงก์): ${l}`); continue }
  const district = DISTRICTS.find((x) => d && (x === d || x.endsWith(d.replace(/^อ\.|^อำเภอ/, '')))) || ''
  if (!entries.some((e) => e.url === url)) entries.push({ url, district })
}

// ข่าวเด่นที่คัดจากเพจ: GitHub Issues ที่ขึ้นต้นด้วย [ข่าวเด่น] (สร้างจากหลังบ้าน) — ปิด issue = เอาออก
if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
  try {
    const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues?state=open&per_page=100`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    })
    const issues = res.ok ? await res.json() : []
    let n = 0
    for (const is of issues) {
      if (is.pull_request || !/^\s*\[ข่าวเด่น\]/.test(is.title || '')) continue
      // repo เป็น Public: รับเฉพาะ issue ของเจ้าของ/ผู้ร่วมดูแล repo กันคนนอกโพสต์ข่าวขึ้นเว็บ
      if (!['OWNER', 'MEMBER', 'COLLABORATOR'].includes(is.author_association)) { console.warn(`ข้าม issue #${is.number} (ไม่ใช่เจ้าของ repo)`); continue }
      const text = `${is.title}\n${is.body || ''}`
      const url = (text.match(/https?:\/\/[^\s<>)"']+/) || [])[0]
      if (!url) continue
      const dm = text.match(/อำเภอ\s*[:：]\s*([^\n]+)/)
      const d = dm ? dm[1].trim() : ''
      const district = DISTRICTS.find((x) => d && (x === d || x.endsWith(d.replace(/^อ\.|^อำเภอ/, '')))) || ''
      const ex = entries.find((e) => e.url === url)
      if (ex) { ex.pick = true; ex.district ||= district } else entries.push({ url, district, pick: true, issue: is.number })
      n++
    }
    console.log(`ข่าวเด่นจาก GitHub Issues: ${n} ข่าว`)
  } catch (e) { console.warn('อ่าน GitHub Issues ไม่ได้:', e.message) }
}

let old = {}
try { for (const i of JSON.parse(await readFile(OUT, 'utf8')).items || []) old[i.link] = i } catch { /* ไม่มีไฟล์เดิม */ }

async function fetchOne({ url, district, pick }) {
  const isFb = /facebook\.com|fb\.watch/i.test(url)
  const ctrl = AbortSignal.timeout(15000)
  const res = await fetch(url, {
    redirect: 'follow',
    signal: ctrl,
    headers: {
      'User-Agent': isFb ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' : 'Mozilla/5.0 (compatible; NongbuaInsiderBot/1.0; +https://suriyaolif10-coder.github.io/nongbuainsider/)',
      'Accept-Language': 'th,en;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = (await res.text()).slice(0, 600000)
  const base = res.url || url
  let title = meta(html, ['og:title', 'twitter:title']) || decode((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '')
  let desc = meta(html, ['og:description', 'twitter:description', 'description'])
  let fbPage = ''
  if (isFb && desc && (!title || /facebook/i.test(title) || title.length < 20)) { // โพสต์ FB: ใช้ข้อความโพสต์เป็นหัวข้อ
    const page = title
    if (page && !/facebook/i.test(page)) fbPage = page
    title = desc.split('\n')[0]
    desc = desc.slice(title.length).trim()
  }
  title = title.replace(/\s+/g, ' ').trim()
  if (title.length > 160) title = title.slice(0, 157).trim() + '…'
  if (desc.length > 220) desc = desc.slice(0, 217).trim() + '…'
  const image = abs(meta(html, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']), base)
  const published = meta(html, ['article:published_time', 'og:updated_time', 'datePublished', 'pubdate'])
  const d = new Date(published)
  if (!title) throw new Error('ไม่พบหัวข้อข่าวในหน้า')
  return {
    link: url,
    title,
    excerpt: desc && desc !== title ? desc : '',
    image: /^https?:\/\//.test(image) ? image : '',
    source: fbPage || siteName(url, meta(html, ['og:site_name'])),
    district: district || guessDistrict(`${title} ${desc}`),
    published_at: !isNaN(d) ? d.toISOString() : old[url]?.published_at || new Date().toISOString(),
    pick: !!pick,
  }
}

const items = []
const hard = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
for (let i = 0; i < entries.length; i += 6) {
  const batch = entries.slice(i, i + 6)
  const res = await Promise.allSettled(batch.map((e) => Promise.race([fetchOne(e), hard(20000)])))
  res.forEach((r, j) => {
    const e = batch[j]
    if (r.status === 'fulfilled') { items.push(r.value); console.log(`✓ ${r.value.district || '-'} | ${r.value.title.slice(0, 60)}`) }
    else if (old[e.url]) { items.push({ ...old[e.url], district: e.district || old[e.url].district, pick: !!e.pick }); console.warn(`↺ ใช้ข้อมูลเดิม (${r.reason?.message}): ${e.url}`) }
    else console.warn(`✗ ${e.url}: ${r.reason?.message || r.reason}`)
  })
}
items.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
await mkdir(new URL('.', OUT), { recursive: true })
await writeFile(OUT, JSON.stringify({ updated_at: new Date().toISOString(), items }, null, 1))
console.log(`ลิงก์ข่าว ${entries.length} | แสดงได้ ${items.length}`)
process.exit(0)
