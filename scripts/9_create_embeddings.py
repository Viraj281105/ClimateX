import pandas as pd
import os
import sys
import ollama
from tqdm import tqdm

print("--- [Step 9] Creating Policy Text Embeddings with Ollama ---")

# --- 1. Define Paths ---
SCRIPT_DIR = os.path.dirname(__file__)
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
INPUT_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_1970_2017.csv")
OUTPUT_PATH = os.path.join(ROOT_DIR, "data", "processed", "policy_embeddings_local.csv")

# --- 2. Configure Ollama Client and Model ---
EMBEDDING_MODEL = 'nomic-embed-text' # This is a dedicated embedding model

try:
    client = ollama.Client()
    print("✅ Ollama client initialized.")
    print(f"   Using embedding model: '{EMBEDDING_MODEL}'")
    print(f"   (If this fails, run: ollama pull {EMBEDDING_MODEL})")
    # Test connection by listing models
    client.list()
except Exception as e:
    print(f"❌ ERROR: Could not connect to Ollama. Is it running? {e}")
    sys.exit(1)

# --- 3. Load Data ---
try:
    df = pd.read_csv(INPUT_PATH)
    # Drop rows where there is no policy content to embed
    df = df.dropna(subset=['Policy_Content'])
except FileNotFoundError:
    print(f"❌ ERROR: File not found at '{INPUT_PATH}'")
    sys.exit(1)

# --- 4. Define the Embedding Function ---
def get_embedding(policy_content: str):
    """
    Uses the local Ollama model to create a vector embedding for a text.
    """
    if pd.isna(policy_content):
        return None
    try:
        # Call the embedding model
        response = client.embeddings(
            model=EMBEDDING_MODEL,
            prompt=policy_content
        )
        return response['embedding']
    except Exception as e:
        print(f"  > LLM Embedding Error: {e}")
        return None

# --- 5. Main Processing Loop ---
print(f"Starting to process and embed {len(df)} policies...")

results = []

# Use tqdm for a progress bar
for index, row in tqdm(df.iterrows(), total=df.shape[0]):
    content = row['Policy_Content']
    
    # Call our LLM embedding function
    embedding = get_embedding(content)
    
    if embedding is None:
        print(f"  > Skipping policy {row['Policy']} (no content or error)")
        continue
    
    # Create the base row with identifiers
    result_row = {
        'Year': row['Year'],
        'Policy': row['Policy'],
    }
    
    # Flatten the embedding vector into separate columns (embed_0, embed_1, ...)
    embedding_dict = {f'embed_{i}': val for i, val in enumerate(embedding)}
    
    # Add the embedding columns to the result row
    result_row.update(embedding_dict)
    
    results.append(result_row)

# --- 6. Save the Results ---
if not results:
    print("❌ ERROR: No embeddings were generated. Check Ollama connection and model.")
    sys.exit(1)

print("\nConverting results to DataFrame...")
df_embeddings = pd.DataFrame(results)

print(f"Saving {len(df_embeddings)} embeddings to CSV...")
df_embeddings.to_csv(OUTPUT_PATH, index=False)

print(f"\n✅ Success! Policy embeddings data saved to:")
print(f"   {OUTPUT_PATH}")
print("\n--- Sample of Embeddings Data (first 5 columns) ---")
print(df_embeddings.iloc[:, :5].head())
print(f"\nTotal columns in new file: {len(df_embeddings.columns)}")