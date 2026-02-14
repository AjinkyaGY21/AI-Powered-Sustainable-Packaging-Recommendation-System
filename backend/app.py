"""
EcoPackAI Backend - UPDATED VERSION
Flask + Session Limits + Working Logout
------------------------------------------------
NEW CONFIG:
- 5 recommendations per hour
- 2 hour session lifetime
- Working logout (even without login system)
"""

from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import datetime, timedelta
import secrets
import logging
import os
from dotenv import load_dotenv
from io import BytesIO
from pathlib import Path
import sys

# PDF imports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

# ==========================================================
# PATH FIX
# ==========================================================
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

# ==========================================================
# ML IMPORT
# ==========================================================
try:
    from ml.notebooks.recommendation_engine import (
        generate_recommendations,
        materials_df,
        co2_model,
        cost_model,
        FEATURES_COST,
        FEATURES_CO2
    )
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

# ==========================================================
# ENV + APP
# ==========================================================
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("APP_SECRET_KEY", secrets.token_urlsafe(32))

# 🔥 UPDATED SESSION CONFIG
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)  # 2 HOURS
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

CORS(app, 
     supports_credentials=True,
     origins=[
         "http://localhost:3000",
         "http://127.0.0.1:5500",
         "https://ai-powered-sustainable-packaging-recommendation-system.vercel.app",  # ← YOUR VERCEL URL
         "https://*.vercel.app"  # Allow all Vercel preview URLs
     ])

# 🔥 UPDATED RATE LIMIT
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "100 per hour"],
    storage_uri="memory://"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EcoPackAI")

# ==========================================================
# 🔥 SESSION CONFIG VALUES (EASY TO MODIFY)
# ==========================================================
MAX_RECOMMENDATIONS_PER_HOUR = 5
SESSION_DURATION_HOURS = 2

# ==========================================================
# 🔥 FIXED SESSION INIT - NOW ENSURES ALL KEYS EXIST
# ==========================================================
def init_session():
    """Initialize or repair session with all required keys"""
    now = datetime.now()
    
    # Check if session needs full initialization
    if "session_id" not in session:
        session.permanent = True
        session["session_id"] = secrets.token_urlsafe(16)
        session["recommendation_count"] = 0
        session["hour_window_start"] = now.isoformat()
        session["session_start"] = now.isoformat()
        logger.info(f"New session created: {session['session_id']}")
    else:
        # Session exists, but ensure all keys are present (defensive coding)
        if "recommendation_count" not in session:
            session["recommendation_count"] = 0
        if "hour_window_start" not in session:
            session["hour_window_start"] = now.isoformat()
        if "session_start" not in session:
            session["session_start"] = now.isoformat()

# ==========================================================
# 🔥 FIXED LIMIT CHECK - MORE DEFENSIVE
# ==========================================================
def check_recommendation_limit():
    """Check if user has exceeded recommendation limit"""
    init_session()

    now = datetime.now()

    # ===== 2 HOUR SESSION CHECK =====
    session_start_str = session.get("session_start")
    if session_start_str:
        session_start = datetime.fromisoformat(session_start_str)
        if now - session_start > timedelta(hours=SESSION_DURATION_HOURS):
            logger.info("Session expired (2 hours), clearing and reinitializing")
            session.clear()
            init_session()
            return True, None
    else:
        # Session start missing, reinitialize
        session["session_start"] = now.isoformat()

    # ===== HOURLY LIMIT CHECK =====
    hour_start_str = session.get("hour_window_start")
    if hour_start_str:
        hour_start = datetime.fromisoformat(hour_start_str)
        if now - hour_start > timedelta(hours=1):
            logger.info("Hour window expired, resetting recommendation count")
            session["hour_window_start"] = now.isoformat()
            session["recommendation_count"] = 0
    else:
        # Hour window start missing, initialize it
        session["hour_window_start"] = now.isoformat()
        session["recommendation_count"] = 0
        hour_start = now

    count = session.get("recommendation_count", 0)

    if count >= MAX_RECOMMENDATIONS_PER_HOUR:
        hour_start = datetime.fromisoformat(session["hour_window_start"])
        remaining = timedelta(hours=1) - (now - hour_start)
        minutes = max(1, int(remaining.total_seconds() / 60))
        return False, f"Limit reached: {MAX_RECOMMENDATIONS_PER_HOUR} per hour. Try again in {minutes} minutes."

    return True, None


def increment_recommendation_count():
    """Increment the recommendation counter"""
    session["recommendation_count"] = session.get("recommendation_count", 0) + 1
    logger.info(f"Recommendations used: {session['recommendation_count']}/{MAX_RECOMMENDATIONS_PER_HOUR}")


# ==========================================================
# AUTH STATUS (DUMMY USER)
# ==========================================================
@app.route("/api/auth/status", methods=["GET"])
def auth_status():
    """Return current session status"""
    init_session()
    
    count = session.get("recommendation_count", 0)
    remaining = max(0, MAX_RECOMMENDATIONS_PER_HOUR - count)
    
    return jsonify({
        "authenticated": True,
        "user_email": "ecopackai-user@gmail.com",
        "recommendations_used": count,
        "recommendations_remaining": remaining
    })


# ==========================================================
# 🔥 WORKING LOGOUT
# ==========================================================
@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Clear session and log out user"""
    session_id = session.get("session_id", "unknown")
    session.clear()
    logger.info(f"Session {session_id} logged out")
    return jsonify({
        "success": True,
        "message": "Logged out successfully"
    })


# ==========================================================
# RECOMMEND
# ==========================================================
@app.route("/api/recommend", methods=["POST"])
@limiter.limit("5 per hour")  # 🔥 UPDATED
def recommend():
    """Generate packaging recommendations"""

    # Check recommendation limit
    allowed, error = check_recommendation_limit()
    if not allowed:
        return jsonify({
            "error": error,
            "limit_reached": True
        }), 429

    data = request.get_json()

    # Validate required fields
    required = [
        "Category_item", "Weight_kg", "Fragility",
        "Moisture_Sens", "Distance_km", "Shipping_Mode",
        "Length_cm", "Width_cm", "Height_cm"
    ]

    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    # Build shipment object
    shipment = {
        "Category_item": data["Category_item"],
        "Weight_kg": float(data["Weight_kg"]),
        "Fragility": int(data["Fragility"]),
        "Moisture_Sens": bool(data["Moisture_Sens"]),
        "Distance_km": float(data["Distance_km"]),
        "Shipping_Mode": data["Shipping_Mode"],
        "Length_cm": float(data["Length_cm"]),
        "Width_cm": float(data["Width_cm"]),
        "Height_cm": float(data["Height_cm"]),
    }

    top_k = int(data.get("top_k", 5))
    sort_by = data.get("sort_by", "Sustainability")

    try:
        if ML_AVAILABLE:
            df = generate_recommendations(
                materials_df,
                co2_model,
                cost_model,
                shipment,
                FEATURES_COST,
                FEATURES_CO2,
                top_k,
                sort_by
            )
            recommendations = df.to_dict("records")
        else:
            logger.warning("ML models not available, returning empty recommendations")
            recommendations = []

        # Increment counter
        increment_recommendation_count()

        # Store in session for PDF generation
        session["last_recommendation"] = recommendations

        count = session.get("recommendation_count", 0)
        remaining = max(0, MAX_RECOMMENDATIONS_PER_HOUR - count)

        return jsonify({
            "status": "success",
            "recommendations": recommendations,
            "session_info": {
                "used": count,
                "remaining": remaining
            }
        })

    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ==========================================================
# PDF
# ==========================================================
@app.route("/api/generate-pdf", methods=["POST"])
def generate_pdf():
    """Generate PDF report from last recommendation"""
    data = session.get("last_recommendation")
    if not data:
        return jsonify({"error": "No recommendation available"}), 400

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []

    styles = getSampleStyleSheet()

    elements.append(Paragraph(
        "<b>EcoPackAI Intelligent Packaging Report</b>",
        styles["Title"]
    ))
    elements.append(Spacer(1, 30))

    table_data = [["#", "Material", "Cost ($)", "CO2 (kg)", "Sustainability"]]

    for i, r in enumerate(data, 1):
        table_data.append([
            str(i),
            r["Material_Name"],
            f"{r['Pred_Cost']:.2f}",
            f"{r['Pred_CO2']:.2f}",
            f"{r['Sustainability']:.4f}"
        ])

    table = Table(table_data, repeatRows=1)

    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10b981")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("ALIGN", (2, 1), (-1, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.whitesmoke, colors.lightgrey]),
    ]))

    elements.append(table)
    doc.build(elements)

    buffer.seek(0)

    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="EcoPackAI_Report.pdf"
    )


# ==========================================================
# HEALTH
# ==========================================================
@app.route("/api/health")
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "ml_available": ML_AVAILABLE,
        "session_duration_hours": SESSION_DURATION_HOURS,
        "max_recommendations_per_hour": MAX_RECOMMENDATIONS_PER_HOUR
    })


# ==========================================================
# RUN
# ==========================================================
if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("🌱 EcoPackAI Backend Starting")
    logger.info("=" * 60)
    logger.info(f"Session Duration: {SESSION_DURATION_HOURS} Hours")
    logger.info(f"Recommendation Limit: {MAX_RECOMMENDATIONS_PER_HOUR} per Hour")
    logger.info(f"ML Models Available: {ML_AVAILABLE}")
    logger.info("=" * 60)
    
    # For local development
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)