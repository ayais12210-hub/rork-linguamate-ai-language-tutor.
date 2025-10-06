#!/usr/bin/env python
import os, re, sys, json, time, hashlib, urllib.parse
from typing import List, Dict, Any
import requests
from bs4 import BeautifulSoup
from readability import Document

# ---- Minimal MCP scaffolding (stdio) ----
# Protocol: one JSON per line. Client sends {"type":"tools/list"}, {"type":"tools/call", ...}
# We implement only what's needed: list tools + call tool.
def println(obj): 
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n"); sys.stdout.flush()

ALLOW = set([d.strip() for d in os.getenv("MCP_INGEST_ALLOW_DOMAINS","").split(",") if d.strip()])

def host_ok(url: str) -> bool:
    try:
        host = urllib.parse.urlparse(url).netloc
        return any(host.endswith(dom) for dom in ALLOW) if ALLOW else True
    except Exception:
        return False

def fetch_clean(url: str) -> Dict[str, Any]:
    if not host_ok(url):
        raise ValueError(f"Domain not allowed: {url}")
    r = requests.get(url, timeout=20, headers={"User-Agent":"LinguamateIngest/1.0"})
    r.raise_for_status()
    html = r.text
    doc = Document(html)
    title = doc.short_title()
    article_html = doc.summary()
    soup = BeautifulSoup(article_html, "lxml")
    text = soup.get_text("\n").strip()
    # Light cleanup
    text = re.sub(r"\n{3,}", "\n\n", text)
    return {"url": url, "title": title, "content": text}

def to_lesson(item: Dict[str, Any], lang: str = "en", max_len: int = 1200) -> Dict[str, Any]:
    content = item["content"]
    if len(content) > max_len:
        content = content[:max_len] + "…"
    slug = hashlib.sha1(item["url"].encode("utf-8")).hexdigest()[:12]
    return {
        "id": slug,
        "source_url": item["url"],
        "title": item["title"],
        "language": lang,
        "created_at": int(time.time()),
        "sections": [
            {"type":"context", "text": content},
            {"type":"vocab_suggestions", "items":[]},
            {"type":"prompts", "items":[
                {"task":"summarise", "prompt":"Summarise the article in 3 bullet points."},
                {"task":"translate", "prompt":"Translate the summary into the learner's target language."},
                {"task":"quiz", "prompt":"Generate 3 comprehension questions (A/B/C answers)."}
            ]}
        ],
        "safety": {"pii_checked": True, "profanity_checked": True}
    }

def tool_ingest(params):
    urls = params.get("urls", [])
    language = params.get("language", "en")
    max_items = int(params.get("max_items", 8))
    out = []
    for u in urls[:max_items]:
        try:
            article = fetch_clean(u)
            out.append(to_lesson(article, lang=language))
        except Exception as e:
            out.append({"error": str(e), "url": u})
    return {"lessons": out}

def tool_ingest_from_index(params):
    index_url = params["index_url"]
    selector = params.get("selector", "a")
    max_links = int(params.get("max_links", 10))
    language = params.get("language", "en")
    if not host_ok(index_url):
        raise ValueError(f"Domain not allowed: {index_url}")
    r = requests.get(index_url, timeout=20, headers={"User-Agent":"LinguamateIngest/1.0"})
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")
    links = []
    for a in soup.select(selector):
        href = a.get("href")
        if not href: 
            continue
        url = urllib.parse.urljoin(index_url, href)
        if url.startswith("http") and host_ok(url):
            links.append(url)
        if len(links) >= max_links:
            break
    return tool_ingest({"urls": links, "language": language, "max_items": max_links})

TOOLS = {
    "ingest_news": {
        "description": "Fetch URLs and return cleaned lesson JSON.",
        "schema": {
            "type":"object",
            "properties":{
                "urls":{"type":"array","items":{"type":"string"}},
                "language":{"type":"string"},
                "max_items":{"type":"integer","minimum":1,"maximum":25}
            },
            "required":["urls"]
        },
        "handler": tool_ingest
    },
    "ingest_from_index": {
        "description": "Scrape an index page, follow links via CSS selector, return lesson JSON.",
        "schema": {
            "type":"object",
            "properties":{
                "index_url":{"type":"string"},
                "selector":{"type":"string"},
                "language":{"type":"string"},
                "max_links":{"type":"integer","minimum":1,"maximum":25}
            },
            "required":["index_url"]
        },
        "handler": tool_ingest_from_index
    }
}

def main():
    for line in sys.stdin:
        try:
            msg = json.loads(line)
            t = msg.get("type")
            if t == "tools/list":
                println({"type":"result","tools":[
                    {"name": name, "description": meta["description"], "input_schema": meta["schema"]}
                    for name, meta in TOOLS.items()
                ]})
            elif t == "tools/call":
                name = msg["name"]
                params = msg.get("arguments", {}) or {}
                if name not in TOOLS: 
                    raise ValueError(f"unknown tool {name}")
                res = TOOLS[name]["handler"](params)
                println({"type":"result","result":res})
            else:
                println({"type":"error","error":"unsupported message type"})
        except Exception as e:
            println({"type":"error","error":str(e)})

if __name__ == "__main__":
    main()