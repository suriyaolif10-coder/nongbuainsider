"""Write one static page per community story (n/<uid>.html).

Facebook reads the og: tags of a link to build its preview, and it ignores
everything after "#", so each story needs its own page to show its own
photo and headline when shared.
"""
import hashlib
import html
import json
import os
import re
import time

SITE = os.environ.get("SITE_URL", "https://suriyaolif10-coder.github.io/nongbuainsider/")

TEMPLATE = """<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>{title} | หนองบัว INSIDER</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="หนองบัว INSIDER">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
{og_image}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../icon.png">
<style>
:root{{--bg:#fff;--fg:#111;--muted:#6b6b70;--line:#e6e6e8;--accent:#f26b2a}}
@media (prefers-color-scheme:dark){{:root{{--bg:#111;--fg:#f2f2f2;--muted:#9a9aa0;--line:#2a2a2e;--accent:#f26b2a}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font-family:"Noto Sans Thai",system-ui,sans-serif}}
.wrap{{max-width:720px;margin:0 auto}}
.bar{{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--line)}}
.bar img{{width:34px;height:34px;border-radius:8px}}
.bar a{{color:inherit;text-decoration:none;font-weight:800;font-size:18px;display:flex;align-items:center;gap:10px}}
.pics img{{display:block;width:100%;height:auto;margin-bottom:6px}}
h1{{font-size:24px;line-height:1.45;margin:14px 16px 6px}}
.m{{color:var(--muted);font-size:14px;margin:0 16px 14px}}
.body{{font-size:18px;line-height:1.8;margin:0 16px;white-space:pre-line;overflow-wrap:anywhere}}
.more{{display:block;margin:28px 16px 40px;padding:14px;text-align:center;border-radius:24px;background:var(--accent);color:#fff;font-weight:700;text-decoration:none}}
.src{{display:inline-block;margin:16px 16px 0;color:var(--accent);font-weight:700}}
</style>
</head>
<body>
<div class="wrap">
<div class="bar"><a href="../"><img src="../logo-mark.png" alt="" style="width:auto;height:26px;border-radius:0">หนองบัว INSIDER</a></div>
<div class="pics">{cover}</div>
<h1>{title}</h1>
<div class="m">{meta}</div>
<div class="body">{body}</div>
<div class="pics" style="margin-top:16px">{rest}</div>
{src}
<a class="more" href="../">อ่านข่าวอื่นๆ ที่หนองบัว INSIDER ›</a>
</div>
</body>
</html>
"""


def esc(s):
    return html.escape(s or "", quote=True)


def page_url(uid):
    return SITE.rstrip("/") + f"/n/{uid}.html"


def main():
    with open("news.json", encoding="utf-8") as f:
        items = json.load(f).get("items", [])
    try:  # หนองบัว INSIDER community stories get pages too
        with open("nongbua/news.json", encoding="utf-8") as f:
            have = {i.get("uid") for i in items if i.get("own")}
            items += [i for i in json.load(f).get("items", []) if i.get("own") and i.get("uid") not in have]
    except FileNotFoundError:
        pass
    os.makedirs("n", exist_ok=True)
    keep = set()
    for it in items:
        uid = it.get("uid")
        if not it.get("own") or not uid or not re.fullmatch(r"[a-z]{1,3}\d+", uid):
            continue
        imgs = it.get("images") or ([it["imageUrl"]] if it.get("imageUrl") else [])
        tags = [f'<img src="{esc(u)}" alt="">' for u in imgs]
        desc = re.sub(r"\s+", " ", it.get("content") or it.get("summary") or "")[:200]
        meta = " • ".join(x for x in [it.get("place"), "หนองบัว INSIDER", (it.get("published") or "")[:10]] if x)
        link = it.get("link") or ""
        src = f'<a class="src" href="{esc(link)}" rel="noopener">อ่านข่าวต้นฉบับ ›</a>' if link.startswith("http") and "/issues/" not in link else ""
        page = TEMPLATE.format(
            title=esc(it["title"]), desc=esc(desc), url=esc(page_url(uid)),
            og_image=f'<meta property="og:image" content="{esc(imgs[0])}">' if imgs else '<meta property="og:image" content="https://suriyaolif10-coder.github.io/nongbuainsider/og.jpg">',
            cover=tags[0] if tags else "", rest="".join(tags[1:]), meta=esc(meta),
            body=esc(it.get("content") or it.get("summary")), src=src)
        name = f"{uid}.html"
        keep.add(name)
        with open(os.path.join("n", name), "w", encoding="utf-8") as f:
            f.write(page)
    for name in os.listdir("n"):
        if name.endswith(".html") and name not in keep:
            os.remove(os.path.join("n", name))  # story was closed/deleted
    print(f"built {len(keep)} community pages")


STORY_TEMPLATE = """<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>{title} | หนองบัว INSIDER</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="หนองบัว INSIDER">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{source}">
<link rel="icon" href="../icon.png">
<style>
:root{{--bg:#fff;--fg:#111;--muted:#6b6b70;--line:#e6e6e8;--accent:#f26b2a;--bg2:#f4f4f5}}
@media (prefers-color-scheme:dark){{:root{{--bg:#111;--fg:#f2f2f2;--muted:#9a9aa0;--line:#2a2a2e;--accent:#f26b2a;--bg2:#1b1b1d}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font-family:"Noto Sans Thai",system-ui,sans-serif}}
a{{color:inherit;text-decoration:none}}
.wrap{{max-width:720px;margin:0 auto}}
.bar{{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--line)}}
.bar img{{width:34px;height:34px;border-radius:8px}}
.bar b{{font-weight:800;font-size:18px}}
.cover{{display:block;width:100%;height:auto;max-height:70vh;object-fit:cover;background:var(--bg2)}}
.cat{{display:inline-block;margin:14px 16px 0;background:var(--accent);color:#fff;font-size:13px;font-weight:700;padding:3px 10px;border-radius:12px}}
h1{{font-size:24px;line-height:1.45;margin:10px 16px 6px}}
.m{{color:var(--muted);font-size:14px;margin:0 16px 14px}}
.body{{font-size:18px;line-height:1.8;margin:0 16px;overflow-wrap:anywhere}}
.btn{{display:block;margin:22px 16px 0;padding:14px;text-align:center;border-radius:24px;background:var(--accent);color:#fff;font-weight:700}}
.btn2{{display:block;margin:10px 16px 0;padding:13px;text-align:center;border-radius:24px;border:1px solid var(--line);font-weight:700}}
h3{{margin:28px 16px 4px;font-size:19px}}
.it{{display:flex;gap:12px;padding:10px 16px}}
.it img{{width:84px;height:84px;object-fit:cover;border-radius:8px;flex:none;background:var(--bg2)}}
.it p{{margin:0;font-size:16px;line-height:1.5}}
footer{{padding:24px 16px 40px;color:var(--muted);font-size:13px;text-align:center}}
</style>
</head>
<body>
<div class="wrap">
<a class="bar" href="../"><img src="../logo-mark.png" alt="" style="width:auto;height:26px;border-radius:0"><b>หนองบัว INSIDER</b></a>
{cover}
<span class="cat">{cat}</span>
<h1>{title}</h1>
<div class="m">ที่มา: {who}</div>
<div class="body">{body}</div>
<a class="btn" href="{source}" rel="noopener">อ่านข่าวฉบับเต็มที่ {who} ›</a>
<a class="btn2" href="../">ดูข่าวอื่นๆ ที่หนองบัว INSIDER</a>
{more}
<footer>หนองบัว INSIDER รวบรวมหัวข้อข่าวพร้อมลิงก์ไปยังต้นฉบับ ลิขสิทธิ์เนื้อหาเป็นของสำนักข่าวต้นทาง</footer>
</div>
</body>
</html>
"""
KEEP_DAYS = 10


def story_id(link):
    return hashlib.sha1((link or "").encode("utf-8")).hexdigest()[:10]


def story_url(link):
    return SITE.rstrip("/") + f"/s/{story_id(link)}.html"


def build_story_pages(items):
    """One page per news story (s/<id>.html) so Facebook shows its own photo."""
    os.makedirs("s", exist_ok=True)
    try:
        with open("s/index.json", encoding="utf-8") as f:
            manifest = json.load(f)
    except Exception:
        manifest = {}
    now = int(time.time())
    stories = [i for i in items if not i.get("own") and i.get("link", "").startswith("http")
               and "news.google.com" not in i["link"]]
    for it in stories:
        sid = story_id(it["link"])
        who = it.get("publisher") or it.get("source") or ""
        summary = re.sub(r"\s+", " ", it.get("content") or it.get("summary") or "").strip()
        if summary.startswith("ที่มา:"):
            summary = ""
        same = [o for o in stories if o is not it and o.get("category") == it.get("category") and o.get("imageUrl")][:4]
        more = "".join(f'<a class="it" href="{story_id(o["link"])}.html"><img src="{esc(o["imageUrl"])}" alt="" loading="lazy"><p>{esc(o["title"])}</p></a>' for o in same)
        page = STORY_TEMPLATE.format(
            title=esc(it["title"]), desc=esc(summary[:200] or f"ที่มา: {who}"), url=esc(story_url(it["link"])),
            image=esc(it.get("imageUrl") or SITE + "og.jpg"), source=esc(it["link"]),
            cover=f'<img class="cover" src="{esc(it["imageUrl"])}" alt="">' if it.get("imageUrl") else "",
            cat=esc(it.get("category") or "ข่าว"), who=esc(who), body=esc(summary[:600]),
            more=f"<h3>ข่าว{esc(it.get('category') or '')}อื่นๆ</h3>{more}" if more else "")
        with open(f"s/{sid}.html", "w", encoding="utf-8") as f:
            f.write(page)
        manifest.setdefault(sid, now)
    for sid, t in list(manifest.items()):  # old pages stay a while so Facebook posts keep working
        if now - t > KEEP_DAYS * 86400:
            manifest.pop(sid)
            try:
                os.remove(f"s/{sid}.html")
            except FileNotFoundError:
                pass
    with open("s/index.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f)
    print(f"built {len(stories)} story pages ({len(manifest)} kept)")


def update_home_preview(items):
    """Homepage link preview shows the newest top story picture."""
    top = sorted([i for i in items if i.get("imageUrl") and not i.get("own")], key=lambda i: i.get("published", ""), reverse=True)
    if not top:
        return
    with open("index.html", encoding="utf-8") as f:
        page = f.read()
    new = re.sub(r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{esc(top[0]["imageUrl"])}">', page, count=1)
    new = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="ข่าวล่าสุด: {esc(top[0]["title"])}">', new, count=1)
    if new != page:
        with open("index.html", "w", encoding="utf-8") as f:
            f.write(new)


if __name__ == "__main__":
    main()
    with open("news.json", encoding="utf-8") as f:
        _items = json.load(f).get("items", [])
    build_story_pages(_items)
    update_home_preview(_items)
