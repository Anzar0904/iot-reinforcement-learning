---
date: 2026-10-31
type: log
tags:
  - log
  - audit
  - investigation
ai-first: true
---

## For future Claude
Development log tracking the initial audit of the Divyansh121699/IoT-Based-Healthcare-Security-Project repository and setup of the Major Project workspace on 2026-10-31. Contains concrete findings from source code and presentation extraction.

# Development Log: Baseline Repository Audit (2026-10-31)

## Activities Completed
1. **Repository Ingestion & Discovery**:
   - Cloned `https://github.com/Divyansh121699/IoT-Based-Healthcare-Security-Project` into local workspace.
   - Identified graduate project origins: George Mason University (Divyansh Nigam & Md Rashedur Rahman).
2. **Deep Codebase Audit**:
   - Analyzed `Project-simulation/data generation/simulation.py`, `baseline_health.py`, `mqtt_server_exec.py`, and `mqtt_config.py`.
   - Inspected patient persona generators in `person/`:
     - Normal vitals generator (`healthy_person.py`).
     - Acute cardiovascular events generator (`heart_issued_person.py`).
     - Cognitive impairment & wandering behavior generator (`alzheimer_patient.py`).
   - Inspected HiveMQ Cloud configuration documentation and MQTT topic definitions (`healthcare/sensor_data`).
3. **PowerPoint Presentation Decompilation**:
   - Extracted and read all 18 slides from `docs/Presenatation.pptx` via XML parsing.
   - Verified system architecture: Ubuntu VM host, SSH (Port 22), MQTT TLS (Port 8883), and Wireshark TLS eavesdropping verification demo.
4. **Android Apps Assessment**:
   - Inspected `DoctorApp/` and `SmartHealthTracker/`. Confirmed only build configs/manifests exist; source code omitted upstream. Documented in [[wiki/decisions/2026-10-31-baseline-code-reuse-and-mobile-app-exclusion]].
5. **Obsidian Second Brain Integration**:
   - Initialized and updated user's brain vault at `/Users/anzarakhtar/downloads/major/major project`.
   - Formatted notes according to `AGENTS.md` guidelines.

## Verified Architecture & Payloads
- Active MQTT Topic: `healthcare/sensor_data`
- Telemetry attributes: Heart Rate, Systolic BP, Diastolic BP, Body Temp, SpO2, Lat, Long, Timestamp.

## Next Milestones
- Receive user links for the 5 extension pillars.
- Initialize clean Python package structure for modular execution.

## Related Notes
- [[wiki/projects/iot-healthcare-security]]
- [[wiki/concepts/iot-healthcare-telemetry-simulation]]
- [[wiki/concepts/five-pillar-security-architecture]]
- [[wiki/decisions/2026-10-31-baseline-code-reuse-and-mobile-app-exclusion]]

## Subsequent Project Status
This is a dated record of the initial audit, not the current project status. The Python implementation, evaluation, dashboards, and later decisions are indexed in [[wiki/projects/iot-healthcare-security]] and [[wiki/concepts/research-benchmark-evaluation-50k]].
