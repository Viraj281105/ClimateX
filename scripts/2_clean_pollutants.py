import pandas as pd
import os
import glob

# --- Configuration ---
RAW_DATA_PATH = os.path.join("data", "raw", "Pollutants")
PROCESSED_DATA_PATH = os.path.join("data", "processed")
OUTPUT_FILE_PATH = os.path.join(PROCESSED_DATA_PATH, "pollutants.csv")

# We now know the header can be on row 10, 11, or 22
HEADER_ROWS_TO_TRY = [9, 10, 21] # Indices: 9, 10, 21

# We know the country column can be 'Name' or 'Country_Name'
COUNTRY_COLUMNS_TO_TRY = ['Name', 'Country_Name']

# --- Main Script ---
try: # Outer try: handles errors like finding files initially
    all_files = glob.glob(os.path.join(RAW_DATA_PATH, "*.xlsx"))

    if not all_files:
        print(f"❌ ERROR: No .xlsx files found in {RAW_DATA_PATH}")
    else:
        print(f"Found {len(all_files)} pollutant files. Processing...")

        df_list = []
        skipped_files = []

        # --- Loop through each file ---
        for file in all_files:
            file_name = os.path.basename(file)
            df = None
            header_found = False

            try: # Inner try: handles errors specific to reading/processing THIS file
                # 1. Try to find the correct header row
                for header_row in HEADER_ROWS_TO_TRY:
                    # Use a nested try/except to handle read errors for specific headers
                    try:
                        temp_df = pd.read_excel(file, header=header_row)

                        # 2. Check if this header contains a valid country column
                        for col_name in COUNTRY_COLUMNS_TO_TRY:
                            if col_name in temp_df.columns:
                                print(f"  ✅ Processed: '{file_name}' (Header found on row {header_row + 1})")
                                df = temp_df # This is our valid DataFrame

                                # 3. Standardize the country column name
                                if col_name != 'Country_Name':
                                    df = df.rename(columns={col_name: 'Country_Name'})

                                header_found = True
                                break # Found a valid column, stop checking columns
                        if header_found:
                            break # Found a valid header, stop checking rows

                    except Exception as read_error:
                        # Error reading with THIS specific header, try the next one
                        # print(f"  DEBUG: Error reading {file_name} with header {header_row}: {read_error}") # Uncomment for deeper debug
                        continue # Go to the next header_row

                # 4. If we have a valid DataFrame after trying all headers
                if df is not None:
                    pollutant_name = file_name.split('.')[0]
                    df['Indicator Name'] = pollutant_name
                    df_list.append(df)
                else:
                    # Only skip if NO valid header was found after trying all
                    if not header_found:
                        print(f"  ⚠️ SKIPPED: '{file_name}' (No valid header found in expected rows)")
                        skipped_files.append(file_name)

            except Exception as process_error:
                # --- This catches FATAL errors for THIS file ---
                print(f"  ❌ FATAL ERROR processing {file_name}: {process_error}")
                skipped_files.append(file_name)
                # Continue to the next file in the loop

        # --- End of loop ---

        # 5. Combine all *good* DataFrames into one
        if not df_list:
            print("---")
            print("❌ FAILED: No files with a valid header were successfully processed.")
        else:
            combined_df = pd.concat(df_list, ignore_index=True)

            # 6. Save the combined file
            combined_df.to_csv(OUTPUT_FILE_PATH, index=False)

            print("---")
            print(f"✅ Success! Your new file 'pollutants.csv' is ready.")
            print(f"   It has been saved in your '{PROCESSED_DATA_PATH}' folder.")
            print(f"   Successfully merged {len(df_list)} files.")
            if skipped_files:
                print(f"   Skipped {len(skipped_files)} files: {skipped_files}")
            print("\nHere's a preview of your new, combined data:")
            print(combined_df.head())
            print(f"\nDataFrame shape (rows, columns): {combined_df.shape}")

except Exception as outer_error:
    # --- This catches errors outside the file loop (e.g., glob failing) ---
    print(f"An unexpected error occurred outside the file processing loop: {outer_error}")