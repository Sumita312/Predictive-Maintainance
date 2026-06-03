"""
flask_api.py — Unified prediction API + Auto-simulator + Graph endpoints
"""

import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
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

# ─── START AUTO-SIMULATOR ─────────────────────────────────────────────────────
try:
    from simulator import start_simulator
    if all([motor_model, pump_model, compressor_model, turbine_model]):
        start_simulator(
            motor_model, motor_scaler, motor_le, motor_features,
            pump_model, pump_scaler, pump_features,
            compressor_model, compressor_scaler, compressor_features,
            turbine_model, turbine_scaler, turbine_features,
            interval_seconds=120
        )
        print("  ✅ Auto-simulator started (every 2 minutes)")
    else:
        print("  ⚠️ Some models missing — simulator not started")
except Exception as e:
    print(f"  ❌ Simulator start failed: {e}")

PUMP_SENSOR_DEFAULTS: dict = {}
def _build_pump_defaults():
    return {feat: 0.0 for feat in pump_features}
if pump_model is not None:
    PUMP_SENSOR_DEFAULTS = _build_pump_defaults()

# ─── AUTH ─────────────────────────────────────────────────────────────────────

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

# ─── HEALTH ───────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "motor_model_loaded":      motor_model is not None,
        "pump_model_loaded":       pump_model is not None,
        "compressor_model_loaded": compressor_model is not None,
        "turbine_model_loaded":    turbine_model is not None,
    })

# ─── MANUAL PREDICTIONS ───────────────────────────────────────────────────────

@app.route("/predict/motor", methods=["POST"])
def predict_motor():
    if motor_model is None:
        return jsonify({"error": "Motor model not loaded"}), 500
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body received"}), 400
    required = ["product_type","air_temp_k","proc_temp_k","rpm","torque_nm","tool_wear_min"]
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
        wear_stage    = int(pd.cut([tool_wear_min],
            bins=[0,100,200,300,np.inf], labels=[0,1,2,3], include_lowest=True)[0])
        row = pd.DataFrame([[type_encoded,air_temp_k,proc_temp_k,rpm,
            torque_nm,tool_wear_min,temp_diff,power_w,torque_x_wear,
            speed_x_temp,wear_stage]], columns=motor_features)
        row_sc = motor_scaler.transform(row)
        prob   = float(motor_model.predict_proba(row_sc)[0, 1])
        label  = int(motor_model.predict(row_sc)[0])
        status     = "FAULTY" if label == 1 else "HEALTHY"
        risk_level = "High" if prob > 0.7 else "Medium" if prob > 0.3 else "Low"
        confidence = round(prob * 100 if label == 1 else (1 - prob) * 100, 1)
        fault_type = "No Failure"
        if label == 1:
            if tool_wear_min > 200:       fault_type = "Tool Wear Failure"
            elif torque_nm > 60:          fault_type = "Overstrain Failure"
            elif temp_diff > 12:          fault_type = "Heat Dissipation Failure"
            else:                         fault_type = "Machine Failure"
        recommendation = "Machine operating normally. Continue regular monitoring." if status == "HEALTHY" else {
            "High":   "⚠️ IMMEDIATE ACTION REQUIRED. Stop machine and inspect.",
            "Medium": "Schedule maintenance within 48 hours. Monitor closely.",
            "Low":    "Minor anomaly detected. Inspect at next scheduled downtime.",
        }.get(risk_level, "Inspect machine.")
        cursor.execute("""
            INSERT INTO motor_predictions
            (product_type,air_temp_k,proc_temp_k,rpm,torque_nm,tool_wear_min,
            `prediction`,status,confidence,fault_type,risk_level,input_data,user_email)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (data.get('product_type'),data.get('air_temp_k'),data.get('proc_temp_k'),
              data.get('rpm'),data.get('torque_nm'),data.get('tool_wear_min'),
              status,status,confidence,fault_type,risk_level,json.dumps(data),data.get('user_email')))
        db.commit()
        return jsonify({"status":status,"confidence":confidence,"fault_type":fault_type,
            "risk_level":risk_level,"failure_probability":round(prob,4),
            "health_score":round((1-prob)*100,1),"recommendation":recommendation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict/pump", methods=["POST"])
def predict_pump():
    if pump_model is None:
        return jsonify({"error": "Pump model not loaded"}), 500
    data = request.get_json() or {}
    try:
        row_dict = PUMP_SENSOR_DEFAULTS.copy()
        for feat in pump_features:
            if feat in data: row_dict[feat] = float(data[feat])
        row    = pd.DataFrame([row_dict])[pump_features]
        row_sc = pump_scaler.transform(row)
        prob_arr      = pump_model.predict_proba(row_sc)[0]
        label         = int(pump_model.predict(row_sc)[0])
        prob_abnormal = float(prob_arr[1])
        confidence    = round(prob_abnormal*100 if label==1 else (1-prob_abnormal)*100, 1)
        if label == 0:
            status,risk_level,recommendation = "NORMAL","Low","Pump operating normally."
        else:
            risk_level = "High" if prob_abnormal > 0.75 else "Medium"
            status     = "BROKEN" if prob_abnormal > 0.75 else "RECOVERING"
            recommendation = ("⚠️ PUMP FAILURE DETECTED. Stop pump immediately."
                if status == "BROKEN" else "Pump degraded. Schedule inspection.")
        cursor.execute("""
            INSERT INTO pump_predictions
            (sensor_00,sensor_02,sensor_03,sensor_04,sensor_05,sensor_06,
            sensor_07,sensor_08,sensor_09,sensor_10,sensor_11,sensor_12,
            `prediction`,status,confidence,risk_level,input_data,user_email)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (data.get('sensor_00'),data.get('sensor_02'),data.get('sensor_03'),
              data.get('sensor_04'),data.get('sensor_05'),data.get('sensor_06'),
              data.get('sensor_07'),data.get('sensor_08'),data.get('sensor_09'),
              data.get('sensor_10'),data.get('sensor_11'),data.get('sensor_12'),
              status,status,confidence,risk_level,json.dumps(data),data.get('user_email')))
        db.commit()
        return jsonify({"status":status,"confidence":confidence,"risk_level":risk_level,
            "failure_probability":round(prob_abnormal,4),"recommendation":recommendation})
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
        engineered = row.copy()
        for col in list(row.columns):
            engineered[f"{col}_mean"] = row[col]
            engineered[f"{col}_std"]  = 0
            engineered[f"{col}_max"]  = row[col]
        for feature in compressor_features:
            if feature not in engineered.columns: engineered[feature] = 0
        engineered = engineered[compressor_features]
        row_sc = compressor_scaler.transform(engineered)
        prob   = float(compressor_model.predict_proba(row_sc)[0][1])
        label  = int(compressor_model.predict(row_sc)[0])
        if label == 0:
            status,risk,recommendation = "NORMAL","Low","Compressor operating normally."
            confidence = round((1-prob)*100, 2)
        else:
            confidence = round(prob*100, 2)
            if prob > 0.8: status,risk,recommendation = "FAULT","High","⚠️ Immediate compressor inspection required."
            else:          status,risk,recommendation = "DEGRADED","Medium","Performance degradation detected."
        cursor.execute("""
            INSERT INTO compressor_predictions
            (rpm,motor_power,torque,outlet_pressure_bar,air_flow,noise_db,
            outlet_temp,gaccx,gaccy,gaccz,haccx,haccy,haccz,bearings,
            `prediction`,status,confidence,risk_level,input_data,user_email)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (data.get('rpm'),data.get('motor_power'),data.get('torque'),
              data.get('outlet_pressure_bar'),data.get('air_flow'),data.get('noise_db'),
              data.get('outlet_temp'),data.get('gaccx'),data.get('gaccy'),
              data.get('gaccz'),data.get('haccx'),data.get('haccy'),
              data.get('haccz'),data.get('bearings'),
              status,status,confidence,risk,json.dumps(data),data.get('user_email')))
        db.commit()
        return jsonify({"status":status,"confidence":confidence,"risk_level":risk,
            "failure_probability":round(prob,4),"recommendation":recommendation})
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
                if col not in row.columns: row[col] = 0
            row = row[turbine_features]
        row_sc = turbine_scaler.transform(row)
        prob   = turbine_model.predict_proba(row_sc)[0][1]
        label  = int(turbine_model.predict(row_sc)[0])
        status = "FAULT" if label == 1 else "NORMAL"
        risk   = "High" if prob > 0.7 else "Medium" if prob > 0.3 else "Low"
        cursor.execute("""
            INSERT INTO turbine_predictions
            (rpm,temperature,pressure,vibration,power_output,
            `prediction`,status,confidence,risk_level,input_data,user_email)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (data.get('rpm'),data.get('temperature'),data.get('pressure'),
              data.get('vibration'),data.get('power_output'),
              status,status,round(prob*100,2),risk,json.dumps(data),data.get('user_email')))
        db.commit()
        return jsonify({"status":status,"confidence":round(prob*100,2),"risk_level":risk,
            "failure_probability":round(prob,4),
            "recommendation":"⚠️ Immediate turbine shutdown required" if label==1 else "Turbine operating normally"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─── HISTORY ENDPOINTS ────────────────────────────────────────────────────────

@app.route("/motor-history")
def motor_history():
    try:
        email = request.args.get('email', '')
        conn = get_connection(); cur = conn.cursor()
        if email:
            cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,
                torque_nm,tool_wear_min,rpm FROM motor_predictions
                WHERE user_email=%s ORDER BY created_at DESC LIMIT 500""", (email,))
        else:
            cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,
                torque_nm,tool_wear_min,rpm FROM motor_predictions
                ORDER BY created_at DESC LIMIT 500""")
        rows = cur.fetchall(); conn.close()
        return jsonify([{"id":r[0],"prediction":r[1],"confidence":r[2],"risk_level":r[3],
            "created_at":str(r[4]),"torque":r[5],"tool_wear":r[6],"rpm":r[7]} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/pump-history")
def pump_history():
    try:
        email = request.args.get('email', '')
        conn = get_connection(); cur = conn.cursor()
        if email:
            cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,
                sensor_00,sensor_02,sensor_05,sensor_07 FROM pump_predictions
                WHERE user_email=%s ORDER BY created_at DESC LIMIT 500""", (email,))
        else:
            cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,
                sensor_00,sensor_02,sensor_05,sensor_07 FROM pump_predictions
                ORDER BY created_at DESC LIMIT 500""")
        rows = cur.fetchall(); conn.close()
        return jsonify([{"id":r[0],"prediction":r[1],"confidence":r[2],"risk_level":r[3],
            "created_at":str(r[4]),"sensor00":r[5],"sensor02":r[6],"sensor05":r[7],"sensor07":r[8]} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/compressor-history")
def compressor_history():
    try:
        email = request.args.get('email', '')
        conn = get_connection(); cur = conn.cursor()
        if email:
            cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,
                rpm,motor_power,outlet_pressure_bar,air_flow,outlet_temp
                FROM compressor_predictions WHERE user_email=%s
                ORDER BY created_at DESC LIMIT 500""", (email,))
        else:
            cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,
                rpm,motor_power,outlet_pressure_bar,air_flow,outlet_temp
                FROM compressor_predictions ORDER BY created_at DESC LIMIT 500""")
        rows = cur.fetchall(); conn.close()
        return jsonify([{"id":r[0],"prediction":r[1],"confidence":r[2],"risk_level":r[3],
            "created_at":str(r[4]),"rpm":r[5],"power":r[6],"pressure":r[7],"airflow":r[8],"temp":r[9]} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/turbine-history")
def turbine_history():
    try:
        email = request.args.get('email', '')
        conn = get_connection(); cur = conn.cursor()
        if email:
            cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,
                rpm,temperature,pressure,vibration,power_output FROM turbine_predictions
                WHERE user_email=%s ORDER BY created_at DESC LIMIT 500""", (email,))
        else:
            cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,
                rpm,temperature,pressure,vibration,power_output FROM turbine_predictions
                ORDER BY created_at DESC LIMIT 500""")
        rows = cur.fetchall(); conn.close()
        return jsonify([{"id":r[0],"prediction":r[1],"confidence":r[2],"risk_level":r[3],
            "created_at":str(r[4]),"rpm":r[5],"temp":r[6],"pressure":r[7],"vibration":r[8],"power":r[9]} for r in rows])
    except Exception as e:
        return jsonify([])

# ─── GRAPH DATA ENDPOINTS ─────────────────────────────────────────────────────

@app.route("/graph/motor")
def graph_motor():
    try:
        conn = get_connection(); cur = conn.cursor()
        cur.execute("""SELECT rpm, prediction, created_at FROM motor_predictions
            ORDER BY created_at DESC LIMIT 20""")
        rows = cur.fetchall(); conn.close()
        rows = list(reversed(rows))
        return jsonify([{"time": r[2].strftime("%H:%M") if r[2] else "",
            "rpm": float(r[0]) if r[0] else 0, "prediction": r[1]} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/graph/pump")
def graph_pump():
    try:
        conn = get_connection(); cur = conn.cursor()
        cur.execute("""SELECT sensor_00, prediction, created_at FROM pump_predictions
            ORDER BY created_at DESC LIMIT 20""")
        rows = cur.fetchall(); conn.close()
        rows = list(reversed(rows))
        return jsonify([{"time": r[2].strftime("%H:%M") if r[2] else "",
            "pressure": float(r[0]) if r[0] else 0, "prediction": r[1]} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/graph/compressor")
def graph_compressor():
    try:
        conn = get_connection(); cur = conn.cursor()
        cur.execute("""SELECT outlet_pressure_bar, prediction, created_at
            FROM compressor_predictions ORDER BY created_at DESC LIMIT 20""")
        rows = cur.fetchall(); conn.close()
        rows = list(reversed(rows))
        return jsonify([{"time": r[2].strftime("%H:%M") if r[2] else "",
            "pressure": float(r[0]) if r[0] else 0, "prediction": r[1]} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/graph/turbine")
def graph_turbine():
    try:
        conn = get_connection(); cur = conn.cursor()
        cur.execute("""SELECT temperature, prediction, created_at FROM turbine_predictions
            ORDER BY created_at DESC LIMIT 20""")
        rows = cur.fetchall(); conn.close()
        rows = list(reversed(rows))
        return jsonify([{"time": r[2].strftime("%H:%M") if r[2] else "",
            "temperature": float(r[0]) if r[0] else 0, "prediction": r[1]} for r in rows])
    except Exception as e:
        return jsonify([])

@app.route("/graph/health-bar")
def graph_health_bar():
    try:
        conn = get_connection(); cur = conn.cursor()
        results = []
        for machine, table in [
            ("motor",      "motor_predictions"),
            ("pump",       "pump_predictions"),
            ("compressor", "compressor_predictions"),
            ("turbine",    "turbine_predictions"),
        ]:
            cur.execute(f"""
                SELECT HOUR(created_at) as hr,
                       AVG(CASE WHEN prediction IN ('HEALTHY','NORMAL') THEN 100 ELSE 0 END) as health
                FROM {table}
                WHERE created_at >= NOW() - INTERVAL 24 HOUR
                GROUP BY HOUR(created_at)
                ORDER BY hr
            """)
            results.extend(cur.fetchall())
        conn.close()
        from collections import defaultdict
        hour_map = defaultdict(list)
        for hr, health in results:
            hour_map[hr].append(float(health) if health else 0)
        bars = []
        for hr in range(24):
            vals = hour_map.get(hr, [50])
            bars.append({"hour": f"{hr:02d}:00", "health": round(sum(vals)/len(vals), 1)})
        return jsonify(bars)
    except Exception as e:
        return jsonify([{"hour": f"{i:02d}:00", "health": 70} for i in range(24)])

# ─── AUTO-STATUS ENDPOINT ─────────────────────────────────────────────────────

@app.route("/auto-status")
def auto_status():
    try:
        conn = get_connection(); cur = conn.cursor()
        cur.execute("""
            SELECT
                (SELECT COUNT(*) FROM motor_predictions WHERE user_email='system.auto@iocl.co.in') as motor,
                (SELECT COUNT(*) FROM pump_predictions WHERE user_email='system.auto@iocl.co.in') as pump,
                (SELECT COUNT(*) FROM compressor_predictions WHERE user_email='system.auto@iocl.co.in') as compressor,
                (SELECT COUNT(*) FROM turbine_predictions WHERE user_email='system.auto@iocl.co.in') as turbine
        """)
        r = cur.fetchone(); conn.close()
        return jsonify({"motor": r[0], "pump": r[1], "compressor": r[2], "turbine": r[3],
            "total": (r[0] or 0) + (r[1] or 0) + (r[2] or 0) + (r[3] or 0)})
    except Exception as e:
        return jsonify({"total": 0})

# ─── USER HISTORY ENDPOINT ────────────────────────────────────────────────────

@app.route("/history/user")
def history_user():
    try:
        email = request.args.get('email', '')
        if not email:
            return jsonify([])
        conn = get_connection(); cur = conn.cursor()
        results = []
        cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,rpm
            FROM motor_predictions WHERE user_email=%s
            AND user_email != 'system.auto@iocl.co.in'
            ORDER BY created_at DESC LIMIT 200""", (email,))
        for r in cur.fetchall():
            results.append({"id":f"motor-{r[0]}","machine":"MOTOR","prediction":r[1],
                "confidence":r[2],"risk_level":r[3],"created_at":str(r[4]),"value":r[5]})
        cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,sensor_00
            FROM pump_predictions WHERE user_email=%s
            AND user_email != 'system.auto@iocl.co.in'
            ORDER BY created_at DESC LIMIT 200""", (email,))
        for r in cur.fetchall():
            results.append({"id":f"pump-{r[0]}","machine":"PUMP","prediction":r[1],
                "confidence":r[2],"risk_level":r[3],"created_at":str(r[4]),"value":r[5]})
        cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,outlet_pressure_bar
            FROM compressor_predictions WHERE user_email=%s
            AND user_email != 'system.auto@iocl.co.in'
            ORDER BY created_at DESC LIMIT 200""", (email,))
        for r in cur.fetchall():
            results.append({"id":f"comp-{r[0]}","machine":"COMPRESSOR","prediction":r[1],
                "confidence":r[2],"risk_level":r[3],"created_at":str(r[4]),"value":r[5]})
        cur.execute("""SELECT id,prediction,confidence,risk_level,created_at,temperature
            FROM turbine_predictions WHERE user_email=%s
            AND user_email != 'system.auto@iocl.co.in'
            ORDER BY created_at DESC LIMIT 200""", (email,))
        for r in cur.fetchall():
            results.append({"id":f"turb-{r[0]}","machine":"TURBINE","prediction":r[1],
                "confidence":r[2],"risk_level":r[3],"created_at":str(r[4]),"value":r[5]})
        conn.close()
        results.sort(key=lambda x: x['created_at'], reverse=True)
        return jsonify(results)
    except Exception as e:
        return jsonify([])

# ─── STREAK ENDPOINT ──────────────────────────────────────────────────────────

@app.route("/streak")
def streak():
    try:
        conn = get_connection(); cur = conn.cursor()
        result = {}
        for machine, table, fault_statuses in [
            ("motor",      "motor_predictions",      "('FAULTY','FAULT')"),
            ("pump",       "pump_predictions",        "('BROKEN','RECOVERING')"),
            ("compressor", "compressor_predictions",  "('FAULT','DEGRADED')"),
            ("turbine",    "turbine_predictions",     "('FAULT','FAULT')"),
        ]:
            cur.execute(f"""SELECT COUNT(*) FROM {table}
                WHERE prediction IN {fault_statuses}
                AND created_at >= NOW() - INTERVAL 7 DAY""")
            faults_week = cur.fetchone()[0] or 0

            cur.execute(f"""SELECT created_at FROM {table}
                WHERE prediction IN {fault_statuses}
                ORDER BY created_at DESC LIMIT 1""")
            row = cur.fetchone()
            if row and row[0]:
                days_clean = (datetime.now() - row[0].replace(tzinfo=None)).days
            else:
                days_clean = 30

            result[machine] = {"days_clean": days_clean, "faults_week": int(faults_week)}

        conn.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "motor":      {"days_clean": 0, "faults_week": 0},
            "pump":       {"days_clean": 0, "faults_week": 0},
            "compressor": {"days_clean": 0, "faults_week": 0},
            "turbine":    {"days_clean": 0, "faults_week": 0},
        })

# ─── MAINTENANCE RISK ENDPOINT ────────────────────────────────────────────────

@app.route("/maintenance-risk")
def maintenance_risk():
    try:
        conn = get_connection(); cur = conn.cursor()
        result = {}
        for machine, table, fault_statuses in [
            ("motor",      "motor_predictions",      "('FAULTY','FAULT')"),
            ("pump",       "pump_predictions",        "('BROKEN','RECOVERING')"),
            ("compressor", "compressor_predictions",  "('FAULT','DEGRADED')"),
            ("turbine",    "turbine_predictions",     "('FAULT','FAULT')"),
        ]:
            cur.execute(f"""SELECT COUNT(*) FROM {table}
                WHERE prediction IN {fault_statuses}
                AND created_at >= NOW() - INTERVAL 7 DAY""")
            faults_week = int(cur.fetchone()[0] or 0)

            if faults_week >= 50:   risk = "High"
            elif faults_week >= 20: risk = "Medium"
            else:                   risk = "Low"

            days_until = 2 if risk == "High" else 7 if risk == "Medium" else 21

            result[machine] = {"days_until": days_until, "risk": risk, "faults_week": faults_week}

        conn.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "motor":      {"days_until": 21, "risk": "Low",    "faults_week": 0},
            "pump":       {"days_until": 2,  "risk": "High",   "faults_week": 0},
            "compressor": {"days_until": 7,  "risk": "Medium", "faults_week": 0},
            "turbine":    {"days_until": 7,  "risk": "Medium", "faults_week": 0},
        })

# ─── HEALTH PASSPORT ENDPOINTS ────────────────────────────────────────────────

def get_passport(table, value_col, fault_statuses):
    try:
        conn = get_connection(); cur = conn.cursor()

        cur.execute(f"SELECT COUNT(*) FROM {table}")
        total = int(cur.fetchone()[0] or 0)

        cur.execute(f"""SELECT COUNT(*) FROM {table}
            WHERE prediction IN {fault_statuses}""")
        faults = int(cur.fetchone()[0] or 0)

        cur.execute(f"""SELECT created_at FROM {table}
            WHERE prediction IN {fault_statuses}
            ORDER BY created_at DESC LIMIT 1""")
        row = cur.fetchone()
        if row and row[0]:
            diff = datetime.now() - row[0].replace(tzinfo=None)
            hrs = diff.seconds // 3600
            last_fault = f"{hrs} hours ago" if diff.days == 0 else f"{diff.days} days ago"
        else:
            last_fault = "No faults recorded"

        cur.execute(f"""
            SELECT DATE(created_at) as day,
                   COUNT(*) as total,
                   SUM(CASE WHEN prediction IN {fault_statuses} THEN 1 ELSE 0 END) as faults
            FROM {table}
            WHERE created_at >= NOW() - INTERVAL 30 DAY
            GROUP BY DATE(created_at)
            ORDER BY day
        """)
        trend = [{"day": str(r[0]), "total": int(r[1]), "faults": int(r[2] or 0)} for r in cur.fetchall()]

        fault_rate = round((faults / total * 100), 1) if total > 0 else 0

        conn.close()
        return jsonify({"total": total, "faults": faults, "fault_rate": fault_rate,
            "last_fault": last_fault, "trend": trend})
    except Exception as e:
        return jsonify({"total":0,"faults":0,"fault_rate":0,"last_fault":"N/A","trend":[]})

@app.route("/passport/motor")
def passport_motor():
    return get_passport("motor_predictions", "rpm", "('FAULTY','FAULT')")

@app.route("/passport/pump")
def passport_pump():
    return get_passport("pump_predictions", "sensor_00", "('BROKEN','RECOVERING')")

@app.route("/passport/compressor")
def passport_compressor():
    return get_passport("compressor_predictions", "outlet_pressure_bar", "('FAULT','DEGRADED')")

@app.route("/passport/turbine")
def passport_turbine():
    return get_passport("turbine_predictions", "temperature", "('FAULT','FAULT')")

# ─── AUTO ALERTS ENDPOINT ─────────────────────────────────────────────────────

@app.route("/alerts/auto")
def alerts_auto():
    try:
        conn = get_connection()
        cur = conn.cursor()
        results = []
        for machine, table, fault_col in [
            ("MOTOR",      "motor_predictions",      "prediction IN ('FAULTY','FAULT')"),
            ("PUMP",       "pump_predictions",        "prediction IN ('BROKEN','RECOVERING')"),
            ("COMPRESSOR", "compressor_predictions",  "prediction IN ('FAULT','DEGRADED')"),
            ("TURBINE",    "turbine_predictions",     "prediction = 'FAULT'"),
        ]:
            cur.execute(f"""SELECT id, prediction, confidence, risk_level, created_at
                FROM {table}
                WHERE {fault_col}
                AND user_email='system.auto@iocl.co.in'
                ORDER BY created_at DESC LIMIT 10""")
            rows = cur.fetchall()
            for r in rows:
                results.append({
                    "id": r[0],
                    "machine": machine,
                    "prediction": r[1],
                    "confidence": float(r[2]) if r[2] else 0,
                    "risk_level": r[3],
                    "created_at": str(r[4]),
                    "isAuto": True
                })
        conn.close()
        results.sort(key=lambda x: x['created_at'], reverse=True)
        return jsonify(results[:20])
    except Exception as e:
        import traceback
        print("ALERTS/AUTO ERROR:", traceback.format_exc())
        return jsonify([])
if __name__ == "__main__":
    PORT = 5050
    print("\n" + "="*60)
    print("  Fault Detection API — Motor + Pump + Compressor + Turbine")
    print(f"  Base URL        : http://127.0.0.1:{PORT}")
    print(f"  Graph endpoints : /graph/motor | /graph/pump | /graph/compressor | /graph/turbine")
    print(f"  Auto-status     : /auto-status")
    print(f"  Health bar      : /graph/health-bar")
    print("="*60 + "\n")
    app.run(host="0.0.0.0", port=PORT, debug=False)