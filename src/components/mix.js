// สุ่มข่าวล่าสุดจากแต่ละแหล่ง แล้ววนหยิบทีละแหล่ง (ทุกแหล่งได้ขึ้นสไลด์)
// ใช้ seed: ลำดับคงที่ระหว่างที่หน้าเปิดอยู่ จนกว่าจะกด "สุ่มใหม่"
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  // fmix32: กระจายบิตให้ค่าใกล้กันไม่เกาะกลุ่ม
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16
  return h >>> 0
}
const shuffle = (arr, seed, key) => [...arr].sort((a, b) => hash(seed + key(a)) - hash(seed + key(b)))

export function mixBySource(pool, { seed, perSource = 3, limit = 8 }) {
  const groups = {}
  for (const n of pool) (groups[n.source || 'อื่นๆ'] ||= []).push(n)
  // แต่ละแหล่ง: ข่าวล่าสุด perSource ข่าว (มีภาพก่อน) แล้วสลับลำดับภายในแหล่ง
  const queues = shuffle(Object.keys(groups), seed, (s) => 'src:' + s).map((src) => {
    const byDate = [...groups[src]].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    const top = [...byDate.filter((n) => n.image_url), ...byDate.filter((n) => !n.image_url)].slice(0, perSource)
    return shuffle(top, seed, (n) => 'id:' + n.id)
  })
  // วนหยิบทีละแหล่ง
  const out = []
  while (out.length < limit && queues.some((q) => q.length)) {
    for (const q of queues) if (q.length && out.length < limit) out.push(q.shift())
  }
  return out
}
