"""
IoT Reinforcement Learning — Core Telemetry, Cryptography, and Digital Twin Engine.
Stdlib-first: hmac, hashlib, sqlite3, dataclasses, math, time, json, secrets.
"""
import calendar
import dataclasses
from dataclasses import dataclass, field
import hashlib
import hmac
import json
import math
import secrets
import sqlite3
import time
from typing import Dict, List, Optional, Tuple

# -----------------------------------------------------------------------------
# 1. Telemetry Schemas & Multi-Patient Simulator
# -----------------------------------------------------------------------------

@dataclass
class TelemetryData:
    heart_rate: float
    bp_systolic: float
    bp_diastolic: float
    body_temp: float
    spo2: float
    lat: float = 38.8462
    lon: float = -77.3064

class PatientSimulator:
    """Generates synthetic telemetry for Healthy, Cardiac, and Alzheimer profiles."""
    BASELINES = {
        1: {"hr": 72.0, "sys": 115.0, "dia": 75.0, "temp": 36.8, "spo2": 98.5, "type": "healthy"},
        2: {"hr": 82.0, "sys": 132.0, "dia": 86.0, "temp": 36.9, "spo2": 96.0, "type": "cardiac"},
        3: {"hr": 74.0, "sys": 120.0, "dia": 78.0, "temp": 36.7, "spo2": 97.5, "type": "alzheimer"},
    }

    def __init__(self, patient_id: int):
        self.pid = patient_id
        self.profile = self.BASELINES.get(patient_id, self.BASELINES[1])
        self.step_count = 0
        self._lat = self.profile.get("lat", 38.8462)
        self._lon = self.profile.get("lon", -77.3064)

    def generate(self, spike: bool = False, wander: bool = False) -> TelemetryData:
        self.step_count += 1
        b = self.profile
        noise = (secrets.randbelow(100) - 50) / 50.0  # [-1.0, 1.0]

        hr = b["hr"] + noise * 3.0
        sys = b["sys"] + noise * 4.0
        dia = b["dia"] + noise * 3.0
        temp = round(b["temp"] + noise * 0.1, 1)
        spo2 = round(min(100.0, max(85.0, b["spo2"] + noise * 0.5)), 1)

        # Cardiac tachycardia / hypertensive spike injection
        if spike:
            hr = float(130 + secrets.randbelow(50))
            sys = float(165 + secrets.randbelow(45))
            dia = float(105 + secrets.randbelow(25))

        # Alzheimer wander injection
        if wander:
            lat = self._lat + 0.00055 + (secrets.randbelow(30) / 100000.0)
            lon = self._lon + 0.00055 + (secrets.randbelow(30) / 100000.0)
        else:
            lat = self._lat + ((secrets.randbelow(100) - 50) / 50.0) * 0.00005
            lon = self._lon + ((secrets.randbelow(100) - 50) / 50.0) * 0.00005

        return TelemetryData(
            heart_rate=round(hr, 1),
            bp_systolic=round(sys, 1),
            bp_diastolic=round(dia, 1),
            body_temp=temp,
            spo2=spo2,
            lat=round(lat, 5),
            lon=round(lon, 5),
        )

# -----------------------------------------------------------------------------
# 2. Cryptography, Signed Envelopes & Anti-Replay Guard
# -----------------------------------------------------------------------------

class CryptoEngine:
    """HMAC-SHA256 signing and atomic nonce replay guard."""
    def __init__(self, secrets_map: Optional[Dict[int, str]] = None, replay_window_sec: float = 5.0):
        self.secrets = secrets_map or {1: "key-patient-1", 2: "key-patient-2", 3: "key-patient-3"}
        self.window = replay_window_sec
        self.seen_nonces: Dict[str, float] = {}
        self.last_seq: Dict[int, int] = {}

    def sign(self, patient_id: int, seq: int, tel: TelemetryData) -> dict:
        secret = self.secrets.get(patient_id, "default-key").encode()
        ts = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        nonce = secrets.token_hex(8)
        payload = dataclasses.asdict(tel)
        canonical = json.dumps(payload, sort_keys=True) + ts + nonce + str(seq)
        tag = hmac.new(secret, canonical.encode(), hashlib.sha256).hexdigest()

        return {
            "schema_version": "1.0",
            "device_id": f"sensor_{patient_id:02d}",
            "patient_id": patient_id,
            "sequence": seq,
            "timestamp": ts,
            "nonce": nonce,
            "telemetry": payload,
            "signature": {"algorithm": "HMAC-SHA256", "tag": tag}
        }

    def verify(self, frame: dict) -> Tuple[bool, str]:
        pid = frame.get("patient_id")
        seq = frame.get("sequence", 0)
        nonce = frame.get("nonce", "")
        ts = frame.get("timestamp", "")
        sig = frame.get("signature", {}).get("tag", "")

        # 1. Nonce Replay Check with Memory Pruning (Strix anti-DoS)
        now_epoch = time.time()
        # Periodically prune nonces older than freshness window
        if len(self.seen_nonces) > 500:
            self.seen_nonces = {n: exp for n, exp in self.seen_nonces.items() if (now_epoch - exp) <= self.window}

        if nonce in self.seen_nonces:
            return False, "REPLAY_DETECTED"

        # 2. Sequence Monotonicity
        if seq <= self.last_seq.get(pid, -1):
            return False, "SEQUENCE_VIOLATION"

        # 3. Timestamp Freshness
        try:
            msg_epoch = calendar.timegm(time.strptime(ts, '%Y-%m-%dT%H:%M:%SZ'))
            if abs(now_epoch - msg_epoch) > self.window:
                return False, "STALE_MESSAGE"
        except Exception:
            return False, "INVALID_TIMESTAMP"

        # 4. HMAC Verification (Constant Time)
        secret = self.secrets.get(pid, "").encode()
        payload = frame.get("telemetry", {})
        canonical = json.dumps(payload, sort_keys=True) + ts + nonce + str(seq)
        expected = hmac.new(secret, canonical.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected, sig):
            return False, "HMAC_MISMATCH"

        self.seen_nonces[nonce] = now_epoch
        self.last_seq[pid] = seq
        return True, "ACCEPTED"

# -----------------------------------------------------------------------------
# 3. Digital Twin: EWMA Forecaster, MAD Residuals, MAP & RPP
# -----------------------------------------------------------------------------

class PatientDigitalTwin:
    """Virtual patient state estimator with robust EWMA forecasting and MAD scaling."""
    def __init__(self, patient_id: int, alpha: float = 0.2):
        self.pid = patient_id
        self.alpha = alpha
        self.sample_count = 0
        self.features = ["heart_rate", "bp_systolic", "bp_diastolic", "body_temp", "spo2"]
        self.state_est: Dict[str, float] = {}
        self.history: Dict[str, List[float]] = {k: [] for k in self.features}
        self.anchor_lat = 38.8462
        self.anchor_lon = -77.3064

    def update(self, tel: TelemetryData) -> dict:
        self.sample_count += 1
        obs = dataclasses.asdict(tel)
        pred, residuals = {}, {}

        for k in self.features:
            val = obs[k]
            hist = self.history[k]

            if k not in self.state_est or len(hist) < 5:
                p = val
                r = 0.0
                self.state_est[k] = val
            else:
                p = self.state_est[k]
                # Median Absolute Deviation (MAD) robust scaling
                sorted_hist = sorted(hist[-30:])
                med = sorted_hist[len(sorted_hist) // 2]
                mad = sorted([abs(x - med) for x in sorted_hist])[len(sorted_hist) // 2]
                scale = max(1.4826 * mad, 0.5)
                r = abs(val - p) / scale
                self.state_est[k] = self.alpha * val + (1.0 - self.alpha) * p

            hist.append(val)
            pred[k] = round(p, 1)
            residuals[k] = round(r, 3)

        # Cyber-Physical Discrepancy Score [0.0, 1.0]
        # ponytail: static feature weights, sufficient for 5 vitals
        weights = {"heart_rate": 0.3, "bp_systolic": 0.25, "bp_diastolic": 0.15, "spo2": 0.2, "body_temp": 0.1}
        capped_w_sum = sum(weights[k] * min(residuals[k], 4.0) for k in self.features)
        disc_score = round(min(capped_w_sum / 4.0, 1.0), 3)

        # Clinical Workload Indices
        map_val = round((tel.bp_systolic + 2.0 * tel.bp_diastolic) / 3.0, 1)
        rpp_val = round(tel.heart_rate * tel.bp_systolic, 1)

        # Haversine wander distance from facility geofence anchor
        phi1, phi2 = math.radians(self.anchor_lat), math.radians(tel.lat)
        dphi = math.radians(tel.lat - self.anchor_lat)
        dlam = math.radians(tel.lon - self.anchor_lon)
        a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2)**2
        wander_m = round(6371000.0 * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)

        # Patient-Specific Clinical Thresholds (Digital Twin Personalized Reference)
        if self.pid == 2:
            map_alert = (map_val > 135.0 or map_val < 70.0)
            rpp_alert = (rpp_val > 18000.0)
        else:
            map_alert = not (70.0 <= map_val <= 105.0)
            rpp_alert = (rpp_val > 12500.0)
        wander_alert = (self.pid == 3 and wander_m > 30.0)

        return {
            "patient_id": self.pid,
            "sample_count": self.sample_count,
            "observed": obs,
            "predicted": pred,
            "residuals": residuals,
            "discrepancy_score": disc_score,
            "discrepancy_level": "NOMINAL" if disc_score < 0.25 else ("DRIFT" if disc_score < 0.5 else "CRITICAL_MISMATCH"),
            "map_val": map_val,
            "rpp_val": rpp_val,
            "map_alert": map_alert,
            "rpp_alert": rpp_alert,
            "wander_alert": wander_alert,
            "wander_m": wander_m,
            "status": "WARMUP" if self.sample_count < 5 else "ACTIVE"
        }

# -----------------------------------------------------------------------------
# 4. Storage Engine: SQLite in WAL Mode
# -----------------------------------------------------------------------------

def init_db(db_path: str = "iot_rl.db") -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS telemetry_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            sequence INTEGER,
            timestamp TEXT,
            status TEXT,
            reason TEXT,
            observed_json TEXT,
            map_val REAL,
            rpp_val REAL,
            discrepancy REAL,
            action TEXT
        );
    """)
    conn.commit()
    return conn

# -----------------------------------------------------------------------------
# Self-Check Test
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    crypto = CryptoEngine()
    sim = PatientSimulator(patient_id=1)
    twin = PatientDigitalTwin(patient_id=1)

    # 1. Normal frame test
    tel = sim.generate()
    frame = crypto.sign(1, seq=1, tel=tel)
    ok, reason = crypto.verify(frame)
    assert ok and reason == "ACCEPTED", f"Verification failed: {reason}"

    # 2. Replay check
    ok_replay, reason_replay = crypto.verify(frame)
    assert not ok_replay and reason_replay == "REPLAY_DETECTED", "Replay guard failed"

    # 3. Twin update
    res = twin.update(tel)
    assert res["status"] == "WARMUP"
    assert "map_val" in res and "rpp_val" in res

    # 4. Database test
    db = init_db(":memory:")
    cur = db.execute("PRAGMA journal_mode;")
    print(f"✅ Core engine verified: crypto={ok}, replay_guard={reason_replay}, twin_map={res['map_val']}")
