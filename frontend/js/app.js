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
        return isLocal ? 'http://localhost:5000' : 'https://ai-powered-sustainable-packaging-jrsk.onrender.com';
    })(),
    
    ROUTES: {
        AUTH_STATUS: '/api/auth/status',
        AUTH_LOGOUT: '/api/auth/logout',
        RECOMMEND: '/api/recommend',
        GENERATE_PDF: '/api/generate-pdf',
        EXPORT_EXCEL: '/api/export-excel',
        MATERIALS: '/api/materials',
        BI_DASHBOARD: '/bi/dashboard',
        BI_DASHBOARD_AVAILABLE: '/api/bi-dashboard-available'
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
    sessionInfo: null,
    currentPage: 'home',
    materialsPage: 1,
    materialsLoading: false
};

// ============================================================
// 🚀 APPLICATION INITIALIZATION
// ============================================================
const App = {
    async init() {
        try {
            await this.checkSession();
            this.setupEventListeners();
            this.showSection('home'); // Show home section by default
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
        if (!State.sessionInfo) return;
        
        const { recommendations_used = 0, recommendations_remaining = 3 } = State.sessionInfo;
        
        // Update rate limit info in header
        const requestsRemainingHeader = document.getElementById('requestsRemaining');
        if (requestsRemainingHeader) {
            if (recommendations_remaining === 0) {
                requestsRemainingHeader.innerHTML = `⚠️ <strong>0</strong> recommendations remaining (20 min window)`;
                requestsRemainingHeader.style.color = 'var(--error-red)';
            } else {
                requestsRemainingHeader.innerHTML = `📊 <strong>${recommendations_remaining}</strong> recommendation${recommendations_remaining !== 1 ? 's' : ''} remaining (20 min window)`;
                requestsRemainingHeader.style.color = 'var(--primary-green-light)';
            }
        }
        
        // Update rate limit info in generate section
        const requestsRemainingInfo = document.getElementById('requestsRemainingInfo');
        if (requestsRemainingInfo) {
            if (recommendations_remaining === 0) {
                requestsRemainingInfo.innerHTML = `⚠️ <strong>0</strong> recommendations remaining (20 min window). Wait and try again later.`;
                requestsRemainingInfo.style.color = 'var(--error-red)';
            } else {
                requestsRemainingInfo.innerHTML = `📊 <strong>${recommendations_remaining}</strong> recommendation${recommendations_remaining !== 1 ? 's' : ''} remaining (20 min window)`;
                requestsRemainingInfo.style.color = 'var(--primary-green-light)';
            }
        }
    },
    
    setupEventListeners() {
        DOM.generateBtn?.addEventListener('click', () => RecommendationController.generate());
        this.setupFragilitySlider();
        this.setupModeCards();
        this.setupNavigation();
        this.setupLogout();
    },
    
    setupNavigation() {
        document.getElementById('navHome')?.addEventListener('click', () => {
            this.showSection('home');
        });
        document.getElementById('navDashboard')?.addEventListener('click', () => {
            this.showSection('dashboard');
            DashboardController.load();
        });
        document.getElementById('navMaterials')?.addEventListener('click', () => {
            this.showSection('materials');
            MaterialsController.loadMaterials();
        });
    },
    
    setupLogout() {
        const logoutBtns = [document.getElementById('logoutBtn'), document.getElementById('sidebarLogout')];
        logoutBtns.forEach(btn => {
            btn?.addEventListener('click', async () => {
                try {
                    const response = await API.post(CONFIG.ROUTES.AUTH_LOGOUT);
                    const data = await response.json();
                    if (data.success) {
                        UI.showToast('Logged out successfully. Creating new session...', 'success');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    }
                } catch (error) {
                    Logger.error('Logout error', error);
                    UI.showToast('Logout failed', 'error');
                }
            });
        });
    },
    
    showSection(section) {
        // Hide all sections
        const sections = ['homeSection', 'dashboardSection', 'materialsSection'];
        sections.forEach(sectionId => {
            const el = document.getElementById(sectionId);
            if (el) el.classList.add('hidden');
        });
        
        // Show selected section
        const sectionMap = {
            'home': 'homeSection',
            'dashboard': 'dashboardSection',
            'materials': 'materialsSection'
        };
        const sectionId = sectionMap[section];
        if (sectionId) {
            const el = document.getElementById(sectionId);
            if (el) el.classList.remove('hidden');
        }
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const navMap = {
            'home': 'navHome',
            'dashboard': 'navDashboard',
            'materials': 'navMaterials'
        };
        const navId = navMap[section];
        if (navId) {
            const el = document.getElementById(navId);
            if (el) el.classList.add('active');
        }
        
        State.currentPage = section;
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
            
            // Handle rate limit with proper error message
            if (response.status === 429) {
                const error = await response.json();
                const errorMsg = error.error || "You've used your quota of 5 calls an hour. Wait and try again a bit later.";
                UI.showToast(errorMsg, 'error');
                // Reload session status to update UI
                await App.checkSession();
                State.isGenerating = false;
                UI.Button.setLoading(DOM.generateBtn, false);
                UI.Loading.hide();
                return;
            }
            
            if (!response.ok) {
                let error;
                try {
                    error = await response.json();
                } catch (e) {
                    // If JSON parse fails, check if it's a quota/limit error from response text
                    const text = await response.text();
                    if (text.includes('quota') || text.includes('limit') || text.includes('429')) {
                        UI.showToast("You've used your quota of 5 calls an hour. Wait and try again a bit later.", 'error');
                        await App.checkSession();
                        State.isGenerating = false;
                        UI.Button.setLoading(DOM.generateBtn, false);
                        UI.Loading.hide();
                        return;
                    }
                    throw new Error('Failed to generate recommendations');
                }
                
                // Check if it's a quota/limit error
                if (error.error && (error.error.includes('quota') || error.error.includes('limit') || error.limit_reached)) {
                    UI.showToast("You've used your quota of 5 calls an hour. Wait and try again a bit later.", 'error');
                    await App.checkSession();
                    State.isGenerating = false;
                    UI.Button.setLoading(DOM.generateBtn, false);
                    UI.Loading.hide();
                    return;
                }
                
                UI.showToast(error.error || 'Failed to generate recommendations', 'error');
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
                `✅ Success! ${remaining} recommendation${remaining !== 1 ? 's' : ''} remaining (20 min window).`,
                'success'
            );
            
            // Reload session status to update UI
            await App.checkSession();
            
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
                const error = await response.json();
                throw new Error(error.error || 'PDF generation failed');
            }
            
            const blob = await response.blob();
            this.downloadBlob(blob, this.generateFilename());
            
            UI.showToast('PDF downloaded successfully!', 'success');
        } catch (error) {
            Logger.error('PDF generation error', error);
            UI.showToast(error.message || 'PDF generation failed', 'error');
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
// 📊 EXCEL CONTROLLER
// ============================================================
const ExcelController = {
    async export() {
        try {
            const response = await API.post(CONFIG.ROUTES.EXPORT_EXCEL);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Excel export failed');
            }
            
            const blob = await response.blob();
            this.downloadBlob(blob, this.generateFilename());
            
            UI.showToast('Excel file downloaded successfully!', 'success');
        } catch (error) {
            Logger.error('Excel export error', error);
            UI.showToast(error.message || 'Excel export failed', 'error');
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
        return `EcoPackAI_Report_${date}.xlsx`;
    }
};

// ============================================================
// 📚 MATERIALS CONTROLLER
// ============================================================
const MaterialsController = {
    async loadMaterials() {
        if (State.materialsLoading) return;
        
        State.materialsLoading = true;
        const container = document.getElementById('materialsContainer');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        try {
            const response = await API.get(`${CONFIG.ROUTES.MATERIALS}?page=${State.materialsPage}&page_size=12`);
            
            if (!response.ok) {
                throw new Error('Failed to load materials');
            }
            
            const data = await response.json();
            
            if (data.materials && data.materials.length > 0) {
                data.materials.forEach(material => {
                    const card = this.createMaterialCard(material);
                    container.appendChild(card);
                });
                
                if (!data.has_more) {
                    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                } else {
                    if (loadMoreBtn) loadMoreBtn.style.display = 'block';
                }
                
                State.materialsPage++;
            } else {
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                container.innerHTML = '<p class="no-materials">No materials found.</p>';
            }
        } catch (error) {
            Logger.error('Materials loading error', error);
            UI.showToast('Failed to load materials', 'error');
        } finally {
            State.materialsLoading = false;
        }
    },
    
    createMaterialCard(material) {
        const card = document.createElement('div');
        card.className = 'material-card';
        
        card.innerHTML = `
            <div class="material-id">ID: ${material.Material_ID || 'N/A'}</div>
            <div class="material-name">${this.escape(material.Material_Name || 'Unknown')}</div>
            <div class="material-category">Category: ${this.escape(material.Category || 'N/A')}</div>
            <div class="material-metrics">
                <div><strong>Density:</strong> ${material.Density_kg_m3 || 'N/A'} kg/m³</div>
                <div><strong>Tensile:</strong> ${material.Tensile_Strength_MPa || 'N/A'} MPa</div>
                <div><strong>Cost:</strong> $${material.Cost_per_kg || '0.00'}/kg</div>
                <div><strong>CO₂:</strong> ${material.CO2_Emission_kg || '0.00'} kg</div>
            </div>
            <div class="badge ${material.Biodegradable === 'Yes' || material.Biodegradable === true ? 'green' : 'red'}">
                ${material.Biodegradable === 'Yes' || material.Biodegradable === true ? '✔ Biodegradable' : '✖ Non-Biodegradable'}
            </div>
        `;
        
        return card;
    },
    
    escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// ============================================================
// 📊 DASHBOARD CONTROLLER (BI HTML EMBED)
// ============================================================
const DashboardController = {
    loaded: false,

    async load() {
        if (this.loaded) return;

        const container = document.getElementById('dashboardContent');
        if (!container) return;

        try {
            const response = await API.get(CONFIG.ROUTES.BI_DASHBOARD_AVAILABLE);
            if (!response.ok) return;

            const data = await response.json();
            if (!data.available) return;

            // If BI dashboard HTML exists, embed it via iframe
            const src = `${CONFIG.API_URL}${CONFIG.ROUTES.BI_DASHBOARD}`;
            container.innerHTML = `
                <div class="dashboard-iframe-wrapper">
                    <iframe
                        src="${src}"
                        class="dashboard-iframe"
                        title="EcoPackAI BI Dashboard"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            `;

            this.loaded = true;
        } catch (error) {
            Logger.error('Dashboard load failed', error);
            // On failure, existing placeholder content remains visible
        }
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
            
            document.getElementById('exportExcelBtn')?.addEventListener('click', 
                () => ExcelController.export()
            );
            
            DOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        
        renderHeader(sortBy) {
            return `
                <div class="results-header">
                    <h2 class="section-title">✨ Your Recommendations (Sorted by ${sortBy})</h2>
                    <div class="results-actions">
                        <button id="generatePdfBtn" class="btn-secondary">📄 Download PDF</button>
                        <button id="exportExcelBtn" class="btn-secondary">📊 Export Excel</button>
                    </div>
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


// Initialize materials load more button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
        MaterialsController.loadMaterials();
    });
});