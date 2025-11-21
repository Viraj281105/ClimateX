# sentiment_inference_light.py
"""
Lightweight sentiment inference (VADER + TextBlob).
Fast, CPU-friendly. Good for immediate coverage.
Writes back to posts_collection:
  sentiment: { label: "positive|neutral|negative", score: float }
  sentiment_model: "light"
"""

import os
from datetime import datetime
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob
from pymongo import UpdateOne
from db_connect import posts_collection

# -----------------------
analyzer = SentimentIntensityAnalyzer()
BATCH_SIZE = 200

def classify(text: str):
    if not text or len(text.strip()) < 5:
        return {"label": "neutral", "score": 0.0}
    try:
        # VADER works well on social media / short text
        vader_score = analyzer.polarity_scores(text)["compound"]
    except Exception:
        vader_score = 0.0
    try:
        blob_score = TextBlob(text).sentiment.polarity
    except Exception:
        blob_score = 0.0

    # weighted fusion
    final_score = (0.7 * vader_score) + (0.3 * blob_score)

    if final_score > 0.2:
        label = "positive"
    elif final_score < -0.2:
        label = "negative"
    else:
        label = "neutral"

    return {"label": label, "score": round(float(final_score), 4)}

def run_light_inference():
    if posts_collection is None:
        print("Database connection not available.")
        return

    query = {"processed": True, "sentiment": None}
    cursor = posts_collection.find(query, {"cleaned_text":1}).batch_size(BATCH_SIZE)

    ops = []
    updated = 0

    for doc in cursor:
        cleaned = doc.get("cleaned_text") or doc.get("light_clean_text") or ""
        result = classify(cleaned)
        result_meta = {
            "sentiment": result,
            "sentiment_model": "light",
            "sentiment_updated_at": datetime.utcnow()
        }
        ops.append(UpdateOne({"_id": doc["_id"]}, {"$set": result_meta}))
        updated += 1

        if len(ops) >= BATCH_SIZE:
            posts_collection.bulk_write(ops)
            ops = []

    if ops:
        posts_collection.bulk_write(ops)

    print(f"Light sentiment inference complete. Updated {updated} posts.")

if __name__ == "__main__":
    run_light_inference()
