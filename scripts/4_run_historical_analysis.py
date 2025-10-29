import pandas as pd
import os
import sys

# Add the root directory to the Python path
# This allows us to import from 'services'
script_dir = os.path.dirname(__file__)
root_dir = os.path.abspath(os.path.join(script_dir, '..'))
sys.path.append(root_dir)

try:
    from services.causal_engine.runner import run_causal_analysis
except ImportError:
    print("❌ ERROR: Could not import 'run_causal_analysis' from 'services.causal_engine.runner'.")
    print("   Make sure the file exists and the root directory is set up correctly.")
    sys.exit(1)

print("--- Starting Historical Policy Impact Analysis ---")

# --- 1. Load and Clean Data ---
# (Using the same logic from your 2.1 notebook)
DATA_PATH = os.path.join(root_dir, "data", "processed", "master_dataset_india.csv")
try:
    df_raw = pd.read_csv(DATA_PATH)
except FileNotFoundError:
    print(f"❌ ERROR: File not found at {DATA_PATH}")
    sys.exit(1)

print("Loading and cleaning data...")
id_confounder_policy_cols = [
    'Country_Name', 'Year', 'GDP per capita (constant 2015 US$)',
    'Industry (including construction), value added (% of GDP)',
    'Population, total',
    'Renewable energy consumption (% of total final energy consumption)',
    'policy_NAPCC_active' # We'll keep this one for comparison
]
pollutant_cols = [col for col in df_raw.columns if col.startswith(('EDGAR_', 'HCB_', 'PAH_', 'PCB_', 'PCDD_'))]
agg_dict = {poll_col: 'sum' for poll_col in pollutant_cols}
agg_dict.update({conf_col: 'first' for conf_col in id_confounder_policy_cols if conf_col not in ['Year']})
df_agg = df_raw.groupby('Year').agg(agg_dict).reset_index()

# Rename columns for the model
df_model = df_agg.rename(columns={
    'policy_NAPCC_active': 'policy_NAPCC_2008', # Rename original
    'GDP per capita (constant 2015 US$)': 'confounder_gdp',
    'Industry (including construction), value added (% of GDP)': 'confounder_industry_pct',
    'Population, total': 'confounder_population',
    'Renewable energy consumption (% of total final energy consumption)': 'confounder_renewables_pct'
})

# Handle Missing Data
df_model = df_model.ffill().bfill()
print("Data cleaning complete.")

# --- 2. Add Placeholder Policy Columns ---
print("Adding placeholder policy treatment columns...")
df_model['policy_NationalSolarMission_2010'] = (df_model['Year'] >= 2010).astype(int)
df_model['policy_NMEEE_2009'] = (df_model['Year'] >= 2009).astype(int)
df_model['policy_SustainHabitat_2010'] = (df_model['Year'] >= 2010).astype(int)

# --- 3. Define Analysis Parameters ---
# Define the policies we want to loop through and analyze
# We include the original NAPCC and our 3 placeholders
POLICIES_TO_RUN = [
    'policy_NAPCC_2008',
    'policy_NationalSolarMission_2010',
    'policy_NMEEE_2009',
    'policy_SustainHabitat_2010'
]

# Define confounders and outcomes
COMMON_CAUSES = [
    'confounder_gdp',
    'confounder_industry_pct',
    'confounder_population',
    'confounder_renewables_pct',
    'Year'
]
OUTCOMES = [col for col in df_model.columns if col.startswith(('EDGAR_', 'HCB_', 'PAH_', 'PCB_', 'PCDD_'))]

# --- 4. Run Analysis Loop ---
print(f"Starting analysis loop for {len(POLICIES_TO_RUN)} policies...")
all_results = []

for policy_name in POLICIES_TO_RUN:
    print(f"\n--- Processing Policy: {policy_name} ---")
    
    # Run the analysis for this policy against all outcomes
    policy_results = run_causal_analysis(
        df_model,
        treatment_col=policy_name,
        outcome_cols=OUTCOMES,
        common_causes_list=COMMON_CAUSES
    )
    all_results.extend(policy_results)

print("\n--- Analysis loop complete. ---")

# --- 5. Save Results ---
results_df = pd.DataFrame(all_results)
results_df = results_df[['policy', 'pollutant', 'ate', 'p_value_ate', 'p_value_placebo']].round(4)

OUTPUT_PATH = os.path.join(root_dir, "data", "processed", "policy_impact_database.csv")
results_df.to_csv(OUTPUT_PATH, index=False)

print(f"\n✅ Success! Policy Impact Database saved to:")
print(f"   {OUTPUT_PATH}")
print("\n--- Final Database Head ---")
print(results_df.head())
print("...")
print(results_df.tail())