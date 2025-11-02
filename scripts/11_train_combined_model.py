import pandas as pd
import joblib
import os
import sys
import numpy as np
from sklearn.model_selection import cross_val_score, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier

# --- [Step 11] Training Combined "Kitchen Sink" Model ---
print("--- [Step 11] Training Combined Model (V3 - All Features) ---")

# --- 1. Define Paths ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))

# We need all three processed files
IMPACTS_PATH = os.path.join(ROOT_DIR, "data", "processed", "policy_impact_database_V2_local.csv")
FEATURES_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_featurized_local.csv")
EMBEDDINGS_PATH = os.path.join(ROOT_DIR, "data", "processed", "policy_embeddings_local.csv")

MODEL_ARTIFACTS_DIR = os.path.join(ROOT_DIR, "model_artifacts")
MODEL_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "robust_simulator_pipeline_v3.joblib") # Note: v3

os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)
print(f"New (V3) model will be saved to: {MODEL_PATH}")

# --- 2. Load and Merge Data ---
print("Loading all 3 source data files...")
try:
    df_impacts = pd.read_csv(IMPACTS_PATH)
    df_features = pd.read_csv(FEATURES_PATH)
    df_embed = pd.read_csv(EMBEDDINGS_PATH)
except FileNotFoundError as e:
    print(f"❌ ERROR: Data file not found. {e}")
    print("   Please run scripts 4, 7, and 9 first.")
    sys.exit(1)

# Merge impacts + simple features
df_train = pd.merge(
    df_impacts,
    df_features,
    left_on=['policy', 'policy_year'],
    right_on=['Policy', 'Year'],
    how='inner'
)

# Merge the result + embeddings
# Use the 'Policy' and 'Year' columns as the common key
df_train = pd.merge(
    df_train,
    df_embed,
    on=['Policy', 'Year'],
    how='inner'
)

# --- 3. Define Features, Target, and Groups ---
# Clean up redundant columns
if 'Policy' in df_train.columns:
    df_train = df_train.drop(columns=['Policy', 'Year', 'Policy_Content'])

# Clean up any bad LLM rows
df_train = df_train[~df_train['policy_type'].isin(['ParseError', 'Error'])]
df_train = df_train.dropna(subset=['ate', 'pollutant', 'policy_type', 'action_type', 'policy_year', 'embed_0'])

print(f"Loaded and merged {len(df_train)} clean training samples.")

if df_train.empty:
    print("❌ ERROR: No training data available after merging. Exiting.")
    sys.exit(1)

# --- Define Feature Columns ---
# 1. Categorical features
categorical_features = ['pollutant', 'policy_type', 'action_type']

# 2. Numerical features
embedding_features = [col for col in df_train.columns if col.startswith('embed_')]
numerical_features = ['policy_year'] + embedding_features # Combine year + all embeddings

if not embedding_features:
    print("❌ ERROR: No 'embed_' columns found in the merged data.")
    sys.exit(1)

# --- Define Target (y) and Groups (for CV) ---
TARGET_VARIABLE = 'ate'
y_reg = df_train[TARGET_VARIABLE]
groups = df_train['policy']  # For GroupKFold

# --- BIN THE TARGET (Same as V5) ---
bins = [-np.inf, -2.0, 0.5, np.inf]
labels = ['Good Impact', 'Neutral Impact', 'Bad Impact']
y = pd.cut(y_reg, bins=bins, labels=labels)

print("Target variable binned into classes.")

# --- Define Features (X) ---
features_for_X = categorical_features + numerical_features
X = df_train[features_for_X]

print(f"Features (X) created with {len(features_for_X)} columns.")
print(f"Target (y) and {len(groups.unique())} policy groups defined.")

# --- 4. Build Preprocessing and Model Pipeline ---

# We need to OneHotEncode the categorical features
# And pass through all numerical features (year + embeddings)
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
    ],
    remainder='passthrough' # <-- Passes year + all embeddings
)

# Use the same robust RandomForestClassifier
model_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(
        n_estimators=100,
        max_depth=7,
        min_samples_leaf=15,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    ))
])

print("Model pipeline built successfully (OHE[cats] + PassThrough[nums/embeds] + RFClassifier).")

# --- 5. Evaluate the Robust Model (with GroupKFold) ---
print("Evaluating model using 10-fold GroupKFold cross-validation...")

n_splits = 10 
if len(groups.unique()) < n_splits:
    n_splits = len(groups.unique())
    
cv_strategy = GroupKFold(n_splits=n_splits)

try:
    scores = cross_val_score(
        model_pipeline, 
        X, 
        y,                   
        groups=groups,       
        cv=cv_strategy,      
        scoring='f1_weighted',
        n_jobs=-1
    )
    
    print(f"✅ Cross-Validation F1-Scores: {[round(s, 4) for s in scores]}")
    print(f"✅ Average F1-Score: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")

except Exception as e:
    print(f"❌ ERROR during cross-validation: {e}")
    sys.exit(1)

# --- 6. Train and Save Final Model ---
print("Training final model on all data...")
model_pipeline.fit(X, y)

joblib.dump(model_pipeline, MODEL_PATH)

print("\n--- 🚀 COMPLETE ---")
print(f"✅✅✅ Success! New COMBINED model (V3) saved to:")
print(f"   {MODEL_PATH}")

if scores.mean() > 0.8:
    print(f"This model has a STABLE F1-Score of ~{scores.mean()*100:.2f}%. This is excellent!")
else:
    print("Model performance is similar/worse. The simple features may have been better.")