---
date: 2026-11-01
type: concept
tags:
  - concept
  - ui-ux
  - dashboard
  - streamlit
  - frontend
ai-first: true
---

## For future Claude
This note preserves the design specification for the 6-tab Streamlit dashboard and provides the intended UX baseline. The workspace also contains a React dashboard prototype; the current implementation and design are not identical, so treat mock values and proposed tab features as specification rather than live facts.

# UI/UX Dashboard Design Specification

## 1. Design Philosophy & Aesthetic
The dashboard serves as the primary visual evaluation interface during the university project viva. It must look like an enterprise-grade hospital Security Operations Center (SOC) combined with an Intensive Care Unit (ICU) telemetry console.

### Visual Identity & Color System
- **Theme**: Dark Slate / Clinical Ops (`#0E1117` background with `#1E2530` card containers).
- **Typography**: Clean monospaced numerals for real-time vitals and latency metrics; sans-serif headers.
- **Semantic Status Palette**:
  - 🟢 **`#00CC66` (Nominal / Valid / Verified)**: Clean telemetry, valid HMAC, normal vitals.
  - 🟡 **`#FFB020` (Warning / Drift)**: Borderline physiological drift, early wandering.
  - 🔴 **`#FF3B30` (Critical Alert / Attack)**: Hypertensive crisis, tachycardia, tampered HMAC, replay attack.
  - 🔵 **`#0A84FF` (RL Mitigation / Twin Sync)**: Action execution, digital twin EWMA prediction lines.
  - ⚪ **`#8E8E93` (Warmup / Cold Start)**: Initial 5-sample calibration period.

---

## 2. Layout Structure & Navigation

```
+---------------------------------------------------------------------------------------+
|  🏥 IoT Reinforcement Learning — Healthcare Cyber-Physical Defense Console            |
|  [Broker: HiveMQ Cloud TLS 8883] [Status: ONLINE] [Throughput: 12 msg/s] [p95: 14ms] |
+---------------------------------------------------------------------------------------+
|  [Tab 1: Overview] [Tab 2: Vitals] [Tab 3: Digital Twin]                              |
|  [Tab 4: ML Anomaly] [Tab 5: Security Ops] [Tab 6: RL Defense & Experiments]          |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                               ACTIVE TAB CONTENT AREA                                 |
|                                                                                       |
+---------------------------------------------------------------------------------------+
|  Footer: ⚠️ SYNTHETIC SIMULATION ONLY | HIPAA/IRB Exempt | Non-Clinical Research Device |
+---------------------------------------------------------------------------------------+
```

---

## 3. Detailed Wireframes & Tab Specifications

### Tab 1 — System Overview (Executive Telemetry Console)
- **Top Metric Cards**:
  - `Active IoT Devices`: `3 / 3 Connected` (P1 Healthy, P2 Cardiac, P3 Alzheimer).
  - `Message Ingestion Rate`: `12 msgs/sec` with latency indicator (`p50: 8ms`, `p95: 14ms`).
  - `Total Verified Frames`: `1,420 (98.2% valid)`.
  - `Blocked Cyber Threats`: `26 rejected packets` (HMAC/Replay/Unauthorized).
- **System Health Status Banner**: Live pulse indicator showing SQLite WAL health and MQTT TLS socket state.

### Tab 2 — Patient Simulation (ICU Telemetry Cards)
- **Patient Selector**: Dropdown or radio cards for `Patient 1 (Healthy)`, `Patient 2 (Cardiac Risk)`, `Patient 3 (Dementia/Wandering)`.
- **Live Vital Gauges**:
  - **Heart Rate**: Live scalar + mini sparkline trend (`72 bpm`).
  - **Blood Pressure**: Systolic / Diastolic readouts (`118 / 76 mmHg`).
  - **Blood Oxygen ($SpO_2$)**: Progress bar (`98%`).
  - **Body Temperature**: Numeric metric (`36.8 °C`).
  - **GPS Geofence Radar**: 2D scatter map showing safe baseline circle vs. real-time coordinates.

### Tab 3 — Digital Twin (Virtual Patient State & Forecasting)
- **Twin State Synchronization Display**:
  - Line Chart: **Observed Telemetry** (solid line) vs. **EWMA Forecasted Telemetry** (dashed blue line) across last 30 samples.
  - Residual Dispersion Bar Chart: Scaled residuals $r_{t,j}$ normalized by Median Absolute Deviation ($1.4826 \cdot \text{MAD}$).
- **Clinical Workload & Strain Gauges**:
  - **Mean Arterial Pressure (MAP)**: Gauge with target zone $70 - 100\text{ mmHg}$.
  - **Rate Pressure Product (RPP)**: Workload meter highlighting threshold $12,000$ (myocardial strain indicator).
  - **Cyber-Physical Discrepancy Index ($s_{twin}$)**: Dial gauge from $0.0$ to $1.0$ categorized as `NOMINAL`, `DRIFTING`, `DISCREPANT`, or `CRITICAL_MISMATCH`.

### Tab 4 — ML Anomaly Detection (Explainable Edge AI)
- **Rolling Anomaly Score Chart**: Real-time plot of $a(x) = -\text{decision\_function}(x)$ over time.
- **Dynamic Threshold Overlays**:
  - Warning Threshold Line: $T_{warn} = Q_{0.95}(a)$ (amber dashed line).
  - Critical Threshold Line: $T_{crit} = Q_{0.995}(a)$ (crimson dashed line).
- **Feature Attribution Breakdown**: Horizontal bar chart indicating which vital sign contributed most to the anomaly score (e.g., $HR \Delta: 54\%$, $BP_{sys}: 32\%$, $SpO_2: 14\%$).

### Tab 5 — Security Operations Center (SOC Packet Stream)
- **Real-Time Packet Audit Table**: Auto-scrolling feed of incoming telemetry frames with columns:
  - `Timestamp` (UTC)
  - `Device ID`
  - `Patient ID`
  - `Sequence #`
  - `HMAC Status` (`VALID` / `TAMPERED`)
  - `Replay Check` (`FRESH` / `REPLAY_DETECTED`)
  - `Gateway Action` (`ACCEPTED` / `REJECTED`)
  - `Correlation ID` (clickable for full JSON trace)
- **Threat Injection Quick-Buttons**:
  - `[Inject HMAC Tamper]`: Flips 1 payload bit to demonstrate instant rejection.
  - `[Inject Replay Attack]`: Resends prior nonce to demonstrate replay guard.
  - `[Inject Identity Mismatch]`: Spoofs device ID to trigger ACL authorization block.

### Tab 6 — RL Defense Policy & Research Experiments
- **Active DQN Action Indicator**:
  - Highlights currently selected action: `PASS`, `INCREASE_MONITORING`, `RAISE_SECURITY_ALERT`, `RATE_LIMIT_DEVICE`, or `QUARANTINE_DEVICE`.
  - Q-Value Distribution: Horizontal bar chart showing estimated Q-values $Q(s, a)$ for all 5 actions.
- **Safety Shield Interception Badge**:
  - Shows when the Safety Shield intervened to prevent a rogue quarantine or override an unvalidated action.
- **Research Evaluation Visualizations**:
  - Pre-computed 5-seed training convergence curve ($\mu \pm 95\% \text{ CI}$).
  - Comparative Performance Table: Random vs. Rule-Based vs. DQN.
  - `[Download Evaluation Report (CSV)]` button.

---

## 4. Concurrency & Performance Architecture
- **Read-Only SQLite Engine**: Dashboard connects via `sqlite3.connect('file:...iomt_warden.db?mode=ro', uri=True)`.
- **Zero UI Blocking**: Ingestion worker processes packets independently; Streamlit pulls state snapshots every 1–2 seconds via lightweight SQL indexed queries.
- **Session Cache**: Uses `st.cache_data(ttl=1)` for efficient query reuse.

## Related Notes
- [[wiki/decisions/2026-11-01-final-plan-locked-and-ui-ux-design-transition]]
- [[wiki/decisions/2026-10-31-master-plan-review-and-adoption]]
- [[wiki/projects/master-architecture-and-synthesis]]

## Implementation Note
The Streamlit implementation is `iot_reinforcement_learning/dashboard.py`; the React interface is under `web-ui/src/`. Inspect those sources for current UI behavior. Example metric values and “ONLINE” labels in the wireframe are illustrative, not live system guarantees. See [[wiki/projects/iot-healthcare-security]].

## Visual Reference Images
Generated concept references for visual direction; these are mockups, not screenshots of implemented product behavior:
- [[ui-references/overview-dashboard]]
- [[ui-references/patient-vitals]]
- [[ui-references/security-operations]]

## React Prototype Coverage — 2026-11-01
The current React prototype was updated and checked locally to show all three patients (P001, P002, P003) in Patient Vitals, the all-patient Digital Twin view, and RL decision records. Digital Twin also supports selecting a single patient. Reports show coverage for all three patient IDs. This describes the current prototype, not the aspirational six-tab Streamlit wireframe above; consult `web-ui/src/App.jsx`, `web-ui/src/app.css`, and `iot_reinforcement_learning/api_bridge.py` for implementation details. Theme changes remain pending the user's direction.

## Hospital-Style Reference Set — 2026-11-01
The user supplied a light medical-center dashboard image as visual inspiration. Eight coordinated page mockups were generated under `ui-references/`; they are static design references, not implemented UI screenshots. Core patient readings and evaluation results were drawn from the workspace and supplied screenshots, but inspect each mockup's sample chart marks, timestamps, and packet sequence values before reusing them as product data.
- [[ui-references/dashboard-hospital-style]]
- [[ui-references/patient-vitals-hospital-style]] — All three patient rows are visible together.
- [[ui-references/security-integrity-hospital-style]]
- [[ui-references/ml-anomaly-hospital-style]]
- [[ui-references/rl-defense-hospital-style]] — Decision table includes P001, P002, and P003.
- [[ui-references/digital-twin-hospital-style]] — All-patient view includes P001, P002, and P003.
- [[ui-references/experiments-reports-hospital-style]]
- [[ui-references/settings-hospital-style]]
