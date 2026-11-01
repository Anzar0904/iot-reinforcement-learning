import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  HeartPulse,
  ShieldCheck,
  Search,
  Bot,
  Dna,
  FileBarChart,
  Settings,
  Radio,
  Wifi,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Download,
  Play,
  RotateCcw,
  Zap,
  Activity,
  User,
  ShieldAlert,
  Server,
  Target,
  Users
} from 'lucide-react';

// ==========================================
// MOCK DATA & SIMULATION STATE
// ==========================================

const INITIAL_PATIENTS = {
  P001: {
    id: 'P001',
    name: 'P001 – Healthy',
    status: 'Walking (baseline)',
    level: 'Normal',
    hr: 72,
    bp: '118/76',
    spo2: 98,
    temp: 36.6,
    lat: 38.8462,
    lon: -77.3064,
    color: '#10b981',
    history: [71, 72, 70, 73, 72, 71, 72, 74, 72, 73, 72]
  },
  P002: {
    id: 'P002',
    name: 'P002 – Cardiac',
    status: 'Tachycardia risk',
    level: 'Warning',
    hr: 126,
    bp: '146/92',
    spo2: 96,
    temp: 37.1,
    lat: 38.8462,
    lon: -77.3064,
    color: '#f59e0b',
    history: [118, 120, 122, 124, 125, 128, 127, 126, 129, 131, 126]
  },
  P003: {
    id: 'P003',
    name: 'P003 – Alzheimer',
    status: 'Wandering (monitored)',
    level: 'Normal',
    hr: 78,
    bp: '124/80',
    spo2: 97,
    temp: 36.8,
    lat: 38.8462,
    lon: -77.3064,
    color: '#ef4444',
    history: [76, 77, 79, 78, 80, 78, 77, 79, 78, 80, 78]
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('vitals');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [selectedTwinPatient, setSelectedTwinPatient] = useState('all');
  const [attackActive, setAttackActive] = useState(null);
  const [selectedSecurityLog, setSelectedSecurityLog] = useState(undefined);
  const [securityDeviceFilter, setSecurityDeviceFilter] = useState('all');
  const [securityPatientFilter, setSecurityPatientFilter] = useState('all');
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [previewFigure, setPreviewFigure] = useState(null);
  const statRate = (value) => securityStats.total ? ((value / securityStats.total) * 100).toFixed(2) : '0.00';

  const downloadEvaluationCsv = () => {
    const csv = [
      'Method,Accuracy,Precision,Recall,F1,FPR,Missed Events,Average Latency (ms)',
      'Rule-Based,0.944,1.000,0.508,0.673,0.000,1301,0.00',
      'Isolation Forest,0.871,0.446,0.551,0.493,0.088,1187,0.00',
      'Threshold Policy + Safety Shield,0.910,0.558,1.000,0.716,0.102,0,0.37'
    ].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'synthetic-evaluation-results.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Live state
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [bpHistory, setBpHistory] = useState({ P001: [[118, 76]], P002: [[146, 92]], P003: [[124, 80]] });
  const [locationHistory, setLocationHistory] = useState([[38.8462, -77.3064]]);
  const [locationFeedLive, setLocationFeedLive] = useState(false);
  const [mapLat, mapLon] = locationHistory.at(-1) || [38.8462, -77.3064];
  const geofenceDistance = locationFeedLive ? Math.round(Math.hypot((mapLat - 38.8462) * 111320, (mapLon + 77.3064) * 86600)) : null;
  const [securityStats, setSecurityStats] = useState({
    total: 12480,
    valid: 12306,
    tampered: 86,
    replay: 9,
    blocked: 1
  });

  const [messageLogs, setMessageLogs] = useState([
    { time: '14:36:17', device: 'DEV-001', patient: 'P001', integrity: true, auth: true, status: 'Valid' },
    { time: '14:36:15', device: 'DEV-002', patient: 'P002', integrity: true, auth: true, status: 'Valid' },
    { time: '14:36:12', device: 'DEV-003', patient: 'P003', integrity: true, auth: true, status: 'Valid' },
    { time: '14:36:08', device: 'DEV-002', patient: 'P002', integrity: false, auth: true, status: 'Tampered' },
    { time: '14:36:05', device: 'DEV-003', patient: 'P003', integrity: true, auth: false, status: 'Replay' }
  ]);
  const visibleSecurityLogs = messageLogs.filter(log =>
    (securityDeviceFilter === 'all' || log.device === securityDeviceFilter) &&
    (securityPatientFilter === 'all' || log.patient === securityPatientFilter)
  );
  const securityLogKey = (log) => log.sequence || (log.time + log.device);
  const activeSecurityLog = selectedSecurityLog === undefined ? visibleSecurityLogs[0] : visibleSecurityLogs.find(log => securityLogKey(log) === selectedSecurityLog);

  const [anomalies, setAnomalies] = useState({
    P001: { score: 0.08, status: 'Normal' },
    P002: { score: 0.72, status: 'Warning' },
    P003: { score: 0.12, status: 'Normal' },
    adaptiveThreshold: 0.48,
    criticalThreshold: 0.76
  });

  const [rlAgentState, setRlAgentState] = useState({
    currentAction: 'Quarantine',
    confidence: 0.92,
    cumulativeReward: 421.8,
    episode: 250,
    totalEpisodes: 250,
    trainingStatus: 'Converged'
  });
  const [digitalTwins, setDigitalTwins] = useState({});
  const [settingsConfig, setSettingsConfig] = useState({ safety: 'Deterministic Override (Non-Bypassable)', ewma: '0.35', contamination: '0.05', secret: 'sha256:****************' });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [rlDecisions, setRlDecisions] = useState([
    { time: '14:36:17', patient: 'P003', state: '[0.12, 0.09, 1, 1, 0.12, 0.33]', action: 'Pass' },
    { time: '14:36:15', patient: 'P002', state: '[0.72, 0.68, 1, 1, 0.41, 0.78]', action: 'Quarantine' },
    { time: '14:36:12', patient: 'P001', state: '[0.08, 0.07, 1, 1, 0.10, 0.21]', action: 'Pass' }
  ]);

  // Live timer & Python SSE Stream listener
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);

    let es = null;
    try {
      es = new EventSource('http://localhost:8000/events');
      es.onopen = () => setIsLiveBackend(true);
      es.onerror = () => {
        setIsLiveBackend(false);
        setLocationFeedLive(false);
      };
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.patients) {
            const p3 = data.patients.P003;
            if (p3?.lat != null && p3?.lon != null) {
              setLocationFeedLive(true);
              setLocationHistory(path => [...path.slice(-29), [p3.lat, p3.lon]]);
            }
            setBpHistory(history => {
              const next = { ...history };
              Object.entries(data.patients).forEach(([id, p]) => {
                if (!p.bp) return;
                const [sys, dia] = p.bp.split('/').map(Number);
                next[id] = [...(history[id] || []), [sys, dia]].slice(-20);
              });
              return next;
            });
            setPatients(prev => {
              const next = { ...prev };
              Object.keys(data.patients).forEach(k => {
                if (next[k]) {
                  const p = data.patients[k];
                  const history = [...(next[k].history || [p.hr]).slice(1), p.hr];
                  next[k] = { ...next[k], ...p, history };
                }
              });
              return next;
            });
          }
          if (data.security) setSecurityStats(data.security);
          if (data.logs && data.logs.length > 0) setMessageLogs(data.logs);
          if (data.anomalies) setAnomalies(data.anomalies);
          if (data.rlAgent) setRlAgentState(data.rlAgent);
          if (data.rlDecisions && data.rlDecisions.length > 0) setRlDecisions(data.rlDecisions);
          if (data.digitalTwin) setDigitalTwins(data.digitalTwin);
        } catch (err) {
          console.error("SSE parse error", err);
        }
      };
    } catch (err) {
      setIsLiveBackend(false);
    }

    return () => {
      clearInterval(timer);
      if (es) es.close();
    };
  }, []);

  // Attack injector (posts to Python SSE backend)
  const triggerAttack = async (type) => {
    setAttackActive(type);
    try {
      await fetch('http://localhost:8000/api/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    } catch (e) {
      console.warn('Backend offline, simulated local attack state applied.');
    }
  };

  const clearAttack = async () => {
    setAttackActive(null);
    try {
      await fetch('http://localhost:8000/api/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Backend offline, reset locally.');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vitals', label: 'Patient Vitals', icon: HeartPulse },
    { id: 'security', label: 'Security & Integrity', icon: ShieldCheck },
    { id: 'anomaly', label: 'ML Anomaly Detection', icon: Search },
    { id: 'rl', label: 'RL Defense Agent', icon: Bot },
    { id: 'twin', label: 'Digital Twin', icon: Dna },
    { id: 'reports', label: 'Experiments & Reports', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className={'app-shell ' + (activeTab === 'dashboard' ? 'dashboard-view' : '')} style={{ display: 'flex', minHeight: '100vh', background: '#f2f3f5', color: '#101828', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ========================================== */}
      {/* LEFT SIDEBAR */}
      {/* ========================================== */}
      <aside className="app-sidebar" style={{
        width: 260,
        background: '#fafafa',
        borderRight: '1px solid #e4e6e9',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 24px 8px', borderBottom: '1px solid #e4e6e9' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 7,
            background: '#eff6ff',
            border: '1px solid #dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={22} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
              IoT Reinforcement Learning
            </div>
            <div style={{ fontSize: '0.72rem', color: '#667085', fontWeight: 500 }}>
              Secure IoMT Monitoring
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 18, flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.985 }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 6,
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#667085',
                  background: 'transparent',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'color 0.15s ease'
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && <motion.span
                  layoutId="active-navigation-item"
                  className="sidebar-nav-indicator"
                  transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                />}
                <Icon size={18} color={isActive ? '#2563eb' : '#667085'} style={{ position: 'relative', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Attack Injector Quick bar */}
        <div style={{
          background: '#f8f9fb',
          borderRadius: 10,
          padding: 12,
          border: '1px solid #f8f9fb'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} color="#f59e0b" /> Attack Simulation
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={() => triggerAttack('TAMPER')}
              style={{
                fontSize: '0.7rem',
                padding: '6px',
                borderRadius: 6,
                background: attackActive === 'TAMPER' ? '#7f1d1d' : '#f8f9fb',
                color: '#f87171',
                border: '1px solid #ef4444',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              HMAC Tamper
            </button>
            <button
              onClick={() => triggerAttack('REPLAY')}
              style={{
                fontSize: '0.7rem',
                padding: '6px',
                borderRadius: 6,
                background: attackActive === 'REPLAY' ? '#563b16' : '#f8f9fb',
                color: '#fbbf24',
                border: '1px solid #a8791c',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Replay Nonce
            </button>
            <button
              onClick={() => triggerAttack('CARDIAC')}
              style={{
                fontSize: '0.7rem',
                padding: '6px',
                borderRadius: 6,
                background: attackActive === 'CARDIAC' ? '#7f1d1d' : '#f8f9fb',
                color: '#fbbf24',
                border: '1px solid #f59e0b',
                cursor: 'pointer',
                fontWeight: 600,
                gridColumn: 'span 2'
              }}
            >
              Spoof Cardiac Crisis
            </button>
            {attackActive && (
              <button
                onClick={clearAttack}
                style={{
                  fontSize: '0.7rem',
                  padding: '6px',
                  borderRadius: 6,
                  background: '#064e3b',
                  color: '#34d399',
                  border: '1px solid #10b981',
                  cursor: 'pointer',
                  fontWeight: 600,
                  gridColumn: 'span 2'
                }}
              >
                Reset To Nominal
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================== */}
      <main className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* TOP STATUS HEADER BAR */}
        <header className="app-header" style={{
          height: 64,
          background: '#fafafa',
          borderBottom: '1px solid #e4e6e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>
              {activeTab === 'dashboard' && 'IoT Reinforcement Learning Overview'}
              {activeTab === 'vitals' && 'Live Patient Vitals'}
              {activeTab === 'security' && 'Security & Integrity'}
              {activeTab === 'anomaly' && 'ML Anomaly Detection'}
              {activeTab === 'rl' && 'RL Defense Agent'}
              {activeTab === 'twin' && 'Patient Digital Twin'}
              {activeTab === 'reports' && 'Experiments & Reports'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#667085', marginTop: 2 }}>
              {activeTab === 'vitals' && 'Real-time physiological data from IoMT devices'}
              {activeTab === 'security' && 'Authentication, data integrity, and anti-replay verification'}
              {activeTab === 'anomaly' && 'Unsupervised anomaly detection using Isolation Forest with adaptive thresholds'}
              {activeTab === 'rl' && 'DQN-based autonomous defense for security and patient safety'}
              {activeTab === 'twin' && 'Virtual physiological model, MAP/RPP computation, and discrepancy analysis'}
              {activeTab === 'reports' && 'Model evaluation, security testing, and automatic report generation'}
              {activeTab === 'dashboard' && 'Integrated multi-tier IoMT defense telemetry mirror'}
              {activeTab === 'settings' && 'System Configuration & Parameters'}
            </div>
          </div>

          {/* Right Header Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isLiveBackend ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${isLiveBackend ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
              color: isLiveBackend ? '#34d399' : '#2563eb',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isLiveBackend ? '#10b981' : '#3b82f6' }}></span>
              {isLiveBackend ? 'Python SSE Live' : 'Simulation Standby'}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#2563eb',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              <Wifi size={13} />
              Synthetic Simulation
            </div>

            <div style={{ color: '#667085', fontSize: '0.78rem', fontFamily: 'monospace' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} {currentTime}
            </div>

            {activeTab === 'reports' && (
              <button onClick={downloadEvaluationCsv}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Download size={13} /> Download Reports
              </button>
            )}
          </div>
        </header>

        {/* VIEW CONTAINER */}
        <div className="view-container" style={{ padding: 24, flex: 1 }}>
          <AnimatePresence mode="wait">
            
            {/* ========================================== */}
            {/* VIEW 1: PATIENT VITALS */}
            {/* ========================================== */}
            {(activeTab === 'vitals' || activeTab === 'dashboard') && (
              <motion.div
                key={activeTab === 'dashboard' ? 'dashboard-view' : 'vitals-view'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {activeTab === 'dashboard' && (
                  <div className="overview-kpis">
                    {[
                      { label: 'Active devices', value: '3 / 3', note: 'Synthetic patient nodes', tone: 'blue', icon: <Wifi size={20}/> },
                      { label: 'Frames observed', value: securityStats.total.toLocaleString(), note: 'Across all devices', tone: 'green', icon: <Server size={20}/> },
                      { label: 'Rejected frames', value: (securityStats.tampered + securityStats.replay).toLocaleString(), note: 'Integrity and replay checks', tone: 'red', icon: <ShieldAlert size={20}/> },
                      { label: 'Benchmark latency', value: '0.37 ms', note: 'Recorded synthetic evaluation', tone: 'purple', icon: <Clock size={20}/> }
                    ].map((card, index) => <div className={'overview-kpi ' + card.tone} key={card.label}><div className="overview-kpi-top"><span className="overview-icon">{card.icon}</span><div><span>{card.label}</span><strong>{card.value}</strong></div></div><small>{card.note}</small><div className={'overview-spark spark-' + index} aria-hidden="true">{[2,3,2,4,2,3,5,3,2,4,6,3,5,7,4,8,6,10,8,12].map((h,i)=><i key={i} style={{height: `${h * 2}px`}}/>)}</div></div>)}
                  </div>
                )}
                {/* Patient status overview */}
                <section className="patient-monitor">
                  <div className="patient-monitor-head"><h3><Users size={20}/>{activeTab === 'dashboard' ? 'All Patient Monitoring' : 'All Patient Vitals'}</h3><span>{isLiveBackend ? 'Live telemetry' : 'Simulation data'} · {Object.keys(patients).length} devices</span></div>
                  <div className="patient-monitor-scroll"><table className="patient-monitor-table">
                    <thead><tr><th>Patient ID</th><th>Status</th><th>Activity</th><th>Heart Rate (bpm)</th><th>Blood Pressure (mmHg)</th><th>SpO₂ (%)</th><th>Temperature (°C)</th></tr></thead>
                    <tbody>{Object.values(patients).map((patient, index) => <motion.tr key={patient.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] }}>
                      <td><strong>{patient.id}</strong></td>
                      <td><span className={'patient-level patient-status-'+patient.id}><i/>{patient.name.split('–')[1]?.trim()}</span></td>
                      <td><span className={'activity-pill activity-' + patient.id}>{patient.status}</span></td>
                      <td>{patient.hr}<small>bpm</small></td><td>{patient.bp}<small>mmHg</small></td><td>{patient.spo2}<small>%</small></td><td>{patient.temp}<small>°C</small></td>
                    </motion.tr>)}</tbody>
                  </table></div>
                </section>



                <div className="vitals-layout">
                {/* Big Chart: Heart Rate (Last 5 Minutes) */}
                <div className="vitals-main-chart" style={{
                  background: '#ffffff',
                  border: '1px solid #e4e6e9',
                  borderRadius: 12,
                  padding: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Heart Rate (Last 5 Minutes)</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span> P001 (Healthy)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span> P002 (Cardiac)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }}></span> P003 (Alzheimer)
                      </span>
                    </div>
                  </div>

                  {/* SVG Multi-Line Chart */}
                  <div style={{ height: 200, width: '100%', position: 'relative' }}>
                    <svg viewBox="0 0 900 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      {/* Horizontal Grid lines */}
                      {[50, 70, 90, 110, 130, 150].map((val, i) => {
                        const y = 200 - ((val - 50) / 110) * 180 - 10;
                        return (
                          <g key={val}>
                            <line x1="50" y1={y} x2="880" y2={y} stroke="#e4e6e9" strokeDasharray="3 3" />
                            <text x="35" y={y + 4} fill="#667085" fontSize="10" textAnchor="end">{val}</text>
                          </g>
                        );
                      })}

                      {/* Time X axis */}
                      {['14:31', '14:32', '14:33', '14:34', '14:35', '14:36'].map((t, idx) => (
                        <text key={t} x={50 + idx * 166} y="195" fill="#667085" fontSize="10" textAnchor="middle">{t}</text>
                      ))}

                      {/* Y-axis label */}
                      <text x="-100" y="15" fill="#667085" fontSize="10" transform="rotate(-90)" textAnchor="middle">HR (bpm)</text>

                      {/* Render lines for P001, P002, P003 */}
                      {Object.values(patients).map((p, index) => {
                        const points = p.history.map((val, i) => {
                          const x = 50 + (i / (p.history.length - 1)) * 830;
                          const y = 200 - ((val - 50) / 110) * 180 - 10;
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <g key={p.id}>
                            <motion.polyline
                              fill="none"
                              stroke={p.color}
                              strokeWidth="2.5"
                              points={points}
                              initial={{ pathLength: 0, opacity: 0.35 }}
                              animate={{ pathLength: 1, opacity: 1 }}
                              transition={{ duration: 0.7, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                            />
                            {/* Points */}
                            {p.history.map((val, i) => {
                              const cx = 50 + (i / (p.history.length - 1)) * 830;
                              const cy = 200 - ((val - 50) / 110) * 180 - 10;
                              return <circle key={i} cx={cx} cy={cy} r="3" fill={p.color} />;
                            })}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
                <section className="vitals-map-card" style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 18 }}>
                  <div className="vitals-panel-heading"><div><div style={{ fontWeight: 700 }}>Location &amp; Geofence (P003)</div><div style={{ color: '#667085', fontSize: '.72rem', marginTop: 4 }}>{locationFeedLive ? 'Synthetic patient movement · ' + geofenceDistance + ' m from anchor' : 'Waiting for live coordinate feed'}</div></div><span className={geofenceDistance > 30 ? 'geofence-badge alert' : 'geofence-badge'}>{geofenceDistance == null ? 'Feed unavailable' : geofenceDistance > 30 ? 'Boundary alert' : 'Inside boundary'}</span></div>
                  <svg viewBox="0 0 420 245" role="img" aria-label="P003 simulated location and 30 metre safety boundary" className="geofence-map">
                    <rect width="420" height="245" rx="12" fill="#f8faff"/>
                    <circle cx="210" cy="122" r="76" fill="#f1f4ff" stroke="#7b9cff" strokeWidth="2" strokeDasharray="7 6"/>
                    <path d={locationHistory.map(([lat, lon], i) => {
                      const x = Math.max(30, Math.min(390, 210 + (lon + 77.3064) * 86600 * 2.1));
                      const y = Math.max(28, Math.min(220, 122 - (lat - 38.8462) * 111320 * 2.1));
                      return (i ? 'L' : 'M') + x + ',' + y;
                    }).join(' ')} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
                    <text x="210" y="173" textAnchor="middle" fill="#101828" fontSize="13" fontWeight="600">P003</text>
                    {(() => { const [lat, lon] = locationFeedLive ? locationHistory.at(-1) : [38.8462, -77.3064]; const x = Math.max(30, Math.min(390, 210 + (lon + 77.3064) * 86600 * 2.1)); const y = Math.max(28, Math.min(220, 122 - (lat - 38.8462) * 111320 * 2.1)); return <g><circle cx={x} cy={y} r="9" fill="#ef4444" stroke="#fff" strokeWidth="4"/><circle cx={x} cy={y} r="17" fill="none" stroke="#ef4444" opacity=".25"/></g>; })()}
                  </svg>
                  <div className="map-legend"><span><i className="dot-blue"/> Patient P003</span><span><i className="line-blue"/> Path</span><span><i className="line-dash"/> 30 m boundary</span></div>
                </section>
                <section className="vitals-bp-card" style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 18 }}>
                  <div className="vitals-panel-heading"><div><div style={{ fontWeight: 700 }}>Blood Pressure Trends</div><div style={{ color: '#667085', fontSize: '.72rem', marginTop: 4 }}>Latest readings · mmHg</div></div><span className="bp-current">{patients[selectedTwinPatient]?.bp || patients.P002.bp}</span></div>
                  <svg viewBox="0 0 600 180" className="bp-chart" role="img" aria-label="Live blood pressure readings">
                    {[40, 80, 120, 160].map(v => <g key={v}><line x1="42" y1={170 - v * .8} x2="590" y2={170 - v * .8} stroke="#263342" strokeDasharray="3 5"/><text x="30" y={174 - v * .8} fill="#667085" fontSize="10" textAnchor="end">{v}</text></g>)}
                    {['P001','P002','P003'].map(id => { const values=bpHistory[id] || []; const color=patients[id].color; const points=values.map((v,i)=>(48+i*(532/Math.max(1,values.length-1)))+','+(170-v[0]*.8)).join(' '); return <polyline key={id} points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>; })}
                    <text x="48" y="178" fill="#667085" fontSize="10">Recent samples</text><text x="590" y="178" fill="#667085" fontSize="10" textAnchor="end">Now</text>
                  </svg>
                  <div className="map-legend">{Object.values(patients).map(p => <span key={p.id}><i className="dot" style={{ background: p.color }}/>{p.id} · {p.bp}</span>)}</div>
                </section>
                <section className="vitals-events-card" style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 18 }}>
                  <div className="vitals-panel-heading"><div><div style={{ fontWeight: 700 }}>Recent Security Events</div><div style={{ color: '#667085', fontSize: '.72rem', marginTop: 4 }}>Latest simulated packet checks</div></div><button className="text-button" onClick={() => setActiveTab('security')}>View all</button></div>
                  <div className="event-list">{messageLogs.slice(0, 5).map((log, i) => <div className="event-row" key={log.time + log.device + i}><i className={log.status === 'Valid' ? 'dot-green' : 'dot-red'}/><span className="event-time">{log.time}</span><span className="event-description">{log.patient} · {log.status === 'Valid' ? 'Frame verified' : log.status + ' frame blocked'}</span><span className={'event-status ' + (log.status === 'Valid' ? 'status-valid' : 'status-alert')}>{log.status}</span></div>)}</div>
                </section>
                </div>
              </motion.div>
            )}

            {/* VIEW 2: SECURITY */}
            {activeTab === 'security' && <motion.div key="security-view" className="security-page" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:0.22,ease:[0.16,1,0.3,1]}}>
              <div className="security-titlebar">
                <div className="security-heading"><ShieldCheck size={38}/><div><h1>Security &amp; Integrity</h1><p>Live packet audit and message authentication monitor for IoT devices</p></div></div>
                <div className="security-actions"><button className="attack-tamper" onClick={()=>triggerAttack('TAMPER')}><Zap size={16}/>Inject HMAC Tamper</button><button className="attack-replay" onClick={()=>triggerAttack('REPLAY')}><RotateCcw size={16}/>Inject Replay</button><button className="attack-reset" onClick={clearAttack}><RotateCcw size={16}/>Reset Simulation</button></div>
              </div>
              <div className="security-metrics">
                {[
                  ['Frames observed', securityStats.total.toLocaleString(), 'blue'],
                  ['Valid', securityStats.valid.toLocaleString(), 'green'],
                  ['Tampered', securityStats.tampered.toLocaleString(), 'red'],
                  ['Replay attempts', securityStats.replay.toLocaleString(), 'amber'],
                  ['Unauthorized / blocked', securityStats.blocked.toLocaleString(), 'red']
                ].map(([label,value,tone])=><div className={'security-metric-card '+tone} key={label}><span>{label}</span><strong>{value}</strong><div className="metric-dots">{Array.from({length:18},(_,i)=><i key={i} style={{height:`${5+(i%7)*3}px`}}/>)}</div></div>)}
              </div>
              <div className="security-main-grid">
                <section className="security-panel security-audit">
                  <div className="security-panel-heading"><div className="security-audit-title"><h2>Live Packet Audit</h2><span className="stream-state"><i/>{isLiveBackend?'Streaming live':'Simulation standby'}</span><span className="audit-count">{visibleSecurityLogs.length} packets (latest)</span></div><div className="security-filters">
                    <select aria-label="Filter by device" value={securityDeviceFilter} onChange={e=>setSecurityDeviceFilter(e.target.value)}><option value="all">All Devices</option>{[...new Set(messageLogs.map(x=>x.device))].map(x=><option key={x}>{x}</option>)}</select>
                    <select aria-label="Filter by patient" value={securityPatientFilter} onChange={e=>setSecurityPatientFilter(e.target.value)}><option value="all">All Patients</option>{[...new Set(messageLogs.map(x=>x.patient))].map(x=><option key={x}>{x}</option>)}</select>
                  </div></div>
                  <div className="security-table-wrap"><table className="security-table"><thead><tr><th>Timestamp</th><th>Device</th><th>Patient</th><th>Sequence</th><th>HMAC Status</th><th>Replay Check</th><th>Gateway Action</th></tr></thead><tbody>{visibleSecurityLogs.slice(0,5).map((log,i)=>{const bad=log.status==='Tampered'||log.integrity===false;const replay=log.status==='Replay';return <tr key={log.sequence||log.time+log.device+i} className={activeSecurityLog && securityLogKey(activeSecurityLog)===securityLogKey(log)?'selected':''} onClick={()=>setSelectedSecurityLog(securityLogKey(log))}><td>{log.time}</td><td><span className="device-mark"><Activity size={16}/>{log.device}</span></td><td>{log.patient}</td><td>{log.sequence??'—'}</td><td><span className={'security-badge '+(bad?'bad':'good')}>{bad?'TAMPERED':'VALID'}</span></td><td><span className={'security-badge '+(replay?'warn':'good')}>{replay?'REPLAY':'OK'}</span></td><td><span className={'security-badge '+(log.status==='Valid'?'good':'bad')}>{log.action||(log.status==='Valid'?'ACCEPTED':'REJECTED')}</span></td></tr>})}</tbody></table>{!visibleSecurityLogs.length&&<div className="security-empty">No packet events match these filters.</div>}</div>
                </section>
                <div className="security-side-stack">
                  <section className="security-panel"><div className="security-section-heading"><h2>Integrity Summary</h2><span>Recent activity</span></div><div className="integrity-grid">
                    <div className="integrity-metric"><span>Valid Packets</span><strong className="good-text">{securityStats.valid.toLocaleString()}</strong><b>{statRate(securityStats.valid)}%</b><i><em style={{width:statRate(securityStats.valid)+'%'}}/></i></div>
                    <div className="integrity-metric"><span>Tampered (HMAC)</span><strong className="bad-text">{securityStats.tampered.toLocaleString()}</strong><b>{statRate(securityStats.tampered)}%</b><i><em className="bar-red" style={{width:Math.max(7,Number(statRate(securityStats.tampered)))+'%'}}/></i></div>
                    <div className="integrity-metric"><span>Replay Detected</span><strong className="warn-text">{securityStats.replay.toLocaleString()}</strong><b>{statRate(securityStats.replay)}%</b><i><em className="bar-amber" style={{width:Math.max(7,Number(statRate(securityStats.replay)))+'%'}}/></i></div>
                    <div className="integrity-metric"><span>Rejected (Total)</span><strong className="bad-text">{(securityStats.tampered+securityStats.replay).toLocaleString()}</strong><b>{statRate(securityStats.tampered+securityStats.replay)}%</b><i><em className="bar-red" style={{width:Math.max(7,Number(statRate(securityStats.tampered+securityStats.replay)))+'%'}}/></i></div>
                  </div></section>
                  <section className="security-panel threat-timeline"><div className="security-section-heading"><h2>Recent Threat Timeline</h2><span>Latest events</span></div><div className="timeline-list">{messageLogs.slice(0,5).map((log,i)=><button key={log.time+i} onClick={()=>setSelectedSecurityLog(securityLogKey(log))} className="timeline-event"><i className={log.status==='Replay'?'timeline-amber':log.status==='Valid'?'timeline-green':''}/><time>{log.time}</time><span><b>{log.status==='Replay'?'Replay':log.status==='Tampered'?'Tampered':'Valid'}</b><small>{log.status==='Valid'?'Packet accepted':'Security check flagged'} ({log.patient}, {log.device})</small></span><strong className={'timeline-status '+(log.status==='Valid'?'accepted':log.status==='Replay'?'replay':'rejected')}>{log.status==='Valid'?'VALID':log.status==='Replay'?'REPLAY':'TAMPERED'}</strong></button>)}</div></section>
                </div>
              </div>
              <section className="security-panel security-controls"><div className="security-section-heading"><h2>Simulation Controls</h2><span>Trigger a test event</span></div><div className="security-control-list">
                <button className="control-tamper" onClick={()=>triggerAttack('TAMPER')}><ShieldAlert size={20}/><span><b>Inject HMAC Tamper</b><small>Send a packet with an invalid HMAC</small></span></button>
                <button className="control-replay" onClick={()=>triggerAttack('REPLAY')}><RotateCcw size={20}/><span><b>Inject Replay</b><small>Resend a previously seen packet</small></span></button>
                <button className="control-reset" onClick={clearAttack}><RotateCcw size={20}/><span><b>Reset Simulation</b><small>Clear events and reset counters</small></span></button>
              </div></section>
              <section className="security-panel event-details"><div className="security-section-heading"><div className="details-title"><h2>Event Details</h2><span>Selected packet and security metadata</span></div><button className="details-clear" aria-label="Clear selected event" onClick={()=>setSelectedSecurityLog(null)}>×</button></div>
                {activeSecurityLog?<div className="event-detail-grid"><dl className="packet-fields">
                  <div><dt>Timestamp</dt><dd>{activeSecurityLog.time}</dd></div><div><dt>Device</dt><dd>{activeSecurityLog.device}</dd></div><div><dt>Patient (Simulated)</dt><dd>{activeSecurityLog.patient}</dd></div><div><dt>Sequence Number</dt><dd>{activeSecurityLog.sequence??'Not provided by feed'}</dd></div>
                  <div><dt>HMAC Status</dt><dd>{activeSecurityLog.status==='Tampered'?'TAMPERED':'VALID'}</dd></div><div><dt>Replay Check</dt><dd>{activeSecurityLog.status==='Replay'?'REPLAY':'OK'}</dd></div><div><dt>Gateway Action</dt><dd>{activeSecurityLog.action||(activeSecurityLog.status==='Valid'?'ACCEPTED':'REJECTED')}</dd></div><div><dt>Reason</dt><dd>{activeSecurityLog.reason||(activeSecurityLog.status==='Valid'?'Authentication checks passed':activeSecurityLog.status+' packet rejected')}</dd></div>
                </dl><div className="payload-column"><h3>Packet Record (JSON)</h3><pre>{JSON.stringify({device_id:activeSecurityLog.device,patient_id:activeSecurityLog.patient,sequence:activeSecurityLog.sequence??null,timestamp:activeSecurityLog.time,hmac_valid:activeSecurityLog.integrity,gateway_action:activeSecurityLog.action||null,reason:activeSecurityLog.reason||null},null,2)}</pre></div><dl className="signature-fields"><h3>Verification Metadata</h3><div><dt>HMAC verification</dt><dd>{activeSecurityLog.integrity===false?'FAILED':activeSecurityLog.integrity===true?'PASSED':'Unavailable'}</dd></div><div><dt>Replay detection</dt><dd>{activeSecurityLog.status==='Replay'?'DETECTED':'CLEAR'}</dd></div><div><dt>Gateway result</dt><dd>{activeSecurityLog.status==='Valid'?'ACCEPTED':'REJECTED'}</dd></div><div><dt>Source</dt><dd>{isLiveBackend?'Live simulation feed':'Local sample data'}</dd></div></dl></div>:<div className="security-empty">Select a packet above to inspect its event details.</div>}
              </section>
            </motion.div>}

            {/* ========================================== */}
            {/* VIEW 3: ML ANOMALY DETECTION */}
            {/* ========================================== */}
            {activeTab === 'anomaly' && (
              <motion.div
                key="anomaly-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* 5 KPI Stat Cards */}
                <div className="anomaly-score-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#667085' }}>Anomaly Score (P001)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#34d399' }}>{anomalies.P001.score.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>({anomalies.P001.status})</div>
                    <div className="score-track"><i style={{width:`${anomalies.P001.score*100}%`}}/></div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#667085' }}>Anomaly Score (P002)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#fbbf24' }}>{anomalies.P002.score.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#fde68a' }}>({anomalies.P002.status})</div>
                    <div className="score-track warning"><i style={{width:`${anomalies.P002.score*100}%`}}/></div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#667085' }}>Anomaly Score (P003)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#34d399' }}>{anomalies.P003.score.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>({anomalies.P003.status})</div>
                    <div className="score-track"><i style={{width:`${anomalies.P003.score*100}%`}}/></div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#667085' }}>Adaptive Threshold (T₁)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#101828' }}>{anomalies.adaptiveThreshold}</div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#667085' }}>Critical Threshold (T₂)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#ef4444' }}>{anomalies.criticalThreshold}</div>
                  </div>
                </div>

                {/* Bottom Row: Anomaly Score Chart + Recent Anomalies Table */}
                <div className="anomaly-content-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 16 }}>
                  {/* Chart */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Anomaly Score (Real-time)</div>
                      <div style={{ display: 'gap', gap: 12, fontSize: '0.72rem' }}>
                        <span style={{ color: '#10b981', marginRight: 12 }}>— P001</span>
                        <span style={{ color: '#f59e0b', marginRight: 12 }}>— P002</span>
                        <span style={{ color: '#2563eb', marginRight: 12 }}>— P003</span>
                        <span style={{ color: '#ef4444', marginRight: 12 }}>- - T₂ (Critical)</span>
                        <span style={{ color: '#f59e0b' }}>- - T₁ (Warning)</span>
                      </div>
                    </div>

                    <div style={{ height: 200, width: '100%' }}>
                      <svg viewBox="0 0 600 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        {/* Horizontal grid */}
                        {[0.0, 0.2, 0.4, 0.6, 0.8, 1.0].map((v) => {
                          const y = 180 - v * 160;
                          return (
                            <g key={v}>
                              <line x1="40" y1={y} x2="580" y2={y} stroke="#e4e6e9" strokeDasharray="3 3" />
                              <text x="30" y={y + 4} fill="#667085" fontSize="9" textAnchor="end">{v.toFixed(1)}</text>
                            </g>
                          );
                        })}

                        {/* Critical line T2 = 0.76 */}
                        <line x1="40" y1={180 - 0.76 * 160} x2="580" y2={180 - 0.76 * 160} stroke="#ef4444" strokeDasharray="5 5" strokeWidth="1.5" />
                        {/* Warning line T1 = 0.48 */}
                        <line x1="40" y1={180 - 0.48 * 160} x2="580" y2={180 - 0.48 * 160} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth="1.5" />

                        {/* P001 baseline */}
                        <polyline fill="none" stroke="#10b981" strokeWidth="2" points="40,165 140,167 240,166 340,164 440,166 540,165" />
                        {/* P003 baseline */}
                        <polyline fill="none" stroke="#2563eb" strokeWidth="2" points="40,160 140,162 240,158 340,161 440,159 540,160" />
                        {/* P002 spiking curve */}
                        <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" points="40,120 140,122 240,121 340,120 390,95 440,75 490,72 540,68" />
                      </svg>
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Recent Anomalies</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ color: '#667085', borderBottom: '1px solid #e4e6e9', textAlign: 'left' }}>
                          <th style={{ padding: '8px 4px' }}>Time</th>
                          <th style={{ padding: '8px 4px' }}>Patient</th>
                          <th style={{ padding: '8px 4px' }}>Score</th>
                          <th style={{ padding: '8px 4px' }}>Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #eceef1' }}>
                          <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#667085' }}>14:36:12</td>
                          <td style={{ padding: '10px 4px', color: '#2563eb' }}>P002</td>
                          <td style={{ padding: '10px 4px', fontWeight: 700 }}>0.72</td>
                          <td style={{ padding: '10px 4px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                              Warning
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eceef1' }}>
                          <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#667085' }}>14:34:27</td>
                          <td style={{ padding: '10px 4px', color: '#2563eb' }}>P002</td>
                          <td style={{ padding: '10px 4px', fontWeight: 700 }}>0.69</td>
                          <td style={{ padding: '10px 4px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                              Warning
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eceef1' }}>
                          <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#667085' }}>14:31:05</td>
                          <td style={{ padding: '10px 4px', color: '#2563eb' }}>P003</td>
                          <td style={{ padding: '10px 4px', fontWeight: 700 }}>0.18</td>
                          <td style={{ padding: '10px 4px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                              Normal
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eceef1' }}>
                          <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#667085' }}>14:30:52</td>
                          <td style={{ padding: '10px 4px', color: '#2563eb' }}>P001</td>
                          <td style={{ padding: '10px 4px', fontWeight: 700 }}>0.09</td>
                          <td style={{ padding: '10px 4px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                              Normal
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================== */}
            {/* VIEW 4: RL DEFENSE AGENT */}
            {/* ========================================== */}
            {activeTab === 'rl' && (
              <motion.div
                key="rl-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="rl-page"
              >
                <div className="synthetic-notice"><span>i</span><div><strong>Synthetic simulation</strong><small>This page shows results from a synthetic simulation environment.</small></div></div>
                {/* 5 KPI Stat Cards */}
                <div className="rl-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                  {/* Current Action */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={16} color="#ef4444" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#667085' }}>Current Action</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#f87171' }}>{rlAgentState.currentAction}</div>
                      </div>
                    </div>
                  </div>

                  {/* Policy Confidence */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={16} color="#7db8dc" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#667085' }}>Policy Confidence</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2 }}>{rlAgentState.confidence}</div>
                      </div>
                    </div>
                  </div>

                  {/* Cumulative Reward */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={16} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#667085' }}>Cumulative Reward</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#34d399' }}>+{rlAgentState.cumulativeReward}</div>
                      </div>
                    </div>
                  </div>

                  {/* Episode */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={16} color="#2563eb" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#667085' }}>Episode</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2 }}>{rlAgentState.episode} / {rlAgentState.totalEpisodes}</div>
                      </div>
                    </div>
                  </div>

                  {/* Training Status */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={16} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#667085' }}>Training Status</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#34d399' }}>{rlAgentState.trainingStatus}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: RL Decision (Live) Table + Training Performance Curve */}
                <div className="rl-content" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 16 }}>
                  {/* Table */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>RL Decision (Live)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ color: '#667085', borderBottom: '1px solid #e4e6e9', textAlign: 'left' }}>
                          <th style={{ padding: '8px 4px' }}>Time</th>
                          <th style={{ padding: '8px 4px' }}>Patient</th>
                          <th style={{ padding: '8px 4px' }}>State (sₜ)</th>
                          <th style={{ padding: '8px 4px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rlDecisions.slice(0, 3).map((dec, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #eceef1' }}>
                            <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#667085' }}>{dec.time}</td>
                            <td style={{ padding: '10px 4px', color: '#2563eb' }}>{dec.patient}</td>
                            <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.72rem' }}>{Array.isArray(dec.state) ? '[' + dec.state.join(', ') + ']' : dec.state}</td>
                            <td style={{ padding: '10px 4px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: dec.action === 'Quarantine' ? 'rgba(239, 68, 68, 0.15)' : dec.action === 'Alarm' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: dec.action === 'Quarantine' ? '#f87171' : dec.action === 'Alarm' ? '#fbbf24' : '#34d399'
                              }}>
                                {dec.action}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Training Performance Chart */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Training Performance</div>
                    <div style={{ height: 180, width: '100%' }}>
                      <svg viewBox="0 0 400 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        {/* Grid */}
                        {[-200, 0, 200, 400, 600].map((v) => {
                          const y = 160 - ((v + 200) / 800) * 140;
                          return (
                            <g key={v}>
                              <line x1="30" y1={y} x2="380" y2={y} stroke="#e4e6e9" strokeDasharray="3 3" />
                              <text x="24" y={y + 3} fill="#667085" fontSize="8" textAnchor="end">{v}</text>
                            </g>
                          );
                        })}

                        {/* Episodes X axis */}
                        {[0, 50, 100, 150, 200, 250].map((ep) => {
                          const x = 30 + (ep / 250) * 350;
                          return <text key={ep} x={x} y="175" fill="#667085" fontSize="8" textAnchor="middle">{ep}</text>;
                        })}

                        {/* Reward curve: starts at -150 and converges to +450 */}
                        <path
                          d="M 30,150 Q 80,105 150,75 T 260,55 T 380,48"
                          fill="none"
                          stroke="#a9b6c4"
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================== */}
            {/* VIEW 5: PATIENT DIGITAL TWIN */}
            {/* ========================================== */}
            {/* VIEW 5: PATIENT DIGITAL TWIN */}
            {activeTab === 'twin' && (
              <motion.div
                key="twin-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="twin-overview"
              >
                <section className="twin-selector-card"><User size={22}/><label htmlFor="twin-patient-select">Patient Selection</label><select id="twin-patient-select" value={selectedTwinPatient} onChange={e=>setSelectedTwinPatient(e.target.value)}><option value="all">All Patients</option>{Object.values(patients).map(p=><option value={p.id} key={p.id}>{p.id} · {p.name.split('–')[1]?.trim()}</option>)}</select></section>
                <section className="twin-comparison">
                  <div className="twin-comparison-heading">
                    <div><h2>Patient Digital Twin</h2><p>Latest telemetry and twin calculations for monitored patients</p></div>
                    <span className={isLiveBackend ? 'twin-feed live' : 'twin-feed'}>{isLiveBackend ? 'Live simulation feed' : 'Waiting for simulation feed'}</span>
                  </div>
                  <div className="twin-table-wrap"><table className="twin-comparison-table">
                    <thead><tr><th>Patient</th><th>Clinical state</th><th>Heart rate</th><th>Blood pressure</th><th>SpO₂</th><th>Temp.</th><th>MAP</th><th>RPP</th><th>Discrepancy</th><th>Twin status</th></tr></thead>
                    <tbody>{Object.values(patients).filter(patient => selectedTwinPatient === 'all' || patient.id === selectedTwinPatient).map(patient => {
                      const twin = digitalTwins[patient.id];
                      const level = patient.level || 'Normal';
                      return <tr key={patient.id}>
                        <td><strong>{patient.id}</strong><small>{patient.name.split('–')[1]?.trim()}</small></td>
                        <td><span className={'patient-level patient-status-'+patient.id}><i/>{patient.name.split('–')[1]?.trim()}</span><small>{patient.status}</small></td>
                        <td>{patient.hr}<small>bpm</small></td><td>{patient.bp}<small>mmHg</small></td><td>{patient.spo2}<small>%</small></td><td>{patient.temp}<small>°C</small></td>
                        <td>{twin ? twin.map_val.toFixed(1) : '—'}<small>mmHg</small></td><td>{twin ? twin.rpp_val.toLocaleString() : '—'}</td>
                        <td>{twin ? twin.discrepancy_score.toFixed(2) : '—'}</td><td><span className={'twin-state '+(twin?.status === 'At Risk' ? 'risk' : twin ? 'synced' : '')}>{twin?.status || (isLiveBackend ? 'Updating' : 'Unavailable')}</span></td>
                      </tr>;
                    })}</tbody>
                  </table></div>
                </section>
                <div className="twin-prediction-grid">
                  <section className="twin-chart-card"><h2><Activity size={20}/>Actual vs Predicted Heart Rate (bpm)</h2><div className="twin-chart-legend"><span>━ Actual (mean)</span><span>┈ Predicted (mean)</span></div><svg viewBox="0 0 900 260" role="img" aria-label="Actual and predicted heart rate for all patients">
                    {[0,40,80,120,160].map(v=><g key={v}><line x1="44" x2="880" y1={220-v*1.15} y2={220-v*1.15}/><text x="34" y={224-v*1.15}>{v}</text></g>)}
                    {Object.values(patients).filter(p=>selectedTwinPatient==='all'||p.id===selectedTwinPatient).map(p=>{const points=p.history.map((v,i)=>`${50+i*82},${220-v*1.15}`).join(' ');const predicted=p.history.map((v,i)=>`${50+i*82},${220-(v+(i%3===0?2:-1))*1.15}`).join(' ');return <g key={p.id}><polyline className="twin-actual" stroke={p.color} points={points}/><polyline className="twin-predicted" stroke={p.color} points={predicted}/></g>})}
                    {['0 min','3 min','6 min','9 min','12 min','15 min'].map((t,i)=><text key={t} x={50+i*164} y="248">{t}</text>)}
                  </svg></section>
                  <section className="twin-analysis"><h2><TrendingUp size={20}/>Twin Analysis</h2><div><span>Prediction model</span><b className="analysis-online">Online</b></div><div><span>MAP trend</span><b>Monitoring</b></div><div><span>RPP trend</span><b>Monitoring</b></div><div><span>Physiological drift</span><b>Monitoring</b></div><div><span>Overall status</span><b className="analysis-online">Synchronized</b></div></section>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div
                key="reports-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Secondary Sub-tabs */}
                <div className="report-tabs" style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => document.getElementById('report-evaluation')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '8px 16px', borderRadius: 6, background: '#2563eb', color: '#fff', border: '1px solid #38749a', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <FileBarChart size={14} /> Evaluation Results
                  </button>
                  <button onClick={() => document.getElementById('report-experiments')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '8px 16px', borderRadius: 8, background: '#ffffff', color: '#667085', border: '1px solid #e4e6e9', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Clock size={14} /> Experiment Logs
                  </button>
                  <button onClick={() => document.getElementById('report-figures')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '8px 16px', borderRadius: 8, background: '#ffffff', color: '#667085', border: '1px solid #e4e6e9', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <LayoutDashboard size={14} /> Generated Figures
                  </button>
                </div>

                <div className="report-kpis">{[
                  ['Test scenarios','5','blue',<FileBarChart size={20}/>],['Total samples','50,000','green',<Server size={20}/>],['Attacks detected','5,685','red',<ShieldAlert size={20}/>],['Missed events (synthetic)','0','purple',<Target size={20}/>],['Average response time','412 ms','blue',<Clock size={20}/>]
                ].map(([label,value,tone,icon])=><div className={'report-kpi '+tone} key={label}><span className="report-kpi-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div><span className="report-spark" aria-hidden="true">{[4,3,4,5,4,6,5,8,7,10].map((n,i)=><i key={i} style={{height:`${n*2}px`}}/>)}</span></div>)}</div>

                {/* Table & Summary row */}
                <div id="report-evaluation" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16, scrollMarginTop: 24 }}>
                  {/* Model Evaluation Table */}
                  <div style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Model Evaluation (Test Set)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ color: '#667085', borderBottom: '1px solid #e4e6e9', textAlign: 'left' }}>
                          <th style={{ padding: '8px 6px' }}>Method</th>
                          <th style={{ padding: '8px 6px' }}>Accuracy</th>
                          <th style={{ padding: '8px 6px' }}>Precision</th>
                          <th style={{ padding: '8px 6px' }}>Recall (DR)</th>
                          <th style={{ padding: '8px 6px' }}>F1-Score</th>
                          <th style={{ padding: '8px 6px' }}>FPR</th>
                          <th style={{ padding: '8px 6px' }}>Missed Events (Synthetic)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #eceef1' }}>
                          <td style={{ padding: '10px 6px', color: '#667085' }}>Rule-Based (Baseline)</td>
                          <td style={{ padding: '10px 6px' }}>0.944</td>
                          <td style={{ padding: '10px 6px' }}>1.000</td>
                          <td style={{ padding: '10px 6px' }}>0.508</td>
                          <td style={{ padding: '10px 6px' }}>0.673</td>
                          <td style={{ padding: '10px 6px', color: '#34d399' }}>0.000</td>
                          <td style={{ padding: '10px 6px', color: '#f87171', fontWeight: 600 }}>1,301</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eceef1' }}>
                          <td style={{ padding: '10px 6px', color: '#667085' }}>Isolation Forest</td>
                          <td style={{ padding: '10px 6px' }}>0.871</td>
                          <td style={{ padding: '10px 6px' }}>0.446</td>
                          <td style={{ padding: '10px 6px' }}>0.551</td>
                          <td style={{ padding: '10px 6px' }}>0.493</td>
                          <td style={{ padding: '10px 6px', color: '#fbbf24' }}>0.088</td>
                          <td style={{ padding: '10px 6px', color: '#f87171', fontWeight: 600 }}>1,187</td>
                        </tr>
                        <tr style={{ background: 'rgba(56, 189, 248, 0.07)', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
                          <td style={{ padding: '10px 6px', color: '#2563eb', fontWeight: 700 }}>Threshold Policy + Safety Shield</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#34d399' }}>0.910</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#34d399' }}>0.558</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#34d399' }}>1.000</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#34d399' }}>0.716</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#fbbf24' }}>0.102</td>
                          <td style={{ padding: '10px 6px', fontWeight: 800, color: '#34d399' }}>0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Experiment Summary */}
                  <div id="report-experiments" className="report-summary" style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Experiment Summary</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#667085', display:'inline-flex', alignItems:'center', gap:7 }}><Dna size={14}/> Test Scenarios:</span>
                        <span style={{ fontWeight: 700 }}>5</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#667085', display:'inline-flex', alignItems:'center', gap:7 }}><Server size={14}/> Total Samples:</span>
                        <span style={{ fontWeight: 700 }}>50,000</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#667085', display:'inline-flex', alignItems:'center', gap:7 }}><ShieldAlert size={14}/> Attacks Detected:</span>
                        <span style={{ fontWeight: 700, color: '#f87171' }}>5,685</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#667085', display:'inline-flex', alignItems:'center', gap:7 }}><CheckCircle2 size={14}/> Missed Events (Synthetic):</span>
                        <span style={{ fontWeight: 700, color: '#34d399' }}>0</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#667085', display:'inline-flex', alignItems:'center', gap:7 }}><Clock size={14}/> Avg. Response Time:</span>
                        <span style={{ fontWeight: 700, color: '#2563eb' }}>412 ms</span>
                      </div>
                      <div className="report-patient-coverage"><span>Patient coverage</span><strong>P001 · P002 · P003</strong></div>
                    </div>
                  </div>
                </div>

                <section className="report-patient-section"><h3><User size={19}/>Patient Coverage <span>Evaluation dataset</span></h3><div>{Object.values(patients).map((p,i)=><div className={'coverage-item coverage-'+i} key={p.id}><i/>{p.id}</div>)}</div></section>

                {/* Generated Figures Gallery */}
                <div id="report-figures" style={{ background: '#ffffff', border: '1px solid #e4e6e9', borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Generated Figures</div>
                    <button
                      onClick={() => {
                        ['reward_curve.svg', 'anomaly_score.svg', 'twin_prediction.svg', 'method_comparison.svg'].forEach((f, i) => {
                          setTimeout(() => {
                            const a = document.createElement('a');
                            a.href = `/figures/${f}`;
                            a.download = f;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }, i * 200);
                        });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={13} /> Download All
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    {[
                      { name: 'reward_curve.png', svg: 'reward_curve.svg', title: 'Figure 1: DQN Reward Convergence' },
                      { name: 'anomaly_score.png', svg: 'anomaly_score.svg', title: 'Figure 2: ML Anomaly & Thresholds' },
                      { name: 'twin_prediction.png', svg: 'twin_prediction.svg', title: 'Figure 3: Digital Twin Physiological State' },
                      { name: 'method_comparison.png', svg: 'method_comparison.svg', title: 'Figure 4: Comparative Evaluation (50k)' }
                    ].map((fig, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewFigure(fig)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e4e6e9',
                          borderRadius: 8,
                          padding: 10,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ height: 105, background: '#ffffff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden', padding: 4 }}>
                          <img src={`/figures/${fig.svg}`} alt={fig.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#101828', fontWeight: 600 }}>{fig.title}</div>
                        <div style={{ fontSize: '0.65rem', color: '#667085', fontFamily: 'monospace', marginTop: 2 }}>{fig.name}</div>
                      </div>
                    ))}
                  </div>

                  {/* Figure Preview Modal Lightbox */}
                  {previewFigure && (
                    <div
                      onClick={() => setPreviewFigure(null)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24
                      }}
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d0d5dd',
                          borderRadius: 12,
                          padding: 20,
                          maxWidth: 880,
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#101828' }}>{previewFigure.title}</div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <a
                              href={`/figures/${previewFigure.svg}`}
                              download={previewFigure.name}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#2563eb',
                                color: '#fff',
                                textDecoration: 'none',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              <Download size={13} /> Save Image
                            </a>
                            <button
                              onClick={() => setPreviewFigure(null)}
                              style={{
                                background: '#f8f9fb',
                                color: '#667085',
                                border: '1px solid #d0d5dd',
                                borderRadius: 6,
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                        <div style={{ background: '#fafafa', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'center' }}>
                          <img src={`/figures/${previewFigure.svg}`} alt={previewFigure.title} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ========================================== */}
            {/* VIEW 7: SETTINGS */}
            {/* ========================================== */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="settings-page"
              >
                <section className="settings-section"><h2><ShieldCheck size={23}/>Safety</h2><div className="settings-field"><label htmlFor="safety-mode">Safety Shield Mode</label><select id="safety-mode" value={settingsConfig.safety} onChange={e=>setSettingsConfig({...settingsConfig,safety:e.target.value})}><option>Deterministic Override (Non-Bypassable)</option><option>Deterministic Override</option></select></div></section>
                <section className="settings-section"><h2><Dna size={23}/>Digital Twin</h2><div className="settings-field"><label htmlFor="ewma">EWMA Smoothing Factor (α)</label><input id="ewma" type="number" min="0" max="1" step="0.01" value={settingsConfig.ewma} onChange={e=>setSettingsConfig({...settingsConfig,ewma:e.target.value})}/></div></section>
                <section className="settings-section"><h2><Search size={23}/>Anomaly Detection</h2><div className="settings-field"><label htmlFor="contamination">Isolation Forest Contamination (ν)</label><input id="contamination" type="number" min="0" max="1" step="0.01" value={settingsConfig.contamination} onChange={e=>setSettingsConfig({...settingsConfig,contamination:e.target.value})}/></div></section>
                <section className="settings-section"><h2><Lock size={23}/>Security</h2><div className="settings-field"><label htmlFor="secret">HMAC Secret Key</label><input id="secret" type="password" value={settingsConfig.secret} onChange={e=>setSettingsConfig({...settingsConfig,secret:e.target.value})}/></div></section>
                <section className="settings-system"><div><h2><Radio size={21}/>System Information</h2><div className="settings-sys-row"><span>Source Status <b className="system-dot"/> Python SSE Live</span><span>Simulation Mode <b className="system-dot gray"/> Synthetic Simulation</span></div></div><button onClick={()=>{setSettingsSaved(true);setTimeout(()=>setSettingsSaved(false),2400)}}>{settingsSaved?'Configuration Saved':'Save Configuration'}</button></section>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
