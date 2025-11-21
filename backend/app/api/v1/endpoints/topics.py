# backend/app/api/v1/endpoints/topics.py

from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from app.db.mongo import db, posts_collection
import ollama
import math

# Optional fallback to sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
    _embedder = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    _embedder = None

# Try to initialize Ollama
try:
    ollama_client = ollama.Client()
    ollama_client.list()
except Exception:
    ollama_client = None

router = APIRouter()

TOPICS_COLLECTION = db["semantic_topics"]


# -------------------------------
# Embedding helpers
# -------------------------------
def embed_text(text: str) -> List[float]:
    """Use Ollama embeddings, fallback to sentence-transformers."""
    # Try Ollama
    if ollama_client is not None:
        try:
            out = ollama_client.embed(model="mistral", input=text)
            if isinstance(out, dict) and "embedding" in out:
                return out["embedding"]
        except Exception:
            pass

    # Fallback
    if _embedder:
        vec = _embedder.encode(text)
        return vec.tolist()

    raise RuntimeError("No embedding provider available.")


def cosine_sim(a: List[float], b: List[float]) -> float:
    if not a or not b:
        return -1.0
    dot = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(x*x for x in b))
    if na == 0 or nb == 0:
        return -1.0
    return dot / (na * nb)


# -------------------------------
# 1. GET /topics  (All topics sorted by semantic density)
# -------------------------------
@router.get("/topics")
def get_all_topics():
    topics = list(TOPICS_COLLECTION.find({}, {"_id": 0}).sort("created_at", -1))
    return {"count": len(topics), "topics": topics}


# -------------------------------
# 2. GET /topics/recent  (last 72 hours)
# -------------------------------
@router.get("/topics/recent")
def get_recent_topics():
    cutoff = datetime.utcnow() - timedelta(hours=72)
    new_topics = list(
        TOPICS_COLLECTION.find({"created_at": {"$gte": cutoff}}, {"_id": 0})
        .sort("created_at", -1)
    )
    return {"count": len(new_topics), "recent_topics": new_topics}


# -------------------------------
# 3. GET /topics/similar?query=
# -------------------------------
@router.get("/topics/similar")
def get_similar_topics(
    query: str = Query(..., description="Search for similar topics"),
    k: int = Query(10, description="Number of results"),
):
    try:
        query_vec = embed_text(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    all_topics = list(TOPICS_COLLECTION.find({}))
    scored = []

    for t in all_topics:
        emb = t.get("embedding")
        if not emb:
            continue
        s = cosine_sim(query_vec, emb)
        scored.append((s, t))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_k = [t for s, t in scored[:k]]

    # Remove _id for frontend
    for t in top_k:
        t["_id"] = str(t["_id"])

    return {"query": query, "results": top_k}


# -------------------------------
# 4. GET /topics/popular  (rank by number of posts)
# -------------------------------
@router.get("/topics/popular")
def get_popular_topics(days: int = 14):
    days = max(1, min(days, 90))
    cutoff = datetime.utcnow() - timedelta(days=days)

    # Count number of posts containing each topic
    pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {"_id": "$topic", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]

    results = list(posts_collection.aggregate(pipeline))

    return {"window_days": days, "popular_topics": results}


# -------------------------------
# 5. GET /topics/trending
# Trending = change from previous 7 days
# -------------------------------
@router.get("/topics/trending")
def get_trending_topics():
    now = datetime.utcnow()

    # two windows
    cur_start = now - timedelta(days=7)
    prev_start = now - timedelta(days=14)

    pipeline = [
        {"$match": {"created_at": {"$gte": prev_start}}},
        {"$group": {
            "_id": {
                "topic": "$topic",
                "range": {
                    "$cond": [
                        {"$gte": ["$created_at", cur_start]},
                        "current",
                        "previous"
                    ]
                }
            },
            "count": {"$sum": 1}
        }},
        {"$group": {
            "_id": "$_id.topic",
            "current": {"$sum": {"$cond": [{"$eq": ["$_id.range", "current"]}, "$count", 0]}},
            "previous": {"$sum": {"$cond": [{"$eq": ["$_id.range", "previous"]}, "$count", 0]}}
        }},
        {"$project": {
            "topic": "$_id",
            "growth": {"$subtract": ["$current", "$previous"]},
            "current": 1,
            "previous": 1,
            "_id": 0
        }},
        {"$sort": {"growth": -1}},
        {"$limit": 20}
    ]

    trending = list(posts_collection.aggregate(pipeline))

    return {"trending": trending}
