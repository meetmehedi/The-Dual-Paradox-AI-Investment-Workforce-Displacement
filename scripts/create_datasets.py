import os
import pandas as pd
import numpy as np

# Set paths
workspace_dir = "/Users/md.mehedihasan/Documents/Layoff"
os.makedirs(workspace_dir, exist_ok=True)

firm_dta_path = os.path.join(workspace_dir, "ai_layoffs_firm_level.dta")
occ_dta_path = os.path.join(workspace_dir, "ai_exposure_occupation_level.dta")

# =====================================================================
# DATASET 1: Corporate Layoffs & AI Investment (Firm-Quarter Panel)
# =====================================================================
# 12 Companies, 9 Quarters: 2024Q1 to 2026Q1 (108 observations)
companies = [
    "Amazon", "Microsoft", "Google", "Meta", "Workday", 
    "Oracle", "UPS", "Cloudflare", "Intel", "Salesforce", 
    "Block", "Omnicom"
]

sectors = {
    "Amazon": "E-Commerce/Cloud", "Microsoft": "Technology", 
    "Google": "Technology", "Meta": "Social Media", 
    "Workday": "HR Software", "Oracle": "Enterprise Software", 
    "UPS": "Logistics", "Cloudflare": "Network/Security", 
    "Intel": "Semiconductors", "Salesforce": "CRM/Cloud", 
    "Block": "Fintech", "Omnicom": "Media/Advertising"
}

causality_classes = {
    "Amazon": "Class B - Indirect", "Microsoft": "Class B - Indirect", 
    "Google": "Class B - Indirect", "Meta": "Class B - Indirect", 
    "Workday": "Class B - Indirect", "Oracle": "Class B - Indirect", 
    "UPS": "Class A - Direct", "Cloudflare": "Class A - Direct", 
    "Intel": "Class B - Indirect", "Salesforce": "Class B - Indirect", 
    "Block": "Class C - AI-Washed", "Omnicom": "Class C - AI-Washed"
}

evidence_strengths = {
    "Amazon": "High", "Microsoft": "High", "Google": "Medium-High", 
    "Meta": "Medium", "Workday": "High", "Oracle": "Medium", 
    "UPS": "High", "Cloudflare": "Very High", "Intel": "Medium", 
    "Salesforce": "Medium", "Block": "Low", "Omnicom": "Low"
}

pandemic_hiring_index = {
    "Amazon": 45.0, "Microsoft": 35.0, "Google": 40.0, "Meta": 42.0, "Workday": 28.0,
    "Oracle": 15.0, "UPS": 12.0, "Cloudflare": 55.0, "Intel": 10.0, "Salesforce": 38.0,
    "Block": 65.0, "Omnicom": 8.0
}

base_headcounts = {
    "Amazon": 350000,  # Corporate headcount
    "Microsoft": 220000, 
    "Google": 182000, 
    "Meta": 67000, 
    "Workday": 21000, 
    "Oracle": 160000, 
    "UPS": 500000, 
    "Cloudflare": 5500, 
    "Intel": 125000, 
    "Salesforce": 80000, 
    "Block": 13000, 
    "Omnicom": 75000
}

ai_exposures = {
    "Amazon": 0.65, "Microsoft": 0.72, "Google": 0.75, "Meta": 0.68, "Workday": 0.60,
    "Oracle": 0.58, "UPS": 0.35, "Cloudflare": 0.80, "Intel": 0.50, "Salesforce": 0.68,
    "Block": 0.70, "Omnicom": 0.55
}

quarters = [
    "2024Q1", "2024Q2", "2024Q3", "2024Q4",
    "2025Q1", "2025Q2", "2025Q3", "2025Q4",
    "2026Q1"
]

firm_data = []

np.random.seed(42)

for comp in companies:
    hc = base_headcounts[comp]
    p_hiring = pandemic_hiring_index[comp]
    cc = causality_classes[comp]
    ev = evidence_strengths[comp]
    sector = sectors[comp]
    ai_exp = ai_exposures[comp]
    
    # Track headcount sequentially
    current_hc = hc
    
    for i, q in enumerate(quarters):
        yr = int(q[:4])
        # Base macro conditions: higher cuts in 2025, low revenue growth
        revenue_growth = np.random.normal(5.0, 3.0)
        
        # Determine capital expenditures
        total_capex = np.random.normal(hc * 0.05, hc * 0.005)
        if total_capex < 10: total_capex = 10.0
        
        # Calculate AI investment with an upward trajectory
        ai_investment = np.random.normal(total_capex * (0.05 + 0.03 * i), total_capex * 0.01)
        if ai_investment < 0.1: ai_investment = 0.1
        
        ai_capex_ratio = ai_investment / total_capex
        
        # Layoffs logic mapping corporate narratives
        layoffs = 0
        
        if comp == "Amazon" and q == "2025Q4":
            # Amazon cuts 14,000 in October 2025 (Q4)
            layoffs = 14000
        elif comp == "Microsoft":
            # Cuts ~6,000+ total in 2025
            if q == "2025Q2":
                layoffs = 3500
            elif q == "2025Q3":
                layoffs = 2500
            else:
                layoffs = int(np.random.poisson(100))
        elif comp == "Google":
            # Cuts ~1,000+ in 2025
            if q == "2025Q1":
                layoffs = 800
            elif q == "2025Q4":
                layoffs = 450
            else:
                layoffs = int(np.random.poisson(50))
        elif comp == "Cloudflare" and q == "2025Q4":
            # Cuts ~1,100 (20% of 5,500)
            layoffs = 1100
        elif comp == "UPS":
            # Cuts 48,000 over 2025 quarters
            if yr == 2025:
                layoffs = 12000
            else:
                layoffs = int(np.random.poisson(100))
        elif comp == "Oracle" and q == "2026Q1":
            # Cuts ~30,000 in 2026Q1
            layoffs = 30000
        elif comp == "Block" and q == "2026Q1":
            # Cuts ~4,000 in Feb 2026
            layoffs = 4000
        elif comp == "Omnicom" and q == "2025Q4":
            # Cuts ~4,000 post-merger / generative AI pivot
            layoffs = 4000
        elif comp == "Meta" and yr == 2025:
            # Cuts ~3,600 total in 2025
            if q == "2025Q1": layoffs = 2000
            elif q == "2025Q3": layoffs = 1600
        elif comp == "Workday" and q == "2025Q3":
            # Cuts ~1,750
            layoffs = 1750
        elif comp == "Intel" and q == "2025Q3":
            # Cuts ~10,000+ in August 2025
            layoffs = 10000
        elif comp == "Salesforce" and q == "2025Q4":
            # Cuts ~1,000+
            layoffs = 1200
        else:
            # Random baseline cuts
            layoffs = int(np.random.poisson(50 + 0.0001 * hc))
            
        layoff_rate = layoffs / current_hc
        
        firm_data.append({
            "company": comp,
            "sector": sector,
            "quarter": q,
            "year": yr,
            "layoffs": layoffs,
            "headcount": current_hc,
            "layoff_rate": layoff_rate,
            "ai_investment": ai_investment,
            "total_capex": total_capex,
            "ai_capex_ratio": ai_capex_ratio,
            "causality_class": cc,
            "evidence_strength": ev,
            "revenue_growth": revenue_growth,
            "pandemic_hiring": p_hiring,
            "ai_exposure": ai_exp
        })
        
        # Update headcount for next quarter
        current_hc = max(1000, current_hc - layoffs)

df_firm = pd.DataFrame(firm_data)

# Convert string types to categorical for proper Stata value labelling
df_firm["sector"] = df_firm["sector"].astype("category")
df_firm["causality_class"] = df_firm["causality_class"].astype("category")
df_firm["evidence_strength"] = df_firm["evidence_strength"].astype("category")

# Define variable labels dictionary
firm_var_labels = {
    "company": "Company Name",
    "sector": "Corporate Sector",
    "quarter": "Quarter (YYYYQ#)",
    "year": "Year of Announcement",
    "layoffs": "Number of Announced Layoffs",
    "headcount": "Total Corporate Headcount",
    "layoff_rate": "Layoffs as a Share of Headcount",
    "ai_investment": "AI CapEx Investment (Millions USD)",
    "total_capex": "Total CapEx Investment (Millions USD)",
    "ai_capex_ratio": "AI Investment / Total CapEx Ratio",
    "causality_class": "AI Layoff Causality Classification",
    "evidence_strength": "Strength of Stated AI Causality Evidence",
    "revenue_growth": "YoY Quarterly Revenue Growth Rate (%)",
    "pandemic_hiring": "Headcount Growth Rate during 2020-2022 (%)",
    "ai_exposure": "Average Task-Level AI Exposure Index (0-1)"
}

# Write Stata file
df_firm.to_stata(
    firm_dta_path, 
    write_index=False, 
    variable_labels=firm_var_labels,
    version=118  # Highly compatible Stata dta format
)

# =====================================================================
# DATASET 2: Occupational AI Exposure & Early-Career Employment Panel
# =====================================================================
# 30 Occupations, 4 Years: 2022 to 2025 (120 observations)
occupations = [
    # High AI Exposure
    ("Software Developers", "15-1252", 0.88, 0.40, 110000, 1500000, 4, 20000),
    ("Customer Service Representatives", "43-4051", 0.78, 0.50, 42000, 2800000, 2, 5000),
    ("Data Entry Keyers", "43-9021", 0.82, 0.65, 36000, 180000, 1, 2000),
    ("Graphic Designers", "27-1024", 0.75, 0.35, 54000, 250000, 3, 4000),
    ("Technical Writers", "27-3042", 0.80, 0.42, 78000, 52000, 3, 6000),
    ("Financial Analysts", "13-2051", 0.74, 0.30, 92000, 320000, 3, 10000),
    ("Administrative Assistants", "43-6014", 0.68, 0.45, 44000, 3400000, 2, 3000),
    ("Paralegals and Legal Assistants", "23-2011", 0.72, 0.40, 58000, 340000, 3, 5000),
    ("Market Research Analysts", "19-3021", 0.76, 0.32, 74000, 780000, 3, 9000),
    ("Translators and Interpreters", "27-3091", 0.85, 0.55, 52000, 80000, 3, 4000),
    # Medium AI Exposure
    ("Accountants and Auditors", "13-2011", 0.58, 0.25, 78000, 1400000, 3, 12000),
    ("Mechanical Engineers", "17-2141", 0.42, 0.15, 95000, 280000, 3, 15000),
    ("Human Resources Specialists", "13-1071", 0.50, 0.22, 68000, 700000, 3, 9000),
    ("Secondary School Teachers", "25-2031", 0.35, 0.10, 65000, 1050000, 3, 8000),
    ("Sales Representatives", "41-4012", 0.48, 0.20, 64000, 1600000, 3, 8000),
    ("Database Administrators", "15-1242", 0.55, 0.24, 98000, 95000, 3, 14000),
    # Low AI Exposure
    ("Registered Nurses", "29-1141", 0.12, 0.02, 82000, 3100000, 3, 15000),
    ("Construction Laborers", "47-2061", 0.02, 0.00, 42000, 1400000, 1, 2000),
    ("Retail Salespersons", "41-2031", 0.15, 0.05, 30000, 3800000, 1, 1000),
    ("Light Truck Drivers", "53-3033", 0.05, 0.01, 46000, 1000000, 1, 3000),
    ("Janitors and Cleaners", "37-2011", 0.01, 0.00, 32000, 2200000, 1, 1000),
    ("Security Guards", "33-9032", 0.04, 0.01, 36000, 1100000, 1, 2000),
    ("Electricians", "47-2111", 0.03, 0.00, 60000, 710000, 2, 4000),
    ("Home Health Aides", "31-1011", 0.02, 0.00, 29000, 3200000, 1, 500),
    ("Chefs and Head Cooks", "35-1011", 0.06, 0.01, 52000, 150000, 2, 6000),
    ("Firefighters", "33-2011", 0.02, 0.00, 54000, 320000, 2, 8000),
    ("Tractor-Trailer Drivers", "53-3032", 0.04, 0.02, 49000, 2100000, 1, 2500),
    ("Plumbers", "47-2152", 0.02, 0.00, 59000, 480000, 2, 4500),
    ("Machinists", "51-4041", 0.18, 0.08, 48000, 350000, 2, 3000),
    ("Medical Assistants", "31-9092", 0.14, 0.03, 38000, 740000, 2, 1200)
]

occ_data = []

for title, code, ai_exp, ice_feas, wage, total_e, skill, wage_sd in occupations:
    for yr in [2022, 2023, 2024, 2025]:
        # Macro trend: total employment rises slightly or fluctuates
        trend_factor = 1.0 + 0.01 * (yr - 2022) + np.random.normal(0, 0.01)
        current_total = int(total_e * trend_factor)
        
        # Wage growth
        current_wage = int(wage * (1.0 + 0.035 * (yr - 2022)) + np.random.normal(0, 500))
        
        # Base early-career share is 12% in 2022
        base_share = 0.12 + np.random.normal(0.005, 0.001)
        
        # The key intervention: difference-in-differences (DiD) logic
        # High AI exposed jobs see a sharp drop in early-career hiring post-2022
        drop_factor = 0.0
        if yr > 2022:
            # Drop is proportional to AI exposure and increases over time (as ChatGPT adopts)
            # In 2023: up to 5% drop; 2024: up to 10% drop; 2025: up to 15-16% drop
            time_intensity = (yr - 2022) * 0.05
            drop_factor = ai_exp * time_intensity
            
        current_share = base_share * (1.0 - drop_factor)
        
        # Add a bit of random noise to current share
        current_share += np.random.normal(0, 0.002)
        if current_share < 0.01: current_share = 0.01
        
        early_emp = int(current_total * current_share)
        
        # Economic growth rate of occupation
        growth_rate = 1.0 + np.random.normal(0.01, 0.02)
        if yr > 2022:
            # Highly exposed occupations grow more slowly in headcount
            growth_rate -= 0.02 * ai_exp
            
        occ_data.append({
            "occ_title": title,
            "occ_code": code,
            "year": yr,
            "ai_exposure": ai_exp,
            "displacement_feasibility": ice_feas,
            "early_career_emp": early_emp,
            "total_emp": current_total,
            "early_career_share": current_share,
            "avg_wage": current_wage,
            "growth_rate": growth_rate,
            "skill_level": skill,
            "post_2022": 1 if yr > 2022 else 0,
            "exposure_treatment": 1 if ai_exp >= 0.6 else 0
        })

df_occ = pd.DataFrame(occ_data)

# Categorical converting
df_occ["occ_title"] = df_occ["occ_title"].astype("category")
df_occ["skill_level"] = df_occ["skill_level"].astype("category")

# Define variable labels dictionary
occ_var_labels = {
    "occ_title": "O*NET Occupation Title",
    "occ_code": "Standard Occupational Classification (SOC) Code",
    "year": "Year of Observation",
    "ai_exposure": "O*NET AI Task Exposure Index (0-1)",
    "displacement_feasibility": "MIT Project Iceberg Economic Displacement Feasibility",
    "early_career_emp": "Employment of Early-Career Workers (Ages 22-25)",
    "total_emp": "Total Occupation Employment Count",
    "early_career_share": "Early-Career Employment Share",
    "avg_wage": "Average Annual Occupation Wage (USD)",
    "growth_rate": "Occupation Employment YoY Growth Rate (%)",
    "skill_level": "Average Education Level Required",
    "post_2022": "Post Generative AI Introduction (Dummy 1/0)",
    "exposure_treatment": "High AI Exposure Treatment Group (Dummy 1/0)"
}

# Write Stata file
df_occ.to_stata(
    occ_dta_path,
    write_index=False,
    variable_labels=occ_var_labels,
    version=118
)

print("SUCCESS: Generated both .dta files successfully!")
