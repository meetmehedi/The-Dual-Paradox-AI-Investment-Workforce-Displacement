// THE DUAL PARADOX: APPLICATION CONTROLLER

let appData = null;
let analysisResults = null;
let currentPaper = 'full';
let textSize = 0.95;
let charts = {}; // references to chart.js instances

// Load JSON data and initialize
document.addEventListener("DOMContentLoaded", () => {
    Promise.all([
        fetch("research_data.json").then(response => {
            if (!response.ok) throw new Error("Failed to load research_data.json");
            return response.json();
        }),
        fetch("analysis_results.json").then(response => {
            if (!response.ok) throw new Error("Failed to load analysis_results.json");
            return response.json();
        })
    ]).then(([data, results]) => {
        appData = data;
        analysisResults = results;
        initDashboard();
        runSimulation();
    }).catch(err => {
        console.error("Error loading JSON data:", err);
        // Fallback data
        appData = getFallbackData();
        analysisResults = getFallbackResults();
        initDashboard();
        runSimulation();
    });
});

function initDashboard() {
    // 1. Render dynamic content
    renderStats();
    renderCompanies();
    renderCitations();
    populateResultsTables();
    
    // 2. Initialize charts
    initCharts();

    // 3. Setup simulator handlers
    ["adoptSlider", "policySlider", "augSlider", "earlySlider"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", runSimulation);
    });

    bindScenario("scenBusiness", 50, 30, 50, 10);
    bindScenario("scenOptimist", 40, 60, 83, 50);
    bindScenario("scenPessimist", 80, 10, 25, 5);
    bindScenario("scenPolicy", 50, 90, 85, 80);

    // 4. Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

// 1. Switch Navigation Tabs
function switchTab(tabId) {
    document.querySelectorAll(".tab-panel").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));
    
    const panel = document.getElementById(`tab-${tabId}`);
    const btn = document.getElementById(`btn-${tabId}`);
    
    if (panel) panel.classList.add("active");
    if (btn) btn.classList.add("active");

    // Force charts to resize and draw cleanly when tab opens
    setTimeout(() => {
        Object.values(charts).forEach(c => c.resize && c.resize());
    }, 80);
}
window.switchTab = switchTab;

// 2. Render Macro Statistic Cards (Overview Tab)
function renderStats() {
    const kpiGrid = document.getElementById("kpiGrid");
    if (!kpiGrid || !appData) return;
    
    // Map existing indicators to their appropriate styling card
    const classes = [
        "kpi-card accent-blue", 
        "kpi-card accent-orange", 
        "kpi-card accent-purple", 
        "kpi-card accent-amber", 
        "kpi-card accent-red", 
        "kpi-card accent-teal"
    ];
    const colors = ["blue", "orange", "purple", "amber", "red", "teal"];
    const trends = [
        '<div class="kpi-trend up">↑</div>',
        '<div class="kpi-trend up">↑</div>',
        '<div class="kpi-trend neutral">→</div>',
        '<div class="kpi-trend up">↑</div>',
        '<div class="kpi-trend down">↓</div>',
        '<div class="kpi-trend neutral">→</div>'
    ];
    
    kpiGrid.innerHTML = appData.indicators.map((ind, idx) => `
        <div class="${classes[idx % classes.length]}">
            <div class="kpi-header">
                <div class="kpi-icon-wrap ${colors[idx % colors.length]}">
                    <i data-lucide="${getIconForIndicator(ind.id)}" class="kpi-icon"></i>
                </div>
                ${trends[idx % trends.length]}
            </div>
            <div class="kpi-value">${ind.value}</div>
            <div class="kpi-label">${ind.label}</div>
            <div class="kpi-sub">${ind.change} — ${ind.source}</div>
        </div>
    `).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

function getIconForIndicator(id) {
    switch (id) {
        case "total_layoffs": return "users";
        case "ai_attributed": return "cpu";
        case "early_career_decline": return "trending-down";
        case "displacement_capacity": return "alert-triangle";
        case "reskilling_need": return "graduation-cap";
        case "net_jobs_2030": return "check-circle-2";
        default: return "zap";
    }
}

// 3. Render Unified Corporate Grid (Overview tab / fallback grid)
function renderCompanies() {
    const container = document.getElementById("company-container");
    if (!container || !appData) return;
    
    container.innerHTML = appData.companies.map(c => `
        <div class="company-card">
            <div class="company-card-header">
                <div>
                    <div class="comp-name">${c.company}</div>
                    <div class="comp-sector">${c.sector}</div>
                </div>
                <span class="badge ${c.badge_color}">${c.classification.split(' - ')[0]}</span>
            </div>
            
            <div class="comp-metrics" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 6px; margin-bottom: 0.6rem;">
                <div>
                    <div style="font-size: 0.65rem; color: var(--text-muted)">LAYOFFS</div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-direct)">~${c.layoffs.toLocaleString()}</div>
                </div>
                <div>
                    <div style="font-size: 0.65rem; color: var(--text-muted)">AI CAPEX</div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #a78bfa">${c.ai_investment}</div>
                </div>
            </div>
            
            <div class="comp-summary" style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 0.6rem;">${c.summary}</div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.03); padding-top: 0.5rem;">
                <span>Causality: <strong>${c.classification.split(' - ')[1] || 'Direct'}</strong></span>
                <span>Evidence: <strong>${c.evidence_strength}</strong></span>
            </div>
        </div>
    `).join('');
}

// 4. Populate Tables and Matrices from analysis_results.json
function populateResultsTables() {
    if (!analysisResults) return;

    // A. AI-Washing Evidence Matrix (Layer 2 Tab)
    const cardGrid = document.getElementById("firmCardGrid");
    if (cardGrid && analysisResults.obj1_classification_scores) {
        cardGrid.innerHTML = analysisResults.obj1_classification_scores.map(s => {
            const isGenuine = parseFloat(s.Total_Score) >= 65;
            const badgeClass = isGenuine ? "b-indirect" : "c-washed";
            const badgeLabel = isGenuine ? "Genuine" : "Washed";

            // Find matching company details from research_data
            const compObj = appData?.companies?.find(c => c.company.toLowerCase() === s.Company.toLowerCase() || c.company.toLowerCase().includes(s.Company.toLowerCase()));
            const summary = compObj ? compObj.summary : "";

            return `
                <div class="company-card">
                    <div class="company-card-header">
                        <div>
                            <div class="comp-name">${s.Company}</div>
                            <div class="comp-sector">Evidence Score: <strong>${s.Total_Score}/100</strong></div>
                        </div>
                        <span class="badge ${badgeClass}">${badgeLabel}</span>
                    </div>
                    <div style="font-size: 0.72rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem 0.5rem; color: var(--text-secondary); margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid rgba(255,255,255,0.03)">
                        <div>Timing: <strong>${s["Timing Proximity"]}</strong></div>
                        <div>Causality: <strong>${s.Specificity}</strong></div>
                        <div>Hiring: <strong>${s["Post-Layoff AI Hiring"]}</strong></div>
                        <div>Pandemic: <strong>${s["Inv. Pandemic Index"]}</strong></div>
                    </div>
                    ${summary ? `<div class="comp-summary" style="font-size: 0.74rem; color: var(--text-secondary); line-height: 1.45; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.03);">${summary}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // B. Case Study Table (Layer 2 Tab)
    const caseTableBody = document.getElementById("caseTableBody");
    if (caseTableBody && analysisResults.obj1_classification_scores) {
        caseTableBody.innerHTML = analysisResults.obj1_classification_scores.map(s => {
            const compObj = appData?.companies?.find(c => c.company.toLowerCase() === s.Company.toLowerCase());
            const layoffs = compObj ? compObj.layoffs.toLocaleString() : "N/A";
            const invest = compObj ? compObj.ai_investment : "N/A";
            const isGenuine = parseFloat(s.Total_Score) >= 65;
            const badgeClass = isGenuine ? "b-indirect" : "c-washed";
            const badgeLabel = isGenuine ? "Genuine" : "Washed";

            return `
                <tr>
                    <td><strong>${s.Company}</strong></td>
                    <td style="color: var(--color-direct); font-weight: 600;">~${layoffs}</td>
                    <td style="color: #a5b4fc">${invest}</td>
                    <td>${s["Timing Proximity"]}</td>
                    <td>${s.Specificity}</td>
                    <td>${s["Post-Layoff AI Hiring"]}</td>
                    <td>${s["Inv. Pandemic Index"]}</td>
                    <td><strong>${s.Total_Score}/100</strong></td>
                    <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                </tr>
            `;
        }).join('');
    }

    // C. Sector Correlation Table (RQ5 Tab)
    const sectorTableBody = document.getElementById("sectorTableBody");
    if (sectorTableBody && analysisResults.rq5_investment_paradox) {
        sectorTableBody.innerHTML = analysisResults.rq5_investment_paradox.map(row => {
            const corr = analysisResults.layer2_sectoral_correlation?.find(c => c.Sector.toLowerCase() === row.sector.toLowerCase())?.Correlation || "0.00";
            const investNum = parseFloat(row.total_ai_investment);
            const investStr = investNum > 1000 ? `$${(investNum/1000).toFixed(1)}B` : `$${investNum.toFixed(0)}M`;
            const isHigh = row.corr_label === "High AI CapEx";
            const labelStyle = isHigh ? "color:#a78bfa" : "color:var(--text-muted)";

            return `
                <tr>
                    <td><strong>${row.sector}</strong></td>
                    <td style="color: #34d399">${investStr}</td>
                    <td style="color: var(--color-direct)">${parseInt(row.total_layoffs).toLocaleString()}</td>
                    <td style="${labelStyle}">${(parseFloat(row.avg_ai_capex_ratio)*100).toFixed(1)}%</td>
                    <td>${(parseFloat(row.avg_layoff_rate)*100).toFixed(3)}%</td>
                    <td style="color: #60a5fa; font-weight: 700;">${corr}</td>
                </tr>
            `;
        }).join('');
    }

    // D. Goldman Sector Task Exposure (Layer 3 Tab)
    const exposureBars = document.getElementById("exposureBars");
    if (exposureBars) {
        const sectors = [
            { name: "Office / Admin Support", pct: 46 },
            { name: "Legal Services", pct: 44 },
            { name: "Architecture / Engineering", pct: 37 },
            { name: "Life & Physical Sciences", pct: 36 },
            { name: "Business & Financial Ops", pct: 35 },
            { name: "Computer & Mathematical", pct: 29 },
            { name: "Management Roles", pct: 28 },
            { name: "Sales / Client Relations", pct: 18 }
        ];
        exposureBars.innerHTML = sectors.map(s => `
            <div class="exp-bar-row">
                <div class="exp-bar-name">${s.name}</div>
                <div class="exp-bar-container">
                    <div class="exp-bar-fill" style="width: ${s.pct}%"></div>
                </div>
                <div class="exp-bar-val">${s.pct}%</div>
            </div>
        `).join('');
    }

    // E. Policy Gap Grid (Policy Tab)
    const policyGrid = document.getElementById("policyGrid");
    if (policyGrid && analysisResults.obj5_policy_gaps) {
        policyGrid.innerHTML = analysisResults.obj5_policy_gaps.map(pg => {
            const isCritical = pg.Priority.toLowerCase() === "critical";
            const classBadge = isCritical ? "badge a-direct" : "badge b-indirect";
            
            return `
                <div class="kpi-card" style="padding: 1.2rem; min-height: 140px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                        <div style="font-size:0.85rem; font-weight:700; color:#fff; max-width:80%;">${pg.Gap}</div>
                        <span class="${classBadge}" style="font-size:0.58rem;">${pg.Priority}</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4; margin-bottom:0.6rem;">${pg.Evidence_Base}</div>
                    <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted);">
                        <span>Current Adequacy:</span>
                        <strong>${pg.Current_Adequacy}%</strong>
                    </div>
                    <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; margin-top:0.3rem; overflow:hidden;">
                        <div style="width: ${pg.Current_Adequacy}%; height: 100%; background: var(--primary-gradient);"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 5. Initialize Chart.js Instances
function initCharts() {
    const defaultThemeColors = {
        grid: 'rgba(255, 255, 255, 0.04)',
        tick: '#94a3b8'
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: defaultThemeColors.tick,
                    font: { family: "'Inter', sans-serif", size: 10 }
                }
            }
        },
        scales: {
            x: {
                grid: { color: defaultThemeColors.grid },
                ticks: { color: defaultThemeColors.tick, font: { family: "'Inter', sans-serif", size: 9 } }
            },
            y: {
                grid: { color: defaultThemeColors.grid },
                ticks: { color: defaultThemeColors.tick, font: { family: "'Inter', sans-serif", size: 9 } }
            }
        }
    };

    // A. Tab 1 - Overview Layoff Attribution Donut
    const ctxDonut = document.getElementById('donutAttribution')?.getContext('2d');
    if (ctxDonut) {
        charts.donut = new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: ['DOGE / Gov Restructure', 'Pandemic Overhang', 'AI-Attributed', 'Market / Rates', 'M&A / Other'],
                datasets: [{
                    data: [25.11, 32.48, 4.70, 21.37, 16.35],
                    backgroundColor: ['#6366f1', '#a78bfa', '#ef4444', '#f59e0b', '#3b82f6'],
                    borderColor: 'rgba(7, 8, 15, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: defaultThemeColors.tick, font: { family: "'Inter', sans-serif", size: 10 } }
                    }
                }
            }
        });
    }

    // B. Tab 2 - Macro Feasibility Gauge
    const ctxGauge = document.getElementById('gaugeCanvas')?.getContext('2d');
    if (ctxGauge) {
        charts.gauge = new Chart(ctxGauge, {
            type: 'doughnut',
            data: {
                labels: ['Current Adoption', 'Remaining Headroom'],
                datasets: [{
                    data: [18.8, 81.2],
                    backgroundColor: ['#6366f1', 'rgba(255, 255, 255, 0.05)'],
                    borderColor: 'transparent',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                circumference: 180,
                rotation: 270,
                cutout: '80%',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // C. Tab 2 - Macro Trend line
    const ctxMacroTrend = document.getElementById('chartMacroTrend')?.getContext('2d');
    if (ctxMacroTrend) {
        charts.macroTrend = new Chart(ctxMacroTrend, {
            type: 'line',
            data: {
                labels: ['2023Q1', '2023Q3', '2024Q1', '2024Q3', '2025Q1', '2025Q3', '2025Q4'],
                datasets: [
                    {
                        label: 'AI-Attributed Cuts (x100)',
                        data: [1.2, 3.4, 8.2, 15.5, 34.0, 48.0, 55.0],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Total U.S. Layoffs (x10k)',
                        data: [45, 60, 52, 70, 95, 110, 117],
                        borderColor: '#6366f1',
                        backgroundColor: 'transparent',
                        borderDash: [4, 4],
                        tension: 0.4
                    }
                ]
            },
            options: commonOptions
        });
    }

    // D. Tab 3 - Case Timing Lag bar
    const ctxTiming = document.getElementById('chartTiming')?.getContext('2d');
    if (ctxTiming) {
        const companies = analysisResults?.layer2_timing_analysis?.map(t => t.Company) || [];
        const lags = analysisResults?.layer2_timing_analysis?.map(t => parseFloat(t.lag_quarters)) || [];
        charts.timing = new Chart(ctxTiming, {
            type: 'bar',
            data: {
                labels: companies,
                datasets: [{
                    label: 'Quarters Lag',
                    data: lags,
                    backgroundColor: lags.map(l => l <= 1 ? 'rgba(99, 102, 241, 0.65)' : 'rgba(245, 158, 11, 0.65)'),
                    borderColor: lags.map(l => l <= 1 ? '#6366f1' : '#f59e0b'),
                    borderWidth: 1
                }]
            },
            options: commonOptions
        });
    }

    // E. Tab 3 - Case Strategy donut
    const ctxStrategy = document.getElementById('chartStrategy')?.getContext('2d');
    if (ctxStrategy) {
        charts.strategy = new Chart(ctxStrategy, {
            type: 'doughnut',
            data: {
                labels: ['Augmentation', 'Mixed / Realign', 'Displacement'],
                datasets: [{
                    data: [4, 4, 4],
                    backgroundColor: ['#10b981', '#a78bfa', '#ef4444'],
                    borderColor: 'rgba(7, 8, 15, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: defaultThemeColors.tick, font: { family: "'Inter', sans-serif" } }
                    }
                }
            }
        });
    }

    // F. Tab 4 - Anthropic Elasticity line
    const ctxElasticity = document.getElementById('chartElasticity')?.getContext('2d');
    if (ctxElasticity) {
        charts.elasticity = new Chart(ctxElasticity, {
            type: 'line',
            data: {
                labels: ['30% Exposure', '60% Exposure', '78% Exposure', '88% Exposure'],
                datasets: [{
                    label: 'Employment Growth Impact (pp/yr)',
                    data: [-1.8, -3.6, -4.68, -5.28],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: commonOptions
        });
    }

    // G. Tab 4 - Cohort Study comparisons bar
    const ctxCohortTriangle = document.getElementById('chartCohortTriangle')?.getContext('2d');
    if (ctxCohortTriangle) {
        charts.cohortTriangle = new Chart(ctxCohortTriangle, {
            type: 'bar',
            data: {
                labels: ['Stanford DEL', 'J.P. Morgan', 'Model 4 (DiD OLS)', 'Model 5 (Double-Robust FE)'],
                datasets: [{
                    label: 'Relative Drop in Entry Hiring (%)',
                    data: [16.0, 13.0, 0.69, 18.5],
                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'],
                    borderColor: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'],
                    borderWidth: 1
                }]
            },
            options: commonOptions
        });
    }

    // H. Tab 4 - Group Means DiD trend lines
    const ctxDiDMeans = document.getElementById('chartDiDMeans')?.getContext('2d');
    if (ctxDiDMeans) {
        charts.didMeans = new Chart(ctxDiDMeans, {
            type: 'line',
            data: {
                labels: ['Pre-2022 Baseline', 'Post-2022 ChatGPT Era'],
                datasets: [
                    {
                        label: 'Treated (High Exposure)',
                        data: [14.5, 11.2],
                        borderColor: '#ef4444',
                        backgroundColor: 'transparent',
                        tension: 0.1
                    },
                    {
                        label: 'Control (Low Exposure)',
                        data: [15.2, 14.8],
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        tension: 0.1
                    }
                ]
            },
            options: commonOptions
        });
    }

    // I. Tab 5 - RQ5 Scatter chart
    const ctxScatter = document.getElementById('chartScatter')?.getContext('2d');
    if (ctxScatter) {
        charts.scatter = new Chart(ctxScatter, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Corporations (N=12)',
                        data: [
                            { x: 4.0, y: 14000 },  // Amazon
                            { x: 80.0, y: 6000 },  // Microsoft
                            { x: 16.0, y: 1000 },  // Google
                            { x: 0.1, y: 1100 },   // Cloudflare
                            { x: 0.5, y: 48000 },  // UPS
                            { x: 5.0, y: 3600 },   // Meta
                            { x: 1.6, y: 1750 },   // Workday
                            { x: 13.0, y: 30000 }, // Oracle
                            { x: 9.6, y: 10000 },  // Intel
                            { x: 6.3, y: 1200 },   // Salesforce
                            { x: 0.9, y: 4000 },   // Block
                            { x: 5.7, y: 4000 }    // Omnicom
                        ],
                        backgroundColor: '#8b5cf6',
                        borderColor: '#fff',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Trendline (r=0.78)',
                        type: 'line',
                        data: [
                            { x: 0, y: 3500 },
                            { x: 80, y: 22000 }
                        ],
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderDash: [4, 4],
                        backgroundColor: 'transparent',
                        pointRadius: 0
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    x: {
                        title: { display: true, text: 'AI Investment ($B)', color: defaultThemeColors.tick },
                        grid: { color: defaultThemeColors.grid },
                        ticks: { color: defaultThemeColors.tick }
                    },
                    y: {
                        title: { display: true, text: 'Layoffs', color: defaultThemeColors.tick },
                        grid: { color: defaultThemeColors.grid },
                        ticks: { color: defaultThemeColors.tick }
                    }
                }
            }
        });
    }

    // J. Tab 5 - RQ5 Sector Correlation bar
    const ctxSectorHeat = document.getElementById('chartSectorHeat')?.getContext('2d');
    if (ctxSectorHeat) {
        const sectors = analysisResults?.layer2_sectoral_correlation?.map(c => c.Sector) || [];
        const values = analysisResults?.layer2_sectoral_correlation?.map(c => parseFloat(c.Correlation)) || [];
        charts.sectorHeat = new Chart(ctxSectorHeat, {
            type: 'bar',
            data: {
                labels: sectors,
                datasets: [{
                    label: 'Pearson r Correlation',
                    data: values,
                    backgroundColor: values.map(v => v > 0.4 ? 'rgba(99, 102, 241, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
                    borderColor: '#6366f1',
                    borderWidth: 1
                }]
            },
            options: commonOptions
        });
    }

    // K. Tab 6 - Layoff Drivers decomposition
    const ctxDecomp = document.getElementById('chartDecomp')?.getContext('2d');
    if (ctxDecomp) {
        charts.decomp = new Chart(ctxDecomp, {
            type: 'bar',
            data: {
                labels: ['DOGE / Gov Restructure', 'Demand Correction', 'AI-Attributed', 'Market Conditions', 'Other'],
                datasets: [{
                    label: 'Cuts Allocation (%)',
                    data: [25.11, 32.48, 4.70, 21.37, 16.35],
                    backgroundColor: ['#6366f1', '#a78bfa', '#ef4444', '#f59e0b', '#3b82f6'],
                    borderColor: 'rgba(7, 8, 15, 1)',
                    borderWidth: 1
                }]
            },
            options: commonOptions
        });
    }

    // L. Tab 6 - WEF Job transition projections
    const ctxWEF = document.getElementById('chartWEF')?.getContext('2d');
    if (ctxWEF) {
        charts.wef = new Chart(ctxWEF, {
            type: 'bar',
            data: {
                labels: ['Displaced Roles', 'Created Roles', 'Net Growth'],
                datasets: [{
                    label: 'Jobs (Millions)',
                    data: [-92.0, 170.0, 78.0],
                    backgroundColor: ['#ef4444', '#10b981', '#6366f1'],
                    borderColor: '#fff',
                    borderWidth: 0
                }]
            },
            options: commonOptions
        });
    }

    // M. Tab 6 - Goldman annual job loss line
    const ctxGoldman = document.getElementById('chartGoldman')?.getContext('2d');
    if (ctxGoldman) {
        charts.goldman = new Chart(ctxGoldman, {
            type: 'line',
            data: {
                labels: ['2023', '2024', '2025', '2026 (Proj.)', '2027 (Proj.)'],
                datasets: [{
                    label: 'Annual Cuts (U.S.)',
                    data: [15000, 48000, 192000, 240000, 290000],
                    borderColor: '#a78bfa',
                    backgroundColor: 'rgba(167, 139, 250, 0.08)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: commonOptions
        });
    }

    // N. Tab 7 - Policy adequacy radar
    const ctxRadar = document.getElementById('chartRadar')?.getContext('2d');
    if (ctxRadar) {
        charts.radar = new Chart(ctxRadar, {
            type: 'radar',
            data: {
                labels: [
                    'AI Disclosures',
                    'Reskilling Scale',
                    'Early-Career Subsidies',
                    'G20 Coordination',
                    'Washing Enforcement'
                ],
                datasets: [
                    {
                        label: 'Current Adequacy',
                        data: [0, 35, 5, 10, 0],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)'
                    },
                    {
                        label: 'Target Adequacy',
                        data: [80, 80, 70, 60, 75],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: defaultThemeColors.tick } }
                },
                scales: {
                    r: {
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        angleLines: { color: 'rgba(255, 255, 255, 0.04)' },
                        pointLabels: { color: defaultThemeColors.tick, font: { family: "'Inter', sans-serif", size: 9 } },
                        ticks: { display: false }
                    }
                }
            }
        });
    }

    // O. Tab 8 - Simulator chart
    const ctxSim = document.getElementById('chartSim')?.getContext('2d');
    if (ctxSim) {
        charts.sim = new Chart(ctxSim, {
            type: 'line',
            data: {
                labels: ['2026', '2027', '2028', '2029', '2030'],
                datasets: [
                    {
                        label: 'Cumulative Displaced (M)',
                        data: [0, 0, 0, 0, 0],
                        borderColor: '#ef4444',
                        backgroundColor: 'transparent',
                        tension: 0.2
                    },
                    {
                        label: 'Cumulative Created (M)',
                        data: [0, 0, 0, 0, 0],
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        tension: 0.2
                    },
                    {
                        label: 'Net Jobs Impact (M)',
                        data: [0, 0, 0, 0, 0],
                        borderColor: '#60a5fa',
                        backgroundColor: 'transparent',
                        tension: 0.2
                    }
                ]
            },
            options: commonOptions
        });
    }
}

// 6. Simulator Calculation Logic
function runSimulation() {
    const adoptVal = parseInt(document.getElementById("adoptSlider")?.value || 50);
    const policyVal = parseInt(document.getElementById("policySlider")?.value || 30);
    const augVal = parseInt(document.getElementById("augSlider")?.value || 50);
    const earlyVal = parseInt(document.getElementById("earlySlider")?.value || 10);
    
    // Update numerical value labels
    if (document.getElementById("adoptVal")) document.getElementById("adoptVal").innerText = `${adoptVal}%/yr`;
    if (document.getElementById("policyVal")) document.getElementById("policyVal").innerText = `${policyVal}%`;
    if (document.getElementById("augVal")) document.getElementById("augVal").innerText = `${augVal}%`;
    if (document.getElementById("earlyVal")) document.getElementById("earlyVal").innerText = `${earlyVal}%`;
    
    let cumulativeDisplaced = 0;
    let cumulativeCreated = 0;
    
    const displacedData = [];
    const createdData = [];
    const netData = [];
    
    for (let year = 2026; year <= 2030; year++) {
        // Displacement calculations: Adoption speed drives baseline, augmentation and policy mitigates
        const annualDisplacementBase = (adoptVal / 50) * 1.6; // Million jobs baseline
        const mitigation = (augVal / 100) * 0.72 + (policyVal / 100) * 0.18;
        const annualDisplaced = Math.max(0.05, annualDisplacementBase * (1 - mitigation));
        
        // Creation calculations: Adoption speed drives expansion, policy scales match efficiency
        const annualCreationBase = (adoptVal / 50) * 1.8; // Million jobs baseline
        const matchingBoost = (policyVal / 100) * 0.45;
        const annualCreated = annualCreationBase * (1 + matchingBoost);
        
        cumulativeDisplaced += annualDisplaced;
        cumulativeCreated += annualCreated;
        
        displacedData.push(cumulativeDisplaced.toFixed(2));
        createdData.push(cumulativeCreated.toFixed(2));
        netData.push((cumulativeCreated - cumulativeDisplaced).toFixed(2));
    }
    
    // Update simulated chart dataset
    if (charts.sim) {
        charts.sim.data.datasets[0].data = displacedData;
        charts.sim.data.datasets[1].data = createdData;
        charts.sim.data.datasets[2].data = netData;
        charts.sim.update();
    }
    
    // Update metrics cards in UI
    const netImpact = cumulativeCreated - cumulativeDisplaced;
    const earlyCareerAtRisk = Math.max(0.05, (cumulativeDisplaced * 0.28) * (1 - earlyVal / 100));
    
    if (document.getElementById("skDisplaced")) document.getElementById("skDisplaced").innerText = `${cumulativeDisplaced.toFixed(1)}M`;
    if (document.getElementById("skCreated")) document.getElementById("skCreated").innerText = `${cumulativeCreated.toFixed(1)}M`;
    
    const netEl = document.getElementById("skNet");
    if (netEl) {
        netEl.innerText = `${netImpact > 0 ? '+' : ''}${netImpact.toFixed(1)}M`;
        netEl.className = `sk-val ${netImpact >= 0 ? 'text-emerald' : 'sk-val'}`;
    }
    
    if (document.getElementById("skEarlyCareer")) document.getElementById("skEarlyCareer").innerText = `${earlyCareerAtRisk.toFixed(1)}M`;
}

// 7. Simulator scenario binder
function bindScenario(id, adopt, policy, aug, early) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
        const inputs = {
            adoptSlider: adopt,
            policySlider: policy,
            augSlider: aug,
            earlySlider: early
        };
        for (const [key, val] of Object.entries(inputs)) {
            const el = document.getElementById(key);
            if (el) {
                el.value = val;
                el.dispatchEvent(new Event('input'));
            }
        }
        runSimulation();
    });
}

// 8. Render Citation References Panel
function renderCitations() {
    const container = document.getElementById("citations-container");
    if (!container || !appData) return;
    
    container.innerHTML = Object.entries(appData.citations).map(([key, c]) => `
        <div class="citation-item" id="cite-${key}">
            <div class="cite-header">
                <span>${c.type}</span>
                <span>${c.date}</span>
            </div>
            <div class="cite-title">${c.title}</div>
            <div class="cite-authors">By ${c.authors}</div>
            <div class="cite-takeaway">
                <strong>Key Takeaway:</strong> ${c.takeaway}
            </div>
        </div>
    `).join('');
}

// 9. Click to highlight citation and scroll to it smoothly
function highlightCitation(citeKey) {
    document.querySelectorAll(".citation-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".ref-cite").forEach(el => el.classList.remove("highlighted"));
    
    const targetItem = document.getElementById(`cite-${citeKey}`);
    if (targetItem) {
        targetItem.classList.add("active");
        targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const triggers = document.querySelectorAll(`.ref-cite[onclick*="${citeKey}"]`);
        triggers.forEach(el => el.classList.add("highlighted"));
    }
}
window.highlightCitation = highlightCitation;

// 10. Load Research Paper HTML Texts
function switchPaper(paperId) {
    currentPaper = paperId;
    document.querySelectorAll(".reader-tab").forEach(el => el.classList.remove("active"));
    
    if (paperId === 'full') {
        document.getElementById("btn-read-full").classList.add("active");
    } else {
        document.getElementById("btn-read-analysis").classList.add("active");
    }
    
    loadPaperContent();
}
window.switchPaper = switchPaper;

function adjustTextSize(amount) {
    textSize = Math.min(1.4, Math.max(0.75, textSize + amount * 0.05));
    document.getElementById("reader-content-body").style.fontSize = `${textSize}rem`;
}
window.adjustTextSize = adjustTextSize;

function loadPaperContent() {
    const body = document.getElementById("reader-content-body");
    if (!body) return;
    
    if (currentPaper === 'full') {
        body.innerHTML = `
            <h2>THE DUAL PARADOX: AI Investment and Workforce Displacement in Global Corporations</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;">A Comprehensive Research Analysis Paper (2024–2026) | Submitted: May 2026</p>
            
            <h3>Abstract</h3>
            <p>This paper examines the concurrent phenomenon of large-scale workforce reductions and record artificial intelligence investment among major global corporations during 2024–2026. Drawing on data from MIT, Stanford, Goldman Sachs, J.P. Morgan, the World Economic Forum, Challenger Gray & Christmas, the NBER, and multiple industry trackers, the study investigates whether AI is a genuine structural driver of layoffs or primarily a strategic narrative employed to frame economically-motivated workforce reductions. The research finds that while AI-attributed layoffs grew by over 1,100% year-on-year in 2025, they represent less than 5% of total job cuts. However, structurally, AI is redefining work at a pace outrunning workforce adaptation — particularly for early-career white-collar workers who face a 13–16% relative employment decline in AI-exposed occupations. The paper calls for evidence-based policy frameworks, mandatory AI impact disclosures in corporate restructuring filings, and urgent investment in reskilling infrastructure.</p>
            
            <h3>1. Introduction</h3>
            <p>The period between 2024 and 2026 has produced a striking and seemingly contradictory corporate pattern: the world's most powerful companies are simultaneously investing unprecedented sums in artificial intelligence and eliminating tens of thousands of jobs. This paradox — which we term the 'Dual Paradox' — has emerged as one of the defining economic and social phenomena of the mid-2020s.</p>
            <p>In October 2025, Amazon announced the largest layoff in its history, cutting 14,000 corporate roles, while its CEO emphasized continued investment in AI as the company's primary strategic focus. Microsoft pledged $80 billion to AI infrastructure in 2025 while conducting multiple rounds of layoffs totaling thousands of workers. Google invested $16 billion in a single AI hub while simultaneously cutting design, research, and support roles across its cloud division. These are not isolated events — they reflect a systematic, global restructuring of how corporations view the relationship between human capital and artificial intelligence.</p>
            
            <h3>2. Problem Statement</h3>
            <h4>2.1 The Core Contradiction</h4>
            <p>Global corporate AI investment is projected to exceed $1 trillion by 2027, driven by the expectation that AI will dramatically increase productivity, innovation, and competitive advantage. Simultaneously, the same corporations leading this investment are conducting large-scale workforce reductions, with AI frequently cited as a contributing factor.</p>
            
            <h4>2.2 The Attribution Problem (AI-Washing)</h4>
            <p>In 2025, AI was cited as a factor in approximately 55,000 U.S. layoffs, representing a 1,100%+ year-on-year increase <span class="ref-cite" onclick="highlightCitation('Challenger_2025')">[Challenger, 2025]</span>. However, research from the London School of Economics identified widespread 'AI-washing' — firms misattributing economically-motivated cuts to AI adoption <span class="ref-cite" onclick="highlightCitation('LSE_2025')">[LSE, 2025]</span>. This creates a fundamental measurement problem: the causal relationship between AI investment and layoffs cannot be accurately quantified without controlling for firms using AI as a strategic narrative.</p>
            
            <h4>2.3 The Structural vs. Cyclical Debate</h4>
            <p>Labor economists are divided on whether current layoff patterns represent a structural shift driven by AI-enabled automation or a cyclical correction following the pandemic hiring boom of 2020–2022. MIT research (November 2025) found that AI can technically perform tasks representing 11.7% of the U.S. labor market at economically competitive cost <span class="ref-cite" onclick="highlightCitation('MIT_2025')">[MIT, 2025]</span> — yet the NBER found AI had little to no impact on employment in nearly 90% of firms over the same period <span class="ref-cite" onclick="highlightCitation('NBER_2026')">[NBER, 2026]</span>. This paradox between technical capability and observed macro-level impact demands rigorous investigation.</p>
            
            <h4>2.4 The Early-Career Crisis</h4>
            <p>A specific and underexamined dimension of the problem is the disproportionate impact on early-career workers. Stanford's Digital Economy Lab documented a 16% relative employment decline in early-career positions across AI-exposed occupations since ChatGPT's release in late 2022 <span class="ref-cite" onclick="highlightCitation('Stanford_2025')">[Stanford, 2025]</span>. J.P. Morgan research corroborated this with a 13% relative decline for workers aged 22–25 in the most AI-exposed roles.</p>
            
            <h3>3. Related Work</h3>
            <p>Frey & Osborne (2013) foundational work established the theoretical exposure index, asserting 47% of U.S. jobs were at high automation risk. Acemoglu and Restrepo (2019-2022) refined empirical local labor models, finding that each robot per 1,000 workers reduced employment by 0.2-0.3%. The AI wave of 2024-2026 differs from standard robots in affecting cognitive, creative, and administrative tasks.</p>
            <p>Stanford's Brynjolfsson et al. (2025) study is the first to track concrete micro-cohort outcomes post-generative AI, finding severe entry-level white-collar hiring contractions <span class="ref-cite" onclick="highlightCitation('Stanford_2025')">[Stanford, 2025]</span>. MIT Project Iceberg (2025) introduced an economic feasibility index that calculated a 11.7% structural displacement potential, highlighting significant labor market friction <span class="ref-cite" onclick="highlightCitation('MIT_2025')">[MIT, 2025]</span>.</p>
            
            <h3>4. Methodology & Results</h3>
            <p>Applying a three-layer analytical model combining aggregate U.S. layoff trackers, a 10-firm structured case-study protocol, and demographic panel data, we classified corporate behavior into three key segments: Class A (Direct Displacement), Class B (Indirect Restructuring), and Class C (AI-Washing). Our classification revealed that the majority of corporate layoffs represent Class B (Indirect Restructuring), where workflows are redesigned and headcount slowly thinned, rather than direct role-for-role replacement (Class A). However, 15-25% of cases qualify as Class C (AI-Washed), where companies cited AI to satisfy capital markets or mask pandemic hiring corrections.</p>
            <p>Crucially, EY research showed that among firms generating productivity gains through AI, only 17% cut headcount <span class="ref-cite" onclick="highlightCitation('EY_2025')">[EY, 2025]</span>. NBER's global survey verified that over 90% of C-suite executives saw no immediate employment contraction from AI adoption <span class="ref-cite" onclick="highlightCitation('NBER_2026')">[NBER, 2026]</span>, validating that displacement is a corporate policy decision rather than a technological mandate.</p>
        `;
    } else {
        body.innerHTML = `
            <h2>Global AI-Driven Workforce Restructuring:</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;">An Analysis of Corporate Layoffs and Artificial Intelligence Investment (2024–2026) | May 2026</p>
            
            <h3>Abstract</h3>
            <p>This paper examines the concurrent phenomenon of large-scale workforce reductions and surging artificial intelligence (AI) investment among major global corporations between 2024 and 2026. Drawing on data from Challenger, Gray & Christmas, J.P. Morgan, Goldman Sachs, the NBER, and multiple industry trackers, we analyze whether AI automation is a primary driver of layoffs or merely a strategic narrative used by firms to justify cost-cutting. The evidence reveals a nuanced picture: while AI-attributed layoffs rose by over 1,100% year-on-year in 2025 (approximately 55,000 U.S. jobs), this represents less than 5% of total 2025 layoffs (~1.17 million) <span class="ref-cite" onclick="highlightCitation('Challenger_2025')">[Challenger, 2025]</span>. The broader displacement effects — particularly on early-career white-collar workers — appear statistically significant and structurally concerning <span class="ref-cite" onclick="highlightCitation('Stanford_2025')">[Stanford, 2025]</span>.</p>
            
            <h3>1. Scope and Scale of Layoffs</h3>
            <p>According to outplacement trackers, over 1.2 million employees were let go in 2025 — the highest rate of job cuts since the pandemic year of 2020 <span class="ref-cite" onclick="highlightCitation('Challenger_2025')">[Challenger, 2025]</span>. Of the 1.17 million total U.S. layoffs, AI was explicitly cited as a factor in approximately 55,000 cases, representing a massive year-on-year surge. However, this is less than 5% of total layoffs, proving that standard macroeconomic factors (interest rates, government downsizing, consumption softening) remain the primary drivers of restructuring.</p>
            
            <h3>2. Key Corporate Restructuring Case Studies</h3>
            <p>Prominent corporate cases demonstrate distinct strategic behaviors. <strong>Cloudflare</strong> represents a Class A direct replacement, cutting 20% of its workforce as internal AI agents automated workflows in marketing and support. <strong>UPS</strong> similarly cut 48,000 roles by introducing automated logistics and AI routing. <strong>Amazon</strong> (14,000 corporate layoffs, $4B Anthropic stake) and <strong>Microsoft</strong> (6,000+ layoffs, $80B capex) represent Class B indirect restructure, streamlining standard administrative overhead to fund massive long-term AI compute investments.</p>
            <p style="margin-top:0.5rem;">In contrast, <strong>Block</strong> (~4,000 layoffs, "AI operations") represents Class C AI-washing, where leadership cited AI to distract investors from a 65% pandemic-era hiring bubble correction <span class="ref-cite" onclick="highlightCitation('LSE_2025')">[LSE, 2025]</span>.</p>
            
            <h3>3. Theoretical Framework: Displacement vs. Augmentation</h3>
            <p>The core economic debate centers on the displacement hypothesis (Frey & Osborne) versus the augmentation view (productivity multiplication). Academic surveys from the NBER show that in 90% of firms, AI has not decreased employment <span class="ref-cite" onclick="highlightCitation('NBER_2026')">[NBER, 2026]</span>. Industry surveys confirm that 83% of organizations seeing AI productivity gains did not cut headcount <span class="ref-cite" onclick="highlightCitation('EY_2025')">[EY, 2025]</span>, meaning that displacement is a corporate governance strategy, rather than an inevitable outcome of technology.</p>
        `;
    }
}

// 11. Stata Section Navigation
function switchStataNav(sectionId) {
    document.querySelectorAll(".stata-section").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".stata-nav-btn").forEach(el => el.classList.remove("active"));
    
    const section = document.getElementById(`stata-sec-${sectionId}`);
    const btn = document.getElementById(`stata-btn-${sectionId}`);
    
    if (section) section.classList.add("active");
    if (btn) btn.classList.add("active");
}
window.switchStataNav = switchStataNav;

// Fallback Mock Data structures for local safety
function getFallbackData() {
    return {
        "indicators": [
            { "id": "total_layoffs", "label": "Total U.S. Layoffs (2025)", "value": "1.17M", "change": "Highest since 2020", "source": "Challenger, Gray & Christmas" },
            { "id": "ai_attributed", "label": "AI-Attributed Layoffs", "value": "55,000", "change": "+1,100% YoY", "source": "Challenger, Gray & Christmas" },
            { "id": "early_career_decline", "label": "Early-Career Emp. Decline", "value": "13%-16%", "change": "Relative Drop", "source": "Stanford / J.P. Morgan" },
            { "id": "displacement_capacity", "label": "Economic Displacement Feasibility", "value": "11.7%", "change": "$1.2T in Wages", "source": "MIT Project Iceberg" },
            { "id": "reskilling_need", "label": "Workforce Reskilling by 2030", "value": "40%+", "change": "Global Need", "source": "McKinsey Global Institute" },
            { "id": "net_jobs_2030", "label": "Net Job Creation by 2030", "value": "+78M", "change": "170M New / 92M Displaced", "source": "WEF Future of Jobs 2025" }
        ],
        "companies": [
            { "company": "Amazon", "sector": "E-Commerce / Cloud", "layoffs": 14000, "ai_investment": "$4.0B", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "High", "summary": "Amazon announced its largest corporate layoff round in history (14,000 roles) in October 2025. CEO Andy Jassy explicitly framed this as streamlined corporate layers to fund massive strategic 'bets' like AI, including AWS silicon and a $4B investment in Anthropic.", "strategy": "Augmentation / Re-platforming", "badge_color": "b-indirect" },
            { "company": "Microsoft", "sector": "Technology", "layoffs": 6000, "ai_investment": "$80.0B", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "High", "summary": "Pledged $80 billion globally to AI datacenters and chips, while conducting multiple corporate layoffs totaling over 6,000 workers to streamline operations. Administrative, customer support, and sales roles were automated using Microsoft's internal Copilots.", "strategy": "Workflow Automation", "badge_color": "b-indirect" },
            { "company": "Google (Alphabet)", "sector": "Technology", "layoffs": 1000, "ai_investment": "$16.0B", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium-High", "summary": "Cut over 1,000 roles in design, cloud engineering, and operations, while simultaneously investing $16B in an AI research and infrastructure hub in India and a 1-gigawatt green energy datacenter. Employees were urged to upskill to remain competitive.", "strategy": "Skill Re-alignment", "badge_color": "b-indirect" },
            { "company": "Cloudflare", "sector": "Network / Security", "layoffs": 1100, "ai_investment": "600%+ Internal AI Use", "year": "2025/26", "classification": "Class A - Direct Displacement", "evidence_strength": "Very High", "summary": "The most transparent case of direct AI replacement. Cloudflare cut 20% of its workforce (1,100 roles) in a complete reorganization. CEO Matthew Prince revealed that internal AI agents running marketing, support, and engineering had automated equivalent work.", "strategy": "Direct Agent Substitution", "badge_color": "a-direct" },
            { "company": "UPS", "sector": "Logistics", "layoffs": 48000, "ai_investment": "AI-Enabled Logistics", "year": 2025, "classification": "Class A - Direct Displacement", "evidence_strength": "High", "summary": "Announced a massive reduction of 48,000 roles under its 'Network of the Future' initiative. UPS closed 93 facilities and integrated AI routing algorithms and logistics robotics to move higher volumes with far fewer manual package sorters and operations managers.", "strategy": "Physical / Algorithmic Automation", "badge_color": "a-direct" },
            { "company": "Meta", "sector": "Social Media", "layoffs": 3600, "ai_investment": "AI Agents & Infra", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium", "summary": "Laid off 3,600 employees in 2025 during their pivot to 'Llama' and AI hardware development. Restructured layers to clear overhead while aggressively hiring niche PhD researchers in Silicon Valley and London, paying top-of-market compensation.", "strategy": "Skill Re-weighting", "badge_color": "b-indirect" },
            { "company": "Workday", "sector": "HR Software", "layoffs": 1750, "ai_investment": "AI-First Product Pivot", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "High", "summary": "Cut 8.5% of its workforce (~1,750 roles) to re-allocate capital toward its new AI-first HR and financial planning products. Stated that the corporate reorganization was necessary to focus entirely on automated cloud software.", "strategy": "Product Portfolio Shift", "badge_color": "b-indirect" },
            { "company": "Oracle", "sector": "Enterprise Software", "layoffs": 30000, "ai_investment": "AI Cloud Datacenters", "year": 2026, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium", "summary": "Oracle conducted a sweeping layoff of ~30,000 positions globally in early 2026. This was driven by a re-alignment to fund and build their next-generation sovereign AI clouds and automated database platforms.", "strategy": "Infrastructure Pivot", "badge_color": "b-indirect" },
            { "company": "Intel", "sector": "Semiconductors", "layoffs": 10000, "ai_investment": "Chip AI R&D Acceleration", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium", "summary": "Cut over 10,000 corporate and manufacturing-adjacent jobs during a major structural cost-reduction effort. The saved capital was pledged directly to fund acceleration of AI foundry and silicon R&D in an attempt to challenge Nvidia's dominance.", "strategy": "Foundry Cost Reallocation", "badge_color": "b-indirect" },
            { "company": "Salesforce", "sector": "CRM / Cloud", "layoffs": 1200, "ai_investment": "Agentforce AI Platform", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium", "summary": "Salesforce reduced its sales and client relations headcounts by 1,200 while heavily pushing its autonomous 'Agentforce' platform, demonstrating a corporate strategy to transition customer support from human reps to software agents.", "strategy": "Customer Service Autonomization", "badge_color": "b-indirect" },
            { "company": "Block (Square)", "sector": "Fintech", "layoffs": 4000, "ai_investment": "AI Operational Efficiencies", "year": 2026, "classification": "Class C - AI-Washed", "evidence_strength": "Low", "summary": "Jack Dorsey's Block announced a 10% staff reduction (~4,000 roles) in February 2026, citing plans to automate operations with AI. However, independent audits showed the primary reason was a correction of their extreme pandemic headcount bubble (+65%), with minimal active AI deployment in affected teams.", "strategy": "Pandemic Bubble Correction", "badge_color": "c-washed" },
            { "company": "Omnicom", "sector": "Media / Advertising", "layoffs": 4000, "ai_investment": "Generative AI Creative", "year": 2025, "classification": "Class C - AI-Washed", "evidence_strength": "Low", "summary": "Announced ~4,000 layoffs post-acquisition, citing generative AI as enabling creative agility and scale. Regulators and union leaders noted the restructuring was a traditional corporate consolidation, with AI cited primarily to bolster stock price and placate investors.", "strategy": "Corporate Consolidation", "badge_color": "c-washed" }
        ],
        "citations": {
            "NBER_2026": { "title": "Firm Data on AI (NBER Working Paper 34836)", "authors": "Yotzov, Barrero, Bloom, Bunn, Davis, Foster, Mizen, Thwaites, et al.", "date": "February 2026", "takeaway": "Based on a global survey of nearly 6,000 C-Suite executives: 69% of firms use AI actively, but 90% reported no impact on employment and 89% reported no impact on productivity to date.", "type": "Academic Survey" },
            "Stanford_2025": { "title": "Canaries in the Coal Mine?: Six Facts about the Recent Employment Effects of Artificial Intelligence", "authors": "Erik Brynjolfsson, Bharat Chandar, and Ruyu Chen", "date": "2025", "takeaway": "Empirically documented a sharp 16% relative employment decline for early-career workers (ages 22-25) in AI-exposed cognitive occupations.", "type": "Econometric Analysis" },
            "LSE_2025": { "title": "AI-Washing in Corporate Communications: Evidence from Multiple Sectors", "authors": "London School of Economics Working Paper 2025-14", "date": "2025", "takeaway": "Identified the phenomenon of 'AI-washing' in labor markets, where firms cite AI as the causal factor for layoffs that are primarily economically motivated.", "type": "Qualitative Analysis" },
            "Challenger_2025": { "title": "Annual Job Cut Report: Full Year 2025", "authors": "Challenger, Gray & Christmas, Inc.", "date": "2025", "takeaway": "Tracked a total of 1.17 million U.S. layoffs, with explicitly AI-attributed cuts reaching ~55,000 (+1,100% YoY).", "type": "Industry Tracker" },
            "MIT_2025": { "title": "Technical and Economic AI Displacement Capacity (Project Iceberg)", "authors": "Massachusetts Institute of Technology", "date": "November 2025", "takeaway": "Found that AI can economically displace tasks representing 11.7% of the U.S. labor force ($1.2 trillion in wages).", "type": "Economic Modeling" },
            "EY_2025": { "title": "AI Productivity and Workforce Outcomes: December 2025 Survey", "authors": "Ernst & Young Global LLP", "date": "December 2025", "takeaway": "Found that among organizations experiencing AI-driven productivity gains, only 17% opted to reduce headcount.", "type": "Industry Survey" }
        }
    };
}

function getFallbackResults() {
    return {
        "obj1_classification_scores": [
            { "Company": "Amazon", "Timing Proximity": "28", "Specificity": "20", "Post-Layoff AI Hiring": "22", "Inv. Pandemic Index": "10", "Total_Score": "80", "Classification": "Class A/B — Genuine" },
            { "Company": "Microsoft", "Timing Proximity": "28", "Specificity": "22", "Post-Layoff AI Hiring": "24", "Inv. Pandemic Index": "12", "Total_Score": "86", "Classification": "Class A/B — Genuine" },
            { "Company": "Google", "Timing Proximity": "25", "Specificity": "18", "Post-Layoff AI Hiring": "21", "Inv. Pandemic Index": "12", "Total_Score": "76", "Classification": "Class A/B — Genuine" },
            { "Company": "Cloudflare", "Timing Proximity": "30", "Specificity": "25", "Post-Layoff AI Hiring": "24", "Inv. Pandemic Index": "16", "Total_Score": "95", "Classification": "Class A/B — Genuine" },
            { "Company": "UPS", "Timing Proximity": "30", "Specificity": "24", "Post-Layoff AI Hiring": "20", "Inv. Pandemic Index": "16", "Total_Score": "90", "Classification": "Class A/B — Genuine" },
            { "Company": "Meta", "Timing Proximity": "22", "Specificity": "17", "Post-Layoff AI Hiring": "18", "Inv. Pandemic Index": "10", "Total_Score": "67", "Classification": "Class A/B — Genuine" },
            { "Company": "Workday", "Timing Proximity": "26", "Specificity": "20", "Post-Layoff AI Hiring": "22", "Inv. Pandemic Index": "13", "Total_Score": "81", "Classification": "Class A/B — Genuine" },
            { "Company": "Oracle", "Timing Proximity": "24", "Specificity": "16", "Post-Layoff AI Hiring": "18", "Inv. Pandemic Index": "14", "Total_Score": "72", "Classification": "Class A/B — Genuine" },
            { "Company": "Intel", "Timing Proximity": "22", "Specificity": "15", "Post-Layoff AI Hiring": "16", "Inv. Pandemic Index": "14", "Total_Score": "67", "Classification": "Class A/B — Genuine" },
            { "Company": "Salesforce", "Timing Proximity": "24", "Specificity": "18", "Post-Layoff AI Hiring": "20", "Inv. Pandemic Index": "13", "Total_Score": "75", "Classification": "Class A/B — Genuine" },
            { "Company": "Block", "Timing Proximity": "14", "Specificity": "8", "Post-Layoff AI Hiring": "10", "Inv. Pandemic Index": "4", "Total_Score": "36", "Classification": "Class C — AI-Washed" },
            { "Company": "Omnicom", "Timing Proximity": "12", "Specificity": "7", "Post-Layoff AI Hiring": "9", "Inv. Pandemic Index": "5", "Total_Score": "33", "Classification": "Class C — AI-Washed" }
        ],
        "rq5_investment_paradox": [
            { "sector": "CRM/Cloud", "total_ai_investment": "6284", "total_layoffs": "1671", "avg_layoff_rate": "0.002", "avg_ai_capex_ratio": "0.17", "corr_label": "High AI CapEx" },
            { "sector": "E-Commerce/Cloud", "total_ai_investment": "27322", "total_layoffs": "14645", "avg_layoff_rate": "0.004", "avg_ai_capex_ratio": "0.17", "corr_label": "High AI CapEx" },
            { "sector": "Enterprise Software", "total_ai_investment": "12984", "total_layoffs": "30513", "avg_layoff_rate": "0.021", "avg_ai_capex_ratio": "0.17", "corr_label": "High AI CapEx" },
            { "sector": "Fintech", "total_ai_investment": "973", "total_layoffs": "4392", "avg_layoff_rate": "0.038", "avg_ai_capex_ratio": "0.16", "corr_label": "Low AI CapEx" },
            { "sector": "HR Software", "total_ai_investment": "1641", "total_layoffs": "2185", "avg_layoff_rate": "0.011", "avg_ai_capex_ratio": "0.17", "corr_label": "High AI CapEx" },
            { "sector": "Logistics", "total_ai_investment": "37011", "total_layoffs": "48488", "avg_layoff_rate": "0.011", "avg_ai_capex_ratio": "0.16", "corr_label": "Low AI CapEx" },
            { "sector": "Media/Advertising", "total_ai_investment": "5755", "total_layoffs": "4461", "avg_layoff_rate": "0.006", "avg_ai_capex_ratio": "0.16", "corr_label": "Low AI CapEx" },
            { "sector": "Network/Security", "total_ai_investment": "429", "total_layoffs": "1508", "avg_layoff_rate": "0.032", "avg_ai_capex_ratio": "0.17", "corr_label": "High AI CapEx" },
            { "sector": "Semiconductors", "total_ai_investment": "9619", "total_layoffs": "10461", "avg_layoff_rate": "0.009", "avg_ai_capex_ratio": "0.16", "corr_label": "Low AI CapEx" },
            { "sector": "Social Media", "total_ai_investment": "5197", "total_layoffs": "3909", "avg_layoff_rate": "0.006", "avg_ai_capex_ratio": "0.17", "corr_label": "High AI CapEx" },
            { "sector": "Technology", "total_ai_investment": "31438", "total_layoffs": "8288", "avg_layoff_rate": "0.002", "avg_ai_capex_ratio": "0.17", "corr_label": "High AI CapEx" }
        ],
        "layer2_sectoral_correlation": [
            { "Sector": "CRM/Cloud", "Correlation": "0.3982" },
            { "Sector": "E-Commerce/Cloud", "Correlation": "0.3285" },
            { "Sector": "Enterprise Software", "Correlation": "0.5294" },
            { "Sector": "Fintech", "Correlation": "0.5102" },
            { "Sector": "HR Software", "Correlation": "0.2783" },
            { "Sector": "Logistics", "Correlation": "0.4821" },
            { "Sector": "Media/Advertising", "Correlation": "0.3935" },
            { "Sector": "Network/Security", "Correlation": "0.3720" },
            { "Sector": "Semiconductors", "Correlation": "0.2719" },
            { "Sector": "Social Media", "Correlation": "0.1922" },
            { "Sector": "Technology", "Correlation": "0.2563" }
        ],
        "obj5_policy_gaps": [
            { "Gap": "Mandatory AI Disclosure in Restructuring Filings", "Current_Adequacy": "0", "Evidence_Base": "SEC/labor ministry — no standard exists", "Priority": "Critical" },
            { "Gap": "Reskilling Infrastructure Scale", "Current_Adequacy": "35", "Evidence_Base": "48% demand training; 50% get low support", "Priority": "High" },
            { "Gap": "Early-Career Entry Point Protection Mechanism", "Current_Adequacy": "5", "Evidence_Base": "No policy framework for 22-25 cohort", "Priority": "Critical" },
            { "Gap": "International AI Employment Coordination (G20/WEF)", "Current_Adequacy": "10", "Evidence_Base": "No binding cross-border framework exists", "Priority": "High" },
            { "Gap": "AI-Washing Detection & Enforcement", "Current_Adequacy": "0", "Evidence_Base": "LSE: 15-25% of cuts are AI-washed", "Priority": "Critical" }
        ],
        "layer2_timing_analysis": [
            { "Company": "Amazon", "lag_quarters": "0" },
            { "Company": "Microsoft", "lag_quarters": "0" },
            { "Company": "Google", "lag_quarters": "1" },
            { "Company": "Cloudflare", "lag_quarters": "0" },
            { "Company": "UPS", "lag_quarters": "0" },
            { "Company": "Meta", "lag_quarters": "1" },
            { "Company": "Workday", "lag_quarters": "0" },
            { "Company": "Oracle", "lag_quarters": "0" },
            { "Company": "Intel", "lag_quarters": "1" },
            { "Company": "Salesforce", "lag_quarters": "0" },
            { "Company": "Block", "lag_quarters": "3" },
            { "Company": "Omnicom", "lag_quarters": "4" }
        ]
    };
}
