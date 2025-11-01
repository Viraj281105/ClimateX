# analyze_posts.py
import os
import pymongo
from dotenv import load_dotenv
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from db_connect import posts_collection  # <-- IMPORT from our central file

# --- 1. Load the Pre-trained Sentiment Analysis Model ---
# This model is fine-tuned for sentiment and works well on general text.
MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL)
    sentiment_pipeline = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
    print(f"✅ Loaded sentiment model '{MODEL}'.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit()


# --- 2. Main Analysis Logic ---
def analyze_posts():
    """
    Fetches processed posts (from Reddit/NewsAPI) that have not been
    analyzed for sentiment, analyzes them, and updates the database.
    """
    if posts_collection is None:
        print("❌ Cannot analyze posts, database not connected.")
        return

    # Find posts that are processed but have no sentiment yet.
    unprocessed_posts = posts_collection.find({
        "processed": True,
        "sentiment": None
    })

    bulk_operations = []
    count = 0
    print("🚀 Starting sentiment analysis...")
    for post in unprocessed_posts:
        cleaned_text = post.get("cleaned_text")
        
        # Handle cases where cleaned_text might be empty
        if not cleaned_text or len(cleaned_text.strip()) == 0:
            sentiment_result = {'label': 'neutral', 'score': 1.0}
        else:
            # News/Reddit posts can be long. We truncate to 512 characters
            # to ensure it fits in the model (which has a 514 token limit).
            truncated_text = cleaned_text[:512]
            try:
                # Run the sentiment analysis
                result = sentiment_pipeline(truncated_text)[0]
                sentiment_result = {'label': result['label'].lower(), 'score': result['score']}
            except Exception as e:
                print(f"Error analyzing post {post['_id']}: {e}")
                sentiment_result = {'label': 'error', 'score': 0.0}

        # Add the update operation to our bulk list
        bulk_operations.append(
            pymongo.UpdateOne(
                {"_id": post["_id"]},
                {"$set": {"sentiment": sentiment_result}}
            )
        )
        count += 1
    
    # Execute all the updates at once for better performance
    if bulk_operations:
        posts_collection.bulk_write(bulk_operations)
        print(f"\n✅ Successfully analyzed and updated {count} posts.")
    else:
        print("🤔 No new posts to analyze.")


if __name__ == "__main__":
    analyze_posts()