# collect_posts.py
import os
import time
import json
import praw
import requests
from dotenv import load_dotenv
from datetime import datetime
from db_connect import posts_collection, db

# ===============================
# 1. LOAD ENVIRONMENT
# ===============================
load_dotenv()

LOGS_DIR = "logs"
os.makedirs(LOGS_DIR, exist_ok=True)

# ===============================
# 2. REDDIT API SETUP
# ===============================
reddit = None
try:
    reddit = praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_SECRET"),
        user_agent="ClimateX Data Collector"
    )
    print(" [OK] Reddit connected.")
except Exception as e:
    print(f"[ERR] Reddit setup failed: {e}")


# ===============================
# 3. NEWS API SETUP
# ===============================
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
NEWS_URL = "https://newsapi.org/v2/everything"
if not NEWS_API_KEY:
    print(" [WARN] NEWS_API_KEY missing. News collection skipped automatically.")


# ===============================
# 4. BASELINE (Fallback) TOPICS
# ===============================
BASELINE_TOPICS = [
    "climate change india", "renewable energy india", "electric vehicles india",
    "carbon tax india", "green energy india", "national solar mission",
    "net zero india", "coal mining india", "transport emissions india",
    "highway policy india", "bharatmala project", "smart cities mission india",
    "water management india", "ganga action plan", "national water mission",
    "air quality india", "waste management india"
]

# Hindi fallback
HINDI_BASELINE = [
    "जलवायु परिवर्तन भारत",
    "अक्षय ऊर्जा भारत",
    "इलेक्ट्रिक वाहन भारत",
    "प्रदूषण नियंत्रण भारत",
    "नमामि गंगे",
    "स्मार्ट सिटी मिशन",
    "जल जीवन मिशन"
]

# ===============================
# 5. LOAD SEMANTIC TOPICS FROM DB
# ===============================
TOPICS_COLLECTION = db["semantic_topics"]

def load_active_topics():
    """
    Pulls all semantic-discovered topics from DB.
    Falls back to baseline if DB empty.
    """
    records = list(TOPICS_COLLECTION.find({}, {"topic": 1}))
    semantic_topics = [rec["topic"] for rec in records]

    if semantic_topics:
        print(f" [OK] Loaded {len(semantic_topics)} semantic topics.")
        return semantic_topics
    else:
        print(" [INFO] No semantic topics found. Using baseline.")
        return BASELINE_TOPICS + HINDI_BASELINE


# ===============================
# 6. CANONICAL TOPIC NORMALIZER
# ===============================
def canonical_topic(text: str) -> str:
    """
    Prevent small variations from creating duplicate clusters.
    """
    t = text.strip().lower()
    t = t.replace("#", "").replace("  ", " ")
    return t


# ===============================
# 7. REDDIT COLLECTION
# ===============================
def collect_from_reddit(topics):
    if reddit is None:
        print(" [WARN] Reddit client unavailable. Skipping Reddit collection.")
        return

    print("\n=== Collecting from Reddit ===")

    subreddit = reddit.subreddit("india+climate+environment+delhi+mumbai+bangalore")

    for topic in topics:
        canonical = canonical_topic(topic)
        print(f"\n [Reddit] Searching for: {canonical}")

        try:
            for submission in subreddit.search(canonical, limit=40):
                post_data = {
                    "source": "Reddit",
                    "topic": canonical,
                    "post_id": submission.id,
                    "title": submission.title,
                    "url": submission.url,
                    "created_at": datetime.utcfromtimestamp(submission.created_utc),
                    "content": submission.selftext,
                    "processed": False,
                    "sentiment": None,
                    "language": "en"
                }

                posts_collection.update_one(
                    {"post_id": submission.id},
                    {"$set": post_data},
                    upsert=True
                )
                time.sleep(0.7)  # rate-limiting safety

        except Exception as e:
            print(f" [ERR] Reddit fetch failed for '{topic}': {e}")


# ===============================
# 8. NEWSAPI COLLECTION
# ===============================
def collect_from_newsapi(topics):
    if not NEWS_API_KEY:
        return

    print("\n=== Collecting from NewsAPI ===")

    for topic in topics:
        canonical = canonical_topic(topic)
        print(f"\n [NewsAPI] Topic: {canonical}")

        params = {
            "q": canonical,
            "language": "en",       # tighten relevance
            "apiKey": NEWS_API_KEY,
            "pageSize": 50,
            "sortBy": "publishedAt"
        }

        try:
            resp = requests.get(NEWS_URL, params=params)
            data = resp.json()

            if data.get("status") != "ok":
                print(f" [WARN] NewsAPI issue: {data.get('message')}")
                continue

            for article in data["articles"]:
                news_data = {
                    "source": "NewsAPI",
                    "topic": canonical,
                    "post_id": article["url"],
                    "title": article["title"],
                    "url": article["url"],
                    "created_at": datetime.strptime(article["publishedAt"], "%Y-%m-%dT%H:%M:%SZ"),
                    "content": article.get("content", ""),
                    "processed": False,
                    "sentiment": None,
                    "language": article.get("language", "en")
                }

                posts_collection.update_one(
                    {"post_id": article["url"]},
                    {"$set": news_data},
                    upsert=True
                )

            time.sleep(1.1)  # respect API limits

        except Exception as e:
            print(f" [ERR] NewsAPI fetch failed: {e}")


# ===============================
# 9. RUN EVERYTHING
# ===============================
if __name__ == "__main__":
    all_topics = load_active_topics()

    print("\n========= ClimateX Collector Started =========")
    print(f" Tracking {len(all_topics)} topics (semantic + baseline)")

    collect_from_reddit(all_topics)
    collect_from_newsapi(all_topics)

    print("\n========= Data Collection Completed =========")
