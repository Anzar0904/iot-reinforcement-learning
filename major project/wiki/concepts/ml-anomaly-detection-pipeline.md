---
date: 2026-10-31
type: concept
tags:
  - concept
  - machine-learning
  - anomaly-detection
  - edge-ai
ai-first: true
---

## For future Claude
This note details the design of Pillar 2: ML-Based Anomaly Detection, synthesizing streaming feature extraction patterns from ncl427/ML-based-Anomaly-Detection with adaptive thresholding principles from open-edge-platform/anomalib.

# ML-Based IoMT Anomaly Detection Pipeline

## 1. System Pipeline Architecture
Combining the real-time sliding window data processor from `ncl427` with the edge scoring and thresholding architecture from `anomalib`:

```
Raw Telemetry Event 
       │
       ▼
[Feature Extraction & Scaling] (Sliding Window, StandardScaler)
       │
       ▼
[Model Inference Ensemble]
  ├── Isolation Forest / One-Class SVM (Unsupervised Base)
  ├── K-Means Cluster Distance (ncl427 pattern)
  └── Discrepancy from Digital Twin
       │
       ▼
[Continuous Anomaly Scoring] s in [0.0, 1.0]
       │
       ▼
[Adaptive Thresholding] (anomalib F1Adaptive / Dynamic Quantile)
       ├── s < Th_warn        --> NORMAL (Status 0)
       ├── Th_warn <= s < Th_crit --> SUSPICIOUS / WARNING (Status 1)
       └── s >= Th_crit       --> CRITICAL ANOMALY (Status 2)
```

## 2. Feature Vector Engineering
From patient telemetry, we construct an 8-dimensional feature vector:
1. `heart_rate`: Raw instantaneous beats per minute.
2. `systolic_bp`: Systolic arterial pressure.
3. `diastolic_bp`: Diastolic arterial pressure.
4. `body_temperature`: Core temperature in °C.
5. `oxygen_saturation`: Blood oxygen percentage.
6. `spatial_dispersion`: Euclidean/Haversine distance from safe baseline geofence center.
7. `rate_of_change_hr`: $\frac{HR_t - HR_{t-1}}{\Delta t}$ (detects sudden cardiac spikes).
8. `rate_of_change_bp`: $\frac{BP_t - BP_{t-1}}{\Delta t}$ (detects hypertensive crisis).

## 3. Adaptive Thresholding (Anomalib Pattern)
Rather than relying on rigid physiological thresholds which cause false alarms across heterogeneous patient baselines:
- **Offline Phase**: Calculate empirical distribution of scores $P(s)$ on nominal telemetry from `HealthyPerson`.
- **Dynamic Threshold Selection**:
  - $Th_{warn} = \mu_s + 2.0 \cdot \sigma_s$ (95th percentile equivalent).
  - $Th_{crit} = \mu_s + 3.5 \cdot \sigma_s$ (99.9th percentile equivalent).
- Output: Anomaly classification tuple `(anomaly_score, classification_label, feature_attributions)`.

## Related Notes
- [[wiki/concepts/external-repo-evaluations]]
- [[wiki/concepts/five-pillar-security-architecture]]
- [[wiki/concepts/deep-rl-threat-response-iotwarden]]
