import os
import pymongo
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

print("Attempting to connect to MongoDB...")

# Check if the MONGO_URI was loaded
if not MONGO_URI:
    print("❌ Error: MONGO_URI not found in .env file.")
else:
    try:
        # Create a new client and connect to the server
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        
        print(f"✅ Successfully connected to MongoDB at {MONGO_URI}")
        
    except pymongo.errors.ConnectionFailure as e:
        print(f"❌ Connection Failed: Could not connect to MongoDB.")
        print(f"   Details: {e}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
    finally:
        if 'client' in locals() and client:
            client.close()