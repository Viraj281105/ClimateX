import ollama
import json
import os
from datetime import datetime
from db_connect import posts_collection

# --- 1. Configuration ---
POST_SAMPLE_LIMIT = 50
MODEL_NAME = "mistral"
LOGS_DIR = "logs"

CURRENT_TOPICS_LIST = [
    "climate change policy india", "renewable energy india", "electric vehicles india",
    "carbon tax india", "green energy india", "national solar mission",
    "net zero india", "coal mining india", "transport emissions india",
    "highway policy india", "bharatmala project", "smart cities mission india",
    "water management india", "ganga action plan", "national water mission",
    "agricultural subsidies india", "river linking project india",
    "industrial pollution india", "air quality india", "waste management india",
    "NITI Aayog environment", "Ministry of Environment Forest and Climate Change"
]

# --- 2. Ensure logs folder exists ---
os.makedirs(LOGS_DIR, exist_ok=True)

# --- 3. Initialize Ollama ---
try:
    client = ollama.Client()
    print("✅ Ollama client connected. (Ensure Ollama app is running.)")
except Exception as e:
    print(f"❌ ERROR: Ollama not running or connection failed.\n{e}")
    exit(1)

# --- 4. Extract New Topics from Text ---
def extract_new_topics(text: str) -> list[str]:
    prompt = f"""
    You are an expert on Indian environmental and policy analysis.
    Based on the following text, suggest 2–5 new, specific and relevant
    topics or hashtags for tracking related public sentiment.

    Text snippet:
    "{text[:1500]}"

    Return ONLY a JSON list of strings.
    Example:
    ["green hydrogen india", "carbon capture technology", "rural electrification policy"]
    """

    try:
        response = client.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            format="json"
        )

        result = response.get("message", {}).get("content", "[]")
        new_topics = json.loads(result)

        if isinstance(new_topics, list):
            return [t.strip().lower() for t in new_topics if isinstance(t, str)]
    except Exception as e:
        print(f"⚠️ LLM Error: {e}")
    return []

# --- 5. Main Logic ---
def discover_new_topics():
    if posts_collection is None:
        print("❌ Database not connected. Check db_connect.py configuration.")
        return

    print(f"\n🚀 Fetching up to {POST_SAMPLE_LIMIT} recent unprocessed posts...")
    posts_cursor = posts_collection.find(
        {"topic_discovered": {"$exists": False}},
        {"title": 1, "content": 1}
    ).limit(POST_SAMPLE_LIMIT)

    all_new_topics = set()
    processed_ids = []

    for post in posts_cursor:
        text = post.get("content") or post.get("title")
        if not text:
            continue

        print(f"\n🔍 Analyzing: {post.get('title', '')[:60]}...")
        topics = extract_new_topics(text)
        if topics:
            print(f"  > Suggested topics: {topics}")
            for t in topics:
                if t not in CURRENT_TOPICS_LIST:
                    all_new_topics.add(t)
        processed_ids.append(post["_id"])

    if processed_ids:
        posts_collection.update_many(
            {"_id": {"$in": processed_ids}},
            {"$set": {"topic_discovered": True, "discovered_at": datetime.utcnow()}}
        )

    # --- Logging to JSON ---
    if all_new_topics:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        log_file = os.path.join(LOGS_DIR, f"new_topics_{timestamp}.json")
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(sorted(list(all_new_topics)), f, indent=4, ensure_ascii=False)

        print(f"\n🧾 New topics saved to: {log_file}")
        print("\n🆕 Unique AI-discovered topics:")
        for t in sorted(all_new_topics):
            print(f"  - {t}")
    else:
        print("\nNo new unique topics found in this run.")

    print("\n✅ Topic discovery complete!")

if __name__ == "__main__":
    discover_new_topics()
