---
date: 2026-10-31
type: decision
tags:
  - decision
  - architecture
  - technology-selection
ai-first: true
---

## For future Claude
This decision record documents the technology and pattern selection from the five external repositories evaluated on 2026-10-31. It justifies keeping lightweight Python components over heavy distributed infrastructure (Spark/Kafka/Bevy).

# Decision Record: External Repositories Pattern Selection

## Context
On 2026-10-31, five external reference repositories were evaluated to design the 5-pillar IoMT security architecture:
1. `ncl427/ML-based-Anomaly-Detection`
2. `open-edge-platform/anomalib`
3. `Open-Source-Digital-Twin/digital-twin-playground`
4. `mmalam3/IoTWarden-Deep-RL-based-Security-System`
5. `Kim-Hammar/awesome-rl-for-cybersecurity`

## Decisions
1. **Pillar 1 (Digital Twin)**:
   - *Adopt*: Client-server state synchronization and telemetry streaming pattern from `digital-twin-playground` (`digital_twin.proto`).
   - *Reject*: The Bevy game engine and Rust dependencies; implement the twin state server in pure Python using async websockets/MQTT.
2. **Pillar 2 (ML Anomaly Detection)**:
   - *Adopt*: Sliding-window feature extraction and K-Means/KNN baseline from `ncl427`; adaptive thresholding and scoring architecture from `anomalib`.
   - *Reject*: Apache Spark, Kafka clusters, and ELK stack from `ncl427`; heavy computer vision models from `anomalib`.
3. **Pillars 3 & 4 (Device Auth & Data Integrity)**:
   - *Adopt*: Mutual TLS (mTLS) with standard X.509 certificates and HMAC-SHA256 message authentication codes using Python's native `cryptography` and `hashlib` libraries.
4. **Pillar 5 (RL Threat Response)**:
   - *Adopt*: The Deep Q-Network (`DQN`), experience replay, and custom `gym.Env` architecture from `IoTWarden`; formal ACD MDP reward structures from `awesome-rl-for-cybersecurity`.
   - *Refactor*: Upgrade `IoTWarden` from legacy `gym` to modern `gymnasium`, replacing TensorFlow if desired with PyTorch for uniform ecosystem compatibility.

## Consequences
- The system achieves full end-to-end integration across all 5 pillars in a single lightweight Python environment without external distributed clustering or non-Python runtimes.

## Related Notes
- [[wiki/concepts/external-repo-evaluations]]
- [[wiki/concepts/five-pillar-security-architecture]]
- [[wiki/projects/iot-healthcare-security]]
