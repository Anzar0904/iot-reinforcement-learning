"""
IoT Reinforcement Learning — Research Benchmark Evaluation Suite.
Phase 8 / Capstone Evaluation Protocol:
Evaluates 50,000 synthetic test samples across 5 cyber-physical scenarios:
1. Nominal Baseline Telemetry
2. Clinical Cardiac Arrhythmia (Tachycardia / Hypertensive)
3. Alzheimer Motor Agitation & Wandering
4. Adversarial HMAC Frame Tampering (Integrity Attack)
5. Adversarial Nonce Replay Injection (Replay Attack)

Compares:
- Method 1: Rule-Based Static Baseline
- Method 2: Calibrated Isolation Forest / ML Anomaly Detector
- Method 3: Proposed DQN (IoMT-Warden) with Digital Twin & Safety Shield
"""
import csv
import json
import os
import sys
import time
import dataclasses
import random

# Ensure local iot_reinforcement_learning package is importable
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKG_DIR = os.path.join(BASE_DIR, "iot_reinforcement_learning")
sys.path.insert(0, PKG_DIR)

from core import CryptoEngine, PatientDigitalTwin, PatientSimulator, TelemetryData
from ml_detector import CalibratedAnomalyDetector
from rl_defense import DQNAgent, SafetyShield, ACTION_MAP


def run_benchmark(n_samples: int = 50000, output_csv: str = "experiments/evaluation_results.csv"):
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    random.seed(42)

    print(f"🚀 Initializing IoMT-Warden Benchmark Evaluation ({n_samples:,} samples)...")

    # 1. Setup Models & Engines
    crypto = CryptoEngine()
    simulators = {1: PatientSimulator(1), 2: PatientSimulator(2), 3: PatientSimulator(3)}
    twins = {1: PatientDigitalTwin(1), 2: PatientDigitalTwin(2), 3: PatientDigitalTwin(3)}
    detectors = {1: CalibratedAnomalyDetector(), 2: CalibratedAnomalyDetector(), 3: CalibratedAnomalyDetector()}

    print("🧠 Calibrating baseline models...")
    for pid in [1, 2, 3]:
        baseline = [dataclasses.asdict(simulators[pid].generate()) for _ in range(50)]
        detectors[pid].train_and_calibrate(baseline)
        for s in baseline:
            # Prime digital twin
            twins[pid].update(TelemetryData(
                heart_rate=s["heart_rate"],
                bp_systolic=s["bp_systolic"],
                bp_diastolic=s["bp_diastolic"],
                body_temp=s["body_temp"],
                spo2=s["spo2"]
            ))

    agent = DQNAgent()
    agent.train_episodes(episodes=25)
    print("✅ Models primed.")

    # 2. Tracking metrics: [TP, FP, TN, FN, missed_emergencies, total_time]
    results = {
        "Rule-Based (Baseline)": {"TP": 0, "FP": 0, "TN": 0, "FN": 0, "missed_emergencies": 0, "latencies": []},
        "Isolation Forest":      {"TP": 0, "FP": 0, "TN": 0, "FN": 0, "missed_emergencies": 0, "latencies": []},
        "DQN (IoMT-Warden)":     {"TP": 0, "FP": 0, "TN": 0, "FN": 0, "missed_emergencies": 0, "latencies": []}
    }

    scenario_counts = {"Nominal": 0, "Cardiac Crisis": 0, "Alzheimer Wander": 0, "HMAC Tamper": 0, "Replay Attack": 0}

    print(f"⚙️ Running 50,000 cyber-physical evaluation cycles...")
    start_all = time.time()

    for seq in range(1, n_samples + 1):
        # Pick patient
        pid = (seq % 3) + 1
        sim = simulators[pid]

        # Determine Scenario
        rand_val = random.random()
        is_attack = False
        is_crisis = False
        scenario_name = "Nominal"

        if rand_val < 0.04:
            # 4% HMAC Tamper Attack
            scenario_name = "HMAC Tamper"
            is_attack = True
            tel = sim.generate()
            frame = crypto.sign(pid, seq=seq, tel=tel)
            frame["signature"]["tag"] = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        elif rand_val < 0.07:
            # 3% Replay Attack
            scenario_name = "Replay Attack"
            is_attack = True
            tel = sim.generate()
            frame = crypto.sign(pid, seq=max(1, seq - 20), tel=tel)  # Stale sequence
        elif rand_val < 0.12 and pid == 2:
            # Severe Cardiac Event
            scenario_name = "Cardiac Crisis"
            is_crisis = True
            tel = TelemetryData(heart_rate=178.0, bp_systolic=192.0, bp_diastolic=114.0, body_temp=37.3, spo2=87.0)
            frame = crypto.sign(pid, seq=seq, tel=tel)
        elif rand_val < 0.15 and pid == 3:
            # Alzheimer Wandering
            scenario_name = "Alzheimer Wander"
            is_crisis = True
            tel = sim.generate(wander=True)
            frame = crypto.sign(pid, seq=seq, tel=tel)
        else:
            # Nominal Baseline
            tel = sim.generate()
            frame = crypto.sign(pid, seq=seq, tel=tel)

        scenario_counts[scenario_name] += 1
        ground_truth_threat = is_attack or is_crisis

        # -------------------------------------------------------------
        # METHOD 1: Rule-Based Static Baseline
        # -------------------------------------------------------------
        t0 = time.perf_counter()
        # Rule check: simple thresholding
        rule_tamper = (frame["signature"]["tag"] == "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
        rule_vitals = (tel.heart_rate > 130 or tel.bp_systolic > 160 or tel.spo2 < 90)
        rule_detected = rule_tamper or rule_vitals
        rule_time = (time.perf_counter() - t0) * 1000

        res1 = results["Rule-Based (Baseline)"]
        res1["latencies"].append(rule_time)
        if rule_detected and ground_truth_threat:   res1["TP"] += 1
        elif rule_detected and not ground_truth_threat: res1["FP"] += 1
        elif not rule_detected and not ground_truth_threat: res1["TN"] += 1
        else:
            res1["FN"] += 1
            if is_crisis: res1["missed_emergencies"] += 1

        # -------------------------------------------------------------
        # METHOD 2: Calibrated Isolation Forest / ML Anomaly Detector
        # -------------------------------------------------------------
        t0 = time.perf_counter()
        norm_score, ml_status = detectors[pid].score(dataclasses.asdict(tel))
        ml_detected = (ml_status in ("WARNING", "CRITICAL")) or rule_tamper
        ml_time = (time.perf_counter() - t0) * 1000

        res2 = results["Isolation Forest"]
        res2["latencies"].append(ml_time)
        if ml_detected and ground_truth_threat:   res2["TP"] += 1
        elif ml_detected and not ground_truth_threat: res2["FP"] += 1
        elif not ml_detected and not ground_truth_threat: res2["TN"] += 1
        else:
            res2["FN"] += 1
            if is_crisis: res2["missed_emergencies"] += 1

        # -------------------------------------------------------------
        # METHOD 3: Proposed DQN (IoMT-Warden) with Twin & Safety Shield
        # -------------------------------------------------------------
        t0 = time.perf_counter()
        crypto_ok, reason = crypto.verify(frame)
        if crypto_ok:
            twin_res = twins[pid].update(tel)
            disc_score = twin_res["discrepancy_score"]
            is_clin_alert = twin_res["map_alert"] or twin_res["rpp_alert"] or twin_res.get("wander_alert", False)
        else:
            disc_score = 0.85
            is_clin_alert = False

        agent.env.set_live_state(
            anomaly=norm_score,
            twin_diff=disc_score,
            hmac_fail=0 if crypto_ok else 1,
            auth_fail=0 if crypto_ok else 1,
            traffic=0.5,
            crit=0.8 if pid in (2, 3) else 0.2,
            true_attack=not crypto_ok,
            true_crisis=is_clin_alert
        )
        raw_action = agent.select_action(agent.env.state, eval_mode=True)
        safe_action, shield_note = SafetyShield.audit_action(raw_action, agent.env.state, is_clinical_alert=is_clin_alert)
        action_name = ACTION_MAP[safe_action]
        dqn_detected = (action_name in ("QUARANTINE_DEVICE", "CLINICAL_ALARM", "RATE_LIMIT_DEVICE"))
        dqn_time = (time.perf_counter() - t0) * 1000

        res3 = results["DQN (IoMT-Warden)"]
        res3["latencies"].append(dqn_time)
        if dqn_detected and ground_truth_threat:   res3["TP"] += 1
        elif dqn_detected and not ground_truth_threat: res3["FP"] += 1
        elif not dqn_detected and not ground_truth_threat: res3["TN"] += 1
        else:
            res3["FN"] += 1
            if is_crisis: res3["missed_emergencies"] += 1

    # 3. Calculate Final Statistical Metrics
    summary_rows = []
    print("\n" + "=" * 90)
    print(f"{'METHOD':<24} {'ACCURACY':<10} {'PRECISION':<11} {'RECALL (DR)':<13} {'F1-SCORE':<10} {'FPR':<8} {'MISSED':<8} {'LATENCY (ms)'}")
    print("=" * 90)

    for method, d in results.items():
        tp = d["TP"]
        fp = d["FP"]
        tn = d["TN"]
        fn = d["FN"]
        total = tp + fp + tn + fn

        acc = (tp + tn) / max(1, total)
        prec = tp / max(1, tp + fp)
        recall = tp / max(1, tp + fn)
        f1 = (2 * prec * recall) / max(1e-6, prec + recall)
        fpr = fp / max(1, fp + tn)
        avg_lat = sum(d["latencies"]) / max(1, len(d["latencies"]))

        row = {
            "Method": method,
            "Accuracy": round(acc, 3),
            "Precision": round(prec, 3),
            "Recall (DR)": round(recall, 3),
            "F1-Score": round(f1, 3),
            "FPR": round(fpr, 3),
            "Missed Emergencies": d["missed_emergencies"],
            "Avg Latency (ms)": round(avg_lat, 2)
        }
        summary_rows.append(row)

        highlight = " ✅" if method == "DQN (IoMT-Warden)" and d["missed_emergencies"] == 0 else ""
        print(f"{method:<24} {acc:<10.3f} {prec:<11.3f} {recall:<13.3f} {f1:<10.3f} {fpr:<8.3f} {d['missed_emergencies']:<8}{avg_lat:<8.2f}{highlight}")

    print("=" * 90)

    # 4. Save to CSV
    with open(output_csv, mode="w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(summary_rows[0].keys()))
        writer.writeheader()
        writer.writerows(summary_rows)

    # 5. Save detailed JSON summary for Dashboard & Figures Generator
    json_path = output_csv.replace(".csv", ".json")
    with open(json_path, mode="w") as f:
        json.dump({
            "total_samples": n_samples,
            "scenarios": scenario_counts,
            "elapsed_seconds": round(time.time() - start_all, 2),
            "results": summary_rows
        }, f, indent=2)

    print(f"\n📁 Benchmark datasets successfully written to:")
    print(f"   - CSV:  {output_csv}")
    print(f"   - JSON: {json_path}")
    print(f"⏱ Total elapsed evaluation time: {time.time() - start_all:.2f}s\n")
    return summary_rows


if __name__ == "__main__":
    run_benchmark(50000)
