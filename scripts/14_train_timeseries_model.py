import pandas as pd
import joblib
import os
import sys
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import make_scorer, r2_score
import numpy as np

print("--- [Step 14] Training Time-Series Forecasting Model ---")

# --- 1. Define Paths and Parameters ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))

DATASET_PATH = os.path.join(ROOT_DIR, "data", "processed", "timeseries_analysis_dataset.csv")
MODEL_ARTIFACTS_DIR = os.path.join(ROOT_DIR, "model_artifacts")
MODEL_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "timeseries_forecaster_model.joblib")

# --- !! Define Your Target Pollutant Here !! ---
# We will train one model for *each* pollutant. Let's start with CO.
# --- THIS IS THE FIX ---
TARGET_POLLUTANT = "EDGAR_CO_1970_2022" 
# --- END OF FIX ---

os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)
print(f"New time-series model will be saved to: {MODEL_PATH}")

# --- 2. Load Data ---
try:
    df = pd.read_csv(DATASET_PATH)
except FileNotFoundError:
    print(f"❌ ERROR: Time-series data file not found at {DATASET_PATH}")
    print("   Please run 'scripts/13_create_timeseries_dataset.py' first.")
    sys.exit(1)

# Ensure data is sorted by year for time-series analysis
df = df.sort_values(by='Year').reset_index(drop=True)

# --- 3. Define Features (X) and Target (y) ---

# The Target (y) is the pollutant we want to predict
if TARGET_POLLUTANT not in df.columns:
    print(f"❌ ERROR: Target pollutant '{TARGET_POLLUTANT}' not found in dataset.")
    # Print available pollutant columns to help user
    pollutant_cols = [col for col in df.columns if col.startswith(('EDGAR_', 'HCB_'))]
    print(f"   Available pollutants are: {pollutant_cols}")
    sys.exit(1)

y = df[TARGET_POLLUTANT]

# The Features (X) are ALL other columns *except* other pollutants
pollutant_cols = [col for col in df.columns if col.startswith(('EDGAR_', 'HCB_', 'PAH_', 'PCB_', 'PCDD_'))]
confounder_cols = [col for col in df.columns if col.startswith('confounder_')]
policy_cols = [col for col in df.columns if col.startswith('policy_')]

# Our features are confounders + policies. We also include 'Year' as a feature.
X = df[['Year'] + confounder_cols + policy_cols]

print(f"Target (y) set to: {TARGET_POLLUTANT}")
print(f"Features (X) created with {X.shape[1]} columns.")
print(f"Total data shape: {X.shape[0]} years (rows).")

# --- 4. Define the Model and Time-Series Evaluation ---

# A RandomForestRegressor is excellent for this type of problem
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    max_depth=10,
    min_samples_leaf=2, # Don't overfit on single years
    n_jobs=-1
)

# --- IMPORTANT: Time-Series Cross-Validation ---
# We can't shuffle the data. We must use TimeSeriesSplit.
tscv = TimeSeriesSplit(n_splits=5)

print("Evaluating model using 5-fold Time-Series cross-validation (R-squared)...")

# We use R-squared to evaluate
scores = cross_val_score(
    model, 
    X, 
    y, 
    cv=tscv, 
    scoring='r2',
    n_jobs=1 # tscv doesn't always play nice with n_jobs > 1
)

print(f"✅ Cross-Validation R-squared scores (by fold): {[round(s, 4) for s in scores]}")
print(f"✅ Average R-squared: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
print(f"✅ R-squared on the most recent fold: {scores[-1]:.4f}")


# --- 5. Train and Save Final Model ---
if scores.mean() < 0.5:
    print("⚠️ WARNING: Model performance is poor (R-squared < 0.5). Proceeding anyway, but be cautious.")

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
print(f"✅✅✅ Success! New TIME-SERIES model and features saved to:")
print(f"   {MODEL_PATH}")