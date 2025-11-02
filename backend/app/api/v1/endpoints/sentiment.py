import os
import json
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from app.db.mongo import posts_collection 
from app.db.mongo import client as mongo_client_instance 
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from collections import Counter

# Import ollama and the client instance needed for LLM generation
import ollama
try:
    ollama_client = ollama.Client()
    ollama_client.list()
except Exception:
    ollama_client = None

router = APIRouter()

# --- Helper Function to Check DB ---
def check_db_connection():
    if posts_collection is None:
        raise HTTPException(status_code=503, detail="Database connection not available.")

# --- Pydantic Models for Response Validation ---

class SentimentSummary(BaseModel):
    category: str
    count: int
    proportion: float

class SynthesisResponseModel(BaseModel):
    status: str
    executive_summary: str
    raw_total_analyzed: int

# --- CORE HELPER FUNCTIONS ---

def get_top_posts_titles(sentiment_label: str, sort_order: int) -> Optional[str]:
    """
    Retrieves the title of the top post for a given sentiment using modern pymongo methods.
    """
    post_cursor = posts_collection.find({"sentiment.label": sentiment_label}).sort("sentiment.score", sort_order).limit(1)
    post_list = list(post_cursor) 
    
    if post_list:
        return post_list[0].get('title')
    else:
        return "N/A"

def get_base_match_query(topic_filter: Optional[str], days_lookback: int) -> Dict:
    """Creates the base MongoDB $match query for filtering by time and topic."""
    date_boundary = datetime.utcnow() - timedelta(days=days_lookback)
    query = {
        "sentiment.label": {"$in": ["positive", "negative", "neutral"]},
        "created_at": {"$gte": date_boundary}
    }
    if topic_filter:
        query["topic"] = {"$regex": topic_filter, "$options": "i"}
    return query

def get_source_distribution_data(topic_filter: Optional[str], days_lookback: int) -> List[Dict]:
    """
    Retrieves sentiment counts grouped by source and topic for the synthesis report.
    (Used by /synthesis and /source_distribution)
    """
    check_db_connection()
    match_query = get_base_match_query(topic_filter, days_lookback)
    
    pipeline = [
        {"$match": match_query},
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


def generate_synthesis_report(summary_data: Dict, distribution_data: List[Dict]) -> str:
    """
    Uses the LLM (Mistral) to generate a descriptive synthesis of the sentiment data.
    """
    if ollama_client is None:
        return "System Error: LLM client is unavailable for synthesis."

    context = f"""
    --- OVERALL SENTIMENT SUMMARY ---
    Total Analyzed: {summary_data['total_analyzed_posts']}
    Negative Posts: {summary_data['negative']} ({summary_data['negative'] / summary_data['total_analyzed_posts']:.1%})
    Positive Posts: {summary_data['positive']} ({summary_data['positive'] / summary_data['total_analyzed_posts']:.1%})
    
    Top Negative Post Title: "{summary_data.get('top_neg_title', 'N/A')}"
    
    --- SOURCE AND TOPIC BREAKDOWN (Data reflects counts per source/topic) ---
    {json.dumps(distribution_data, indent=2)}
    
    ---
    """
    
    prompt = f"""
    You are a Strategic Communications Director. Analyze the following structured sentiment data regarding India's climate policy.
    
    CONTEXT DATA:
    {context}

    Write a concise **EXECUTIVE SUMMARY** (under 150 words) focused on two main actionable insights:
    1. **Primary Concern (Friction Point):** Identify the single most contentious topic/source combination and the overall distribution trend.
    2. **Strategic Implication:** Provide a clear, actionable communication strategy or policy recommendation to mitigate the identified friction point.
    """

    try:
        response = ollama_client.generate(
            model='mistral',
            prompt=prompt
        )
        return response['response'].strip()
    except Exception as e:
        return f"LLM Generation Error: Could not generate summary. ({e})"


# ----------------------------------------------------------------------
# --- NEW ENDPOINT: /synthesis ---
# ----------------------------------------------------------------------

@router.get("/synthesis", response_model=SynthesisResponseModel, tags=["Sentiment Analysis"])
def get_sentiment_synthesis(
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Generates a written executive summary report by synthesizing structured sentiment data
    from the database using an LLM.
    """
    check_db_connection()
    
    # 1. Get raw counts and totals 
    match_query = get_base_match_query(topic, days)
    pipeline_summary = [
        {"$match": match_query},
        {"$group": {"_id": "$sentiment.label", "count": {"$sum": 1}}}
    ]
    
    results_summary = list(posts_collection.aggregate(pipeline_summary))
    summary_data = {"positive": 0, "negative": 0, "neutral": 0}
    for res in results_summary:
        if res["_id"] in summary_data: summary_data[res["_id"]] = res["count"]
    
    total = sum(summary_data.values())
    
    if total == 0:
        return SynthesisResponseModel(
            status="no_data",
            executive_summary="No analyzed data found for the specified period.",
            raw_total_analyzed=0
        )
        
    # 2. Get detailed source distribution data
    distribution_data = get_source_distribution_data(topic, days)
    
    # 3. Add titles for context
    summary_data['total_analyzed_posts'] = total
    summary_data['top_neg_title'] = get_top_posts_titles('negative', sort_order=1) 
    summary_data['top_pos_title'] = get_top_posts_titles('positive', sort_order=-1) 
    
    # 4. Generate the report
    synthesis_report = generate_synthesis_report(summary_data, distribution_data)
    
    return SynthesisResponseModel(
        status="success",
        executive_summary=synthesis_report,
        raw_total_analyzed=total
    )


# ----------------------------------------------------------------------
# --- EXISTING ENDPOINTS (UPDATED TO BE DYNAMIC) ---
# ----------------------------------------------------------------------

@router.get("/summary")
def get_sentiment_summary(
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Provides a summary of post sentiments, filtered dynamically.
    """
    check_db_connection()
    match_query = get_base_match_query(topic, days)
    
    pipeline = [
        {"$match": match_query},
        {"$group": {"_id": "$sentiment.label", "count": {"$sum": 1}}}
    ]
    results = list(posts_collection.aggregate(pipeline))
    summary = {"positive": 0, "negative": 0, "neutral": 0}
    for res in results:
        if res["_id"] in summary: summary[res["_id"]] = res["count"]
    summary["total_analyzed_posts"] = sum(summary.values())
    return summary

@router.get("/trendline")
def get_sentiment_trendline(
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Provides sentiment counts grouped by day for the last X days, filtered dynamically.
    """
    check_db_connection()
    match_query = get_base_match_query(topic, days)
    
    pipeline = [
        {"$match": match_query},
        {"$project": {
            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "sentiment": "$sentiment.label"
        }},
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

@router.get("/wordcloud")
def get_wordcloud_data(
    sentiment_type: str = Query("positive", enum=["positive", "negative", "neutral"]),
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Provides the top 30 most frequent words for a given sentiment type, filtered dynamically.
    """
    check_db_connection()
    match_query = get_base_match_query(topic, days)
    
    # Filter by specific sentiment label
    match_query["sentiment.label"] = sentiment_type
    
    pipeline = [
        {"$match": match_query},
        {"$project": {"words": {"$split": ["$cleaned_text", " "]}}},
        {"$unwind": "$words"},
        {"$match": {"words": {"$ne": ""}}}, # Remove empty words
        {"$group": {"_id": "$words", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 30}
    ]
    results = list(posts_collection.aggregate(pipeline))
    return [{"word": item["_id"], "count": item["count"]} for item in results]

@router.get("/source_distribution")
def get_source_distribution(
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Provides sentiment counts grouped by source (Reddit, NewsAPI) and by topic, filtered dynamically.
    """
    # This endpoint now calls the helper function get_source_distribution_data, which does the heavy lifting.
    return get_source_distribution_data(topic, days)