"""โพสต์ข่าวที่เพิ่มจากหลังบ้านลงเพจ Facebook อัตโนมัติ (Facebook Graph API)

ต้องตั้งค่าใน GitHub: Settings > Secrets and variables > Actions
  - Secret   FB_PAGE_TOKEN : Page access token ของเพจ (สิทธิ์ pages_manage_posts)
  - Variable FB_PAGE_ID    : ID ของเพจ
ถ้าไม่ได้ตั้งค่า สคริปต์จะข้าม (ไม่ทำอะไร)

- โพสต์เฉพาะข่าวของเว็บเอง (own) ที่ยังไม่เคยโพสต์ พร้อมลิงก์ไปหน้าข่าวบนเว็บ (มีภาพตัวอย่าง)
- จดข่าวที่โพสต์แล้วใน fb_posted.json กันโพสต์ซ้ำ
- รอบแรก (ยังไม่มีไฟล์) จดข่าวที่มีอยู่แล้วทั้งหมดไว้โดยไม่โพสต์ กันโพสต์ข่าวเก่าทีเดียวทั้งหมด
- โพสต์ไม่เกิน FB_MAX_PER_RUN ข่าวต่อรอบ (ค่าเริ่มต้น 3) เฉพาะข่าวไม่เกิน 3 วัน
"""
import json
import os
import sys
from datetime import datetime, timedelta, timezone

import requests

SITE = "https://suriyaolif10-coder.github.io/nongbuainsider/"
STATE = "fb_posted.json"
API = "https://graph.facebook.com/v21.0"
TAGS = "#หนองบัวINSIDER #หนองบัวลำภู #ข่าวหนองบัวลำภู"


def page_url(uid):
    return SITE.rstrip("/") + f"/n/{uid}.html"


def parse_time(s):
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception:
        return None


def message(it):
    summary = (it.get("summary") or "").strip()
    if len(summary) > 400:
        summary = summary[:397].rstrip() + "…"
    parts = [it["title"].strip()]
    if summary:
        parts.append(summary)
    parts.append("อ่านต่อ 👉 " + page_url(it["uid"]))
    parts.append(TAGS)
    return "\n\n".join(parts)


def main():
    page_id = os.environ.get("FB_PAGE_ID", "").strip()
    token = os.environ.get("FB_PAGE_TOKEN", "").strip()
    if not page_id or not token:
        print("Facebook: ยังไม่ได้ตั้ง FB_PAGE_ID / FB_PAGE_TOKEN — ข้าม")
        return 0
    max_posts = int(os.environ.get("FB_MAX_PER_RUN", "3") or 3)

    with open("news.json", encoding="utf-8") as f:
        items = [i for i in json.load(f).get("items", []) if i.get("own") and i.get("uid") and i.get("title")]

    first_run = not os.path.exists(STATE)
    state = {"posted": {}}
    if not first_run:
        with open(STATE, encoding="utf-8") as f:
            state = json.load(f)
    posted = state.setdefault("posted", {})

    if first_run:
        for it in items:
            posted[it["uid"]] = "existing"
        print(f"Facebook: รอบแรก จดข่าวที่มีอยู่ {len(items)} ข่าวไว้ (ไม่โพสต์ย้อนหลัง)")
    else:
        cutoff = datetime.now(timezone.utc) - timedelta(days=3)
        todo = [i for i in items if i["uid"] not in posted and (parse_time(i.get("published")) or cutoff) >= cutoff]
        todo.sort(key=lambda i: i.get("published") or "")  # เก่าก่อน ใหม่ทีหลัง
        for it in todo[:max_posts]:
            try:
                r = requests.post(f"{API}/{page_id}/feed", timeout=30,
                                  data={"message": message(it), "link": page_url(it["uid"]), "access_token": token})
                data = r.json()
                if r.ok and data.get("id"):
                    posted[it["uid"]] = data["id"]
                    print(f"Facebook: โพสต์แล้ว {it['uid']} -> {data['id']}")
                else:
                    err = (data.get("error") or {}).get("message", r.text)[:200]
                    print(f"Facebook: โพสต์ {it['uid']} ไม่สำเร็จ: {err}")
                    if r.status_code in (400, 401, 403) and "token" in err.lower():
                        break  # token ใช้ไม่ได้ หยุดรอบนี้
            except Exception as e:
                print(f"Facebook: โพสต์ {it['uid']} ผิดพลาด: {str(e)[:150]}")
        if len(todo) > max_posts:
            print(f"Facebook: เหลืออีก {len(todo) - max_posts} ข่าว โพสต์รอบถัดไป")

    with open(STATE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
