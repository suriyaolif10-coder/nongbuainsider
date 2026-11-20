# หนองบัว INSIDER (nongbuainsider)

**รู้ลึก รู้จริง เรื่องหนองบัวลำภู** — แพลตฟอร์มข่าวท้องถิ่น จ.หนองบัวลำภู ธีมดาร์ค พร้อมระบบหลังบ้านแยก

🔗 GitHub: https://github.com/suriyaolif10-coder/nongbuainsider

## ฟีเจอร์

### หน้าบ้าน (Public)
- ธีมดาร์ค `#0a0a0a` / `#121212` สีหลัก `#ff6a00`
- Header โลโก้ภูเขา + ค้นหาข่าว + ปุ่ม **+ เพิ่มข่าว** (พาไปหน้า Login)
- แท็บ: TOP, ข่าวชุมชน (เพจ Facebook), ข่าวหนองบัว และ 6 อำเภอ — เมืองหนองบัวลำภู, นากลาง, โนนสัง, ศรีบุญเรือง, สุวรรณคูหา, นาวัง + เมนู dropdown
- Hero Banner, สไลด์ข่าวเด่น (ปักหมุดได้, ปัดได้บนมือถือ), พื้นที่โฆษณา, ข่าวใหม่ล่าสุด ⚡, หน่วยงานราชการ
- โฆษณา 3 ตำแหน่ง `top | side | feed` นับยอดวิว (`views++`) ทุกครั้งที่แสดง

### หลังบ้าน (Admin) — `#/admin/login`
- รหัสผ่าน: กำหนดโดยเจ้าของเว็บ (โค้ดเก็บเฉพาะค่า SHA-256 ใน `src/db.js`, สถานะ login เก็บใน `localStorage`)
- เมนู: จัดการข่าว, หน่วยงาน, เพจ Facebook, โฆษณา, ตั้งค่าระบบ (CRUD ครบ)
- สรุปยอด: ยอดวิวรวม, รายได้รวม (views × price), โฆษณาที่เปิดอยู่
- ปุ่ม Logout

## Collections (localStorage, prefix `nongbua_`)
| collection | fields |
|---|---|
| `insider_tips` | title, district, image_url, content, source, featured |
| `agency_sites` | name, url, category |
| `fb_posts` | page_name, embed_url |
| `ad_banners` | title, image_url, link, position, price (300/500/800), active, views, owner |
| `app_config` | promptpay_number, repo_url, hero_image_url |

ข้อมูลข่าวเริ่มต้นเป็น **ข้อมูลตัวอย่าง** แก้ไข/ลบได้ในหลังบ้าน หรือกด "รีเซ็ตข้อมูลตัวอย่าง" ในหน้าตั้งค่า

## โหมดการทำงาน
| โหมด | เมื่อไหร่ | ข้อมูล | Login |
|---|---|---|---|
| **เดโม** | ไม่ได้ตั้งค่า Supabase | localStorage (เฉพาะเครื่องนั้น) | รหัสผ่านแอดมิน (SHA-256) |
| **ออนไลน์** | ตั้งค่า `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Supabase (ทุกคนเห็นเหมือนกัน) | อีเมล + รหัสผ่านของ Supabase Auth |

### ตั้งค่า Supabase (ฟรี)
1. สมัคร/สร้างโปรเจกต์ที่ https://supabase.com (เลือก Region: Singapore)
2. **SQL Editor** → วางไฟล์ [`supabase/schema.sql`](supabase/schema.sql) → Run
3. **Authentication → Users → Add user** สร้างบัญชีแอดมิน (อีเมล + รหัสผ่าน, ติ๊ก Auto Confirm)
4. กลับไป SQL Editor รัน: `insert into public.admin_users (email) values ('อีเมลแอดมิน');`
5. **Authentication → Sign In / Providers** ปิด "Allow new users to sign up" (กันคนนอกสมัคร)
6. **Project Settings → API** คัดลอก `Project URL` และ `anon public` key
7. ใส่ค่า:
   - เครื่องตัวเอง: คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่า
   - GitHub Pages: repo → **Settings → Secrets and variables → Actions → Variables** เพิ่ม `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` แล้วรัน workflow ใหม่

ความปลอดภัย: ทุกคนอ่านข้อมูลได้ แต่เพิ่ม/แก้/ลบได้เฉพาะอีเมลในตาราง `admin_users` (Row Level Security) ส่วนผู้เข้าชมทั่วไปทำได้แค่เพิ่มยอดวิวโฆษณาผ่านฟังก์ชัน `increment_ad_view` (`anon` key เปิดเผยได้ตามปกติของ Supabase)

## เริ่มใช้งาน
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # ไฟล์อยู่ใน dist/
```

Deploy: มี workflow `.github/workflows/deploy.yml` สำหรับ GitHub Pages (เปิด Settings → Pages → Source: GitHub Actions)

> หมายเหตุ: โหมดเดโมเก็บรหัสผ่านและข้อมูลฝั่ง browser เหมาะสำหรับทดลองเท่านั้น ใช้งานจริงให้ตั้งค่า Supabase

Tech: React 18 • Vite • Tailwind CSS • React Router (HashRouter) • Supabase (optional)

## ลงข่าวจากลิงก์ (ทุกคนเห็นเหมือนกัน)
แก้ไฟล์ [`content/news-links.txt`](content/news-links.txt) บน GitHub (ใช้มือถือได้: เปิดไฟล์ → ไอคอนดินสอ → Commit changes)
- บรรทัดละ 1 ลิงก์ ข่าวจากเว็บข่าว หรือโพสต์เพจ Facebook สาธารณะ
- ระบุอำเภอได้: `https://ลิงก์ข่าว | นากลาง` (ไม่ระบุ ระบบเดาจากหัวข้อ)
- GitHub Actions จะดึงหัวข้อ ภาพ คำโปรย มาแสดงภายใน 1–2 นาที และอัปเดตทุกชั่วโมง กดข่าวแล้วเปิดหน้าต้นทาง

## คัดข่าวเด่นจากแต่ละเพจ (ทุกคนเห็น)
หลังบ้าน → จัดการข่าว → ⭐ ดึงข่าวเด่นขึ้นสไลด์
1. กดชื่อเพจเพื่อเปิดเพจ เลือกโพสต์เด่น → แชร์ → คัดลอกลิงก์
2. วางลิงก์ → ดึงข้อมูล → ตรวจหัวข้อ/ภาพ/อำเภอ
3. กด 🌐 เผยแพร่ให้ทุกคนเห็น → หน้า GitHub เปิดพร้อมข้อมูล → กด Submit new issue
- ข่าวขึ้นเว็บใน 1–2 นาที หน้าแรกสุ่มข่าวเด่นเพจละ 1 ข่าว
- เอาออก: ปิด (Close) issue นั้นบน GitHub
- รับเฉพาะ issue ของเจ้าของ/ผู้ร่วมดูแล repo
