# IoT Reinforcement Learning

> Secure, Explainable & Adaptive Cyber-Physical Defense for Healthcare IoT

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Self-Verification Test
```bash
python test_all.py
```

### 3. Launch Simulation & Ingestion Engine (Terminal 1)
```bash
python runner.py
```

### 4. Launch 6-Tab Streamlit Live Dashboard (Terminal 2)
```bash
streamlit run dashboard.py
```

---

## Architecture Summary
- **`core.py`**: Telemetry generator (Healthy, Cardiac, Alzheimer), HMAC-SHA256 frame signer/verifier, replay guard, and Digital Twin (EWMA + MAD + MAP + RPP).
- **`ml_detector.py`**: Isolation Forest with $-decision\_function$ score inversion and empirical quantile calibration ($Q_{0.95}, Q_{0.995}$).
- **`rl_defense.py`**: Gymnasium IoMT environment + PyTorch DQN with hard, non-bypassable Safety Shield.
- **`dashboard.py`**: 6-tab Streamlit dashboard with SQLite WAL real-time reader.
- **`runner.py`**: Master pipeline orchestrator and fault-injection engine.
