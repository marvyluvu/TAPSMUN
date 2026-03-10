import { useState, useEffect, useCallback, useMemo } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// PASTE YOUR APPS SCRIPT DEPLOYMENT URL HERE:
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwNkdImRcmOQRAqDE-iaGENrbWwKwFPKLwfdt9sQxMBui_kVBl8Nhg840r4U5dwz8JI/exec";

const COMMITTEES = ["UNODC", "UNHRC", "UNW", "DISEC", "FIFA", "WHO"];
const MAX_CAP = 25;

const COMMITTEE_COLORS = {
  UNODC:  { bg: "#0D3B66", accent: "#3A7CA5" },
  UNHRC:  { bg: "#1B4332", accent: "#40916C" },
  UNW:    { bg: "#4A1942", accent: "#C77DFF" },
  DISEC:  { bg: "#7B2D00", accent: "#F4845F" },
  FIFA:   { bg: "#1A3A1A", accent: "#52B788" },
  WHO:    { bg: "#003049", accent: "#0096C7" },
};

async function api(action, body = {}) {
  try {
    const params = new URLSearchParams({ action, ...body });
    const res = await fetch(APPS_SCRIPT_URL + "?" + params.toString(), {
      method: "GET",
      redirect: "follow",
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── ICONS (inline SVG) ───────────────────────────────────────────────────────
const Icon = {
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  CreditCard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Trophy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <polyline points="14.5 17 15 21 12 23 9 21 9.5 17"/>
      <path d="M4 3h16v4a8 8 0 1 1-16 0V3z"/><path d="M4 7H2v2a5 5 0 0 0 5 5"/><path d="M20 7h2v2a5 5 0 0 1-5 5"/>
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #12151C 0%, #1A1F2E 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: "24px 28px",
      display: "flex", alignItems: "flex-start", gap: 16,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: accent + "22",
        border: "1px solid " + accent + "44",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: accent,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, color: "#6B7280", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#F9FAFB", fontFamily: "'Sora', sans-serif", lineHeight: 1.1, marginTop: 4 }}>{value}</div>
        {sub && <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{
        position: "absolute", right: -20, bottom: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: accent + "11",
      }} />
    </div>
  );
}

function CommitteeBar({ name, current, max }) {
  const pct = Math.min((current / max) * 100, 100);
  const color = COMMITTEE_COLORS[name]?.accent || "#60A5FA";
  const isFull = current >= max;
  const isNear = pct >= 80 && !isFull;
  const barColor = isFull ? "#EF4444" : isNear ? "#F59E0B" : color;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB", fontFamily: "'Sora', sans-serif", letterSpacing: "0.04em" }}>{name}</span>
        <span style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: isFull ? "#EF4444" : "#9CA3AF" }}>
          {current}<span style={{ color: "#4B5563" }}>/{max}</span>
          {isFull && <span style={{ marginLeft: 6, color: "#EF4444", fontSize: 11 }}>FULL</span>}
        </span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: pct + "%", borderRadius: 4,
          background: `linear-gradient(90deg, ${barColor}CC, ${barColor})`,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${barColor}66`,
        }} />
      </div>
    </div>
  );
}

function MiniBarChart({ data, colorKey }) {
  if (!data || data.length === 0) return <div style={{ color: "#6B7280", fontSize: 13, padding: "20px 0" }}>No data available</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, padding: "8px 0" }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const color = colorKey ? COMMITTEE_COLORS[d.label]?.accent : ["#60A5FA","#34D399","#F472B6","#FBBF24","#A78BFA","#FB923C"][i % 6];
        return (
          <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Space Mono', monospace" }}>{d.value}</div>
            <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", height: 70, display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%", height: pct + "%", minHeight: d.value > 0 ? 4 : 0,
                background: color, borderRadius: 4,
                transition: "height 0.6s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: `0 0 6px ${color}66`,
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#6B7280", textAlign: "center", letterSpacing: "0.05em" }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: "#10B981", error: "#EF4444", info: "#60A5FA" };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 9999,
      background: "#1A1F2E", border: `1px solid ${c}44`,
      borderLeft: `3px solid ${c}`,
      borderRadius: 12, padding: "14px 20px",
      color: "#F9FAFB", fontSize: 14, maxWidth: 380,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      animation: "slideIn 0.3s ease",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ color: c }}><Icon.Alert /></span>
      {msg}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function MUNDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoLoading, setAutoLoading] = useState(false);
  const [allocating, setAllocating] = useState({});
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPref, setFilterPref] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCommittee, setSelectedCommittee] = useState({});
  const [countdown, setCountdown] = useState(20);
  const [unpaid, setUnpaid] = useState([]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type, id: Date.now() });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setCountdown(20);
    const [statsRes, pendingRes, unpaidRes] = await Promise.all([
      api("getStats"),
      api("getPendingDelegates"),
      api("getUnpaidDelegates"),
    ]);
    if (statsRes.success) setStats(statsRes.stats);
    else showToast("Failed to load stats: " + statsRes.error, "error");
    if (pendingRes.success) setPending(pendingRes.pending);
    else showToast("Failed to load delegates: " + pendingRes.error, "error");
    if (unpaidRes.success) setUnpaid(unpaidRes.unpaid || []);
    setLoading(false);
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { loadData(); }, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => (c <= 1 ? 20 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleAllocate = async (delegate) => {
    const committee = selectedCommittee[delegate.email];
    if (!committee) { showToast("Please select a committee", "error"); return; }
    setAllocating(a => ({ ...a, [delegate.email]: true }));
    const res = await api("allocateDelegate", {
      name: delegate.name, email: delegate.email, committee,
      nationality: delegate.nationality, phone: delegate.phone, experience: delegate.experience,
    });
    setAllocating(a => ({ ...a, [delegate.email]: false }));
    if (res.success) {
      showToast(delegate.name + " → " + committee, "success");
      setPending(p => p.filter(d => d.email !== delegate.email));
      setStats(s => s ? {
        ...s,
        totalAllocated: s.totalAllocated + 1,
        committeeSizes: { ...s.committeeSizes, [committee]: (s.committeeSizes[committee] || 0) + 1 }
      } : s);
    } else {
      showToast(res.error || "Allocation failed", "error");
    }
  };

  const handleAutoAllocate = async () => {
    setAutoLoading(true);
    const res = await api("autoAllocate");
    setAutoLoading(false);
    if (res.success) {
      const { allocated, skipped, errors } = res.results;
      showToast(`Auto-allocated ${allocated.length} delegates. Skipped: ${skipped.length}`, "success");
      await loadData();
    } else {
      showToast(res.error || "Auto allocation failed", "error");
    }
  };

  const handleSendReminders = async () => {
    if (!window.confirm(`Send payment reminder emails to ${unpaid.length} unpaid delegates and highlight them yellow?`)) return;
    setEmailSending(true);
    setEmailResult(null);
    const res = await api("sendPaymentReminders");
    setEmailSending(false);
    if (res.success) {
      const { sent, skipped, errors } = res.results;
      setEmailResult(res.results);
      showToast(`Sent ${sent.length} emails. Skipped: ${skipped.length}. Errors: ${errors.length}`, sent.length > 0 ? "success" : "info");
      await loadData();
    } else {
      showToast(res.error || "Failed to send emails", "error");
    }
  };

  const filteredPending = useMemo(() => {
    let list = [...pending];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q));
    }
    if (filterPref !== "all") {
      list = list.filter(d => d.firstPref === filterPref || d.secondPref === filterPref);
    }
    if (sortBy === "experience") list.sort((a, b) => Number(b.experience) - Number(a.experience));
    else if (sortBy === "firstPref") list.sort((a, b) => a.firstPref.localeCompare(b.firstPref));
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [pending, search, filterPref, sortBy]);

  const committeeDemandData = stats ? COMMITTEES.map(c => ({
    label: c, value: stats.committeeDemand[c] || 0
  })) : [];

  const referralData = stats ? stats.referralLeaderboard.slice(0, 8).map(r => ({
    label: r.code.length > 8 ? r.code.slice(0, 8) + "…" : r.code,
    value: r.count, fullLabel: r.code
  })) : [];

  const totalCapacity = COMMITTEES.length * MAX_CAP;
  const fillPct = stats ? Math.round((stats.totalAllocated / totalCapacity) * 100) : 0;

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "#0B0D14",
      color: "#F9FAFB",
      fontFamily: "'Sora', sans-serif",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; overflow-x: hidden; }
        body { background: #0B0D14; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #12151C; }
        ::-webkit-scrollbar-thumb { background: #2D3748; border-radius: 3px; }
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        .tab-btn:hover { background: rgba(255,255,255,0.05) !important; }
        .action-btn:hover { opacity: 0.85 !important; transform: translateY(-1px); }
        .row-hover:hover { background: rgba(255,255,255,0.03) !important; }
        .alloc-btn:hover:not(:disabled) { filter: brightness(1.15); transform: translateY(-1px); }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(11,13,20,0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
        width: "100%",
        height: 64,
      }}>
      <div style={{
        maxWidth: 1600, margin: "0 auto",
        padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #3A7CA5, #1B4332)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🌐</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "0.02em" }}>MUN Allocations</div>
            <div style={{ fontSize: 11, color: "#6B7280", fontFamily: "'Space Mono', monospace" }}>DELEGATE AFFAIRS DASHBOARD</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {["overview", "committees", "analytics", "allocate"].map(tab => (
            <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{
              padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              background: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent",
              color: activeTab === tab ? "#F9FAFB" : "#6B7280",
              fontWeight: activeTab === tab ? 600 : 400,
              fontFamily: "'Sora', sans-serif",
              textTransform: "capitalize", letterSpacing: "0.03em",
              transition: "all 0.15s",
            }}>{tab}</button>
          ))}
        </div>

        <button onClick={loadData} disabled={loading} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 8,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#9CA3AF", fontSize: 13, cursor: "pointer", fontFamily: "'Sora', sans-serif",
          transition: "all 0.15s",
        }}>
          <span style={{ animation: loading ? "spin 1s linear infinite" : "none", display: "inline-flex" }}><Icon.Refresh /></span>
          {loading ? "Syncing…" : `Refresh (${countdown}s)`}
        </button>
      </div>
      </div>

      {/* Content */}
      <div style={{ padding: "32px 40px", maxWidth: 1600, margin: "0 auto", width: "100%" }}>

        {/* Loading skeleton */}
        {loading && !stats && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "pulse 1.5s infinite" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 80, background: "rgba(255,255,255,0.04)", borderRadius: 16 }} />
            ))}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && stats && (
          <div>
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              <StatCard icon={<Icon.Users />} label="Total Applications" value={stats.totalApplications.toLocaleString()} accent="#60A5FA" />
              <StatCard icon={<Icon.CreditCard />} label="Paid Delegates" value={stats.totalPaid.toLocaleString()}
                sub={`${pending.length} pending allocation`} accent="#34D399" />
              <StatCard icon={<Icon.CheckCircle />} label="Allocated" value={stats.totalAllocated.toLocaleString()}
                sub={`${fillPct}% of total capacity`} accent="#F472B6" />
            </div>

            {/* Overall fill */}
            <div style={{
              background: "linear-gradient(135deg, #12151C, #1A1F2E)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "24px 28px", marginBottom: 28,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Conference Fill Rate</div>
                <div style={{ fontFamily: "'Space Mono', monospace", color: "#9CA3AF", fontSize: 14 }}>
                  {stats.totalAllocated} / {totalCapacity} total seats
                </div>
              </div>
              <div style={{ height: 12, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden", marginBottom: 24 }}>
                <div style={{
                  height: "100%", width: fillPct + "%", borderRadius: 6,
                  background: "linear-gradient(90deg, #3A7CA5, #40916C, #C77DFF)",
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: "0 0 12px rgba(60,120,200,0.4)",
                }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {COMMITTEES.slice(0, 3).map(c => <CommitteeBar key={c} name={c} current={stats.committeeSizes[c] || 0} max={MAX_CAP} />)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
                {COMMITTEES.slice(3).map(c => <CommitteeBar key={c} name={c} current={stats.committeeSizes[c] || 0} max={MAX_CAP} />)}
              </div>
            </div>

            {/* Unpaid Reminders Panel */}
            <div style={{
              background: "linear-gradient(135deg, #1C1500, #1A1F2E)",
              border: "1px solid #F59E0B44",
              borderRadius: 16, padding: "20px 28px", marginBottom: 28,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "#F59E0B22", border: "1px solid #F59E0B44",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>✉️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#F9FAFB" }}>Payment Reminders</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                    <span style={{ color: "#F59E0B", fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>{unpaid.length}</span> delegates applied but have not paid yet
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {emailResult && (
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    Last run: <span style={{ color: "#34D399" }}>{emailResult.sent.length} sent</span>
                    {emailResult.skipped.length > 0 && <span style={{ color: "#6B7280" }}> · {emailResult.skipped.length} skipped</span>}
                    {emailResult.errors.length > 0 && <span style={{ color: "#EF4444" }}> · {emailResult.errors.length} failed</span>}
                  </div>
                )}
                <button onClick={handleSendReminders} disabled={emailSending || unpaid.length === 0} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: unpaid.length === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #B45309, #F59E0B)",
                  color: unpaid.length === 0 ? "#4B5563" : "#000",
                  fontSize: 13, fontWeight: 700, cursor: unpaid.length === 0 ? "not-allowed" : "pointer",
                  fontFamily: "'Sora', sans-serif", transition: "all 0.15s",
                  boxShadow: unpaid.length > 0 ? "0 4px 16px rgba(245,158,11,0.3)" : "none",
                  opacity: emailSending ? 0.7 : 1,
                }}>
                  {emailSending ? "⏳ Sending…" : `📧 Email ${unpaid.length} Unpaid Delegates`}
                </button>
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Demand chart */}
              <div style={{
                background: "linear-gradient(135deg, #12151C, #1A1F2E)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 28px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ color: "#F472B6" }}><Icon.BarChart /></span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Committee Demand</span>
                  <span style={{ fontSize: 12, color: "#6B7280", marginLeft: "auto" }}>Paid requests only</span>
                </div>
                <MiniBarChart data={committeeDemandData} colorKey />
              </div>

              {/* Referral leaderboard */}
              <div style={{
                background: "linear-gradient(135deg, #12151C, #1A1F2E)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 28px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ color: "#FBBF24" }}><Icon.Trophy /></span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Referral Leaderboard</span>
                </div>
                {stats.referralLeaderboard.slice(0, 5).map((r, i) => (
                  <div key={r.code} className="row-hover" style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "8px 6px", borderRadius: 8,
                    borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    transition: "background 0.15s",
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      background: i === 0 ? "#F59E0B22" : i === 1 ? "#9CA3AF22" : i === 2 ? "#B45309"+"22" : "rgba(255,255,255,0.05)",
                      color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#B45309" : "#4B5563",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                    }}>{i + 1}</div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, letterSpacing: "0.04em" }}>{r.code}</span>
                    <span style={{
                      fontSize: 13, fontFamily: "'Space Mono', monospace",
                      color: "#34D399", background: "#34D39922", padding: "2px 8px", borderRadius: 6,
                    }}>{r.count}</span>
                  </div>
                ))}
                {stats.referralLeaderboard.length === 0 && <div style={{ color: "#6B7280", fontSize: 13 }}>No referral codes yet</div>}
              </div>
            </div>
          </div>
        )}

        {/* COMMITTEES TAB */}
        {activeTab === "committees" && stats && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Committee Overview</h2>
              <p style={{ color: "#6B7280", fontSize: 14 }}>Detailed breakdown of each committee's capacity and demand.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {COMMITTEES.map(c => {
                const size = stats.committeeSizes[c] || 0;
                const demand = stats.committeeDemand[c] || 0;
                const pct = (size / MAX_CAP) * 100;
                const color = COMMITTEE_COLORS[c]?.accent || "#60A5FA";
                const bg = COMMITTEE_COLORS[c]?.bg || "#1A1F2E";
                const isFull = size >= MAX_CAP;
                return (
                  <div key={c} style={{
                    background: `linear-gradient(145deg, ${bg}CC, #12151C)`,
                    border: `1px solid ${color}33`,
                    borderRadius: 16, padding: "24px 24px 20px",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 3,
                      background: `linear-gradient(90deg, ${color}88, ${color})`,
                    }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "0.06em", color }}>
                        {c}
                      </div>
                      {isFull && (
                        <span style={{ fontSize: 11, background: "#EF444422", color: "#EF4444", padding: "3px 8px", borderRadius: 6, fontWeight: 600, letterSpacing: "0.06em" }}>
                          FULL
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 700, color: "#F9FAFB", fontFamily: "'Space Mono', monospace", lineHeight: 1, marginBottom: 4 }}>
                      {size}
                      <span style={{ fontSize: 18, color: "#4B5563", fontWeight: 400 }}>/{MAX_CAP}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 14 }}>delegates allocated</div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 16 }}>
                      <div style={{
                        height: "100%", width: pct + "%", borderRadius: 3,
                        background: isFull ? "#EF4444" : color,
                        boxShadow: `0 0 8px ${isFull ? "#EF444466" : color + "66"}`,
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9CA3AF" }}>
                      <span>Demand: <b style={{ color: "#F9FAFB" }}>{demand} requests</b></span>
                      <span>Available: <b style={{ color: isFull ? "#EF4444" : "#34D399" }}>{MAX_CAP - size}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && stats && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Analytics</h2>
              <p style={{ color: "#6B7280", fontSize: 14 }}>Conference statistics and trends.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Committee demand full chart */}
              <div style={{
                background: "linear-gradient(135deg, #12151C, #1A1F2E)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 28px",
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Committee Demand (Paid)</div>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>Number of paid requests per committee</p>
                <MiniBarChart data={committeeDemandData} colorKey />
                <div style={{ marginTop: 16 }}>
                  {committeeDemandData.sort((a,b)=>b.value-a.value).map((d, i) => (
                    <div key={d.label} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <div style={{ width: 20, fontSize: 11, color: "#4B5563", fontFamily: "'Space Mono', monospace" }}>{i+1}</div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{d.label}</div>
                      <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: COMMITTEE_COLORS[d.label]?.accent }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral leaderboard full */}
              <div style={{
                background: "linear-gradient(135deg, #12151C, #1A1F2E)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 28px",
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Referral Code Leaderboard</div>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>All-time referral code usage</p>
                <MiniBarChart data={referralData} />
                <div style={{ marginTop: 16, maxHeight: 200, overflowY: "auto" }}>
                  {stats.referralLeaderboard.map((r, i) => (
                    <div key={r.code} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <div style={{ width: 20, fontSize: 11, color: "#4B5563", fontFamily: "'Space Mono', monospace" }}>{i+1}</div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, letterSpacing: "0.03em" }}>{r.code}</div>
                      <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace",
                        background: "#FBBF2422", color: "#FBBF24", padding: "2px 8px", borderRadius: 6 }}>{r.count}</div>
                    </div>
                  ))}
                  {stats.referralLeaderboard.length === 0 && <div style={{ color: "#6B7280", fontSize: 13 }}>No referral codes yet</div>}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{
              background: "linear-gradient(135deg, #12151C, #1A1F2E)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 28px",
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Conference Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  { label: "Applications", value: stats.totalApplications, color: "#60A5FA" },
                  { label: "Paid", value: stats.totalPaid, color: "#34D399" },
                  { label: "Allocated", value: stats.totalAllocated, color: "#F472B6" },
                  { label: "Pending", value: pending.length, color: "#FBBF24" },
                ].map(s => (
                  <div key={s.label} style={{
                    background: s.color + "11", border: "1px solid " + s.color + "33",
                    borderRadius: 12, padding: "16px 20px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: "'Space Mono', monospace" }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ALLOCATE TAB */}
        {activeTab === "allocate" && (
          <div>
            {/* Controls bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "8px 14px", flex: "0 0 280px",
              }}>
                <span style={{ color: "#4B5563" }}><Icon.Search /></span>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name or email…"
                  style={{
                    background: "none", border: "none", outline: "none", color: "#F9FAFB",
                    fontSize: 14, fontFamily: "'Sora', sans-serif", flex: 1,
                  }}
                />
              </div>

              <select value={filterPref} onChange={e => setFilterPref(e.target.value)} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "8px 14px", color: "#9CA3AF", fontSize: 13,
                fontFamily: "'Sora', sans-serif", cursor: "pointer", outline: "none",
              }}>
                <option value="all">All preferences</option>
                {COMMITTEES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "8px 14px", color: "#9CA3AF", fontSize: 13,
                fontFamily: "'Sora', sans-serif", cursor: "pointer", outline: "none",
              }}>
                <option value="name">Sort: Name</option>
                <option value="experience">Sort: Experience ↓</option>
                <option value="firstPref">Sort: 1st Preference</option>
              </select>

              <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "#6B7280", fontFamily: "'Space Mono', monospace" }}>
                  {filteredPending.length} <span style={{ color: "#4B5563" }}>/ {pending.length} pending</span>
                </div>
                <button className="action-btn" onClick={handleAutoAllocate} disabled={autoLoading || pending.length === 0} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10,
                  background: pending.length === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #3A7CA5, #1B4332)",
                  border: "none", color: pending.length === 0 ? "#4B5563" : "#F9FAFB",
                  fontSize: 14, fontWeight: 600, cursor: pending.length === 0 ? "not-allowed" : "pointer",
                  fontFamily: "'Sora', sans-serif", transition: "all 0.15s",
                  boxShadow: pending.length > 0 ? "0 4px 16px rgba(58,124,165,0.3)" : "none",
                }}>
                  <span style={{ animation: autoLoading ? "spin 1s linear infinite" : "none", display: "inline-flex" }}><Icon.Zap /></span>
                  {autoLoading ? "Allocating…" : "AUTO ALLOCATE ALL"}
                </button>
              </div>
            </div>

            {/* Table */}
            {filteredPending.length === 0 ? (
              <div style={{
                background: "linear-gradient(135deg, #12151C, #1A1F2E)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
                padding: "60px 40px", textAlign: "center",
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  {pending.length === 0 ? "All delegates allocated!" : "No results for current filters"}
                </div>
                <div style={{ fontSize: 14, color: "#6B7280" }}>
                  {pending.length === 0 ? "Every paid delegate has been assigned to a committee." : "Try adjusting your search or filter criteria."}
                </div>
              </div>
            ) : (
              <div style={{
                background: "linear-gradient(135deg, #12151C, #1A1F2E)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden",
              }}>
                {/* Table header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1.2fr 1.2fr 0.8fr 1.2fr 1.2fr 1.5fr 120px",
                  gap: 0, padding: "12px 20px",
                  background: "rgba(255,255,255,0.03)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  fontSize: 11, fontWeight: 600, color: "#4B5563",
                  fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  {["Name","Email","Nationality","Phone","Exp.","1st Pref","2nd Pref","Committee",""].map((h,i) => (
                    <div key={i}>{h}</div>
                  ))}
                </div>

                {/* Rows */}
                {filteredPending.map((d, idx) => {
                  const isAllocating = allocating[d.email];
                  const committeeVal = selectedCommittee[d.email] || "";
                  const sizes = stats?.committeeSizes || {};
                  return (
                    <div key={d.email} className="row-hover" style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 2fr 1.2fr 1.2fr 0.8fr 1.2fr 1.2fr 1.5fr 120px",
                      gap: 0, padding: "14px 20px",
                      borderBottom: idx < filteredPending.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      alignItems: "center", transition: "background 0.15s",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.email}</div>
                      <div style={{ fontSize: 13, color: "#9CA3AF" }}>{d.nationality || "–"}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "'Space Mono', monospace" }}>{d.phone || "–"}</div>
                      <div style={{ fontSize: 13, textAlign: "center" }}>
                        <span style={{
                          background: "#60A5FA22", color: "#60A5FA",
                          padding: "2px 8px", borderRadius: 6, fontFamily: "'Space Mono', monospace", fontSize: 12,
                        }}>{d.experience}</span>
                      </div>
                      <div>
                        {d.firstPref ? (
                          <span style={{
                            fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
                            background: (COMMITTEE_COLORS[d.firstPref]?.accent || "#60A5FA") + "22",
                            color: COMMITTEE_COLORS[d.firstPref]?.accent || "#60A5FA",
                            padding: "3px 8px", borderRadius: 6,
                          }}>{d.firstPref}</span>
                        ) : <span style={{ color: "#4B5563" }}>–</span>}
                      </div>
                      <div>
                        {d.secondPref ? (
                          <span style={{
                            fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
                            background: (COMMITTEE_COLORS[d.secondPref]?.accent || "#9CA3AF") + "22",
                            color: COMMITTEE_COLORS[d.secondPref]?.accent || "#9CA3AF",
                            padding: "3px 8px", borderRadius: 6,
                          }}>{d.secondPref}</span>
                        ) : <span style={{ color: "#4B5563" }}>–</span>}
                      </div>
                      <select
                        value={committeeVal}
                        onChange={e => setSelectedCommittee(s => ({ ...s, [d.email]: e.target.value }))}
                        style={{
                          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8, padding: "6px 10px", color: committeeVal ? "#F9FAFB" : "#6B7280",
                          fontSize: 12, fontFamily: "'Sora', sans-serif", cursor: "pointer", outline: "none", width: "100%",
                        }}>
                        <option value="">Select…</option>
                        {COMMITTEES.map(c => {
                          const full = (sizes[c] || 0) >= MAX_CAP;
                          return (
                            <option key={c} value={c} disabled={full}>
                              {c} ({sizes[c] || 0}/{MAX_CAP}){full ? " FULL" : ""}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        className="alloc-btn"
                        onClick={() => handleAllocate(d)}
                        disabled={isAllocating || !committeeVal}
                        style={{
                          padding: "8px 16px", borderRadius: 8, border: "none",
                          background: !committeeVal ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #3A7CA5, #40916C)",
                          color: !committeeVal ? "#4B5563" : "#F9FAFB",
                          fontSize: 12, fontWeight: 600, cursor: !committeeVal ? "not-allowed" : "pointer",
                          fontFamily: "'Sora', sans-serif", transition: "all 0.15s",
                          opacity: isAllocating ? 0.7 : 1, whiteSpace: "nowrap",
                        }}>
                        {isAllocating ? "…" : "Allocate"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
