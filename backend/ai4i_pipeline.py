"""
AI4I 2020 Predictive Maintenance — Full ML Pipeline
=====================================================
Dataset columns (your CSV):
  UDI, Product ID, Type, Air temperature [K], Process temperature [K],
  Rotational speed [rpm], Torque [Nm], Tool wear [min], Target, Failure Type

Run     : python ai4i_pipeline.py
Outputs : model.pkl, scaler.pkl, label_encoder.pkl, feature_names.pkl, results/
"""

import os, warnings, joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, roc_curve, ConfusionMatrixDisplay
)
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

warnings.filterwarnings("ignore")
os.makedirs("results", exist_ok=True)

print("=" * 60)
print("  AI4I 2020 Predictive Maintenance Pipeline")
print("=" * 60)


# ─────────────────────────────────────────────────────────────
# 1. LOAD DATA
# ─────────────────────────────────────────────────────────────
print("\n[1/7] Loading data...")

df = pd.read_csv("ai4i2020.csv", encoding="utf-8-sig")   # utf-8-sig strips BOM

# Exact column names from your file:
#   UDI, Product ID, Type,
#   Air temperature [K], Process temperature [K],
#   Rotational speed [rpm], Torque [Nm], Tool wear [min],
#   Target, Failure Type

print(f"  Shape   : {df.shape}")
print(f"  Columns : {df.columns.tolist()}")
print(f"\n  Target value counts:")
print(df["Target"].value_counts())
print(f"\n  Failure Type breakdown:")
print(df["Failure Type"].value_counts())


# ─────────────────────────────────────────────────────────────
# 2. CLEAN & PREPROCESS
# ─────────────────────────────────────────────────────────────
print("\n[2/7] Cleaning data...")

# Drop ID columns
df.drop(columns=["UDI", "Product ID"], inplace=True)

# Encode product quality type  L / M / H  → 0 / 1 / 2
le_type = LabelEncoder()
df["Type"] = le_type.fit_transform(df["Type"])

# Check missing values
missing = df.isnull().sum()
if missing.any():
    print("  Missing values — filling with median:")
    print(missing[missing > 0])
    df.fillna(df.median(numeric_only=True), inplace=True)
else:
    print("  No missing values found.")

# Sensor columns (exact names)
sensor_cols = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]",
]

# Outlier removal — IQR method on sensor columns only
before = len(df)
for col in sensor_cols:
    Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
    IQR = Q3 - Q1
    df = df[(df[col] >= Q1 - 1.5 * IQR) & (df[col] <= Q3 + 1.5 * IQR)]

df.reset_index(drop=True, inplace=True)
print(f"  Rows after outlier removal: {len(df)}  (removed {before - len(df)})")


# ─────────────────────────────────────────────────────────────
# 3. FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────
print("\n[3/7] Engineering features...")

air    = "Air temperature [K]"
proc   = "Process temperature [K]"
speed  = "Rotational speed [rpm]"
torque = "Torque [Nm]"
wear   = "Tool wear [min]"

# Temperature differential — abnormal heat buildup indicator
df["temp_diff"] = df[proc] - df[air]

# Mechanical power proxy  P = τ × ω  (Watts)
df["power_w"] = df[torque] * df[speed] * (2 * np.pi / 60)

# Torque × wear interaction — stress under high wear
df["torque_x_wear"] = df[torque] * df[wear]

# Speed × process temp — combined thermal-speed stress
df["speed_x_temp"] = df[speed] * df[proc]

# Wear stage bins: 0-100 | 101-200 | 201-300 | 300+
df["wear_stage"] = pd.cut(
    df[wear], bins=[0, 100, 200, 300, np.inf], labels=[0, 1, 2, 3],
    include_lowest=True
).astype(int)

print("  Added: temp_diff, power_w, torque_x_wear, speed_x_temp, wear_stage")
print(f"  Total features now: {df.shape[1]}")


# ─────────────────────────────────────────────────────────────
# 4. DEFINE X / y   AND   HANDLE CLASS IMBALANCE
# ─────────────────────────────────────────────────────────────
print("\n[4/7] Handling class imbalance with SMOTE...")

# Binary target is "Target" column (0 = no failure, 1 = failure)
X = df.drop(columns=["Target", "Failure Type"])
y = df["Target"]

feature_names = list(X.columns)

print(f"  Before SMOTE → 0: {(y==0).sum()}  1: {(y==1).sum()}")

smote = SMOTE(random_state=42)
X_bal, y_bal = smote.fit_resample(X, y)

print(f"  After  SMOTE → 0: {(y_bal==0).sum()}  1: {(y_bal==1).sum()}")


# ─────────────────────────────────────────────────────────────
# 5. TRAIN / TEST SPLIT   &   SCALING
# ─────────────────────────────────────────────────────────────
print("\n[5/7] Splitting and scaling...")

X_train, X_test, y_train, y_test = train_test_split(
    X_bal, y_bal, test_size=0.20, random_state=42, stratify=y_bal
)

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)

print(f"  Train: {X_train_sc.shape}  |  Test: {X_test_sc.shape}")


# ─────────────────────────────────────────────────────────────
# 6. TRAIN & EVALUATE MODELS
# ─────────────────────────────────────────────────────────────
print("\n[6/7] Training and evaluating models...")

models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
    "Random Forest":       RandomForestClassifier(
                               n_estimators=200, max_depth=12,
                               class_weight="balanced", n_jobs=-1, random_state=42),
    "Gradient Boosting":   GradientBoostingClassifier(
                               n_estimators=200, max_depth=5,
                               learning_rate=0.1, random_state=42),
    "XGBoost":             XGBClassifier(
                               n_estimators=200, max_depth=6,
                               learning_rate=0.1, eval_metric="logloss",
                               n_jobs=-1, random_state=42),
}

results = {}
for name, model in models.items():
    model.fit(X_train_sc, y_train)
    y_pred = model.predict(X_test_sc)
    y_prob = model.predict_proba(X_test_sc)[:, 1]
    auc    = roc_auc_score(y_test, y_prob)
    cv     = cross_val_score(model, X_train_sc, y_train, cv=5, scoring="roc_auc")
    results[name]=  {
        "model": model, "y_pred": y_pred, "y_prob": y_prob,
        "auc": auc, "cv_mean": cv.mean(), "cv_std": cv.std(),
    }
    print(f"  {name:<25}  AUC={auc:.4f}  CV={cv.mean():.4f}±{cv.std():.4f}")

# Pick best by AUC
best_name  = max(results, key=lambda n: results[n]["auc"])
best       = results[best_name]
best_model = best["model"]
print(f"\n  ✓ Best model : {best_name}  (AUC={best['auc']:.4f})")
print(f"\n  Classification report — {best_name}:")
print(classification_report(y_test, best["y_pred"],
                             target_names=["No Failure", "Failure"]))


# ─────────────────────────────────────────────────────────────
# 7. PLOTS   &   SAVE ARTEFACTS
# ─────────────────────────────────────────────────────────────
print("[7/7] Saving plots and model artefacts...")

# ── Plot 1: ROC curves + confusion matrix + feature importance ──
fig, axes = plt.subplots(1, 3, figsize=(18, 5))
fig.suptitle(f"AI4I 2020 — {best_name}", fontsize=14, fontweight="bold")

# ROC curves
ax = axes[0]
for name, res in results.items():
    fpr, tpr, _ = roc_curve(y_test, res["y_prob"])
    ax.plot(fpr, tpr, label=f"{name} ({res['auc']:.3f})")
ax.plot([0,1],[0,1],"k--",lw=0.8)
ax.set_xlabel("False Positive Rate"); ax.set_ylabel("True Positive Rate")
ax.set_title("ROC Curves"); ax.legend(fontsize=8); ax.grid(alpha=0.3)

# Confusion matrix
ax = axes[1]
cm = confusion_matrix(y_test, best["y_pred"])
ConfusionMatrixDisplay(cm, display_labels=["No Failure","Failure"]).plot(ax=ax, colorbar=False)
ax.set_title(f"Confusion Matrix\n{best_name}")

# Feature importance
ax = axes[2]
if hasattr(best_model, "feature_importances_"):
    imp = pd.Series(best_model.feature_importances_, index=feature_names)
    imp.sort_values(ascending=True).tail(15).plot(kind="barh", ax=ax, color="#1D9E75")
    ax.set_title("Feature Importance (top 15)"); ax.set_xlabel("Importance")
else:
    coef = pd.Series(np.abs(best_model.coef_[0]), index=feature_names)
    coef.sort_values(ascending=True).tail(15).plot(kind="barh", ax=ax, color="#185FA5")
    ax.set_title("|Coefficients| (top 15)")

plt.tight_layout()
plt.savefig("results/ai4i_evaluation.png", dpi=150, bbox_inches="tight")
plt.close()
print("  Saved → results/ai4i_evaluation.png")

# ── Plot 2: Model comparison bar chart ──
fig2, ax2 = plt.subplots(figsize=(8, 4))
names  = list(results.keys())
aucs   = [results[n]["auc"] for n in names]
colors = ["#1D9E75" if n == best_name else "#B4B2A9" for n in names]
bars   = ax2.bar(names, aucs, color=colors, edgecolor="white")
ax2.set_ylim(0.85, 1.0); ax2.set_ylabel("ROC-AUC")
ax2.set_title("Model Comparison — ROC-AUC")
ax2.bar_label(bars, fmt="%.4f", padding=3, fontsize=10)
ax2.tick_params(axis="x", rotation=15); ax2.grid(axis="y", alpha=0.3)
plt.tight_layout()
plt.savefig("results/ai4i_model_comparison.png", dpi=150, bbox_inches="tight")
plt.close()
print("  Saved → results/ai4i_model_comparison.png")

# ── Save model artefacts ──
joblib.dump(best_model,    "model.pkl")
joblib.dump(scaler,        "scaler.pkl")
joblib.dump(le_type,       "label_encoder.pkl")
joblib.dump(feature_names, "feature_names.pkl")
print("  Saved → model.pkl, scaler.pkl, label_encoder.pkl, feature_names.pkl")


# ─────────────────────────────────────────────────────────────
# INFERENCE HELPER  (copy this logic into flask_api.py)
# ─────────────────────────────────────────────────────────────
def predict_single(product_type, air_temp_k, proc_temp_k, rpm, torque_nm, tool_wear_min):
    """
    product_type   : "L", "M", or "H"
    air_temp_k     : float  e.g. 298.1
    proc_temp_k    : float  e.g. 308.6
    rpm            : float  e.g. 1500
    torque_nm      : float  e.g. 42.8
    tool_wear_min  : float  e.g. 200
    """
    _model   = joblib.load("model.pkl")
    _scaler  = joblib.load("scaler.pkl")
    _le      = joblib.load("label_encoder.pkl")
    _fnames  = joblib.load("feature_names.pkl")

    t         = _le.transform([product_type])[0]
    temp_diff = proc_temp_k - air_temp_k
    power_w   = torque_nm * rpm * (2 * np.pi / 60)
    tq_wear   = torque_nm * tool_wear_min
    sp_temp   = rpm * proc_temp_k
    wear_stg  = int(pd.cut([tool_wear_min], bins=[0,100,200,300,np.inf], labels=[0,1,2,3],include_lowest=True)[0])

    row    = pd.DataFrame([[t, air_temp_k, proc_temp_k, rpm, torque_nm,
                             tool_wear_min, temp_diff, power_w, tq_wear,
                             sp_temp, wear_stg]], columns=_fnames)
    row_sc = _scaler.transform(row)
    prob   = float(_model.predict_proba(row_sc)[0, 1])
    label  = int(_model.predict(row_sc)[0])

    return {
        "failure_probability": round(prob, 4),
        "health_score":        round((1 - prob) * 100, 1),
        "alert":               label == 1,
        "risk_level":          "HIGH" if prob > 0.7 else "MEDIUM" if prob > 0.3 else "LOW",
    }


# ── Demo ──
print("\n── Demo prediction ──────────────────────────────────────")
demo = predict_single("M", 298.1, 308.6, 1500, 42.8, 200)
print(f"  Input : type=M | air=298.1K | proc=308.6K | rpm=1500 | torque=42.8 | wear=200")
print(f"  Output: {demo}")

print("\n" + "=" * 60)
print("  Pipeline complete!")
print("  Check results/ folder for evaluation plots.")
print("  Run  python flask_api.py  when ready for the API.")
print("=" * 60)
