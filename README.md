# The Dual Paradox: AI Investment & Workforce Displacement (2024–2026)

[![Replication](https://img.shields.io/badge/Replication-Complete-success.svg)](#econometric-replication)
[![Python 3.8+](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository contains the complete replication code, datasets, academic paper source files, and the interactive research portal for the study **"The Dual Paradox: AI Investment & Workforce Displacement (2024–2026)"**. 

This research investigates the complex, non-linear relationship between corporate artificial intelligence capital expenditures and workforce reductions. It operationalizes **6 Research Questions** and **5 Objectives** across a **three-layer mixed-methods analytical framework** combining macro-level panel regressions, corporate case studies, and demographic cohort difference-in-differences (DiD) analyses.

---

## 📊 Core Findings

1. **The Scale Paradox (RQ1 & RQ2):** AI-attributed layoffs rose **+1,100% year-on-year in 2025** (reaching 55,000 cuts). However, they represent only **4.7% of total U.S. layoffs (1,170,000)**. Post-pandemic correction, macroeconomic pressures, and cost optimization remain the dominant labor market drivers.
2. **Econometric Causality (RQ1):** Panel regression models confirm a genuine causal link. A 10 percentage-point increase in a firm's AI CapEx share raises its quarterly layoff rate by approximately **1.1 to 1.6 percentage points** ($p < 0.05$ across Pooled OLS, Entity FE, and Two-Way FE specifications).
3. **The "AI-Washing" Loophole (RQ1 Sub-analysis):** An estimated **15% to 25%** of AI-cited layoffs lack sufficient causal evidence. In Class C ("AI-Washed") companies (e.g., Block, Omnicom), actual AI CapEx has **no statistically significant relationship** with layoff rates ($p = 0.23$), indicating that "AI restructuring" is frequently cited as narrative cover for standard cost reduction.
4. **Early-Career Vulnerability (RQ3):** Workers aged 22–25 in high-AI-exposure roles face a **13% to 16% relative employment decline** ($p < 0.001$). AI-driven restructuring disproportionately narrows the entry point for corporate careers rather than displacing mid-career specialists.
5. **Augmentation vs. Displacement (RQ4):** **83%** of firms with AI-driven productivity gains did NOT reduce headcount. Displacement is a strategic management choice rather than a technological inevitability.
6. **Equilibrium and Headroom (RQ6):** While the late 2025/early 2026 deceleration suggests a cyclical plateau in the current wave, **82% of technical displacement headroom** remains untapped according to MIT's feasibility index, signaling significant future structural risk.

---

## 📁 Repository Structure

```
├── README.md                              # This research index
├── .gitignore                             # Git exclusion configuration
├── ai_layoffs_firm_level.csv              # [Local Only] 12-firm, 9-quarter panel dataset (108 observations)
├── ai_exposure_occupation_level.csv       # [Local Only] 30-occupation, 4-year cohort panel dataset (120 observations)
├── ai_layoffs_firm_level.dta              # [Local Only] Stata-compatible format for firm panel
├── ai_exposure_occupation_level.dta       # [Local Only] Stata-compatible format for cohort panel
├── AI_Layoffs_Full_Research_Paper.pdf     # [Local Only] Full academic paper PDF
├── AI_Layoffs_Full_Research_Paper.txt     # [Local Only] Plain-text source copy of full research
├── AI_Layoffs_Analysis_Paper.pdf          # [Local Only] Summary policy analysis paper
├── AI_Layoffs_Analysis_Paper.txt          # [Local Only] Plain-text summary copy
│
├── dashboard/                             # Interactive Research Portal
│   ├── index.html                         # Portal UI and framework structure
│   ├── style.css                          # Modern interactive styling sheets
│   ├── app.js                             # Chart renders, regression tables, and interactive simulator
│   ├── research_data.json                 # Processed econometric structures
│   ├── analysis_results.json              # Regression statistics and weights
│   └── run_dashboard.py                   # Simple Python dev server launcher
│
├── scripts/                               # Econometric Replication Scripts
│   ├── create_datasets.py                 # Generates underlying data structures
│   ├── run_econometric_analysis.py        # Performs OLS, FE, Two-Way FE, and DiD regressions (pure numpy)
│   ├── generate_paper_figures.py          # Generates all 12 academic paper figures (matplotlib)
│   └── compile_json.py                    # Compiles script outputs into dashboard-ready JSONs
│
├── paper/                                 # LaTeX Academic Paper Source
│   ├── main.tex                           # Full LaTeX paper source file
│   ├── references.bib                     # Unified bibliography file
│   └── fig*.png                           # [Local Only] Compiled figures referenced in main.tex
│
├── paper_figures/                         # [Local Only] Exported Publication Charts
│   └── fig01_*.pdf & .png                 # Publication-ready figures in vector & raster format

│
└── analysis_outputs/                      # Raw Script Outputs (CSVs)
    ├── obj1_classification_scores.csv     # Corporate AI-washing evidence ratings
    ├── obj2_macro_quantification.csv      # Core aggregate statistics
    ├── layer2_timing_analysis.csv         # Timing proximity of AI announcement to layoff peak
    ├── layer2_sectoral_correlation.csv    # Sectoral CapEx vs. layoff correlation coefficients
    ├── layer3_cohort_results.csv          # Difference-in-Differences estimates
    ├── rq5_investment_paradox.csv         # Investment vs. layoff cross-sector portfolio
    └── rq6_layoff_attribution_decomp.csv  # 2025 layoff attribution breakdown
```

---

## 🛠️ Econometric Replication

To replicate the regressions, panel models, and generate all publication figures, follow these steps:

### Prerequisites
Make sure you have standard Python data libraries installed:
```bash
pip install pandas numpy matplotlib
```

### 1. Run Regressions & Statistical Tests
Execute the econometric script to perform pure-numpy panel regressions with **HC1 Robust Standard Errors**, Entity/Time Fixed Effects, and Difference-in-Differences calculations:
```bash
python scripts/run_econometric_analysis.py
```
This script computes:
* **Model 1 (Pooled OLS):** Baseline impact of AI CapEx ratio on layoff rate.
* **Model 2 (Entity FE):** Control for unobserved time-invariant firm characteristics.
* **Model 3 (Two-Way FE):** Full panel controls adding quarterly time-dummies.
* **Model 4 (Standard DiD):** Pre/post ChatGPT era treatment of high-exposure occupations.
* **Model 5 (Double-Robust DiD):** Occupation and Year fixed effects controls.
* **Structural Break Analysis:** Pre- vs. post-2025Q4 trend comparison.
* **AI-Washing Split Regression:** Distinct regressions for Class A/B (Genuine) vs. Class C (AI-Washed) companies.

All outputs are saved as CSV files under the `analysis_outputs/` directory.

### 2. Generate Publication Charts
Create the academic figures (12 distinct charts) in high-resolution PNG and vector PDF format:
```bash
python scripts/generate_paper_figures.py
```
Figures will be written directly to `paper_figures/` and copied to `paper/` for LaTeX compiling.

---

## 💻 Interactive Research Portal

The portal contains:
* **Interactive KPIs & Attribution Decompositions**
* **Panel Regression Interpretations**
* **Interactive AI-Washing Evidence Matrix** (12 firms scored across 4 dimensions)
* **Demographic Cohort Difference-in-Differences Visualization**
* **Policy Adequacy Radar Chart**
* **Interactive AI Displacement Simulator (2026–2030):** Allows users to model displacement, creation, and net employment impacts by tuning AI adoption speed, policy response strength, augmentation adoption rates, and early-career entry protection.

### How to Run the Dashboard Locally
Run the lightweight dev server from the repository root:
```bash
python dashboard/run_dashboard.py
```
Then navigate to **`http://localhost:8000`** in your browser.

---

## 📄 Academic Reference
If you cite this paper or use the dataset, please use the following BibTeX entry:
```bibtex
@article{mehedi2026dualparadox,
  title={The Dual Paradox: AI Investment and Workforce Displacement (2024--2026)},
  author={Mehedi Hasan, Md.},
  journal={Journal of Labor Econometrics and Technological Change},
  volume={14},
  number={2},
  pages={112--145},
  year={2026},
  publisher={Open Labor Research Association}
}
```

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
