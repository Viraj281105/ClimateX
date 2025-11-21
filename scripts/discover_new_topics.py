import os
import json
from datetime import datetime
from pymongo import UpdateOne
from bson import ObjectId

import ollama
from db_connect import posts_collection, db

# ============================================================
# CONFIG
# ============================================================
POST_SAMPLE_LIMIT = 80
MODEL_NAME = "mistral"
LOGS_DIR = "logs"
TOPICS_COLLECTION = db["semantic_topics"]

# Baseline topics we never rediscover
BASELINE_TOPICS = set([
    "climate change", "renewable energy", "electric vehicles",
    "air pollution india", "pm2.5 india", "niti aayog",
    "carbon tax", "solar mission", "waste management india"
])

# ============================================================
# INIT OLLAMA
# ============================================================
try:
    client = ollama.Client()
    client.list()
    print("[INFO] Ollama connected.")
except Exception as e:
    print("[ERROR] Ollama not running.")
    print(e)
    exit(1)

os.makedirs(LOGS_DIR, exist_ok=True)

# ============================================================
# EMBEDDING HELPERS
# ============================================================
try:
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
except:
    embedder = None


def get_embedding(text: str):
    """Embedding via Ollama first, then fallback to sentence-transformers."""
    try:
        resp = client.embed(model="mistral", input=text)
        if "embedding" in resp:
            return resp["embedding"]
    except Exception:
        pass

    if embedder:
        return embedder.encode(text).tolist()

    raise RuntimeError("No embedding provider available.")


# ============================================================
# JSON REPAIR
# ============================================================
def repair_json_maybe(bad_json: str):
    """Attempts to recover valid JSON from an LLM response."""
    try:
        return json.loads(bad_json)
    except Exception:
        pass

    # Extract only the first valid JSON list
    try:
        start = bad_json.find("[")
        end = bad_json.rfind("]")
        if start != -1 and end != -1:
            return json.loads(bad_json[start:end+1])
    except Exception:
        pass

    return []


# ============================================================
# TOPIC EXTRACTOR
# ============================================================
def extract_new_topics(text: str) -> list[str]:
    """Returns 3-7 cleaned, domain-relevant topics."""
    text = text[:2000]

    prompt = f"""
    You are an Indian climate-policy analyst.

    From the following text, extract 3 to 7 highly relevant, specific topics 
    suitable for long-term sentiment tracking.

    Requirements:
    - Topics must be climate, energy, infrastructure, or policy related.
    - Avoid generic single words.
    - Avoid near-duplicate variations.
    - Keep all topics lowercase.
    - Topics should be specific, for example:
      "solar rooftop subsidies delhi"
      "thermal power phase-out"
      "vehicular emissions delhi"
      "crop residue burning punjab"

    Return ONLY a JSON list.
    Example:
    ["topic1", "topic2", "topic3"]

    TEXT:
    "{text}"
    """

    try:
        response = client.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            format="json"
        )
        raw = response["message"]["content"]
        topics = repair_json_maybe(raw)
    except Exception:
        topics = []

    cleaned = []
    for t in topics:
        if isinstance(t, str):
            t = t.strip().lower()
            if len(t) > 3:
                cleaned.append(t)

    return cleaned[:7]


# ============================================================
# MAIN LOGIC
# ============================================================
def discover_new_topics():
    print("[INFO] Fetching recent posts for topic discovery...")

    cursor = posts_collection.find(
        {"topic_discovered": {"$exists": False}},
        {"title": 1, "content": 1}
    ).sort("created_at", -1).limit(POST_SAMPLE_LIMIT)

    new_topics = set()
    processed_ids = []

    for post in cursor:
        text = post.get("content") or post.get("title")
        if not text:
            continue

        title_preview = (post.get("title", "")[:60]).replace("\n", " ")
        print("[SCAN]", title_preview, "...")

        topics = extract_new_topics(text)

        if not topics:
            print("No topics extracted.")
        else:
            print("Extracted topics:", topics)

        for t in topics:
            if t not in BASELINE_TOPICS:
                new_topics.add(t)

        processed_ids.append(post["_id"])

    # Mark posts as processed
    if processed_ids:
        posts_collection.update_many(
            {"_id": {"$in": processed_ids}},
            {"$set": {"topic_discovered": True, "discovered_at": datetime.utcnow()}}
        )

    # Save extraction log
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_path = os.path.join(LOGS_DIR, f"topics_{timestamp}.json")

    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(sorted(list(new_topics)), f, indent=4)

    print("[INFO] Saved topic log:", log_path)

    # Insert semantic topics into DB
    if new_topics:
        print("[INFO] Generating embeddings and inserting topics...")

        ops = []
        for topic in new_topics:
            emb = get_embedding(topic)
            ops.append(
                UpdateOne(
                    {"topic": topic},
                    {
                        "$set": {
                            "topic": topic,
                            "embedding": emb,
                            "created_at": datetime.utcnow(),
                            "source": "llm_discovery"
                        }
                    },
                    upsert=True
                )
            )

        TOPICS_COLLECTION.bulk_write(ops)
        print("[OK] Inserted or updated", len(ops), "topics.")
    else:
        print("[INFO] No new topics discovered.")

    print("[DONE] Topic discovery complete.")


# ============================================================
# ENTRYPOINT
# ============================================================
if __name__ == "__main__":
    discover_new_topics()
