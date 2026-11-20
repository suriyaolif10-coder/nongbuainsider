"""News for หนองบัว INSIDER (news.json): Nong Bua Lamphu local news.

Uses the same fetcher as LEAF POST, with Google News searches per district.
Your own stories: GitHub issues titled "[หนองบัว] ...", plus LEAF POST
community stories ("[ชุมชน] ...") that are about Nong Bua Lamphu.
"""
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(__file__))
import fetch_news as fn  # noqa: E402

G = "hl=th&gl=TH&ceid=TH:th"


def search(q, days=7):
    return f"https://news.google.com/rss/search?q={requests.utils.quote(q + f' when:{days}d')}&{G}"


def feed(fid, cat, q, limit=10, days=30):
    return {"id": fid, "name": "Google News", "category": cat, "url": [search(q, days)], "limit": limit}


# order matters: a story found by a district search keeps that district's tab
FEEDS = [
    feed("nb-mueang", "อ.เมือง", '"เมืองหนองบัวลำภู"'),
    feed("nb-naklang", "นากลาง", "นากลาง หนองบัวลำภู"),
    feed("nb-nonsang", "โนนสัง", "โนนสัง หนองบัวลำภู"),
    feed("nb-sribunruang", "ศรีบุญเรือง", "ศรีบุญเรือง"),
    feed("nb-suwannakhuha", "สุวรรณคูหา", "สุวรรณคูหา"),
    feed("nb-nawang", "นาวัง", "นาวัง หนองบัวลำภู"),
    feed("nb-travel", "ท่องเที่ยว", "เที่ยว หนองบัวลำภู"),
    feed("nb-farm", "เกษตร", "เกษตร หนองบัวลำภู"),
    feed("nb-all", "ข่าวหนองบัว", "หนองบัวลำภู", limit=30, days=7),
]

NB_WORDS = ("หนองบัวลำภู", "หนองบัว", "นากลาง", "โนนสัง", "ศรีบุญเรือง", "สุวรรณคูหา", "นาวัง")
PROVINCE = ("หนองบัวลำภู", "หนองบัว ลำภู", "จ.หนองบัวฯ", "Nong Bua Lamphu", "Nongbualamphu")
UNIQUE_DISTRICTS = ("โนนสัง", "ศรีบุญเรือง", "สุวรรณคูหา")
SHARED_NAMES = ("นากลาง", "นาวัง", "เมืองหนองบัว")  # also exist elsewhere: need "หนองบัว" too


def in_nong_bua(text):
    """True when a story is about Nong Bua Lamphu province."""
    if any(w in text for w in PROVINCE + UNIQUE_DISTRICTS):
        return True
    return "หนองบัว" in text and any(w in text for w in SHARED_NAMES)


def own():
    mine = fn.community_items("[หนองบัว]", "ข่าวชุมชน", "หนองบัว INSIDER")
    lp = "suriyaolif10-coder/leaf-post"  # stories sent through LEAF POST
    shared = fn.community_items("[หนองบัว]", "ข่าวชุมชน", "หนองบัว INSIDER", repo=lp, uid_prefix="lp")
    shared += [i for i in fn.community_items(repo=lp, uid_prefix="lp")
               if any(w in i["title"] + i.get("content", "") for w in NB_WORDS)]
    for i in shared:
        i["publisher"] = "หนองบัว INSIDER"
    seen, out = set(), []
    for i in mine + shared:
        if i["uid"] not in seen:
            seen.add(i["uid"])
            out.append(i)
    return out


if __name__ == "__main__":
    fn.CACHE.clear()
    try:  # stories cached before "hint" existed are looked up again once
        import json as _j
        with open("news.json", encoding="utf-8") as f:
            old = _j.load(f)
        old["items"] = [i for i in old.get("items", []) if "hint" in i or i.get("own")]
        with open("news.json", "w", encoding="utf-8") as f:
            _j.dump(old, f, ensure_ascii=False)
    except FileNotFoundError:
        pass
    fn.main(FEEDS, "news.json", own)
    # keep everything (so the next run can reuse decoded links) but mark
    # which stories are really about Nong Bua Lamphu; the site shows only those
    import json
    with open("news.json", encoding="utf-8") as f:
        data = json.load(f)
    for it in data["items"]:
        text = " ".join([it.get("title", ""), it.get("summary", ""), it.get("content", ""), it.get("hint", "")])
        it["nb"] = bool(it.get("own")) or in_nong_bua(text)
    print("in Nong Bua Lamphu:", sum(i["nb"] for i in data["items"]), "of", len(data["items"]))
    with open("news.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
