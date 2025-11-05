# analyze_posts.py
import os
import pymongo
from dotenv import load_dotenv
from pymongo import UpdateOne
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from db_connect import posts_collection

# --- 1. Load the NEW Multilingual Sentiment Model ---
# This model supports 23 languages, including English and Hindi
MODEL = "tabularisai/multilingual-sentiment-analysis"
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL)
    sentiment_pipeline = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
    print(f"✅ Loaded multilingual sentiment model '{MODEL}'.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit()

# --- 2. Helper function to map 5-star to 3-label ---
def map_sentiment(model_output):
    """Maps the 5-category output to 3 categories."""
    label = model_output['label']
    score = model_output['score']
    
    if label in ["Very Negative", "Negative"]:
        return {"label": "negative", "score": score}
    elif label == "Neutral":
        return {"label": "neutral", "score": score}
    else: # Positive or Very Positive
        return {"label": "positive", "score": score}

# --- 3. Main Analysis Logic ---
def analyze_posts():
    if posts_collection is None:
        print("❌ Cannot analyze posts, database not connected.")
        return

    unprocessed_posts = posts_collection.find({
        "processed": True,
        "sentiment": None
    })

    bulk_operations = []
    count = 0
    print("🚀 Starting multilingual sentiment analysis...")
    for post in unprocessed_posts:
        cleaned_text = post.get("cleaned_text")
        
        if not cleaned_text or len(cleaned_text.strip()) == 0:
            sentiment_result = {'label': 'neutral', 'score': 1.0}
        else:
            truncated_text = cleaned_text[:512]
            try:
                # Run the analysis
                result = sentiment_pipeline(truncated_text)[0]
                # Map the 5-star result to our 3-label system
                sentiment_result = map_sentiment(result)
            except Exception as e:
                print(f"Error analyzing post {post['_id']}: {e}")
                sentiment_result = {'label': 'error', 'score': 0.0}

        bulk_operations.append(
            UpdateOne(
                {"_id": post["_id"]},
                {"$set": {"sentiment": sentiment_result}}
            )
        )
        count += 1
    
    if bulk_operations:
        posts_collection.bulk_write(bulk_operations)
        print(f"\n✅ Successfully analyzed and updated {count} multilingual posts.")
    else:
        print("🤔 No new posts to analyze.")

if __name__ == "__main__":
    analyze_posts()