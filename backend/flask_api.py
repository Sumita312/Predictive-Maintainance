"""
flask_api.py — Unified prediction API for Motor (AI4I) + Pump + Compressor + Turbine + Auth
"""

import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import db, cursor, reconnect, get_connection
import json

app = Flask(__name__)
CORS(app)

print("Loading motor model artefacts...")
try:
    motor_model    = joblib.load("model.pkl")
    motor_scaler   = joblib.load("scaler.pkl")
    motor_le       = joblib.load("label_encoder.pkl")
    motor_features = joblib.load("feature_names.pkl")
    print("  ✅ Motor model loaded")
except Exception as e:
    print(f"  ❌ Motor model load failed: {e}")
    motor_model = None

print("Loading pump model artefacts...")
try:
    pump_model    = joblib.load("pump_model.pkl")
    pump_scaler   = joblib.load("pump_scaler.pkl")
    pump_features = joblib.load("pump_feature_names.pkl")
    print("  ✅ Pump model loaded")
except Exception as e:
    print(f"  ❌ Pump model load failed: {e}")
    pump_model = None

print("Loading compressor model...")
try:
    compressor_model    = joblib.load("compressor_model.pkl")
    compressor_scaler   = joblib.load("compressor_scaler.pkl")
    compressor_features = joblib.load("compressor_feature_names.pkl")
    print("  ✅ Compressor model loaded")
except Exception as e:
    print("  ❌ Compressor model failed:", e)
    compressor_model = None

print("Loading turbine model...")
turbine_model = None
turbine_scaler = None
turbine_features = None
try:
    turbine_model    = joblib.load("turbine_model.pkl")
    turbine_scaler   = joblib.load("turbine_scaler.pkl")
    turbine_features = joblib.load("turbine_features.pkl")
    print("  ✅ Turbine model loaded")
except Exception as e:
    print(f"  ❌ Turbine model load failed: {e}")

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    if not data.get('email', '').endswith('@iocl.co.in'):
        return jsonify({'success': False, 'error': 'Only @iocl.co.in emails allowed'}), 400
    try:
        cursor.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Already registered'}), 400
        cursor.execute("""
            INSERT INTO users (name, emp_id, dept, email, password)
            VALUES (%s, %s, %s, %s, %s)
        """, (data['name'], data['empId'], data['dept'], data['email'], data['password']))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data.get('email', '').endswith('@iocl.co.in'):
        return jsonify({'success': False, 'error': 'Only @iocl.co.in emails allowed'}), 401
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s",
            (data['email'], data['password']))
        user = cursor.fetchone()
        if not user:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        cursor.execute("UPDATE users SET last_login = NOW() WHERE email = %s", (data['email'],))
        db.commit()
        return jsonify({'success': True, 'name': user[1], 'empId': user[2], 'dept': user[3], 'email': user[4]})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "motor_model_loaded": motor_model is not None,
        "pump_model_loaded": pump_model is not None,
        "compressor_model_loaded": compressor_model is not None,
        "turbine_model_loaded": turbine_model is not None,
    })

@app.route("/predict/motor", methods=["POST"])
def predict_motor():
    if motor_model is None:
        return jsonify({"error": "Motor model not loaded. Check model.pkl"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body received"}), 400

    required = ["product_type", "air_temp_k", "proc_temp_k", "rpm", "torque_nm", "tool_wear_min"]
    missing  = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        product_type  = str(data["product_type"]).upper()
        air_temp_k    = float(data["air_temp_k"])
        proc_temp_k   = float(data["proc_temp_k"])
        rpm           = float(data["rpm"])
        torque_nm     = float(data["torque_nm"])
        tool_wear_min = float(data["tool_wear_min"])

        type_encoded  = int(motor_le.transform([product_type])[0])
        temp_diff     = proc_temp_k - air_temp_k
        power_w       = torque_nm * rpm * (2 * np.pi / 60)
        torque_x_wear = torque_nm * tool_wear_min
        speed_x_temp  = rpm * proc_temp_k
        wear_stage    = int(pd.cut(
            [tool_wear_min],
            bins=[0, 100, 200, 300, np.inf],
            labels=[0, 1, 2, 3],
            include_lowest=True
        )[0])

        row = pd.DataFrame([[
            type_encoded, air_temp_k, proc_temp_k, rpm,
            torque_nm, tool_wear_min,
            temp_diff, power_w, torque_x_wear, speed_x_temp, wear_stage
        ]], columns=motor_features)

        row_sc = motor_scaler.transform(row)
        prob   = float(motor_model.predict_proba(row_sc)[0, 1])
        label  = int(motor_model.predict(row_sc)[0])

        status     = "FAULTY" if label == 1 else "HEALTHY"
        risk_level = "High" if prob > 0.7 else "Medium" if prob > 0.3 else "Low"
        confidence = round(prob * 100 if label == 1 else (1 - prob) * 100, 1)

        fault_type = "No Failure"
        if label == 1:
            if tool_wear_min > 200:
                fault_type = "Tool Wear Failure"
            elif torque_nm > 60:
                fault_type = "Overstrain Failure"
            elif temp_diff > 12:
                fault_type = "Heat Dissipation Failure"
            else:
                fault_type = "Machine Failure"

        recommendation = "Machine operating normally. Continue regular monitoring." if status == "HEALTHY" else {
            "High":   "⚠️ IMMEDIATE ACTION REQUIRED. Stop machine and inspect.",
            "Medium": "Schedule maintenance within 48 hours. Monitor closely.",
            "Low":    "Minor anomaly detected. Inspect at next scheduled downtime.",
        }.get(risk_level, "Inspect machine.")

        cursor.execute("""
INSERT INTO motor_predictions
(product_type, air_temp_k, proc_temp_k, rpm, torque_nm, tool_wear_min,
`prediction`, status, confidence, fault_type, risk_level, input_data, user_email)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", (
    data.get('product_type'), data.get('air_temp_k'), data.get('proc_temp_k'),
    data.get('rpm'), data.get('torque_nm'), data.get('tool_wear_min'),
    status, status, confidence, fault_type, risk_level, json.dumps(data), data.get('user_email')
))
        db.commit()

        return jsonify({
            "status": status,
            "confidence": confidence,
            "fault_type": fault_type,
            "risk_level": risk_level,
            "failure_probability": round(prob, 4),
            "health_score": round((1 - prob) * 100, 1),
            "recommendation": recommendation,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

PUMP_SENSOR_DEFAULTS: dict = {}

def _build_pump_defaults():
    return {feat: 0.0 for feat in pump_features}

if pump_model is not None:
    PUMP_SENSOR_DEFAULTS = _build_pump_defaults()

@app.route("/predict/pump", methods=["POST"])
def predict_pump():
    if pump_model is None:
        return jsonify({"error": "Pump model not loaded. Check pump_model.pkl"}), 500

    data = request.get_json() or {}

    try:
        row_dict = PUMP_SENSOR_DEFAULTS.copy()
        for feat in pump_features:
            if feat in data:
                row_dict[feat] = float(data[feat])

        row    = pd.DataFrame([row_dict])[pump_features]
        row_sc = pump_scaler.transform(row)

        prob_arr      = pump_model.predict_proba(row_sc)[0]
        label         = int(pump_model.predict(row_sc)[0])
        prob_abnormal = float(prob_arr[1])
        confidence    = round(prob_abnormal * 100 if label == 1 else (1 - prob_abnormal) * 100, 1)

        if label == 0:
            status         = "NORMAL"
            risk_level     = "Low"
            recommendation = "Pump operating normally. No action required."
        else:
            risk_level     = "High" if prob_abnormal > 0.75 else "Medium"
            status         = "BROKEN" if prob_abnormal > 0.75 else "RECOVERING"
            recommendation = (
                "⚠️ PUMP FAILURE DETECTED. Stop pump immediately and inspect."
                if status == "BROKEN"
                else "Pump in recovery/degraded state. Schedule inspection soon."
            )

        cursor.execute("""
INSERT INTO pump_predictions
(sensor_00, sensor_02, sensor_03, sensor_04, sensor_05, sensor_06,
sensor_07, sensor_08, sensor_09, sensor_10, sensor_11, sensor_12,
`prediction`, status, confidence, risk_level, input_data, user_email)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", (
    data.get('sensor_00'), data.get('sensor_02'), data.get('sensor_03'),
    data.get('sensor_04'), data.get('sensor_05'), data.get('sensor_06'),
    data.get('sensor_07'), data.get('sensor_08'), data.get('sensor_09'),
    data.get('sensor_10'), data.get('sensor_11'), data.get('sensor_12'),
    status, status, confidence, risk_level, json.dumps(data), data.get('user_email')
))
        db.commit()

        return jsonify({
            "status": status,
            "confidence": confidence,
            "risk_level": risk_level,
            "failure_probability": round(prob_abnormal, 4),
            "recommendation": recommendation,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict/compressor", methods=["POST"])
def predict_compressor():
    if compressor_model is None:
        return jsonify({"error": "Compressor model not loaded"}), 500

    data = request.get_json() or {}

    try:
        row = pd.DataFrame([data])
        for col in row.columns:
            row[col] = pd.to_numeric(row[col], errors="coerce").fillna(0)

        engineered    = row.copy()
        original_cols = list(row.columns)
        for col in original_cols:
            engineered[f"{col}_mean"] = row[col]
            engineered[f"{col}_std"]  = 0
            engineered[f"{col}_max"]  = row[col]

        for feature in compressor_features:
            if feature not in engineered.columns:
                engineered[feature] = 0

        engineered = engineered[compressor_features]
        row_sc     = compressor_scaler.transform(engineered)
        prob       = float(compressor_model.predict_proba(row_sc)[0][1])
        label      = int(compressor_model.predict(row_sc)[0])

        if label == 0:
            status         = "NORMAL"
            risk           = "Low"
            recommendation = "Compressor operating normally."
            confidence     = round((1 - prob) * 100, 2)
        else:
            confidence = round(prob * 100, 2)
            if prob > 0.8:
                status         = "FAULT"
                risk           = "High"
                recommendation = "⚠️ Immediate compressor inspection required."
            else:
                status         = "DEGRADED"
                risk           = "Medium"
                recommendation = "Performance degradation detected. Schedule maintenance."

        cursor.execute("""
INSERT INTO compressor_predictions
(rpm, motor_power, torque, outlet_pressure_bar, air_flow, noise_db,
outlet_temp, gaccx, gaccy, gaccz, haccx, haccy, haccz, bearings,
`prediction`, status, confidence, risk_level, input_data, user_email)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", (
    data.get('rpm'), data.get('motor_power'), data.get('torque'),
    data.get('outlet_pressure_bar'), data.get('air_flow'), data.get('noise_db'),
    data.get('outlet_temp'), data.get('gaccx'), data.get('gaccy'),
    data.get('gaccz'), data.get('haccx'), data.get('haccy'),
    data.get('haccz'), data.get('bearings'),
    status, status, confidence, risk, json.dumps(data), data.get('user_email')
))
        db.commit()

        return jsonify({
            "status": status,
            "confidence": confidence,
            "risk_level": risk,
            "failure_probability": round(prob, 4),
            "recommendation": recommendation
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict/turbine", methods=["POST"])
def predict_turbine():
    if turbine_model is None:
        return jsonify({"error": "Turbine model not loaded"}), 500

    data = request.get_json() or {}

    try:
        row = pd.DataFrame([data])
        if turbine_features is not None:
            for col in turbine_features:
                if col not in row.columns:
                    row[col] = 0
            row = row[turbine_features]

        row_sc = turbine_scaler.transform(row)
        prob   = turbine_model.predict_proba(row_sc)[0][1]
        label  = int(turbine_model.predict(row_sc)[0])

        status = "FAULT" if label == 1 else "NORMAL"
        risk   = "High" if prob > 0.7 else "Medium" if prob > 0.3 else "Low"

        cursor.execute("""
INSERT INTO turbine_predictions
(rpm, temperature, pressure, vibration, power_output,
`prediction`, status, confidence, risk_level, input_data, user_email)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", (
    data.get('rpm'), data.get('temperature'), data.get('pressure'),
    data.get('vibration'), data.get('power_output'),
    status, status, round(prob * 100, 2), risk, json.dumps(data), data.get('user_email')
))
        db.commit()

        return jsonify({
            "status": status,
            "confidence": round(prob * 100, 2),
            "risk_level": risk,
            "failure_probability": round(prob, 4),
            "recommendation": (
                "⚠️ Immediate turbine shutdown required"
                if label == 1 else
                "Turbine operating normally"
            )
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/motor-history")
def motor_history():
    try:
        email = request.args.get('email', '')
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, prediction, confidence, risk_level, created_at FROM motor_predictions WHERE user_email = %s ORDER BY created_at DESC", (email,))
        rows = cur.fetchall()
        conn.close()
        return jsonify([{"id": r[0], "prediction": r[1], "confidence": r[2], "risk_level": r[3], "created_at": str(r[4])} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/pump-history")
def pump_history():
    try:
        email = request.args.get('email', '')
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, prediction, confidence, risk_level, created_at FROM pump_predictions WHERE user_email = %s ORDER BY created_at DESC", (email,))
        rows = cur.fetchall()
        conn.close()
        return jsonify([{"id": r[0], "prediction": r[1], "confidence": r[2], "risk_level": r[3], "created_at": str(r[4])} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/compressor-history")
def compressor_history():
    try:
        email = request.args.get('email', '')
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, prediction, confidence, risk_level, created_at FROM compressor_predictions WHERE user_email = %s ORDER BY created_at DESC", (email,))
        rows = cur.fetchall()
        conn.close()
        return jsonify([{"id": r[0], "prediction": r[1], "confidence": r[2], "risk_level": r[3], "created_at": str(r[4])} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/turbine-history")
def turbine_history():
    try:
        email = request.args.get('email', '')
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, prediction, confidence, risk_level, created_at FROM turbine_predictions WHERE user_email = %s ORDER BY created_at DESC", (email,))
        rows = cur.fetchall()
        conn.close()
        return jsonify([{"id": r[0], "prediction": r[1], "confidence": r[2], "risk_level": r[3], "created_at": str(r[4])} for r in rows])
    except Exception as e:
        return jsonify([])

if __name__ == "__main__":
    PORT = 5050
    print("\n" + "="*55)
    print("  Fault Detection API — Motor + Pump + Compressor + Turbine")
    print(f"  Base URL: http://127.0.0.1:{PORT}")
    print(f"  Motor endpoint      : POST http://127.0.0.1:{PORT}/predict/motor")
    print(f"  Pump endpoint       : POST http://127.0.0.1:{PORT}/predict/pump")
    print(f"  Compressor endpoint : POST http://127.0.0.1:{PORT}/predict/compressor")
    print(f"  Turbine endpoint    : POST http://127.0.0.1:{PORT}/predict/turbine")
    print(f"  Auth register       : POST http://127.0.0.1:{PORT}/auth/register")
    print(f"  Auth login          : POST http://127.0.0.1:{PORT}/auth/login")
    print(f"  Health check        : GET  http://127.0.0.1:{PORT}/health")
    print("="*55 + "\n")
    app.run(host="0.0.0.0", port=PORT, debug=True)