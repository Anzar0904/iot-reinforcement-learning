---
date: 2026-10-31
type: concept
tags:
  - concept
  - research
  - evaluation
  - iot-security
ai-first: true
---

## For future Claude
This note provides an exhaustive technical evaluation of five external reference repositories provided on 2026-10-31. It highlights exact usable components, required adaptations, and discarded overhead for our Major Project's 5-pillar IoMT security architecture.

# Technical Evaluation of External Reference Repositories

| Repository | Focus Pillar | Upstream Technology Stack | Key Extract / Usable Pattern | Discarded Overhead |
| :--- | :--- | :--- | :--- | :--- |
| **`ncl427/ML-based-Anomaly-Detection`** | Pillar 2 (ML Anomaly) | Python 3.8, Spark, Kafka, Elasticsearch, Scikit-Learn | Real-time sliding window feature extraction, K-Means clustering + KNN classification pipeline | Heavy Apache Spark, Kafka clusters, and ELK stack dependencies |
| **`open-edge-platform/anomalib`** | Pillar 2 (ML Anomaly) | PyTorch, PyTorch Lightning, OpenVINO | Edge inference engine patterns, adaptive anomaly scoring & dynamic thresholding formulations | 20GB+ computer vision / image-specific convolutional models |
| **`Open-Source-Digital-Twin/digital-twin-playground`** | Pillar 1 (Digital Twin) | Rust, Bevy Game Engine, Protobuf / gRPC | Bidirectional physical-to-virtual synchronization schema (`digital_twin.proto`), telemetry streaming | Bevy 3D game engine and heavy Rust desktop GUI dependencies |
| **`mmalam3/IoTWarden-Deep-RL-based-Security-System`** | Pillar 5 (RL Threat Response) | Python 3.10, TensorFlow, OpenAI Gym, Scikit-Learn | Complete `IoTEnv` Gym environment, DQN neural architecture (`dqn.py`), replay memory, and action space | Hardcoded smart-home trigger-action rules (switch to medical IoMT states) |
| **`Kim-Hammar/awesome-rl-for-cybersecurity`** | Pillar 5 (RL Threat Response) | Curated Research Index | Formal Autonomous Cyber Defense (ACD) MDP mathematical formulations, reward function design | Irrelevant game theory papers outside of IoT intrusion defense |

---

## 1. Deep Dive: `ncl427/ML-based-Anomaly-Detection`
- **Core Value**: Demonstrates how to take raw streaming traffic, compute time-windowed statistical features (`sumOfBytes`, `sumOfPackets`, `uniqDstIPs`), apply `StandardScaler`, and perform real-time anomaly classification using hybrid unsupervised/supervised models.
- **IoMT Adaptation**:
  - Replace network-only features with a fused medical-network vector:
    $$\mathbf{x}_t = [HR_t, BP_{sys,t}, BP_{dia,t}, Temp_t, SpO_{2,t}, \Delta Lat_t, \Delta Long_t, PacketRate_t]$$
  - Instead of deploying an entire Apache Spark cluster, implement a lightweight streaming sliding-window processor using standard Python libraries (`scikit-learn`, `numpy`, `collections.deque`).

---

## 2. Deep Dive: `open-edge-platform/anomalib`
- **Core Value**: Anomalib is Intel's flagship anomaly detection framework. Its greatest architectural strength is the **Edge Inference Pipeline** and **Dynamic Thresholding**:
  - Computes continuous normalized anomaly scores: $s \in [0.0, 1.0]$.
  - Implements **F1AdaptiveThreshold**: Rather than fixing arbitrary cutoffs (e.g., $HR > 100$), it computes empirical anomaly distributions and dynamically sets warning and critical thresholds.
- **IoMT Adaptation**:
  - Implement a streamlined Python module adopting Anomalib's inference and thresholding logic for real-time edge processing on low-power IoT gateways.

---

## 3. Deep Dive: `Open-Source-Digital-Twin/digital-twin-playground`
- **Core Value**: Shows how a physical system streams telemetry to a digital shadow via structured protocols (Protobuf `digital_twin.proto`).
- **IoMT Adaptation**:
  - Build a Python-based **Patient Digital Twin Service** receiving MQTT messages.
  - The twin maintains a synchronized real-time state estimate of patient vitals, calculates physical drift/stress, and simulates what the "expected" normal values should be.
  - If the physical device deviates sharply from the digital twin's physical prediction, a tampering flag is raised.

---

## 4. Deep Dive: `mmalam3/IoTWarden-Deep-RL-based-Security-System`
- **Core Value**: This is a direct implementation of Deep Reinforcement Learning for IoT network defense:
  - Custom Gym Environment: `iot_environment/IoTEnvironment.py` with `reset()`, `step(action)`.
  - Deep Q-Network: `network/dqn.py` with multi-layer neural network estimating $Q(s, a)$.
  - Experience Replay: `src/replay_memory.py` for stable offline training.
  - Reinforcement Learning loop: `main.py` training over 250 episodes.
- **IoMT Adaptation**:
  - Port `IoTEnv` from legacy OpenAI Gym to modern `Gymnasium`.
  - Rewrite state space to ingest IoMT inputs: `[anomaly_score, integrity_flag, auth_status, device_rate, patient_criticality]`.
  - Set medical IoMT action space: `[0: NORMAL, 1: SAMPLE_RATE_BOOST, 2: CLINICAL_ALERT, 3: RATE_LIMIT, 4: QUARANTINE_NODE]`.

---

## 5. Deep Dive: `Kim-Hammar/awesome-rl-for-cybersecurity`
- **Core Value**: Theoretical foundation and academic rigor:
  - Provides the formal MDP definition for Autonomous Cyber Defense (ACD).
  - Guides reward engineering to balance security containment against clinical availability (never drop critical telemetry unless malicious attack is high confidence).

## Related Notes
- [[wiki/projects/iot-healthcare-security]]
- [[wiki/concepts/five-pillar-security-architecture]]
- [[wiki/concepts/digital-twin-iomt-integration]]
- [[wiki/concepts/ml-anomaly-detection-pipeline]]
- [[wiki/concepts/deep-rl-threat-response-iotwarden]]
- [[wiki/decisions/2026-10-31-external-libraries-and-framework-selection]]
