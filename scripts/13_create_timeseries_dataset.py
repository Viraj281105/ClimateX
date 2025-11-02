import pandas as pd
import os
import sys
import re
from tqdm import tqdm  # <-- THIS IS THE FIX

print("--- [Step 13] Creating Time-Series Analysis Dataset ---")

# --- 1. Define Paths ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))

MASTER_DATA_PATH = os.path.join(ROOT_DIR, "data", "processed", "master_dataset_india.csv")
POLICIES_LIST_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_featurized_local.csv")
OUTPUT_PATH = os.path.join(ROOT_DIR, "data", "processed", "timeseries_analysis_dataset.csv")

# --- 2. Load and Clean Master Emissions/Confounder Data ---
# We use the same robust cleaning logic from script #4
try:
    df_raw = pd.read_csv(MASTER_DATA_PATH)
except FileNotFoundError:
    print(f"❌ ERROR: Master data file not found at {MASTER_DATA_PATH}")
    print("   Please run 'scripts/3_merge_india_data.py' first.")
    sys.exit(1)

print("Loading and cleaning master emissions/confounder data...")
# (Using the same logic from your 4_run_historical_analysis.py)
id_confounder_policy_cols = [
    'Country_Name', 'Year', 'GDP per capita (constant 2015 US$)',
    'Industry (including construction), value added (% of GDP)',
    'Population, total',
    'Renewable energy consumption (% of total final energy consumption)',
    'policy_NAPCC_active'
]
pollutant_cols = [col for col in df_raw.columns if col.startswith(('EDGAR_', 'HCB_', 'PAH_', 'PCB_', 'PCDD_'))]
# Check for missing columns
required_cols = set(id_confounder_policy_cols + pollutant_cols)
missing_in_master = [col for col in required_cols if col not in df_raw.columns and not col.startswith('EDGAR_')] # Be flexible on pollutants
if missing_in_master:
     print(f"❌ ERROR: Master CSV is missing columns: {missing_in_master}")
     sys.exit(1)

agg_dict = {poll_col: 'sum' for poll_col in pollutant_cols if poll_col in df_raw.columns}
agg_dict.update({conf_col: 'first' for conf_col in id_confounder_policy_cols if conf_col in df_raw.columns and conf_col not in ['Year']})
df_agg = df_raw.groupby('Year').agg(agg_dict).reset_index()

# Rename columns for the model
df_base = df_agg.rename(columns={
    'policy_NAPCC_active': 'policy_NAPCC_2008',
    'GDP per capita (constant 2015 US$)': 'confounder_gdp',
    'Industry (including construction), value added (% of GDP)': 'confounder_industry_pct',
    'Population, total': 'confounder_population',
    'Renewable energy consumption (% of total final energy consumption)': 'confounder_renewables_pct'
})

# Handle Missing Data
df_base = df_base.ffill().bfill()
print("Master emissions data cleaned and prepared.")

# --- 3. Load Featurized Policies List ---
try:
    df_policies = pd.read_csv(POLICIES_LIST_PATH)
    # We only need policies that the LLM successfully classified
    df_policies = df_policies.dropna(subset=['Year', 'Policy', 'policy_type', 'action_type'])
    df_policies = df_policies[~df_policies['policy_type'].isin(['ParseError', 'Error'])]
    # Get the first year a policy appears
    df_policies_unique = df_policies.sort_values('Year').drop_duplicates(subset=['Policy'], keep='first')
    print(f"Loaded {len(df_policies_unique)} unique policies to create features for.")
except FileNotFoundError:
    print(f"❌ ERROR: Featurized policy file not found at {POLICIES_LIST_PATH}")
    print("   Please run 'scripts/7_featurize_policies_llm.py' first.")
    sys.exit(1)

# --- 4. Helper Function to "Slugify" Policy Names ---
def slugify(text):
    """
    Converts a policy name into a valid, clean column name.
    e.g., "National Solar Mission (2008)" -> "policy_national_solar_mission_2008"
    """
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text) # Remove special chars
    text = re.sub(r'[\s-]+', '_', text)   # Replace spaces and hyphens with _
    text = text.strip('_')
    return f"policy_{text[:50]}" # Add prefix and limit length

# --- 5. Create Policy "Dummy" Columns ---
print("Creating policy dummy variables (this may take a moment)...")

policy_cols_created = []
for index, policy_row in tqdm(df_policies_unique.iterrows(), total=df_policies_unique.shape[0]):
    
    policy_name = policy_row['Policy']
    policy_year = int(policy_row['Year'])
    
    # Create a clean column name, e.g., "policy_national_solar_mission"
    treatment_col_name = slugify(policy_name)
    
    # Add the binary treatment column (1 if year >= policy_year, 0 otherwise)
    df_base[treatment_col_name] = (df_base['Year'] >= policy_year).astype(int)
    policy_cols_created.append(treatment_col_name)

print(f"Successfully created {len(policy_cols_created)} policy dummy columns.")

# --- 6. Save Final Time-Series Dataset ---
df_base.to_csv(OUTPUT_PATH, index=False)

print("\n--- 🚀 COMPLETE ---")
print(f"✅✅✅ Success! New Time-Series dataset saved to:")
print(f"   {OUTPUT_PATH}")
print(f"\nDataset shape (rows, columns): {df_base.shape}")
print("\n--- Sample of Final Dataset (first 5 rows, first 7 columns) ---")
print(df_base.iloc[:5, :7].head())