"""
Naval Propulsion Gas Turbine — Fault Detection Pipeline
=======================================================
Dataset : naval_propulsion.csv
Target  : GT_turbine_decay → FAULT if decay < 0.972, else NORMAL

Outputs : turbine_model.pkl
          turbine_scaler.pkl
          turbine_feature_names.pkl
          results/turbine_evaluation.png
          results/turbine_model_comparison.png

Run     : python TURBINE2_pipeline.py
"""

# ── Imports ────────────────────────────────────────────────────────────────
import os
import warnings
import joblib

import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix, ConfusionMatrixDisplay,
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve,
    average_precision_score, precision_recall_curve
)
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

warnings.filterwarnings("ignore")
os.makedirs("results", exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════
# STEP 1 — LOAD DATA
# ══════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 1: Loading Data")
print("="*60)

df = pd.read_csv("naval_propulsion.csv")

print(f"  Rows x Columns : {df.shape}")
print(f"  Missing values : {df.isnull().sum().sum()}")


# ══════════════════════════════════════════════════════════════════════════
# STEP 2 — CREATE CLASSIFICATION LABEL
# ══════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 2: Creating Fault Label from Turbine Decay")
print("="*60)

THRESHOLD = 0.972
df["Fault"] = (df["GT_turbine_decay"] < THRESHOLD).astype(int)

print(f"  Threshold : GT_turbine_decay < {THRESHOLD} → FAULT=1")
print(f"  NORMAL (0): {(df['Fault']==0).sum():,} rows")
print(f"  FAULT  (1): {(df['Fault']==1).sum():,} rows")
print(f"  Fault %   : {df['Fault'].mean()*100:.1f}%")


# ══════════════════════════════════════════════════════════════════════════
# STEP 3 — FEATURE ENGINEERING
# ══════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 3: Feature Engineering")
print("="*60)

df = df.drop(columns=["GT_turbine_decay", "GT_compressor_decay"])

lp   = "lever_position"
v    = "ship_speed"
gtt  = "GT_shaft_torque"
gtn  = "GT_rate_of_revolutions"
ggn  = "gas_generator_rpm"
ts   = "starboard_propeller_torque"
tp   = "port_propeller_torque"
t48  = "HP_turbine_exit_temp"
t1   = "GT_compressor_inlet_temp"
t2   = "GT_compressor_outlet_temp"
p48  = "HP_turbine_exit_pressure"
p1   = "GT_compressor_inlet_pressure"
p2   = "GT_compressor_outlet_pressure"
pexh = "GT_exhaust_pressure"
tic  = "turbine_injection_control"
mf   = "fuel_flow"

df["compressor_temp_rise"]      = df[t2] - df[t1]
df["compressor_pressure_ratio"] = df[p2] / (df[p1] + 1e-6)
df["turbine_expansion_ratio"]   = df[p48] / (df[pexh] + 1e-6)
df["torque_per_fuel"]           = df[gtt] / (df[mf] + 1e-6)
df["propeller_imbalance"]       = abs(df[ts] - df[tp])
df["fuel_per_speed"]            = df[mf] / (df[v] + 1e-6)
df["turbine_temp_drop"]         = df[t2] - df[t48]
df["rpm_ratio"]                 = df[ggn] / (df[gtn] + 1e-6)

print("  Added: compressor_temp_rise, compressor_pressure_ratio,")
print("         turbine_expansion_ratio, torque_per_fuel,")
print("         propeller_imbalance, fuel_per_speed,")
print("         turbine_temp_drop, rpm_ratio")
print(f"  Total features : {df.shape[1] - 1}")


# ══════════════════════════════════════════════════════════════════════════
# STEP 4 — TRAIN / TEST SPLIT
# ══════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 4: Train/Test Split (Stratified)")
print("="*60)

X = df.drop(columns=["Fault"])
y = df["Fault"].values
feature_names = list(X.columns)

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.50,
    stratify=y,
    random_state=42
)

print(f"  Train : {len(y_train):,} | NORMAL={( y_train==0).sum():,}  FAULT={( y_train==1).sum():,}")
print(f"  Test  : {len(y_test):,}  | NORMAL={( y_test==0).sum():,}   FAULT={( y_test==1).sum():,}")
assert (y_test == 1).sum() > 0, "ERROR: No fault samples in test set!"
print("  Sanity check passed")


# ══════════════════════════════════════════════════════════════════════════
# STEP 5 — SMOTE + SCALING
# ══════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 5: SMOTE + Scaling")
print("="*60)

smote = SMOTE(random_state=42, k_neighbors=5)
X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)

print(f"  Before SMOTE → NORMAL: {(y_train==0).sum():,}  FAULT: {(y_train==1).sum():,}")
print(f"  After  SMOTE → NORMAL: {(y_train_bal==0).sum():,}  FAULT: {(y_train_bal==1).sum():,}")

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train_bal)
X_test_sc  = scaler.transform(X_test)

print(f"  Train shape after scaling: {X_train_sc.shape}")


# ══════════════════════════════════════════════════════════════════════════
# STEP 6 — TRAIN & EVALUATE MODELS
# ══════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 6: Training & Evaluating Models")
print("="*60)

print("""
  Metrics Guide:
  ──────────────────────────────────────────────────────
  Recall     → Of all real faults, how many did we catch?  <- KEY
  Precision  → Of our fault alerts, how many were real?
  F1 Score   → Balance of Recall + Precision               <- KEY
  ROC-AUC    → Overall discrimination ability
  ──────────────────────────────────────────────────────
""")

models = {
    "Logistic Regression": LogisticRegression(
        max_iter=500,
        C=0.1,
        solver="saga",
        class_weight="balanced",
        tol=1e-3,
        random_state=42
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=30,
        max_depth=4,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42
    ),
    "XGBoost": XGBClassifier(
        n_estimators=30,
        max_depth=2,
        learning_rate=0.03,
        scale_pos_weight=(y_train_bal==0).sum() / (y_train_bal==1).sum(),
        eval_metric="logloss",
        n_jobs=-1,
        random_state=42,
        verbosity=0
    ),
}

results = {}

for name, model in models.items():
    print(f"\n  -- {name} --")
    model.fit(X_train_sc, y_train_bal)

    y_pred = model.predict(X_test_sc)
    y_prob = model.predict_proba(X_test_sc)[:, 1]

    unique_preds = np.unique(y_pred)
    if len(unique_preds) == 1:
        print(f"    WARNING: Model only predicts class {unique_preds[0]}!")
    else:
        print(f"    Model predicts both classes: {unique_preds}")

    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec  = recall_score(y_test, y_pred, zero_division=0)
    f1   = f1_score(y_test, y_pred, zero_division=0)

    try:
        auc = roc_auc_score(y_test, y_prob)
        ap  = average_precision_score(y_test, y_prob)
    except ValueError:
        auc, ap = 0.0, 0.0

    results[name] = dict(
        model=model, y_pred=y_pred, y_prob=y_prob,
        accuracy=acc, precision=prec, recall=rec, f1=f1, auc=auc, ap=ap
    )

    print(f"    Accuracy     : {acc*100:6.2f}%")
    print(f"    Precision    : {prec*100:6.2f}%")
    print(f"    Recall       : {rec*100:6.2f}%  <- faults caught")
    print(f"    F1 Score     : {f1*100:6.2f}%  <- main metric")
    print(f"    ROC-AUC      : {auc:.4f}")
    print(f"    Avg Precision: {ap:.4f}")


# ── Best model by F1 ──────────────────────────────────────────────────
best_name  = max(results, key=lambda n: results[n]["f1"])
best       = results[best_name]
best_model = best["model"]

print("\n" + "="*60)
print(f"  BEST MODEL : {best_name}")
print(f"  F1={best['f1']*100:.2f}%  Recall={best['recall']*100:.2f}%  AUC={best['auc']:.4f}")
print("="*60)

print(f"\n  Detailed report -- {best_name}:")
print(classification_report(y_test, best["y_pred"],
                             target_names=["NORMAL", "FAULT"]))

total_faults  = (y_test == 1).sum()
faults_caught = int(best["y_pred"][y_test == 1].sum())
faults_missed = total_faults - faults_caught

print(f"  Faults in test set : {total_faults}")
print(f"  Faults caught      : {faults_caught}  OK")
print(f"  Faults missed      : {faults_missed}  MISSED")

print("\n  Model Comparison:")
print(f"  {'Model':<24} {'Accuracy':>9} {'Precision':>10} {'Recall':>8} {'F1':>8} {'AUC':>8}")
print("  " + "-"*72)
for name, res in results.items():
    tag = " <- BEST" if name == best_name else ""
    print(f"  {name:<24} {res['accuracy']*100:>8.2f}% "
          f"{res['precision']*100:>9.2f}% "
          f"{res['recall']*100:>7.2f}% "
          f"{res['f1']*100:>7.2f}% "
          f"{res['auc']:>8.4f}{tag}")
print("  " + "-"*72)


# ══════════════════════════════════════════════════════════════════════════
# STEP 7 — SAVE PLOTS & MODEL FILES
# ══════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 7: Saving Plots & Model Files")
print("="*60)

# Plot 1 — Evaluation charts
fig, axes = plt.subplots(1, 4, figsize=(22, 5))
fig.suptitle(f"Gas Turbine Fault Detection -- {best_name}", fontsize=13, fontweight="bold")

ax = axes[0]
for name, res in results.items():
    fpr, tpr, _ = roc_curve(y_test, res["y_prob"])
    ax.plot(fpr, tpr, lw=2, label=f"{name} (AUC={res['auc']:.3f})")
ax.plot([0, 1], [0, 1], "k--", lw=0.8, label="Random baseline")
ax.set_xlabel("False Positive Rate")
ax.set_ylabel("True Positive Rate (Recall)")
ax.set_title("ROC Curve")
ax.legend(fontsize=8)
ax.grid(alpha=0.3)

ax = axes[1]
for name, res in results.items():
    p, r, _ = precision_recall_curve(y_test, res["y_prob"])
    ax.plot(r, p, lw=2, label=f"{name} (AP={res['ap']:.3f})")
ax.axhline(y_test.mean(), color="k", linestyle="--", lw=0.8,
           label=f"Baseline ({y_test.mean():.3f})")
ax.set_xlabel("Recall")
ax.set_ylabel("Precision")
ax.set_title("Precision-Recall Curve")
ax.legend(fontsize=8)
ax.grid(alpha=0.3)

ax = axes[2]
cm = confusion_matrix(y_test, best["y_pred"])
ConfusionMatrixDisplay(cm, display_labels=["NORMAL", "FAULT"]).plot(
    ax=ax, colorbar=False, cmap="Blues"
)
tn, fp, fn, tp = cm.ravel()
ax.set_title(f"Confusion Matrix -- {best_name}\nTP={tp} (caught)  FN={fn} (missed)")

ax = axes[3]
if hasattr(best_model, "feature_importances_"):
    imp = pd.Series(best_model.feature_importances_, index=feature_names)
    imp.sort_values(ascending=True).tail(20).plot(kind="barh", ax=ax, color="#185FA5")
    ax.set_title("Top Feature Importances")
else:
    coef = pd.Series(np.abs(best_model.coef_[0]), index=feature_names)
    coef.sort_values(ascending=True).tail(20).plot(kind="barh", ax=ax, color="#185FA5")
    ax.set_title("Top Feature Coefficients")
ax.set_xlabel("Importance")

plt.tight_layout()
plt.savefig("results/turbine_evaluation.png", dpi=150, bbox_inches="tight")
plt.close()
print("  Saved --> results/turbine_evaluation.png")

# Plot 2 — Model comparison bars
fig2, axes2 = plt.subplots(1, 2, figsize=(12, 4))
fig2.suptitle("Turbine Model Comparison", fontsize=13, fontweight="bold")
names  = list(results.keys())
colors = ["#1D9E75" if n == best_name else "#B4B2A9" for n in names]

for ax, metric, title, ylabel in zip(
    axes2,
    ["f1",  "auc"],
    ["F1 Score (main metric)", "ROC-AUC"],
    ["F1",  "AUC"]
):
    vals = [results[n][metric] for n in names]
    bars = ax.bar(names, vals, color=colors, edgecolor="white")
    ax.set_ylim(0, 1.1)
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.bar_label(bars, fmt="%.4f", padding=3, fontsize=10)
    ax.tick_params(axis="x", rotation=15)
    ax.grid(axis="y", alpha=0.3)

plt.tight_layout()
plt.savefig("results/turbine_model_comparison.png", dpi=150, bbox_inches="tight")
plt.close()
print("  Saved --> results/turbine_model_comparison.png")

# Save model files
joblib.dump(best_model,    "turbine_model.pkl")
joblib.dump(scaler,        "turbine_scaler.pkl")
joblib.dump(feature_names, "turbine_feature_names.pkl")
print("  Saved --> turbine_model.pkl")
print("  Saved --> turbine_scaler.pkl")
print("  Saved --> turbine_feature_names.pkl")

print("\n" + "="*60)
print("  DONE!")
print(f"  Best model : {best_name}")
print(f"  F1 Score   : {best['f1']*100:.2f}%")
print(f"  Recall     : {best['recall']*100:.2f}%  (faults caught)")
print(f"  ROC-AUC    : {best['auc']:.4f}")
print("  Plots saved in: results/")
print("="*60)


# ══════════════════════════════════════════════════════════════════════════
# INFERENCE HELPER  (your friend uses this in Flask backend)
# ══════════════════════════════════════════════════════════════════════════
def predict_single(lever_pos, ship_spd, shaft_torque, turbine_rpm,
                   gen_rpm, stbd_torque, port_torque, hp_turb_temp,
                   comp_inlet_temp, comp_outlet_temp, hp_turb_pressure,
                   comp_inlet_pressure, comp_outlet_pressure,
                   exhaust_pressure, inj_control, fuel_flow_val):
    """
    Send one set of turbine readings -> get fault prediction.
    Your friend copies this logic into flask_api.py
    """
    _model  = joblib.load("turbine_model.pkl")
    _scaler = joblib.load("turbine_scaler.pkl")
    _fnames = joblib.load("turbine_feature_names.pkl")

    compressor_temp_rise      = comp_outlet_temp - comp_inlet_temp
    compressor_pressure_ratio = comp_outlet_pressure / (comp_inlet_pressure + 1e-6)
    turbine_expansion_ratio   = hp_turb_pressure / (exhaust_pressure + 1e-6)
    torque_per_fuel           = shaft_torque / (fuel_flow_val + 1e-6)
    propeller_imbalance       = abs(stbd_torque - port_torque)
    fuel_per_speed            = fuel_flow_val / (ship_spd + 1e-6)
    turbine_temp_drop         = comp_outlet_temp - hp_turb_temp
    rpm_ratio                 = gen_rpm / (turbine_rpm + 1e-6)

    row = pd.DataFrame([[
        lever_pos, ship_spd, shaft_torque, turbine_rpm, gen_rpm,
        stbd_torque, port_torque, hp_turb_temp, comp_inlet_temp,
        comp_outlet_temp, hp_turb_pressure, comp_inlet_pressure,
        comp_outlet_pressure, exhaust_pressure, inj_control, fuel_flow_val,
        compressor_temp_rise, compressor_pressure_ratio,
        turbine_expansion_ratio, torque_per_fuel, propeller_imbalance,
        fuel_per_speed, turbine_temp_drop, rpm_ratio
    ]], columns=_fnames)

    row_sc = _scaler.transform(row)
    prob   = float(_model.predict_proba(row_sc)[0, 1])
    label  = int(_model.predict(row_sc)[0])

    return {
        "fault_probability" : round(prob, 4),
        "health_score"      : round((1 - prob) * 100, 1),
        "alert"             : label == 1,
        "risk_level"        : "HIGH" if prob > 0.7 else "MEDIUM" if prob > 0.3 else "LOW",
    }


# Demo prediction
print("\n-- Demo Prediction --")
demo = predict_single(
    lever_pos=1.138, ship_spd=3.0, shaft_torque=289.964,
    turbine_rpm=1349.489, gen_rpm=6677.38,
    stbd_torque=7.584, port_torque=7.584,
    hp_turb_temp=464.006, comp_inlet_temp=288.0,
    comp_outlet_temp=550.563, hp_turb_pressure=1.096,
    comp_inlet_pressure=0.998, comp_outlet_pressure=5.947,
    exhaust_pressure=1.019, inj_control=7.137, fuel_flow_val=0.082
)
print(f"  Output : {demo}")