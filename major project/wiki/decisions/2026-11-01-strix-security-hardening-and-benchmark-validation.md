---
title: "Decision: Strix Security Hardening & 50,000-Sample Benchmark Validation"
date: 2026-11-01
type: decision
status: accepted
tags:
  - decision
  - strix
  - security
  - benchmarks
  - dqn
ai-first: true
---

## For future Claude
This decision records targeted hardening work and a synthetic benchmark run. Read the evidence qualification below before repeating claims: the benchmark's “DQN” method uses threshold actions plus a safety shield and does not establish clinical safety.

# Decision: Strix Security Hardening & 50,000-Sample Benchmark Validation

## Context
Following the completion of the real-time Python-to-React SSE bridge and offline DQN training, the system required:
1. Systematic security auditing against selected OWASP API Security Top 10 risks to check resilience to tested bypass and resource-exhaustion cases.
2. Large-scale statistical evaluation across 50,000 synthetic test cycles to compare the proposed pipeline with rule-based and ML baselines.

## Decision
1. **Strix Audit Integration**:
   - Ingested Strix skills into Antigravity (`~/.gemini/config/skills/`).
   - Implemented request body size capping ($\le 64\text{ KB}$) in `api_bridge.py` (OWASP API4:2023).
   - Enforced strict parameter whitelisting on `/api/attack` (OWASP API8:2023).
   - Replaced unbounded nonce set with a time-sliding expiration dictionary to prevent memory leaks during 24/7 deployment.
   - Enforced strict quarantine escalation for unauthenticated frames under Safety Invariant 2.

2. **Benchmark Evaluation**:
   - Executed `experiments/run_evaluation.py` on 50,000 samples.
   - The recorded output reports **0 missed synthetic emergencies** for the combined threshold policy and Safety Shield path (vs. 1,301 for Rule-Based and 1,187 for Isolation Forest).
   - Generated 4 publication-quality research figures in SVG and PNG for the thesis report and live dashboard gallery.

## Consequences
- **Positive**:
  - Targeted checks were added for oversized request bodies, invalid attack types, and nonce-store growth.
  - The benchmark provides synthetic comparative data for the configured scenarios.
  - The reported zero misses apply to the synthetic evaluator and are not a clinical safety guarantee.
- **Negative / Trade-offs**:
  - Offline 50,000-sample test takes ~19 seconds to run full cryptographic verification and EWMA updates.

## Evidence Qualification
The implementation and metrics are recorded in local source and output files. “Immune” and “guarantee” are too broad: these checks address specific tested cases and do not establish general security or clinical safety. The benchmark method labeled DQN uses threshold-based evaluation-time actions plus a safety shield; see [[wiki/concepts/research-benchmark-evaluation-50k]] and [[wiki/concepts/five-pillar-security-architecture]].

## Related Notes
- [[wiki/concepts/strix-security-audit-and-hardening]]
- [[wiki/concepts/research-benchmark-evaluation-50k]]
- [[wiki/concepts/five-pillar-security-architecture]]
- [[wiki/projects/iot-healthcare-security]]
