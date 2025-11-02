import pandas as pd
import joblib
import os
import sys
import numpy as np
from sklearn.model_selection import cross_val_score, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier  # <-- 1. IMPORT CLASSIFIER

# --- [Step 8] Running Robust Model Training (V5 - Classification) ---
print("--- [Step 8] Running Robust Model Training (V5 - Classification) ---")

# --- 1. Define Paths ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))
    if not os.path.basename(ROOT_DIR) == 'ClimateX':
         print("Warning: Could not auto-detect root 'ClimateX' directory. Assuming current dir.")

FEATURES_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_featurized_local.csv")
IMPACTS_PATH = os.path.join(ROOT_DIR, "data", "processed", "policy_impact_database_V2_local.csv")
MODEL_ARTIFACTS_DIR = os.path.join(ROOT_DIR, "model_artifacts")
MODEL_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "robust_simulator_pipeline.joblib")

os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)
print(f"Model will be saved to: {MODEL_PATH}")

# --- 2. Load and Merge Data ---
print("Loading source data...")
try:
    df_features = pd.read_csv(FEATURES_PATH)
    df_impacts = pd.read_csv(IMPACTS_PATH)
except FileNotFoundError as e:
    print(f"❌ ERROR: Data file not found. {e}")
    sys.exit(1)

df_train = pd.merge(
    df_impacts,
    df_features,
    left_on=['policy', 'policy_year'],
    right_on=['Policy', 'Year'],
    how='inner'
)

# --- 3. Define Features, Target, and Groups ---
if 'Policy' in df_train.columns:
    df_train = df_train.drop(columns=['Policy', 'Year', 'Policy_Content'])

df_train = df_train[~df_train['policy_type'].isin(['ParseError', 'Error'])]
df_train = df_train.dropna(subset=['ate', 'pollutant', 'policy_type', 'action_type', 'policy_year', 'policy'])

print(f"Loaded and merged {len(df_train)} clean training samples.")

if df_train.empty:
    print("❌ ERROR: No training data available after merging and cleaning. Exiting.")
    sys.exit(1)

categorical_features = ['pollutant', 'policy_type', 'action_type']
numerical_features = ['policy_year'] 
TARGET_VARIABLE = 'ate'

X = df_train[categorical_features + numerical_features]
y_reg = df_train[TARGET_VARIABLE] # This is the original number
groups = df_train['policy']  # Define groups for GroupKFold

# --- 2. NEW: BIN THE TARGET FOR CLASSIFICATION ---
# We define what "Good", "Neutral", and "Bad" mean.
# This assumes a negative 'ate' is good (a reduction).
# You can and should adjust these bin numbers!
bins = [-np.inf, -2.0, 0.5, np.inf]
labels = ['Good Impact', 'Neutral Impact', 'Bad Impact']
y = pd.cut(y_reg, bins=bins, labels=labels) # This is our new target 'y'

print("\n--- Converted Regression to Classification ---")
print("Target variable classes (adjust bins if this is too unbalanced):")
print(y.value_counts(normalize=True).sort_index())
print("---")

print(f"Features, target, and {len(groups.unique())} policy groups defined.")

# --- 4. Build Preprocessing and Model Pipeline ---
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
        ('num', 'passthrough', numerical_features)
    ],
    remainder='drop'
)

# --- 3. NEW: USE A CLASSIFIER ---
model_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier( # <-- Using Classifier
        n_estimators=100,
        max_depth=7,
        min_samples_leaf=15,
        class_weight='balanced', # <-- Very important for unbalanced classes
        random_state=42,
        n_jobs=-1
    ))
])

print("Model pipeline built successfully (Preprocessor + RandomForestClassifier).")

# --- 5. Evaluate the Robust Model (with GroupKFold) ---
print("Evaluating model using 10-fold GroupKFold cross-validation...")

n_splits = 10 
if len(groups.unique()) < n_splits:
    n_splits = len(groups.unique())
    print(f"Warning: Fewer groups than folds. Setting n_splits to {n_splits}")
    
cv_strategy = GroupKFold(n_splits=n_splits)

try:
    # --- 4. NEW: USE 'f1_weighted' SCORING ---
    scores = cross_val_score(
        model_pipeline, 
        X, 
        y,                   # Use the new classified 'y'
        groups=groups,       
        cv=cv_strategy,      
        scoring='f1_weighted', # <-- F1-score is for classification
        n_jobs=-1
    )
    
    print(f"✅ Cross-Validation F1-Scores: {[round(s, 4) for s in scores]}")
    print(f"✅ Average F1-Score: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")

except Exception as e:
    print(f"❌ ERROR during cross-validation: {e}")
    sys.exit(1)

# --- 6. Train and Save Final Model ---
print("Training final model on all data...")
model_pipeline.fit(X, y) # Fit on the classified 'y'

joblib.dump(model_pipeline, MODEL_PATH)

print("\n--- 🚀 COMPLETE ---")
print(f"✅✅✅ Success! Robust CLASSIFICATION model saved to:")
print(f"   {MODEL_PATH}")

if scores.mean() > 0.5:
    print(f"This model has a STABLE F1-Score of ~{scores.mean()*100:.2f}%. This is much more reliable!")
else:
    print("Model performance is still poor. The features may not have enough predictive power.")