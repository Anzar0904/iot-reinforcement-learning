---
date: 2026-10-31
type: decision
tags:
  - decision
  - architecture
  - iot-security
ai-first: true
---

## For future Claude
This decision record explains why the upstream Android mobile applications were discarded, which parts of Divyansh121699/IoT-Based-Healthcare-Security-Project were kept, and how the core architecture will be shaped. Reference this when questions arise about missing mobile app code or choice of implementation language.

# Decision Record: Baseline Code Reuse & Android App Exclusion

## Context
During initial project research and environment setup on 2026-10-31, we cloned and evaluated the upstream repository `https://github.com/Divyansh121699/IoT-Based-Healthcare-Security-Project`.
The project goals require adding five advanced capabilities:
1. Digital Twin Integration
2. ML-Based Anomaly Detection
3. Secure Device Authentication
4. Data Integrity Protection
5. RL-Based Threat Response

## Assessment of Upstream Repository
1. **Simulation & Telemetry Module (`Project-simulation/`)**:
   - Contains functional Python models for synthetic physiological data generation (`healthy_person.py`, `heart_issued_person.py`, `alzheimer_patient.py`, `baseline_health.py`).
   - Contains functional TLS MQTT publisher (`mqtt_server_exec.py`).
   - Has several bugs/smells: typo `longtitude`, hardcoded HiveMQ credentials, and synchronous blocking sleep loops.
2. **Mobile Applications (`DoctorApp/`, `SmartHealthTracker/`)**:
   - Only contain Gradle build scripts, manifests, and wrapper binaries.
   - The actual source directories (`src/main/java`, `src/main/kotlin`) were omitted/uncommitted upstream. No UI or business logic exists.
3. **Presentation & Docs (`docs/Presenatation.pptx`, `HiveMQ_Cloud/`)**:
   - Outlines George Mason University graduate project context, VM firewall configs, and payload schemas.

## Decisions Made
1. **Discard Upstream Mobile Apps**: Do not attempt to recover or maintain `DoctorApp` or `SmartHealthTracker`. They provide zero executable value.
2. **Harvest and Refactor Python Simulation**:
   - Reuse the mathematical distributions and vital signs logic from `person/`.
   - Fix the `longtitude` property typo to `longitude`.
   - Refactor blocking synchronous loops to `asyncio` to allow multiple concurrent, independent sensor nodes.
   - Move MQTT connection strings and credentials out of source code into environment variables (`.env`).
3. **Standardize on Python Core Pipeline**:
   - Implement all 5 target security extensions (Digital Twin, ML, Device Auth, Data Integrity, RL) in Python to seamlessly interface with the simulation telemetry and data science / reinforcement learning libraries (`gymnasium`, `scikit-learn`, `cryptography`, `paho-mqtt`).

## Consequences
- **Positive**: Clean, modern codebase; no ghost Java/Kotlin dependencies; faster development cycle; unified data pipeline.
- **Negative / Trade-off**: Mobile dashboard UI is deferred or replaced by a lightweight web/dashboard interface (e.g., Streamlit or FastAPI) if visual monitoring is needed later.

## Related Notes
- [[wiki/projects/iot-healthcare-security]]
- [[wiki/concepts/iot-healthcare-telemetry-simulation]]
- [[wiki/concepts/five-pillar-security-architecture]]

## Decision Status
This records the original 2026-10-31 choice and upstream assessment. The architecture evolved afterward: a Python simulation pipeline and web dashboards were built, while the current implementation snapshot still does not establish mTLS/X.509 as complete. Preserve this note as historical context; consult [[wiki/projects/iot-healthcare-security]] for present status.
