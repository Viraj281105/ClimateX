# 📈 ClimateX

**A Causal Policy Engine to Measure the Real-World Impact of Global Climate Policies.**

*Project for the PCCOE IGC Hackathon (Demo Due: Nov 15th)*

---

## 🎯 Project Goal

ClimateX is a data-driven platform that moves beyond simple dashboards. Instead of just showing *that* emissions went down (correlation), our engine uses causal inference to determine *why* (causation).

We provide scientifically-backed, evidence-based answers on the real-world effectiveness of climate policy.

## 🚀 Hackathon MVP (The "Kyoto Plan")

To prove our engine's capability within the 3-week hackathon, our MVP is designed to answer one of the most significant questions in climate policy:

**"Did the Kyoto Protocol *actually cause* a measurable reduction in CO2 emissions for the countries that had binding targets?"**

To do this, we are building a causal model that:
1.  **Analyzes a "Treatment Group":** The 43 Annex I countries with binding targets.
2.  **Uses a "Control Group":** The Non-Annex I countries with no binding targets.
3.  **Controls for Confounders:** We isolate the policy's effect from other factors like GDP growth, population, and industrialization.

## 🔧 Tech Stack

* **Python**
* **Pandas:** For all data cleaning, merging, and transformation.
* **DoWhy:** The core causal inference library for modeling.
* **FastAPI:** To serve the final causal model as a public API.
* **Jupyter:** For iterative analysis and data exploration.

## 📊 Data Sources

Our engine is built by merging three distinct data types into a single `master_dataset`:

1.  **Outcome Data (The "Effect"):** Global pollutant emissions (CO2, PM2.5, etc.) from the **EDGAR database**.
2.  **Confounder Data (The "Other Factors"):** Economic and demographic data (GDP, Population, Industry %) from the **World Bank Open Data (WDI)**.
3.  **Policy Data (The "Cause"):** The official Annex I / Non-Annex I country lists and the 2005 intervention date from the **UNFCCC**.

## 📂 Repository Structure
