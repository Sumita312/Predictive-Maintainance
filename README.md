# AI/ML-Based Predictive Maintenance System for Refinery Equipment

## Overview

The **AI/ML-Based Predictive Maintenance System** is an intelligent industrial maintenance platform designed for refinery equipment such as pumps, compressors, motors, and turbines. The system analyzes historical and simulated real-time sensor data to predict equipment failures before breakdowns occur.

By leveraging Machine Learning algorithms such as Logistic Regression, Random Forest, and XGBoost, the system provides early maintenance warnings, machine health assessment, and failure probability estimation, helping industries reduce downtime, maintenance costs, and operational risks.

---

## Project Objectives

* Monitor refinery equipment continuously.
* Predict potential equipment failures before they occur.
* Calculate machine health scores.
* Generate maintenance alerts and risk levels.
* Visualize equipment performance through interactive dashboards.
* Demonstrate predictive maintenance using AI/ML techniques.

---

## Equipment Covered

### Pumps

* Pressure Sensors
* Flow Sensors
* Vibration Sensors
* Temperature Sensors

### Compressors

* Pressure Monitoring
* Air Flow Monitoring
* Vibration Analysis

### Motors

* Rotational Speed (RPM)
* Torque
* Temperature
* Tool Wear

### Turbines

* Operational Parameters
* Thermal Conditions
* Mechanical Performance Indicators

---

## Technology Stack

### Frontend

* Next.js
* React.js
* Tailwind CSS

### Backend

* Python (API & ML Processing)

### Database

* MySQL

### Machine Learning

* Logistic Regression
* Random Forest
* XGBoost
* Scikit-Learn
* Pandas
* NumPy

### Data Visualization

* Recharts
* Chart.js

---

## System Architecture

```text
Equipment Sensor Data
          │
          ▼
   Data Generator
 (Historical + Live)
          │
          ▼
      MySQL Database
          │
          ▼
    Python ML Engine
          │
          ▼
 Failure Prediction Models
          │
          ▼
 REST APIs
          │
          ▼
 Next.js Dashboard
          │
          ▼
 Health Scores, Alerts,
 Risk Levels & Analytics
```

---

## Dataset Sources

### Pump Dataset

* 52 Sensor Channels
* 220,000+ Sensor Readings

### Compressor Dataset

* MetroPT-3 Dataset
* 1.5 Million Time-Series Records

### Motor Dataset

* AI4I 2020 Predictive Maintenance Dataset

### Turbine Dataset

* Naval Propulsion Plant Dataset

---

## Features

### Dashboard

* Real-Time Sensor Monitoring
* Equipment Status Overview
* Failure Probability Visualization
* Health Score Tracking
* Historical Trend Analysis

### Predictive Maintenance

* Failure Prediction
* Anomaly Detection
* Risk Classification
* Remaining Useful Life Estimation (Future Enhancement)

### Alerts

* Critical Risk Alerts
* Maintenance Recommendations
* Equipment Health Notifications

---

# Simulating Live Data

Since actual refinery sensor streams are unavailable during development, live sensor data is simulated.

## Data Flow

1. Historical sensor data is stored in MySQL.
2. A Python scheduler runs every 2 minutes.
3. Random but realistic sensor values are generated.
4. Generated values are inserted into the database.
5. ML models analyze the latest records.
6. Dashboard automatically refreshes and displays updated predictions.

---

## Live Data Simulation Logic

Every 2 minutes, a background Python script generates new readings for:

* Temperature
* Pressure
* Vibration
* RPM
* Torque
* Power Consumption

Example:

```python
import random

sensor_data = {
    "temperature": round(random.uniform(45, 90), 2),
    "pressure": round(random.uniform(15, 40), 2),
    "vibration": round(random.uniform(0.2, 5.0), 2),
    "rpm": random.randint(1200, 3500),
    "torque": round(random.uniform(10, 80), 2),
    "power": round(random.uniform(50, 500), 2)
}
```

---

## Automatic Data Generation

A scheduler continuously inserts data every 2 minutes.

Example:

```python
import time

while True:
    generate_sensor_data()
    store_in_mysql()
    time.sleep(120)
```

This creates a realistic environment where the dashboard behaves as if actual refinery sensors are sending data continuously.

---

## Machine Learning Workflow

### Step 1: Data Collection

Sensor readings are collected from:

* Historical datasets
* Simulated live streams

### Step 2: Data Preprocessing

* Missing Value Handling
* Outlier Detection
* Feature Scaling
* Feature Selection

### Step 3: Model Training

Models Used:

1. Logistic Regression
2. Random Forest
3. XGBoost

### Step 4: Model Evaluation

Metrics:

* Accuracy
* Precision
* Recall
* F1 Score
* ROC-AUC

### Step 5: Prediction

Models generate:

* Failure Probability
* Risk Level
* Health Score

---

## Equipment Health Score Formula

Example:

```text
Health Score = 100 - Failure Probability(%)
```

Example:

```text
Failure Probability = 12%

Health Score = 88%
```

---

## Database Design

### equipment

| Column         | Type    |
| -------------- | ------- |
| id             | INT     |
| equipment_name | VARCHAR |
| equipment_type | VARCHAR |

### sensor_data

| Column       | Type     |
| ------------ | -------- |
| id           | INT      |
| equipment_id | INT      |
| timestamp    | DATETIME |
| temperature  | FLOAT    |
| pressure     | FLOAT    |
| vibration    | FLOAT    |
| rpm          | INT      |
| torque       | FLOAT    |
| power        | FLOAT    |

### predictions

| Column              | Type     |
| ------------------- | -------- |
| id                  | INT      |
| equipment_id        | INT      |
| prediction_time     | DATETIME |
| failure_probability | FLOAT    |
| health_score        | FLOAT    |
| risk_level          | VARCHAR  |

---

## Expected Outcomes

* Early Failure Detection
* Reduced Downtime
* Lower Maintenance Costs
* Improved Equipment Reliability
* Enhanced Operational Safety
* Data-Driven Maintenance Planning

---

## Future Enhancements

* IoT Sensor Integration
* MQTT/Kafka Streaming
* Deep Learning Models (LSTM)
* Remaining Useful Life Prediction
* Mobile Application
* Multi-Refinery Monitoring
* Digital Twin Integration

---

## Conclusion

This project demonstrates the practical application of Artificial Intelligence and Machine Learning in industrial refinery maintenance. By analyzing equipment sensor data and predicting failures before breakdowns occur, the system enables proactive maintenance strategies that improve reliability, safety, and operational efficiency.

Developed as an internship project for:

**Indian Oil Corporation Limited (IOCL) – Guwahati Refinery, Assam**
