"""
Pump Sensor ML Pipeline — CORRECTED & SIMPLIFIED
=================================================
What this code does (plain English):
  1. Load pump sensor data
  2. Clean missing values
  3. Create a binary label: NORMAL vs ABNORMAL (broken/recovering)
  4. Split data into train/test — STRATIFIED so both splits have fault samples
  5. Add rolling window features (trend detection)
  6. Balance the training data with SMOTE (handles class imbalance)
  7. Scale features
  8. Train 3 models and compare them
  9. Save plots and the best model
 
KEY FIXES vs previous version:
  ✅ FIX-1 : Stratified split → test set now ALWAYS contains fault samples
  ✅ FIX-2 : SMOTE only on training data (no data leakage)
  ✅ FIX-3 : Scaler fitted on training data only
  ✅ FIX-4 : Logistic Regression uses saga solver + C=1.0 (was collapsing to 0% recall)
  ✅ FIX-5 : Sanity checks added so you immediately see if something is wrong
  ✅ FIX-6 : Rolling features computed separately on train and test
"""
 
# ── Imports ────────────────────────────────────────────────────────────────────
import os
import warnings
import joblib
 
import numpy as np
import pandas as pd
 
import matplotlib
matplotlib.use("Agg")   # no display needed — saves to file
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
 
 
# ══════════════════════════════════════════════════════════════════════════════
# STEP 1 — LOAD DATA
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 1: Loading Data")
print("="*60)
 
df = pd.read_csv("pump_sensor.csv", index_col=0)
df["timestamp"] = pd.to_datetime(df["timestamp"])
df = df.sort_values("timestamp").reset_index(drop=True)
 
print(f"  Rows × Columns : {df.shape}")
print(f"  Date range     : {df['timestamp'].min()} → {df['timestamp'].max()}")
print(f"\n  Class counts:")
print(df["machine_status"].value_counts())
 
 
# ══════════════════════════════════════════════════════════════════════════════
# STEP 2 — CLEAN DATA
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 2: Cleaning Data")
print("="*60)
 
# Drop sensor_15 (100% missing — useless column)
if "sensor_15" in df.columns:
    df.drop(columns=["sensor_15"], inplace=True)
    print("  Dropped sensor_15 (completely empty)")
 
# Drop timestamp now (used only for sorting)
df.drop(columns=["timestamp"], inplace=True)
 
sensor_cols = [c for c in df.columns if c.startswith("sensor_")]
 
# Sensors with heavy missing → forward fill, then median for any remaining gaps
heavy_missing = ["sensor_00", "sensor_50", "sensor_51"]
for col in heavy_missing:
    if col in df.columns:
        df[col] = df[col].ffill().fillna(df[col].median())
 
# All other sensors → fill with median
for col in sensor_cols:
    if col not in heavy_missing:
        df[col] = df[col].fillna(df[col].median())
 
remaining_missing = df[sensor_cols].isnull().sum().sum()
print(f"  Missing values remaining: {remaining_missing}  (should be 0)")
 
 
# ══════════════════════════════════════════════════════════════════════════════
# STEP 3 — CREATE BINARY LABEL
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 3: Creating Binary Label")
print("="*60)
 
# NORMAL = 0,  BROKEN or RECOVERING = 1  (ABNORMAL)
df["label"] = (df["machine_status"] != "NORMAL").astype(int)
 
normal_count   = (df["label"] == 0).sum()
abnormal_count = (df["label"] == 1).sum()
total          = len(df)
 
print(f"  NORMAL   (label=0) : {normal_count:,}  ({normal_count/total*100:.1f}%)")
print(f"  ABNORMAL (label=1) : {abnormal_count:,}  ({abnormal_count/total*100:.1f}%)")
print(f"\n  ⚠  Heavy imbalance — this is why we use SMOTE later")
 
 
# ══════════════════════════════════════════════════════════════════════════════
# STEP 4 — TRAIN / TEST SPLIT  (STRATIFIED)
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 4: Train/Test Split (Stratified)")
print("="*60)
 
# WHY STRATIFIED? — The faults (ABNORMAL) may cluster in one time period.
# A plain chronological 80/20 split can put ALL faults in the train set,
# leaving the test set with zero faults → 100% accuracy but meaningless.
# Stratified split guarantees both train and test contain fault samples.
 
feature_cols = [c for c in df.columns if c not in ("machine_status", "label")]
X = df[feature_cols].copy()
y = df["label"].values
 
X_train_raw, X_test_raw, y_train, y_test = train_test_split(
    X, y,
    test_size=0.20,
    stratify=y,          # ← ensures fault samples in both train and test
    random_state=42
)
 
print(f"  Train : {len(y_train):,} rows | "
      f"NORMAL={( y_train==0).sum():,}  ABNORMAL={( y_train==1).sum():,}")
print(f"  Test  : {len(y_test):,} rows  | "
      f"NORMAL={( y_test==0).sum():,}   ABNORMAL={( y_test==1).sum():,}")
 
# ── Sanity check — STOP immediately if test has no faults ─────────────────
assert (y_test == 1).sum() > 0, (
    "ERROR: Test set has zero ABNORMAL samples! "
    "Check your stratify= parameter or class encoding."
)
print("  ✅ Sanity check passed: test set contains fault samples")
 
 
# ══════════════════════════════════════════════════════════════════════════════
# STEP 5 — ROLLING WINDOW FEATURES
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 5: Rolling Window Features")
print("="*60)
 
# WHY ROLLING FEATURES? — A single sensor reading can be noisy.
# The rolling mean/std/max over 10 rows captures the *trend* —
# e.g., temperature slowly rising before a fault.
 
WINDOW = 10
 
key_sensors = [
    "sensor_00", "sensor_02", "sensor_03", "sensor_04",
    "sensor_05", "sensor_06", "sensor_07", "sensor_08",
    "sensor_09", "sensor_10", "sensor_11", "sensor_12",
]
key_sensors = [s for s in key_sensors if s in df.columns]
 
def add_rolling_features(data, window, sensors):
    """Compute rolling mean, std, max for each sensor — within this split only."""
    d = data.copy()
    for col in sensors:
        d[f"{col}_mean{window}"] = d[col].rolling(window, min_periods=1).mean()
        d[f"{col}_std{window}"]  = d[col].rolling(window, min_periods=1).std().fillna(0)
        d[f"{col}_max{window}"]  = d[col].rolling(window, min_periods=1).max()
    return d
 
# IMPORTANT: compute rolling separately on train and test
# so test rows cannot "look ahead" into the training data
X_train_raw = add_rolling_features(X_train_raw, WINDOW, key_sensors)
X_test_raw  = add_rolling_features(X_test_raw,  WINDOW, key_sensors)
 
feature_names   = list(X_train_raw.columns)
X_train_raw_arr = X_train_raw.values
X_test_raw_arr  = X_test_raw.values
 
print(f"  Features after rolling: {len(feature_names)} total")
print(f"  (original {len(feature_cols)} + {len(key_sensors)*3} rolling features)")
 
 
# ══════════════════════════════════════════════════════════════════════════════
# STEP 6 — SMOTE + SCALING  (training data only)
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 6: SMOTE (Balance Classes) + Scaling")
print("="*60)
 
# ── What is SMOTE? ─────────────────────────────────────────────────────────
# SMOTE = Synthetic Minority Over-Sampling Technique
#
# Problem  : 93% NORMAL vs 7% ABNORMAL → model ignores the minority class
# Solution : SMOTE creates NEW synthetic ABNORMAL samples by interpolating
#            between existing ones → balanced 50/50 training data
#
# Rule     : SMOTE only on TRAINING data — NEVER on test data
#            (applying it to test data would be cheating / data leakage)
 
smote = SMOTE(random_state=42, k_neighbors=5)
X_train_bal, y_train_bal = smote.fit_resample(X_train_raw_arr, y_train)
 
print(f"  Before SMOTE → NORMAL: {(y_train==0).sum():,}  ABNORMAL: {(y_train==1).sum():,}")
print(f"  After  SMOTE → NORMAL: {(y_train_bal==0).sum():,}  ABNORMAL: {(y_train_bal==1).sum():,}")
 
# ── Scaling ────────────────────────────────────────────────────────────────
# StandardScaler: shifts each feature to mean=0, std=1
# Fit ONLY on training data — then apply the same transformation to test
# (fitting on test would leak test statistics into training)
 
scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train_bal)    # fit + transform on train
X_test_sc  = scaler.transform(X_test_raw_arr)     # only transform on test
 
print(f"\n  ✅ SMOTE + Scaling done. Train shape: {X_train_sc.shape}")
 
 
# ══════════════════════════════════════════════════════════════════════════════
# STEP 7 — TRAIN & EVALUATE MODELS
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 7: Training & Evaluating Models")
print("="*60)
 
print("""
  Which metric matters most?
  ─────────────────────────────────────────────────────────────
  Accuracy   → MISLEADING here (93% accuracy = predict all NORMAL)
  Recall     → "Of all actual faults, how many did we catch?"  ← KEY
  Precision  → "Of our fault alerts, how many were real faults?"
  F1 Score   → Balanced mix of Recall + Precision              ← KEY
  ROC-AUC    → Overall model discrimination ability
  ─────────────────────────────────────────────────────────────
""")
 
models = {
    "Logistic Regression": LogisticRegression(
        max_iter=2000,
        C=1.0,                   # regularization strength (1.0 = moderate)
        solver="saga",           # best solver for large datasets
        class_weight="balanced", # extra weight on minority class
        tol=1e-3,
        random_state=42
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42
    ),
    "XGBoost": XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        # scale_pos_weight: tells XGBoost how imbalanced the data is
        scale_pos_weight=(y_train_bal == 0).sum() / (y_train_bal == 1).sum(),
        eval_metric="logloss",
        n_jobs=-1,
        random_state=42,
        verbosity=0
    ),
}
 
results = {}
 
for name, model in models.items():
    print(f"\n  ── {name} ──")
 
    # Train
    model.fit(X_train_sc, y_train_bal)
 
    # Predict
    y_pred = model.predict(X_test_sc)
    y_prob = model.predict_proba(X_test_sc)[:, 1]
 
    # ── Sanity check: is model predicting both classes? ────────────────
    unique_preds = np.unique(y_pred)
    if len(unique_preds) == 1:
        print(f"    ⚠ WARNING: Model only predicts class {unique_preds[0]}!")
        print(f"       All metrics will be 0. Check features and scaling.")
    else:
        print(f"    ✅ Model predicts both classes: {unique_preds}")
 
    # Compute metrics
    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec  = recall_score(y_test, y_pred, zero_division=0)
    f1   = f1_score(y_test, y_pred, zero_division=0)
 
    try:
        auc = roc_auc_score(y_test, y_prob)
        ap  = average_precision_score(y_test, y_prob)
    except ValueError:
        auc, ap = 0.0, 0.0
        print("    ⚠ AUC could not be computed (only one class in predictions)")
 
    results[name] = dict(
        model=model, y_pred=y_pred, y_prob=y_prob,
        accuracy=acc, precision=prec, recall=rec, f1=f1, auc=auc, ap=ap
    )
 
    print(f"    Accuracy    : {acc*100:6.2f}%  ← don't trust this number!")
    print(f"    Precision   : {prec*100:6.2f}%")
    print(f"    Recall      : {rec*100:6.2f}%  ← how many faults did we catch?")
    print(f"    F1 Score    : {f1*100:6.2f}%  ← main metric")
    print(f"    ROC-AUC     : {auc:.4f}")
    print(f"    Avg Precision: {ap:.4f}")
 
 
# ── Pick best model by F1 ──────────────────────────────────────────────────
best_name  = max(results, key=lambda n: results[n]["f1"])
best       = results[best_name]
best_model = best["model"]
 
print("\n" + "="*60)
print(f"  BEST MODEL: {best_name}")
print(f"  F1={best['f1']*100:.2f}%  Recall={best['recall']*100:.2f}%  AUC={best['auc']:.4f}")
print("="*60)
 
print(f"\n  Detailed report — {best_name}:")
print(classification_report(y_test, best["y_pred"],
                             target_names=["NORMAL", "ABNORMAL"]))
 
# ── Fault detection summary ───────────────────────────────────────────────
total_faults   = (y_test == 1).sum()
faults_caught  = int(best["y_pred"][y_test == 1].sum())
faults_missed  = total_faults - faults_caught
 
print(f"  Faults in test set : {total_faults}")
print(f"  Faults caught      : {faults_caught}  ✅")
print(f"  Faults missed      : {faults_missed}  ❌")
 
# ── Comparison table ──────────────────────────────────────────────────────
print("\n  Model Comparison:")
print(f"  {'Model':<24} {'Accuracy':>9} {'Precision':>10} {'Recall':>8} {'F1':>8} {'AUC':>8}")
print("  " + "─"*72)
for name, res in results.items():
    tag = " ← BEST" if name == best_name else ""
    print(f"  {name:<24} {res['accuracy']*100:>8.2f}% "
          f"{res['precision']*100:>9.2f}% "
          f"{res['recall']*100:>7.2f}% "
          f"{res['f1']*100:>7.2f}% "
          f"{res['auc']:>8.4f}{tag}")
print("  " + "─"*72)
 
 
# ══════════════════════════════════════════════════════════════════════════════
# STEP 8 — SAVE PLOTS & MODEL
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  STEP 8: Saving Plots & Model Files")
print("="*60)
 
# ── Plot 1: Evaluation charts ─────────────────────────────────────────────
fig, axes = plt.subplots(1, 4, figsize=(22, 5))
fig.suptitle(f"Pump Sensor — {best_name}", fontsize=13, fontweight="bold")
 
# ROC Curve
ax = axes[0]
for name, res in results.items():
    fpr, tpr, _ = roc_curve(y_test, res["y_prob"])
    ax.plot(fpr, tpr, lw=2, label=f"{name} (AUC={res['auc']:.3f})")
ax.plot([0, 1], [0, 1], "k--", lw=0.8, label="Random baseline")
ax.set_xlabel("False Positive Rate")
ax.set_ylabel("True Positive Rate (Recall)")
ax.set_title("ROC Curve\n(higher = better)")
ax.legend(fontsize=8)
ax.grid(alpha=0.3)
 
# Precision-Recall Curve
ax = axes[1]
for name, res in results.items():
    p, r, _ = precision_recall_curve(y_test, res["y_prob"])
    ax.plot(r, p, lw=2, label=f"{name} (AP={res['ap']:.3f})")
ax.axhline(y_test.mean(), color="k", linestyle="--", lw=0.8,
           label=f"Baseline ({y_test.mean():.3f})")
ax.set_xlabel("Recall")
ax.set_ylabel("Precision")
ax.set_title("Precision-Recall Curve\n(better for imbalanced data)")
ax.legend(fontsize=8)
ax.grid(alpha=0.3)
 
# Confusion Matrix
ax = axes[2]
cm = confusion_matrix(y_test, best["y_pred"])
ConfusionMatrixDisplay(cm, display_labels=["NORMAL", "ABNORMAL"]).plot(
    ax=ax, colorbar=False, cmap="Blues"
)
tn, fp, fn, tp = cm.ravel()
ax.set_title(f"Confusion Matrix — {best_name}\n"
             f"TP={tp} (caught)  FN={fn} (missed)")
 
# Feature Importance
ax = axes[3]
if hasattr(best_model, "feature_importances_"):
    imp = pd.Series(best_model.feature_importances_, index=feature_names)
    imp.sort_values(ascending=True).tail(20).plot(kind="barh", ax=ax, color="#185FA5")
    ax.set_title("Top 20 Feature Importances")
else:
    coef = pd.Series(np.abs(best_model.coef_[0]), index=feature_names)
    coef.sort_values(ascending=True).tail(20).plot(kind="barh", ax=ax, color="#185FA5")
    ax.set_title("Top 20 Feature Coefficients")
ax.set_xlabel("Importance")
 
plt.tight_layout()
plt.savefig("results/pump_evaluation.png", dpi=150, bbox_inches="tight")
plt.close()
print("  Saved → results/pump_evaluation.png")
 
# ── Plot 2: Model comparison bars ─────────────────────────────────────────
fig2, axes2 = plt.subplots(1, 2, figsize=(12, 4))
fig2.suptitle("Model Comparison", fontsize=13, fontweight="bold")
names  = list(results.keys())
colors = ["#1D9E75" if n == best_name else "#B4B2A9" for n in names]
 
for ax, metric, title, ylabel in zip(
    axes2,
    ["f1",    "auc"],
    ["F1 Score (main metric)", "ROC-AUC"],
    ["F1",    "AUC"]
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
plt.savefig("results/pump_model_comparison.png", dpi=150, bbox_inches="tight")
plt.close()
print("  Saved → results/pump_model_comparison.png")
 
# ── Save model files ──────────────────────────────────────────────────────
joblib.dump(best_model,    "pump_model.pkl")
joblib.dump(scaler,        "pump_scaler.pkl")
joblib.dump(feature_names, "pump_feature_names.pkl")
print("  Saved → pump_model.pkl  pump_scaler.pkl  pump_feature_names.pkl")
 
print("\n" + "="*60)
print("  DONE!")
print(f"  Best model : {best_name}")
print(f"  F1 Score   : {best['f1']*100:.2f}%")
print(f"  Recall     : {best['recall']*100:.2f}%  (faults caught)")
print(f"  ROC-AUC    : {best['auc']:.4f}")
print("  Plots saved in: results/")
print("="*60)