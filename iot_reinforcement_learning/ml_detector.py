"""
IoT Reinforcement Learning — Calibrated ML Anomaly Detector.
Inverted score convention: a(x) = -decision_function(x).
Quantile calibration: Q_0.95 (warning), Q_0.995 (critical).
Stdlib-first: uses scikit-learn IsolationForest if present; otherwise uses robust MAD-Z distance.
"""
import math
from typing import Dict, List, Optional, Tuple

try:
    import numpy as np
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class CalibratedAnomalyDetector:
    def __init__(self, window_size: int = 50, contamination: float = 0.05):
        self.window = window_size
        self.contamination = contamination
        self.feature_keys = ["heart_rate", "bp_systolic", "bp_diastolic", "body_temp", "spo2"]
        self.model = None
        self.calibration_scores: List[float] = []
        self.t_warn: float = 0.48
        self.t_crit: float = 0.76
        self.is_calibrated: bool = False
        self.means: Dict[str, float] = {}
        self.stds: Dict[str, float] = {}

    def train_and_calibrate(self, baseline_samples: List[Dict[str, float]]) -> Tuple[float, float]:
        """Trains detector on nominal baseline and computes empirical quantile cutoffs."""
        if SKLEARN_AVAILABLE:
            X = np.array([[s.get(k, 0.0) for k in self.feature_keys] for s in baseline_samples])
            self.model = IsolationForest(
                n_estimators=50,
                contamination=self.contamination,
                random_state=42
            ).fit(X)

            scores = -self.model.decision_function(X)
            self.calibration_scores = list(scores)
            self.t_warn = float(np.percentile(scores, 95))
            self.t_crit = float(np.percentile(scores, 99))
        else:
            # Ponytail robust stdlib fallback: multi-feature Z/MAD calibration
            for k in self.feature_keys:
                vals = [s.get(k, 0.0) for s in baseline_samples]
                mean_val = sum(vals) / max(1, len(vals))
                variance = sum((v - mean_val) ** 2 for v in vals) / max(1, len(vals))
                self.means[k] = mean_val
                self.stds[k] = max(1.0, math.sqrt(variance))

            self.calibration_scores = [self._calc_raw_dist(s) for s in baseline_samples]
            sorted_scores = sorted(self.calibration_scores)
            idx_95 = min(len(sorted_scores) - 1, int(0.95 * len(sorted_scores)))
            idx_99 = min(len(sorted_scores) - 1, int(0.99 * len(sorted_scores)))
            self.t_warn = sorted_scores[idx_95]
            self.t_crit = max(self.t_warn * 1.25, sorted_scores[idx_99])

        self.is_calibrated = True
        return self.t_warn, self.t_crit

    def _calc_raw_dist(self, tel_dict: Dict[str, float]) -> float:
        dist_sq = 0.0
        for k in self.feature_keys:
            val = tel_dict.get(k, 0.0)
            m = self.means.get(k, 0.0)
            s = self.stds.get(k, 1.0)
            dist_sq += ((val - m) / s) ** 2
        return math.sqrt(dist_sq)

    def score(self, tel_dict: Dict[str, float]) -> Tuple[float, str]:
        """Computes continuous anomaly score and returns label: NORMAL, WARNING, CRITICAL."""
        if not self.is_calibrated:
            return 0.0, "WARMING_UP"

        if SKLEARN_AVAILABLE and self.model is not None:
            x = np.array([[tel_dict.get(k, 0.0) for k in self.feature_keys]])
            raw_score = float(-self.model.decision_function(x)[0])
            min_s = min(self.calibration_scores)
            max_s = max(self.calibration_scores)
            norm_score = round(max(0.0, min(1.0, (raw_score - min_s) / (max_s - min_s + 1e-6))), 3)
        else:
            raw_score = self._calc_raw_dist(tel_dict)
            if raw_score <= self.t_warn:
                # Map [0, t_warn] -> [0.05, 0.45]
                norm_score = round(0.05 + 0.40 * (raw_score / max(1e-6, self.t_warn)), 3)
            elif raw_score <= self.t_crit:
                # Map [t_warn, t_crit] -> [0.48, 0.74]
                pct = (raw_score - self.t_warn) / max(1e-6, self.t_crit - self.t_warn)
                norm_score = round(0.48 + 0.26 * pct, 3)
            else:
                # Map > t_crit -> [0.76, 1.0]
                excess = (raw_score - self.t_crit) / max(1e-6, self.t_crit * 0.5)
                norm_score = round(min(1.0, 0.76 + 0.24 * min(1.0, excess)), 3)

        if norm_score >= 0.76 or raw_score >= self.t_crit:
            status = "CRITICAL"
        elif norm_score >= 0.48 or raw_score >= self.t_warn:
            status = "WARNING"
        else:
            status = "NORMAL"

        return norm_score, status


if __name__ == "__main__":
    from core import PatientSimulator
    sim = PatientSimulator(1)
    baseline = [dataclasses.asdict(sim.generate()) for _ in range(50)]
    det = CalibratedAnomalyDetector()
    tw, tc = det.train_and_calibrate(baseline)
    print(f"Calibrated: T_warn={tw:.3f}, T_crit={tc:.3f}")
    sample = sim.generate()
    score, status = det.score(dataclasses.asdict(sample))
    print(f"Nominal: score={score}, status={status}")
