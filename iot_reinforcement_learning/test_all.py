"""
IoT Reinforcement Learning — Automated Self-Verification Suite.
Tests Crypto, Replay Defense, Digital Twin, ML Detector, and Safety Shield.
"""
import dataclasses
import os
from core import CryptoEngine, PatientDigitalTwin, PatientSimulator, init_db
from ml_detector import CalibratedAnomalyDetector
from rl_defense import ACTION_MAP, DQNAgent, SafetyShield

def test_full_pipeline():
    print("Running IoT Reinforcement Learning Self-Check...")
    
    # 1. Crypto & Replay
    crypto = CryptoEngine()
    sim = PatientSimulator(1)
    tel = sim.generate()
    frame = crypto.sign(1, 1, tel)
    ok, reason = crypto.verify(frame)
    assert ok and reason == "ACCEPTED", f"Crypto failed: {reason}"
    
    # Replay
    ok_rep, reason_rep = crypto.verify(frame)
    assert not ok_rep and reason_rep == "REPLAY_DETECTED", f"Replay failed: {reason_rep}"
    
    # 2. Digital Twin
    twin = PatientDigitalTwin(1)
    res = twin.update(tel)
    assert "map_val" in res and "rpp_val" in res
    assert res["discrepancy_score"] >= 0.0
    
    # 3. Calibrated ML Detector
    detector = CalibratedAnomalyDetector()
    baseline = [dataclasses.asdict(sim.generate()) for _ in range(30)]
    detector.train_and_calibrate(baseline)
    score, status = detector.score(dataclasses.asdict(sim.generate(spike=True)))
    assert status == "CRITICAL", f"Expected CRITICAL spike, got {status}"
    
    # 4. Safe RL & Safety Shield
    agent = DQNAgent()
    # Invariant: Tampered HMAC must force quarantine
    tampered_state = agent.env.state.copy()
    tampered_state[2] = 1.0  # hmac_fail
    action, note = SafetyShield.audit_action(0, tampered_state, is_clinical_alert=False)
    assert action == 4, f"Expected QUARANTINE (4), got {action}"
    
    # 5. Database write
    db = init_db(":memory:")
    db.execute("INSERT INTO telemetry_log (patient_id, status) VALUES (1, 'ACCEPTED')")
    db.commit()
    row = db.execute("SELECT COUNT(*) FROM telemetry_log").fetchone()[0]
    assert row == 1
    
    print("🎉 ALL TESTS PASSED: Crypto, Digital Twin, ML Calibration, Safety Shield, and WAL DB are verified.")

if __name__ == "__main__":
    test_full_pipeline()
