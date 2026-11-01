---
date: 2026-10-31
type: board
tags:
  - board
  - tasks
  - roadmap
ai-first: true
---

## For future Claude
Task board for the Major Project: Secure IoT Healthcare System. Tracks ongoing, completed, and backlog tasks across the 5 pillars.

# Project Task Board

## Backlog
- [ ] Implement and verify mTLS/X.509 device identity provisioning (design target; not present in current Python pipeline snapshot).
- [ ] Rework benchmark method 3 to evaluate learned checkpoint Q-values separately from threshold rules and the safety shield; report both ablations and reproducible metrics.
- [ ] Reconcile architecture/specification notes against shipped code; mark proposed UI behaviors and unimplemented features clearly.
- [ ] End-to-end viva demonstration automation script (`viva_demo.py`) and documented runbook.

## In Progress
- [ ] Task 5: Viva Demonstration Automation Script (`viva_demo.py`)

## Completed
- [x] Strix Live API Security Testing: Automated test suite verified 7 live API controls against `api_bridge.py` (CORS preflight, parameter whitelisting, 64KB buffer DoS guard, malformed JSON, and route traversal).
- [x] Full Test Matrix Execution & Bugfix: Verified `test_all.py`, `core.py`, `ml_detector.py`, `rl_defense.py`, `train_dqn_offline.py`, `generate_figures.py`, and `web-ui` Vite production build; resolved `dataclasses` import bug in `ml_detector.py`.
- [x] Whole-Repo Complexity Audit (`/ponytail-audit`): Identified 1,229 lines of dead/duplicate code and 5 removable dependencies.
- [x] GitHub Remote Repository Deployment: Created public repo `Anzar0904/iot-reinforcement-learning` and pushed initial commit (`https://github.com/Anzar0904/iot-reinforcement-learning`).
- [x] Strix Security Audit & Hardening (OWASP API4 buffer limits, API8 parameter whitelisting, sliding-window nonce garbage collection).
- [x] Task 4: Offline 250-Episode DQN Training (`experiments/train_dqn_offline.py`, weights saved to `weights/dqn_iomt_warden.json` & `.pt`, auto-loaded on startup).
- [x] Task 3: Publication Figures Generator (`experiments/generate_figures.py`, 4 figures generated in SVG/PNG, lightbox modal & batch download in React UI).
- [x] Task 2: Research Benchmark Evaluation (`experiments/run_evaluation.py`, 50,000 samples, 0 missed emergencies for DQN, CSV & JSON generated).
- [x] Task 1: Live Python-to-React SSE Bridge (`api_bridge.py` + React SSE Hook with bidirectional attack triggers).
- [x] Motion React UI Prototype running live on localhost (`web-ui/src/App.jsx` @ `http://localhost:5173/`).
- [x] Streamlit live dashboard with 6 analytical tabs (`iot_reinforcement_learning/dashboard.py`).
- [x] Digital Twin EWMA & MAD residual pipeline (`iot_reinforcement_learning/core.py`).
- [x] Isolation Forest ML anomaly detector with quantile calibration (`iot_reinforcement_learning/ml_detector.py`).
- [x] Gymnasium IoMT defense environment + PyTorch Shielded DQN (`iot_reinforcement_learning/rl_defense.py`).
- [x] Clone upstream repository `Divyansh121699/IoT-Based-Healthcare-Security-Project`.
- [x] Comprehensive code audit of data simulation modules (`healthy_person`, `heart_issued_person`, `alzheimer_patient`).
- [x] Slide extraction from `Presenatation.pptx` (GMU architecture).
- [x] Discovery of missing Android source code and formal decision to exclude Android UI skeletons.
- [x] Ingest and evaluate the 5 external reference repositories (`ncl427`, `anomalib`, `digital-twin-playground`, `IoTWarden`, `awesome-rl`).
- [x] Architect 5-pillar integration specifications and MDP formulation.
- [x] Evaluate and adopt Revised Master Implementation Plan (`IoMT_Warden_Revised_Master_Implementation_Plan.md`, Score: 9.6/10).
- [x] Renamed project to 'IoT Reinforcement Learning' (`iot_reinforcement_learning`).
- [x] Formulate Digital Twin Base Implementation Plan (EWMA, MAD, MAP, RPP, SQLite WAL).
- [x] Formally locked Master Plan as FINAL; authored UI/UX Dashboard Design Specification.
- [x] Obsidian brain vault setup, indexing, and operational logging.

## Related Notes
- [[wiki/projects/iot-healthcare-security]]
- [[wiki/concepts/five-pillar-security-architecture]]
- [[wiki/logs/2026-10-31-baseline-repo-audit]]
