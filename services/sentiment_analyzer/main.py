import os
from fastapi import FastAPI
from pymongo import MongoClient
from dotenv import load_dotenv

# --- 1. Setup ---
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

# Create a FastAPI app instance
app = FastAPI(
    title="ClimateX Sentiment Analysis API",
    description="Provides sentiment analysis results for climate-related tweets.",
    version="1.0.0"
)

# Connect to MongoDB
try:
    client = MongoClient(MONGO_URI)
    db = client.ClimateX
    tweets_collection = db.tweets
    print("✅ MongoDB connection for API successful.")
except Exception as e:
    print(f"❌ Could not connect to MongoDB: {e}")
    client = None

# --- 2. Define the API Endpoint ---
@app.get("/api/sentiment/summary")
def get_sentiment_summary():
    """
    Provides a summary of tweet sentiments.
    This endpoint calculates the count of positive, negative, and neutral tweets.
    """
    if not client:
        return {"error": "Database connection not available."}

    try:
        # MongoDB Aggregation Pipeline to count sentiments efficiently
        pipeline = [
            {"$match": {"sentiment.label": {"$in": ["positive", "negative", "neutral"]}}},
            {"$group": {"_id": "$sentiment.label", "count": {"$sum": 1}}}
        ]
        results = list(tweets_collection.aggregate(pipeline))

        # Format the results into a clean dictionary
        summary = {
            "positive": 0,
            "negative": 0,
            "neutral": 0
        }
        for res in results:
            if res["_id"] in summary:
                summary[res["_id"]] = res["count"]
        
        total_tweets = sum(summary.values())
        summary["total_analyzed_tweets"] = total_tweets

        return summary

    except Exception as e:
        return {"error": str(e)}

# A simple root endpoint to confirm the API is running
@app.get("/")
def read_root():
    return {"message": "Welcome to the ClimateX Sentiment Analysis API"}