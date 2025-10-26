import os
import tweepy
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()
BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")

print("Attempting to connect to the Twitter API v2...")

# Check if the BEARER_TOKEN was loaded
if not BEARER_TOKEN:
    print("❌ Error: TWITTER_BEARER_TOKEN not found in .env file.")
else:
    try:
        # Initialize the Tweepy Client with your Bearer Token
        client = tweepy.Client(BEARER_TOKEN)
        
        # Make a simple, authenticated request to verify the connection
        # This fetches the user object for the "TwitterDev" account
        response = client.get_user(username="TwitterDev")
        
        if response.data:
            print(f"✅ Successfully connected to Twitter API.")
            print(f"   Verified by fetching user: {response.data.name} (@{response.data.username})")
        else:
            print("❓ Connection successful, but could not fetch user 'TwitterDev'.")

    except tweepy.errors.TweepyException as e:
        print(f"❌ Connection Failed: An error occurred with the Twitter API.")
        print(f"   Please check if your Bearer Token is correct.")
        print(f"   Details: {e}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")