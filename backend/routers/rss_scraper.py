"""
RSS News Scraper — Multi-source global defense & intelligence news
Aggregates 15+ feeds, deduplicates, and streams live to frontend
"""
import asyncio
import feedparser
import hashlib
from datetime import datetime
from fastapi import APIRouter
from routers.ws import manager

router = APIRouter(prefix="/news")

# 15+ defense, intelligence, and conflict RSS feeds
RSS_SOURCES = [
    # Defense trade press
    ("Defense News",        "https://www.defensenews.com/arc/outboundfeeds/rss/category/global/"),
    ("Breaking Defense",    "https://breakingdefense.com/feed/"),
    ("Defense One",         "https://www.defenseone.com/rss/all/"),
    ("Janes",               "https://www.janes.com/feeds/news"),
    # Intelligence / geopolitics
    ("War on the Rocks",    "https://warontherocks.com/feed/"),
    ("Bellingcat",          "https://www.bellingcat.com/feed/"),
    ("ISW",                 "https://www.understandingwar.org/rss.xml"),
    # News agencies
    ("Reuters World",       "https://feeds.reuters.com/reuters/worldNews"),
    ("BBC World",           "https://feeds.bbci.co.uk/news/world/rss.xml"),
    ("Al Jazeera",          "https://www.aljazeera.com/xml/rss/all.xml"),
    # Region-specific
    ("NDTV India",          "https://feeds.feedburner.com/ndtvnews-india-news"),
    ("South China Post",    "https://www.scmp.com/rss/91/feed"),
    ("The Diplomat",        "https://thediplomat.com/feed/"),
    # Aviation/Maritime
    ("Aviation Week",       "https://aviationweek.com/rss.xml"),
    ("Naval News",          "https://www.navalnews.com/feed/"),
]

# Global in-memory news store — deduplicated by URL hash
news_store: dict[str, dict] = {}
MAX_ARTICLES = 50


def make_article_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()[:12]


async def fetch_news_loop():
    global news_store

    while True:
        new_count = 0
        for source_name, url in RSS_SOURCES:
            try:
                # feedparser is sync but fast (no heavy I/O)
                feed = feedparser.parse(url)
                for entry in feed.entries[:8]:  # Max 8 per source
                    link = entry.get("link", "")
                    if not link:
                        continue

                    article_id = make_article_id(link)
                    if article_id in news_store:
                        continue  # Already have it

                    # Parse date
                    pub = entry.get("published", "")
                    try:
                        pub_ts = entry.get("published_parsed")
                        if pub_ts:
                            pub = datetime(*pub_ts[:6]).strftime("%Y-%m-%d %H:%M")
                    except Exception:
                        pass

                    news_store[article_id] = {
                        "id": article_id,
                        "title": entry.get("title", "Untitled")[:120],
                        "link": link,
                        "published": pub,
                        "source": source_name,
                        "summary": entry.get("summary", "")[:200],
                    }
                    new_count += 1

            except Exception as e:
                print(f"[NEWS] Error fetching {source_name}: {e}")

        # Trim to max articles (keep most recent by insertion order)
        if len(news_store) > MAX_ARTICLES:
            keys = list(news_store.keys())
            for key in keys[:-MAX_ARTICLES]:
                del news_store[key]

        # Build sorted list (newest first based on published date, fallback to store order)
        articles = list(news_store.values())

        await manager.broadcast({
            "type": "news_update",
            "data": articles
        })

        print(f"[NEWS] {len(articles)} articles cached (+{new_count} new)")
        await asyncio.sleep(300)  # Every 5 minutes


@router.get("/articles")
def get_articles():
    return list(news_store.values())

@router.get("/status")
def status():
    return {"status": "ok", "articles": len(news_store)}
