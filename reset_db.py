# reset_database.py
from db_connect import posts_collection
print("Attempting to delete all old posts...")
result = posts_collection.delete_many({})
print(f"✅ Deleted {result.deleted_count} old posts. Database is clean.")