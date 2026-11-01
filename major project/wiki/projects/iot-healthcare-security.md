---
date: 2026-10-31
type: project
tags:
  - project
  - iot-security
  - healthcare
ai-first: true
---

## For future Claude
This note tracks the IoT Reinforcement Learning major project: its goals, architecture, implementation status, and evidence. The active Python implementation and evaluation artifacts live in sibling `iot_reinforcement_learning/`, `experiments/`, `weights/`, and `web-ui/` workspace folders; recorded benchmark figures describe synthetic experiments, not clinical validation.

# IoT Healthcare Security Major Project

## Project Overview
The project is focused on designing and implementing an end-to-end secure, resilient Internet of Medical Things (IoMT) monitoring architecture. It builds upon a baseline simulation repository and introduces advanced telemetry mirroring, proactive machine learning defenses, and automated reinforcement learning threat mitigation.

## Baseline Reference Repository
- **Source**: `https://github.com/Divyansh121699/IoT-Based-Healthcare-Security-Project`
- **Original Authors**: Divyansh Nigam & Md Rashedur Rahman (George Mason University)
- **Local Clone**: Located at workspace root `IoT-Based-Healthcare-Security-Project/`
- **Key Extract**: Realistic patient vitals generation (`HealthyPerson`, `PersonWithHeartIssue`, `AlzheimerPatient`) and MQTT TLS publisher pipeline. Detailed technical review documented in [[wiki/concepts/iot-healthcare-telemetry-simulation]].

## Five-Pillar Architecture
1. **Digital Twin Integration**: Real-time virtual twin synchronized with incoming telemetry streams to model physiological state and organ strain.
2. **ML-Based Anomaly Detection**: Supervised and unsupervised detection (Isolation Forest, Autoencoders/LSTM) for cardiac arrhythmias and abnormal wandering.
3. **Secure Device Authentication**: Upgrading broker credentials to Mutual TLS (mTLS), X.509 device certificates, and token-based identity verification.
4. **Data Integrity Protection**: Cryptographic HMAC-SHA256 verification and asymmetric digital signatures to prevent MITM tampering.
5. **RL-Based Threat Response**: Autonomous reinforcement learning agent executing dynamic mitigation actions (rate-limiting, alert escalation, node isolation).

## Status & Next Steps
- [x] Baseline repo cloned and deeply inspected.
- [x] Usable code identified (simulation engine & schemas).
- [x] Implemented Python pipeline modules for telemetry, HMAC/replay checks, Digital Twin estimation, calibrated anomaly scoring, RL actions, and a safety shield (see `iot_reinforcement_learning/`).
- [x] Added Streamlit dashboard, React/SSE interface, benchmark and figure scripts, and DQN training artifacts (see [[wiki/concepts/ui-ux-dashboard-design-specification]] and [[wiki/concepts/research-benchmark-evaluation-50k]]).
- [ ] Reconcile design notes with the exact final implementation and document remaining scope gaps.
- [ ] Complete the viva demonstration automation script tracked on [[boards/project-board]].

## Implementation Evidence and Limits
- The project README describes how to launch the simulation and dashboard; source code is the reference for current behavior.
- [[wiki/concepts/strix-security-audit-and-hardening]] and [[wiki/decisions/2026-11-01-strix-security-hardening-and-benchmark-validation]] record security changes and benchmark claims as logged on 2026-11-01.
- Current source implements HMAC signing, freshness/sequence/replay checks, SQLite WAL persistence, an EWMA/MAD patient twin, Isolation Forest scoring with a fallback, and a policy plus deterministic safety shield. Architecture notes also describe mTLS and certificate provisioning; verify those against final source before claiming implementation.
- Synthetic benchmark performance is not evidence of clinical effectiveness or deployment readiness.

## UI Progress — 2026-11-01
- The React dashboard now exposes all three patient IDs (P001, P002, P003) in Patient Vitals, Digital Twin, and RL decision views. Digital Twin defaults to an all-patient view and supports filtering to an individual patient; RL records are generated per patient rather than being hardcoded to P002.
- The reports view identifies patient coverage as P001 · P002 · P003. The Python SSE bridge supplies Digital Twin data and RL decisions for all three patients.
- These screens were checked in the local browser at `http://localhost:5173/`; the React build completed successfully. Source locations: `web-ui/src/App.jsx`, `web-ui/src/app.css`, and `iot_reinforcement_learning/api_bridge.py`.
- Theme refinement is still pending user direction. Keep the existing visual direction until the user gives the next instruction.

## External Technical References
- Python recommends `hmac.compare_digest` for comparing externally supplied MACs: https://docs.python.org/3/library/hmac.html
- scikit-learn documents Isolation Forest scoring and its decision function: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html
- PyTorch's official tutorial demonstrates DQN training: https://docs.pytorch.org/tutorials/intermediate/reinforcement_q_learning.html
- SQLite documents WAL reader/writer behavior and operational limits: https://www.sqlite.org/wal.html

## Related Notes
- [[wiki/projects/master-architecture-and-synthesis]]
- [[wiki/concepts/strix-security-audit-and-hardening]]
- [[wiki/concepts/research-benchmark-evaluation-50k]]
- [[wiki/concepts/ui-ux-dashboard-design-specification]]
- [[boards/project-board]]
