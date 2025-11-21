# backend/app/api/v1/endpoints/sentiment.py
import os
import json
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from app.db.mongo import posts_collection
from app.db.mongo import client as mongo_client_instance
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from collections import Counter
import math

# Embedding providers
import ollama
from typing import Callable

# Optional fallback to sentence-transformers
_sentence_transformer = None
try:
    from sentence_transformers import SentenceTransformer
    _sentence_transformer = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    _sentence_transformer = None

# Try to initialize ollama client (may be None)
try:
    ollama_client = ollama.Client()
    ollama_client.list()
except Exception:
    ollama_client = None

router = APIRouter()

# ---------------------------
# Pydantic Models
# ---------------------------
class SentimentSummary(BaseModel):
    category: str
    count: int
    proportion: float

class SynthesisResponseModel(BaseModel):
    status: str
    executive_summary: str
    raw_total_analyzed: int

# ---------------------------
# Helpers: DB check
# ---------------------------
def check_db_connection():
    if posts_collection is None:
        raise HTTPException(status_code=503, detail="Database connection not available.")

# ---------------------------
# Embedding utilities
# ---------------------------
def embed_with_ollama(text: str) -> List[float]:
    """
    Use ollama to produce embeddings if available.
    Response shape depends on ollama; adapt as needed.
    """
    if not ollama_client:
        raise RuntimeError("Ollama client not available.")
    # Ollama's embed API may differ by version; wrap safely
    try:
        resp = ollama_client.embed(model="mistral", input=text)
        # Expecting something like {'embedding': [...]}
        if isinstance(resp, dict) and "embedding" in resp:
            return resp["embedding"]
        # Some versions return list directly
        if isinstance(resp, list):
            return resp
        # If response structure differs, try to extract any vector-like value
        for v in resp.values():
            if isinstance(v, list):
                return v
        raise RuntimeError("Unexpected ollama embed response format.")
    except Exception as e:
        raise RuntimeError(f"Ollama embed failed: {e}")

def embed_with_sentence_transformer(text: str) -> List[float]:
    if _sentence_transformer is None:
        raise RuntimeError("SentenceTransformer not available.")
    vec = _sentence_transformer.encode(text)
    # convert to plain python list of floats
    return vec.tolist() if hasattr(vec, "tolist") else list(map(float, vec))

def get_text_embedding(text: str) -> List[float]:
    """
    Unified wrapper: prefer ollama embeddings, fallback to sentence-transformers.
    Raises RuntimeError if no embedding provider is available.
    """
    if ollama_client is not None:
        try:
            return embed_with_ollama(text)
        except Exception:
            # fallback to sentence-transformers if available
            pass
    if _sentence_transformer is not None:
        return embed_with_sentence_transformer(text)
    raise RuntimeError("No embedding provider available (ollama or sentence-transformers).")

# ---------------------------
# Vector similarity helpers
# ---------------------------
def cosine_sim(a: List[float], b: List[float]) -> float:
    if a is None or b is None:
        return -1.0
    # compute dot / (norms)
    dot = 0.0
    na = 0.0
    nb = 0.0
    min_len = min(len(a), len(b))
    # use min_len to avoid index issues if vectors differ slightly in length
    for i in range(min_len):
        dot += a[i] * b[i]
        na += a[i] * a[i]
        nb += b[i] * b[i]
    if na == 0 or nb == 0:
        return -1.0
    return dot / (math.sqrt(na) * math.sqrt(nb))

# ---------------------------
# Core: Semantic selection of relevant documents
# ---------------------------
def _get_time_window_filter(days_lookback: int) -> Dict:
    date_boundary = datetime.utcnow() - timedelta(days=days_lookback)
    return {"created_at": {"$gte": date_boundary}}

def fetch_documents_by_vector_search(topic_embedding: List[float], days_lookback: int, top_k: int = 200) -> List[Dict[str, Any]]:
    """
    PRIMARY attempt: use MongoDB Atlas $vectorSearch (if available).
    If it fails (e.g., not supported), raise an exception so the caller can fallback.
    """
    check_db_connection()
    match_filter = _get_time_window_filter(days_lookback)
    # Attempt MongoDB vectorSearch aggregate stage
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "queryVector": topic_embedding,
                    "path": "embedding",
                    "numCandidates": max(top_k, 200),
                    "limit": top_k,
                    "score": {"$meta": "euclideanDistance"}  # or relevant score meta depending on server
                }
            },
            {"$match": match_filter},
            {"$project": {"title": 1, "cleaned_text": 1, "created_at": 1, "sentiment": 1, "source": 1, "topic": 1, "embedding": 1}}
        ]
        cursor = posts_collection.aggregate(pipeline)
        return list(cursor)
    except Exception as e:
        # bubble up so caller falls back
        raise RuntimeError(f"Vector search failed or not available: {e}")

def fetch_documents_by_semantic_fallback(topic: str, days_lookback: int, top_k: int = 200, candidate_limit: int = 2000) -> List[Dict[str, Any]]:
    """
    Safe fallback: fetch a manageable candidate set by time window,
    compute or use stored embeddings, compute cosine similarity, and return top_k docs.
    This works even without Atlas vector search.
    """
    check_db_connection()
    match_filter = _get_time_window_filter(days_lookback)
    # Candidate fetch: limit to candidate_limit most recent docs in time window
    cursor = posts_collection.find(match_filter, {"title":1, "cleaned_text":1, "created_at":1, "sentiment":1, "source":1, "topic":1, "embedding":1}).sort("created_at", -1).limit(candidate_limit)
    candidates = list(cursor)
    if not candidates:
        return []

    # Prepare query embedding
    try:
        query_embedding = get_text_embedding(topic)
    except Exception as e:
        # If embedding not available, fallback to simple regex title/topic match (best-effort)
        # This preserves old behaviour in worst-case environments
        regex = {"$regex": topic, "$options": "i"}
        return list(posts_collection.find({**match_filter, "$or":[{"title": regex}, {"topic": regex}] }).limit(top_k))

    # For each candidate, ensure embedding exists (compute if missing but limit operations)
    embeddings_missing = []
    for doc in candidates:
        if "embedding" not in doc or not isinstance(doc.get("embedding"), list):
            embeddings_missing.append(doc)
    # Compute embeddings for missing docs but cap the number to avoid huge load
    max_compute = 500
    if embeddings_missing:
        batch = embeddings_missing[:max_compute]
        for doc in batch:
            try:
                text_for_embedding = (doc.get("title","") or "") + " . " + (doc.get("cleaned_text","") or "")
                emb = get_text_embedding(text_for_embedding)
                # Update in DB asynchronously-ish: try to update the document with computed embedding
                try:
                    posts_collection.update_one({"_id": doc["_id"]}, {"$set": {"embedding": emb}})
                    doc["embedding"] = emb
                except Exception:
                    # ignore DB write errors; still use the embedding in-memory
                    doc["embedding"] = emb
            except Exception:
                doc["embedding"] = None

    # Compute similarities
    scored = []
    for doc in candidates:
        emb = doc.get("embedding")
        score = cosine_sim(query_embedding, emb) if emb else -1.0
        scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    top_docs = [d for s, d in scored[:top_k] if s is not None and s > -0.999]
    return top_docs

def get_relevant_documents(topic: Optional[str], days_lookback: int, top_k: int = 200) -> List[Dict[str, Any]]:
    """
    Public helper used by endpoints: returns a list of relevant document dicts
    filtered by the topic semantics and time window. If topic is None, returns
    the most recent top_k docs by time window.
    """
    check_db_connection()

    if not topic:
        # no topic: just return most recent posts in the window
        match_filter = _get_time_window_filter(days_lookback)
        cursor = posts_collection.find(match_filter, {"title":1, "cleaned_text":1, "created_at":1, "sentiment":1, "source":1, "topic":1}).sort("created_at", -1).limit(top_k)
        return list(cursor)

    # 1) Try Atlas $vectorSearch path
    try:
        query_embedding = get_text_embedding(topic)
        docs = fetch_documents_by_vector_search(query_embedding, days_lookback, top_k=top_k)
        if docs:
            return docs
    except Exception:
        # ignore and fallback
        pass

    # 2) Fallback to in-Python semantic ranking
    try:
        docs = fetch_documents_by_semantic_fallback(topic, days_lookback, top_k=top_k)
        return docs
    except Exception:
        # final fallback: regex-based legacy behaviour
        regex = {"$regex": topic, "$options": "i"}
        match_filter = _get_time_window_filter(days_lookback)
        cursor = posts_collection.find({**match_filter, "$or":[{"title": regex}, {"topic": regex}] }).sort("created_at", -1).limit(top_k)
        return list(cursor)

# ---------------------------
# Existing helper functions (ported/adapted)
# ---------------------------
def get_top_posts_titles_from_docs(docs: List[Dict], sentiment_label: str, sort_order: int = -1) -> str:
    """
    Return the title of the top doc in `docs` matching sentiment_label.
    sort_order: -1 -> highest score first, 1 -> lowest score first
    """
    filtered = [d for d in docs if d.get("sentiment", {}).get("label") == sentiment_label]
    if not filtered:
        return "N/A"
    # sort by sentiment.score if present
    try:
        filtered.sort(key=lambda x: x.get("sentiment", {}).get("score", 0), reverse=(sort_order < 0))
    except Exception:
        pass
    return filtered[0].get("title", "N/A")

def format_source_distribution_from_docs(docs: List[Dict]) -> List[Dict]:
    """
    Build the source/topic -> sentiment counts from a docs list.
    """
    counter = {}
    for d in docs:
        src = d.get("source", "unknown")
        top = d.get("topic", "unknown")
        label = d.get("sentiment", {}).get("label", "neutral")
        key = (src, top)
        if key not in counter:
            counter[key] = {"source": src, "topic": top, "positive": 0, "negative": 0, "neutral": 0}
        counter[key][label] = counter[key].get(label, 0) + 1
    return list(counter.values())

# ---------------------------
# LLM-based synthesis (kept largely unchanged, but uses docs list)
# ---------------------------
def generate_synthesis_report_from_docs(summary_data: Dict, distribution_data: List[Dict]) -> str:
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
    You are a Strategic Communications Director focused on India. Analyze the structured sentiment data below and produce a concise EXECUTIVE SUMMARY (under 150 words) with two actionable items:
    1) Primary Concern (the single most contentious topic/source combination)
    2) Strategic Implication (a clear policy/communications recommendation to mitigate it)

    CONTEXT DATA:
    {context}
    """

    try:
        response = ollama_client.generate(
            model='mistral',
            prompt=prompt
        )
        return response['response'].strip()
    except Exception as e:
        return f"LLM Generation Error: Could not generate summary. ({e})"

# ---------------------------
# API Endpoints (upgraded to use semantic search)
# ---------------------------

@router.get("/synthesis", response_model=SynthesisResponseModel, tags=["Sentiment Analysis"])
def get_sentiment_synthesis(
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Generates a written executive summary report by synthesizing structured sentiment data
    from the database using an LLM. This endpoint now supports arbitrary topics via semantic search.
    """
    check_db_connection()
    days = max(1, min(days, 90))  # safe clamp

    docs = get_relevant_documents(topic, days, top_k=300)
    total = len(docs)
    if total == 0:
        return SynthesisResponseModel(status="no_data", executive_summary="No analyzed data found for the specified period.", raw_total_analyzed=0)

    # counts
    summary_data = {"positive": 0, "negative": 0, "neutral": 0}
    for d in docs:
        lab = d.get("sentiment", {}).get("label")
        if lab in summary_data:
            summary_data[lab] += 1
    summary_data['total_analyzed_posts'] = total
    summary_data['top_neg_title'] = get_top_posts_titles_from_docs(docs, 'negative', sort_order=-1)
    summary_data['top_pos_title'] = get_top_posts_titles_from_docs(docs, 'positive', sort_order=-1)

    distribution_data = format_source_distribution_from_docs(docs)
    synthesis_report = generate_synthesis_report_from_docs(summary_data, distribution_data)

    return SynthesisResponseModel(status="success", executive_summary=synthesis_report, raw_total_analyzed=total)

@router.get("/summary")
def get_sentiment_summary(
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Provides a summary of post sentiments, filtered dynamically via semantic matching.
    """
    check_db_connection()
    days = max(1, min(days, 90))
    docs = get_relevant_documents(topic, days, top_k=500)
    summary = {"positive": 0, "negative": 0, "neutral": 0}
    for d in docs:
        lab = d.get("sentiment", {}).get("label")
        if lab in summary:
            summary[lab] += 1
    summary["total_analyzed_posts"] = sum(summary.values())
    return summary

@router.get("/trendline")
def get_sentiment_trendline(
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Provides sentiment counts grouped by day for the last X days, using semantically selected posts.
    """
    check_db_connection()
    days = max(1, min(days, 90))
    docs = get_relevant_documents(topic, days, top_k=1000)

    # aggregate in-Python to preserve order and format
    day_buckets = {}
    for d in docs:
        dt = d.get("created_at")
        if not dt:
            continue
        date_str = dt.strftime("%Y-%m-%d")
        if date_str not in day_buckets:
            day_buckets[date_str] = {"date": date_str, "positive": 0, "negative": 0, "neutral": 0}
        lab = d.get("sentiment", {}).get("label", "neutral")
        if lab in day_buckets[date_str]:
            day_buckets[date_str][lab] += 1
    # Sort by date
    sorted_days = [day_buckets[k] for k in sorted(day_buckets.keys())]
    return sorted_days

@router.get("/wordcloud")
def get_wordcloud_data(
    sentiment_type: str = Query("positive", enum=["positive", "negative", "neutral"]),
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Returns the top words for the requested sentiment type from semantically selected posts.
    """
    check_db_connection()
    days = max(1, min(days, 90))
    docs = get_relevant_documents(topic, days, top_k=2000)

    # Extract words from cleaned_text
    counter = Counter()
    for d in docs:
        if d.get("sentiment", {}).get("label") != sentiment_type:
            continue
        txt = d.get("cleaned_text", "") or ""
        # Some lightweight tokenization
        words = [w.strip() for w in txt.split() if w.strip()]
        for w in words:
            if len(w) > 2:
                counter[w.lower()] += 1
    top = counter.most_common(30)
    return [{"word": w, "count": c} for w, c in top]

@router.get("/source_distribution")
def get_source_distribution(
    topic: Optional[str] = Query(None, description="Filter results by a specific policy topic or keyword."),
    days: int = Query(30, description="Number of days to look back for data (max 30).")
):
    """
    Provides sentiment counts grouped by source (Reddit, NewsAPI) and by topic, filtered semantically.
    """
    check_db_connection()
    days = max(1, min(days, 90))
    docs = get_relevant_documents(topic, days, top_k=1000)
    return format_source_distribution_from_docs(docs)

# ---------------------------
# OPTIONAL: Migration helper to precompute embeddings for existing docs
# ---------------------------
def migrate_compute_embeddings(batch_size: int = 500, limit: Optional[int] = None):
    """
    Run once to compute embeddings for documents that lack them. This writes back to MongoDB.
    Use with caution on large collections.
    """
    check_db_connection()
    query = {"$or": [{"embedding": {"$exists": False}}, {"embedding": None}]}
    cursor = posts_collection.find(query, {"_id":1, "title":1, "cleaned_text":1}).limit(limit) if limit else posts_collection.find(query, {"_id":1, "title":1, "cleaned_text":1})
    count = 0
    for doc in cursor:
        text = (doc.get("title","") or "") + " . " + (doc.get("cleaned_text","") or "")
        try:
            emb = get_text_embedding(text)
            posts_collection.update_one({"_id": doc["_id"]}, {"$set": {"embedding": emb}})
            count += 1
            if count % batch_size == 0:
                print(f"Computed embeddings for {count} documents...")
        except Exception as e:
            print(f"Failed to embed doc {doc['_id']}: {e}")
    print(f"Migration complete. Embeddings written for {count} documents.")

# End of file
