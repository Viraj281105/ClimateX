import pandas as pd
import os

# --- Configuration ---
PROCESSED_DATA_PATH = os.path.join("data", "processed")
POLLUTANTS_FILE = os.path.join(PROCESSED_DATA_PATH, "pollutants.csv")
CONFOUNDERS_FILE = os.path.join(PROCESSED_DATA_PATH, "confounders.csv")
OUTPUT_FILE = os.path.join(PROCESSED_DATA_PATH, "master_dataset_india.csv")

COUNTRY_TO_FILTER = "India"
POLICY_START_YEAR = 2008 # NAPCC launch year

# --- Helper Function ---
def melt_data(df, id_vars, value_name):
    """
    Melts a "wide" DataFrame (years as columns) into a "long" DataFrame.
    Renames 'Y_1970' to '1970', converts to integer, and filters for valid years.
    """
    # 1. Rename 'Y_1970' to '1970', etc.
    # Make sure to handle potential non-string column names first
    df = df.rename(columns=lambda col: str(col).replace('Y_', '') if str(col).startswith('Y_') else str(col))

    # 2. Get all year columns (now strings like '1970')
    year_cols = [col for col in df.columns if col.isdigit()]

    # 3. Melt the DataFrame
    df_long = df.melt(
        id_vars=id_vars,
        value_vars=year_cols,
        var_name='Year',
        value_name=value_name
    )

    # 4. Convert Year to numeric
    df_long['Year'] = pd.to_numeric(df_long['Year'])
    return df_long

# --- Main Script ---
print("--- Task C: Starting Final Merge for India ---")

try:
    # --- 1. Load and Process Pollutants ---
    print(f"Loading pollutants from {POLLUTANTS_FILE}...")
    df_poll = pd.read_csv(POLLUTANTS_FILE, low_memory=False) # Added low_memory=False for safety

    # Filter for India
    # Ensure 'Country_Name' exists before filtering
    if 'Country_Name' not in df_poll.columns:
         raise ValueError("'Country_Name' column not found in pollutants.csv. Check the cleaning script.")
    df_poll_india = df_poll[df_poll['Country_Name'] == COUNTRY_TO_FILTER].copy()

    # Check for necessary columns before filtering totals
    if 'ipcc_code_2006_for_standard_report' not in df_poll_india.columns:
        print("Warning: 'ipcc_code_2006_for_standard_report' column not found. Attempting merge without filtering for TOTALS.")
    else:
         # We only care about the main sector (Total emissions) - check if 'TOTALS' exists
        if 'TOTALS' in df_poll_india['ipcc_code_2006_for_standard_report'].unique():
            df_poll_india = df_poll_india[df_poll_india['ipcc_code_2006_for_standard_report'] == 'TOTALS'].copy()
        else:
             print("Warning: 'TOTALS' value not found in 'ipcc_code_2006_for_standard_report'. Attempting merge without filtering totals.")


    if df_poll_india.empty:
        raise Exception(f"No data rows remaining for '{COUNTRY_TO_FILTER}' after initial filtering in pollutants.csv. Check filter criteria.")

    print(f"Found {len(df_poll_india)} relevant pollutant rows for India.")

    # Melt pollutant data
    id_vars_poll = ['Country_Name', 'Indicator Name'] # Simplified ID vars
    # Ensure id_vars exist
    missing_poll_ids = [v for v in id_vars_poll if v not in df_poll_india.columns]
    if missing_poll_ids:
        raise ValueError(f"Missing required ID columns in pollutants data: {missing_poll_ids}")

    df_poll_long = melt_data(df_poll_india, id_vars_poll, value_name='Emissions')

    # Pivot to make Indicators into columns
    df_poll_final = df_poll_long.pivot_table( # Use pivot_table to handle potential duplicates if any
        index=['Country_Name', 'Year'],
        columns='Indicator Name',
        values='Emissions'
    ).reset_index()


    # --- 2. Load and Process Confounders ---
    print(f"Loading confounders from {CONFOUNDERS_FILE}...")
    df_conf = pd.read_csv(CONFOUNDERS_FILE)

    # Filter for India
    # Ensure 'Country Name' exists before filtering
    if 'Country Name' not in df_conf.columns:
        raise ValueError("'Country Name' column not found in confounders.csv. Check the cleaning script.")
    df_conf_india = df_conf[df_conf['Country Name'] == COUNTRY_TO_FILTER].copy()

    if df_conf_india.empty:
        raise Exception(f"No data for '{COUNTRY_TO_FILTER}' found in confounders.csv. Check country name.")

    # Melt confounder data
    id_vars_conf = ['Country Name', 'Indicator Name']
    # Ensure id_vars exist
    missing_conf_ids = [v for v in id_vars_conf if v not in df_conf_india.columns]
    if missing_conf_ids:
        raise ValueError(f"Missing required ID columns in confounders data: {missing_conf_ids}")

    df_conf_long = melt_data(df_conf_india, id_vars_conf, value_name='Value')

    # Pivot to make Indicators into columns
    df_conf_final = df_conf_long.pivot_table( # Use pivot_table
        index=['Country Name', 'Year'],
        columns='Indicator Name',
        values='Value'
    ).reset_index()

    # Rename country column for merging
    df_conf_final = df_conf_final.rename(columns={'Country Name': 'Country_Name'})


    # --- 3. Merge Datasets ---
    print("Merging pollutant and confounder data...")
    master_df = pd.merge(
        df_poll_final,
        df_conf_final,
        on=['Country_Name', 'Year'],
        how='left' # Keep all pollutant years, add confounders where available
    )

    # --- 4. Add Policy "Treatment" Column ---
    # National Action Plan on Climate Change (NAPCC) was June 2008
    master_df['policy_NAPCC_active'] = (master_df['Year'] >= POLICY_START_YEAR).astype(int)

    # --- 5. Save Final Dataset ---
    master_df.to_csv(OUTPUT_FILE, index=False)

    print("---")
    print(f"✅✅✅ CONGRATULATIONS! ✅✅✅")
    print(f"Final 'master_dataset_india.csv' is ready!")
    print(f"It has been saved in your '{PROCESSED_DATA_PATH}' folder.")
    print("\nHere's a preview of your final, analysis-ready data:")
    print(master_df.head())
    print(f"\nDataFrame shape (rows, columns): {master_df.shape}")
    print("\nColumns in final dataset:")
    print(master_df.columns.tolist())


except FileNotFoundError as e:
    print(f"❌ ERROR: File not found. Make sure these files exist: \n{POLLUTANTS_FILE}\n{CONFOUNDERS_FILE}")
    print(e)
except Exception as e:
    print(f"An unexpected error occurred: {e}")