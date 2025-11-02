import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity
import os
from typing import List

# --- Constants & Configuration ---

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'processed')
KNOWLEDGE_BASE_FILE = os.path.join(DATA_PATH, 'policy_impact_database_V2_local.csv')
FEATURES_FILE = os.path.join(DATA_PATH, 'india_policies_featurized_local.csv')

# --- NEW CATEGORICAL FEATURES ---
CATEGORICAL_FEATURES = ['policy_type', 'action_type'] # <-- CHANGED

# --- Global Cache ---
encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
knowledge_base_df = None
knowledge_base_features = None


# --- Service Functions ---

def load_knowledge_base():
    """
    Loads and merges the datasets, then fits the encoder.
    This function is called once on server startup.
    """
    global knowledge_base_df, knowledge_base_features, encoder
    
    try:
        # Load datasets
        impact_db = pd.read_csv(KNOWLEDGE_BASE_FILE)
        features_db = pd.read_csv(FEATURES_FILE)

        # --- MODIFIED MERGE LOGIC ---
        # Select and rename the impact score column from impact_db
        impact_subset = impact_db[['policy', 'ate']].rename(columns={'ate': 'Predicted_Impact_Score'})

        # Merge features_db with the impact_subset
        knowledge_base_df = pd.merge(
            features_db,
            impact_subset,
            left_on='Policy',  # Column from features_db
            right_on='policy', # Column from impact_db
            how='left'
        )
        # ----------------------------
        
        # Fill NaNs for safety
        knowledge_base_df[CATEGORICAL_FEATURES] = knowledge_base_df[CATEGORICAL_FEATURES].fillna('Unknown')
        knowledge_base_df['Predicted_Impact_Score'] = knowledge_base_df['Predicted_Impact_Score'].fillna(0.0)

        print("--- Knowledge base loaded successfully ---")

        # Fit the OneHotEncoder
        encoder.fit(knowledge_base_df[CATEGORICAL_FEATURES])
        print("--- Encoder fitted successfully ---")
        
        # Pre-calculate the feature matrix for the entire knowledge base
        knowledge_base_features = encoder.transform(knowledge_base_df[CATEGORICAL_FEATURES])

    except FileNotFoundError as e:
        print(f"ERROR: Data file not found. {e}")
    except Exception as e:
        print(f"Error during data loading or encoder fitting: {e}")


def find_analogies(query: pd.DataFrame) -> List[dict]:
    """
    Finds the top 5 most similar policies from the knowledge base.
    """
    if knowledge_base_df is None or knowledge_base_features is None:
        print("Error: Knowledge base is not loaded.")
        return []

    # 1. Transform the user query using the *same* fitted encoder
    query_features = encoder.transform(query[CATEGORICAL_FEATURES])

    # 2. Calculate cosine similarity
    similarities = cosine_similarity(query_features, knowledge_base_features)

    # 3. Get the top 5 indices for the first (and only) query row
    top_indices = similarities[0].argsort()[-5:][::-1]
    
    # 4. Format the results
    results = []
    for i in top_indices:
        result_entry = knowledge_base_df.iloc[i].to_dict()
        result_entry['Similarity_Score'] = similarities[0][i]
        
        # Ensure values are valid for Pydantic model
        result_entry['Predicted_Impact_Score'] = float(result_entry.get('Predicted_Impact_Score', 0.0))
        result_entry['Policy_Content'] = str(result_entry.get('Policy_Content', ''))
        result_entry['action_type'] = str(result_entry.get('action_type', 'Unknown'))
        result_entry['policy_type'] = str(result_entry.get('policy_type', 'Unknown'))
        
        results.append(result_entry)
        
    return results