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
  Server
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
    color: '#38bdf8',
    history: [76, 77, 79, 78, 80, 78, 77, 79, 78, 80, 78]
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('vitals');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [selectedTwinPatient, setSelectedTwinPatient] = useState('P002');
  const [attackActive, setAttackActive] = useState(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [previewFigure, setPreviewFigure] = useState(null);

  // Live state
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
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

  const [rlDecisions, setRlDecisions] = useState([
    { time: '14:36:17', patient: 'P002', state: '[0.72, 0.68, 1, 1, 0.41, 0.78]', action: 'Quarantine', reward: '+4.2' },
    { time: '14:35:56', patient: 'P002', state: '[0.69, 0.63, 1, 1, 0.38, 0.76]', action: 'Alarm', reward: '+2.5' },
    { time: '14:34:40', patient: 'P003', state: '[0.12, 0.09, 1, 1, 0.12, 0.33]', action: 'Pass', reward: '+1.0' },
    { time: '14:33:21', patient: 'P001', state: '[0.08, 0.07, 1, 1, 0.10, 0.21]', action: 'Pass', reward: '+1.0' }
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
      es.onerror = () => setIsLiveBackend(false);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.patients) {
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#090d16', color: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ========================================== */}
      {/* LEFT SIDEBAR */}
      {/* ========================================== */}
      <aside style={{
        width: 260,
        background: '#0d111d',
        borderRight: '1px solid #1a2234',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 24px 8px', borderBottom: '1px solid #1a2234' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Bot size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
              IoMT-Warden
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
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
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? 'linear-gradient(90deg, rgba(79, 70, 229, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} color={isActive ? '#818cf8' : '#64748b'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Attack Injector Quick bar */}
        <div style={{
          background: '#131b2e',
          borderRadius: 10,
          padding: 12,
          border: '1px solid #1e293b'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} color="#f59e0b" /> Attack Simulation
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={() => triggerAttack('TAMPER')}
              style={{
                fontSize: '0.7rem',
                padding: '6px',
                borderRadius: 6,
                background: attackActive === 'TAMPER' ? '#7f1d1d' : '#1e293b',
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
                background: attackActive === 'REPLAY' ? '#581c87' : '#1e293b',
                color: '#c084fc',
                border: '1px solid #a855f7',
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
                background: attackActive === 'CARDIAC' ? '#7f1d1d' : '#1e293b',
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* TOP STATUS HEADER BAR */}
        <header style={{
          height: 64,
          background: '#0d111d',
          borderBottom: '1px solid #1a2234',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>
              {activeTab === 'dashboard' && 'IoMT-Warden Executive Dashboard'}
              {activeTab === 'vitals' && 'Live Patient Vitals'}
              {activeTab === 'security' && 'Security & Integrity'}
              {activeTab === 'anomaly' && 'ML Anomaly Detection'}
              {activeTab === 'rl' && 'RL Defense Agent (IoMT-Warden)'}
              {activeTab === 'twin' && 'Patient Digital Twin'}
              {activeTab === 'reports' && 'Experiments & Reports'}
              {activeTab === 'settings' && 'System Configuration & Parameters'}
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
              {activeTab === 'vitals' && 'Real-time physiological data from IoMT devices'}
              {activeTab === 'security' && 'Authentication, data integrity, and anti-replay verification'}
              {activeTab === 'anomaly' && 'Unsupervised anomaly detection using Isolation Forest with adaptive thresholds'}
              {activeTab === 'rl' && 'DQN-based autonomous defense for security and patient safety'}
              {activeTab === 'twin' && 'Virtual physiological model, MAP/RPP computation, and discrepancy analysis'}
              {activeTab === 'reports' && 'Model evaluation, security testing, and automatic report generation'}
              {activeTab === 'dashboard' && 'Integrated multi-tier IoMT defense telemetry mirror'}
              {activeTab === 'settings' && 'Safety Shield thresholds, EWMA parameters, and cryptographic keys'}
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
              color: isLiveBackend ? '#34d399' : '#60a5fa',
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
              color: '#38bdf8',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              <Wifi size={13} />
              MQTT (TLS) Connected
            </div>

            <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'monospace' }}>
              Thu, Jan 23, 2025 {currentTime}
            </div>

            {activeTab === 'vitals' && (
              <div style={{
                background: '#4338ca',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                Live (5s)
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{
                background: '#1e293b',
                color: '#cbd5e1',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: '0.75rem',
                border: '1px solid #334155'
              }}>
                Last 30 Minutes ▾
              </div>
            )}

            {activeTab === 'twin' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={selectedTwinPatient}
                  onChange={(e) => setSelectedTwinPatient(e.target.value)}
                  style={{
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="P001">Patient: P001 – Healthy</option>
                  <option value="P002">Patient: P002 – Cardiac</option>
                  <option value="P003">Patient: P003 – Alzheimer</option>
                </select>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span> Live
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#4f46e5',
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
        <div style={{ padding: 24, flex: 1 }}>
          <AnimatePresence mode="wait">
            
            {/* ========================================== */}
            {/* VIEW 1: PATIENT VITALS */}
            {/* ========================================== */}
            {(activeTab === 'vitals' || activeTab === 'dashboard') && (
              <motion.div
                key="vitals-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* 3 Patient Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {Object.values(patients).map(patient => (
                    <div
                      key={patient.id}
                      style={{
                        background: '#111827',
                        border: '1px solid #1f293d',
                        borderRadius: 12,
                        padding: 16
                      }}
                    >
                      {/* Patient Card Top */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `${patient.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <User size={16} color={patient.color} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                              {patient.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {patient.status}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: patient.level === 'Normal' ? 'rgba(16, 185, 129, 0.15)' : patient.level === 'Warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: patient.level === 'Normal' ? '#34d399' : patient.level === 'Warning' ? '#fbbf24' : '#f87171'
                        }}>
                          {patient.level}
                        </span>
                      </div>

                      {/* Patient 4 Metrics Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {/* HR */}
                        <div style={{ background: '#0d131f', padding: '8px 10px', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                            <HeartPulse size={11} color="#f43f5e" /> HR
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 2, color: '#f8fafc' }}>
                            {patient.hr}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b' }}>bpm</div>
                        </div>

                        {/* BP */}
                        <div style={{ background: '#0d131f', padding: '8px 10px', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                            <Activity size={11} color="#38bdf8" /> BP
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, marginTop: 4, color: '#f8fafc' }}>
                            {patient.bp}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b' }}>mmHg</div>
                        </div>

                        {/* SpO2 */}
                        <div style={{ background: '#0d131f', padding: '8px 10px', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                            <Zap size={11} color="#10b981" /> SpO₂
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 2, color: '#f8fafc' }}>
                            {patient.spo2}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b' }}>%</div>
                        </div>

                        {/* Temp */}
                        <div style={{ background: '#0d131f', padding: '8px 10px', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                            <Activity size={11} color="#fbbf24" /> Temp
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: 3, color: '#f8fafc' }}>
                            {patient.temp}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b' }}>°C</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Big Chart: Heart Rate (Last 5 Minutes) */}
                <div style={{
                  background: '#111827',
                  border: '1px solid #1f293d',
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
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }}></span> P003 (Alzheimer)
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
                            <line x1="50" y1={y} x2="880" y2={y} stroke="#1f293d" strokeDasharray="3 3" />
                            <text x="35" y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">{val}</text>
                          </g>
                        );
                      })}

                      {/* Time X axis */}
                      {['14:31', '14:32', '14:33', '14:34', '14:35', '14:36'].map((t, idx) => (
                        <text key={t} x={50 + idx * 166} y="195" fill="#64748b" fontSize="10" textAnchor="middle">{t}</text>
                      ))}

                      {/* Y-axis label */}
                      <text x="-100" y="15" fill="#64748b" fontSize="10" transform="rotate(-90)" textAnchor="middle">HR (bpm)</text>

                      {/* Render lines for P001, P002, P003 */}
                      {Object.values(patients).map((p) => {
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
                              transition={{ duration: 0.5 }}
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
              </motion.div>
            )}

            {/* ========================================== */}
            {/* VIEW 2: SECURITY & INTEGRITY */}
            {/* ========================================== */}
            {activeTab === 'security' && (
              <motion.div
                key="security-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* 5 KPI Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                  {/* Total Messages */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Radio size={16} color="#38bdf8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Messages</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2 }}>{securityStats.total.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Valid */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={16} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Valid</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#34d399' }}>
                          {securityStats.valid.toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#6ee7b7' }}>(98.6%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tampered */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={16} color="#ef4444" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tampered</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#f87171' }}>
                          {securityStats.tampered} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#fca5a5' }}>(0.69%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Replay */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RotateCcw size={16} color="#a855f7" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Replay</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#c084fc' }}>
                          {securityStats.replay} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#d8b4fe' }}>(0.07%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blocked Devices */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lock size={16} color="#f59e0b" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Blocked Devices</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#fbbf24' }}>
                          {securityStats.blocked}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Message Verification Table + Donut Chart */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 16 }}>
                  {/* Table */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Message Verification (Live)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ color: '#64748b', borderBottom: '1px solid #1f293d', textAlign: 'left' }}>
                          <th style={{ padding: '8px 6px' }}>Time</th>
                          <th style={{ padding: '8px 6px' }}>Device ID</th>
                          <th style={{ padding: '8px 6px' }}>Patient ID</th>
                          <th style={{ padding: '8px 6px' }}>Integrity</th>
                          <th style={{ padding: '8px 6px' }}>Auth</th>
                          <th style={{ padding: '8px 6px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {messageLogs.map((log, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #161e2e' }}>
                            <td style={{ padding: '10px 6px', fontFamily: 'monospace', color: '#94a3b8' }}>{log.time}</td>
                            <td style={{ padding: '10px 6px', color: '#cbd5e1' }}>{log.device}</td>
                            <td style={{ padding: '10px 6px', color: '#38bdf8' }}>{log.patient}</td>
                            <td style={{ padding: '10px 6px' }}>
                              {log.integrity ? <CheckCircle2 size={15} color="#10b981" /> : <XCircle size={15} color="#ef4444" />}
                            </td>
                            <td style={{ padding: '10px 6px' }}>
                              {log.auth ? <CheckCircle2 size={15} color="#10b981" /> : <XCircle size={15} color="#ef4444" />}
                            </td>
                            <td style={{ padding: '10px 6px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: log.status === 'Valid' ? 'rgba(16, 185, 129, 0.15)' : log.status === 'Tampered' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                color: log.status === 'Valid' ? '#34d399' : log.status === 'Tampered' ? '#f87171' : '#c084fc'
                              }}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Donut Chart: Security Events (30 min) */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Security Events (30 min)</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 20 }}>
                      <div style={{ position: 'relative', width: 150, height: 150 }}>
                        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                          {/* Valid ring: 98.6% */}
                          <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="12" fill="none" />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#10b981"
                            strokeWidth="12"
                            strokeDasharray="248 251"
                            strokeDashoffset="0"
                            fill="none"
                            strokeLinecap="round"
                          />
                          {/* Tampered: 0.69% */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#ef4444"
                            strokeWidth="12"
                            strokeDasharray="4 251"
                            strokeDashoffset="-246"
                            fill="none"
                          />
                          {/* Replay: 0.07% */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#a855f7"
                            strokeWidth="12"
                            strokeDasharray="2 251"
                            strokeDashoffset="-250"
                            fill="none"
                          />
                        </svg>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1rem', fontWeight: 800 }}>12,480</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Messages</div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                          <span>Valid – 98.6%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
                          <span>Tampered – 0.69%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }}></span>
                          <span>Replay – 0.07%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
                          <span>Blocked – 0.01%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================== */}
            {/* VIEW 3: ML ANOMALY DETECTION */}
            {/* ========================================== */}
            {activeTab === 'anomaly' && (
              <motion.div
                key="anomaly-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* 5 KPI Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Anomaly Score (P001)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#34d399' }}>{anomalies.P001.score.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>({anomalies.P001.status})</div>
                  </div>

                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Anomaly Score (P002)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#fbbf24' }}>{anomalies.P002.score.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#fde68a' }}>({anomalies.P002.status})</div>
                  </div>

                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Anomaly Score (P003)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#34d399' }}>{anomalies.P003.score.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>({anomalies.P003.status})</div>
                  </div>

                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Adaptive Threshold (T₁)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#f8fafc' }}>{anomalies.adaptiveThreshold}</div>
                  </div>

                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Critical Threshold (T₂)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: '#ef4444' }}>{anomalies.criticalThreshold}</div>
                  </div>
                </div>

                {/* Bottom Row: Anomaly Score Chart + Recent Anomalies Table */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 16 }}>
                  {/* Chart */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Anomaly Score (Real-time)</div>
                      <div style={{ display: 'gap', gap: 12, fontSize: '0.72rem' }}>
                        <span style={{ color: '#10b981', marginRight: 12 }}>— P001</span>
                        <span style={{ color: '#f59e0b', marginRight: 12 }}>— P002</span>
                        <span style={{ color: '#38bdf8', marginRight: 12 }}>— P003</span>
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
                              <line x1="40" y1={y} x2="580" y2={y} stroke="#1f293d" strokeDasharray="3 3" />
                              <text x="30" y={y + 4} fill="#64748b" fontSize="9" textAnchor="end">{v.toFixed(1)}</text>
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
                        <polyline fill="none" stroke="#38bdf8" strokeWidth="2" points="40,160 140,162 240,158 340,161 440,159 540,160" />
                        {/* P002 spiking curve */}
                        <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" points="40,120 140,122 240,121 340,120 390,95 440,75 490,72 540,68" />
                      </svg>
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Recent Anomalies</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ color: '#64748b', borderBottom: '1px solid #1f293d', textAlign: 'left' }}>
                          <th style={{ padding: '8px 4px' }}>Time</th>
                          <th style={{ padding: '8px 4px' }}>Patient</th>
                          <th style={{ padding: '8px 4px' }}>Score</th>
                          <th style={{ padding: '8px 4px' }}>Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #161e2e' }}>
                          <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#94a3b8' }}>14:36:12</td>
                          <td style={{ padding: '10px 4px', color: '#38bdf8' }}>P002</td>
                          <td style={{ padding: '10px 4px', fontWeight: 700 }}>0.72</td>
                          <td style={{ padding: '10px 4px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                              Warning
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #161e2e' }}>
                          <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#94a3b8' }}>14:34:27</td>
                          <td style={{ padding: '10px 4px', color: '#38bdf8' }}>P002</td>
                          <td style={{ padding: '10px 4px', fontWeight: 700 }}>0.69</td>
                          <td style={{ padding: '10px 4px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                              Warning
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #161e2e' }}>
                          <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#94a3b8' }}>14:31:05</td>
                          <td style={{ padding: '10px 4px', color: '#38bdf8' }}>P003</td>
                          <td style={{ padding: '10px 4px', fontWeight: 700 }}>0.18</td>
                          <td style={{ padding: '10px 4px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                              Normal
                            </span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #161e2e' }}>
                          <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#94a3b8' }}>14:30:52</td>
                          <td style={{ padding: '10px 4px', color: '#38bdf8' }}>P001</td>
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* 5 KPI Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                  {/* Current Action */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={16} color="#ef4444" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Current Action</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#f87171' }}>{rlAgentState.currentAction}</div>
                      </div>
                    </div>
                  </div>

                  {/* Policy Confidence */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={16} color="#a855f7" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Policy Confidence</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2 }}>{rlAgentState.confidence}</div>
                      </div>
                    </div>
                  </div>

                  {/* Cumulative Reward */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={16} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Cumulative Reward</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#34d399' }}>+{rlAgentState.cumulativeReward}</div>
                      </div>
                    </div>
                  </div>

                  {/* Episode */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={16} color="#38bdf8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Episode</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2 }}>{rlAgentState.episode} / {rlAgentState.totalEpisodes}</div>
                      </div>
                    </div>
                  </div>

                  {/* Training Status */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={16} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Training Status</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2, color: '#34d399' }}>{rlAgentState.trainingStatus}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: RL Decision (Live) Table + Training Performance Curve */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 16 }}>
                  {/* Table */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>RL Decision (Live)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ color: '#64748b', borderBottom: '1px solid #1f293d', textAlign: 'left' }}>
                          <th style={{ padding: '8px 4px' }}>Time</th>
                          <th style={{ padding: '8px 4px' }}>Patient</th>
                          <th style={{ padding: '8px 4px' }}>State (sₜ)</th>
                          <th style={{ padding: '8px 4px' }}>Action</th>
                          <th style={{ padding: '8px 4px' }}>Reward</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rlDecisions.map((dec, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #161e2e' }}>
                            <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#94a3b8' }}>{dec.time}</td>
                            <td style={{ padding: '10px 4px', color: '#38bdf8' }}>{dec.patient}</td>
                            <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.72rem' }}>{dec.state}</td>
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
                            <td style={{ padding: '10px 4px', color: '#34d399', fontWeight: 700 }}>{dec.reward}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Training Performance Chart */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Training Performance</div>
                    <div style={{ height: 180, width: '100%' }}>
                      <svg viewBox="0 0 400 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        {/* Grid */}
                        {[-200, 0, 200, 400, 600].map((v) => {
                          const y = 160 - ((v + 200) / 800) * 140;
                          return (
                            <g key={v}>
                              <line x1="30" y1={y} x2="380" y2={y} stroke="#1f293d" strokeDasharray="3 3" />
                              <text x="24" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">{v}</text>
                            </g>
                          );
                        })}

                        {/* Episodes X axis */}
                        {[0, 50, 100, 150, 200, 250].map((ep) => {
                          const x = 30 + (ep / 250) * 350;
                          return <text key={ep} x={x} y="175" fill="#64748b" fontSize="8" textAnchor="middle">{ep}</text>;
                        })}

                        {/* Reward curve: starts at -150 and converges to +450 */}
                        <path
                          d="M 30,150 Q 80,105 150,75 T 260,55 T 380,48"
                          fill="none"
                          stroke="#c084fc"
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
            {activeTab === 'twin' && (
              <motion.div
                key="twin-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 16 }}
              >
                {/* Left Card: 3D Body Silhouette + Model Info */}
                <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {/* Anatomical wireframe visual representation */}
                    <svg viewBox="0 0 100 160" style={{ height: '90%', opacity: 0.85 }}>
                      {/* Head */}
                      <circle cx="50" cy="22" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      {/* Torso */}
                      <path d="M 32,40 L 68,40 L 62,95 L 38,95 Z" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      {/* Arms */}
                      <path d="M 32,40 L 18,80 L 15,110" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      <path d="M 68,40 L 82,80 L 85,110" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      {/* Legs */}
                      <path d="M 40,95 L 38,155" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      <path d="M 60,95 L 62,155" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      {/* Glowing Heart pulse */}
                      <circle cx="54" cy="56" r="6" fill="#ef4444" opacity="0.8">
                        <animate attributeName="r" values="5;7.5;5" dur="1s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
                      </circle>
                    </svg>
                  </div>

                  <div style={{ marginTop: 'auto', borderTop: '1px solid #1f293d', paddingTop: 14 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>P002 – Cardiac</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Twin Status:</span>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>Synchronized</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Baseline:</span>
                        <span style={{ color: '#cbd5e1' }}>Cardiac</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Twin Model:</span>
                        <span style={{ color: '#cbd5e1' }}>LSTM (30-step)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Last Update:</span>
                        <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>14:36:17</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center: MAP, RPP, Discrepancy KPI Cards + Actual vs Predicted Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* 3 Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>MAP</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: 2, color: '#f87171' }}>110.0 <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>mmHg</span></div>
                      <div style={{ fontSize: '0.68rem', color: '#fca5a5' }}>(High)</div>
                    </div>

                    <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>RPP</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: 2, color: '#f87171' }}>15,876</div>
                      <div style={{ fontSize: '0.68rem', color: '#fca5a5' }}>(High)</div>
                    </div>

                    <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Discrepancy Score</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: 2, color: '#f87171' }}>0.68</div>
                      <div style={{ fontSize: '0.68rem', color: '#fca5a5' }}>(↑ High)</div>
                    </div>
                  </div>

                  {/* Actual vs Predicted Heart Rate Chart */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Actual vs. Predicted Heart Rate</div>
                      <div style={{ display: 'flex', gap: 14, fontSize: '0.72rem' }}>
                        <span style={{ color: '#38bdf8' }}>— Actual HR</span>
                        <span style={{ color: '#c084fc' }}>- - Predicted HR (Twin)</span>
                      </div>
                    </div>

                    <div style={{ height: 180, width: '100%' }}>
                      <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        {/* Grid */}
                        {[60, 80, 100, 120, 140].map((v) => {
                          const y = 160 - ((v - 60) / 90) * 140;
                          return (
                            <g key={v}>
                              <line x1="35" y1={y} x2="480" y2={y} stroke="#1f293d" strokeDasharray="3 3" />
                              <text x="25" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">{v}</text>
                            </g>
                          );
                        })}

                        {/* Actual curve */}
                        <path
                          d="M 35,130 L 70,126 L 110,132 L 150,128 L 190,135 L 230,125 L 270,118 L 310,105 L 350,92 L 390,98 L 430,88 L 480,95"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                        />

                        {/* Predicted Twin curve */}
                        <path
                          d="M 35,130 L 70,128 L 110,129 L 150,129 L 190,131 L 230,128 L 270,125 L 310,115 L 350,105 L 390,102 L 430,95 L 480,92"
                          fill="none"
                          stroke="#c084fc"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Right Column: Twin Analysis */}
                <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>Twin Analysis</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Prediction Model</span>
                      <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={13} /> Online
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>MAP Trend</span>
                      <span style={{ color: '#f87171' }}>↑ Increasing</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>RPP Trend</span>
                      <span style={{ color: '#f87171' }}>↑ Increasing</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Physiological Drift</span>
                      <span style={{ color: '#f87171' }}>High</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #1f293d' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>Overall Status</span>
                      <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={14} /> At Risk
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================== */}
            {/* VIEW 6: EXPERIMENTS & REPORTS */}
            {/* ========================================== */}
            {activeTab === 'reports' && (
              <motion.div
                key="reports-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Secondary Sub-tabs */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ padding: '8px 16px', borderRadius: 8, background: '#4f46e5', color: '#fff', border: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <FileBarChart size={14} /> Evaluation Results
                  </button>
                  <button style={{ padding: '8px 16px', borderRadius: 8, background: '#111827', color: '#94a3b8', border: '1px solid #1f293d', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Clock size={14} /> Experiment Logs
                  </button>
                  <button style={{ padding: '8px 16px', borderRadius: 8, background: '#111827', color: '#94a3b8', border: '1px solid #1f293d', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <LayoutDashboard size={14} /> Generated Figures
                  </button>
                </div>

                {/* Table & Summary row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 16 }}>
                  {/* Model Evaluation Table */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Model Evaluation (Test Set)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ color: '#64748b', borderBottom: '1px solid #1f293d', textAlign: 'left' }}>
                          <th style={{ padding: '8px 6px' }}>Method</th>
                          <th style={{ padding: '8px 6px' }}>Accuracy</th>
                          <th style={{ padding: '8px 6px' }}>Precision</th>
                          <th style={{ padding: '8px 6px' }}>Recall (DR)</th>
                          <th style={{ padding: '8px 6px' }}>F1-Score</th>
                          <th style={{ padding: '8px 6px' }}>FPR</th>
                          <th style={{ padding: '8px 6px' }}>Missed (Clinical)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #161e2e' }}>
                          <td style={{ padding: '10px 6px', color: '#94a3b8' }}>Rule-Based (Baseline)</td>
                          <td style={{ padding: '10px 6px' }}>0.944</td>
                          <td style={{ padding: '10px 6px' }}>1.000</td>
                          <td style={{ padding: '10px 6px' }}>0.508</td>
                          <td style={{ padding: '10px 6px' }}>0.673</td>
                          <td style={{ padding: '10px 6px', color: '#34d399' }}>0.000</td>
                          <td style={{ padding: '10px 6px', color: '#f87171', fontWeight: 600 }}>1,301</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #161e2e' }}>
                          <td style={{ padding: '10px 6px', color: '#94a3b8' }}>Isolation Forest</td>
                          <td style={{ padding: '10px 6px' }}>0.878</td>
                          <td style={{ padding: '10px 6px' }}>0.469</td>
                          <td style={{ padding: '10px 6px' }}>0.556</td>
                          <td style={{ padding: '10px 6px' }}>0.509</td>
                          <td style={{ padding: '10px 6px', color: '#fbbf24' }}>0.081</td>
                          <td style={{ padding: '10px 6px', color: '#f87171', fontWeight: 600 }}>1,163</td>
                        </tr>
                        <tr style={{ background: 'rgba(99, 102, 241, 0.1)', borderBottom: '1px solid rgba(99, 102, 241, 0.3)' }}>
                          <td style={{ padding: '10px 6px', color: '#818cf8', fontWeight: 700 }}>DQN (IoMT-Warden)</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#34d399' }}>0.912</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#34d399' }}>0.563</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#34d399' }}>1.000</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#34d399' }}>0.721</td>
                          <td style={{ padding: '10px 6px', fontWeight: 700, color: '#fbbf24' }}>0.099</td>
                          <td style={{ padding: '10px 6px', fontWeight: 800, color: '#34d399' }}>0 ✅</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Experiment Summary */}
                  <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Experiment Summary</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>🧪 Test Scenarios:</span>
                        <span style={{ fontWeight: 700 }}>5</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>📊 Total Samples:</span>
                        <span style={{ fontWeight: 700 }}>50,000</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>🚨 Attacks Detected:</span>
                        <span style={{ fontWeight: 700, color: '#f87171' }}>1,942</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>⚡ Missed Emergencies:</span>
                        <span style={{ fontWeight: 700, color: '#34d399' }}>0</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>⏱ Avg. Response Time:</span>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>412 ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generated Figures Gallery */}
                <div style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 18 }}>
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
                        background: '#4f46e5',
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
                          background: '#0d131f',
                          border: '1px solid #1a2234',
                          borderRadius: 8,
                          padding: 10,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ height: 105, background: '#111827', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden', padding: 4 }}>
                          <img src={`/figures/${fig.svg}`} alt={fig.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 600 }}>{fig.title}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>{fig.name}</div>
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
                          background: '#111827',
                          border: '1px solid #334155',
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
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>{previewFigure.title}</div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <a
                              href={`/figures/${previewFigure.svg}`}
                              download={previewFigure.name}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#4f46e5',
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
                                background: '#1e293b',
                                color: '#94a3b8',
                                border: '1px solid #334155',
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
                        <div style={{ background: '#0d111d', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'center' }}>
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ background: '#111827', border: '1px solid #1f293d', borderRadius: 12, padding: 24, maxWidth: 700 }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Configuration Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 10 }}>
                    <span style={{ color: '#94a3b8' }}>Safety Shield Mode</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>Deterministic Override (Non-Bypassable)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 10 }}>
                    <span style={{ color: '#94a3b8' }}>EWMA Smoothing Factor (α)</span>
                    <span style={{ fontFamily: 'monospace' }}>0.35</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 10 }}>
                    <span style={{ color: '#94a3b8' }}>Isolation Forest Contamination (ν)</span>
                    <span style={{ fontFamily: 'monospace' }}>0.05</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 10 }}>
                    <span style={{ color: '#94a3b8' }}>HMAC Secret Key</span>
                    <span style={{ fontFamily: 'monospace', color: '#64748b' }}>sha256:****************</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
