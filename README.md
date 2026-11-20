# หนองบัว INSIDER

รู้ลึก รู้จริง เรื่องหนองบัวลำภู — ข่าวท้องถิ่น จ.หนองบัวลำภู

เว็บ: https://suriyaolif10-coder.github.io/nongbuainsider/

- ข่าวอัปเดตอัตโนมัติด้วย GitHub Actions (`.github/workflows/site.yml`): ค้นข่าวจาก Google News แยกตามอำเภอ
  แล้วแสดงเฉพาะข่าวที่เกี่ยวกับจังหวัดหนองบัวลำภู (`scripts/fetch_nongbua.py`)
- หลังบ้าน `admin.html` (ปุ่ม "+ เพิ่มข่าว" บนเว็บ): ต้องใส่รหัสผ่าน แล้วใส่ GitHub token ของเจ้าของเว็บครั้งเดียวต่อเครื่อง
  (Fine-grained token เฉพาะ repo นี้: Contents + Issues = Read and write)
  - เพิ่ม/ลบข่าว (อัปโหลดรูปได้) — บันทึกเป็น issue `[หนองบัว] ...` ที่สคริปต์ข่าวอ่าน
  - แบนเนอร์หน้าแรก (`banner.jpg`) และโฆษณา (`ads.json`) เพิ่ม/แก้/ลบ/เปิดปิด อัปโหลดรูปได้
  - รูปที่อัปโหลดเก็บใน `uploads/`

## โพสต์ข่าวลงเพจ Facebook อัตโนมัติ
ข่าวที่เพิ่มจากหลังบ้านจะถูกโพสต์ลงเพจหลังเว็บอัปเดต (`scripts/post_facebook.py`) พร้อมลิงก์หน้าข่าวบนเว็บ
ตั้งค่าที่ repo → Settings → Secrets and variables → Actions:
- Secrets: `FB_PAGE_TOKEN` = Page access token (สิทธิ์ `pages_manage_posts`, `pages_read_engagement`)
- Variables: `FB_PAGE_ID` = ID ของเพจ, `FB_MAX_PER_RUN` (ไม่บังคับ ค่าเริ่มต้น 3)
- รอบแรกจะจดข่าวเดิมไว้โดยไม่โพสต์ย้อนหลัง, ข่าวที่โพสต์แล้วจดใน `fb_posted.json`
