import pandas as pd
import os

# --- Configuration ---
# Let's debug one of the 5 skipped files
FILE_TO_DEBUG = os.path.join("data", "raw", "Pollutants", "IEA_EDGAR_CO2_1970_2023.xlsx")

# --- Main Script ---
try:
    print(f"--- Reading top 30 rows from {FILE_TO_DEBUG} ---") # Increased to 30

    # Read the file with NO header specified
    # and only read the first 30 rows
    df = pd.read_excel(FILE_TO_DEBUG, header=None, nrows=30) # Increased to 30

    # Print the entire DataFrame (all 30 rows)
    print(df.to_string())

    print("---")
    print("Done. Please paste the output above so we can find the real header row.")

except FileNotFoundError:
    print(f"❌ ERROR: File not found at {FILE_TO_DEBUG}")
except Exception as e:
    print(f"An error occurred: {e}")