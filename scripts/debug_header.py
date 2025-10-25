import pandas as pd
import os

# --- Configuration ---
# Let's just look at the first file that failed
FILE_TO_DEBUG = os.path.join("data", "raw", "Pollutants", "EDGAR_BC_1970_2022.xlsx")

# --- Main Script ---
try:
    print(f"--- Reading top 20 rows from {FILE_TO_DEBUG} ---")

    # Read the file with NO header specified
    # and only read the first 20 rows
    df = pd.read_excel(FILE_TO_DEBUG, header=None, nrows=20)

    # Print the entire DataFrame (all 20 rows)
    print(df.to_string())

    print("---")
    print("Done. Please paste the output above so we can find the real header row.")

except FileNotFoundError:
    print(f"❌ ERROR: File not found at {FILE_TO_DEBUG}")
except Exception as e:
    print(f"An error occurred: {e}")