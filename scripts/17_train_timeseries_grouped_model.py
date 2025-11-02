import pandas as pd
import joblib
import os
import sys
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import make_scorer, r2_score
import numpy as np

print("--- [Step 17] Training FINAL Time-Series Model (Grouped Features) ---")

# --- 1. Define Paths and Parameters ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))

# --- UPDATED DATASET PATH ---
DATASET_PATH = os.path.join(ROOT_DIR, "data", "processed", "timeseries_grouped_dataset.csv")
MODEL_ARTIFACTS_DIR = os.path.join(ROOT_DIR, "model_artifacts")
# --- NEW MODEL FILENAME ---
MODEL_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "timeseries_forecaster_grouped_model.joblib")

# We'll use the same target as before to compare results
TARGET_POLLUTANT = "EDGAR_CO_1970_2022" 

os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)
print(f"New time-series model will be saved to: {MODEL_PATH}")

# --- 2. Load Data ---
try:
    df = pd.read_csv(DATASET_PATH)
except FileNotFoundError:
    print(f"❌ ERROR: Grouped time-series data file not found at {DATASET_PATH}")
    print("   Please run 'scripts/16_create_timeseries_grouped.py' first.")
    sys.exit(1)

# Ensure data is sorted by year
df = df.sort_values(by='Year').reset_index(drop=True)

# --- 3. Define Features (X) and Target (y) ---
if TARGET_POLLUTANT not in df.columns:
    print(f"❌ ERROR: Target pollutant '{TARGET_POLLUTANT}' not found in dataset.")
    pollutant_cols = [col for col in df.columns if col.startswith(('EDGAR_', 'HCB_'))]
    print(f"   Available pollutants are: {pollutant_cols}")
    sys.exit(1)

y = df[TARGET_POLLUTANT]

# --- UPDATED FEATURE SELECTION ---
# Our features are confounders + the new 'policy_count_' columns
confounder_cols = [col for col in df.columns if col.startswith('confounder_')]
policy_cols = [col for col in df.columns if col.startswith('policy_count_')]

# We also include 'Year' as a feature
X = df[['Year'] + confounder_cols + policy_cols]
# --- END OF UPDATE ---

print(f"Target (y) set to: {TARGET_POLLUTANT}")
print(f"Features (X) created with {X.shape[1]} columns.") # Should be ~20-30
print(f"Total data shape: {X.shape[0]} years (rows).")

# --- 4. Define the Model and Time-Series Evaluation ---

# A RandomForestRegressor is an excellent choice
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    max_depth=10,
    min_samples_leaf=2, # Prevent overfitting on just 1-2 years
    n_jobs=-1
)

# Use TimeSeriesSplit to evaluate correctly
tscv = TimeSeriesSplit(n_splits=5)

print("Evaluating model using 5-fold Time-Series cross-validation (R-squared)...")

scores = cross_val_score(
    model, 
    X, 
    y, 
    cv=tscv, 
    scoring='r2',
    n_jobs=1 
)

print(f"✅ Cross-Validation R-squared scores (by fold): {[round(s, 4) for s in scores]}")
print(f"✅ Average R-squared: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
print(f"✅ R-squared on the most recent fold: {scores[-1]:.4f}")


# --- 5. Train and Save Final Model ---
if scores.mean() < 0.5 and scores[-1] < 0.5:
    print("⚠️ WARNING: Model performance is still poor (R-squared < 0.5).")
else:
    print("✅ Model performance looks good! Training final model.")

print("Training final model on all data...")
model.fit(X, y)

# --- 6. Save the Model and its Feature List ---
# We MUST save the list of features the model was trained on
model_artifacts = {
    'model': model,
    'features': X.columns.tolist(),
    'target_pollutant': TARGET_POLLUTANT
}

joblib.dump(model_artifacts, MODEL_PATH)

print("\n--- 🚀 COMPLETE ---")
print(f"✅✅✅ Success! New GROUPED TIME-SERIES model and features saved to:")
print(f"   {MODEL_PATH}")