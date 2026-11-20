// ตัวช่วยเรื่องข่าว: กรองเดือนปัจจุบัน, จัดอันดับยอดนิยม, ยอดวิว, พาดหัว AI สุ่ม
import { useEffect, useState } from 'react'
import { db } from '../db.js'

export const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
export const currentMonthLabel = (now = new Date()) => `${THAI_MONTHS[now.getMonth()]} ${now.getFullYear()}`

// เฉพาะข่าวเดือนปัจจุบัน
export function filterCurrentMonth(news, now = new Date()) {
  return news.filter((n) => {
    const d = new Date(n.created_at)
    return !isNaN(d) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
}

// ---------- ยอดวิว ----------
// ข่าวในเว็บ (insider_tips) เก็บ views ในฐานข้อมูล / ข่าวลิงก์ภายนอกเก็บในเครื่อง
const EXT_KEY = 'nongbua_ext_views'
const readExt = () => { try { return JSON.parse(localStorage.getItem(EXT_KEY) || '{}') } catch { return {} } }
const listeners = new Set()
export function addView(n) {
  if (!n) return
  if (n.href && !isInternal(n)) {
    const ext = readExt(); ext[n.id] = (ext[n.id] || 0) + 1
    try { localStorage.setItem(EXT_KEY, JSON.stringify(ext)) } catch { /* ignore */ }
    listeners.forEach((fn) => fn())
  } else {
    try { sessionStorage.setItem('nongbua_viewed_' + n.id, '1') } catch { /* */ }
    db.update('insider_tips', n.id, { views: (Number(n.views) || 0) + 1 })
  }
}
const isInternal = (n) => !String(n.id).startsWith('link-') && !String(n.id).startsWith('m-')
export function useExtViews() {
  const [ext, setExt] = useState(readExt)
  useEffect(() => {
    const fn = () => setExt(readExt())
    listeners.add(fn)
    const t = setInterval(fn, 30000) // รีเฟรชยอดวิวจริงทุก 30 วินาที
    return () => { listeners.delete(fn); clearInterval(t) }
  }, [])
  return ext
}
export const getViews = (n, ext) => (isInternal(n) ? Number(n.views) || 0 : ext[n.id] || 0)

// ยอดนิยม: ปักหมุดก่อน > ยอดวิวมากสุด > ใหม่สุด
export function rankPopular(news, ext) {
  return [...news].sort((a, b) =>
    (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
    getViews(b, ext) - getViews(a, ext) ||
    new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

// ---------- พาดหัว AI สุ่ม ----------
const PREFIX = ['ด่วน!', 'ล่าสุด', 'ชาวบ้านเผย', 'อัปเดต', 'หนองบัว INSIDER เผย', 'รู้ยัง?', 'ฮือฮา']
const SUFFIX = ['', '', 'ที่นี่', 'วันนี้', 'ล่าสุด']
const EMOJI = ['🔥', '⚡', '📍', '🚨', '✨']
const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length]
// r: ฟังก์ชันสุ่ม 0..1 (ใส่ seed ได้เพื่อให้พาดหัวคงที่ระหว่าง render)
export function aiRandomHeadline(title = '', district = '', r = Math.random) {
  const clean = String(title).replace(/^(ด่วน!|ล่าสุด|ชาวบ้านเผย|อัปเดต|หนองบัว INSIDER เผย|รู้ยัง\?|ฮือฮา)\s*/, '').replace(/\s*[🔥⚡📍🚨✨]$/u, '').trim()
  const where = district && !clean.includes(district) && !['ข่าวชุมชน', 'ข่าวหนองบัว'].includes(district) ? ` (อ.${district.replace('เมืองหนองบัวลำภู', 'เมือง')})` : ''
  const suf = pick(SUFFIX, r)
  return `${pick(PREFIX, r)} ${clean}${where}${suf ? ' ' + suf : ''} ${pick(EMOJI, r)}`.replace(/\s+/g, ' ').trim()
}
export function seeded(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000 }
}
