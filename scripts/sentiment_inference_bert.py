# sentiment_inference_bert.py
"""
Transformer-based multilingual sentiment inference.
Model: nlptown/bert-base-multilingual-uncased-sentiment (1-5 star output).
Converts to positive/neutral/negative + probability confidence.
Writes back:
  sentiment: { label: ..., score: ... }
  sentiment_model: "bert"
"""

import os
import math
from datetime import datetime
from pymongo import UpdateOne
from db_connect import posts_collection

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# -----------------------
MODEL_NAME = os.getenv("BERT_SENTIMENT_MODEL", "nlptown/bert-base-multilingual-uncased-sentiment")
BATCH_SIZE = int(os.getenv("BERT_BATCH_SIZE", "16"))
MAX_LENGTH = int(os.getenv("BERT_MAX_LENGTH", "256"))

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Loading model {MODEL_NAME} on {device} ...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME).to(device)
model.eval()

# -----------------------
def convert_scores_to_label(scores):
    """
    nlptown returns 5-class (1..5). Map to negative/neutral/positive.
    scores: list or tensor of probabilities (length 5)
    """
    # choose max index
    max_idx = int(torch.argmax(scores).item())
    star = max_idx + 1
    confidence = float(torch.max(scores).item())
    if star <= 2:
        label = "negative"
    elif star == 3:
        label = "neutral"
    else:
        label = "positive"
    return label, round(confidence, 4)

def run_bert_inference():
    if posts_collection is None:
        print("Database connection not available.")
        return

    query = {"processed": True, "sentiment": {"$exists": False}}
    # also include those scored by light model if you want full overwrite:
    # query = {"processed": True}  # careful: this will overwrite all

    cursor = posts_collection.find(query, {"cleaned_text":1}).batch_size(100)

    batch_docs = []
    ops = []
    total = 0
    for doc in cursor:
        text = doc.get("cleaned_text") or doc.get("light_clean_text") or ""
        if not text or len(text.strip()) < 3:
            continue
        batch_docs.append((doc["_id"], text))

        if len(batch_docs) >= BATCH_SIZE:
            process_batch(batch_docs, ops)
            # flush DB writes in batches to reduce memory
            if ops:
                posts_collection.bulk_write(ops)
                ops = []
            batch_docs = []

    if batch_docs:
        process_batch(batch_docs, ops)

    if ops:
        posts_collection.bulk_write(ops)

    print(f"BERT sentiment inference complete. Processed documents (approx): {total}")

def process_batch(batch_docs, ops):
    """
    Batch inference helper. Mutates ops list, no return.
    """
    ids, texts = zip(*batch_docs)
    # tokenize
    enc = tokenizer(
        list(texts),
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt"
    ).to(device)

    with torch.no_grad():
        out = model(**enc)
        probs = torch.softmax(out.logits, dim=1).cpu()

    for i, post_id in enumerate(ids):
        scores = probs[i]
        label, conf = convert_scores_to_label(scores)
        sentiment_obj = {
            "sentiment": {"label": label, "score": float(conf)},
            "sentiment_model": "bert",
            "sentiment_updated_at": datetime.utcnow()
        }
        ops.append(UpdateOne({"_id": post_id}, {"$set": sentiment_obj}))

if __name__ == "__main__":
    run_bert_inference()
