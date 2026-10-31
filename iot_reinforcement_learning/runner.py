"""
IoT Reinforcement Learning — Master Simulation & Defense Orchestrator.
Runs the continuous cyber-physical telemetry loop, records to SQLite WAL,
and updates Digital Twins, ML Anomaly scores, and Safe RL mitigations.
"""
import dataclasses
import json
import time
from core import CryptoEngine, PatientDigitalTwin, PatientSimulator, init_db
from ml_detector import CalibratedAnomalyDetector
from rl_defense import ACTION_MAP, DQNAgent, SafetyShield

def run_simulation(db_path: str = "iot_rl.db", max_cycles: int = 1000):
    db = init_db(db_path)
    crypto = CryptoEngine()
    
    patients = [1, 2, 3]
    simulators = {pid: PatientSimulator(pid) for pid in patients}
    twins = {pid: PatientDigitalTwin(pid) for pid in patients}
    
    print("🧠 Calibrating ML Anomaly Detectors on nominal baselines...")
    detectors = {}
    for pid in patients:
        det = CalibratedAnomalyDetector()
        baseline = [dataclasses.asdict(simulators[pid].generate()) for _ in range(30)]
        det.train_and_calibrate(baseline)
        detectors[pid] = det
    print("✅ Calibration complete.")

    print("🤖 Initializing Safe DQN Agent & Safety Shield...")
    agent = DQNAgent()
    agent.train_episodes(episodes=20)
    print("✅ DQN Agent primed.")

    print("\n🚀 Starting Live IoMT Defense Pipeline (Ctrl+C to stop)...\n")
    seq = 0
    try:
        while seq < max_cycles:
            seq += 1
            for pid in patients:
                # 1. Generate Telemetry (with probabilistic acute events)
                # Patient 2 has tachycardia spikes; Patient 3 has wandering
                is_spike = (pid == 2 and seq % 12 == 0)
                is_wander = (pid == 3 and seq % 10 == 0)
                tel = simulators[pid].generate(spike=is_spike, wander=is_wander)

                # 2. Cryptographic Signing
                frame = crypto.sign(pid, seq=seq, tel=tel)

                # Simulated attack injection for demonstration:
                # Every 15th cycle on Patient 1, inject an HMAC tamper attack
                is_tampered = (pid == 1 and seq % 15 == 0)
                if is_tampered:
                    frame["signature"]["tag"] = "0000000000000000000000000000000000000000000000000000000000000000"

                # 3. Security Gateway Verification
                ok, reason = crypto.verify(frame)
                status_str = "ACCEPTED" if ok else "REJECTED"

                # 4. Digital Twin Processing (only on verified frames)
                if ok:
                    twin_res = twins[pid].update(tel)
                    map_val = twin_res["map_val"]
                    rpp_val = twin_res["rpp_val"]
                    disc_score = twin_res["discrepancy_score"]
                    is_crisis = twin_res["map_alert"] or twin_res["rpp_alert"]
                else:
                    map_val, rpp_val, disc_score = 0.0, 0.0, 1.0
                    is_crisis = False

                # 5. ML Anomaly Scoring
                norm_score, ml_status = detectors[pid].score(dataclasses.asdict(tel))

                # 6. RL State Aggregator & Action Selection
                agent.env.set_live_state(
                    anomaly=norm_score,
                    twin_diff=disc_score,
                    hmac_fail=0 if ok else 1,
                    auth_fail=0 if ok else 1,
                    traffic=0.5,
                    crit=0.8 if pid in (2, 3) else 0.2,
                    true_attack=not ok,
                    true_crisis=is_crisis
                )
                raw_action = agent.select_action(agent.env.state, eval_mode=True)

                # 7. Safety Shield Audit (Invariant Verification)
                safe_action, shield_note = SafetyShield.audit_action(raw_action, agent.env.state, is_clinical_alert=is_crisis)
                action_str = ACTION_MAP[safe_action]

                # 8. Persist Event to SQLite WAL
                db.execute("""
                    INSERT INTO telemetry_log (
                        patient_id, sequence, timestamp, status, reason,
                        observed_json, map_val, rpp_val, discrepancy, action
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    pid, seq, frame["timestamp"], status_str, reason,
                    json.dumps(dataclasses.asdict(tel)), map_val, rpp_val, disc_score, action_str
                ))
                db.commit()

                # Console log
                symbol = "✅" if ok else "❌"
                print(f"[Cycle {seq:03d} | P{pid}] {symbol} Status={status_str:<8} | HR={tel.heart_rate:5.1f} | MAP={map_val:5.1f} | Anomaly={norm_score:.3f} [{ml_status:<8}] | Action={action_str}")

            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\n🛑 Pipeline gracefully stopped.")

if __name__ == "__main__":
    run_simulation(max_cycles=30)
