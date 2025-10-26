import tweepy
import pymongo
import os
from dotenv import load_dotenv

# --- 1. Load Environment Variables ---
load_dotenv()
BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
MONGO_URI = os.getenv("MONGO_URI")

# --- 2. Setup Database Connection ---
try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client.ClimateX  # Database name
    tweets_collection = db.tweets # Collection name
    print("✅ MongoDB connection successful.")
except pymongo.errors.ConnectionFailure as e:
    print(f"❌ Could not connect to MongoDB: {e}")
    exit()

# --- 3. Setup Twitter API v2 Client ---
# Authenticate with your Bearer Token
client_api = tweepy.Client(BEARER_TOKEN)

# --- 4. Define the Search Query ---
# This query searches for recent tweets in English, from India,
# containing one of the specified keywords.
# We exclude retweets to avoid duplicates.
search_query = "(#GreenEnergyIndia OR #EVSubsidy OR #CarbonTax OR #ClimatePolicy) -is:retweet lang:en"

print(f"🚀 Starting tweet collection for query: {search_query}")

# --- 5. Fetch and Store Tweets ---
try:
    # Use the search_recent_tweets method
    response = client_api.search_recent_tweets(
        query=search_query,
        tweet_fields=["created_at", "text", "lang", "geo"],
        max_results=100  # Fetch up to 100 tweets per run
    )

    if response.data:
        tweets_to_store = []
        for tweet in response.data:
            tweet_doc = {
                "tweet_id": tweet.id,
                "text": tweet.text,
                "created_at": tweet.created_at,
                "lang": tweet.lang,
                "geo": tweet.geo,
                "source": "twitter_api_v2",
                "processed": False, # A flag to track sentiment analysis status
                "sentiment": None
            }
            tweets_to_store.append(tweet_doc)

        # Insert the collected tweets into MongoDB
        result = tweets_collection.insert_many(tweets_to_store)
        print(f"✅ Successfully inserted {len(result.inserted_ids)} tweets into the database.")
    else:
        print("🤔 No new tweets found for this query.")

except tweepy.errors.TweepyException as e:
    print(f"❌ An error occurred with the Twitter API: {e}")