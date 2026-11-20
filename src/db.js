// ชั้นข้อมูลสำหรับ collections: agency_sites, ad_banners, insider_tips, fb_posts, app_config
// ใช้ Supabase เมื่อตั้งค่าไว้ ไม่งั้นใช้ localStorage (API จำลอง)
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const PREFIX = 'nongbua_'
const AUTH_KEY = PREFIX + 'admin_auth'
// เก็บเฉพาะค่า SHA-256 ของรหัสผ่าน (ไม่เก็บรหัสจริงในโค้ด)
// เปลี่ยนรหัส: รัน  printf '%s' 'รหัสใหม่' | sha256sum  แล้วนำค่ามาใส่แทน
const ADMIN_PASSWORD_SHA256 = '2f5d4f358d3d2474fcfc6040bbb954ae0f7974e95c7661f96c09dc652106ed16'
export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export const GITHUB_URL = 'https://github.com/suriyaolif10-coder/nongbuainsider'

export const DISTRICTS = [
  { name: 'เมืองหนองบัวลำภู', short: 'อ.เมือง' },
  { name: 'นากลาง', short: 'นากลาง' },
  { name: 'โนนสัง', short: 'โนนสัง' },
  { name: 'ศรีบุญเรือง', short: 'ศรีบุญเรือง' },
  { name: 'สุวรรณคูหา', short: 'สุวรรณคูหา' },
  { name: 'นาวัง', short: 'นาวัง' },
]

export const AD_PRICES = [300, 500, 800]
export const AD_POSITIONS = ['top', 'side', 'feed']

const DAY = 86400000
const ago = (d) => new Date(Date.now() - d * DAY).toISOString()

// ข้อมูลตัวอย่าง (แก้ไข/ลบได้จากหลังบ้าน)
const SEED = {
  // ข่าวตัวอย่างถูกเอาออก (v6) ใช้ข่าวจริงจากหลังบ้าน / ลิงก์โพสต์ข่าว แทน
  insider_tips: [],
  agency_sites: [
    { id: 'a1', name: 'ศาลากลางจังหวัดหนองบัวลำภู', url: 'http://www.nongbualamphu.go.th', category: 'หน่วยงานจังหวัด' },
    { id: 'a2', name: 'สำนักงานประชาสัมพันธ์จังหวัดหนองบัวลำภู', url: 'https://nongbualamphu.prd.go.th', category: 'หน่วยงานจังหวัด' },
    { id: 'a4', name: 'สำนักงานคลังจังหวัดหนองบัวลำภู', url: 'https://nongbualamphu.treasury.go.th/th/', category: 'หน่วยงานจังหวัด' },
    { id: 'a5', name: 'สำนักงานพาณิชย์จังหวัดหนองบัวลำภู', url: 'https://nongbualamphu.moc.go.th', category: 'หน่วยงานจังหวัด' },
    { id: 'a6', name: 'สำนักงานสถิติจังหวัดหนองบัวลำภู', url: 'https://nongbualamphu.nso.go.th', category: 'หน่วยงานจังหวัด' },
    { id: 'a7', name: 'สำนักงานทรัพยากรธรรมชาติและสิ่งแวดล้อมจังหวัดหนองบัวลำภู', url: 'https://nongbualamphu.mnre.go.th/th/index', category: 'หน่วยงานจังหวัด' },
    { id: 'a8', name: 'ตรวจคนเข้าเมืองจังหวัดหนองบัวลำภู', url: 'https://nongbualamphu.immigration.go.th', category: 'หน่วยงานจังหวัด' },
    { id: 'a13', name: 'สำนักงานพัฒนาชุมชนจังหวัดหนองบัวลำภู', url: 'https://nongbua.cdd.go.th', category: 'หน่วยงานจังหวัด' },
    { id: 'd1', name: 'ที่ว่าการอำเภอเมืองหนองบัวลำภู (เพจ Facebook)', url: 'https://www.facebook.com/100083192417451', category: 'ที่ว่าการอำเภอ' },
    { id: 'd2', name: 'ที่ว่าการอำเภอนากลาง (เพจ Facebook)', url: 'https://www.facebook.com/100080299418860', category: 'ที่ว่าการอำเภอ' },
    { id: 'd3', name: 'ที่ทำการปกครองอำเภอโนนสัง', url: 'https://www.nonsangdopa.go.th', category: 'ที่ว่าการอำเภอ' },
    { id: 'd4', name: 'อำเภอศรีบุญเรือง (เพจ Facebook)', url: 'https://www.facebook.com/Districtsriboonruang/', category: 'ที่ว่าการอำเภอ' },
    { id: 'd5', name: 'ที่ว่าการอำเภอสุวรรณคูหา (เพจ Facebook)', url: 'https://www.facebook.com/100066892242577', category: 'ที่ว่าการอำเภอ' },
    { id: 'd6', name: 'ที่ว่าการอำเภอนาวัง (เพจ Facebook)', url: 'https://www.facebook.com/Nawangdistrict/', category: 'ที่ว่าการอำเภอ' },
    { id: 'a9', name: 'องค์การบริหารส่วนจังหวัดหนองบัวลำภู (อบจ.)', url: 'https://nppao.go.th/public/', category: 'ท้องถิ่น' },
    { id: 'a10', name: 'โรงพยาบาลหนองบัวลำภู', url: 'https://nbhospital.moph.go.th/public/', category: 'สาธารณสุข' },
    { id: 'a11', name: 'สำนักงานสาธารณสุขจังหวัดหนองบัวลำภู (เพจ Facebook)', url: 'https://www.facebook.com/nblp.pho/', category: 'สาธารณสุข' },
    { id: 'a12', name: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาหนองบัวลำภู เขต 1', url: 'https://nb1.go.th', category: 'การศึกษา' },
    { id: 'p1', name: 'ตำรวจภูธรจังหวัดหนองบัวลำภู', url: 'https://nongbualamphu.police.go.th', category: 'ตำรวจ' },
    { id: 'p2', name: 'สถานีตำรวจภูธรนากลาง', url: 'https://naklang.nongbualamphu.police.go.th', category: 'ตำรวจ' },
    { id: 'p3', name: 'สถานีตำรวจภูธรศรีบุญเรือง', url: 'https://sriboonrueng.nongbualamphu.police.go.th', category: 'ตำรวจ' },
    { id: 'p4', name: 'สถานีตำรวจภูธรนาวัง', url: 'https://nawang.nongbualamphu.police.go.th', category: 'ตำรวจ' },
    { id: 'r1', name: 'สมาคมกู้ภัยนเรศวรหนองบัวลำภู (เพจ Facebook)', url: 'https://www.facebook.com/NaresuanRescueAssociation/', category: 'กู้ภัย / กู้ชีพ' },
    { id: 'l0', name: 'สำนักงานส่งเสริมการปกครองท้องถิ่นจังหวัดหนองบัวลำภู (สถจ.)', url: 'https://nblplocal.go.th', category: 'ท้องถิ่น' },
    { id: 'l1', name: 'เทศบาลเมืองหนองบัวลำภู', url: 'https://tm-nbp.go.th', category: 'อปท. อ.เมืองหนองบัวลำภู' },
    { id: 'l2', name: 'อบต.หนองบัว', url: 'https://nbsao.go.th', category: 'อปท. อ.เมืองหนองบัวลำภู' },
    { id: 'l3', name: 'อบต.หนองภัยศูนย์', url: 'https://nps.go.th', category: 'อปท. อ.เมืองหนองบัวลำภู' },
    { id: 'l4', name: 'อบต.หนองหว้า', url: 'https://nongwa-nongbualamphu.go.th', category: 'อปท. อ.เมืองหนองบัวลำภู' },
    { id: 'l5', name: 'เทศบาลตำบลนากลาง', url: 'https://naklanglocal.go.th/public/', category: 'อปท. อ.นากลาง' },
    { id: 'l6', name: 'เทศบาลตำบลนาหนองทุ่ม', url: 'https://nanongthoom.go.th', category: 'อปท. อ.นากลาง' },
    { id: 'l7', name: 'อบต.กุดแห่', url: 'https://www.kudhae.go.th', category: 'อปท. อ.นากลาง' },
    { id: 'l8', name: 'อบต.ด่านช้าง', url: 'https://danchangnb.go.th', category: 'อปท. อ.นากลาง' },
    { id: 'l9', name: 'อบต.โนนเมือง (อ.นากลาง)', url: 'http://www.nmtb.go.th', category: 'อปท. อ.นากลาง' },
    { id: 'l10', name: 'เทศบาลตำบลโนนสัง', url: 'https://nonsunglocal.go.th', category: 'อปท. อ.โนนสัง' },
    { id: 'l11', name: 'อบต.โนนเมือง (อ.โนนสัง)', url: 'https://www.nonmuang-nb.go.th', category: 'อปท. อ.โนนสัง' },
    { id: 'l12', name: 'อบต.ปางกู่', url: 'https://pangku.go.th', category: 'อปท. อ.โนนสัง' },
    { id: 'l13', name: 'เทศบาลตำบลจอมทอง', url: 'https://www.chom-thong.go.th', category: 'อปท. อ.ศรีบุญเรือง' },
    { id: 'l14', name: 'เทศบาลตำบลโนนสะอาด', url: 'https://nonsa-ardlocal.go.th', category: 'อปท. อ.ศรีบุญเรือง' },
    { id: 'l15', name: 'อบต.ศรีบุญเรือง', url: 'https://sribunruang.go.th', category: 'อปท. อ.ศรีบุญเรือง' },
    { id: 'l16', name: 'อบต.หนองบัวใต้', url: 'https://nongboatai.go.th', category: 'อปท. อ.ศรีบุญเรือง' },
    { id: 'l17', name: 'อบต.เมืองใหม่', url: 'https://muengmai.go.th', category: 'อปท. อ.ศรีบุญเรือง' },
    { id: 'l18', name: 'เทศบาลตำบลสุวรรณคูหา', url: 'https://suwannakhuha.go.th', category: 'อปท. อ.สุวรรณคูหา' },
    { id: 'l19', name: 'เทศบาลตำบลนาดี', url: 'https://www.nadi-suwan.go.th', category: 'อปท. อ.สุวรรณคูหา' },
    { id: 'l20', name: 'เทศบาลตำบลนาเหล่า', url: 'https://tessabannalao.go.th/public/', category: 'อปท. อ.นาวัง' },
    { id: 'l21', name: 'อบต.นาแก', url: 'https://nakaesao.go.th', category: 'อปท. อ.นาวัง' },
  ],
  // เพจ Facebook ในจังหวัดหนองบัวลำภู (แสดงฟีดโพสต์ล่าสุดผ่าน Page Plugin ของ Facebook)
  fb_posts: [
    { id: 'f1', page_name: 'หนองบัวลำภู อัพเดท', embed_url: 'https://www.facebook.com/100068686250910' },
    { id: 'f2', page_name: 'ที่ว่าการอำเภอเมืองหนองบัวลำภู', embed_url: 'https://www.facebook.com/100083192417451' },
    { id: 'f3', page_name: 'ที่ว่าการอำเภอนากลาง', embed_url: 'https://www.facebook.com/100080299418860' },
    { id: 'f4', page_name: 'อำเภอศรีบุญเรือง', embed_url: 'https://www.facebook.com/Districtsriboonruang/' },
    { id: 'f5', page_name: 'ที่ว่าการอำเภอสุวรรณคูหา', embed_url: 'https://www.facebook.com/100066892242577' },
    { id: 'f6', page_name: 'ที่ว่าการอำเภอนาวัง', embed_url: 'https://www.facebook.com/Nawangdistrict/' },
    { id: 'f7', page_name: 'ตำรวจภูธรจังหวัดหนองบัวลำภู', embed_url: 'https://www.facebook.com/nbp191/' },
    { id: 'f8', page_name: 'สถานีตำรวจภูธรศรีบุญเรือง', embed_url: 'https://www.facebook.com/sriboonrueang.police/' },
    { id: 'f9', page_name: 'สมาคมกู้ภัยนเรศวรหนองบัวลำภู', embed_url: 'https://www.facebook.com/NaresuanRescueAssociation/' },
    { id: 'f10', page_name: 'สำนักงานสาธารณสุขจังหวัดหนองบัวลำภู', embed_url: 'https://www.facebook.com/nblp.pho/' },
    { id: 'f11', page_name: 'อบจ.หนองบัวลำภู', embed_url: 'https://www.facebook.com/www.nppao.go.th/' },
    { id: 'f12', page_name: 'ที่นี่ อำเภอสุวรรณคูหา', embed_url: 'https://www.facebook.com/SuwannakhuhaReview/' },
    { id: 'f13', page_name: 'OTOP Online หนองบัวลำภู', embed_url: 'https://www.facebook.com/OTOPNB/' },
  ],
  ad_banners: [
    { id: 'b1', title: 'ร้านกาแฟภูพาน', image_url: '', link: '#', position: 'side', price: 300, active: false, views: 0, owner: 'ตัวอย่าง' },
  ],
  app_config: [
    { id: 'config', promptpay_number: '', repo_url: GITHUB_URL, hero_image_url: '' },
  ],
}

// ---------------------------------------------------------------------------
// Backend: ถ้าตั้งค่า VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY จะใช้ Supabase
// (ข้อมูลแชร์ทุกเครื่อง) ไม่งั้นใช้ localStorage (โหมดเดโม)
// ---------------------------------------------------------------------------
const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null
export const IS_REMOTE = !!supabase

const COLLECTIONS = ['insider_tips', 'agency_sites', 'fb_posts', 'ad_banners', 'app_config']
const cache = {} // ข้อมูลล่าสุดของแต่ละ collection (อ่านแบบ sync ได้)
const loaded = {}
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

// อัปเดตข้อมูลเริ่มต้นในเครื่องที่เคยเปิดเว็บแล้ว (ทำครั้งเดียวต่อเวอร์ชัน)
const SEED_VERSION = 7 // v2: หน่วยงานในจังหวัด 11 แห่ง, v3: + พัฒนาชุมชนจังหวัด, v4: + ที่ว่าการอำเภอ, v5: + ตำรวจ กู้ภัย อปท., v6: ลบข่าวตัวอย่าง, v7: เพจ Facebook ในจังหวัด
function migrateLocal() {
  try {
    const v = Number(localStorage.getItem(PREFIX + 'seed_version') || 1)
    if (v >= SEED_VERSION) return
    const raw = localStorage.getItem(PREFIX + 'agency_sites')
    if (raw) {
      // ลบลิงก์ตัวอย่างเดิมที่เป็นเว็บส่วนกลาง (v1) แล้วเติมหน่วยงานที่ยังไม่มี (เทียบจาก URL / id)
      let old = JSON.parse(raw)
      if (v < 2) old = old.filter((r) => !['https://www.prd.go.th', 'https://www.mots.go.th', 'https://www.nongbualamphu.go.th'].includes(r.url))
      const have = new Set(old.map((r) => r.url.replace(/\/+$/, '')))
      const add = SEED.agency_sites.filter((r) => !have.has(r.url.replace(/\/+$/, '')) && !old.some((o) => o.id === r.id))
      localStorage.setItem(PREFIX + 'agency_sites', JSON.stringify([...old, ...add]))
    }
    if (v < 6) {
      // ลบข่าวตัวอย่าง (ภาพวาด ./img/*.svg) ที่ยังไม่ได้ถูกแก้ไข เก็บข่าวที่ผู้ใช้เพิ่มเองไว้
      const tipsRaw = localStorage.getItem(PREFIX + 'insider_tips')
      if (tipsRaw) {
        const sample = (t) => /^t[1-6]$/.test(t.id) && /^\.\/img\/(temple|lake|field|cave|market|road)\.svg$/.test(t.image_url || '')
        localStorage.setItem(PREFIX + 'insider_tips', JSON.stringify(JSON.parse(tipsRaw).filter((t) => !sample(t))))
      }
    }
    if (v < 7) {
      // เปลี่ยนเพจตัวอย่าง facebook.com/facebook เป็นเพจในจังหวัด (เก็บเพจที่ผู้ใช้เพิ่มเอง)
      const fbRaw = localStorage.getItem(PREFIX + 'fb_posts')
      if (fbRaw) {
        const mine = JSON.parse(fbRaw).filter((r) => !/facebook\.com\/facebook\/?$/.test(r.embed_url || ''))
        const have = new Set(mine.map((r) => (r.embed_url || '').replace(/\/+$/, '')))
        const add = SEED.fb_posts.filter((r) => !have.has(r.embed_url.replace(/\/+$/, '')) && !mine.some((m) => m.id === r.id))
        localStorage.setItem(PREFIX + 'fb_posts', JSON.stringify([...mine, ...add]))
      }
    }
    localStorage.setItem(PREFIX + 'seed_version', String(SEED_VERSION))
  } catch { /* ignore */ }
}

function readLocal(col) {
  migrateLocal()
  try {
    const raw = localStorage.getItem(PREFIX + col)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const seed = SEED[col] || []
  writeLocal(col, seed)
  return seed
}
function writeLocal(col, rows) {
  try { localStorage.setItem(PREFIX + col, JSON.stringify(rows)) } catch { /* ignore */ }
}

function read(col) {
  if (!IS_REMOTE) return readLocal(col)
  if (!loaded[col]) refresh(col)
  return cache[col] || []
}

function setRows(col, rows) {
  if (IS_REMOTE) cache[col] = rows
  else writeLocal(col, rows)
  emit()
}

export const remoteError = { message: '' }
const report = (error) => {
  if (!error) return false
  remoteError.message = error.message
  console.error('[supabase]', error)
  emit()
  return true
}

const inflight = {}
function refresh(col) {
  if (!IS_REMOTE) return Promise.resolve(emit())
  loaded[col] = true
  if (inflight[col]) return inflight[col] // กันยิง request ซ้ำซ้อน
  inflight[col] = (async () => {
    const { data, error } = await supabase.from(col).select('*').order('created_at', { ascending: false })
    inflight[col] = null
    if (report(error)) return
    remoteError.message = ''
    cache[col] = data || []
    emit()
  })()
  return inflight[col]
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export const db = {
  list: (col) => read(col),
  get: (col, id) => read(col).find((r) => r.id === id),
  refresh,
  async create(col, data) {
    const row = { ...data, id: uid(), created_at: data.created_at || new Date().toISOString() }
    setRows(col, [row, ...read(col)]) // optimistic
    if (IS_REMOTE) {
      const { id, created_at, ...payload } = row // ให้ฐานข้อมูลสร้าง id เอง
      if (data.created_at) payload.created_at = created_at
      const { error } = await supabase.from(col).insert(payload)
      report(error)
      await refresh(col)
    }
    return row
  },
  async update(col, id, patch) {
    setRows(col, read(col).map((r) => (r.id === id ? { ...r, ...patch } : r)))
    if (IS_REMOTE) {
      const { id: _i, created_at: _c, ...payload } = patch
      report((await supabase.from(col).update(payload).eq('id', id)).error)
      await refresh(col)
    }
  },
  async remove(col, id) {
    setRows(col, read(col).filter((r) => r.id !== id))
    if (IS_REMOTE) {
      report((await supabase.from(col).delete().eq('id', id)).error)
      await refresh(col)
    }
  },
  // นับยอดวิวโฆษณา (views++) — โหมด Supabase เรียกฟังก์ชัน increment_ad_view ที่ทำงานแบบ atomic
  async incrementViews(id) {
    setRows('ad_banners', read('ad_banners').map((r) => (r.id === id ? { ...r, views: (Number(r.views) || 0) + 1 } : r)))
    if (IS_REMOTE) report((await supabase.rpc('increment_ad_view', { ad_id: id })).error)
  },
  config: () => read('app_config').find((r) => r.id === 'config') || read('app_config')[0] || SEED.app_config[0],
  async saveConfig(patch) {
    const base = db.config()
    const row = { ...base, ...patch, id: 'config' }
    setRows('app_config', [row, ...read('app_config').filter((r) => r.id !== 'config')])
    if (IS_REMOTE) {
      const { created_at: _c, ...payload } = row
      report((await supabase.from('app_config').upsert(payload)).error)
      await refresh('app_config')
    }
  },
  // รีเซ็ต: โหมด local ล้าง localStorage กลับเป็นข้อมูลตัวอย่าง
  resetLocal() {
    COLLECTIONS.forEach((c) => localStorage.removeItem(PREFIX + c))
    emit()
  },
  subscribe(fn) {
    listeners.add(fn)
    const onStorage = (e) => e.key && e.key.startsWith(PREFIX) && fn()
    window.addEventListener('storage', onStorage)
    return () => { listeners.delete(fn); window.removeEventListener('storage', onStorage) }
  },
}

export function useCollection(col) {
  const [rows, setRowsState] = useState(() => db.list(col))
  useEffect(() => {
    const unsub = db.subscribe(() => setRowsState(db.list(col)))
    if (IS_REMOTE) refresh(col) // โหลดข้อมูลล่าสุดทุกครั้งที่หน้าเปิด
    else setRowsState(db.list(col))
    return unsub
  }, [col])
  return rows
}

// ---------------------------------------------------------------------------
// Auth: โหมด local ใช้รหัสผ่านแอดมิน (ตรวจด้วย SHA-256) / โหมด Supabase ใช้อีเมล + รหัสผ่านของ Supabase Auth
// ---------------------------------------------------------------------------
let session = null
let authReady = !IS_REMOTE
if (IS_REMOTE) {
  supabase.auth.getSession().then(({ data }) => { session = data.session; authReady = true; emit() })
  supabase.auth.onAuthStateChange((_e, s) => { session = s; authReady = true; emit() })
}

export const auth = {
  isLoggedIn() {
    if (IS_REMOTE) return !!session
    try { return localStorage.getItem(AUTH_KEY) === 'true' } catch { return false }
  },
  // คืนค่า '' ถ้าสำเร็จ หรือข้อความ error
  async login(password, email) {
    if (IS_REMOTE) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      session = data.session
      emit()
      return ''
    }
    // เทียบค่า SHA-256 กับที่เก็บในฐานข้อมูล (ตั้งค่าระบบ > เปลี่ยนรหัสผ่าน) หรือค่าเริ่มต้น
    const stored = db.config().admin_password_sha256 || ADMIN_PASSWORD_SHA256
    if ((await sha256(password || '')) !== stored) return 'รหัสผ่านไม่ถูกต้อง'
    localStorage.setItem(AUTH_KEY, 'true')
    return ''
  },
  async logout() {
    if (IS_REMOTE) { await supabase.auth.signOut(); session = null }
    else localStorage.removeItem(AUTH_KEY)
    emit()
  },
}

export function useAuth() {
  const [, force] = useState(0)
  useEffect(() => db.subscribe(() => force((n) => n + 1)), [])
  return { ready: authReady, loggedIn: auth.isLoggedIn() }
}

export function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'เมื่อสักครู่'
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`
  if (s < 86400) return `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} วันที่แล้ว`
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

export const districtShort = (name) => DISTRICTS.find((d) => d.name === name)?.short || name
