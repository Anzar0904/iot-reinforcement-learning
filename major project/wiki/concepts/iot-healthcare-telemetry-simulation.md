---
date: 2026-10-31
type: concept
tags:
  - concept
  - iot
  - simulation
  - security
ai-first: true
---

## For future Claude
This note documents the technical anatomy, usable code assets, schema definitions, and known bugs of the baseline IoT healthcare telemetry simulation from Divyansh121699/IoT-Based-Healthcare-Security-Project. Use this to construct data ingestion, digital twins, and ML anomaly pipelines without reinventing data generation models.

# IoT Healthcare Telemetry Simulation Engine

## 1. Usable Baseline Components

The upstream repository provides a Python-based synthetic generator for physiological and spatial health vitals:

### Physiological Baseline (`baseline_health.py`)
- Standard resting parameters encapsulated in dataclass `BaselineHealth`:
  - `heart_rate`: 70 bpm
  - `systolic_bp`: 100 mmHg
  - `diastolic_bp`: 75 mmHg
  - `body_temperature`: 36.8 °C
  - `oxygen_saturation`: 99 %

### Patient Persona Models (`person/`)
- **`HealthyPerson`**: Simulates bounded perturbations around baseline vitals with minor location drift around `(38.8462, 77.3064)`.
- **`PersonWithHeartIssue`**: Implements probabilistic acute events (10% chance) simulating tachycardia (`HR 120-180 bpm`) and hypertensive crisis (`Systolic 160-220 mmHg`, `Diastolic 100-130 mmHg`).
- **`AlzheimerPatient`**: Simulates stress-induced fluctuating vitals and wandering behavior (80% near-home wandering `offset 0.01`, 20% erratic disorientation wander `offset 0.1`).

### Network & Transport Layer
- **Transport**: MQTT over TLS on secure port `8883` targeting HiveMQ Cloud via `paho-mqtt`.
- **Topic**: `healthcare/sensor_data`

### JSON Payload Schema
```json
{
  "device_id": "sensor_123",
  "timestamp": "2026-10-31 21:00:00",
  "heart_rate": 78,
  "blood_pressure_systolic": 120,
  "blood_pressure_diastolic": 80,
  "body_temperature": 36.5,
  "oxygen_saturation": 98,
  "lat": 38.8462,
  "long": 77.3064
}
```

---

## 2. Issues & Necessary Refactoring

When integrating this code into our active codebase:
1. **Typo Fix**: Upstream code misspelled longitude as `self.longtitude` in `healthy_person.py` and `heart_issued_person.py`.
2. **Credential Decoupling**: Upstream hardcodes HiveMQ Cloud credentials in `mqtt_config.py`. Refactor to load from environment variables (`.env`).
3. **Asynchronous Generation**: Replace the blocking `while True: ... time.sleep(20)` loop with `asyncio` tasks so individual virtual sensors can emit at independent variable frequencies.
4. **Android App Source Absence**: The Android directories (`DoctorApp`, `SmartHealthTracker`) in the repo only contain gradle wrappers and manifests; all `src/` files are missing upstream. Avoid relying on them.

---

## 3. Integration with the 5 Extension Pillars

- **Digital Twin**: Directly pipe the synthetic vitals stream into a virtual twin state machine to track cumulative cardiac stress, oxygenation deficits, and wandering anomalies.
- **ML Anomaly Detection**: Use the distinct normal vs. spike data distributions as synthetic labeled ground-truth to train Isolation Forests, One-Class SVM, or LSTM autoencoders.
- **Device Authentication**: Replace static username/password with X.509 client certificate verification and mTLS handshake.
- **Data Integrity**: Append HMAC-SHA256 checksums and digital signatures to the JSON payload to detect in-transit modification.
- **RL Threat Response**: Feed anomaly signals and network metrics into an RL environment (Gymnasium) where an agent selects real-time defense actions (rate-limiting, quarantine, dynamic alerting).

## Related Notes
- [[wiki/projects/iot-healthcare-security]]

## Active Workspace Status
The current simulator in `iot_reinforcement_learning/core.py` defines three synthetic patient profiles and event injection hooks used by the local pipeline. Upstream repository behavior described above is historical source analysis; do not assume the active implementation preserves every upstream distribution or MQTT behavior. The current system's benchmark uses synthetic test cases; see [[wiki/concepts/research-benchmark-evaluation-50k]].
