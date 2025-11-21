# preprocess_posts.py
import re
import spacy
from pymongo import UpdateOne
from db_connect import posts_collection
from langdetect import detect_langs, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

# ---------------------------------------------------------
# 0. Setup
# ---------------------------------------------------------
DetectorFactory.seed = 0

try:
    nlp_en = spacy.load("en_core_web_sm")
    print(" [OK] spaCy English model loaded.")
except:
    print(" [ERR] spaCy not installed. Run:")
    print("      python -m spacy download en_core_web_sm")
    exit()

# Hindi stopwords (minimal set, extend later)
HINDI_STOPWORDS = set("""
के को में पर से तक और या यह वह जो कि नहीं लिये हुए करना होना देना कहना ज्यादा भी फिर उन अपने अपने आप साथ बिना बाद जैसे
""".strip().split())

DEVANAGARI_PATTERN = re.compile(r"[\u0900-\u097F]+")

# ---------------------------------------------------------
# 1. UNIVERSAL CLEANING HELPERS
# ---------------------------------------------------------
def remove_urls(text):
    return re.sub(r"https?://\S+|www\.\S+", "", text)

def remove_mentions(text):
    return re.sub(r"@\w+", "", text)

def remove_hashtags(text):
    return re.sub(r"#", "", text)

def remove_emojis(text):
    emoji_pattern = re.compile(
        "["u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        u"\U0001F1E0-\U0001F1FF"
        "]+", flags=re.UNICODE)
    return emoji_pattern.sub(r'', text)

def collapse_spaces(text):
    return re.sub(r"\s+", " ", text).strip()


# ---------------------------------------------------------
# 2. LIGHT CLEAN (LLM-FRIENDLY)
# ---------------------------------------------------------
def light_clean(text):
    text = text.lower()
    text = remove_urls(text)
    text = remove_mentions(text)
    text = remove_hashtags(text)
    text = remove_emojis(text)
    return collapse_spaces(text)


# ---------------------------------------------------------
# 3. DEEP CLEAN FOR ENGLISH (MODEL-FRIENDLY)
# ---------------------------------------------------------
def english_deep_clean(text):
    text = light_clean(text)
    text = re.sub(r"[^a-z\s]", " ", text)

    doc = nlp_en(text)
    tokens = [
        token.lemma_ for token in doc
        if not token.is_stop and token.is_alpha and len(token) > 2
    ]
    return " ".join(tokens)


# ---------------------------------------------------------
# 4. DEEP CLEAN FOR HINDI / DEVANAGARI
# ---------------------------------------------------------
def hindi_deep_clean(text):
    text = light_clean(text)

    # keep only Devanagari chars
    text = "".join(ch if DEVANAGARI_PATTERN.match(ch) else " " for ch in text)
    text = collapse_spaces(text)

    words = text.split()
    tokens = [w for w in words if w not in HINDI_STOPWORDS and len(w) > 2]
    return " ".join(tokens)


# ---------------------------------------------------------
# 5. MAIN PROCESS
# ---------------------------------------------------------
def process_posts():
    if posts_collection is None:
        print(" [ERR] Database not connected.")
        return

    unprocessed = posts_collection.find({"processed": False})
    bulk_ops = []
    processed_count = 0

    print("\n=== Preprocessing Posts ===")

    for post in unprocessed:
        raw = post.get("content") or post.get("title") or ""
        if len(raw.strip()) < 10:
            continue

        try:
            # --- Detect language with confidence ---
            langs = detect_langs(raw)
            lang = langs[0].lang
            confidence = float(langs[0].prob)

            light = light_clean(raw)

            if lang == "en":
                deep = english_deep_clean(raw)
            elif DEVANAGARI_PATTERN.search(raw):
                deep = hindi_deep_clean(raw)
                lang = "hi"
            else:
                # fallback generic cleaner
                deep = light

            bulk_ops.append(
                UpdateOne(
                    { "_id": post["_id"] },
                    { "$set": {
                        "light_clean_text": light,
                        "cleaned_text": deep,
                        "language": lang,
                        "lang_confidence": confidence,
                        "processed": True,
                        "token_count": len(deep.split())
                    }}
                )
            )
            processed_count += 1

        except LangDetectException:
            continue
        except Exception as e:
            print(f" [ERR] Failed for post {post['_id']}: {e}")

    if bulk_ops:
        posts_collection.bulk_write(bulk_ops)
        print(f"\n [OK] Processed {processed_count} posts.")
    else:
        print("\n [INFO] No unprocessed posts found.")


# ---------------------------------------------------------
# 6. ENTRYPOINT
# ---------------------------------------------------------
if __name__ == "__main__":
    process_posts()
