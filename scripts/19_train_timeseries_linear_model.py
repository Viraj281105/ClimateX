import pandas as pd
import joblib
import os
import sys
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import make_scorer, r2_score
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge

print("--- [Step 19] Training Time-Series LINEAR Model (Ridge) ---")

# --- 1. Define Paths and Parameters ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))

DATASET_PATH = os.path.join(ROOT_DIR, "data", "processed", "timeseries_grouped_dataset.csv")
MODEL_ARTIFACTS_DIR = os.path.join(ROOT_DIR, "model_artifacts")
MODEL_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "timeseries_forecaster_final_model.joblib") # Overwrite with this new model

TARGET_POLLUTANT = "EDGAR_CO_1970_2022" 

os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)
print(f"Final time-series model will be saved to: {MODEL_PATH}")

# --- 2. Load Data ---
try:
    df = pd.read_csv(DATASET_PATH)
except FileNotFoundError:
    print(f"❌ ERROR: Grouped time-series data file not found at {DATASET_PATH}")
    sys.exit(1)

df = df.sort_values(by='Year').reset_index(drop=True)

# --- 3. Feature Engineering: Create Lag Features ---
print("Creating lag features...")
df['target_lag_1'] = df[TARGET_POLLUTANT].shift(1)
df['target_lag_2'] = df[TARGET_POLLUTANT].shift(2)

# --- 4. Define Features (X) and Target (y) ---
y = df[TARGET_POLLUTANT]

confounder_cols = [col for col in df.columns if col.startswith('confounder_')]
policy_cols = [col for col in df.columns if col.startswith('policy_count_')]
lag_cols = ['target_lag_1', 'target_lag_2']

X = df[['Year'] + confounder_cols + policy_cols + lag_cols]

# --- 5. Handle Missing Data ---
print(f"Original shape: {X.shape[0]} years")
df_clean = df.dropna()
X = X.loc[df_clean.index]
y = y.loc[df_clean.index]
print(f"Cleaned shape after dropping NaNs: {X.shape[0]} years")

print(f"Target (y) set to: {TARGET_POLLUTANT}")
print(f"Features (X) created with {X.shape[1]} columns.")

# --- 6. Define the NEW Model (Scaler + Ridge) ---

# We create a pipeline:
# 1. StandardScaler: Scales all features (e.g., population and policy counts) to be comparable.
# 2. Ridge: A robust linear model that is good at ignoring noise.
model = Pipeline(steps=[
    ('scaler', StandardScaler()),
    ('regressor', Ridge(alpha=1.0, random_state=42)) # alpha=1.0 is a standard regularization
])

print("Model pipeline built (StandardScaler + Ridge).")

# --- 7. Evaluate the Model ---
tscv = TimeSeriesSplit(n_splits=5)
print("Evaluating linear model using Time-Series cross-validation...")

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


# --- 8. Train and Save Final Model ---
if scores.mean() < 0.5:
    print("⚠️ WARNING: Model performance is poor. The data may have no predictive signal.")
else:
    print("✅ Model performance is looking good! Training final model.")

print("Training final model on all data...")
model.fit(X, y)

# --- 9. Save the Model and its Feature List ---
model_artifacts = {
    'model': model,
    'features': X.columns.tolist(),
    'target_pollutant': TARGET_POLLUTANT,
    'all_pollutants': [col for col in df.columns if col.startswith(('EDGAR_', 'HCB_'))]
}

joblib.dump(model_artifacts, MODEL_PATH)

print("\n--- 🚀 COMPLETE ---")
print(f"✅✅✅ Success! New LINEAR TIME-SERIES model saved to:")
print(f"   {MODEL_PATH}")