"""Pages for community stories (n/<uid>.html) and the homepage link preview."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import build_pages as bp  # noqa: E402

if __name__ == "__main__":
    bp.main()
    with open("news.json", encoding="utf-8") as f:
        items = [i for i in json.load(f).get("items", []) if i.get("nb")]
    bp.update_home_preview(items)
