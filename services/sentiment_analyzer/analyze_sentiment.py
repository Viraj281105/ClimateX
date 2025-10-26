import pymongo
import os
from dotenv import load_dotenv
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification

# --- 1. Load Environment Variables & Connect to DB ---
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client.ClimateX
    tweets_collection = db.tweets
    print("✅ MongoDB connection successful.")
except pymongo.errors.ConnectionFailure as e:
    print(f"❌ Could not connect to MongoDB: {e}")
    exit()

# --- 2. Load the Pre-trained Sentiment Analysis Model ---
# This model is specifically fine-tuned for sentiment in tweets.
# The first time you run this, it will download the model files (approx. 500MB).
MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL)
    # The pipeline simplifies the process of using the model for inference.
    sentiment_pipeline = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
    print(f"✅ Loaded sentiment model '{MODEL}'.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit()


# --- 3. Main Analysis Logic ---
def analyze_tweets():
    """
    Fetches processed tweets that have not been analyzed for sentiment,
    analyzes them, and updates the database.
    """
    # Find tweets that are processed but have no sentiment yet.
    unprocessed_tweets = tweets_collection.find({
        "processed": True,
        "sentiment": None
    })

    bulk_operations = []
    count = 0
    for tweet in unprocessed_tweets:
        cleaned_text = tweet.get("cleaned_text")
        
        # Handle cases where cleaned_text might be empty after preprocessing
        if not cleaned_text or len(cleaned_text.strip()) == 0:
            sentiment_result = {'label': 'neutral', 'score': 1.0}
        else:
            # The model expects text up to 512 tokens. We truncate for safety.
            truncated_text = cleaned_text[:512]
            try:
                # Run the sentiment analysis
                result = sentiment_pipeline(truncated_text)[0]
                sentiment_result = {'label': result['label'].lower(), 'score': result['score']}
            except Exception as e:
                print(f"Error analyzing tweet {tweet['_id']}: {e}")
                sentiment_result = {'label': 'error', 'score': 0.0}

        # Add the update operation to our bulk list
        bulk_operations.append(
            pymongo.UpdateOne(
                {"_id": tweet["_id"]},
                {"$set": {"sentiment": sentiment_result}}
            )
        )
        count += 1
    
    # Execute all the updates at once for better performance
    if bulk_operations:
        tweets_collection.bulk_write(bulk_operations)
        print(f"\n✅ Successfully analyzed and updated {count} tweets.")
    else:
        print("🤔 No new tweets to analyze.")


if __name__ == "__main__":
    analyze_tweets()