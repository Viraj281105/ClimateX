# preprocess_posts.py
import re
import spacy
from pymongo import UpdateOne
from db_connect import posts_collection # <-- IMPORT the collection

# --- 1. Load spaCy Model ---
try:
    nlp = spacy.load("en_core_web_sm")
    print("✅ spaCy model 'en_core_web_sm' loaded.")
except OSError:
    print("❌ spaCy model not found. Please run: python -m spacy download en_core_web_sm")
    exit()

# --- 2. Define the Text Cleaning Function ---
def clean_post_text(text):
    """
    Cleans raw post text by removing URLs, mentions, hashtags, and performing lemmatization.
    """
    if not text:
        return ""
    
    # ... (Your clean_post_text function is good, no changes needed) ...
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#', '', text)
    text = re.sub(r'[^a-z\s]', '', text)
    doc = nlp(text)
    cleaned_tokens = [
        token.lemma_ for token in doc
        if not token.is_stop and len(token.lemma_) > 2
    ]
    return " ".join(cleaned_tokens)

# --- 3. Main Processing Logic ---
def process_posts():
    """
    Fetches unprocessed posts, cleans them, and updates them in the database.
    """
    if posts_collection is None:
        print("❌ Cannot process posts, database not connected.")
        return

    unprocessed_posts = posts_collection.find({"processed": False})
    count = 0
    bulk_operations = []

    for post in unprocessed_posts:
        # Get content from NewsAPI (content) or Reddit (title/selftext)
        raw_text = post.get("content") or post.get("title")
        if raw_text:
            cleaned_text = clean_post_text(raw_text)

            bulk_operations.append(
                UpdateOne(
                    {"_id": post["_id"]},
                    {"$set": {"cleaned_text": cleaned_text, "processed": True}}
                )
            )
            count += 1

    if bulk_operations:
        posts_collection.bulk_write(bulk_operations)
        print(f"\n✅ Successfully cleaned and updated {count} posts.")
    else:
        print("🤔 No new posts to process.")

if __name__ == "__main__":
    process_posts()