"""
seed_data.py — Seeds 1000 rows per machine (4000 total) over last 30 days
"""

import random
import numpy as np
import pandas as pd
import joblib
import json
import csv
from datetime import datetime, timedelta
from db import get_connection

TOTAL_ROWS  = 1000
DAYS_BACK   = 7
AUTO_EMAIL  = 'auto@iocl.in'
CYCLES      = TOTAL_ROWS
MINUTES_GAP = (DAYS_BACK * 24 * 60) // CYCLES

CSV_MOTOR      = "predictions_motor.csv"
CSV_PUMP       = "predictions_pump.csv"
CSV_COMPRESSOR = "predictions_compressor.csv"
CSV_TURBINE    = "predictions_turbine.csv"

HEADERS_MOTOR = ["timestamp","machine_id","product_type","air_temp_k","proc_temp_k",
    "rpm","torque_nm","tool_wear_min","prediction","confidence","risk_level","source"]
HEADERS_PUMP = ["timestamp","machine_id","sensor_00","sensor_02","sensor_03","sensor_04",
    "sensor_05","sensor_06","sensor_07","sensor_08","sensor_09","sensor_10",
    "sensor_11","sensor_12","prediction","confidence","risk_level","source"]
HEADERS_COMPRESSOR = ["timestamp","machine_id","rpm","motor_power_kw","torque_nm",
    "outlet_pressure_bar","air_flow_cfm","noise_db","outlet_temp_c",
    "accel_x","accel_y","accel_z","h_accel_x","h_accel_y","h_accel_z",
    "bearings","prediction","confidence","risk_level","source"]
HEADERS_TURBINE = ["timestamp","machine_id","rpm","temperature_k","pressure_bar",
    "vibration_mms","power_output_mw","prediction","confidence","risk_level","source"]

for fname, headers in [
    (CSV_MOTOR, HEADERS_MOTOR), (CSV_PUMP, HEADERS_PUMP),
    (CSV_COMPRESSOR, HEADERS_COMPRESSOR), (CSV_TURBINE, HEADERS_TURBINE)
]:
    with open(fname, 'w', newline='') as f:
        csv.DictWriter(f, fieldnames=headers).writeheader()

print("Loading models...")
motor_model    = joblib.load("model.pkl")
motor_scaler   = joblib.load("scaler.pkl")
motor_le       = joblib.load("label_encoder.pkl")
motor_features = joblib.load("feature_names.pkl")

pump_model    = joblib.load("pump_model.pkl")
pump_scaler   = joblib.load("pump_scaler.pkl")
pump_features = joblib.load("pump_feature_names.pkl")

compressor_model    = joblib.load("compressor_model.pkl")
compressor_scaler   = joblib.load("compressor_scaler.pkl")
compressor_features = joblib.load("compressor_feature_names.pkl")

turbine_model    = joblib.load("turbine_model.pkl")
turbine_scaler   = joblib.load("turbine_scaler.pkl")
turbine_features = joblib.load("turbine_features.pkl")
print("All models loaded ✅")

# ── Scenario buckets: 60% normal, 25% medium, 15% fault
def scenario():
    r = random.random()
    if r < 0.60: return 'normal'
    if r < 0.85: return 'medium'
    return 'fault'

def write_csv(fname, headers, row):
    with open(fname, 'a', newline='') as f:
        csv.DictWriter(f, fieldnames=headers).writerow(
            {h: row.get(h, '') for h in headers})

# ── MOTOR data generators by scenario ────────────────────────────────────────
def gen_motor(sc):
    pt = random.choice(['L', 'M', 'H'])
    if sc == 'normal':
        return pt, round(random.uniform(298,302),2), round(random.uniform(308,312),2), \
               round(random.uniform(1400,2200),1), round(random.uniform(20,45),2), \
               round(random.uniform(0,100),1)
    elif sc == 'medium':
        return pt, round(random.uniform(299,303),2), round(random.uniform(309,314),2), \
               round(random.uniform(1200,1600),1), round(random.uniform(46,58),2), \
               round(random.uniform(100,200),1)
    else:  # fault — high torque + high wear + high temp diff
        return pt, round(random.uniform(295,298),2), round(random.uniform(308,316),2), \
               round(random.uniform(1168,1400),1), round(random.uniform(60,77),2), \
               round(random.uniform(200,253),1)

# ── PUMP — build rolling-aware feature vector ─────────────────────────────────
# The pump model uses sensor_XX_mean10, _std10, _max10 rolling features.
# We simulate these by setting mean=value, std=noise, max=value+noise
PUMP_BASE_SENSORS = ["sensor_00","sensor_02","sensor_03","sensor_04",
    "sensor_05","sensor_06","sensor_07","sensor_08",
    "sensor_09","sensor_10","sensor_11","sensor_12"]

PUMP_NORMAL_RANGES = {
    "sensor_00":(1.5,2.8), "sensor_02":(30,55), "sensor_03":(0.7,1.2),
    "sensor_04":(1.0,1.5), "sensor_05":(0.6,1.0), "sensor_06":(2.0,4.5),
    "sensor_07":(0.8,1.3), "sensor_08":(1.5,2.8), "sensor_09":(0.5,0.9),
    "sensor_10":(1.2,1.8), "sensor_11":(0.6,1.0), "sensor_12":(2.5,4.5),
}
PUMP_FAULT_RANGES = {
    "sensor_00":(2.8,3.5), "sensor_02":(55,80), "sensor_03":(0.4,0.6),
    "sensor_04":(0.8,1.0), "sensor_05":(0.3,0.5), "sensor_06":(4.5,6.0),
    "sensor_07":(0.5,0.7), "sensor_08":(2.8,4.0), "sensor_09":(0.3,0.5),
    "sensor_10":(0.8,1.2), "sensor_11":(0.4,0.6), "sensor_12":(4.5,6.5),
}
PUMP_MEDIUM_RANGES = {k: (
    (PUMP_NORMAL_RANGES[k][0]+PUMP_FAULT_RANGES[k][0])/2,
    (PUMP_NORMAL_RANGES[k][1]+PUMP_FAULT_RANGES[k][1])/2
) for k in PUMP_BASE_SENSORS}

def gen_pump_row(sc):
    ranges = PUMP_NORMAL_RANGES if sc=='normal' else PUMP_FAULT_RANGES if sc=='fault' else PUMP_MEDIUM_RANGES
    vals = {k: round(random.uniform(*ranges[k]), 3) for k in PUMP_BASE_SENSORS}
    # Build full feature vector with rolling features
    row_dict = {}
    for feat in pump_features:
        base = feat.replace('_mean10','').replace('_std10','').replace('_max10','')
        if feat in vals:
            row_dict[feat] = vals[feat]
        elif '_mean10' in feat and base in vals:
            row_dict[feat] = vals[base] * random.uniform(0.97, 1.03)
        elif '_std10' in feat and base in vals:
            row_dict[feat] = vals[base] * random.uniform(0.01, 0.08) if sc=='fault' else vals[base] * random.uniform(0.001, 0.02)
        elif '_max10' in feat and base in vals:
            row_dict[feat] = vals[base] * random.uniform(1.0, 1.1)
        else:
            row_dict[feat] = 0.0
    return vals, row_dict

# ── COMPRESSOR — same rolling feature issue ───────────────────────────────────
COMP_NORMAL = {
    "rpm":(2700,3200), "motor_power":(12,16), "torque":(35,55),
    "outlet_pressure_bar":(6,9), "air_flow":(280,360), "noise_db":(65,78),
    "outlet_temp":(75,90), "gaccx":(0.01,0.3), "gaccy":(0.01,0.3),
    "gaccz":(0.01,0.3), "haccx":(0.01,0.2), "haccy":(0.01,0.2),
    "haccz":(0.01,0.2), "bearings":(0.1,0.4),
}
COMP_FAULT = {
    "rpm":(2500,2700), "motor_power":(16,18), "torque":(55,70),
    "outlet_pressure_bar":(4,6), "air_flow":(200,280), "noise_db":(78,90),
    "outlet_temp":(90,110), "gaccx":(0.3,0.6), "gaccy":(0.3,0.6),
    "gaccz":(0.3,0.6), "haccx":(0.2,0.5), "haccy":(0.2,0.5),
    "haccz":(0.2,0.5), "bearings":(0.4,0.8),
}
COMP_MEDIUM = {k: (
    (COMP_NORMAL[k][0]+COMP_FAULT[k][0])/2,
    (COMP_NORMAL[k][1]+COMP_FAULT[k][1])/2
) for k in COMP_NORMAL}

def gen_comp_row(sc):
    ranges = COMP_NORMAL if sc=='normal' else COMP_FAULT if sc=='fault' else COMP_MEDIUM
    vals = {k: round(random.uniform(*ranges[k]), 3) for k in ranges}
    # Build rolling feature vector
    row_dict = {}
    for feat in compressor_features:
        base = feat.replace('_mean','').replace('_std','').replace('_max','')
        if feat in vals:
            row_dict[feat] = vals[feat]
        elif '_mean' in feat and base in vals:
            row_dict[feat] = vals[base] * random.uniform(0.97, 1.03)
        elif '_std' in feat and base in vals:
            row_dict[feat] = vals[base] * random.uniform(0.01, 0.06) if sc=='fault' else vals[base] * random.uniform(0.001, 0.02)
        elif '_max' in feat and base in vals:
            row_dict[feat] = vals[base] * random.uniform(1.0, 1.08)
        else:
            row_dict[feat] = 0.0
    return vals, row_dict

# ── TURBINE — naval propulsion engineered features ────────────────────────────
def gen_turbine_row(sc):
    if sc == 'normal':
        lever=1.1; speed=3.0; shaft_t=290; t_rpm=1350; g_rpm=6700
        stbd=7.5; port=7.5; hp_temp=464; ci_temp=288; co_temp=550
        hp_p=1.1; ci_p=1.0; co_p=5.9; exh_p=1.02; inj=7.1; fuel=0.082
    elif sc == 'medium':
        lever=4.0; speed=12.0; shaft_t=18000; t_rpm=5000; g_rpm=24000
        stbd=600; port=620; hp_temp=800; ci_temp=290; co_temp=680
        hp_p=4.5; ci_p=1.01; co_p=14.0; exh_p=1.05; inj=20; fuel=1.2
    else:  # fault
        lever=7.0; speed=25.0; shaft_t=60000; t_rpm=9000; g_rpm=45000
        stbd=2000; port=2200; hp_temp=1150; ci_temp=295; co_temp=850
        hp_p=8.0; ci_p=1.02; co_p=22.0; exh_p=1.1; inj=35; fuel=2.5

    # Add noise
    def n(v, pct=0.05): return v * random.uniform(1-pct, 1+pct)

    vals = {
        'lever_position': n(lever), 'ship_speed': n(speed),
        'GT_shaft_torque': n(shaft_t), 'GT_rate_of_revolutions': n(t_rpm),
        'gas_generator_rpm': n(g_rpm),
        'starboard_propeller_torque': n(stbd), 'port_propeller_torque': n(port),
        'HP_turbine_exit_temp': n(hp_temp), 'GT_compressor_inlet_temp': n(ci_temp),
        'GT_compressor_outlet_temp': n(co_temp), 'HP_turbine_exit_pressure': n(hp_p),
        'GT_compressor_inlet_pressure': n(ci_p), 'GT_compressor_outlet_pressure': n(co_p),
        'GT_exhaust_pressure': n(exh_p), 'turbine_injection_control': n(inj),
        'fuel_flow': n(fuel),
    }
    # Engineered features (same as pipeline)
    vals['compressor_temp_rise']      = vals['GT_compressor_outlet_temp'] - vals['GT_compressor_inlet_temp']
    vals['compressor_pressure_ratio'] = vals['GT_compressor_outlet_pressure'] / (vals['GT_compressor_inlet_pressure'] + 1e-6)
    vals['turbine_expansion_ratio']   = vals['HP_turbine_exit_pressure'] / (vals['GT_exhaust_pressure'] + 1e-6)
    vals['torque_per_fuel']           = vals['GT_shaft_torque'] / (vals['fuel_flow'] + 1e-6)
    vals['propeller_imbalance']       = abs(vals['starboard_propeller_torque'] - vals['port_propeller_torque'])
    vals['fuel_per_speed']            = vals['fuel_flow'] / (vals['ship_speed'] + 1e-6)
    vals['turbine_temp_drop']         = vals['GT_compressor_outlet_temp'] - vals['HP_turbine_exit_temp']
    vals['rpm_ratio']                 = vals['gas_generator_rpm'] / (vals['GT_rate_of_revolutions'] + 1e-6)

    row_dict = {feat: vals.get(feat, 0.0) for feat in turbine_features}
    return vals, row_dict

# ── MAIN SEED LOOP ────────────────────────────────────────────────────────────
conn = get_connection()
cur  = conn.cursor()

start_time = datetime.now() - timedelta(days=DAYS_BACK)
print(f"Seeding {CYCLES} cycles (up to {CYCLES*4} rows) over last {DAYS_BACK} days...")

for i in range(CYCLES):
    ts     = start_time + timedelta(minutes=i * MINUTES_GAP)
    ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
    sc     = scenario()

    # ── MOTOR ────────────────────────────────────────────────────────────────
    try:
        pt, air, proc, rpm, torq, tw = gen_motor(sc)
        te   = int(motor_le.transform([pt])[0])
        td   = proc - air
        pw   = torq * rpm * (2 * np.pi / 60)
        txw  = torq * tw
        sxt  = rpm * proc
        ws   = int(pd.cut([tw], bins=[0,100,200,300,np.inf], labels=[0,1,2,3], include_lowest=True)[0])
        row  = pd.DataFrame([[te,air,proc,rpm,torq,tw,td,pw,txw,sxt,ws]], columns=motor_features)
        rs   = motor_scaler.transform(row)
        prob = float(motor_model.predict_proba(rs)[0,1])
        label= int(motor_model.predict(rs)[0])

        # If model disagrees with scenario for fault/normal, trust scenario for seeding
        if sc == 'fault' and label == 0:
            status, risk, conf = 'FAULTY', 'High', round(random.uniform(70,95), 1)
        elif sc == 'normal' and label == 1:
            status, risk, conf = 'HEALTHY', 'Low', round(random.uniform(70,95), 1)
        elif sc == 'medium':
            status = 'FAULTY' if prob > 0.5 else 'HEALTHY'
            risk   = 'Medium'
            conf   = round(prob*100 if label==1 else (1-prob)*100, 1)
        else:
            status = 'FAULTY' if label==1 else 'HEALTHY'
            risk   = 'High' if prob>0.7 else 'Medium' if prob>0.3 else 'Low'
            conf   = round(prob*100 if label==1 else (1-prob)*100, 1)

        cur.execute("""INSERT INTO motor_predictions
            (product_type,air_temp_k,proc_temp_k,rpm,torque_nm,tool_wear_min,
            `prediction`,status,confidence,fault_type,risk_level,input_data,user_email,created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (pt,air,proc,rpm,torq,tw,status,status,conf,'Seeded',risk,
             json.dumps({'pt':pt,'air':air,'proc':proc,'rpm':rpm,'torq':torq,'tw':tw}),AUTO_EMAIL,ts))

        write_csv(CSV_MOTOR, HEADERS_MOTOR, {"timestamp":ts_str,"machine_id":f"SEED-{i}",
            "product_type":pt,"air_temp_k":air,"proc_temp_k":proc,"rpm":rpm,
            "torque_nm":torq,"tool_wear_min":tw,"prediction":status,
            "confidence":conf,"risk_level":risk,"source":"SEED"})
    except Exception as e:
        print(f"  Motor error cycle {i}: {e}")

    # ── PUMP ─────────────────────────────────────────────────────────────────
    try:
        raw_vals, row_dict = gen_pump_row(sc)
        row   = pd.DataFrame([row_dict])[pump_features]
        rs    = pump_scaler.transform(row)
        pa    = pump_model.predict_proba(rs)[0]
        label = int(pump_model.predict(rs)[0])
        prob_ab = float(pa[1])

        # Force scenario
        if sc == 'fault':
            status, risk, conf = 'BROKEN', 'High', round(random.uniform(72,95), 1)
        elif sc == 'normal':
            status, risk, conf = 'NORMAL', 'Low', round(random.uniform(70,95), 1)
        else:
            status = 'RECOVERING'
            risk   = 'Medium'
            conf   = round(prob_ab*100 if label==1 else (1-prob_ab)*100, 1)

        cur.execute("""INSERT INTO pump_predictions
            (sensor_00,sensor_02,sensor_03,sensor_04,sensor_05,sensor_06,
            sensor_07,sensor_08,sensor_09,sensor_10,sensor_11,sensor_12,
            `prediction`,status,confidence,risk_level,input_data,user_email,created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (raw_vals.get('sensor_00'),raw_vals.get('sensor_02'),raw_vals.get('sensor_03'),
             raw_vals.get('sensor_04'),raw_vals.get('sensor_05'),raw_vals.get('sensor_06'),
             raw_vals.get('sensor_07'),raw_vals.get('sensor_08'),raw_vals.get('sensor_09'),
             raw_vals.get('sensor_10'),raw_vals.get('sensor_11'),raw_vals.get('sensor_12'),
             status,status,conf,risk,json.dumps(raw_vals),AUTO_EMAIL,ts))

        write_csv(CSV_PUMP, HEADERS_PUMP, {"timestamp":ts_str,"machine_id":f"SEED-{i}",
            **{k:raw_vals.get(k) for k in PUMP_BASE_SENSORS},
            "prediction":status,"confidence":conf,"risk_level":risk,"source":"SEED"})
    except Exception as e:
        print(f"  Pump error cycle {i}: {e}")

    # ── COMPRESSOR ───────────────────────────────────────────────────────────
    try:
        raw_vals, row_dict = gen_comp_row(sc)
        row   = pd.DataFrame([row_dict])[compressor_features]
        rs    = compressor_scaler.transform(row)
        prob  = float(compressor_model.predict_proba(rs)[0][1])
        label = int(compressor_model.predict(rs)[0])

        if sc == 'fault':
            status, risk, conf = 'FAULT', 'High', round(random.uniform(72,95), 1)
        elif sc == 'normal':
            status, risk, conf = 'NORMAL', 'Low', round(random.uniform(70,95), 1)
        else:
            status = 'DEGRADED'
            risk   = 'Medium'
            conf   = round(prob*100 if label==1 else (1-prob)*100, 1)

        cur.execute("""INSERT INTO compressor_predictions
            (rpm,motor_power,torque,outlet_pressure_bar,air_flow,noise_db,
            outlet_temp,gaccx,gaccy,gaccz,haccx,haccy,haccz,bearings,
            `prediction`,status,confidence,risk_level,input_data,user_email,created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (raw_vals.get('rpm'),raw_vals.get('motor_power'),raw_vals.get('torque'),
             raw_vals.get('outlet_pressure_bar'),raw_vals.get('air_flow'),raw_vals.get('noise_db'),
             raw_vals.get('outlet_temp'),raw_vals.get('gaccx'),raw_vals.get('gaccy'),
             raw_vals.get('gaccz'),raw_vals.get('haccx'),raw_vals.get('haccy'),
             raw_vals.get('haccz'),raw_vals.get('bearings'),
             status,status,conf,risk,json.dumps(raw_vals),AUTO_EMAIL,ts))

        write_csv(CSV_COMPRESSOR, HEADERS_COMPRESSOR, {"timestamp":ts_str,"machine_id":f"SEED-{i}",
            "rpm":raw_vals.get('rpm'),"motor_power_kw":raw_vals.get('motor_power'),
            "torque_nm":raw_vals.get('torque'),"outlet_pressure_bar":raw_vals.get('outlet_pressure_bar'),
            "air_flow_cfm":raw_vals.get('air_flow'),"noise_db":raw_vals.get('noise_db'),
            "outlet_temp_c":raw_vals.get('outlet_temp'),
            "accel_x":raw_vals.get('gaccx'),"accel_y":raw_vals.get('gaccy'),"accel_z":raw_vals.get('gaccz'),
            "h_accel_x":raw_vals.get('haccx'),"h_accel_y":raw_vals.get('haccy'),"h_accel_z":raw_vals.get('haccz'),
            "bearings":raw_vals.get('bearings'),
            "prediction":status,"confidence":conf,"risk_level":risk,"source":"SEED"})
    except Exception as e:
        print(f"  Compressor error cycle {i}: {e}")

    # ── TURBINE ───────────────────────────────────────────────────────────────
    try:
        raw_vals, row_dict = gen_turbine_row(sc)
        row   = pd.DataFrame([row_dict])[turbine_features]
        rs    = turbine_scaler.transform(row)
        prob  = float(turbine_model.predict_proba(rs)[0][1])
        label = int(turbine_model.predict(rs)[0])

        if sc == 'fault':
            status, risk, conf = 'FAULT', 'High', round(random.uniform(72,95), 1)
        elif sc == 'normal':
            status, risk, conf = 'NORMAL', 'Low', round(random.uniform(70,95), 1)
        else:
            status = 'FAULT' if prob > 0.5 else 'NORMAL'
            risk   = 'Medium'
            conf   = round(prob*100 if label==1 else (1-prob)*100, 1)

        cur.execute("""INSERT INTO turbine_predictions
            (rpm,temperature,pressure,vibration,power_output,
            `prediction`,status,confidence,risk_level,input_data,user_email,created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (raw_vals.get('GT_rate_of_revolutions'),raw_vals.get('HP_turbine_exit_temp'),
             raw_vals.get('HP_turbine_exit_pressure'),raw_vals.get('propeller_imbalance'),
             raw_vals.get('GT_shaft_torque'),
             status,status,conf,risk,json.dumps({k:round(float(v),4) for k,v in raw_vals.items()}),AUTO_EMAIL,ts))

        write_csv(CSV_TURBINE, HEADERS_TURBINE, {"timestamp":ts_str,"machine_id":f"SEED-{i}",
            "rpm":raw_vals.get('GT_rate_of_revolutions'),
            "temperature_k":raw_vals.get('HP_turbine_exit_temp'),
            "pressure_bar":raw_vals.get('HP_turbine_exit_pressure'),
            "vibration_mms":raw_vals.get('propeller_imbalance'),
            "power_output_mw":raw_vals.get('GT_shaft_torque'),
            "prediction":status,"confidence":conf,"risk_level":risk,"source":"SEED"})
    except Exception as e:
        print(f"  Turbine error cycle {i}: {e}")

    if i % 100 == 0:
        conn.commit()
        print(f"  Progress: {i}/{CYCLES} ({i*4} rows)")

conn.commit()
conn.close()
print(f"\n✅ Seeding complete! ~{CYCLES*4} rows inserted.")
print("✅ Distribution: ~60% NORMAL, ~25% MEDIUM/DEGRADED, ~15% FAULT/BROKEN")