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
