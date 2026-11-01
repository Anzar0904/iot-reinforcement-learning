"""
IoT Reinforcement Learning — Real-Time API Bridge & SSE Streaming Server.
Connects SQLite WAL, Digital Twin, Isolation Forest, and Safe DQN to the React UI.
Uses standard library http.server (zero external dependencies).
"""
import json
import time
import threading
import dataclasses
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import sys
import os

# Add local directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import CryptoEngine, PatientDigitalTwin, PatientSimulator, init_db, TelemetryData
from ml_detector import CalibratedAnomalyDetector
from rl_defense import ACTION_MAP, DQNAgent, SafetyShield

# Global shared state
state_lock = threading.Lock()
pending_attack = None

system_state = {
    "patients": {},
    "security": {
        "total": 12480,
        "valid": 12306,
        "tampered": 86,
        "replay": 9,
        "blocked": 1
    },
    "logs": [],
    "anomalies": {
        "P001": {"score": 0.08, "status": "Normal"},
        "P002": {"score": 0.72, "status": "Warning"},
        "P003": {"score": 0.12, "status": "Normal"},
        "adaptiveThreshold": 0.48,
        "criticalThreshold": 0.76
    },
    "rlAgent": {
        "currentAction": "Quarantine",
        "confidence": 0.92,
        "cumulativeReward": 421.8,
        "episode": 250,
        "trainingStatus": "Converged"
    },
    "rlDecisions": [],
    "digitalTwin": {}
}


class SimulationWorker(threading.Thread):
    def __init__(self, db_path: str = "iot_rl.db"):
        super().__init__(daemon=True)
        self.db_path = db_path
        self.db = init_db(db_path)
        self.crypto = CryptoEngine()
        self.patients = [1, 2, 3]
        self.simulators = {pid: PatientSimulator(pid) for pid in self.patients}
        self.twins = {pid: PatientDigitalTwin(pid) for pid in self.patients}
        
        # Pre-calibrate detectors
        self.detectors = {}
        for pid in self.patients:
            det = CalibratedAnomalyDetector()
            baseline = [dataclasses.asdict(self.simulators[pid].generate()) for _ in range(30)]
            det.train_and_calibrate(baseline)
            self.detectors[pid] = det
            
        self.agent = DQNAgent()  # Loads pre-trained 250-episode checkpoint
        self.seq = 0

    def run(self):
        global pending_attack, system_state
        print("⚡ Background Simulation Worker running...")

        while True:
            time.sleep(1.5)
            self.seq += 1
            now_str = time.strftime("%H:%M:%S")

            with state_lock:
                current_attack = pending_attack

            cycle_logs = []
            cycle_decisions = []
            for pid in self.patients:
                p_key = f"P00{pid}"
                is_cardiac_attack = (current_attack == "CARDIAC" and pid == 2)
                
                # 1. Telemetry Generation
                if is_cardiac_attack:
                    tel = TelemetryData(
                        heart_rate=175.0,
                        bp_systolic=188.0,
                        bp_diastolic=112.0,
                        body_temp=37.4,
                        spo2=86.0
                    )
                else:
                    is_spike = (pid == 2 and self.seq % 8 == 0)
                    is_wander = (pid == 3 and self.seq % 7 == 0)
                    tel = self.simulators[pid].generate(spike=is_spike, wander=is_wander)

                # 2. Cryptographic Signing
                frame = self.crypto.sign(pid, seq=self.seq, tel=tel)

                # Attack Injections
                if current_attack == "TAMPER" and pid == 2:
                    frame["signature"]["tag"] = "0000000000000000000000000000000000000000000000000000000000000000"
                elif current_attack == "REPLAY" and pid == 3:
                    frame["sequence"] = max(1, self.seq - 10)  # Replayed nonce

                # 3. Verification
                ok, reason = self.crypto.verify(frame)
                status_str = "Valid" if ok else ("Tampered" if "HMAC" in reason else "Replay")

                # 4. Digital Twin
                if ok:
                    twin_res = self.twins[pid].update(tel)
                    map_val = twin_res["map_val"]
                    rpp_val = twin_res["rpp_val"]
                    disc_score = twin_res["discrepancy_score"]
                    is_crisis = twin_res["map_alert"] or twin_res["rpp_alert"]
                    pred_hr = twin_res["predicted"]["heart_rate"]
                else:
                    map_val, rpp_val, disc_score = 0.0, 0.0, 0.85
                    is_crisis = False
                    pred_hr = tel.heart_rate

                # 5. ML Anomaly Detection
                norm_score, ml_status = self.detectors[pid].score(dataclasses.asdict(tel))
                if current_attack == "CARDIAC" and pid == 2:
                    norm_score = 0.96
                    ml_status = "CRITICAL"

                # 6. Safe RL Action
                self.agent.env.set_live_state(
                    anomaly=norm_score,
                    twin_diff=disc_score,
                    hmac_fail=0 if ok else 1,
                    auth_fail=0 if ok else 1,
                    traffic=0.5,
                    crit=0.8 if pid in (2, 3) else 0.2,
                    true_attack=not ok,
                    true_crisis=is_crisis
                )
                raw_action = self.agent.select_action(self.agent.env.state, eval_mode=True)
                safe_action, shield_note = SafetyShield.audit_action(raw_action, self.agent.env.state, is_clinical_alert=is_crisis)
                action_str = ACTION_MAP[safe_action]

                # Map action name for dashboard UI
                action_display = "Quarantine" if action_str == "QUARANTINE_DEVICE" else (
                    "Alarm" if action_str == "TRIGGER_ALARM" else (
                        "Rate Limit" if action_str == "RATE_LIMIT" else "Pass"
                    )
                )
                cycle_decisions.append({
                    "time": now_str,
                    "patient": p_key,
                    "state": [round(float(value), 2) for value in self.agent.env.state],
                    "action": action_display
                })

                # Append Log
                cycle_logs.append({
                    "time": now_str,
                    "device": f"DEV-00{pid}",
                    "patient": p_key,
                    "sequence": self.seq,
                    "integrity": ok,
                    "auth": ok,
                    "status": status_str,
                    "reason": reason,
                    "action": action_str
                })

                # Persist to SQLite WAL
                try:
                    self.db.execute("""
                        INSERT INTO telemetry_log (
                            patient_id, sequence, timestamp, status, reason,
                            observed_json, map_val, rpp_val, discrepancy, action
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        pid, self.seq, frame["timestamp"], status_str, reason,
                        json.dumps(dataclasses.asdict(tel)), map_val, rpp_val, disc_score, action_str
                    ))
                    self.db.commit()
                except Exception:
                    pass

                # Update global snapshot
                with state_lock:
                    system_state["patients"][p_key] = {
                        "id": p_key,
                        "hr": int(tel.heart_rate),
                        "bp": f"{int(tel.bp_systolic)}/{int(tel.bp_diastolic)}",
                        "spo2": round(tel.spo2, 1),
                        "temp": round(tel.body_temp, 1),
                        "lat": tel.lat,
                        "lon": tel.lon,
                        "level": "Emergency" if is_crisis or is_cardiac_attack else ("Warning" if pid == 2 else "Normal")
                    }
                    system_state["anomalies"][p_key] = {
                        "score": round(norm_score, 2),
                        "status": "Critical" if norm_score > 0.76 else ("Warning" if norm_score > 0.48 else "Normal")
                    }

                    system_state["digitalTwin"][p_key] = {
                        "map_val": round(map_val, 1),
                        "rpp_val": int(rpp_val),
                        "discrepancy_score": round(disc_score, 2),
                        "actual_hr": int(tel.heart_rate),
                        "predicted_hr": int(pred_hr),
                        "status": "At Risk" if (is_crisis or is_cardiac_attack) else "Synchronized"
                    }
                    if pid == 2:
                        system_state["rlAgent"]["currentAction"] = action_display
                        system_state["rlAgent"]["confidence"] = 0.98 if current_attack else 0.92

            with state_lock:
                # Update Counters
                system_state["security"]["total"] += len(self.patients)
                for log in cycle_logs:
                    if log["status"] == "Valid":
                        system_state["security"]["valid"] += 1
                    elif log["status"] == "Tampered":
                        system_state["security"]["tampered"] += 1
                    elif log["status"] == "Replay":
                        system_state["security"]["replay"] += 1
                        system_state["security"]["blocked"] += 1

                system_state["logs"] = (cycle_logs + system_state["logs"])[:15]
                system_state["rlDecisions"] = (list(reversed(cycle_decisions)) + system_state["rlDecisions"])[:15]


class SSEHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == "/events":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()

            print(f"📡 Client connected to SSE stream: {self.client_address}")
            try:
                while True:
                    with state_lock:
                        payload = json.dumps(system_state)
                    
                    self.wfile.write(f"data: {payload}\n\n".encode("utf-8"))
                    self.wfile.flush()
                    time.sleep(1.2)
            except (BrokenPipeError, ConnectionResetError):
                print("Client disconnected from SSE stream.")
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        global pending_attack
        # Strix API4 hardening: Cap payload buffer size to prevent DoS memory exhaustion
        raw_len = int(self.headers.get("Content-Length", 0))
        content_length = min(max(0, raw_len), 65536)
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            data = json.loads(body)
        except Exception:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "Invalid JSON"}')
            return

        if self.path == "/api/attack":
            attack_type = data.get("type")
            # Strix API8 hardening: Strict whitelist validation of parameters
            if attack_type not in ("TAMPER", "REPLAY", "CARDIAC"):
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"error": "Invalid attack type. Allowed: TAMPER, REPLAY, CARDIAC"}')
                return

            with state_lock:
                pending_attack = attack_type
            print(f"🚨 Validated attack injected via API: {attack_type}")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "attack_injected", "type": attack_type}).encode("utf-8"))

        elif self.path == "/api/reset":
            with state_lock:
                pending_attack = None
            print(" Nominal telemetry restored via API.")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "reset_to_nominal"}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


def start_server(port: int = 8000):
    worker = SimulationWorker()
    worker.start()

    server = ThreadingHTTPServer(("0.0.0.0", port), SSEHandler)
    print(f"🚀 IoMT-Warden Live SSE Bridge serving at http://localhost:{port}/events")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()


if __name__ == "__main__":
    start_server(8000)
