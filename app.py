from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import joblib
import os
import json
import pandas as pd
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime

# -----------------------------
# 1️⃣ Initialize App & Load Model
# -----------------------------
app = Flask(__name__)
CORS(app, supports_credentials=True)

# Load trained model
model = joblib.load("model.pkl")

# Load metadata with feature ordering and validation info
try:
    with open("model_metadata.json") as f:
        metadata = json.load(f)
    FEATURE_ORDER = metadata.get("feature_order")
    RISK_THRESHOLD = float(os.getenv("RISK_THRESHOLD", str(metadata.get("risk_threshold", 0.5))))
    FEATURE_INFO = metadata.get("feature_info", {})
    print(f"Model metadata loaded successfully")
    print(f"  Feature order: {FEATURE_ORDER}")
    print(f"  Risk threshold: {RISK_THRESHOLD}")
except FileNotFoundError:
    FEATURE_ORDER = [
        "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach",
        "exang", "oldpeak", "slope", "ca", "thal"
    ]
    RISK_THRESHOLD = float(os.getenv("RISK_THRESHOLD", "0.5"))
    FEATURE_INFO = {}
    print(f"Warning: metadata.json not found. Using default feature order.")

# -----------------------------
# 2️⃣ Input Validation Function
# -----------------------------

def _as_number(val):
    # attempt to coerce to float/int; return None on failure
    try:
        return float(val)
    except Exception:
        return None


def validate_input(data):
    # required numeric ranges (matching training data)
    age = _as_number(data.get("age"))
    if age is None or not (20 <= age <= 100):
        return "Invalid or missing Age"

    trestbps = _as_number(data.get("trestbps"))
    if trestbps is None or not (80 <= trestbps <= 250):
        return "Invalid or missing Resting Blood Pressure"

    chol = _as_number(data.get("chol"))
    if chol is None or not (100 <= chol <= 600):
        return "Invalid or missing Cholesterol"

    thalach = _as_number(data.get("thalach"))
    if thalach is None or not (60 <= thalach <= 220):
        return "Invalid or missing Maximum Heart Rate"

    oldpeak = _as_number(data.get("oldpeak"))
    if oldpeak is None or not (0 <= oldpeak <= 6):
        return "Invalid or missing ST Depression (Oldpeak)"

    # categorical/ordinal values
    if data.get("ca") not in [0, 1, 2, 3]:
        return "Number of Major Vessels (ca) must be 0–3"
    if data.get("cp") not in [0, 1, 2, 3]:
        return "Invalid Chest Pain Type (cp)"
    if data.get("thal") not in [1, 2, 3]:
        return "Invalid Thalassemia (thal)"
    if data.get("restecg") not in [0, 1, 2]:
        return "Invalid Resting ECG (restecg)"
    if data.get("slope") not in [0, 1, 2]:
        return "Invalid ST segment slope (slope)"

    # sex, fbs, exang are binary so basic check
    for key in ["sex", "fbs", "exang"]:
        if data.get(key) not in [0, 1]:
            return f"Invalid or missing {key}"

    return "Valid"

# -----------------------------
# 3️⃣ Prediction Route
# -----------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        app.logger.debug(f"Incoming prediction request: {data}")

        # Validate Inputs
        validation = validate_input(data)
        if validation != "Valid":
            app.logger.warning(f"Validation failed: {validation} -- data: {data}")
            return jsonify({"error": validation}), 400

        if (
            data.get("restecg") == 2
            and data.get("slope") == 1
            and (
                data.get("trestbps", 0) >= 170
                or data.get("chol", 0) >= 300
                or data.get("exang") == 1
                or data.get("age", 0) >= 65
            )
        ):
            # short-circuit with a very high risk prediction
            return jsonify({
                "prediction": "High Cardiovascular Risk",
                "risk_percentage": 99.0,
                "note": "clinical rule override"
            })

       
        features = []
        for feat_name in FEATURE_ORDER:
            if feat_name not in data:
                raise KeyError(f"Missing required feature: {feat_name}")
            val = data[feat_name]
           
            try:
                val = float(val)
            except (ValueError, TypeError):
                pass  
            features.append(val)
        
        features = np.array([features])
        app.logger.debug(f"Feature vector: {features}")

        # Predict probability
        prob = model.predict_proba(features)[0][1]

        if prob >= RISK_THRESHOLD:
            prediction = "High Cardiovascular Risk"
        else:
            prediction = "Low Cardiovascular Risk"

        return jsonify({
            "prediction": prediction,
            "risk_percentage": round(prob*100, 2),
            "threshold_used": RISK_THRESHOLD
        })

    except KeyError as ke:
        app.logger.error(f"Missing field in input: {ke}")
        return jsonify({"error": f"Missing field {ke}"}), 400
    except Exception as e:
        app.logger.exception("Error during prediction")
        return jsonify({"error": str(e)}), 500

# -----------------------------
# 4️⃣ CSV Batch Prediction Route
# -----------------------------
@app.route("/predict-csv", methods=["POST"])
def predict_csv():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({"error": "File must be CSV format"}), 400
        
        # Read CSV file
        df = pd.read_csv(file)
        app.logger.info(f"Loaded CSV with {len(df)} rows and columns: {df.columns.tolist()}")
        
        # Validate and predict for each row
        predictions_list = []
        
        for idx, row in df.iterrows():
            # Convert row to dict
            row_data = row.to_dict()
            
            # Validate
            validation = validate_input(row_data)
            if validation != "Valid":
                predictions_list.append({
                    "row_index": idx + 1,
                    "error": validation,
                    "prediction": None,
                    "risk_percentage": None
                })
                continue
            
            # Check clinical override
            if (
                row_data.get("restecg") == 2
                and row_data.get("slope") == 1
                and (
                    row_data.get("trestbps", 0) >= 170
                    or row_data.get("chol", 0) >= 300
                    or row_data.get("exang") == 1
                    or row_data.get("age", 0) >= 65
                )
            ):
                predictions_list.append({
                    "row_index": idx + 1,
                    "input_data": row_data,
                    "prediction": "High Cardiovascular Risk",
                    "risk_percentage": 99.0,
                    "note": "clinical rule override"
                })
                continue
            
            # Build feature vector
            features = []
            for feat_name in FEATURE_ORDER:
                if feat_name not in row_data:
                    raise KeyError(f"Missing required feature: {feat_name}")
                val = row_data[feat_name]
                try:
                    val = float(val)
                except (ValueError, TypeError):
                    pass
                features.append(val)
            
            features = np.array([features])
            prob = model.predict_proba(features)[0][1]
            
            if prob >= RISK_THRESHOLD:
                prediction = "High Cardiovascular Risk"
            else:
                prediction = "Low Cardiovascular Risk"
            
            predictions_list.append({
                "row_index": idx + 1,
                "input_data": row_data,
                "prediction": prediction,
                "risk_percentage": round(prob*100, 2)
            })
        
        return jsonify({
            "total_rows": len(df),
            "predictions": predictions_list
        })
    
    except Exception as e:
        app.logger.exception("Error during CSV prediction")
        return jsonify({"error": str(e)}), 500


# -----------------------------
# 5️⃣ Generate PDF Report Route
# -----------------------------
@app.route("/generate-report", methods=["POST"])
def generate_report():
    try:
        data = request.get_json()
        predictions = data.get("predictions", [])
        
        if not predictions:
            return jsonify({"error": "No predictions provided"}), 400
        
        # Create PDF in memory
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=10,
            fontName='Helvetica-Bold'
        )
        
        # Title
        elements.append(Paragraph("Cardiovascular Risk Assessment Report", title_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Report metadata
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        elements.append(Paragraph(f"<b>Report Generated:</b> {timestamp}", styles['Normal']))
        elements.append(Paragraph(f"<b>Total Predictions:</b> {len(predictions)}", styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Summary statistics
        high_risk_count = sum(1 for p in predictions if p.get("prediction") == "High Cardiovascular Risk")
        low_risk_count = sum(1 for p in predictions if p.get("prediction") == "Low Cardiovascular Risk")
        error_count = sum(1 for p in predictions if "error" in p)
        
        elements.append(Paragraph("Summary Statistics", heading_style))
        summary_data = [
            ["Category", "Count", "Percentage"],
            ["High Risk", str(high_risk_count), f"{(high_risk_count/len(predictions)*100):.1f}%"],
            ["Low Risk", str(low_risk_count), f"{(low_risk_count/len(predictions)*100):.1f}%"],
            ["Errors", str(error_count), f"{(error_count/len(predictions)*100):.1f}%"]
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Detailed predictions - split into chunks to avoid huge tables
        elements.append(Paragraph("Detailed Predictions", heading_style))
        
        # Create predictions table (show first 20 rows, then add page breaks)
        table_data = [["Row", "Age", "Sex", "Prediction", "Risk %"]]
        
        for pred in predictions:
            if "error" in pred:
                table_data.append([
                    str(pred.get("row_index", "?")),
                    "N/A",
                    "N/A",
                    "Error",
                    f"({pred['error'][:20]}...)"
                ])
            else:
                input_data = pred.get("input_data", {})
                age = input_data.get("age", "?")
                sex = "M" if input_data.get("sex") == 1 else "F" if input_data.get("sex") == 0 else "?"
                pred_text = "High Risk" if pred.get("prediction") == "High Cardiovascular Risk" else "Low Risk"
                risk_pct = pred.get("risk_percentage", "?")
                
                table_data.append([
                    str(pred.get("row_index", "?")),
                    str(age),
                    sex,
                    pred_text,
                    str(risk_pct) + "%"
                ])
        
        # Create table with predictions
        pred_table = Table(table_data, colWidths=[1*inch, 1*inch, 0.8*inch, 1.5*inch, 1.2*inch])
        pred_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        elements.append(pred_table)
        
        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        
        # Return PDF file
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"cardiovascular_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )
    
    except Exception as e:
        app.logger.exception("Error generating report")
        return jsonify({"error": str(e)}), 500


# -----------------------------
@app.route("/", methods=["GET"])
def home():
    return "Heart Disease Prediction API is running!"

# -----------------------------
# 5️⃣ Run App
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True, port=8000)