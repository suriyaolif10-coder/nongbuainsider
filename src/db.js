// ชั้นข้อมูลสำหรับ collections: agency_sites, ad_banners, insider_tips, fb_posts, app_config
// ใช้ Supabase เมื่อตั้งค่าไว้ ไม่งั้นใช้ localStorage (API จำลอง)
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const PREFIX = 'nongbua_'
const AUTH_KEY = PREFIX + 'admin_auth'
// เก็บเฉพาะค่า SHA-256 ของรหัสผ่าน (ไม่เก็บรหัสจริงในโค้ด)
// เปลี่ยนรหัส: รัน  printf '%s' 'รหัสใหม่' | sha256sum  แล้วนำค่ามาใส่แทน
const ADMIN_PASSWORD_SHA256 = '2f5d4f358d3d2474fcfc6040bbb954ae0f7974e95c7661f96c09dc652106ed16'
async function sha256(text) {
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
  insider_tips: [
    {
      id: 't1', featured: true, district: 'สุวรรณคูหา', image_url: './img/temple.svg', source: 'ทอล์คนิวส์ ออนไลน์', created_at: ago(13),
      title: 'ชาวสุวรรณคูหาร่วมใจจัดงานบุญประเพณี แห่เทียนพรรษาสืบสานวัฒนธรรมอีสาน',
      content: 'ตัวอย่างข่าว: ประชาชนในพื้นที่อำเภอสุวรรณคูหาร่วมกันจัดงานบุญประเพณีประจำปี มีการแห่ขบวนเทียนพรรษาและการแสดงทางวัฒนธรรมของชุมชน',
    },
    {
      id: 't2', district: 'เมืองหนองบัวลำภู', image_url: './img/lake.svg', source: 'หนองบัว INSIDER', created_at: ago(2),
      title: 'หนองบัวบานสะพรั่ง จุดเช็คอินใหม่ใจกลางเมืองหนองบัวลำภู',
      content: 'ตัวอย่างข่าว: บึงบัวในเขตอำเภอเมืองเริ่มบานเต็มพื้นที่ นักท่องเที่ยวและชาวบ้านแวะถ่ายรูปช่วงเช้าและเย็น',
    },
    {
      id: 't3', district: 'นากลาง', image_url: './img/field.svg', source: 'เพจข่าวนากลาง', created_at: ago(3),
      title: 'เกษตรกรนากลางเริ่มเกี่ยวข้าวนาปี คาดผลผลิตดีกว่าปีก่อน',
      content: 'ตัวอย่างข่าว: เกษตรกรในอำเภอนากลางเริ่มฤดูเก็บเกี่ยวข้าวนาปี หลังปริมาณฝนเพียงพอตลอดฤดูกาล',
    },
    {
      id: 't4', district: 'นาวัง', image_url: './img/cave.svg', source: 'หนองบัว INSIDER', created_at: ago(5),
      title: 'เที่ยวถ้ำนาวัง สัมผัสหินงอกหินย้อยกลางเทือกเขาภูพาน',
      content: 'ตัวอย่างข่าว: แหล่งท่องเที่ยวทางธรรมชาติในอำเภอนาวัง เปิดให้นักท่องเที่ยวเข้าชมในช่วงปลายฝนต้นหนาว',
    },
    {
      id: 't5', district: 'ศรีบุญเรือง', image_url: './img/market.svg', source: 'ศรีบุญเรืองนิวส์', created_at: ago(1),
      title: 'ถนนคนเดินศรีบุญเรือง เปิดพื้นที่สินค้าชุมชนทุกวันเสาร์',
      content: 'ตัวอย่างข่าว: ชุมชนศรีบุญเรืองจัดถนนคนเดินจำหน่ายสินค้าพื้นเมืองและอาหารท้องถิ่นทุกสัปดาห์',
    },
    {
      id: 't6', district: 'โนนสัง', image_url: './img/road.svg', source: 'หนองบัว INSIDER', created_at: ago(0.2),
      title: 'แจ้งเตือนผู้ใช้ทาง ซ่อมผิวถนนสายหลักโนนสัง ช่วงกลางคืน',
      content: 'ตัวอย่างข่าว: หน่วยงานที่เกี่ยวข้องแจ้งปิดช่องจราจรบางส่วนเพื่อซ่อมแซมผิวถนน ขอให้ผู้ใช้รถใช้ถนนระมัดระวัง',
    },
  ],
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
  ],
  fb_posts: [
    { id: 'f1', page_name: 'หนองบัว INSIDER', embed_url: 'https://www.facebook.com/facebook' },
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
const SEED_VERSION = 4 // v2: หน่วยงานในจังหวัด 11 แห่ง, v3: + พัฒนาชุมชนจังหวัด, v4: + ที่ว่าการอำเภอ 6 อำเภอ
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
    const row = { ...data, id: uid(), created_at: new Date().toISOString() }
    setRows(col, [row, ...read(col)]) // optimistic
    if (IS_REMOTE) {
      const { id, created_at, ...payload } = row // ให้ฐานข้อมูลสร้าง id / created_at เอง
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
    if ((await sha256(password || '')) !== ADMIN_PASSWORD_SHA256) return 'รหัสผ่านไม่ถูกต้อง'
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
