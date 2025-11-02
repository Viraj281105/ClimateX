#6_explore_policy_dataset.py
import pandas as pd
import os
import sys

print("--- [Phase 1] Exploring New Policy Dataset ---")

# --- 1. SET YOUR FILE PATHS ---
SCRIPT_DIR = os.path.dirname(__file__)
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

# Use a relative path from the project root
YOUR_POLICY_DB_PATH = os.path.join(ROOT_DIR, "data", "raw", "Policies", "India_Policies.xlsx")
OUTPUT_PATH = os.path.join(ROOT_DIR, "data", "processed", "india_policies_1970_2017.csv")

# --- 2. Load Data ---
try:
    # Use pd.read_excel() for .xlsx files
    df = pd.read_excel(YOUR_POLICY_DB_PATH)
    print(f"✅ Successfully loaded {len(df)} total policies from Excel.")
    print("\n--- Column Headers ---")
    print(list(df.columns))
except FileNotFoundError:
    print(f"❌ ERROR: File not found at '{YOUR_POLICY_DB_PATH}'")
    sys.exit(1)
except ImportError:
    print("❌ ERROR: 'openpyxl' library not found.")
    print("   Please install it to read .xlsx files: pip install openpyxl")
    sys.exit(1)
except Exception as e:
    print(f"❌ ERROR: Could not load file. {e}")
    sys.exit(1)

# --- 3. SET YOUR FILTER PARAMETERS ---
# We know these from your confirmation
ISO_CODE_FOR_INDIA = "IND"
START_YEAR = 1970
END_YEAR = 2017 # The dataset's max year

# --- 4. Filter the DataFrame ---
print(f"\n--- Filtering for '{ISO_CODE_FOR_INDIA}' between {START_YEAR}-{END_YEAR} ---")

# Ensure 'Year' is numeric, handling any errors
df['Year'] = pd.to_numeric(df['Year'], errors='coerce')

# Apply all filters
df_filtered = df[
    (df['ISO'] == ISO_CODE_FOR_INDIA) &
    (df['Year'] >= START_YEAR) &
    (df['Year'] <= END_YEAR)
].copy()

if df_filtered.empty:
    print(f"❌ WARNING: No policies found for ISO '{ISO_CODE_FOR_INDIA}'.")
    print("   Please double-check the ISO code or file contents.")
else:
    print(f"✅ Found {len(df_filtered)} policies matching our criteria.")
    
    # --- 5. Save the Filtered Data ---
    # We only need these columns for the next (LLM) step
    columns_to_keep = ['Year', 'Policy', 'Policy_Content']
    
    # Check if columns exist
    missing_cols = [col for col in columns_to_keep if col not in df_filtered.columns]
    if missing_cols:
        print(f"❌ ERROR: The dataset is missing required columns: {missing_cols}")
    else:
        df_final = df_filtered[columns_to_keep]
        df_final.to_csv(OUTPUT_PATH, index=False)
        print(f"\n✅ Successfully saved filtered data to:")
        print(f"   {OUTPUT_PATH}")
        print("\n--- Sample of Filtered Data ---")
        print(df_final.head())