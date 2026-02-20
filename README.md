# 🌱 EcoPackAI
## AI-Powered Sustainable Packaging Recommendation System

---

## 🌐 Live Demo

Check out the deployed frontend here: [EcoPackAI Live App](https://ecopackai-web.vercel.app/)

---

## 📌 Overview

EcoPackAI is an **AI-based decision system** that recommends the **best packaging material** for shipments based on:

- 💰 **Cost**
- 🌍 **CO₂ Emissions**
- 🌱 **Sustainability Score**

The system automatically predicts and ranks packaging materials — you don't choose manually.

### Key Features

✅ **Session-based** — no login required, session persists until logout  
✅ **Rate Limiting** — 3 recommendation calls per 20-minute window (per IP)  
✅ **Materials Database** — lazy-loading flashcards from `clean_materials.csv`  
✅ **BI Dashboard** — HTML report embedded via iframe (served from `bi/` folder)  
✅ **PDF Reports** — downloadable with EcoPackAI header, shipment details, watermark  
✅ **Excel Export** — structured single-sheet report with colour formatting  
✅ **ML Integration** — auto-loads your models or runs without them  
✅ **Auto environment detection** — no config changes between local and production

---

## 🧠 How It Works

1. **Input** — Enter shipment details (weight, size, distance, fragility, etc.)
2. **Processing** — System tests your shipment against packaging materials
3. **Prediction** — ML models predict cost and CO₂ for each material
4. **Ranking** — Materials ranked by your chosen priority (Sustainability / CO₂ / Cost)
5. **Output** — View top recommendations with detailed metrics

No ML knowledge required to use the system.

---

## 🧱 Project Structure

```
ecopackai/
├── backend/
│   ├── app.py                      # Main Flask application (500+ lines)
│   ├── auth.py                     # Authentication with bcrypt + lockout
│   ├── db.py                       # MySQL connection pool
│   ├── recommender.py              # ML wrapper + history saver
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Environment variables (CREATE THIS)
│   └── .env.example                # Template
├── frontend/
│   ├── login.html                  # Login page
│   ├── index.html                  # Main application UI
│   ├── css/
│   │   ├── login.css               # Login styles
│   │   └── styles.css              # Main app styles (1000+ lines)
│   └── js/
│       ├── login.js                # Login logic
│       └── app.js                  # Frontend logic (600+ lines)
├── ml/
│   ├── models/
│   │   ├── cost_model.pkl          # (Optional) Trained cost model
│   │   └── co2_model.pkl           # (Optional) Trained CO₂ model
│   └── notebooks/
│       └── recommendation_engine.py # Your ML engine
├── data/
│   └── processed/
│       └── final_ecopack_dataset_fe.csv  # (Optional) Training dataset
├── sql/
│   └── schema.sql                  # Database schema
├── powerbi/
│   └── EcoPackAI_Dashboard.pbix    # PowerBI dashboard file
├── requirements.txt                # Python dependencies
└── README.md                       # This file
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      🌱 EcoPackAI System                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│   HTML/CSS/JS    │◄────────►│   Flask Backend  │
│   Frontend       │   HTTP   │   (Port 5000)    │
│  localhost:5500  │          │                  │
└──────────────────┘          └────────┬─────────┘
         │                             │
         │                  ┌──────────┼──────────────────────┐
         │                  │          │                      │
         │           ┌──────▼──┐  ┌───▼──────┐   ┌──────────▼────────┐
         │           │ Session │  │   ML     │   │  Rate Limits      │
         │           │ Store   │  │  Models  │   │  (per IP, 3/20min)│
         │           │(Flask)  │  │  .pkl    │   │  In-memory dict   │
         │           └─────────┘  └──────────┘   └───────────────────┘
         │
         ├── Home Tab      → Shipment form + Recommendations
         ├── Materials Tab → Lazy-loaded flashcards from clean_materials.csv
         └── Dashboard Tab → Iframe → /bi/dashboard → bi/EcoPackAI_BI_Dashboard.html
```

---

## 🚀 Quick Start

```bash
# 1. Backend
cd backend
python -m venv ecopackvenv
source ecopackvenv/bin/activate   # Windows: ecopackvenv\Scripts\activate
pip install -r requirements.txt
# Create .env with APP_SECRET_KEY
python app.py

# 2. Frontend (new terminal)
cd frontend
python -m http.server 5500

# 3. Open browser
# http://localhost:5500
```

No database setup. No login required. Just run and go.

---

## 🔒 Rate Limiting

### 3 Calls per 20 Minutes (Per IP)

| Setting | Value |
|---------|-------|
| Max calls | 3 |
| Window | 20 minutes (rolling) |
| Keyed by | Client IP address |
| Resets on | Timeout only (not on logout / refresh) |
| Session expiry | Logout only — no timer |

**How the UI handles it:**
- Counter updates immediately after each successful call
- Pre-flight check: if remaining = 0, toast fires without a network call
- If API returns 429 and the body is not valid JSON (e.g. from flask-limiter), the frontend catches the parse error and shows a friendly message regardless
- Quota toast: *"You've used your quota of 3 calls per 20 minutes. Wait and try again in X minutes."*

**To customise (in `backend/app.py`):**
```python
MAX_RECOMMENDATIONS_PER_WINDOW = 3   # number of calls
RATE_LIMIT_WINDOW_MINUTES = 20       # window in minutes
```

---

## 🗂️ Materials Database (Flashcards)

### Lazy Loading from CSV

The Materials tab fetches flashcard data from `data/processed/clean_materials.csv` in paginated batches — nothing loads until the tab is first visited.

**Endpoint:**
```
GET /api/materials?page=1&page_size=12
```

**Response:**
```json
{
  "materials": [ ... ],
  "total": 600,
  "page": 1,
  "page_size": 12,
  "has_more": true
}
```

**Each flashcard shows:**
- Material Name + Category
- Biodegradable badge (green ✓ / red ✗)
- Density, Tensile Strength
- Cost per kg, CO₂ per kg

**Pagination:** Click "Load More" to fetch the next batch. The button disables automatically when all materials are loaded.

**Test:**
```bash
curl "http://localhost:5000/api/materials?page=1&page_size=5"
```

---

## 📊 BI Dashboard

### HTML File Embedded via Iframe

The Dashboard tab loads `bi/EcoPackAI_BI_Dashboard.html` served directly by the Flask backend — no external Power BI service required.

**Path (relative to project root):**
```
bi/EcoPackAI_BI_Dashboard.html
```

**Endpoints:**
```
GET /bi/dashboard                  → serves the HTML file (text/html)
GET /api/bi-dashboard-available    → {"available": true/false}
```

**To update the dashboard:**
1. Export your Power BI report: **File → Export → Publish to web** or save as HTML
2. Replace `bi/EcoPackAI_BI_Dashboard.html` with the new file
3. Reload the Dashboard tab — no restart needed

**Test:**
```bash
curl -I http://localhost:5000/bi/dashboard
# HTTP/1.1 200 OK  Content-Type: text/html

curl http://localhost:5000/api/bi-dashboard-available
# {"available": true}
```

---

## 📄 PDF Reports

### Format

Generated PDFs contain three sections:

1. **EcoPackAI** — green title at top
2. **Shipment Details** — table with Category, Weight, Distance, Shipping Mode, Fragility, Moisture Sensitivity, Dimensions
3. **Recommendations** — table with green header, alternating row colours, columns: #, Material, Cost ($), CO₂ (kg), Sustainability

A faint diagonal `EcoPackAI` watermark covers the page at alpha=0.05 — visible only when looking closely.

**Endpoint:**
```
POST /api/generate-pdf
```

No request body needed — uses the last recommendation stored in the session.

---

## 📊 Excel Export

### Format

Single sheet `EcoPackAI Report` containing:

1. **EcoPackAI** — merged header in green
2. **Shipment Details** — bold labels, centre-aligned values
3. **Recommendations** — green header row, centre-aligned data, auto-width columns

**Endpoint:**
```
POST /api/export-excel
```

**Requires:** `openpyxl` — included in `requirements.txt`.

---

## 🔐 Session Management

EcoPackAI uses Flask sessions (cookie-based) — **no login required**.

| Behaviour | Detail |
|-----------|--------|
| Session creation | Automatic on first request |
| Session expiry | Logout only (`session.clear()` + fresh session) |
| Cookie (localhost) | `SameSite=Lax, Secure=False` — auto-detected |
| Cookie (production) | `SameSite=None, Secure=True` — auto-detected |
| Stored in session | Last recommendation, last shipment inputs |
| Rate limit storage | Server-side dict keyed by IP (not in cookie) |

**Cookie auto-detection** — `@app.before_request` reads `request.host` on every request. No env vars or deployment flags needed.

---

## 🌐 Deployment

### Backend → Render.com

1. Push code to GitHub (include `data/processed/clean_materials.csv` and `bi/EcoPackAI_BI_Dashboard.html`)
2. Create Web Service on Render:
   ```
   Root Directory: backend
   Build Command:  pip install -r requirements.txt
   Start Command:  gunicorn app:app
   ```
3. Add environment variable: `APP_SECRET_KEY`
4. No cookie config changes needed — auto-detected at runtime

### Frontend → Vercel

```bash
cd frontend
vercel --prod
```

The API URL is auto-detected. For cross-origin (Vercel frontend + Render backend), set the override once:
```bash
# In browser console on deployed site:
localStorage.setItem('ECO_API_URL', 'https://your-backend.onrender.com');
```

Or inject `window.__API_BASE_URL__` via a config script before `app.js` loads.

---

## 🧠 ML Models Integration

### Without Models (Works Immediately)

- Backend runs with `ML_AVAILABLE = False`
- Recommendation endpoint returns empty list
- All other features (materials, dashboard, PDF, Excel) still work

### With Your Trained Models

```
ml/models/
├── cost_model.pkl
└── co2_model.pkl
```

Ensure `ml/notebooks/recommendation_engine.py` exports:
```python
def generate_recommendations(materials_df, co2_model, cost_model,
                              shipment, FEATURES_COST, FEATURES_CO2,
                              top_k, sort_by): ...

materials_df   # DataFrame of materials
co2_model      # Trained CO₂ predictor
cost_model     # Trained cost predictor
FEATURES_COST  # List of feature names for cost model
FEATURES_CO2   # List of feature names for CO₂ model
```

Restart the backend — it auto-imports on startup.

---

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/status` | GET | Session info + remaining quota |
| `/api/auth/logout` | POST | Clear session, create fresh one |
| `/api/recommend` | POST | Generate recommendations (rate limited) |
| `/api/generate-pdf` | POST | Download PDF of last recommendation |
| `/api/export-excel` | POST | Download Excel of last recommendation |
| `/api/materials` | GET | Paginated materials flashcard data |
| `/api/bi-dashboard-available` | GET | Check if BI HTML file exists |
| `/bi/dashboard` | GET | Serve BI dashboard HTML |
| `/api/health` | GET | Health check + config summary |

---

## 🐛 Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Materials tab shows error | CSV not found | Check `data/processed/clean_materials.csv` exists |
| Dashboard tab blank | HTML file missing | Check `bi/EcoPackAI_BI_Dashboard.html` exists |
| 429 toast shows garbled text | flask-limiter returned HTML | Fixed — frontend catches parse error, shows friendly message |
| PDF returns 400 | No recommendation in session | Generate recommendations first |
| Session resets on refresh | Cookie blocked | Check browser privacy settings / extensions |
| Rate limit not resetting | In-memory dict persists | Wait 20 min or restart backend |
| CORS error | Origin not whitelisted | Add your frontend URL to CORS origins in `app.py` |
| Localhost cookies not working | Was `SameSite=None` hardcoded | Now auto-detected — should work on `http://localhost` |

---

## ✅ Features Checklist

- [x] Session-based (no login/DB required)
- [x] Rate limit: 3 calls per 20 minutes per IP
- [x] Session expires only on logout
- [x] Cookie auto-detected (local vs production)
- [x] Materials flashcards lazy-loaded from CSV
- [x] BI Dashboard HTML served from `bi/` folder
- [x] PDF: app name + shipment details + recommendations + watermark
- [x] Excel: single sheet with colour-formatted sections
- [x] Graceful 429 handling (no JSON parse crash)
- [x] No timer displayed — clean UI
- [x] Logout clears session + reloads page

---

**🌱 EcoPackAI — AI-Powered Sustainable Packaging Intelligence**

**Local:** http://localhost:5500  
**Production:** https://ecopackai-web.vercel.app

---

## 📞 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Can't login | Check MySQL running, verify `.env` credentials |
| Sorting not working | Ensure `sort_by` parameter passed correctly |
| PowerBI can't connect | Install MySQL ODBC driver, check firewall |
| Backend crashes | Check Python version (3.8+), reinstall requirements |
| Frontend blank | Check browser console for errors, verify API_URL |
| Account locked | Run unlock SQL query in MySQL |
| Models not loading | Verify paths in `.env`, check file permissions |

---

## 🚀 Quick Start Summary

```bash
# 1. Setup MySQL
mysql -u root -p
CREATE DATABASE ecopackdb;
source sql/schema.sql;

# 2. Setup Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create .env with your settings
python app.py

# 3. Setup Frontend (new terminal)
cd frontend
python -m http.server 5500

# 4. Open Browser
# http://localhost:5500/login.html

# 5. Setup PowerBI (optional)
# Open PowerBI Desktop → Get Data → MySQL
# Connect to localhost:3306/ecopackdb
# Create visualizations
```

---

## 📚 Documentation Files

- **README.md** - This comprehensive guide
- **sql/schema.sql** - Database schema
- **backend/.env.example** - Environment template
- **Code comments** - Extensive inline documentation

---

**🌱 Your complete EcoPackAI system with MySQL + PowerBI is ready!**

**Quick Start:** Open `http://localhost:5500/login.html` after running backend and frontend servers.

**Questions?** Check the Troubleshooting section or review inline code comments.