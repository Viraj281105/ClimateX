from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

try:
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = MongoClient(mongo_uri)
    db = client["climate_tweets"]
    posts_collection = db["posts"]
    print("MongoDB connection successful.")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    posts_collection = None
