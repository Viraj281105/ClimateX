# collect_posts.py
import os
import praw
import requests
from dotenv import load_dotenv
from db_connect import posts_collection # <-- IMPORT the collection
from datetime import datetime

# Load environment variables
load_dotenv()

# --- Reddit API Setup ---
reddit_client_id = os.getenv("REDDIT_CLIENT_ID")
reddit_secret = os.getenv("REDDIT_SECRET")
reddit_user_agent = "climateX_data_collector"

try:
    reddit = praw.Reddit(
        client_id=reddit_client_id,
        client_secret=reddit_secret,
        user_agent=reddit_user_agent
    )
    print("✅ Reddit connection successful.")
except Exception as e:
    print(f"❌ Reddit setup failed: {e}")

# --- NewsAPI Setup ---
news_api_key = os.getenv("NEWS_API_KEY")
news_url = "https://newsapi.org/v2/everything"

# --- Topics to Search ---
topics = [
    "climate change policy india",
    "renewable energy india",
    "electric vehicles india",
    "carbon tax india",
    "green energy india"
]

print("🌎 ClimateX Data Collector Started")
print("------------------------------------")

# --- Collect Data from Reddit ---
def collect_from_reddit():
    print("\n🚀 Collecting posts from Reddit...")
    if not reddit:
        print("❌ Reddit client not initialized. Skipping.")
        return

    for topic in topics:
        try:
            print(f"🔎 Searching Reddit for: {topic}")
            subreddit = reddit.subreddit("india+climate+environment")
            for submission in subreddit.search(topic, limit=50):
                post_data = {
                    "source": "Reddit",
                    "topic": topic,
                    "post_id": submission.id,
                    "title": submission.title,
                    "url": submission.url,
                    # --- FIX: Standardize date to a datetime object ---
                    "created_at": datetime.utcfromtimestamp(submission.created_utc),
                    "content": submission.selftext,
                    "processed": False,
                    "sentiment": None
                }
                posts_collection.update_one(
                    {"post_id": submission.id},
                    {"$set": post_data},
                    upsert=True
                )
        except Exception as e:
            print(f"❌ Reddit collection failed for {topic}: {e}")

# --- Collect Data from NewsAPI ---
def collect_from_newsapi():
    print("\n📰 Collecting news articles from NewsAPI...")
    if not news_api_key:
        print("❌ NEWS_API_KEY not found. Skipping NewsAPI.")
        return

    for topic in topics:
        params = { "q": topic, "apiKey": news_api_key, "language": "en", "pageSize": 50 }
        response = requests.get(news_url, params=params)
        data = response.json()

        if data.get("status") == "ok":
            for article in data["articles"]:
                news_data = {
                    "source": "NewsAPI",
                    "topic": topic,
                    "post_id": article["url"],
                    "title": article["title"],
                    "url": article["url"],
                    # --- FIX: Standardize date to a datetime object ---
                    "created_at": datetime.strptime(article["publishedAt"], "%Y-%m-%dT%H:%M:%SZ"),
                    "content": article.get("content", ""),
                    "processed": False,
                    "sentiment": None
                }
                posts_collection.update_one(
                    {"post_id": article["url"]},
                    {"$set": news_data},
                    upsert=True
                )
        else:
            print(f"⚠️ NewsAPI returned error: {data.get('message', 'Unknown error')}")

# --- Run Collections ---
if posts_collection is not None:
    collect_from_reddit()
    collect_from_newsapi()
    print("\n🎯 Data collection complete. Ready for preprocessing.")
else:
    print("❌ Cannot run collection, database not connected.")