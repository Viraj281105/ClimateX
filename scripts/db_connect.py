# db_connect.py
import os
import pymongo
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Ping the server to confirm connection
    client.admin.command('ping')
    
    # Define the database and collection objects to be imported by other scripts
    db = client["climate_tweets"]
    posts_collection = db.posts
    print("✅ MongoDB connection successful.")
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    db = None
    posts_collection = None
    exit()