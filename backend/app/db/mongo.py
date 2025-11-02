import os
import pymongo
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

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
    # We don't exit() here, we let the API endpoints handle the None