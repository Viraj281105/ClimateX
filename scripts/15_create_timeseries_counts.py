import pandas as pd
import os
import sys
from tqdm import tqdm

print("--- [Step 15] Creating Time-Series COUNT Dataset ---")

# --- 1. Define Paths ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))

MASTER_DATA_PATH = os.path.join(ROOT_DIR, "data", "processed", "master_dataset_india.csv")
POLICIES_LIST_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_featurized_local.csv")
OUTPUT_PATH = os.path.join(ROOT_DIR, "data", "processed", "timeseries_counts_dataset.csv")

# --- 2. Load Base Data (Confounders/Pollutants) ---
print("Loading and cleaning master emissions/confounder data...")
try:
    df_raw = pd.read_csv(MASTER_DATA_PATH)
except FileNotFoundError:
    print(f"❌ ERROR: Master data file not found at {MASTER_DATA_PATH}")
    sys.exit(1)

# (Re-using the same robust cleaning logic from Script 13)
id_confounder_policy_cols = [
    'Country_Name', 'Year', 'GDP per capita (constant 2015 US$)',
    'Industry (including construction), value added (% of GDP)',
    'Population, total',
    'Renewable energy consumption (% of total final energy consumption)',
    'policy_NAPCC_active'
]
pollutant_cols = [col for col in df_raw.columns if col.startswith(('EDGAR_', 'HCB_', 'PAH_', 'PCB_', 'PCDD_'))]
agg_dict = {poll_col: 'sum' for poll_col in pollutant_cols if poll_col in df_raw.columns}
agg_dict.update({conf_col: 'first' for conf_col in id_confounder_policy_cols if conf_col in df_raw.columns and conf_col not in ['Year']})
df_agg = df_raw.groupby('Year').agg(agg_dict).reset_index()

df_base = df_agg.rename(columns={
    'policy_NAPCC_active': 'policy_NAPCC_2008',
    'GDP per capita (constant 2015 US$)'                 : 'confounder_gdp',
    'Industry (including construction), value added (% of GDP)': 'confounder_industry_pct',
    'Population, total'                                  : 'confounder_population',
    'Renewable energy consumption (% of total final energy consumption)': 'confounder_renewables_pct'
})
df_base = df_base.ffill().bfill()
print("Master data cleaned.")

# --- 3. Load Policies List ---
print("Loading featurized policies list...")
try:
    df_policies = pd.read_csv(POLICIES_LIST_PATH)
    # Use the clean policies from Script 7
    df_policies = df_policies.dropna(subset=['Year', 'Policy', 'policy_type', 'action_type'])
    df_policies = df_policies[~df_policies['policy_type'].isin(['ParseError', 'Error'])]
    df_policies['Year'] = df_policies['Year'].astype(int)
    print(f"Loaded {len(df_policies)} classified policies.")
except FileNotFoundError:
    print(f"❌ ERROR: Featurized policy file not found at {POLICIES_LIST_PATH}")
    sys.exit(1)

# --- 4. Create New Count Columns ---
# Get all unique policy types and action types
unique_policy_types = df_policies['policy_type'].unique()
unique_action_types = df_policies['action_type'].unique()

# Create new column names for them
policy_type_cols = [f"policy_count_type_{ptype}" for ptype in unique_policy_types]
action_type_cols = [f"policy_count_action_{atype}" for atype in unique_action_types]

# Add these new columns to our base DataFrame, initialized to 0
for col in policy_type_cols + action_type_cols:
    df_base[col] = 0

print(f"Created {len(policy_type_cols)} policy type columns.")
print(f"Created {len(action_type_cols)} action type columns.")

# --- 5. Loop Through Years and Calculate Counts ---
print("Calculating active policy counts for each year...")

# Iterate through each YEAR in our main dataset (e.g., 1970, 1971, ...)
for index, row in tqdm(df_base.iterrows(), total=df_base.shape[0]):
    current_year = row['Year']
    
    # Find all policies that were active in or before this year
    active_policies = df_policies[df_policies['Year'] <= current_year]
    
    if active_policies.empty:
        continue # No policies active yet
        
    # Get the counts of each type of policy
    policy_type_counts = active_policies['policy_type'].value_counts()
    action_type_counts = active_policies['action_type'].value_counts()
    
    # Update the row in df_base with these counts
    for ptype, count in policy_type_counts.items():
        df_base.at[index, f"policy_count_type_{ptype}"] = count
        
    for atype, count in action_type_counts.items():
        df_base.at[index, f"policy_count_action_{atype}"] = count

print("Policy counts calculated.")

# --- 6. Save Final Dataset ---
# De-fragment the DataFrame (as suggested by the previous warning)
df_base = df_base.copy()
df_base.to_csv(OUTPUT_PATH, index=False)

print("\n--- 🚀 COMPLETE ---")
print(f"✅✅✅ Success! New COUNT-BASED Time-Series dataset saved to:")
print(f"   {OUTPUT_PATH}")
print(f"\nDataset shape (rows, columns): {df_base.shape}")
print("\n--- Sample of Final Dataset (first 5 rows, last 5 columns) ---")
print(df_base.iloc[:5, -5:].head())