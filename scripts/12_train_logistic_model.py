import pandas as pd
import joblib
import os
import sys
import numpy as np
from sklearn.model_selection import cross_val_score, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression # <-- 1. NEW IMPORT

# --- [Step 12] Training Robust LogisticRegression Model ---
print("--- [Step 12] Training Robust LogisticRegression Model (V5 features) ---")

# --- 1. Define Paths ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))

FEATURES_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_featurized_local.csv")
IMPACTS_PATH = os.path.join(ROOT_DIR, "data", "processed", "policy_impact_database_V2_local.csv")
MODEL_ARTIFACTS_DIR = os.path.join(ROOT_DIR, "model_artifacts")

# --- THIS WILL OVERWRITE YOUR V5 MODEL ---
MODEL_PATH = os.path.join(MODEL_ARTIFACTS_DIR, "robust_simulator_pipeline.joblib") 

os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)
print(f"Final model will be saved to: {MODEL_PATH}")

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

categorical_features = ['pollutant', 'policy_type', 'action_type']
numerical_features = ['policy_year'] 
TARGET_VARIABLE = 'ate'

X = df_train[categorical_features + numerical_features]
y_reg = df_train[TARGET_VARIABLE]
groups = df_train['policy']

# --- BIN THE TARGET (Same as V5) ---
bins = [-np.inf, -2.0, 0.5, np.inf]
labels = ['Good Impact', 'Neutral Impact', 'Bad Impact']
y = pd.cut(y_reg, bins=bins, labels=labels)

print(f"Features, target, and {len(groups.unique())} policy groups defined.")

# --- 4. Build Preprocessing and Model Pipeline ---

# --- 2. NEW: PREPROCESSOR NEEDS SCALING ---
# Logistic Regression NEEDS numerical features to be scaled.
# We will OneHotEncode categorical and StandardScaler numerical.
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
        ('num', StandardScaler(), numerical_features) # <-- Add scaling
    ],
    remainder='drop'
)

# --- 3. NEW: USE LOGISTIC REGRESSION ---
model_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', LogisticRegression(
        C=0.1, # C is the inverse of regularization strength. Smaller C = stronger regularization.
        solver='liblinear', # Good solver for this type of problem
        penalty='l1', # L1 (Lasso) penalty is great for feature selection
        class_weight='balanced',
        random_state=42
    ))
])

print("Model pipeline built successfully (Preprocessor + LogisticRegression).")

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
print(f"✅✅✅ Success! Robust LOGISTIC model saved to:")
print(f"   {MODEL_PATH}")

if scores.mean() > 0.5:
    print(f"This model has a STABLE F1-Score of ~{scores.mean()*100:.2f}%.")
else:
    print("Model performance is poor. The features may not have enough predictive power.")