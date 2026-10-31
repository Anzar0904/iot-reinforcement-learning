# IoT Reinforcement Learning (IoMT-Warden)
### Secure, Explainable and Adaptive Cyber-Physical Defense for Internet of Medical Things

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Safe RL](https://img.shields.io/badge/Framework-Gymnasium%20%2B%20DQN-blueviolet.svg)](https://gymnasium.farama.org/)
[![Frontend: React + Motion](https://img.shields.io/badge/UI-React%2019%20%2B%20Motion-61dafb.svg)](https://motion.dev/)
[![Security: OWASP API Top 10 Hardened](https://img.shields.io/badge/Security-Strix%20Audited-emerald.svg)](https://owasp.org/API-Security/)

---

## 📌 Executive Summary

**IoMT-Warden** is an autonomous, hybrid cyber-physical security platform designed to protect the **Internet of Medical Things (IoMT)**. It integrates multi-patient synthetic telemetry simulation, patient-specific **Digital Twin state estimation (EWMA + MAD)**, calibrated unsupervised **Machine Learning (Isolation Forest)**, cryptographic frame integrity (**HMAC-SHA256 & atomic nonces**), and a constrained **Deep Q-Network (DQN)** governed by a non-bypassable, deterministic **Safety Shield**.

The platform is designed around a fundamental medical invariant:
> **Safety Shield Invariant 1 (Life Critical):** Under no circumstance may the cybersecurity agent isolate or quarantine an IoMT device while the patient is experiencing an acute clinical crisis (e.g., severe cardiac arrhythmia or hypertensive decompensation). Emergency medical alarms strictly take precedence over cyber quarantine.

---

## 🏛️ System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │   Multi-Patient Synthetic IoMT Telemetry     │
                  │   P001 (Healthy), P002 (Cardiac), P003 (GPS) │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Cryptographic Security Gateway            │
                  │    • HMAC-SHA256 Frame Signature             │
                  │    • Atomic Nonce Replay Prevention          │
                  │    • Sliding-Window Memory Pruning           │
                  └──────────────┬───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
  ┌──────────────────────────────┐ ┌──────────────────────────────┐
  │     Patient Digital Twin     │ │   Calibrated ML Anomaly      │
  │ • EWMA State Forecasting     │ │ • Isolation Forest Inverted  │
  │ • MAD Residual Distance      │ │ • Quantiles: T1(0.48),       │
  │ • MAP & RPP Clinical Indices │ │   T2(0.76 Critical)          │
  └──────────────┬───────────────┘ └──────────────┬───────────────┘
                 │                                │
                 └───────────────┬────────────────┘
                                 │ State: [Anomaly, TwinDiff, HMAC, Auth, Traffic, Crit]
                                 ▼
                  ┌──────────────────────────────────────────────┐
                  │    Deep Q-Network Defense Agent (DQN)        │
                  │    Policy Output: PASS | BOOST | ALARM |      │
                  │                   RATE_LIMIT | QUARANTINE    │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Non-Bypassable Safety Shield Invariant    │
                  │    • Active Crisis -> Enforce CLINICAL_ALARM │
                  │    • Tampered Frame -> Enforce QUARANTINE    │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Real-Time SSE Bridge (Port 8000)          │
                  │    React 19 + Motion Live Operations UI      │
                  └──────────────────────────────────────────────┘
```

---

## 📊 50,000-Cycle Research Benchmark Results

Evaluated across 50,000 synthetic test samples under 5 distinct cyber-physical scenarios (Normal, Cardiac Crisis, Alzheimer Wander, HMAC Bit-Flip Tampering, Nonce Replay Injection):

| Method | Accuracy | Precision | Recall (Detection Rate) | F1-Score | False Positive Rate (FPR) | Missed Emergencies | Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Rule-Based Baseline** | 0.944 | 1.000 | 0.508 | 0.673 | 0.000 | 1,301 | 0.00 ms |
| **Isolation Forest** | 0.871 | 0.446 | 0.551 | 0.493 | 0.088 | 1,187 | 0.00 ms |
| **DQN (IoMT-Warden)** | **0.910** | **0.558** | **1.000 (100%)** | **0.716** | **0.102** | **0 ✅** | **0.37 ms** |

### Key Experimental Proofs
1. **Zero Missed Clinical Emergencies**: Rule-Based missed 1,301 emergencies and Isolation Forest missed 1,187 emergencies. IoMT-Warden missed **0 emergencies**, mathematically verifying the Safety Shield invariant.
2. **100% Threat Detection (Recall)**: Fully isolated all cryptographic forgery and replay attacks.
3. **Sub-Millisecond Inference**: Average decision latency of $0.37\text{ ms}$, suitable for embedded edge devices.

---

## 📈 Generated Research Figures

The repository includes high-resolution publication figures located in [`experiments/figures/`](experiments/figures/):

| Figure | Description | File |
| :--- | :--- | :--- |
| **Figure 1** | **DQN Reward Trajectory**: Convergence across 250 episodes | [`reward_curve.svg`](experiments/figures/reward_curve.svg) |
| **Figure 2** | **ML Anomaly Scoring**: Real-time trajectory vs. $T_1$ and $T_2$ thresholds | [`anomaly_score.svg`](experiments/figures/anomaly_score.svg) |
| **Figure 3** | **Digital Twin Forecast**: Observed HR vs. EWMA model forecast | [`twin_prediction.svg`](experiments/figures/twin_prediction.svg) |
| **Figure 4** | **Benchmark Comparison**: Bar chart across Accuracy, Recall, and FPR | [`method_comparison.svg`](experiments/figures/method_comparison.svg) |

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Launch the Python Real-Time SSE Bridge
```bash
cd iot_reinforcement_learning
python3 api_bridge.py
```
*Runs the simulation worker and serves live Server-Sent Events at `http://localhost:8000/events`.*

### 2. Launch the React + Motion Dashboard
```bash
cd web-ui
npm install
npm run dev
```
*Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.*

### 3. Run the Research Benchmark Suite
```bash
python3 experiments/run_evaluation.py
```
*Executes the 50,000-sample test set and generates `experiments/evaluation_results.csv`.*

### 4. Re-generate Publication Figures
```bash
python3 experiments/generate_figures.py
```

### 5. Train Offline DQN Weights (250 Episodes)
```bash
python3 experiments/train_dqn_offline.py
```
*Saves converged weights to `weights/dqn_iomt_warden.json` and `weights/dqn_iomt_warden.pt`.*

---

## 🛡️ Security Hardening (Strix Audit)
The platform was security-audited with **Strix Autonomous AI Penetration Testing**:
- **OWASP API4:2023 Hardening**: Payload buffer capping ($\le 64\text{ KB}$) on all incoming POST requests.
- **OWASP API8:2023 Hardening**: Strict parameter whitelisting on `/api/attack` (`TAMPER`, `REPLAY`, `CARDIAC`).
- **Anti-DoS Memory Leak Elimination**: Automatic sliding-window nonce expiration in `CryptoEngine`.
- **Safety Invariant 2**: Strict escalation to `QUARANTINE_DEVICE (4)` on cryptographic failure.

---

## 📁 Repository Structure

```text
├── experiments/                   # Research benchmark scripts & figures
│   ├── figures/                  # Publication SVGs & PNGs (Figures 1-4)
│   ├── run_evaluation.py         # 50,000-sample comparative evaluation
│   ├── generate_figures.py       # Publication figure generator
│   ├── train_dqn_offline.py      # 250-episode offline DQN trainer
│   ├── evaluation_results.csv    # Raw benchmark CSV
│   └── evaluation_results.json   # Detailed metadata JSON
├── iot_reinforcement_learning/    # Core Python backend package
│   ├── api_bridge.py             # Zero-dependency SSE stream & REST server
│   ├── core.py                   # Telemetry generator, HMAC-SHA256, Digital Twin
│   ├── ml_detector.py            # Calibrated Isolation Forest detector
│   ├── rl_defense.py             # Gymnasium IoMTEnv, DQN & Safety Shield
│   ├── dashboard.py              # Streamlit 6-tab operations dashboard
│   ├── runner.py                 # Continuous simulation loop
│   └── test_all.py               # Verification test suite
├── major project/                # Obsidian Second Brain research vault
│   ├── boards/                   # Project task board
│   ├── wiki/concepts/            # Synthesized architecture notes & audits
│   ├── wiki/decisions/           # Architectural Decision Records (ADRs)
│   └── index.md                  # Master vault index
├── web-ui/                       # React 19 + Motion frontend dashboard
│   ├── public/figures/           # High-resolution research figures for web gallery
│   ├── src/                      # App.jsx (6-panel dark operations UI)
│   └── package.json
└── weights/                      # Pre-trained neural network checkpoints
    ├── dqn_iomt_warden.json      # Universal JSON model weights
    └── dqn_iomt_warden.pt        # PyTorch checkpoint
```

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
