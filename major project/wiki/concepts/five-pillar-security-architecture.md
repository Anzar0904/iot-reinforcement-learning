---
date: 2026-10-31
type: concept
tags:
  - concept
  - architecture
  - security
  - machine-learning
  - reinforcement-learning
  - digital-twin
ai-first: true
---

## For future Claude
This note defines the system architecture and maps the five security pillars to the current project. It combines intended design with implementation evidence; where a feature remains a proposal, that distinction is called out. See [[wiki/projects/iot-healthcare-security]] for current status.

# Five-Pillar IoMT Security Architecture

```
+-----------------------------------------------------------------------------------+
|                           5-Pillar Security Framework                             |
+-----------------------------------------------------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
+-------v-------+                 +-------v-------+                 +-------v-------+
|  Pillar 1:    |                 |  Pillar 2:    |                 |  Pillar 3:    |
| Digital Twin  |                 |  ML Anomaly   |                 | Secure Auth   |
| (State Sync)  |                 |  (Detection)  |                 | (mTLS / X.509)|
+-------+-------+                 +-------+-------+                 +-------+-------+
        |                                 |                                 |
        +---------------------------------+---------------------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                +-------v-------+                   +-------v-------+
                |  Pillar 4:    |                   |  Pillar 5:    |
                | Data Integrity|                   | RL Threat     |
                | (HMAC / Sign) |                   | (Auto-Mitigate|
                +---------------+                   +---------------+
```

## 1. Digital Twin Integration (Pillar 1)
- **Role**: Maintains a dynamic virtual representation (shadow) of each physical medical IoT sensor and patient.
- **Mechanism**:
  - Telemetry ingested via MQTT updates state variables in real time.
  - Computes secondary derived metrics: organ strain index, cardiac workload, wandering drift velocity.
  - Predicts expected next-step telemetry intervals; discrepancies between physical device reading and twin prediction serve as secondary anomaly inputs.

## 2. ML-Based Anomaly Detection (Pillar 2)
- **Role**: Continuously screens multi-modal telemetry streams for clinical emergencies and cyber-physical tampering.
- **Signal Modalities**:
  - Physiological vitals: HR, Systolic/Diastolic BP, Body Temp, SpO2.
  - Spatial dynamics: GPS coordinates, speed of drift, geofence radius.
- **Model Candidates**:
  - Unsupervised: Isolation Forest, Local Outlier Factor (LOF), Autoencoders for baseline deviations.
  - Supervised/Time-Series: LSTM / GRU networks for temporal sequence anomaly detection.

## 3. Secure Device Authentication (Pillar 3)
- **Role**: Guarantees zero-trust identity verification for all edge sensor nodes before admitting data to the broker.
- **Mechanism**:
  - Mutual TLS (mTLS) with X.509 cryptographic device certificates.
  - Elimination of static credentials in code; dynamic device identity validation.
  - Hardware-unique identifiers / cryptographic token renewal.

## 4. Data Integrity Protection (Pillar 4)
- **Role**: Prevents Man-in-the-Middle (MITM) manipulation, packet replay, and telemetry tampering.
- **Mechanism**:
  - Payload hashing: SHA-256 / SHA-3 cryptographic digests.
  - Keyed HMAC (HMAC-SHA256) or ECDSA digital signatures attached to each telemetry frame.
  - Nonces and strict timestamp expiration checking to invalidate replay attacks.

## 5. RL-Based Threat Response (Pillar 5)
- **Role**: Autonomous decision-making engine that selects mitigation policies in response to security and health incidents.
- **RL Formulation**:
  - **State Space**: Anomaly severity score, authentication error counts, message transmission frequency, telemetry drift magnitude, patient criticality status.
  - **Action Space**:
    - `0: PASS / NORMAL_MONITORING`
    - `1: INCREASE_SAMPLING_RATE` (heightened diagnostic resolution)
    - `2: TRIGGER_CLINICAL_ALERT` (doctor / caregiver dispatch)
    - `3: RATE_LIMIT_NODE` (mitigate denial of service / flood)
    - `4: QUARANTINE_NODE` (isolate compromised device / revoke token)
  - **Reward Function**: High reward for rapid true-positive containment; penalties for false alarms (alert fatigue) and delayed response to true patient health crises.

## Related Notes
- [[wiki/projects/iot-healthcare-security]]
- [[wiki/concepts/iot-healthcare-telemetry-simulation]]
- [[wiki/decisions/2026-10-31-baseline-code-reuse-and-mobile-app-exclusion]]

## Implementation Status (workspace snapshot, 2026-11-01)
- **Pillar 1, Digital Twin:** implemented in `iot_reinforcement_learning/core.py` as a per-patient EWMA/MAD estimator with MAP, RPP, and geofence distance outputs.
- **Pillar 2, anomaly detection:** implemented in `iot_reinforcement_learning/ml_detector.py` using Isolation Forest where available and a fallback path.
- **Pillar 3, device authentication:** this workspace snapshot does not show mTLS/X.509 certificate provisioning in the active Python pipeline; treat it as a design requirement, not completed capability.
- **Pillar 4, data integrity:** HMAC-SHA256, freshness, sequence, and replay checks are implemented in `CryptoEngine`. HMAC does not itself provide transport encryption or device PKI.
- **Pillar 5, threat response:** action selection and a deterministic safety shield are implemented in `iot_reinforcement_learning/rl_defense.py`; evaluate the learned-policy claims separately from the deterministic decision path.

The architecture remains a research prototype over synthetic data. It is not a clinical device or a validated patient-care system. The Python HMAC API recommends constant-time digest comparison: https://docs.python.org/3/library/hmac.html. The DQN component can be compared with the official PyTorch tutorial: https://docs.pytorch.org/tutorials/intermediate/reinforcement_q_learning.html.

### Evaluation interpretation
The benchmark script labels method 3 “DQN,” but the measured live action path calls `DQNAgent.select_action`, whose implementation uses explicit threshold branches; it does not compute Q-values from the trained checkpoint. The safety shield also participates in the measured action. Therefore, the 50,000-cycle result is evidence about the combined threshold policy and shield under the script's synthetic scenarios, not an isolated evaluation of a learned DQN policy. See [[wiki/concepts/research-benchmark-evaluation-50k]].
