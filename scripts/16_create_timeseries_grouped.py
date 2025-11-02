import pandas as pd
import os
import sys
from tqdm import tqdm

print("--- [Step 16] Creating Time-Series GROUPED Dataset ---")

# --- 1. Define Paths ---
try:
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))

MASTER_DATA_PATH = os.path.join(ROOT_DIR, "data", "processed", "master_dataset_india.csv")
POLICIES_LIST_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_featurized_local.csv")
OUTPUT_PATH = os.path.join(ROOT_DIR, "data", "processed", "timeseries_grouped_dataset.csv")

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

# --- 3. Define the Manual Grouping "Buckets" ---

# We map all 93 policy types into 8 Sectors
POLICY_TYPE_MAP = {
    # Energy Sector
    'RenewableEnergy': 'SECTOR_Energy',
    'EnergyEfficiency': 'SECTOR_Energy',
    'Solar': 'SECTOR_Energy',
    'Wind': 'SECTOR_Energy',
    'Grid': 'SECTOR_Energy',
    'Nuclear': 'SECTOR_Energy',
    'Biofuels': 'SECTOR_Energy',
    'Energy': 'SECTOR_Energy',
    
    # Industry Sector
    'Industrial': 'SECTOR_Industry',
    'Manufacturing': 'SECTOR_Industry',
    'Mining': 'SECTOR_Industry',
    
    # Transport Sector
    'Transport': 'SECTOR_Transport',
    'ElectricVehicles': 'SECTOR_Transport',
    'FuelEconomy': 'SECTOR_Transport',

    # Land Use, Land-Use Change, and Forestry (LULUCF)
    'Forestry': 'SECTOR_LULUCF',
    'Agriculture': 'SECTOR_LULUCF',
    'WaterManagement': 'SECTOR_LULUCF',
    'LandUse': 'SECTOR_LULUCF',

    # Buildings & Waste
    'BuildingStandards': 'SECTOR_Buildings',
    'UrbanDevelopment': 'SECTOR_Buildings',
    'WasteManagement': 'SECTOR_Waste',
    'CircularEconomy': 'SECTOR_Waste',
    
    # General Framework
    'Framework': 'SECTOR_Framework',
    'ClimatePolicy': 'SECTOR_Framework',
    'General': 'SECTOR_Framework',

    # Air Quality (Specific)
    'AirQualityStandard': 'SECTOR_AirQuality',
}
# Any policy not in this map will be grouped as 'SECTOR_Other'

# We map all 42 action types into 6 Levers
ACTION_TYPE_MAP = {
    # Regulatory Lever
    'Regulation': 'LEVER_Regulatory',
    'Standard': 'LEVER_Regulatory',
    'Law': 'LEVER_Regulatory',
    'Ban': 'LEVER_Regulatory',
    'Amendment': 'LEVER_Regulatory',
    'Compliance': 'LEVER_Regulatory',

    # Financial Lever
    'Investment': 'LEVER_Financial',
    'TaxIncentive': 'LEVER_Financial',
    'Incentive': 'LEVER_Financial',
    'Subsidy': 'LEVER_Financial',
    'Fund': 'LEVER_Financial',
    'Financial': 'LEVER_Financial',

    # R&D Lever
    'R&D': 'LEVER_RD',
    'Research': 'LEVER_RD',
    'Technology': 'LEVER_RD',

    # Informational Lever
    'Education': 'LEVER_Informational',
    'Awareness': 'LEVER_Informational',
    'Strategic Planning': 'LEVER_Informational',
    'Cooperation': 'LEVER_Informational',
    'PolicyFormulation': 'LEVER_Informational',

    # General / Other
    'General': 'LEVER_General',
}
# Any action not in this map will be grouped as 'LEVER_Other'

print("Defined policy groupings (Sectors and Levers).")

# --- 4. Load and Map Policies to New Groups ---
print("Loading and mapping featurized policies...")
try:
    df_policies = pd.read_csv(POLICIES_LIST_PATH)
    df_policies = df_policies.dropna(subset=['Year', 'Policy', 'policy_type', 'action_type'])
    df_policies = df_policies[~df_policies['policy_type'].isin(['ParseError', 'Error'])]
    df_policies['Year'] = df_policies['Year'].astype(int)
except FileNotFoundError:
    print(f"❌ ERROR: Featurized policy file not found at {POLICIES_LIST_PATH}")
    sys.exit(1)

# Apply the mapping
df_policies['sector_group'] = df_policies['policy_type'].map(POLICY_TYPE_MAP).fillna('SECTOR_Other')
df_policies['lever_group'] = df_policies['action_type'].map(ACTION_TYPE_MAP).fillna('LEVER_Other')

print("Policies successfully mapped to new groups.")

# --- 5. Create New Count Columns ---
# Get all unique *new* group names
unique_sectors = df_policies['sector_group'].unique()
unique_levers = df_policies['lever_group'].unique()

sector_cols = [f"policy_count_{group}" for group in unique_sectors]
lever_cols = [f"policy_count_{group}" for group in unique_levers]

# Add these new columns to our base DataFrame, initialized to 0
for col in sector_cols + lever_cols:
    df_base[col] = 0

print(f"Created {len(sector_cols)} new Sector count columns.")
print(f"Created {len(lever_cols)} new Lever count columns.")

# --- 6. Loop Through Years and Calculate Counts ---
print("Calculating active policy counts for each year...")

for index, row in tqdm(df_base.iterrows(), total=df_base.shape[0]):
    current_year = row['Year']
    
    # Find all policies that were active in or before this year
    active_policies = df_policies[df_policies['Year'] <= current_year]
    
    if active_policies.empty:
        continue
        
    # Get the counts of each *new group*
    sector_counts = active_policies['sector_group'].value_counts()
    lever_counts = active_policies['lever_group'].value_counts()
    
    # Update the row in df_base with these counts
    for sector, count in sector_counts.items():
        df_base.at[index, f"policy_count_{sector}"] = count
        
    for lever, count in lever_counts.items():
        df_base.at[index, f"policy_count_{lever}"] = count

print("Policy counts calculated.")

# --- 7. Save Final Dataset ---
# De-fragment the DataFrame
df_base = df_base.copy()
df_base.to_csv(OUTPUT_PATH, index=False)

print("\n--- 🚀 COMPLETE ---")
print(f"✅✅✅ Success! New GROUPED Time-Series dataset saved to:")
print(f"   {OUTPUT_PATH}")
print(f"\nFinal Dataset shape (rows, columns): {df_base.shape}")
print("\n--- Sample of Final Dataset (first 5 rows, last 5 columns) ---")
print(df_base.iloc[:5, -5:].head())