"""Fetch RSS feeds, find a cover image for every article and write news.json.

Runs on GitHub Actions every 15 minutes. The website reads news.json first,
so images show even for feeds (like Google News) that ship no pictures.
"""
import email.utils
import html
import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import requests

try:
    from googlenewsdecoder import gnewsdecoder
except Exception:  # pragma: no cover
    gnewsdecoder = None

G = "hl=th&gl=TH&ceid=TH:th"


def gtopic(t):
    return f"https://news.google.com/rss/headlines/section/topic/{t}?{G}"


def gsearch(q):
    return f"https://news.google.com/rss/search?q={requests.utils.quote(q + ' when:2d')}&{G}"


# category = tab on the website. Google feeds are decoded to the publisher link.
FEEDS = [
    {"id": "google-news-th", "name": "Google News", "category": "ข่าว", "url": ["https://news.google.com/rss?" + G], "limit": 20},
    {"id": "g-community", "name": "Google News", "category": "ข่าวชุมชน", "url": [gsearch("ชุมชน ชาวบ้าน")], "limit": 12},
    {"id": "g-local", "name": "Google News", "category": "ข่าวชุมชน", "url": [gsearch("อบต. เทศบาล ท้องถิ่น")], "limit": 8},
    {"id": "g-politics", "name": "Google News", "category": "การเมือง", "url": [gsearch("การเมือง รัฐบาล")], "limit": 10},
    {"id": "g-ent", "name": "Google News", "category": "บันเทิง", "url": [gtopic("ENTERTAINMENT")], "limit": 10},
    {"id": "g-sport", "name": "Google News", "category": "กีฬา", "url": [gtopic("SPORTS")], "limit": 10},
    {"id": "g-tech", "name": "Google News", "category": "ไอที", "url": [gtopic("TECHNOLOGY")], "limit": 10},
    {"id": "g-biz", "name": "Google News", "category": "WEALTH", "url": [gtopic("BUSINESS")], "limit": 10},
    {"id": "g-world", "name": "Google News", "category": "ต่างประเทศ", "url": [gtopic("WORLD")], "limit": 8},
    {"id": "g-health", "name": "Google News", "category": "สุขภาพ", "url": [gtopic("HEALTH")], "limit": 8},
    {"id": "g-horo", "name": "Google News", "category": "ดูดวง", "url": [gsearch("ดูดวง")], "limit": 8},
    {"id": "g-travel", "name": "Google News", "category": "ท่องเที่ยว", "url": [gsearch("ท่องเที่ยว")], "limit": 8},
    {"id": "g-eats", "name": "Google News", "category": "Eats", "url": [gsearch("ร้านอาหาร เมนู")], "limit": 8},
    {"id": "g-life", "name": "Google News", "category": "ไลฟ์สไตล์", "url": [gsearch("ไลฟ์สไตล์")], "limit": 8},
    {"id": "g-lotto", "name": "Google News", "category": "ลอตเตอรี่", "url": [gsearch("ตรวจหวย สลากกินแบ่ง")], "limit": 8},
    {"id": "thairath", "name": "Thairath", "category": "ข่าว", "url": ["https://www.thairath.co.th/rss/news"], "limit": 15},
    {"id": "bbc-thai", "name": "BBC Thai", "category": "ข่าว", "url": ["https://feeds.bbci.co.uk/thai/rss.xml"], "limit": 15},
    {"id": "matichon", "name": "มติชน", "category": "ข่าว", "url": ["https://www.matichon.co.th/feed"], "limit": 15},
    {"id": "khaosod", "name": "ข่าวสด", "category": "ข่าว", "url": ["https://www.khaosod.co.th/feed"], "limit": 15},
    {"id": "bbc-world", "name": "BBC World", "category": "ต่างประเทศ", "url": ["https://feeds.bbci.co.uk/news/world/rss.xml"], "limit": 8},
]
UA = {"User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "th-TH,th;q=0.9,en;q=0.8"}
NS = {"media": "http://search.yahoo.com/mrss/", "content": "http://purl.org/rss/1.0/modules/content/"}


def strip_html(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def img_in_html(s):
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', s or "", re.I)
    return m.group(1) if m else ""


def fix_url(u):
    u = html.unescape((u or "").strip())
    if u.startswith("//"):
        u = "https:" + u
    if u.startswith("http://"):
        u = "https://" + u[7:]
    return u if u.startswith("https://") else ""


def og_image(url):
    try:
        r = requests.get(url, headers=UA, timeout=12)
        page = r.text[:400000]
    except Exception:
        return "", url
    HINTS[url] = page_hint(page)
    for pat in (r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image',
                r'<meta[^>]+name=["\']twitter:image(?::src)?["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image'):
        m = re.search(pat, page, re.I)
        if m:
            return fix_url(m.group(1)), r.url
    return "", r.url


HINTS = {}


def page_hint(page):
    """Short text about the article (title + description) from its HTML head."""
    bits = []
    for pat in (r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']*)',
                r'<meta[^>]+(?:property|name)=["\'](?:og:)?description["\'][^>]+content=["\']([^"\']*)',
                r'<title[^>]*>([^<]*)'):
        m = re.search(pat, page, re.I)
        if m:
            bits.append(m.group(1))
    return strip_html(" ".join(bits))[:400]


def resolve_google(url):
    if gnewsdecoder is None or "news.google.com" not in url:
        return url
    try:
        res = gnewsdecoder(url, interval=1)
        if (res.get("success") or res.get("status")) and res.get("decoded_url"):
            return res["decoded_url"]
        print("  decode failed:", str(res.get("message", res))[:200])
    except Exception as e:
        print("  decode error:", e)
    return url


def parse_feed(feed):
    last = None
    for url in feed["url"]:
        try:
            r = requests.get(url, headers=UA, timeout=20)
            r.raise_for_status()
            root = ET.fromstring(r.content)
            print(f"  {feed['name']} OK via {url}")
            return parse_root(feed, root)
        except Exception as e:
            print(f"  {feed['name']} {url}: {str(e)[:150]}")
            last = e
    raise last


def parse_root(feed, root):
    out = []
    for it in root.iter("item"):
        title = strip_html(it.findtext("title"))
        if not title:
            continue
        desc = it.findtext("description") or ""
        cont = it.findtext("content:encoded", namespaces=NS) or ""
        img = ""
        for tag in ("media:content", "media:thumbnail"):
            el = it.find(tag, NS)
            if el is not None and el.get("url"):
                img = el.get("url")
                break
        if not img:
            for en in it.findall("enclosure"):
                if (en.get("type") or "image").startswith("image") and en.get("url"):
                    img = en.get("url")
                    break
        img = img or img_in_html(cont) or img_in_html(desc)
        publisher = ""
        if "news.google.com" in feed["url"][0]:
            src = it.find("source")
            publisher = (src.text or "").strip() if src is not None else ""
            m = re.search(r"\s+-\s+([^-]+)$", title)
            if m:
                publisher = publisher or m.group(1).strip()
                title = title[: m.start()]
            summary = f"ที่มา: {publisher}" if publisher else ""
        else:
            summary = strip_html(desc)
        published = ""
        pd = it.findtext("pubDate")
        if pd:
            try:
                published = email.utils.parsedate_to_datetime(pd).astimezone(timezone.utc).isoformat()
            except Exception:
                pass
        out.append({"feedId": feed["id"], "category": feed["category"], "source": feed["name"], "publisher": publisher, "title": title,
                    "link": (it.findtext("link") or "").strip(), "summary": summary[:300],
                    "content": strip_html(cont)[:3000], "imageUrl": fix_url(img), "published": published})
        if len(out) >= feed["limit"]:
            break
    return out


def fill_image(item):
    item["glink"] = item["link"] if "news.google.com" in item["link"] else ""
    old = CACHE.get(item["glink"]) if item["glink"] else None
    if old:
        item["link"], item["imageUrl"] = old.get("link", item["link"]), old.get("imageUrl", "")
        item["hint"] = old.get("hint", "")
        return item
    if item["glink"]:
        item["link"] = resolve_google(item["link"])
    if not item["imageUrl"] and item["link"]:
        page_url = item["link"]
        img, final = og_image(page_url)
        item["imageUrl"] = img
        item["hint"] = HINTS.get(page_url, "")
        if "news.google.com" in item["link"] and "news.google.com" not in final:
            item["link"] = final
    return item


CACHE = {}
TRUSTED = {"OWNER", "MEMBER", "COLLABORATOR"}


def form_field(body, label):
    m = re.search(r"^###\s*" + re.escape(label) + r"[^\n]*\n(.*?)(?=^###\s|\Z)", body or "", re.M | re.S)
    v = (m.group(1) if m else "").strip()
    return "" if v == "_No response_" else v


def community_items(prefix="[ชุมชน]", category="ข่าวชุมชน", publisher="ลีฟโพสต์ • ข่าวชุมชน", repo=None, uid_prefix="c"):
    """Community news the site owner posts as GitHub issues titled "[ชุมชน] ..."."""
    token = os.environ.get("GITHUB_TOKEN")
    repo = repo or os.environ.get("GITHUB_REPOSITORY")
    if not repo:
        return []
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    out = []
    try:
        r = requests.get(f"https://api.github.com/repos/{repo}/issues", headers=headers, timeout=20,
                         params={"state": "open", "per_page": 100, "sort": "created", "direction": "desc"})
        r.raise_for_status()
        issues = r.json()
    except Exception as e:
        print("community issues FAILED:", str(e)[:150])
        return []
    for iss in issues:
        title = (iss.get("title") or "").strip()
        if "pull_request" in iss or not title.startswith(prefix):
            continue
        if iss.get("author_association") not in TRUSTED:
            print("  skip issue from", iss.get("user", {}).get("login"))
            continue
        body = iss.get("body") or ""
        title = title[len(prefix):].strip()
        if not title:  # no headline typed: use the first line of the story
            first = re.sub(r"!\[[^\]]*\]\([^)]*\)|<img[^>]*>", "", form_field(body, "รายละเอียดข่าว")).strip().splitlines()
            title = strip_html(first[0])[:120] if first else ""
        if not title:
            continue
        imgs = re.findall(r"!\[[^\]]*\]\((https?://[^)\s]+)\)|<img[^>]+src=[\"']([^\"']+)", body)
        imgs = [a or b for a, b in imgs]
        img_field = form_field(body, "รูปภาพ")
        if not imgs:
            m = re.search(r"https?://\S+", img_field)
            imgs = [m.group(0)] if m else []
        detail = form_field(body, "รายละเอียดข่าว") or body
        detail = re.sub(r"!\[[^\]]*\]\([^)]*\)|<img[^>]*>", "", detail).strip()
        place = form_field(body, "พื้นที่ / ชุมชน")
        link = form_field(body, "ลิงก์ข่าวต้นฉบับ")
        out.append({"feedId": "community-own", "category": category, "source": "ลีฟโพสต์",
                    "publisher": publisher, "own": True, "uid": f"{uid_prefix}{iss['number']}", "title": title,
                    "link": link if link.startswith("http") else iss["html_url"],
                    "summary": (place + " • " if place else "") + strip_html(detail)[:200],
                    "content": detail[:8000], "place": place, "images": imgs[:10],
                    "imageUrl": imgs[0] if imgs else "", "published": iss.get("created_at", "")})
    print(f"community (own): {len(out)} items")
    return out


def main(feeds=None, out="news.json", own=None):
    feeds = feeds or FEEDS
    own = own if own is not None else community_items
    try:
        with open(out, encoding="utf-8") as f:
            for it in json.load(f).get("items", []):
                if it.get("glink") and "news.google.com" not in it.get("link", ""):
                    CACHE[it["glink"]] = it
    except Exception:
        pass
    items, seen = [], set()
    for feed in feeds:
        try:
            got = parse_feed(feed)
            print(f"{feed['category']} / {feed['name']}: {len(got)} items")
        except Exception as e:
            print(f"{feed['category']} / {feed['name']}: FAILED {str(e)[:150]}")
            continue
        for it in got:
            key = re.sub(r"\W+", "", it["title"])[:40]
            if key in seen:
                continue
            seen.add(key)
            items.append(it)
    google = [i for i in items if "news.google.com" in i["link"]]
    others = [i for i in items if "news.google.com" not in i["link"]]
    for n, it in enumerate(google):  # sequential: Google rate-limits the decoder
        fill_image(it)
    with ThreadPoolExecutor(8) as ex:
        others = list(ex.map(fill_image, others))
    items = own() + google + others
    with_img = sum(1 for i in items if i["imageUrl"])
    print(f"total {len(items)} items, {with_img} with images, {len(CACHE)} cached")
    if not items:
        sys.exit("no items fetched; keeping old news.json")
    data = {"updated": datetime.now(timezone.utc).isoformat(), "items": items}
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
