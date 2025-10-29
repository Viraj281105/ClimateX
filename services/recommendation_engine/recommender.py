import pandas as pd
from sklearn.tree import DecisionTreeRegressor

class RecommendationEngine:
    
    def __init__(self):
        print("RecommendationEngine initialized (V3 - Per-Pollutant Model).")

    def load_and_featurize_data(self, data_path):
        """
        Loads the database and enriches it with features.
        (This function is the same as before)
        """
        df = pd.read_csv(data_path)
        
        # --- Policy Feature Map ---
        policy_feature_map = {
            'policy_NAPCC_2008': {
                'policy_type': 'Framework', 
                'action_type': 'General'
            },
            'policy_NationalSolarMission_2010': {
                'policy_type': 'RenewableEnergy', 
                'action_type': 'Investment'
            },
            'policy_NMEEE_2009': {
                'policy_type': 'EnergyEfficiency', 
                'action_type': 'Standard'
            },
            'policy_SustainHabitat_2010': {
                'policy_type': 'Infrastructure', 
                'action_type': 'Standard'
            }
        }
        
        # Map these features to our DataFrame
        df['policy_type'] = df['policy'].map(lambda x: policy_feature_map.get(x, {}).get('policy_type'))
        df['action_type'] = df['policy'].map(lambda x: policy_feature_map.get(x, {}).get('action_type'))
        
        # Clean up data for modeling
        df_clean = df.dropna(subset=['ate', 'policy_type', 'action_type', 'pollutant'])
        
        print(f"Data featurized. Usable training rows: {len(df_clean)}")
        return df_clean

    def train_model_for_pollutant(self, df_clean, target_pollutant):
        """
        Trains a model *only* for the target pollutant.
        *** THIS FUNCTION IS NEW ***
        """
        print(f"Training model specifically for: {target_pollutant}...")
        
        # 1. Filter data for *only* this pollutant
        df_pollutant = df_clean[df_clean['pollutant'] == target_pollutant].copy()
        
        if df_pollutant.empty:
            print(f"❌ ERROR: No data found for pollutant '{target_pollutant}'.")
            return None, None
            
        # 2. Define features (X) and target (y)
        #    'pollutant' is no longer a feature!
        features = ['policy_type', 'action_type']
        target = 'ate'
        
        X_train = df_pollutant[features]
        y_train = df_pollutant[target]
        
        # 3. Convert all categorical features to dummies manually
        X_train_dummies = pd.get_dummies(X_train)
        
        # 4. Get the *exact* list of columns created
        training_columns = X_train_dummies.columns.tolist()
        
        # 5. Train a simple Decision Tree on this explicit DataFrame
        #    (With only 4 rows, it will just memorize the data, which is fine!)
        model = DecisionTreeRegressor(random_state=42)
        model.fit(X_train_dummies, y_train)
        
        print(f"Model training complete. Trained on {len(training_columns)} features from {len(X_train)} rows.")
        
        # 6. Return BOTH the model and the columns it was trained on
        return model, training_columns

    def get_recommendations(self, model, training_columns, df_clean):
        """
        Uses the trained (pollutant-specific) model to predict the ATE.
        *** THIS FUNCTION IS UPDATED ***
        """
        print(f"\n--- Generating recommendations... ---")
        
        # 1. Get all unique policy combinations we've *ever* seen
        X_test = df_clean[['policy_type', 'action_type']].drop_duplicates()
        
        # 2. Convert this new data to dummies
        X_test_dummies = pd.get_dummies(X_test)
        
        # 3. *** THE CRITICAL FIX ***
        # Force the test data to have the *exact same columns* as the training data.
        X_test_reindexed = X_test_dummies.reindex(columns=training_columns, fill_value=0)
        
        # 4. Predict on the re-indexed data
        X_test['predicted_ate'] = model.predict(X_test_reindexed)
        
        # 5. Sort by ATE (lowest is best!)
        recommendations = X_test.sort_values('predicted_ate', ascending=True)
        
        return recommendations