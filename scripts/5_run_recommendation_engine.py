#5_run_recommendation_engine.py
import pandas as pd
import os
import sys

# Add the root directory to the Python path
script_dir = os.path.dirname(__file__)
root_dir = os.path.abspath(os.path.join(script_dir, '..'))
sys.path.append(root_dir)

try:
    from services.recommendation_engine.recommender import RecommendationEngine
except ImportError:
    print("❌ ERROR: Could not import 'RecommendationEngine'.")
    print("   Make sure 'services/recommendation_engine/recommender.py' exists.")
    sys.exit(1)

# --- 1. Define Paths and Parameters ---
DB_PATH = os.path.join(root_dir, "data", "processed", "policy_impact_database.csv")
TARGET_POLLUTANT = 'EDGAR_PM2' # This is what we want to reduce!

# --- 2. Initialize and Run Engine ---
if __name__ == "__main__":
    engine = RecommendationEngine()
    
    # Load and "featurize" the raw database
    featurized_df = engine.load_and_featurize_data(DB_PATH)
    
    if featurized_df.empty:
        print("❌ ERROR: Featurized data is empty. Check policy map in recommender.py")
        sys.exit(1)
        
    # --- UPDATED CALL ---
    # Train the model *specifically* for our target pollutant
    model, training_columns = engine.train_model_for_pollutant(
        featurized_df, 
        TARGET_POLLUTANT
    )
    
    if model is None:
        print(f"❌ ERROR: Model training failed for {TARGET_POLLUTANT}.")
        sys.exit(1)
        
    # --- UPDATED CALL ---
    # Get recommendations from this specialized model
    recommendations = engine.get_recommendations(
        model, 
        training_columns,
        featurized_df # Pass in all data to find all policy types
    )
    
    # --- 3. Display Results ---
    print(f"\n✅ Recommendation Engine Results (V3 - Per-Pollutant Model):")
    print(f"   Best policy types to reduce '{TARGET_POLLUTANT}':")
    print("   (Sorted by predicted impact, lowest ATE is best)")
    print("--------------------------------------------------")
    print(recommendations.to_string())
    print("--------------------------------------------------")