import pandas as pd
from dowhy import CausalModel
import logging
import warnings

# Suppress common warnings
warnings.filterwarnings("ignore", category=FutureWarning)
logging.getLogger("dowhy").setLevel(logging.ERROR) # Only show errors

def run_causal_analysis(df, treatment_col, outcome_cols, common_causes_list):
    """
    Runs a causal analysis for a given treatment on multiple outcomes.
    
    Args:
        df (pd.DataFrame): The pre-cleaned DataFrame.
        treatment_col (str): The name of the binary treatment column.
        outcome_cols (list): A list of outcome column names (pollutants).
        common_causes_list (list): A list of common cause column names (confounders).
        
    Returns:
        list: A list of dictionaries, one for each outcome, containing results.
    """
    
    results = []
    
    for outcome in outcome_cols:
        print(f"  > Analyzing: {treatment_col} -> {outcome}")
        ate_value = None
        p_value_ate = None
        p_value_placebo = None

        try:
            # Check for zero variance in outcome
            if df[outcome].nunique(dropna=False) <= 1:
                print(f"    ⚠️ SKIPPED: '{outcome}' has zero or only one unique value.")
                continue

            # 1. Define Model
            model = CausalModel(
                data=df,
                treatment=treatment_col,
                outcome=outcome,
                common_causes=common_causes_list
            )
            
            # 2. Identify
            identified_estimand = model.identify_effect(proceed_when_unidentifiable=True)
            
            # 3. Estimate
            estimate = model.estimate_effect(
                identified_estimand,
                method_name="backdoor.linear_regression",
                test_significance=True
            )
            ate_value = estimate.value
            
            # Get P-Value for ATE
            sig_test = estimate.test_stat_significance()
            if sig_test and 'p_value' in sig_test and len(sig_test['p_value']) > 0:
                pval_candidate = sig_test['p_value'][0]
                if pd.notna(pval_candidate): 
                    p_value_ate = float(pval_candidate)
            
            # 4. Refute (Placebo)
            refute_placebo = model.refute_estimate(
                identified_estimand, estimate,
                method_name="placebo_treatment_refuter",
                placebo_type="permute", num_simulations=50 # Use fewer for speed
            )
            if refute_placebo and hasattr(refute_placebo, 'refutation_result'):
                ref_result = refute_placebo.refutation_result
                if isinstance(ref_result, dict) and 'p_value' in ref_result:
                    pval_candidate = ref_result['p_value']
                    if pd.notna(pval_candidate): 
                        p_value_placebo = float(pval_candidate)
                        
            # Store results
            results.append({
                'policy': treatment_col,
                'pollutant': outcome,
                'ate': ate_value,
                'p_value_ate': p_value_ate,
                'p_value_placebo': p_value_placebo
            })

        except Exception as e:
            print(f"    ❌ ERROR processing {outcome}: {e}")
            results.append({
                'policy': treatment_col,
                'pollutant': outcome,
                'ate': None,
                'p_value_ate': None,
                'p_value_placebo': None
            })
            
    return results