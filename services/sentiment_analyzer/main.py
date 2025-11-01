# main.py
import os
from fastapi import FastAPI, Query
from db_connect import posts_collection # <-- Import the correct collection
from datetime import datetime, timedelta

# --- 1. Setup ---
app = FastAPI(
    title="ClimateX Sentiment Analysis API",
    description="Provides sentiment analysis results for Reddit/News posts.",
    version="1.0.0"
)

# --- 2. API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the ClimateX Sentiment Analysis API"}

@app.get("/api/sentiment/summary")
def get_sentiment_summary():
    """
    Provides a summary of post sentiments.
    """
    if not posts_collection: return {"error": "Database connection not available."}
    
    pipeline = [
        {"$match": {"sentiment.label": {"$in": ["positive", "negative", "neutral"]}}},
        {"$group": {"_id": "$sentiment.label", "count": {"$sum": 1}}}
    ]
    results = list(posts_collection.aggregate(pipeline))
    summary = {"positive": 0, "negative": 0, "neutral": 0}
    for res in results:
        if res["_id"] in summary: summary[res["_id"]] = res["count"]
    summary["total_analyzed_posts"] = sum(summary.values())
    return summary

@app.get("/api/sentiment/trendline")
def get_sentiment_trendline():
    """
    Provides sentiment counts grouped by day for the last 30 days.
    """
    if not posts_collection: return {"error": "Database connection not available."}
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    pipeline = [
        {"$match": {
            "sentiment.label": {"$in": ["positive", "negative", "neutral"]},
            "created_at": {"$gte": thirty_days_ago} # <-- This now works!
        }},
        {
            "$project": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "sentiment": "$sentiment.label"
            }
        },
        {"$group": {"_id": {"date": "$date", "sentiment": "$sentiment"}, "count": {"$sum": 1}}},
        {"$group": {
            "_id": "$_id.date",
            "sentiments": {"$push": {"sentiment": "$_id.sentiment", "count": "$count"}}
        }},
        {"$sort": {"_id": 1}}
    ]
    results = list(posts_collection.aggregate(pipeline))
    
    formatted_results = []
    for day_data in results:
        day_summary = {"date": day_data["_id"], "positive": 0, "negative": 0, "neutral": 0}
        for sentiment_info in day_data["sentiments"]:
            day_summary[sentiment_info["sentiment"]] = sentiment_info["count"]
        formatted_results.append(day_summary)
        
    return formatted_results

@app.get("/api/sentiment/wordcloud")
def get_wordcloud_data(sentiment_type: str = Query("positive", enum=["positive", "negative", "neutral"])):
    """
    Provides the top 30 most frequent words for a given sentiment type.
    """
    if not posts_collection: return {"error": "Database connection not available."}
    
    pipeline = [
        {"$match": {"sentiment.label": sentiment_type}},
        {"$project": {"words": {"$split": ["$cleaned_text", " "]}}},
        {"$unwind": "$words"},
        {"$match": {"words": {"$ne": ""}}}, # <-- Add this to remove empty words
        {"$group": {"_id": "$words", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 30}
    ]
    results = list(posts_collection.aggregate(pipeline))
    return [{"word": item["_id"], "count": item["count"]} for item in results]

@app.get("/api/sentiment/source_distribution")
def get_source_distribution():
    """
    Provides sentiment counts grouped by source (Reddit, NewsAPI)
    and by topic.
    """
    if not posts_collection: return {"error": "Database connection not available."}

    pipeline = [
        {"$match": {"sentiment.label": {"$in": ["positive", "negative", "neutral"]}}},
        {"$group": {
            "_id": {"source": "$source", "topic": "$topic", "sentiment": "$sentiment.label"},
            "count": {"$sum": 1}
        }},
        {"$group": {
            "_id": {"source": "$_id.source", "topic": "$_id.topic"},
            "sentiments": {"$push": {"sentiment": "$_id.sentiment", "count": "$count"}}
        }},
        {"$sort": {"_id.source": 1, "_id.topic": 1}}
    ]
    results = list(posts_collection.aggregate(pipeline))

    formatted_results = []
    for item in results:
        dist_summary = {
            "source": item["_id"]["source"],
            "topic": item["_id"]["topic"],
            "positive": 0, "negative": 0, "neutral": 0
        }
        for sentiment_info in item["sentiments"]:
            dist_summary[sentiment_info["sentiment"]] = sentiment_info["count"]
        formatted_results.append(dist_summary)
        
    return formatted_results