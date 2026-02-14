// ============================================================
// 🌱 ECOPACKAI - SIMPLIFIED VERSION (NO LOGIN)
// Session-based with 3 recommendations per hour limit
// ============================================================

// ============================================================
// 📋 CONFIGURATION
// ============================================================
const CONFIG = {
    API_URL: (() => {
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        return isLocal ? 'http://localhost:5000' : 'https://ai-powered-sustainable-packaging-recommendation-system.onrender.com';
    })(),
    
    ROUTES: {
        AUTH_STATUS: '/api/auth/status',
        RECOMMEND: '/api/recommend',
        GENERATE_PDF: '/api/generate-pdf'
    },
    
    TIMINGS: {
        SPLASH_DURATION: 2000,
        TOAST_DURATION: 4000
    },
    
    DEFAULTS: {
        TOP_K: 5,
        SORT_BY: 'Sustainability'
    }
};

// ============================================================
// 🎯 DOM CACHE
// ============================================================
const DOM = {
    get generateBtn() { return document.getElementById('generateBtn'); },
    get resultsSection() { return document.getElementById('resultsSection'); },
    get toast() { return document.getElementById('toast'); },
    get splashScreen() { return document.getElementById('splashScreen'); },
    get mainApp() { return document.getElementById('mainApp'); },
    get fragSlider() { return document.getElementById('fragility'); },
    get fragValue() { return document.getElementById('fragilityValue'); },
    get sessionInfo() { return document.getElementById('sessionInfo'); }
};

// ============================================================
// 💾 STATE MANAGEMENT
// ============================================================
const State = {
    isGenerating: false,
    lastRecommendations: null,
    sessionInfo: null
};

// ============================================================
// 🚀 APPLICATION INITIALIZATION
// ============================================================
const App = {
    async init() {
        try {
            await this.checkSession();
            this.setupEventListeners();
            this.hideSplash();
            Logger.info('Application initialized successfully');
        } catch (error) {
            Logger.error('Application initialization failed', error);
        }
    },
    
    async checkSession() {
        try {
            const response = await API.get(CONFIG.ROUTES.AUTH_STATUS);
            const data = await response.json();
            
            State.sessionInfo = data;
            this.updateSessionDisplay();
            
            Logger.info('Session info:', data);
        } catch (error) {
            Logger.error('Session check failed', error);
        }
    },
    
    updateSessionDisplay() {
        if (!DOM.sessionInfo || !State.sessionInfo) return;
        
        const { recommendations_used = 0, recommendations_remaining = 3 } = State.sessionInfo;
        
        DOM.sessionInfo.innerHTML = `
            <div class="session-badge">
                📊 Recommendations: ${recommendations_used}/3 used | ${recommendations_remaining} remaining
            </div>
        `;
    },
    
    setupEventListeners() {
        DOM.generateBtn?.addEventListener('click', () => RecommendationController.generate());
        this.setupFragilitySlider();
        this.setupModeCards();
    },
    
    setupFragilitySlider() {
        if (!DOM.fragSlider || !DOM.fragValue) return;
        
        DOM.fragSlider.addEventListener('input', (e) => {
            DOM.fragValue.textContent = e.target.value;
        });
    },
    
    setupModeCards() {
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                const radio = card.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            });
        });
    },
    
    hideSplash() {
        setTimeout(() => {
            DOM.splashScreen?.classList.add('hidden');
            DOM.mainApp?.classList.remove('hidden');
        }, CONFIG.TIMINGS.SPLASH_DURATION);
    }
};

// ============================================================
// 🌐 API LAYER
// ============================================================
const API = {
    async request(url, options = {}) {
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        try {
            return await fetch(`${CONFIG.API_URL}${url}`, { ...defaultOptions, ...options });
        } catch (error) {
            Logger.error(`API request failed: ${url}`, error);
            throw error;
        }
    },
    
    async get(url) {
        return this.request(url, { method: 'GET' });
    },
    
    async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// ============================================================
// 🤖 RECOMMENDATION CONTROLLER
// ============================================================
const RecommendationController = {
    async generate() {
        if (State.isGenerating) return;
        
        State.isGenerating = true;
        UI.Button.setLoading(DOM.generateBtn, true);
        UI.Loading.show();
        
        try {
            const formData = this.collectFormData();
            
            if (!this.validateFormData(formData)) {
                UI.showToast('Please select category and shipping mode', 'error');
		State.isGenerating = false;
        	UI.Button.setLoading(DOM.generateBtn, false);
        	UI.Loading.hide();
                return;
            }
            
            const response = await API.post(CONFIG.ROUTES.RECOMMEND, formData);
            
            // Handle rate limit
            if (response.status === 429) {
                const error = await response.json();
                UI.showToast(error.error || 'Rate limit reached. Please wait.', 'error');
                return;
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate recommendations');
            }
            
            const result = await response.json();
            
            // Update session info
            if (result.session_info) {
                State.sessionInfo = {
                    recommendations_used: result.session_info.used,
                    recommendations_remaining: result.session_info.remaining
                };
                App.updateSessionDisplay();
            }
            
            State.lastRecommendations = {
                data: result.recommendations,
                sortBy: formData.sort_by
            };
            
            UI.Results.display(result.recommendations, formData.sort_by);
            
            const remaining = result.session_info?.remaining || 0;
            UI.showToast(
                `✅ Success! ${remaining} recommendation${remaining !== 1 ? 's' : ''} remaining this hour.`,
                'success'
            );
            
        } catch (error) {
            Logger.error('Generation error', error);
            UI.showToast(error.message || 'Failed to generate recommendations', 'error');
        } finally {
            State.isGenerating = false;
            UI.Button.setLoading(DOM.generateBtn, false);
            UI.Loading.hide();
        }
    },
    
    collectFormData() {
        return {
            Category_item: document.getElementById('categoryItem')?.value,
            Weight_kg: parseFloat(document.getElementById('weight')?.value),
            Distance_km: parseFloat(document.getElementById('distance')?.value),
            Length_cm: parseFloat(document.getElementById('length')?.value),
            Width_cm: parseFloat(document.getElementById('width')?.value),
            Height_cm: parseFloat(document.getElementById('height')?.value),
            Fragility: parseInt(document.getElementById('fragility')?.value),
            Moisture_Sens: document.getElementById('moistureSens')?.checked || false,
            Shipping_Mode: document.getElementById('shippingMode')?.value,
            top_k: parseInt(document.getElementById('topK')?.value) || CONFIG.DEFAULTS.TOP_K,
            sort_by: document.querySelector('input[name="optimizationMode"]:checked')?.value || CONFIG.DEFAULTS.SORT_BY
        };
    },
    
    validateFormData(data) {
        return !!(data.Category_item && data.Shipping_Mode);
    }
};

// ============================================================
// 📄 PDF CONTROLLER
// ============================================================
const PDFController = {
    async generate() {
        try {
            const response = await API.post(CONFIG.ROUTES.GENERATE_PDF);
            
            if (!response.ok) {
                throw new Error('PDF generation failed');
            }
            
            const blob = await response.blob();
            this.downloadBlob(blob, this.generateFilename());
            
            UI.showToast('PDF downloaded successfully!', 'success');
        } catch (error) {
            Logger.error('PDF generation error', error);
            UI.showToast('PDF generation failed', 'error');
        }
    },
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    generateFilename() {
        const date = new Date().toISOString().slice(0, 10);
        return `EcoPackAI_Report_${date}.pdf`;
    }
};

// ============================================================
// 🎨 UI COMPONENTS
// ============================================================
const UI = {
    Button: {
        setLoading(button, isLoading) {
            if (!button) return;
            button.disabled = isLoading;
            button.innerHTML = isLoading 
                ? '⏳ Generating...' 
                : '🤖 Generate AI Recommendations';
        }
    },
    
    Loading: {
        show() {
            if (document.getElementById('loadingOverlay')) return;
            
            const overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="robot-icon">🤖</div>
                    <div class="loading-text">Analyzing your shipment...</div>
                </div>
            `;
            document.body.appendChild(overlay);
        },
        
        hide() {
            document.getElementById('loadingOverlay')?.remove();
        }
    },
    
    Results: {
        display(recommendations, sortBy) {
            if (!DOM.resultsSection || !recommendations?.length) return;
            
            DOM.resultsSection.classList.remove('hidden');
            const [best, ...others] = recommendations;
            
            DOM.resultsSection.innerHTML = `
                ${this.renderHeader(sortBy)}
                ${this.renderBestCard(best)}
                ${this.renderTable(recommendations)}
            `;
            
            document.getElementById('generatePdfBtn')?.addEventListener('click', 
                () => PDFController.generate()
            );
            
            DOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        
        renderHeader(sortBy) {
            return `
                <div class="results-header">
                    <h2 class="section-title">✨ Your Recommendations (Sorted by ${sortBy})</h2>
                    <button id="generatePdfBtn" class="btn-secondary">📄 Download PDF</button>
                </div>
            `;
        },
        
        renderBestCard(material) {
            return `
                <div class="best-recommendation-card">
                    <div class="best-rec-header">
                        <span class="best-rec-icon">🏆</span>
                        <h3 class="best-rec-title">${this.escape(material.Material_Name)}</h3>
                    </div>
                    <div class="best-rec-metrics">
                        <div class="best-metric">
                            <div class="best-metric-label">🌱 Sustainability</div>
                            <div class="best-metric-value">${material.Sustainability.toFixed(4)}</div>
                        </div>
                        <div class="best-metric">
                            <div class="best-metric-label">💨 CO₂</div>
                            <div class="best-metric-value">${material.Pred_CO2.toFixed(2)} kg</div>
                        </div>
                        <div class="best-metric">
                            <div class="best-metric-label">💲 Cost</div>
                            <div class="best-metric-value">$${material.Pred_Cost.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="best-rec-properties">
                        <div class="property-badge ${material.Biodegradable ? 'true' : 'false'}">
                            ${material.Biodegradable ? '✓' : '✗'} Biodegradable
                        </div>
                        <div class="property-badge true">
                            💪 ${material.Tensile_Strength_MPa.toFixed(1)} MPa
                        </div>
                    </div>
                </div>
            `;
        },
        
        renderTable(recommendations) {
            const rows = recommendations
                .map((rec, index) => this.renderTableRow(rec, index))
                .join('');
            
            return `
                <div class="recommendations-table card">
                    <h3 class="table-title">📊 All Recommendations</h3>
                    <table class="recs-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Material</th>
                                <th>CO₂ (kg)</th>
                                <th>Cost ($)</th>
                                <th>Sustainability</th>
                                <th>Biodegradable</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        },
        
        renderTableRow(rec, index) {
            return `
                <tr class="${index === 0 ? 'best-row' : ''}">
                    <td>${index + 1}</td>
                    <td>${this.escape(rec.Material_Name)}</td>
                    <td>${rec.Pred_CO2.toFixed(2)}</td>
                    <td>${rec.Pred_Cost.toFixed(2)}</td>
                    <td>${rec.Sustainability.toFixed(4)}</td>
                    <td>${rec.Biodegradable ? '✓' : '✗'}</td>
                </tr>
            `;
        },
        
        escape(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    },
    
    showToast(message, type = 'info') {
        const toast = DOM.toast;
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, CONFIG.TIMINGS.TOAST_DURATION);
    }
};

// ============================================================
// 🛠️ UTILITIES
// ============================================================
const Logger = {
    error(message, error) {
        console.error(`[EcoPackAI Error] ${message}:`, error);
    },
    
    info(message, data) {
        console.log(`[EcoPackAI] ${message}`, data || '');
    },
    
    warn(message, data) {
        console.warn(`[EcoPackAI Warning] ${message}`, data || '');
    }
};

// ============================================================
// 🎬 APPLICATION START
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    Logger.info('Starting EcoPackAI application (No Login Mode)...');
    App.init();
});


// ================= SESSION TIMER (2 HOURS) =================
let sessionDuration = 2 * 60 * 60; // Sync with backend constant

function startSessionTimer() {
    const timerElements = [
        document.getElementById("sessionTimer"),
        document.getElementById("sessionTimerSidebar")
    ];

    setInterval(() => {
        if (sessionDuration <= 0) {
    		logoutUser();
	}


        sessionDuration--;

        let hrs = String(Math.floor(sessionDuration / 3600)).padStart(2, '0');
        let mins = String(Math.floor((sessionDuration % 3600) / 60)).padStart(2, '0');
        let secs = String(sessionDuration % 60).padStart(2, '0');

        timerElements.forEach(el => {
            if (el) el.innerText = `${hrs}:${mins}:${secs}`;
        });

    }, 1000);
}

startSessionTimer();


// ================= LOGOUT =================
function logoutUser() {
    fetch(`${CONFIG.API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
        alert("Logged out successfully");
        window.location.reload();
    });
}

document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
document.getElementById("sidebarLogout")?.addEventListener("click", logoutUser);