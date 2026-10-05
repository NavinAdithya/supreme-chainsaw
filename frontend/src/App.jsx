import React, { useState, useEffect } from 'react';
import BookingForm from './components/BookingForm';
import Dashboard from './components/Dashboard';
import StatsHeader from './components/StatsHeader';

/**
 * App Component - Root layout shell for FraudShield.
 */
function App() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'form', 'queue'
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshCounter]);

  const handleSeedDemoData = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/demo/seed?count=25', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Seeded 25 new shipments', 'success');
        setRefreshCounter((c) => c + 1);
      } else {
        showToast('Failed to seed demo data', 'error');
      }
    } catch (err) {
      showToast('Error seeding demo data', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleBookingScored = (scoreData) => {
    showToast(
      `Shipment ${scoreData.booking_id} evaluated: ${scoreData.risk_tier} RISK (${(scoreData.risk_score * 100).toFixed(0)}%)`,
      scoreData.risk_tier === 'CRITICAL' || scoreData.risk_tier === 'HIGH' ? 'warning' : 'success'
    );
    setRefreshCounter((c) => c + 1);
  };

  const handleReviewSubmitted = (record) => {
    showToast(`Booking ${record.id} status updated to ${record.status}`, 'success');
    setRefreshCounter((c) => c + 1);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-navbar">
        <div className="nav-brand">
          <span className="brand-icon">🛡️</span>
          <div className="brand-text">
            <h1 className="brand-name">FraudShield</h1>
            <span className="brand-tagline">Real-Time Shipment Risk Intelligence</span>
          </div>
        </div>

        <div className="nav-center-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📊 Unified View
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            📝 Intake & Scoring
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            🔍 Reviewer Queue
          </button>
        </div>

        <div className="nav-system-status">
          <span className="status-indicator-dot"></span>
          <span className="status-label">Engine Online (Port 8000)</span>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`toast-banner toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="toast-text">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* System Metrics Overview */}
      <section className="stats-section-wrapper">
        <StatsHeader
          stats={stats}
          loading={loadingStats}
          onRefresh={() => setRefreshCounter((c) => c + 1)}
          onSeed={handleSeedDemoData}
        />
      </section>

      {/* Main Workspace */}
      <main className="main-content-layout">
        {(activeTab === 'all' || activeTab === 'form') && (
          <section className="form-section-container">
            <BookingForm onBookingScored={handleBookingScored} />
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'queue') && (
          <section className="dashboard-section-container">
            <div className="section-header-row">
              <div>
                <h3 className="section-title">Reviewer Adjudication Dashboard</h3>
                <p className="section-subtitle">
                  Inspect flagged shipments, review AI explanations, and approve or reject consignments.
                </p>
              </div>
            </div>
            <Dashboard
              refreshTrigger={refreshCounter}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>FraudShield 🛡️ • Machine Learning & Trade Heuristics • TechFest 2026</p>
      </footer>
    </div>
  );
}

export default App;
