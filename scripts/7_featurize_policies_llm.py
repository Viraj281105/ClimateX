import pandas as pd
import os
import sys
import json
import ollama # <-- NEW IMPORT
from tqdm import tqdm # For a nice progress bar!

print("--- [Phase 2] Featurizing Policies with LOCAL LLM (Ollama) ---")

# --- 1. Load Data ---
SCRIPT_DIR = os.path.dirname(__file__)
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
INPUT_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_1970_2017.csv")
OUTPUT_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_featurized_local.csv")

try:
    df = pd.read_csv(INPUT_PATH)
except FileNotFoundError:
    print(f"❌ ERROR: File not found at '{INPUT_PATH}'")
    sys.exit(1)

# --- 2. Configure Ollama Client ---
try:
    client = ollama.Client()
    print("✅ Ollama client initialized.")
    print("   (Make sure the Ollama application is running!)")
except ImportError:
    print("❌ ERROR: 'ollama' library not found.")
    print("   Please install it: pip install ollama")
    sys.exit(1)
except Exception as e:
    print(f"❌ ERROR: Could not connect to Ollama. Is it running? {e}")
    sys.exit(1)

# --- 3. Define the LLM Featurizer Function ---
def get_policy_features(policy_content):
    """
    Uses the local Ollama model to read policy content and classify it.
    """
    
    # This prompt is the "brain" of our operation.
    prompt = f"""
    You are an expert policy analyst. Read the following policy text and classify it.
    
    Your response MUST be a valid JSON object with two keys:
    1. "policy_type": (e.g., 'RenewableEnergy', 'EnergyEfficiency', 'AirQualityStandard', 'Forestry', 'WaterManagement', 'Transport', 'Industrial', 'Framework', 'Agriculture', 'Other')
    2. "action_type": (e.g., 'Regulation', 'Standard', 'Investment', 'R&D', 'TaxIncentive', 'General', 'Other')

    Policy Text:
    "{policy_content[:2000]}" 
    """

    try:
        # Call the local model
        response = client.chat(
            model='mistral', # The model we downloaded
            messages=[{'role': 'user', 'content': prompt}],
            format='json' # <-- This forces the model to output JSON!
        )
        
        # The response content is already a JSON string,
        # but we parse it to be safe
        features = json.loads(response['message']['content'])
        
        # Ensure it has the keys we need
        if 'policy_type' not in features:
            features['policy_type'] = 'ParseError'
        if 'action_type' not in features:
            features['action_type'] = 'ParseError'
            
        return features

    except Exception as e:
        print(f"  > LLM Error: {e}")
        return {'policy_type': 'Error', 'action_type': 'Error'}

# --- 4. Main Processing Loop ---
print(f"Starting to process {len(df)} policies...")

# !!! --- RUNNING FOR REAL --- !!!
# We are now processing all 603 policies.

# df_to_process = df.head(10) # <-- Comment out the test line
df_to_process = df # <-- Uncomment this line

results = []

# Use tqdm for a progress bar
for index, row in tqdm(df_to_process.iterrows(), total=df_to_process.shape[0]):
    content = row['Policy_Content']
    
    # Call our LLM function
    features = get_policy_features(content)
    
    # Add the original data back
    result_row = {
        'Year': row['Year'],
        'Policy': row['Policy'],
        'policy_type': features.get('policy_type'),
        'action_type': features.get('action_type'),
        'Policy_Content': content
    }
    results.append(result_row)
    
    # No time.sleep() needed! This will run as fast as your GPU can.

# --- 5. Save the Results ---
df_featurized = pd.DataFrame(results)
df_featurized.to_csv(OUTPUT_PATH, index=False)

print(f"\n✅ Success! Featurized data saved to:")
print(f"   {OUTPUT_PATH}")
print("\n--- Sample of Featurized Data ---")
print(df_featurized.head())