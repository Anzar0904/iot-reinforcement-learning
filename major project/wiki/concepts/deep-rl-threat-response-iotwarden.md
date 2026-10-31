---
date: 2026-10-31
type: concept
tags:
  - concept
  - reinforcement-learning
  - threat-response
  - dqn
ai-first: true
---

## For future Claude
This note details the design of Pillar 5: RL-Based Threat Response, directly adapting the Deep Q-Network (DQN) and custom Gym environment from mmalam3/IoTWarden-Deep-RL-based-Security-System and formal foundations from Kim-Hammar/awesome-rl-for-cybersecurity.

# RL-Based Threat Response: IoMT-Warden

## 1. MDP Formulation for Medical IoT Defense
In alignment with `IoTWarden` and the cybersecurity MDP literature indexed in `awesome-rl-for-cybersecurity`, the defense engine is formulated as a Markov Decision Process:
$$\mathcal{M} = \langle \mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma \rangle$$

### State Space ($\mathcal{S}$)
A 6-dimensional continuous state vector observed at discrete timestep $t$:
$$\mathbf{s}_t = \begin{bmatrix}
s_{anomaly} & \text{(Continuous anomaly score from ML pipeline, } [0, 1]\text{)} \\
s_{twin\_diff} & \text{(Deviation from Digital Twin predicted state, } [0, 1]\text{)} \\
f_{integrity} & \text{(Cryptographic HMAC failure flag: 0=Valid, 1=Tampered)} \\
f_{auth} & \text{(Device authentication state: 0=Valid mTLS, 1=Unverified)} \\
r_{traffic} & \text{(Normalized packet transmission rate, } [0, 1]\text{)} \\
p_{criticality} & \text{(Patient health vulnerability weight, } [0, 1]\text{)}
\end{bmatrix}$$

### Action Space ($\mathcal{A}$)
Discrete defense actions available to the security agent:
- **`Action 0: MONITOR_NORMAL`**: Default state; pass packets through to clinician dashboard.
- **`Action 1: BOOST_SAMPLING`**: Instruct edge device to increase telemetry rate for high-resolution clinical diagnosis during mild distress.
- **`Action 2: CLINICAL_ALARM`**: Trigger urgent alert to medical staff (high clinical anomaly, valid telemetry).
- **`Action 3: RATE_LIMIT`**: Throttle device connection at the broker (suspected telemetry flood / DoS attack).
- **`Action 4: QUARANTINE_DEVICE`**: Revoke device token, reject packets, and isolate node (cryptographic failure or severe sensor spoofing).

### Reward Function ($\mathcal{R}$)
The reward function balances patient safety against operational disruption:
$$\mathcal{R}(s_t, a_t) = R_{safety} + R_{security} - P_{false\_alarm} - P_{availability\_penalty}$$
- $+10$: Correctly triggering `CLINICAL_ALARM` during a true medical crisis.
- $+10$: Correctly executing `QUARANTINE_DEVICE` when HMAC integrity fails or malicious spoofing occurs.
- $-5$: False alarm penalty for raising medical alerts on benign noise.
- $-15$: Severe penalty for quarantining a legitimate sensor during a true patient health crisis.

---

## 2. Deep Q-Network (DQN) Architecture
Adopted directly from `IoTWarden` (`dqn.py` and `agent.py`):
- **Q-Network**: Multi-Layer Perceptron (MLP) with 2 hidden dense layers (64 units, ReLU activations) taking state vector $\mathbf{s}_t$ and outputting Q-values $Q(\mathbf{s}_t, a)$ for all 5 discrete actions.
- **Target Network**: Separate target network with periodic weight synchronization ($\tau$ or every $N$ steps) to stabilize training.
- **Experience Replay Buffer**: Circular buffer storing transitions $(s_t, a_t, r_t, s_{t+1}, done)$ to break correlation between consecutive observations.
- **Exploration Policy**: $\epsilon$-greedy exploration with decay from $\epsilon_{max} = 1.0$ down to $\epsilon_{min} = 0.05$.

## Related Notes
- [[wiki/concepts/external-repo-evaluations]]
- [[wiki/concepts/five-pillar-security-architecture]]
- [[wiki/concepts/ml-anomaly-detection-pipeline]]
- [[wiki/concepts/digital-twin-iomt-integration]]
