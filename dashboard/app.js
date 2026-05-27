// THE DUAL PARADOX: APPLICATION CONTROLLER

let appData = null;
let currentPaper = 'full';
let textSize = 0.95;

// Load JSON data and initialize
document.addEventListener("DOMContentLoaded", () => {
    fetch("research_data.json")
        .then(response => response.json())
        .then(data => {
            appData = data;
            initDashboard();
            runSimulation();
        })
        .catch(err => {
            console.error("Error loading JSON data:", err);
            // Fallback mock data if fetch fails locally
            appData = getFallbackData();
            initDashboard();
            runSimulation();
        });
});

function initDashboard() {
    renderStats();
    renderCompanies();
    renderCitations();
    loadPaperContent();
}

// 1. Switch Navigation Tabs
function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));
    
    document.getElementById(`tab-${tabId}`).classList.add("active");
    document.getElementById(`nav-${tabId}-btn`).classList.add("active");
}

// 2. Render Macro Statistic Cards
function renderStats() {
    const container = document.getElementById("stats-container");
    if (!container || !appData) return;
    
    container.innerHTML = appData.indicators.map(ind => `
        <div class="stat-card" style="box-shadow: inset 0 -4px 15px rgba(255,255,255,0.01)">
            <div class="stat-value" style="color: #fff; text-shadow: ${ind.color}">${ind.value}</div>
            <div class="stat-label">${ind.label}</div>
            <div class="stat-change">${ind.change}</div>
            <div class="stat-desc">${ind.description}</div>
            <span class="stat-source">${ind.source}</span>
        </div>
    `).join('');
}

// 3. Render Unified Corporate Grid
function renderCompanies(filteredList = null) {
    const container = document.getElementById("company-container");
    if (!container || !appData) return;
    
    const list = filteredList || appData.companies;
    
    if (list.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>
                No corporate restructuring cases match the selected filters.
            </div>
        `;
        return;
    }
    
    container.innerHTML = list.map(c => `
        <div class="company-card">
            <div class="company-card-header">
                <div>
                    <div class="comp-name">${c.company}</div>
                    <div class="comp-sector">${c.sector}</div>
                </div>
                <span class="badge ${c.badge_color}">${c.classification.split(' - ')[0]}</span>
            </div>
            
            <div class="comp-metrics">
                <div class="comp-metric-item">
                    <span class="metric-label">Layoffs</span>
                    <span class="metric-val" style="color: var(--color-direct)">~${c.layoffs.toLocaleString()}</span>
                </div>
                <div class="comp-metric-item">
                    <span class="metric-label">AI CapEx</span>
                    <span class="metric-val" style="color: #a78bfa">${c.ai_investment}</span>
                </div>
            </div>
            
            <div class="comp-summary">${c.summary}</div>
            
            <div class="comp-meta-row">
                <span>Causality: <strong>${c.classification.split(' - ')[1] || 'Direct'}</strong></span>
                <span>Evidence: <strong>${c.evidence_strength}</strong></span>
            </div>
        </div>
    `).join('');
}

// 4. Apply Dynamic Search & Category Filtering
function applyFilters() {
    if (!appData) return;
    
    const searchVal = document.getElementById("search-input").value.toLowerCase();
    const classFilter = document.getElementById("class-filter").value;
    const evidenceFilter = document.getElementById("evidence-filter").value;
    
    const filtered = appData.companies.filter(c => {
        const matchesSearch = c.company.toLowerCase().includes(searchVal) || 
                              c.sector.toLowerCase().includes(searchVal) || 
                              c.summary.toLowerCase().includes(searchVal) ||
                              c.strategy.toLowerCase().includes(searchVal);
                              
        const matchesClass = classFilter === 'all' || c.classification.includes(classFilter);
        const matchesEvidence = evidenceFilter === 'all' || c.evidence_strength === evidenceFilter;
        
        return matchesSearch && matchesClass && matchesEvidence;
    });
    
    renderCompanies(filtered);
}

// 5. Run Augmentation vs. Displacement Simulation Sandbox
function runSimulation() {
    const slider = document.getElementById("strategy-slider");
    if (!slider) return;
    
    const sVal = parseInt(slider.value);
    const dPercent = 100 - sVal;
    const aPercent = sVal;
    
    // Update labels
    document.getElementById("displace-percent").innerText = `${dPercent}%`;
    document.getElementById("augment-percent").innerText = `${aPercent}%`;
    
    // 1. Calculate Retention Rate: 17% (pure displacement) up to 98% (pure augmentation)
    const retention = Math.round(17 + 0.81 * sVal);
    document.getElementById("sim-retention-rate").innerText = `${retention}%`;
    
    // 2. Institutional Knowledge Index
    const knowledge = Math.round(15 + 0.80 * sVal + (sVal > 10 && sVal < 90 ? Math.sin(sVal/10)*2 : 0));
    document.getElementById("sim-knowledge-index").innerText = `${knowledge}/100`;
    
    // 3. Strategy Type Label
    let stratType = "Balanced Synthesis";
    if (sVal < 20) stratType = "Aggressive Downsizing";
    else if (sVal < 45) stratType = "Cost-Focused Transition";
    else if (sVal > 80) stratType = "Hyper-Augmentation Focus";
    else if (sVal > 55) stratType = "Human-First Restructure";
    document.getElementById("sim-strategy-type").innerText = stratType;
    
    // 4. Long-Term Org Health Rating
    let rating = "B-";
    let ratingClass = "badge-rating";
    if (sVal < 20) { rating = "F"; }
    else if (sVal < 35) { rating = "D+"; }
    else if (sVal < 50) { rating = "C-"; }
    else if (sVal < 65) { rating = "B-"; }
    else if (sVal < 80) { rating = "B+"; }
    else if (sVal < 92) { rating = "A-"; }
    else { rating = "A+"; }
    
    const healthEl = document.getElementById("sim-health-rating");
    healthEl.innerText = rating;
    
    // 5. Cost Allocation Modeling
    const severanceCost = ((100 - sVal) * 0.25).toFixed(1);
    const reskillingCost = (sVal * 0.35).toFixed(1);
    
    document.getElementById("cost-severance").innerText = `$${severanceCost}M`;
    document.getElementById("cost-reskilling").innerText = `$${reskillingCost}M`;
    
    // Update visually on the progress bar width
    const totalSimCost = parseFloat(severanceCost) + parseFloat(reskillingCost);
    const sevWidth = (parseFloat(severanceCost) / totalSimCost) * 100;
    const resWidth = 100 - sevWidth;
    
    document.getElementById("bar-severance").style.width = `${sevWidth}%`;
    document.getElementById("bar-reskilling").style.width = `${resWidth}%`;
    
    // 6. Insight Box Commentary
    let insight = "<strong>Insight:</strong> Balanced strategy minimizes capital risk and preserves key institutional capabilities while investing in necessary transitions.";
    if (sVal < 25) {
        insight = "<strong><i class='fa-solid fa-triangle-exclamation text-rose'></i> Severe Caution:</strong> Mass labor replacement decimates organizational memory, collapses employee trust, and results in heavy short-term severance expenses. Long-term capability is severely impaired.";
    } else if (sVal < 50) {
        insight = "<strong><i class='fa-solid fa-circle-exclamation text-amber'></i> Operational Warning:</strong> A cost-heavy approach reduces headcount but fails to optimize productivity because remaining staff lack sufficient reskilling support to use new AI investments.";
    } else if (sVal > 85) {
        insight = "<strong><i class='fa-solid fa-circle-check text-emerald'></i> Optimal Model:</strong> Investing heavily in internal reskilling and employee augmentation yields maximum long-term value, extremely high retention, and locks in a highly resilient workforce.";
    } else if (sVal > 60) {
        insight = "<strong><i class='fa-solid fa-circle-info text-indigo'></i> Strategic Synthesis:</strong> Prioritizing workforce reskilling preserves critical institutional knowledge while allowing gradual, high-efficiency task autonomization.";
    }
    
    document.getElementById("sim-insight-box").innerHTML = insight;
}

// 6. Render Citation References Panel
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

// 7. Click to highlight citation and scroll to it smoothly
function highlightCitation(citeKey) {
    // Switch to reading room first if not already there (though click is in reading room)
    // De-highlight all
    document.querySelectorAll(".citation-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".ref-cite").forEach(el => el.classList.remove("highlighted"));
    
    const targetItem = document.getElementById(`cite-${citeKey}`);
    if (targetItem) {
        targetItem.classList.add("active");
        targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight corresponding citation triggers in the text
        const triggers = document.querySelectorAll(`.ref-cite[onclick*="${citeKey}"]`);
        triggers.forEach(el => el.classList.add("highlighted"));
    }
}

// 8. Load Research Paper HTML Texts
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

function adjustTextSize(amount) {
    textSize = Math.min(1.4, Math.max(0.75, textSize + amount * 0.05));
    document.getElementById("reader-content-body").style.fontSize = `${textSize}rem`;
}

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
            <p>The central tension this paper addresses is whether AI is acting as a direct labor substitute (displacement) or as a productivity multiplier that, through economic growth, ultimately preserves or creates employment (augmentation). A third possibility — that AI is being used as narrative cover for cost-cutting driven by other factors — adds further complexity. The resolution of this question has profound implications for workers, firms, governments, and the trajectory of global economic inequality.</p>
            
            <h3>2. Problem Statement</h3>
            <h4>2.1 The Core Contradiction</h4>
            <p>Global corporate AI investment is projected to exceed $1 trillion by 2027, driven by the expectation that AI will dramatically increase productivity, innovation, and competitive advantage. Simultaneously, the same corporations leading this investment are conducting large-scale workforce reductions, with AI frequently cited as a contributing factor.</p>
            
            <h4>2.2 The Attribution Problem (AI-Washing)</h4>
            <p>In 2025, AI was cited as a factor in approximately 55,000 U.S. layoffs, representing a 1,100%+ year-on-year increase <span class="ref-cite" onclick="highlightCitation('Challenger_2025')">[Challenger, 2025]</span>. However, research from the London School of Economics identified widespread 'AI-washing' — firms misattributing economically-motivated cuts to AI adoption <span class="ref-cite" onclick="highlightCitation('LSE_2025')">[LSE, 2025]</span>. This creates a fundamental measurement problem: the causal relationship between AI investment and layoffs cannot be accurately quantified without controlling for firms using AI as a strategic narrative.</p>
            
            <h4>2.3 The Structural vs. Cyclical Debate</h4>
            <p>Labor economists are divided on whether current layoff patterns represent a structural shift driven by AI-enabled automation or a cyclical correction following the pandemic hiring boom of 2020–2022. MIT research (November 2025) found that AI can technically perform tasks representing 11.7% of the U.S. labor market at economically competitive cost <span class="ref-cite" onclick="highlightCitation('MIT_2025')">[MIT, 2025]</span> — yet the NBER found AI had little to no impact on employment in nearly 90% of firms over the same period <span class="ref-cite" onclick="highlightCitation('NBER_2026')">[NBER, 2026]</span>. This paradox between technical capability and observed macro-level impact demands rigorous investigation.</p>
            
            <h4>2.4 The Early-Career Crisis</h4>
            <p>A specific and underexamined dimension of the problem is the disproportionate impact on early-career workers. Stanford's Digital Economy Lab documented a 16% relative employment decline in early-career positions across AI-exposed occupations since ChatGPT's release in late 2022 <span class="ref-cite" onclick="highlightCitation('Stanford_2025')">[Stanford, 2025]</span>. J.P. Morgan research corroborated this with a 13% relative decline for workers aged 22–25 in the most AI-exposed roles. This cohort-specific displacement threatens to create a 'lost generation' of professionals shut out of traditional career entry points.</p>
            
            <h3>3. Related Work</h3>
            <p>Frey & Osborne (2013) foundational work established the theoretical exposure index, asserting 47% of U.S. jobs were at high automation risk. Acemoglu and Restrepo (2019-2022) refined empirical local labor models, finding that each robot per 1,000 workers reduced employment by 0.2-0.3%. The AI wave of 2024-2026 differs from standard robots in affecting cognitive, creative, and administrative tasks, rather than manual work, and propagating at digital speeds.</p>
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
            <p>In contrast, <strong>Block</strong> (~4,000 layoffs, "AI operations") represents Class C AI-washing, where leadership cited AI to distract investors from a 65% pandemic-era hiring bubble correction <span class="ref-cite" onclick="highlightCitation('LSE_2025')">[LSE, 2025]</span>.</p>
            
            <h3>3. Theoretical Framework: Displacement vs. Augmentation</h3>
            <p>The core economic debate centers on the displacement hypothesis (Frey & Osborne) versus the augmentation view (productivity multiplication). Academic surveys from the NBER show that in 90% of firms, AI has not decreased employment <span class="ref-cite" onclick="highlightCitation('NBER_2026')">[NBER, 2026]</span>. Industry surveys confirm that 83% of organizations seeing AI productivity gains did not cut headcount <span class="ref-cite" onclick="highlightCitation('EY_2025')">[EY, 2025]</span>, meaning that displacement is a corporate governance strategy, rather than an inevitable outcome of technology.</p>
        `;
    }
}

// 9. Stata Section Navigation
function switchStataNav(sectionId) {
    document.querySelectorAll(".stata-section").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".stata-nav-btn").forEach(el => el.classList.remove("active"));
    
    document.getElementById(`stata-sec-${sectionId}`).classList.add("active");
    document.getElementById(`stata-btn-${sectionId}`).classList.add("active");
}

// Fallback Mock Data for Local File Protocol
function getFallbackData() {
    return {
        "indicators": [
            { "id": "total_layoffs", "label": "Total U.S. Layoffs (2025)", "value": "1.17M", "change": "Highest since 2020", "source": "Challenger, Gray & Christmas", "description": "Macro-level U.S. layoffs driven by post-pandemic rightsizing, government restructure, and strategic capital reallocation.", "color": "var(--primary-glow)" },
            { "id": "ai_attributed", "label": "AI-Attributed Layoffs", "value": "55,000", "change": "+1,100% YoY", "source": "Challenger, Gray & Christmas", "description": "Redundancies where AI automation was explicitly cited by leadership as a structural or strategic factor.", "color": "var(--rose-glow)" },
            { "id": "early_career_decline", "label": "Early-Career Emp. Decline", "value": "13%-16%", "change": "Relative Drop", "source": "Stanford / J.P. Morgan", "description": "Significant reduction in employment of workers aged 22-25 in the most AI-exposed cognitive occupations post-2022.", "color": "var(--amber-glow)" },
            { "id": "displacement_capacity", "label": "Economic Displacement Feasibility", "value": "11.7%", "change": "$1.2T in Wages", "source": "MIT Project Iceberg", "description": "The proportion of total U.S. tasks that can be performed by AI at an economically competitive or lower cost.", "color": "var(--violet-glow)" },
            { "id": "reskilling_need", "label": "Workforce Reskilling by 2030", "value": "40%+", "change": "Global Need", "source": "McKinsey Global Institute", "description": "Percentage of global workers requiring significant upskilling or occupational shifts due to AI deployment.", "color": "var(--emerald-glow)" },
            { "id": "net_jobs_2030", "label": "Net Job Creation by 2030", "value": "+78M", "change": "170M New / 92M Displaced", "source": "WEF Future of Jobs 2025", "description": "World Economic Forum projection of net-positive employment outcomes, masked by extreme structural and regional mismatches.", "color": "var(--cyan-glow)" }
        ],
        "companies": [
            { "company": "Amazon", "sector": "E-Commerce / Cloud", "layoffs": 14000, "ai_investment": "$4.0B", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "High", "summary": "Amazon announced its largest corporate layoff round in history (14,000 roles) in October 2025. CEO Andy Jassy explicitly framed this as streamlined corporate layers to fund massive strategic 'bets' like AI, including AWS silicon and a $4B investment in Anthropic.", "strategy": "Augmentation / Re-platforming", "impact_rating": "Medium-High", "badge_color": "b-indirect" },
            { "company": "Microsoft", "sector": "Technology", "layoffs": 6000, "ai_investment": "$80.0B", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "High", "summary": "Pledged $80 billion globally to AI datacenters and chips, while conducting multiple corporate layoffs totaling over 6,000 workers to streamline operations. Administrative, customer support, and sales roles were automated using Microsoft's internal Copilots.", "strategy": "Workflow Automation", "impact_rating": "High", "badge_color": "b-indirect" },
            { "company": "Google (Alphabet)", "sector": "Technology", "layoffs": 1000, "ai_investment": "$16.0B", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium-High", "summary": "Cut over 1,000 roles in design, cloud engineering, and operations, while simultaneously investing $16B in an AI research and infrastructure hub in India and a 1-gigawatt green energy datacenter. Employees were urged to upskill to remain competitive.", "strategy": "Skill Re-alignment", "impact_rating": "Medium", "badge_color": "b-indirect" },
            { "company": "Cloudflare", "sector": "Network / Security", "layoffs": 1100, "ai_investment": "600%+ Internal AI Use", "year": "2025/26", "classification": "Class A - Direct Displacement", "evidence_strength": "Very High", "summary": "The most transparent case of direct AI replacement. Cloudflare cut 20% of its workforce (1,100 roles) in a complete reorganization. CEO Matthew Prince revealed that internal AI agents running marketing, support, and engineering had automated equivalent work.", "strategy": "Direct Agent Substitution", "impact_rating": "Severe", "badge_color": "a-direct" },
            { "company": "UPS", "sector": "Logistics", "layoffs": 48000, "ai_investment": "AI-Enabled Logistics", "year": 2025, "classification": "Class A - Direct Displacement", "evidence_strength": "High", "summary": "Announced a massive reduction of 48,000 roles under its 'Network of the Future' initiative. UPS closed 93 facilities and integrated AI routing algorithms and logistics robotics to move higher volumes with far fewer manual package sorters and operations managers.", "strategy": "Physical / Algorithmic Automation", "impact_rating": "Severe", "badge_color": "a-direct" },
            { "company": "Meta", "sector": "Social Media", "layoffs": 3600, "ai_investment": "AI Agents & Infra", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium", "summary": "Laid off 3,600 employees in 2025 during their pivot to 'Llama' and AI hardware development. Restructured layers to clear overhead while aggressively hiring niche PhD researchers in Silicon Valley and London, paying top-of-market compensation.", "strategy": "Skill Re-weighting", "impact_rating": "Medium", "badge_color": "b-indirect" },
            { "company": "Workday", "sector": "HR Software", "layoffs": 1750, "ai_investment": "AI-First Product Pivot", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "High", "summary": "Cut 8.5% of its workforce (~1,750 roles) to re-allocate capital toward its new AI-first HR and financial planning products. Stated that the corporate reorganization was necessary to focus entirely on automated cloud software.", "strategy": "Product Portfolio Shift", "impact_rating": "Medium", "badge_color": "b-indirect" },
            { "company": "Oracle", "sector": "Enterprise Software", "layoffs": 30000, "ai_investment": "AI Cloud Datacenters", "year": 2026, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium", "summary": "Oracle conducted a sweeping layoff of ~30,000 positions globally in early 2026. This was driven by a re-alignment to fund and build their next-generation sovereign AI clouds and automated database platforms.", "strategy": "Infrastructure Pivot", "impact_rating": "High", "badge_color": "b-indirect" },
            { "company": "Intel", "sector": "Semiconductors", "layoffs": 10000, "ai_investment": "Chip AI R&D Acceleration", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium", "summary": "Cut over 10,000 corporate and manufacturing-adjacent jobs during a major structural cost-reduction effort. The saved capital was pledged directly to fund acceleration of AI foundry and silicon R&D in an attempt to challenge Nvidia's dominance.", "strategy": "Foundry Cost Reallocation", "impact_rating": "High", "badge_color": "b-indirect" },
            { "company": "Salesforce", "sector": "CRM / Cloud", "layoffs": 1200, "ai_investment": "Agentforce AI Platform", "year": 2025, "classification": "Class B - Indirect Restructuring", "evidence_strength": "Medium", "summary": "Salesforce reduced its sales and client relations headcounts by 1,200 while heavily pushing its autonomous 'Agentforce' platform, demonstrating a corporate strategy to transition customer support from human reps to software agents.", "strategy": "Customer Service Autonomization", "impact_rating": "Medium", "badge_color": "b-indirect" },
            { "company": "Block (Square)", "sector": "Fintech", "layoffs": 4000, "ai_investment": "AI Operational Efficiencies", "year": 2026, "classification": "Class C - AI-Washed", "evidence_strength": "Low", "summary": "Jack Dorsey's Block announced a 10% staff reduction (~4,000 roles) in February 2026, citing plans to automate operations with AI. However, independent audits showed the primary reason was a correction of their extreme pandemic headcount bubble (+65%), with minimal active AI deployment in affected teams.", "strategy": "Pandemic Bubble Correction", "impact_rating": "High", "badge_color": "c-washed" },
            { "company": "Omnicom", "sector": "Media / Advertising", "layoffs": 4000, "ai_investment": "Generative AI Creative", "year": 2025, "classification": "Class C - AI-Washed", "evidence_strength": "Low", "summary": "Announced ~4,000 layoffs post-acquisition, citing generative AI as enabling creative agility and scale. Regulators and union leaders noted the restructuring was a traditional corporate consolidation, with AI cited primarily to bolster stock price and placate investors.", "strategy": "Corporate Consolidation", "impact_rating": "Medium", "badge_color": "c-washed" }
        ],
        "citations": {
            "NBER_2026": { "title": "Firm Data on AI (NBER Working Paper 34836)", "authors": "Yotzov, Barrero, Bloom, Bunn, Davis, Foster, Mizen, Thwaites, et al.", "date": "February 2026", "takeaway": "Based on a global survey of nearly 6,000 C-Suite executives: 69% of firms use AI actively, but 90% reported no impact on employment and 89% reported no impact on productivity to date, proving a major gap between hype and actual displacement.", "type": "Academic Survey" },
            "Stanford_2025": { "title": "Canaries in the Coal Mine?: Six Facts about the Recent Employment Effects of Artificial Intelligence", "authors": "Erik Brynjolfsson, Bharat Chandar, and Ruyu Chen", "date": "2025", "takeaway": "Empirically documented a sharp 16% relative employment decline for early-career workers (ages 22-25) in AI-exposed cognitive occupations, demonstrating that new entrants bear the initial brunt of generative AI displacement.", "type": "Econometric Analysis" },
            "LSE_2025": { "title": "AI-Washing in Corporate Communications: Evidence from Multiple Sectors", "authors": "London School of Economics Working Paper 2025-14", "date": "2025", "takeaway": "Identified the phenomenon of 'AI-washing' in labor markets, where firms cite AI as the causal factor for layoffs that are primarily economically motivated to mask business issues or pandemic overhiring.", "type": "Qualitative Analysis" },
            "Challenger_2025": { "title": "Annual Job Cut Report: Full Year 2025", "authors": "Challenger, Gray & Christmas, Inc.", "date": "2025", "takeaway": "Tracked a total of 1.17 million U.S. corporate layoffs, with explicitly AI-attributed cuts reaching ~55,000. This represented an 1,100% year-on-year increase, but accounted for less than 5% of total job cuts.", "type": "Industry Tracker" },
            "MIT_2025": { "title": "Technical and Economic AI Displacement Capacity (Project Iceberg)", "authors": "Massachusetts Institute of Technology", "date": "November 2025", "takeaway": "Shifted the paradigm from theoretical task exposure to actual economic feasibility, finding that AI can economically displace tasks representing 11.7% of the U.S. labor force ($1.2 trillion in wages).", "type": "Economic Modeling" },
            "EY_2025": { "title": "AI Productivity and Workforce Outcomes: December 2025 Survey", "authors": "Ernst & Young Global LLP", "date": "December 2025", "takeaway": "Found that among organizations experiencing AI-driven productivity gains, only 17% opted to reduce headcount. The remaining 83% utilized AI as an augmentation tool to grow output and retain human capital.", "type": "Industry Survey" }
        }
    };
}
