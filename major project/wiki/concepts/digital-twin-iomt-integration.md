---
date: 2026-10-31
type: concept
tags:
  - concept
  - digital-twin
  - architecture
  - iot
ai-first: true
---

## For future Claude
This note defines the design and implementation of Pillar 1: Patient Digital Twin Integration, informed by the synchronization architecture of Open-Source-Digital-Twin/digital-twin-playground. It specifies how physical sensor streams synchronize with virtual physiological models.

# Patient Digital Twin IoMT Integration

## 1. Architectural Concept
Inspired by `digital-twin-playground`, a Digital Twin acts as a persistent virtual counterpart to a physical IoT medical device and patient. In our healthcare security system, the Digital Twin fulfills two vital roles:
1. **Clinical State Estimation**: Tracks historical trend lines, organ strain, and baseline evolution.
2. **Cyber-Physical Discrepancy Detection**: Predicts expected next-step physiological values. Discrepancies between physical sensor readings and digital twin simulations signal potential sensor malfunction, network injection, or physical spoofing.

```
+--------------------+        MQTT (TLS 8883)        +------------------------+
| Physical Patient   |  ===========================>  |  Digital Twin Engine   |
| IoT Sensor Node    |                               |  (Virtual State Mirror)|
+--------------------+                               +-----------+------------+
                                                                 |
                                                                 v
                                                     [Physiological Predictor]
                                                                 |
               +-------------------------------------------------+
               |
               v
       Discrepancy Score:  || Actual(t) - Predicted(t) ||
               |
               v
       Fed to Anomaly Detector & RL Threat Response Agent
```

## 2. Digital Twin State Representation
For each monitored patient $i$, the twin maintains:
- **Baseline Vitals Profile**: Resting Heart Rate, Baseline BP, Baseline SpO2.
- **Dynamic State Vector**:
  $$\mathbf{S}_t^{(i)} = \langle HR_t, BP_{sys,t}, BP_{dia,t}, Temp_t, SpO_{2,t}, Lat_t, Lon_t, Timestamp_t \rangle$$
- **Derived Clinical Indices**:
  - *Mean Arterial Pressure (MAP)*: $MAP = \frac{1}{3} BP_{sys} + \frac{2}{3} BP_{dia}$
  - *Rate Pressure Product (RPP / Myocardial Workload)*: $RPP = HR \times BP_{sys}$
  - *Geofence Radius & Wandering Velocity*: $v_{wander} = \frac{\Delta \text{distance}}{\Delta t}$

## 3. Synchronization Protocol
Adapted from the Protobuf specifications in `digital-twin-playground/proto/digital_twin.proto`:
- Telemetry events stream in real-time over MQTT topic `healthcare/sensor_data`.
- The Digital Twin server updates its in-memory state and broadcasts state updates to subscribed monitoring dashboards and the RL security agent.
- Closed-loop feedback allows the RL agent to issue control commands back to the virtual/physical device (e.g. modify sampling rate, trigger local sensor reboot).

## Related Notes
- [[wiki/concepts/external-repo-evaluations]]
- [[wiki/concepts/five-pillar-security-architecture]]
- [[wiki/projects/iot-healthcare-security]]

## Current Implementation
`iot_reinforcement_learning/core.py` implements a per-patient estimator with EWMA state updates, MAD-scaled residuals, MAP/RPP indices, geofence distance, and patient-specific alert thresholds. This is a synthetic simulation component, not a physiologically validated clinical twin. SQLite WAL behavior is documented by SQLite: https://www.sqlite.org/wal.html. See also [[wiki/concepts/research-benchmark-evaluation-50k]].
