import pymongo
import os
import re
import spacy
from dotenv import load_dotenv

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

# --- 2. Load spaCy Model ---
# This model will be used for lemmatization and stopword removal.
try:
    nlp = spacy.load("en_core_web_sm")
    print("✅ spaCy model 'en_core_web_sm' loaded.")
except OSError:
    print("❌ spaCy model not found. Please run: python -m spacy download en_core_web_sm")
    exit()


# --- 3. Define the Text Cleaning Function ---
def clean_tweet_text(text):
    """
    Cleans raw tweet text by removing URLs, mentions, hashtags, and performing lemmatization.
    """
    # Convert to lowercase
    text = text.lower()
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    # Remove user mentions (@username)
    text = re.sub(r'@\w+', '', text)
    # Remove hashtag symbol but keep the text
    text = re.sub(r'#', '', text)
    # Remove punctuation and special characters
    text = re.sub(r'[^a-z\s]', '', text)

    # Process text with spaCy
    doc = nlp(text)

    # Lemmatize and remove stopwords and short tokens
    cleaned_tokens = [
        token.lemma_ for token in doc
        if not token.is_stop and len(token.lemma_) > 2
    ]

    return " ".join(cleaned_tokens)


# --- 4. Main Processing Logic ---
def process_tweets():
    """
    Fetches unprocessed tweets, cleans them, and updates them in the database.
    """
    # Find tweets where 'processed' is False
    unprocessed_tweets = tweets_collection.find({"processed": False})

    count = 0
    # Create a list of operations to perform in bulk
    bulk_operations = []
    for tweet in unprocessed_tweets:
        raw_text = tweet.get("text")
        if raw_text:
            cleaned_text = clean_tweet_text(raw_text)
            
            # Add an update operation to our list
            bulk_operations.append(
                pymongo.UpdateOne(
                    {"_id": tweet["_id"]},
                    {
                        "$set": {
                            "cleaned_text": cleaned_text,
                            "processed": True # Mark as processed
                        }
                    }
                )
            )
            count += 1
            
    if bulk_operations:
        # Execute all the update operations at once
        tweets_collection.bulk_write(bulk_operations)
        print(f"\n✅ Successfully cleaned and updated {count} tweets.")
    else:
        print("🤔 No new tweets to process.")


if __name__ == "__main__":
    process_tweets()