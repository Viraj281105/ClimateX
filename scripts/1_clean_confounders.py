#1_clean_confounders.py
import pandas as pd
import os

# --- Configuration ---
# Define the paths based on our new project structure
RAW_DATA_PATH = os.path.join("data", "raw", "Confounders", "WDI")
INPUT_FILE_PATH = os.path.join(RAW_DATA_PATH, "WDICSV.csv")
PROCESSED_DATA_PATH = os.path.join("data", "processed")
OUTPUT_FILE_PATH = os.path.join(PROCESSED_DATA_PATH, "confounders.csv")

# Define the 4 indicators we need (from your screenshots)
INDICATORS_WE_NEED = [
    "GDP per capita (constant 2015 US$)",
    "Industry (including construction), value added (% of GDP)",
    "Population, total",
    "Renewable energy consumption (% of total final energy consumption)"
]

# --- Main Script ---
print(f"Loading the large WDI file from: {INPUT_FILE_PATH}")
print("This may take a minute...")

try:
    # Load the massive CSV file
    df = pd.read_csv(INPUT_FILE_PATH)

    print("File loaded. Filtering for our 4 indicators...")

    # Filter the DataFrame to keep *only* the rows with those indicator names
    filtered_df = df[df['Indicator Name'].isin(INDICATORS_WE_NEED)]

    # Ensure the processed data folder exists
    os.makedirs(PROCESSED_DATA_PATH, exist_ok=True)

    # Save the result to our new, clean confounder file
    filtered_df.to_csv(OUTPUT_FILE_PATH, index=False)

    print("---")
    print(f"✅ Success! Your new file 'confounders.csv' is ready.")
    print(f"It has been saved in your '{PROCESSED_DATA_PATH}' folder.")
    print("Here's a preview of your new, clean data:")
    print(filtered_df.head())

except FileNotFoundError:
    print(f"❌ ERROR: File not found at {INPUT_FILE_PATH}")
    print("Please make sure your 'WDIData.csv' file is in the 'data/raw/Confounders/WDI/' folder.")
except Exception as e:
    print(f"An error occurred: {e}")