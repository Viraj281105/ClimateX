#4_run_historical_analysis.py
import pandas as pd
import os
import sys
from tqdm import tqdm

# Add the root directory to the Python path
script_dir = os.path.dirname(__file__)
root_dir = os.path.abspath(os.path.join(script_dir, '..'))
sys.path.append(root_dir)

try:
    from services.causal_engine.runner import run_causal_analysis
except ImportError:
    print("❌ ERROR: Could not import 'run_causal_analysis' from 'services.causal_engine.runner'.")
    sys.exit(1)

print("--- Starting Historical Policy Impact Analysis (V2 - Scaled) ---")

# --- 1. Define Paths ---
MASTER_DATA_PATH = os.path.join(root_dir, "data", "processed", "master_dataset_india.csv")
FEATURIZED_POLICIES_PATH = os.path.join(root_dir, "data", "processed", "india_policies_featurized_local.csv")
OUTPUT_PATH = os.path.join(root_dir, "data", "processed", "policy_impact_database_V2_local.csv")

# --- 2. Load and Clean Master Emissions Data ---
try:
    df_raw = pd.read_csv(MASTER_DATA_PATH)
except FileNotFoundError:
    print(f"❌ ERROR: Master data file not found at {MASTER_DATA_PATH}")
    sys.exit(1)

print("Loading and cleaning master emissions data...")
# (Using the same logic from your 2.1 notebook)
id_confounder_policy_cols = [
    'Country_Name', 'Year', 'GDP per capita (constant 2015 US$)',
    'Industry (including construction), value added (% of GDP)',
    'Population, total',
    'Renewable energy consumption (% of total final energy consumption)',
    'policy_NAPCC_active'
]
pollutant_cols = [col for col in df_raw.columns if col.startswith(('EDGAR_', 'HCB_', 'PAH_', 'PCB_', 'PCDD_'))]
agg_dict = {poll_col: 'sum' for poll_col in pollutant_cols}
agg_dict.update({conf_col: 'first' for conf_col in id_confounder_policy_cols if conf_col not in ['Year']})
df_agg = df_raw.groupby('Year').agg(agg_dict).reset_index()

# Rename columns for the model
df_model = df_agg.rename(columns={
    'policy_NAPCC_active': 'policy_NAPCC_2008',
    'GDP per capita (constant 2015 US$)': 'confounder_gdp',
    'Industry (including construction), value added (% of GDP)': 'confounder_industry_pct',
    'Population, total': 'confounder_population',
    'Renewable energy consumption (% of total final energy consumption)': 'confounder_renewables_pct'
})

# Handle Missing Data
df_model = df_model.ffill().bfill()
print("Master emissions data cleaned.")

# --- 3. Load Featurized Policies ---
try:
    df_policies = pd.read_csv(FEATURIZED_POLICIES_PATH)
    # We only need policies that the LLM successfully classified
    df_policies = df_policies.dropna(subset=['Year', 'Policy', 'policy_type', 'action_type'])
    df_policies = df_policies[~df_policies['policy_type'].isin(['ParseError', 'Error'])]
    print(f"Loaded {len(df_policies)} featurized policies to analyze.")
except FileNotFoundError:
    print(f"❌ ERROR: Featurized policy file not found at {FEATURIZED_POLICIES_PATH}")
    print("   Please run 'scripts/7_featurize_policies_llm.py' first.")
    sys.exit(1)

# --- 4. Define Analysis Parameters ---
COMMON_CAUSES = [
    'confounder_gdp',
    'confounder_industry_pct',
    'confounder_population',
    'confounder_renewables_pct',
    'Year'
]
OUTCOMES = [col for col in df_model.columns if col.startswith(('EDGAR_', 'HCB_', 'PAH_', 'PCB_', 'PCDD_'))]

# --- 5. Run Analysis Loop (At Scale) ---
print(f"Starting analysis loop for {len(df_policies)} policies against {len(OUTCOMES)} pollutants...")
all_results = []

# This loop is smart: it creates a new treatment column *temporarily*
# for each policy, runs the analysis, and saves the results.
for index, policy_row in tqdm(df_policies.iterrows(), total=df_policies.shape[0]):
    
    policy_name = policy_row['Policy']
    policy_year = int(policy_row['Year'])
    
    # Create a temporary copy of the dataframe for this analysis
    df_temp = df_model.copy()
    
    # Define the *temporary* treatment column name
    treatment_col_name = "temp_treatment_col"
    
    # Add the binary treatment column (1 if year >= policy_year)
    df_temp[treatment_col_name] = (df_temp['Year'] >= policy_year).astype(int)
    
    # Run the causal analysis for this one policy against all pollutants
    policy_results = run_causal_analysis(
        df_temp,
        treatment_col=treatment_col_name,
        outcome_cols=OUTCOMES,
        common_causes_list=COMMON_CAUSES
    )
    
    # --- IMPORTANT ---
    # Modify the results to use the *real policy name*
    # instead of 'temp_treatment_col'
    for result_dict in policy_results:
        result_dict['policy'] = policy_name # Use the full, real name
        result_dict['policy_year'] = policy_year
    
    all_results.extend(policy_results)

print("\n--- Analysis loop complete. ---")

# --- 6. Save Results ---
results_df = pd.DataFrame(all_results)
results_df = results_df[['policy', 'policy_year', 'pollutant', 'ate', 'p_value_ate', 'p_value_placebo']].round(4)

OUTPUT_PATH = os.path.join(root_dir, "data", "processed", "policy_impact_database_V2_local.csv")
results_df.to_csv(OUTPUT_PATH, index=False)

print(f"\n✅ Success! New Policy Impact Database saved to:")
print(f"   {OUTPUT_PATH}")
print(f"   Total ATEs calculated: {len(results_df)}")
print("\n--- Final Database Head ---")
print(results_df.head())