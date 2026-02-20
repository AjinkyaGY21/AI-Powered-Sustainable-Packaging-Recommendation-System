# 🚀 EcoPackAI - Complete Setup & Deployment Guide

## 📌 Overview

This guide covers:
1. **Local Development** - Running on your machine
2. **Session Limits** - How the 5 recommendations/hour works
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

**1.5 Verify CSV Data Path**

Ensure your project structure is:
```
project/
├── backend/
│   ├── app.py
│   ├── .env
│   └── requirements.txt
├── data/
│   └── processed/
│       └── clean_materials.csv
└── frontend/
    ├── index.html
    ├── css/
    │   └── styles.css
    └── js/
        └── app.js
```

**Test path resolution:**
```bash
cd backend
python -c "from pathlib import Path; print(Path(__file__).resolve().parent.parent / 'data' / 'processed' / 'clean_materials.csv')"
```

**1.6 Start Backend Server**

```bash
python app.py
```

**Expected Output:**
```
====================================================================
🌱 EcoPackAI Backend Starting
====================================================================
Session Duration: 2 Hours
Recommendation Limit: 5 per Hour
ML Models Available: True
====================================================================
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

**2.2 Update API URL for Local Testing**

Edit `frontend/js/app.js` (around line 13):

```javascript
const CONFIG = {
    API_URL: (() => {
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        return isLocal ? 'http://localhost:5000' : 'https://your-backend.onrender.com';
    })(),
    // ...
};
```

This automatically switches between local and production URLs.

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

**Expected Output:**
```
Serving HTTP on :: port 5500 (http://[::]:5500/) ...
```

**Keep this terminal running!**

**2.4 Open in Browser**

Navigate to: **http://localhost:5500** or **http://127.0.0.1:5500**

---

## 🔒 HOW SESSION LIMITS WORK

### The 5 Recommendations Per Hour System

**Updated Configuration:**
- **Limit:** 5 recommendations per hour (changed from 3)
- **Session Duration:** 2 hours (changed from 1 hour)
- **Reset:** Counter resets after 1 hour

**How It Works:**

1. **First Visit:**
   - System creates a session with unique ID
   - Counter starts at 0/5
   - You have 5 recommendations available
   - Session valid for 2 hours

2. **Generate Recommendations:**
   - Counter increments: 1/5, 2/5, 3/5, 4/5, 5/5
   - Each generation uses 1 quota
   - UI shows: "4 recommendations remaining this hour"

3. **Limit Reached (After 5th generation):**
   - Toast message: "⏳ Maximum 5 recommendations per hour limit reached. Please try again later."
   - Counter shows: "0 recommendations remaining this hour"
   - Must wait for hourly reset

4. **Hourly Reset:**
   - After 1 hour, counter resets to 0/5
   - You can generate 5 more recommendations
   - Session itself expires after 2 hours (full logout)

### How to Check Your Quota

**Method 1 - UI Display:**

The frontend automatically shows below the generate button:
```
5 recommendations remaining this hour → Initial
4 recommendations remaining this hour → After 1st
0 recommendations remaining this hour → After 5th
```

**Method 2 - API Call:**

```bash
curl -c cookies.txt http://localhost:5000/api/auth/status

# Response:
{
  "authenticated": true,
  "user_email": "ecopackai-user@gmail.com",
  "recommendations_used": 2,
  "recommendations_remaining": 3
}
```

### How to Reset Session (for Testing)

**Method 1 - Clear Browser Cookies:**
1. Open Developer Tools (F12)
2. Go to Application → Cookies
3. Delete `session` cookie for `localhost:5500`
4. Refresh page

**Method 2 - Incognito/Private Window:**
- Opens new session automatically
- Fresh 5/5 quota

**Method 3 - Backend Restart:**
```bash
# In backend terminal
Ctrl+C  # Stop server
python app.py  # Restart
```

**Method 4 - Wait 1 Hour:**
- Hourly counter auto-resets
- Session continues for 2 hours total

### Customizing Session Limits

**Change limit from 5 to 10:**

Edit `backend/app.py` (around line 80):

```python
# SESSION CONFIG VALUES
MAX_RECOMMENDATIONS_PER_HOUR = 10  # Changed from 5
SESSION_DURATION_HOURS = 2
```

**Change session duration from 2 hours to 4 hours:**

Edit `backend/app.py` (around line 81):

```python
MAX_RECOMMENDATIONS_PER_HOUR = 5
SESSION_DURATION_HOURS = 4  # Changed from 2
```

---

## 💻 CMD OPERATIONS GUIDE

### Backend Operations

**Start Backend:**
```bash
cd backend
ecopackvenv\Scripts\activate  # Windows
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
  "session_duration_hours": 2,
  "max_recommendations_per_hour": 5
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

**Test Materials Database:**
```bash
curl http://localhost:5000/api/materials?page=1&per_page=20
```

**Test PDF Generation:**
```bash
curl -b cookies.txt -X POST http://localhost:5000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d "{\"user_inputs\":{\"Category_item\":\"Electronics\",\"Weight_kg\":2.5}}" \
  --output test_report.pdf
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
python -m http.server 8080  # Use port 8080 instead
```

**Test Frontend Access:**
```bash
curl http://localhost:5500
```

Should return HTML of your page.

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

Try:
```bash
python3 app.py  # Use python3 instead of python
```

**Problem: "Module not found"**

```bash
# Ensure venv is activated - you should see (ecopackvenv)
pip install -r requirements.txt
```

**Problem: "CSV not found"**

```bash
# Verify path
cd backend
python -c "from pathlib import Path; print((Path.cwd().parent / 'data' / 'processed' / 'clean_materials.csv').exists())"
# Should print: True
```

---

## 🌐 DEPLOYMENT TO PRODUCTION

### Step 1: Prepare Backend for Deployment

**1.1 Update Session Config for Production**

Edit `backend/app.py` (around line 64):

```python
# 🔥 SESSION CONFIG FOR PRODUCTION (CROSS-ORIGIN)
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "None"   # ← CRITICAL for cross-origin
app.config["SESSION_COOKIE_SECURE"] = True       # ← CRITICAL (requires HTTPS)
```

**Why?** Your frontend (Vercel) and backend (Render) are on different domains. `SameSite=None` allows cookies to work across domains.

**1.2 Update CORS Origins**

Edit `backend/app.py` (around line 67):

```python
CORS(app, 
     supports_credentials=True,
     origins=[
         "http://localhost:5500",           # Local testing
         "http://127.0.0.1:5500",           # Local testing
         "http://localhost:3000",           # Alternative local port
         "https://ecopackai-web.vercel.app", # ← YOUR VERCEL URL
         "https://*.vercel.app"             # All Vercel preview URLs
     ],
     allow_headers=["Content-Type"],
     max_age=3600)
```

**1.3 Verify Materials CSV is in Git**

```bash
# Check if CSV is tracked
git ls-files | grep "clean_materials.csv"

# If not found, add it:
git add data/processed/clean_materials.csv
git commit -m "Add materials database"
```

**1.4 Ensure gunicorn is in requirements.txt**

```bash
pip install gunicorn
pip freeze > requirements.txt
```

---

### Step 2: Deploy Backend to Render.com

**2.1 Push to GitHub**

```bash
git add .
git commit -m "Deploy: Updated session config and CORS"
git push origin main
```

**2.2 Create Render Account**

1. Go to https://render.com
2. Sign up with GitHub

**2.3 Create Web Service**

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   ```
   Name: ecopackai-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   Root Directory: backend
   ```

4. **Environment Variables:**
   - Click **Advanced**
   - Add: `APP_SECRET_KEY` = (generate random string)

5. Click **Create Web Service**

**2.4 Wait for Deployment**

- First deploy takes ~5 minutes
- Watch logs for: "🌱 EcoPackAI Backend Starting"

**2.5 Copy Your Backend URL**

Example: `https://ecopackai-backend.onrender.com`

**2.6 Test Backend**

```bash
curl https://ecopackai-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "ml_available": true,
  "session_duration_hours": 2,
  "max_recommendations_per_hour": 5
}
```

---

### Step 3: Deploy Frontend to Vercel

**3.1 Update API URL**

Edit `frontend/js/app.js` (line ~13):

```javascript
const CONFIG = {
    API_URL: (() => {
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        return isLocal 
            ? 'http://localhost:5000' 
            : 'https://ecopackai-backend.onrender.com';  // ← YOUR RENDER URL
    })(),
    // ...
};
```

**3.2 Install Vercel CLI**

```bash
npm install -g vercel
```

**3.3 Deploy**

```bash
cd frontend
vercel
```

**Follow prompts:**
```
? Set up and deploy? Yes
? Which scope? Your account
? Link to existing project? No
? What's your project's name? ecopackai-web
? In which directory is your code located? ./
? Want to override settings? No
```

**3.4 Deploy to Production**

```bash
vercel --prod
```

**3.5 Copy Your Frontend URL**

Example: `https://ecopackai-web.vercel.app`

---

### Step 4: Update Backend CORS with Frontend URL

**4.1 Edit backend/app.py**

```python
CORS(app, 
     supports_credentials=True,
     origins=[
         "http://localhost:5500",
         "http://127.0.0.1:5500",
         "https://ecopackai-web.vercel.app",  # ← Add your actual URL
         "https://*.vercel.app"
     ],
     allow_headers=["Content-Type"],
     max_age=3600)
```

**4.2 Redeploy Backend**

```bash
git add backend/app.py
git commit -m "Update CORS for production"
git push origin main
```

Render will auto-deploy.

---

### Step 5: Test Production

**5.1 Open Your Frontend**

```
https://ecopackai-web.vercel.app
```

**5.2 Test Checklist**

- [ ] Page loads without errors
- [ ] Check browser console (F12) - no CORS errors
- [ ] Fill form and generate recommendations
- [ ] Counter shows: "4 recommendations remaining"
- [ ] Click "Materials Database" → cards load
- [ ] Scroll down → more cards load (infinite scroll)
- [ ] Generate 5 total → toast: "limit reached"
- [ ] Download PDF → opens with user inputs

**5.3 Check Render Logs**

In Render dashboard:
- Click your service
- Click "Logs"
- Look for:
  ```
  POST /api/recommend HTTP/1.1" 200
  GET /api/materials?page=1 HTTP/1.1" 200
  POST /api/generate-pdf HTTP/1.1" 200
  ```

---

## 🔧 TROUBLESHOOTING

### Local Development Issues

**Issue 1: CORS Error in Browser Console**

```
Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS
```

**Fix:** Check `backend/app.py` CORS origins include:
```python
"http://localhost:5500",
"http://127.0.0.1:5500",
```

---

**Issue 2: Materials Not Loading**

```
Failed to load materials database
```

**Fix:** 
1. Check backend logs for "CSV not found"
2. Verify CSV exists:
   ```bash
   cd backend
   python -c "from pathlib import Path; print((Path.cwd().parent / 'data' / 'processed' / 'clean_materials.csv').exists())"
   ```
3. If False, check your folder structure

---

**Issue 3: Session Not Persisting**

**Fix:**
1. Check browser allows cookies (not in strict privacy mode)
2. Verify backend session config:
   ```python
   app.config["SESSION_COOKIE_HTTPONLY"] = True
   app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # For local
   ```

---

### Production Issues

**Issue 1: PDF Returns 400 Error**

```
POST /api/generate-pdf HTTP/1.1" 400
```

**Fix:** Session cookies not working cross-origin.

**Solution:**
```python
# In app.py - MUST have these for production:
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True
```

Then redeploy backend.

---

**Issue 2: Recommendations Work Locally but Not in Production**

**Check:**
1. Backend logs on Render
2. CSV file included in deployment
3. ML models available

**Fix:**
```bash
# Verify CSV in git
git ls-files | grep clean_materials.csv

# If missing:
git add data/processed/clean_materials.csv
git commit -m "Add materials CSV"
git push origin main
```

---

**Issue 3: Render Shows "Module not found"**

**Fix:** Missing dependency in `requirements.txt`

```bash
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update requirements"
git push origin main
```

---

**Issue 4: "Application Error" on Render**

**Check Render Logs:**
1. Go to Render dashboard
2. Click your service
3. Click "Logs"
4. Look for error messages

**Common causes:**
- Missing `APP_SECRET_KEY` environment variable
- Wrong start command (should be `gunicorn app:app`)
- Python version mismatch

---

## 📊 MONITORING & LOGS

### Local Backend Logs

Watch terminal for:
```
INFO:EcoPackAI:New session created: abc123...
INFO:EcoPackAI:Recommendations used: 1/5
INFO:EcoPackAI:Recommendations used: 2/5
...
INFO:EcoPackAI:Recommendations used: 5/5
```

### Production Logs (Render)

1. Go to Render dashboard
2. Click your service
3. Click "Logs"

Look for:
```
🌱 EcoPackAI Backend Starting
Session Duration: 2 Hours
Recommendation Limit: 5 per Hour
ML Models Available: True
```

### Browser Console (F12)

**Successful Request:**
```
[EcoPackAI] Session info: {recommendations_used: 2, recommendations_remaining: 3}
✅ Success! 3 recommendations remaining this hour.
```

**Rate Limit Hit:**
```
⏳ Maximum 5 recommendations per hour limit reached. Please try again later.
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
| Materials API | http://localhost:5000/api/materials | Database endpoint |

### Production URLs (Example)

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | https://ecopackai-web.vercel.app | Live app |
| Backend | https://ai-powered-sustainable-packaging-jrsk.onrender.com | Live API |
| Health Check | https://ai-powered-sustainable-packaging-jrsk.onrender.com/api/health | Status |

### Key Configuration Values

| Setting | Local | Production |
|---------|-------|------------|
| Backend Port | 5000 | Auto (Render) |
| Frontend Port | 5500 | Auto (Vercel) |
| Session Duration | 2 hours | 2 hours |
| Recommendations Limit | 5/hour | 5/hour |
| SESSION_COOKIE_SAMESITE | "Lax" | "None" |
| SESSION_COOKIE_SECURE | False | True |

### Important Files to Update for Deployment

```
backend/app.py:
  ✓ Line 64: SESSION_COOKIE_SAMESITE = "None"
  ✓ Line 65: SESSION_COOKIE_SECURE = True
  ✓ Line 67: CORS origins (add Vercel URL)

frontend/js/app.js:
  ✓ Line 13: API_URL (add Render URL)
```

---

## 📝 DEPLOYMENT CHECKLIST

### Before Deploying:

- [ ] CSV file committed to Git
- [ ] `requirements.txt` includes all dependencies
- [ ] `.env` file created (but NOT in Git)
- [ ] Session config updated for cross-origin
- [ ] CORS origins list complete
- [ ] Tested locally (both servers running)

### Backend Deployment (Render):

- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `gunicorn app:app`
- [ ] Environment variable `APP_SECRET_KEY` added
- [ ] Logs show "🌱 EcoPackAI Backend Starting"

### Frontend Deployment (Vercel):

- [ ] API_URL updated with Render backend URL
- [ ] Deployed to production (`vercel --prod`)
- [ ] Domain copied (e.g., ecopackai-web.vercel.app)

### Post-Deployment:

- [ ] Backend CORS updated with Vercel domain
- [ ] Backend redeployed
- [ ] Tested: Generate recommendations
- [ ] Tested: Materials database loads
- [ ] Tested: PDF downloads
- [ ] Tested: Rate limit (5 recommendations)
- [ ] Browser console shows no errors

---

## 🆘 NEED HELP?

### Check These First:

1. **Browser Console (F12)** - Look for red errors
2. **Render Logs** - Click "Logs" in dashboard
3. **Network Tab** - Check API requests/responses
4. **Cookies** - Verify session cookie exists

### Common Solutions:

- **CORS Error?** → Update origins in backend/app.py
- **PDF 400 Error?** → Check SESSION_COOKIE_SAMESITE = "None"
- **Materials Not Loading?** → Verify CSV in Git
- **Rate Limit Not Working?** → Clear browser cookies

### Test Production Backend Directly:

```bash
# Health check
curl https://ai-powered-sustainable-packaging-jrsk.onrender.com/api/health

# Materials
curl https://ai-powered-sustainable-packaging-jrsk.onrender.com/api/materials?page=1&per_page=5

# Session status
curl https://ai-powered-sustainable-packaging-jrsk.onrender.com/api/auth/status
```

---

## 📞 SUPPORT

If issues persist:
1. Check all URLs match (no typos)
2. Verify environment variables on Render
3. Clear browser cache and cookies
4. Try incognito/private window
5. Check Render service is "Live" (green dot)

---

**Your EcoPackAI is ready for production! 🌱**

**Local:** http://localhost:5500
**Production:** https://ecopackai-web.vercel.app

---

**Made with 🌱 by EcoPackAI Team**