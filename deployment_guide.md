# 🚀 EcoPackAI - Complete Setup & Deployment Guide

## 📌 Overview

This guide covers:
1. **Local Development** - Running on your machine
2. **Rate Limits** - How the 3 calls per 20 minutes works
3. **CMD Operations** - All command-line instructions
4. **Deployment** - Publishing to production (Vercel + Render)

---

## 🏠 LOCAL DEVELOPMENT SETUP

### Prerequisites

- **Python 3.8+**
- **pip** (Python package manager)
- **Git** (for deployment)
- **Web browser**
- **Terminal/Command Prompt**

---

### Step 1: Backend Setup

**1.1 Navigate to backend folder**

```bash
cd backend
```

**1.2 Create Virtual Environment**

**Windows:**
```cmd
python -m venv ecopackvenv
ecopackvenv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv ecopackvenv
source ecopackvenv/bin/activate
```

You should see `(ecopackvenv)` in your terminal.

**1.3 Install Dependencies**

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Required packages (`requirements.txt`):**
```
Flask==3.0.0
Flask-CORS==4.0.0
Flask-Limiter==3.5.0
python-dotenv==1.0.0
reportlab==4.0.7
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.3.2
xgboost==2.0.2
openpyxl==3.1.2
gunicorn==21.2.0
```

**1.4 Create .env File**

Create `backend/.env`:

```env
# Flask Secret Key (REQUIRED)
APP_SECRET_KEY=your-secret-key-here
```

**Generate Secret Key:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy output to `APP_SECRET_KEY`.

**1.5 Verify Project Structure**

Ensure your project structure is:
```
project/
├── backend/
│   ├── app.py
│   ├── .env
│   └── requirements.txt
├── bi/
│   └── EcoPackAI_BI_Dashboard.html   ← BI dashboard HTML export
├── data/
│   └── processed/
│       └── clean_materials.csv        ← Materials database
└── frontend/
    ├── index.html
    ├── css/
    │   └── styles.css
    └── js/
        └── app.js
```

**Test CSV path resolution:**
```bash
cd backend
python -c "from pathlib import Path; p = Path('.').resolve().parent / 'data' / 'processed' / 'clean_materials.csv'; print(p, p.exists())"
```

**Test BI dashboard path resolution:**
```bash
cd backend
python -c "from pathlib import Path; p = Path('.').resolve().parent / 'bi' / 'EcoPackAI_BI_Dashboard.html'; print(p, p.exists())"
```

**1.6 Start Backend Server**

```bash
python app.py
```

**Expected Output:**
```
============================================================
🌱 EcoPackAI Backend Starting
   Rate limit : 3 per 20 min (per IP)
   Session    : expires only on logout
   Cookie     : auto-detected (localhost=Lax, prod=None+Secure)
   ML models  : True
============================================================
 * Running on http://0.0.0.0:5000
```

**Keep this terminal running!**

---

### Step 2: Frontend Setup

**2.1 Open NEW Terminal**

Navigate to frontend:

```bash
cd frontend
```

**2.2 API URL — No Manual Changes Needed**

`frontend/js/app.js` automatically detects the environment at runtime:

```javascript
const CONFIG = {
    API_URL: (() => {
        const explicit = window.__API_BASE_URL__ || localStorage.getItem('ECO_API_URL');
        if (explicit) return explicit;
        const { protocol, hostname, port } = window.location;
        const isLocal = ['localhost', '127.0.0.1'].includes(hostname);
        if (isLocal) return `http://${hostname}:5000`;
        if (port === '5000') return `${protocol}//${hostname}:${port}`;
        return `${protocol}//${hostname}`;
    })(),
    // ...
};
```

- **localhost** → automatically connects to `http://localhost:5000`
- **Deployed** → automatically connects to the same domain/host
- No need to hardcode or change URLs between environments.

**Override if needed (advanced):**
```javascript
// In browser console — one-time override
localStorage.setItem('ECO_API_URL', 'https://your-custom-backend.onrender.com');
```

**2.3 Start Frontend Server**

**Option A - Python HTTP Server (Recommended):**

**Windows:**
```cmd
python -m http.server 5500
```

**Mac/Linux:**
```bash
python3 -m http.server 5500
```

**Option B - VS Code Live Server:**
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"
4. Opens at: `http://127.0.0.1:5500`

**2.4 Open in Browser**

Navigate to: **http://localhost:5500** or **http://127.0.0.1:5500**

---

## 🔒 HOW RATE LIMITS WORK

### The 3 Calls per 20 Minutes System

**Current Configuration (per IP address, not per session):**
- **Limit:** 3 recommendation calls per rolling 20-minute window
- **Keyed by:** Client IP address — survives page refresh, browser close, incognito
- **Session expiry:** Only on explicit logout — no timer, no auto-expiry
- **Reset:** Window resets automatically after 20 minutes

**How It Works:**

1. **First Visit:**
   - No rate limit record yet for your IP
   - UI shows: "3 recommendations remaining"
   - Session is created and persists until you click Logout

2. **Generate Recommendations:**
   - Counter increments per IP: 1/3, 2/3, 3/3
   - Each call uses 1 quota
   - UI updates immediately: "2 recommendations remaining"

3. **Limit Reached (After 3rd call):**
   - API returns HTTP 429 with JSON error
   - Toast message: "You've used your quota of 3 calls per 20 minutes. Wait and try again in X minutes."
   - UI pre-checks before calling: if counter is 0, toast fires without hitting the network
   - Counter shows: "0 recommendations remaining"

4. **Window Reset:**
   - After 20 minutes from your first call in the window, counter resets
   - You can generate 3 more recommendations
   - Session data (last shipment, last recommendations) is preserved

5. **Logout:**
   - Clears session data from server
   - Creates a fresh session immediately
   - Rate limit counter is **not** reset on logout (it's per IP, not per session)
   - Page reloads automatically

### How to Check Your Quota

**Method 1 - UI Display:**

The frontend shows in multiple places:
```
3 recommendations remaining this hour → Initial
2 recommendations remaining this hour → After 1st
0 recommendations remaining this hour → After 3rd
```

**Method 2 - API Call:**

```bash
curl -c cookies.txt http://localhost:5000/api/auth/status
```

**Response:**
```json
{
  "authenticated": true,
  "user_email": "ecopackai-user@gmail.com",
  "recommendations_used": 1,
  "recommendations_remaining": 2
}
```

### How to Reset Rate Limit (for Testing)

**Method 1 - Wait 20 Minutes:**
- The window resets automatically
- Most accurate test of production behaviour

**Method 2 - Backend Restart:**
```bash
# In backend terminal
Ctrl+C       # Stop server
python app.py  # Restart — clears in-memory RATE_LIMITS dict
```

**Method 3 - Change IP:**
- Use a different network or VPN
- Rate limit is per IP, so a different IP = fresh quota

> **Note:** Clearing browser cookies does NOT reset the rate limit.
> The limit is stored server-side per IP, not in the browser.

### Customizing Rate Limits

Edit `backend/app.py`:

```python
# ── RATE LIMIT CONFIG (PER CLIENT IP) ──────────────────
MAX_RECOMMENDATIONS_PER_WINDOW = 3   # Number of calls allowed
RATE_LIMIT_WINDOW_MINUTES = 20       # Window duration in minutes
```

**Examples:**
```python
# 5 calls per hour
MAX_RECOMMENDATIONS_PER_WINDOW = 5
RATE_LIMIT_WINDOW_MINUTES = 60

# 10 calls per 30 minutes
MAX_RECOMMENDATIONS_PER_WINDOW = 10
RATE_LIMIT_WINDOW_MINUTES = 30
```

---

## 🗂️ MATERIALS DATABASE (FLASHCARDS)

### How It Works

The Materials Database tab loads packaging materials from `data/processed/clean_materials.csv` using lazy loading — cards are fetched in batches as the user scrolls or clicks "Load More".

**API Endpoint:**
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

**Frontend behaviour:**
- First batch loads when you click the "Materials DB" tab (lazy — not on page load)
- Each card shows: Material Name, Category, Density, Tensile Strength, Cost/kg, CO₂/kg, Biodegradable badge
- "Load More" button fetches the next batch of 12

**Test the endpoint:**
```bash
curl "http://localhost:5000/api/materials?page=1&page_size=5"
```

**Verify CSV is found:**
```bash
cd backend
python -c "
from pathlib import Path
p = Path('.').resolve().parent / 'data' / 'processed' / 'clean_materials.csv'
print('Found:', p.exists(), '| Path:', p)
"
```

---

## 📊 BI DASHBOARD

### How It Works

The Dashboard tab embeds the BI report as an HTML file served directly by the backend.

**File location (relative to project root):**
```
bi/EcoPackAI_BI_Dashboard.html
```

**Backend endpoint:**
```
GET /bi/dashboard         → serves the HTML file
GET /api/bi-dashboard-available → {"available": true/false}
```

**Frontend:** The `dashboardFrame` iframe src is set to `{API_URL}/bi/dashboard`.

**To update the dashboard:**
1. Export your Power BI report as HTML: **File → Export → Publish to web** or use the HTML export from Power BI Desktop
2. Save the file at `bi/EcoPackAI_BI_Dashboard.html`
3. Reload the Dashboard tab in the app — no backend restart needed

**Test the endpoint:**
```bash
curl -I http://localhost:5000/bi/dashboard
# Should return: HTTP/1.1 200 OK  Content-Type: text/html

curl http://localhost:5000/api/bi-dashboard-available
# {"available": true}
```

**If the file is missing:**
```bash
# Create the bi/ directory
mkdir -p bi

# Place your exported HTML file there
cp /path/to/your/exported_dashboard.html bi/EcoPackAI_BI_Dashboard.html
```

---

## 💻 CMD OPERATIONS GUIDE

### Backend Operations

**Start Backend:**
```bash
cd backend
ecopackvenv\Scripts\activate   # Windows
# source ecopackvenv/bin/activate  # Mac/Linux
python app.py
```

**Stop Backend:**
- Press `Ctrl+C` in terminal

**Check if Backend Running:**
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "ml_available": true,
  "environment": "local",
  "max_recommendations_per_window": 3,
  "rate_limit_window_minutes": 20
}
```

**Test Session Status:**
```bash
curl -c cookies.txt http://localhost:5000/api/auth/status
```

**Test Recommendation API:**
```bash
curl -b cookies.txt -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d "{\"Category_item\":\"Electronics\",\"Weight_kg\":2.5,\"Fragility\":6,\"Moisture_Sens\":false,\"Distance_km\":1500,\"Shipping_Mode\":\"Road\",\"Length_cm\":30,\"Width_cm\":20,\"Height_cm\":15,\"top_k\":5,\"sort_by\":\"Sustainability\"}"
```

**Test Materials Database (page 1, 12 per page):**
```bash
curl "http://localhost:5000/api/materials?page=1&page_size=12"
```

**Test BI Dashboard available:**
```bash
curl http://localhost:5000/api/bi-dashboard-available
```

**Test PDF Generation:**
```bash
curl -b cookies.txt -X POST http://localhost:5000/api/generate-pdf \
  --output test_report.pdf
```

**Test Excel Export:**
```bash
curl -b cookies.txt -X POST http://localhost:5000/api/export-excel \
  --output test_report.xlsx
```

**Test Logout:**
```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:5000/api/auth/logout
```

---

### Frontend Operations

**Start Frontend:**
```bash
cd frontend
python -m http.server 5500
```

**Stop Frontend:**
- Press `Ctrl+C` in terminal

**Change Port (if 5500 is busy):**
```bash
python -m http.server 8080
```

---

### Common CMD Issues

**Problem: "Port 5000 already in use"**

**Windows:**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**Mac/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

**Problem: "Port 5500 already in use"**

**Windows:**
```cmd
netstat -ano | findstr :5500
taskkill /PID <PID_NUMBER> /F
```

**Mac/Linux:**
```bash
lsof -ti:5500 | xargs kill -9
```

**Problem: "Python not found"**
```bash
python3 app.py  # Try python3 instead
```

**Problem: "Module not found"**
```bash
# Ensure venv is activated — you should see (ecopackvenv)
pip install -r requirements.txt
```

**Problem: "CSV not found"**
```bash
cd backend
python -c "from pathlib import Path; print((Path.cwd().parent / 'data' / 'processed' / 'clean_materials.csv').exists())"
# Should print: True
```

**Problem: "BI dashboard not found"**
```bash
cd backend
python -c "from pathlib import Path; print((Path.cwd().parent / 'bi' / 'EcoPackAI_BI_Dashboard.html').exists())"
# Should print: True
```

---

## 🌐 DEPLOYMENT TO PRODUCTION

### Step 1: Prepare Backend for Deployment

**1.1 Cookie Config — No Manual Changes Needed**

The backend auto-detects environment at runtime via `@app.before_request`:
- `localhost` / `127.0.0.1` → `SameSite=Lax, Secure=False` (plain HTTP)
- Any other host → `SameSite=None, Secure=True` (HTTPS)

**No code changes needed between local and production.**

**1.2 Update CORS Origins**

Edit `backend/app.py` to add your Vercel URL:

```python
CORS(app,
     supports_credentials=True,
     origins=[
         "http://localhost:3000",
         "http://localhost:5500",
         "http://127.0.0.1:5500",
         "http://127.0.0.1:3000",
         "https://ecopackai-web.vercel.app",  # ← YOUR VERCEL URL
         "https://*.vercel.app"
     ],
     allow_headers=["Content-Type"],
     max_age=3600)
```

**1.3 Verify Files in Git**

```bash
# Check CSV is tracked
git ls-files | grep "clean_materials.csv"

# Check BI dashboard is tracked
git ls-files | grep "EcoPackAI_BI_Dashboard.html"

# If missing, add them:
git add data/processed/clean_materials.csv
git add bi/EcoPackAI_BI_Dashboard.html
git commit -m "Add materials CSV and BI dashboard"
```

**1.4 Ensure gunicorn is in requirements.txt**

```bash
pip install gunicorn openpyxl
pip freeze > requirements.txt
```

---

### Step 2: Deploy Backend to Render.com

**2.1 Push to GitHub**
```bash
git add .
git commit -m "Deploy: production-ready backend"
git push origin main
```

**2.2 Create Web Service on Render**

1. Go to https://render.com → Sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   ```
   Name: ecopackai-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   Root Directory: backend
   ```
5. **Environment Variables → Add:**
   - `APP_SECRET_KEY` = (generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)

6. Click **Create Web Service**

**2.3 Wait for Deployment (~5 minutes)**

Watch logs for:
```
🌱 EcoPackAI Backend Starting
   Rate limit : 3 per 20 min (per IP)
   Session    : expires only on logout
   Cookie     : auto-detected (localhost=Lax, prod=None+Secure)
```

**2.4 Test Backend**
```bash
curl https://your-backend.onrender.com/api/health
# {"status":"healthy","ml_available":true,"environment":"production",...}

curl https://your-backend.onrender.com/api/bi-dashboard-available
# {"available":true}  ← only if bi/ folder was committed to git
```

---

### Step 3: Deploy Frontend to Vercel

**3.1 No URL Changes Needed**

The frontend auto-detects the API URL. On Vercel, if your frontend and backend are on different domains, set the override in your Vercel environment or use `localStorage`:

```bash
# In browser console on the deployed site (one-time):
localStorage.setItem('ECO_API_URL', 'https://your-backend.onrender.com');
```

Or set `window.__API_BASE_URL__` in a config script before `app.js` loads.

**3.2 Install Vercel CLI**
```bash
npm install -g vercel
```

**3.3 Deploy**
```bash
cd frontend
vercel
vercel --prod
```

**3.4 Copy Your Frontend URL**

Example: `https://ecopackai-web.vercel.app`

---

### Step 4: Update Backend CORS

Edit `backend/app.py` with your actual Vercel URL, then redeploy:

```bash
git add backend/app.py
git commit -m "Update CORS with Vercel domain"
git push origin main
```

---

### Step 5: Test Production

**5.1 Open Your Frontend**
```
https://ecopackai-web.vercel.app
```

**5.2 Test Checklist**

- [ ] Page loads without errors
- [ ] Browser console (F12) — no CORS errors
- [ ] Generate recommendations → counter updates
- [ ] After 3rd call → quota toast appears (no invalid JSON error)
- [ ] Click "Materials DB" tab → flashcards load (lazy)
- [ ] Scroll / "Load More" → more cards appear
- [ ] Click "Dashboard" tab → BI iframe loads
- [ ] Download PDF → EcoPackAI header + Shipment Details + table
- [ ] Download Excel → structured report
- [ ] Logout → page reloads, fresh session

---

## 🔧 TROUBLESHOOTING

### Local Development Issues

**Issue: CORS Error**
```
Access to fetch at 'http://localhost:5000/api/...' blocked by CORS
```
Fix: Ensure `backend/app.py` CORS origins include `http://localhost:5500` and `http://127.0.0.1:5500`.

---

**Issue: Materials Tab Shows Error**
```
⚠️ Could not load materials database.
```
Fix:
1. Check backend logs for "CSV not found"
2. Verify: `bi backend && python -c "from pathlib import Path; print((Path.cwd().parent / 'data' / 'processed' / 'clean_materials.csv').exists())"`

---

**Issue: Dashboard Tab Shows Blank / Error**

Fix:
1. Check `bi/EcoPackAI_BI_Dashboard.html` exists
2. Test: `curl -I http://localhost:5000/bi/dashboard` — should be `200 OK`
3. Check: `curl http://localhost:5000/api/bi-dashboard-available` — should be `{"available":true}`

---

**Issue: 429 Toast Shows Garbled Text**

This was a bug where flask-limiter returned HTML instead of JSON and the frontend crashed parsing it. Fixed — the frontend now catches parse errors and shows a friendly message regardless.

---

**Issue: Session Not Persisting After Refresh**

Fix: Browser cookie settings. Check:
1. DevTools → Application → Cookies → `localhost:5500` — session cookie should exist
2. Not in strict privacy mode / cookie-blocking extension active
3. Backend is running (cookie set by backend, not frontend)

---

### Production Issues

**Issue: PDF Returns 400**
```
POST /api/generate-pdf → 400
```
Fix: Session cookie not sent cross-origin. The backend auto-sets `SameSite=None, Secure=True` for non-localhost hosts. Verify HTTPS is being used on both frontend and backend.

---

**Issue: Rate Limit Resets Too Fast / Not Resetting**

The limit is per **server process memory**. On Render free tier, the server may sleep and restart, clearing the in-memory `RATE_LIMITS` dict. This is expected — restart = fresh limits.

---

**Issue: BI Dashboard Not Loading in Production**

Fix: Verify `bi/EcoPackAI_BI_Dashboard.html` was committed and pushed to Git before deploying to Render.

```bash
git ls-files | grep EcoPackAI_BI_Dashboard
# bi/EcoPackAI_BI_Dashboard.html  ← should appear
```

---

## 🎯 QUICK REFERENCE

### Local Development URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5500 | Main app interface |
| Backend API | http://localhost:5000 | API server |
| Health Check | http://localhost:5000/api/health | Server status |
| Session Status | http://localhost:5000/api/auth/status | Check quota |
| Materials API | http://localhost:5000/api/materials | Flashcard data |
| BI Dashboard | http://localhost:5000/bi/dashboard | Embedded HTML |

### Key Configuration Values

| Setting | Value | Location |
|---------|-------|----------|
| Rate limit | 3 calls | `MAX_RECOMMENDATIONS_PER_WINDOW` in app.py |
| Window duration | 20 minutes | `RATE_LIMIT_WINDOW_MINUTES` in app.py |
| Session expiry | Logout only | `PERMANENT_SESSION_LIFETIME = timedelta(days=365)` |
| Cookie (local) | SameSite=Lax, Secure=False | Auto-detected via `@before_request` |
| Cookie (prod) | SameSite=None, Secure=True | Auto-detected via `@before_request` |
| Materials CSV | `data/processed/clean_materials.csv` | Relative to project root |
| BI Dashboard | `bi/EcoPackAI_BI_Dashboard.html` | Relative to project root |
| Materials per page | 12 | `page_size` param in `/api/materials` |

### Files to Check Before Deploying

```
backend/app.py          ✓ CORS origins include your Vercel URL
data/processed/         ✓ clean_materials.csv committed to git
bi/                     ✓ EcoPackAI_BI_Dashboard.html committed to git
requirements.txt        ✓ includes openpyxl, gunicorn
backend/.env            ✗ NOT in git (add to .gitignore)
```

---

**Your EcoPackAI is ready! 🌱**

**Local:** http://localhost:5500  
**Production:** https://ecopackai-web.vercel.app

---

**Made with 🌱 by EcoPackAI Team**