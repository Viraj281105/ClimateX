import pandas as pd
import joblib
import os
import sys
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import make_scorer, r2_score
import numpy as np

print("--- [Step 18] Training Time-Series Model with Lag Features ---")

# --- 1. Define Paths and Parameters ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))

DATASET_PATH = os.path.join(ROOT_DIR, "data", "processed", "timeseries_grouped_dataset.csv")
MODEL_ARTIFACTS_DIR = os.path.join(ROOT_DIR, "model_artifacts")
MODEL_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "timeseries_forecaster_final_model.joblib")

TARGET_POLLUTANT = "EDGAR_CO_1970_2022" 

os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)
print(f"Final time-series model will be saved to: {MODEL_PATH}")

# --- 2. Load Data ---
try:
    df = pd.read_csv(DATASET_PATH)
except FileNotFoundError:
    print(f"❌ ERROR: Grouped time-series data file not found at {DATASET_PATH}")
    print("   Please run 'scripts/16_create_timeseries_grouped.py' first.")
    sys.exit(1)

df = df.sort_values(by='Year').reset_index(drop=True)

# --- 3. Feature Engineering: Create Lag Features ---
print("Creating lag features (e.g., emissions from 1 year ago)...")

# Create new columns for emissions 1 year ago and 2 years ago
df['target_lag_1'] = df[TARGET_POLLUTANT].shift(1)
df['target_lag_2'] = df[TARGET_POLLUTANT].shift(2)

# --- 4. Define Features (X) and Target (y) ---

# The Target (y) is still the pollutant we want to predict
y = df[TARGET_POLLUTANT]

# The Features (X) are the confounders, policies, AND the new lag features
confounder_cols = [col for col in df.columns if col.startswith('confounder_')]
policy_cols = [col for col in df.columns if col.startswith('policy_count_')]
lag_cols = ['target_lag_1', 'target_lag_2'] # <-- NEW FEATURES

X = df[['Year'] + confounder_cols + policy_cols + lag_cols]

# --- 5. Handle Missing Data (CRITICAL) ---
# The first 2 rows will have NaN for the lag features, so we must drop them.
print(f"Original shape: {X.shape[0]} years")
df_clean = df.dropna() # Drop rows with NaN
X = X.loc[df_clean.index] # Re-align X
y = y.loc[df_clean.index] # Re-align y
print(f"Cleaned shape after dropping NaNs: {X.shape[0]} years")

print(f"Target (y) set to: {TARGET_POLLUTANT}")
print(f"Features (X) created with {X.shape[1]} columns.")

# --- 6. Define the Model and Time-Series Evaluation ---
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    max_depth=10,
    min_samples_leaf=2,
    n_jobs=-1
)

# Use TimeSeriesSplit
tscv = TimeSeriesSplit(n_splits=5)

print("Evaluating model with lag features using Time-Series cross-validation...")

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


# --- 7. Train and Save Final Model ---
if scores.mean() < 0.5:
    print("⚠️ WARNING: Model performance is still poor, even with lag features.")
else:
    print("✅ Model performance is looking good! Training final model.")

print("Training final model on all data...")
model.fit(X, y)

# --- 8. Save the Model and its Feature List ---
model_artifacts = {
    'model': model,
    'features': X.columns.tolist(),
    'target_pollutant': TARGET_POLLUTANT,
    'all_pollutants': [col for col in df.columns if col.startswith(('EDGAR_', 'HCB_'))]
}

joblib.dump(model_artifacts, MODEL_PATH)

print("\n--- 🚀 COMPLETE ---")
print(f"✅✅✅ Success! New LAGGED TIME-SERIES model saved to:")
print(f"   {MODEL_PATH}")