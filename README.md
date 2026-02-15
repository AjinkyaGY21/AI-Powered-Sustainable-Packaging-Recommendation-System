# 🌱 EcoPackAI
## AI-Powered Sustainable Packaging Recommendation System

---

## 🌐 Live Demo

Check out the deployed frontend here: [EcoPackAI Live App](http://ecopackai-web.vercel.app/)

---

## 📌 Overview

EcoPackAI is an **AI-based decision system** that recommends the **best packaging material** for shipments based on:

- 💰 **Cost**
- 🌍 **CO₂ Emissions**  
- 🌱 **Sustainability Score**

The system automatically predicts and ranks packaging materials — you don't choose manually.

### Key Features

✅ **MySQL Database** - Full data persistence and authentication  
✅ **Secure Authentication** - Email/password with bcrypt hashing  
✅ **Account Protection** - 3-attempt lockout system  
✅ **Recommendation History** - All queries saved to database  
✅ **PowerBI Dashboard** - Visual analytics and insights  
✅ **PDF Reports** - Downloadable recommendation reports  
✅ **ML Integration** - Auto-loads your models or uses intelligent mock data

---

## 🧠 How It Works

1. **Input** - Enter shipment details (weight, size, distance, fragility, etc.)
2. **Processing** - System tests your shipment against 15+ packaging materials
3. **Prediction** - ML models predict cost and CO₂ for each material
4. **Ranking** - Materials ranked by your chosen priority (Sustainability/CO₂/Cost)
5. **Output** - View top recommendations with detailed metrics

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

┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   HTML/CSS/JS    │◄────────►│   Flask Backend  │◄────────►│  MySQL Database  │
│   Frontend       │   HTTP   │   (Port 5000)    │   TCP    │  (Port 3306)     │
│  localhost:3000  │          │                  │          │                  │
└──────────────────┘          └─────────┬────────┘          └─────────┬────────┘
                                        │                             │
                    ┌───────────────────┼─────────────────┐           │
                    │                   │                 │           │
              ┌─────▼─────┐      ┌─────▼─────┐    ┌─────▼─────┐     │
              │  Session  │      │    ML     │    │  History  │     │
              │   Store   │      │  Models   │    │   Saver   │     │
              │ (Flask)   │      │   .pkl    │    │           │     │
              └───────────┘      └───────────┘    └───────────┘     │
                                                                     │
                                        ┌────────────────────────────┘
                                        │
                                 ┌──────▼──────┐
                                 │   PowerBI   │
                                 │  Dashboard  │
                                 │ (localhost) │
                                 └─────────────┘
```

---

## 🚀 Complete Setup Guide

### Prerequisites

- **Python 3.8+** installed
- **MySQL 8.0+** installed and running
- **PowerBI Desktop** (for dashboard)
- **Web browser** (Chrome, Firefox, Safari, Edge)
- **Terminal/Command Prompt**

---

### Step 1: MySQL Database Setup

**1.1 Install MySQL** (if not installed)

**1.2 Create Database and Tables**

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE IF NOT EXISTS ecopackdb;
USE ecopackdb;

# Run schema
source sql/schema.sql;

# Verify tables
SHOW TABLES;
# Should show: users, recommendation_history

# Check test user
SELECT * FROM users;
# Should show: test@ecopackai.com
```

**Manual Schema Creation** (if needed):

```sql
CREATE DATABASE IF NOT EXISTS ecopackdb;
USE ecopackdb;

-- Users table with authentication
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    password_hash VARCHAR(255),
    failed_attempts INT DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Recommendation history
CREATE TABLE recommendation_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Shipment details
    product_category VARCHAR(100),
    weight_kg FLOAT,
    fragility INT,
    shipping_mode VARCHAR(50),
    distance_km FLOAT,
    moisture_sensitive BOOLEAN,
    length_cm FLOAT,
    width_cm FLOAT,
    height_cm FLOAT,
    
    -- Request parameters
    k_value INT,
    sort_by VARCHAR(50),
    
    -- Results (JSON format)
    recommendations JSON,
    
    FOREIGN KEY (email) REFERENCES users(email)
);

-- Insert test user
INSERT INTO users (email, password_hash, failed_attempts, is_locked)
VALUES ('test@ecopackai.com', NULL, 0, FALSE);
```

---

### Step 2: Backend Setup

**2.1 Create Virtual Environment**

```bash
cd backend

# Create venv
python -m venv venv

# Activate
source venv/bin/activate       # Mac/Linux
venv\Scripts\activate          # Windows
```

**2.2 Install Dependencies**

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This installs:
- Flask (web framework)
- Flask-CORS (cross-origin requests)
- Flask-Limiter (rate limiting)
- PyMySQL (MySQL connector)
- bcrypt (password hashing)
- Pandas, NumPy (data processing)
- Scikit-learn, XGBoost (ML models)
- ReportLab (PDF generation)
- python-dotenv (environment variables)

**2.3 Generate Secret Key**

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Example output:**
```
k3vX9pLmQ7rT2nB8jH4yF6wD1sA5zE0cU
```

Copy this key!

**2.4 Create .env File**

Create `.env` in the `backend/` directory:

```env
# Flask Secret Key (REQUIRED)
APP_SECRET_KEY=paste-your-generated-key-here

# MySQL Connection (REQUIRED)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=ecopackdb

# Optional - Only if you have ML models
DATASET_PATH=../data/processed/final_ecopack_dataset_fe.csv
ML_MODELS_PATH=../ml/models

# Environment
FLASK_ENV=development
```

**2.5 Test Database Connection**

```bash
python db.py
```

**Expected output:**
```
✅ Database connection successful!
```

**2.6 Start Backend**

```bash
python app.py
```

**Expected output:**
```
🌱 EcoPackAI Backend Starting...
✅ MySQL connected
✅ ML Models loaded: True
✅ Materials available: 15
📚 API Health: http://localhost:5000/api/health
 * Running on http://0.0.0.0:5000
```

**Leave this terminal running!**

---

### Step 3: Frontend Setup

**3.1 Start Frontend Server**

Open a **new terminal**:

```bash
cd frontend

# Mac/Linux
python3 -m http.server 3000

# Windows
python -m http.server 3000
```

**Alternative - VS Code Live Server:**
- Install "Live Server" extension
- Right-click `login.html` → "Open with Live Server"

---

### Step 4: PowerBI Dashboard Setup

**4.1 Install PowerBI Desktop**

Download from: https://powerbi.microsoft.com/desktop/

**4.2 Connect PowerBI to MySQL**

1. Open PowerBI Desktop
2. Click **Get Data** → **Database** → **MySQL database**
3. Enter connection details:
   - **Server:** localhost
   - **Database:** ecopackdb
4. Click **OK**
5. Select **Database** authentication
   - **User name:** root (or your MySQL user)
   - **Password:** your-mysql-password
6. Click **Connect**

**4.3 Import Tables**

Select these tables:
- ✅ `users`
- ✅ `recommendation_history`

Click **Load**

**4.4 Create Dashboard Visualizations**

**A. Recommendations Over Time (Line Chart)**
- **X-axis:** `created_at` (Date hierarchy)
- **Y-axis:** Count of `id`
- **Legend:** `sort_by` (Sustainability/CO₂/Cost)

**B. Top Product Categories (Bar Chart)**
- **Axis:** `product_category`
- **Values:** Count of `id`

**C. Average Metrics by Shipping Mode (Clustered Column)**
- **Axis:** `shipping_mode`
- **Values:** 
  - Average of `weight_kg`
  - Average of `distance_km`

**D. User Activity (Table)**
- **Columns:**
  - `email`
  - Count of recommendations
  - Latest `created_at`
  - Most used `sort_by`

**E. Fragility Distribution (Pie Chart)**
- **Legend:** `fragility` (1-5)
- **Values:** Count of `id`

**F. Key Metrics (Cards)**
- Total Recommendations: `COUNT(id)`
- Active Users: `DISTINCTCOUNT(email)`
- Avg Weight: `AVERAGE(weight_kg)`
- Avg Distance: `AVERAGE(distance_km)`

**4.5 Add Filters (Slicers)**

Add slicers for:
- Date Range (`created_at`)
- Product Category
- Shipping Mode
- Sort By (optimization goal)

**4.6 Save Dashboard**

File → Save As → `powerbi/EcoPackAI_Dashboard.pbix`

**4.7 Auto-Refresh Setup**

1. Go to **Transform Data** → **Data source settings**
2. Select MySQL connection → **Edit Permissions**
3. Set **Privacy Level** to "Organizational"
4. In the report, click **Refresh** to update data

---

## 🔐 Authentication Flow

### First-Time Login

1. Navigate to: `http://localhost:3000/login.html`
2. Enter email: `test@ecopackai.com`
3. Enter any password (e.g., `mypassword123`)
4. System **hashes and stores** the password in MySQL
5. Redirected to main app ✅

### Subsequent Logins

1. Enter email: `test@ecopackai.com`
2. Enter password: `mypassword123`
3. System verifies bcrypt hash
4. Logged in successfully ✅

### Account Lockout

After **3 failed login attempts**:
- 🔒 Account locked in database
- Login form disappears
- "ACCESS DENIED" message shown

**To unlock:**
```sql
UPDATE users 
SET is_locked = FALSE, failed_attempts = 0 
WHERE email = 'test@ecopackai.com';
```

---

## 🎯 Using the Application

### 1. Login

Open: `http://localhost:3000/login.html`

### 2. Generate Recommendations

1. Fill in shipment details:
   - Product Category
   - Weight (kg)
   - Dimensions (L×W×H cm)
   - Distance (km)
   - Fragility (1-5)
   - Shipping Mode (Road/Air/Sea/Rail)
   - Moisture Sensitive (Yes/No)

2. Choose optimization goal:
   - 🌱 **Sustainability** (recommended)
   - 🌍 **CO₂ Emissions**
   - 💰 **Cost**

3. Click **"Generate AI Recommendations"**

4. View results:
   - **Best Recommendation** (highlighted card)
   - **Top 5 Alternatives**
   - Detailed metrics for each option

### 3. Download PDF Report

Click **"Download PDF Report"** button to get a professional summary.

### 4. View History

Check MySQL database:
```sql
SELECT 
    email,
    product_category,
    weight_kg,
    sort_by,
    created_at
FROM recommendation_history
ORDER BY created_at DESC
LIMIT 10;
```

Or open PowerBI dashboard for visual analytics.

---

## 🧠 ML Models Integration

### Option 1: Without Your Models (Works Immediately!)

- Uses intelligent mock data
- 15 realistic packaging materials
- Accurate cost/CO₂ calculations
- Perfect for testing and demos

### Option 2: With Your Trained Models

**1. Place your models:**
```
ml/models/
├── cost_model.pkl       # Trained cost predictor
└── co2_model.pkl        # Trained CO₂ predictor
```

**2. Place your dataset:**
```
data/processed/
└── final_ecopack_dataset_fe.csv
```

**3. Update `.env`:**
```env
DATASET_PATH=../data/processed/final_ecopack_dataset_fe.csv
ML_MODELS_PATH=../ml/models
```

**4. Ensure your `recommendation_engine.py` exports:**
```python
# ml/notebooks/recommendation_engine.py
def generate_recommendations(shipment_data, k=5, sort_by='sustainability'):
    # Your implementation
    pass

# Required exports
materials_df = pd.DataFrame(...)  # Your materials data
co2_model = ...                    # Your CO₂ model
cost_model = ...                   # Your cost model
FEATURES_COST = [...]              # Feature list for cost
FEATURES_CO2 = [...]               # Feature list for CO₂
```

**5. Restart backend:**
```bash
python app.py
```

---

## 📊 PowerBI Dashboard Features

### Live Data Connection
- Real-time sync with MySQL
- Auto-refresh capabilities
- No data export needed

### Key Visualizations

1. **Recommendation Trends**
   - Time-series analysis
   - Peak usage periods
   - Growth patterns

2. **Product Analysis**
   - Most packaged categories
   - Average weights by category
   - Fragility patterns

3. **Shipping Insights**
   - Mode preferences (Road/Air/Sea/Rail)
   - Distance distributions
   - Cost vs. CO₂ trade-offs

4. **User Behavior**
   - Active users tracking
   - Optimization goal preferences
   - Usage frequency

5. **Environmental Impact**
   - Total CO₂ saved
   - Sustainability score trends
   - Material preferences

### Interactive Filters

- **Date Range** - Focus on specific periods
- **Product Category** - Filter by product type
- **Shipping Mode** - Analyze by transport method
- **Sort By** - View by optimization goal

---

## 🌐 Deployment

### Backend → Render.com (or similar)

1. Push code to GitHub
2. Create new Web Service on Render
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn backend.app:app`
5. Add environment variables:
   - `APP_SECRET_KEY`
   - `DB_HOST` (cloud MySQL host)
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`

### Frontend → Netlify/Vercel

1. Update `frontend/js/app.js` line 6:
```javascript
const API_URL = 'https://your-backend.onrender.com';
```

2. Update `backend/app.py` CORS settings:
```python
CORS(app, origins=[
    'http://localhost:3000',
    'https://your-frontend.netlify.app'
])
```

3. Deploy frontend folder

### MySQL → Cloud Database

Use **PlanetScale**, **AWS RDS**, or **DigitalOcean**:
- Export schema: `mysqldump -u root -p ecopackdb > backup.sql`
- Import to cloud database
- Update `.env` with cloud credentials

### PowerBI → PowerBI Service

1. Publish from Desktop: **File** → **Publish** → **Publish to PowerBI**
2. Set up **Gateway** for cloud MySQL connection
3. Configure **scheduled refresh**
4. Share dashboard with team

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "MySQL connection failed"**
```bash
# Check MySQL is running
mysql -u root -p

# Test connection
python db.py

# Verify credentials in .env
```

**Error: "Module not found"**
```bash
pip install -r requirements.txt
```

### Frontend Issues

**CORS Error**

Update `backend/app.py`:
```python
CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:5500",  # VS Code Live Server
    "http://localhost:5500"    # Alternative port
])
```

**Can't Connect to Backend**
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Should return: {"status": "healthy"}
```

### Database Issues

**Tables Don't Exist**
```sql
USE ecopackdb;
SHOW TABLES;

-- If empty, run:
source sql/schema.sql;
```

**User Can't Login**
```sql
-- Check user exists
SELECT * FROM users WHERE email = 'test@ecopackai.com';

-- Unlock if locked
UPDATE users SET is_locked = FALSE, failed_attempts = 0 
WHERE email = 'test@ecopackai.com';
```

### PowerBI Issues

**Can't Connect to MySQL**
- Install MySQL ODBC driver
- Check MySQL is listening on 0.0.0.0:3306
- Verify firewall allows connection

**Data Not Refreshing**
- Click **Refresh** button in PowerBI
- Check Data Source Settings → Credentials
- Verify MySQL service is running

---

## 📝 API Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/login` | POST | No | Login (sets password on first use) |
| `/api/auth/logout` | POST | Yes | Logout and clear session |
| `/api/auth/status` | GET | Yes | Check authentication status |
| `/api/recommend` | POST | Yes | Generate recommendations |
| `/api/history` | GET | Yes | Get user recommendation history |
| `/api/generate-pdf` | POST | Yes | Download PDF report |
| `/api/health` | GET | No | Health check |

---

## 🔧 Configuration

### Session Timeout

Edit `backend/app.py` line 24:
```python
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=60)  # Change as needed
```

### Lockout Attempts

Edit `backend/auth.py` line 15:
```python
MAX_ATTEMPTS = 3  # Change to 5, 10, etc.
```

### Number of Recommendations

Edit frontend or pass as parameter:
```javascript
// frontend/js/app.js
k_value: 5  // Change to 3, 10, etc.
```

### Add New Users

```sql
INSERT INTO users (email, password_hash, failed_attempts, is_locked)
VALUES ('newuser@example.com', NULL, 0, FALSE);
```

---

## ✅ Features Checklist

- [x] MySQL database integration
- [x] Email/password authentication with bcrypt
- [x] 3-attempt account lockout
- [x] Session management (Flask sessions)
- [x] Recommendation history saved to database
- [x] PowerBI dashboard with live MySQL connection
- [x] Proper sorting by Sustainability/CO₂/Cost
- [x] PDF report generation
- [x] Logout functionality
- [x] CORS configuration for deployment
- [x] ML model integration (auto-detect)
- [x] Mock data fallback
- [x] Responsive UI design
- [x] Error handling and validation

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
python -m http.server 3000

# 4. Open Browser
# http://localhost:3000/login.html

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

**Quick Start:** Open `http://localhost:3000/login.html` after running backend and frontend servers.

**Questions?** Check the Troubleshooting section or review inline code comments.