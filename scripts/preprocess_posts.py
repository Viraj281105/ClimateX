# preprocess_posts.py
import re
import spacy
from pymongo import UpdateOne
from db_connect import posts_collection
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

# Enforce consistent results from langdetect
DetectorFactory.seed = 0

# --- 1. Load spaCy Model (for English only) ---
try:
    nlp_en = spacy.load("en_core_web_sm")
    print("✅ spaCy English model 'en_core_web_sm' loaded.")
except OSError:
    print("❌ spaCy model not found. Please run: python -m spacy download en_core_web_sm")
    exit()

# --- 2. Define Cleaning Functions ---
def basic_clean(text):
    """A simple cleaner for non-English text."""
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text) # Remove URLs
    text = re.sub(r'@\w+', '', text) # Remove mentions
    text = re.sub(r'#', '', text) # Remove hashtag symbol
    text = re.sub(r'\s+', ' ', text).strip() # Remove newlines/extra spaces
    return text

def english_deep_clean(text):
    """The full spaCy pipeline for English text."""
    text = basic_clean(text)
    text = re.sub(r'[^a-z\s]', '', text) # Remove all non-letters
    
    doc = nlp_en(text)
    cleaned_tokens = [
        token.lemma_ for token in doc
        if not token.is_stop and len(token.lemma_) > 2
    ]
    return " ".join(cleaned_tokens)

# --- 3. Main Processing Logic ---
def process_posts():
    if posts_collection is None:
        print("❌ Cannot process posts, database not connected.")
        return

    unprocessed_posts = posts_collection.find({"processed": False})
    count = 0
    bulk_operations = []

    for post in unprocessed_posts:
        raw_text = post.get("content") or post.get("title")
        if not raw_text or len(raw_text.strip()) < 20: # Skip very short/empty text
            continue

        try:
            # --- NEW: Language Detection ---
            lang = detect(raw_text)
            
            if lang == 'en':
                cleaned_text = english_deep_clean(raw_text)
            else:
                cleaned_text = basic_clean(raw_text)
            
            bulk_operations.append(
                UpdateOne(
                    {"_id": post["_id"]},
                    {"$set": {
                        "cleaned_text": cleaned_text,
                        "language": lang, # Store the detected language
                        "processed": True
                    }}
                )
            )
            count += 1

        except LangDetectException:
            print(f"⚠️ Could not detect language for post {post['_id']}, skipping.")
        except Exception as e:
            print(f"Error processing post {post['_id']}: {e}")

    if bulk_operations:
        posts_collection.bulk_write(bulk_operations)
        print(f"\n✅ Successfully cleaned and updated {count} multilingual posts.")
    else:
        print("🤔 No new posts to process.")

if __name__ == "__main__":
    process_posts()