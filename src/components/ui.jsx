import { useState } from 'react'

// โลโก้ภูเขา 2 ยอด (ตามโลโก้ หนองบัว INSIDER)
export function MountainLogo({ className = 'h-8 w-8', color = '#ff6a00' }) {
  return (
    <svg viewBox="0 0 527 282" className={className} aria-hidden="true">
      <path
        fill={color}
        fillRule="evenodd"
        d="M0 282 162 70 240 143 337 0 527 282Z M95 238 167 140 210 190 178 238Z M325 85 340 80 442 238 417 238Z"
      />
    </svg>
  )
}

// ไอคอนภูเขาแบบเส้น (ใช้ใน Hero)
export function MountainOutline({ className = 'h-6 w-10' }) {
  return (
    <svg viewBox="0 0 60 30" className={className} fill="none" stroke="#ff6a00" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 28 17 8l7 7 10-13 24 26z" />
      <path d="M12 21l5-6 3 3" />
    </svg>
  )
}

export function Brand({ size = 'md' }) {
  const lg = size === 'lg'
  return (
    <span className={`flex items-center gap-2.5 font-display font-bold leading-none ${lg ? 'text-2xl' : 'text-[19px] sm:text-xl'}`}>
      <span className={`grid shrink-0 place-items-center rounded-xl bg-ink-800 ${lg ? 'h-12 w-12' : 'h-10 w-10'}`}>
        <MountainLogo className={lg ? 'h-6 w-9' : 'h-5 w-8'} />
      </span>
      <span className="whitespace-nowrap">
        <span className="text-white">หนองบัว</span>{' '}
        <span className="tracking-wide text-brand">INSIDER</span>
      </span>
    </span>
  )
}

// รูปภาพ + fallback กรณีลิงก์รูปเสีย
export function SafeImg({ src, alt = '', className = '' }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900 ${className}`}>
        <MountainLogo className="h-1/4 max-h-12 w-1/3 max-w-20 opacity-40" />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className={`object-cover ${className}`} />
}

export const Icon = {
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
  ),
  Chevron: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6" /></svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
  ),
  GitHub: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg>
  ),
}
