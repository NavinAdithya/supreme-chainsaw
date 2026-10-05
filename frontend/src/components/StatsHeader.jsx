import React from 'react';

/**
 * StatsHeader Component
 * 
 * Displays live KPI summary cards, risk tier distribution bar,
 * and controls for demo data generation and metrics refresh.
 */
export default function StatsHeader({ stats, loading, onRefresh, onSeed }) {
  const total = stats?.total_bookings || 0;
  const flagged = stats?.flagged_count || 0;
  const backlog = stats?.review_backlog || 0;
  const fraudRate = stats?.fraud_rate || 0.0;
  const valAtRisk = stats?.value_at_risk || 0.0;
  const tiers = stats?.tier_distribution || { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

  const lowPct = total ? ((tiers.LOW || 0) / total) * 100 : 0;
  const medPct = total ? ((tiers.MEDIUM || 0) / total) * 100 : 0;
  const highPct = total ? ((tiers.HIGH || 0) / total) * 100 : 0;
  const critPct = total ? ((tiers.CRITICAL || 0) / total) * 100 : 0;

  return (
    <div className="stats-container">
      {/* Top action row */}
      <div className="stats-header-bar">
        <div className="stats-title-group">
          <span className="live-pulse-dot" title="Real-time monitoring active"></span>
          <span className="stats-title-text">Live Intelligence Feed</span>
          <span className="stats-timestamp">Auto-refreshed</span>
        </div>
        <div className="stats-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onSeed}
            disabled={loading}
            title="Synthesize 25 realistic logistics bookings"
          >
            ⚡ {loading ? 'Seeding...' : 'Seed 25 Demo Shipments'}
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh statistics"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Shipments</span>
            <span className="kpi-icon">📦</span>
          </div>
          <div className="kpi-value">{total.toLocaleString()}</div>
          <div className="kpi-subtext">Evaluated through risk pipeline</div>
        </div>

        <div className="kpi-card kpi-card-danger">
          <div className="kpi-header">
            <span className="kpi-label">High-Risk Flagged</span>
            <span className="kpi-icon">🚨</span>
          </div>
          <div className="kpi-value kpi-text-danger">{flagged}</div>
          <div className="kpi-subtext">Triggered customs/fraud rules</div>
        </div>

        <div className="kpi-card kpi-card-warning">
          <div className="kpi-header">
            <span className="kpi-label">Review Backlog</span>
            <span className="kpi-icon">⏳</span>
          </div>
          <div className="kpi-value kpi-text-warning">{backlog}</div>
          <div className="kpi-subtext">Awaiting human analyst decision</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Fraud Alert Rate</span>
            <span className="kpi-icon">🛡️</span>
          </div>
          <div className="kpi-value">{fraudRate}%</div>
          <div className="kpi-subtext">Anomalous / high-risk ratio</div>
        </div>

        <div className="kpi-card kpi-card-accent">
          <div className="kpi-header">
            <span className="kpi-label">Value at Risk</span>
            <span className="kpi-icon">💵</span>
          </div>
          <div className="kpi-value kpi-text-accent">
            ${valAtRisk.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="kpi-subtext">Total declared value under alert</div>
        </div>
      </div>

      {/* Distribution Progress Bar */}
      <div className="tier-bar-card">
        <div className="tier-bar-header">
          <span className="tier-bar-title">Risk Severity Distribution</span>
          <div className="tier-legend">
            <span className="legend-item"><span className="legend-dot tier-low"></span> Low ({tiers.LOW || 0})</span>
            <span className="legend-item"><span className="legend-dot tier-medium"></span> Medium ({tiers.MEDIUM || 0})</span>
            <span className="legend-item"><span className="legend-dot tier-high"></span> High ({tiers.HIGH || 0})</span>
            <span className="legend-item"><span className="legend-dot tier-critical"></span> Critical ({tiers.CRITICAL || 0})</span>
          </div>
        </div>

        <div className="tier-progress-track">
          {total > 0 ? (
            <>
              <div className="tier-segment segment-low" style={{ width: `${lowPct}%` }} title={`Low Risk: ${tiers.LOW} (${lowPct.toFixed(1)}%)`}></div>
              <div className="tier-segment segment-medium" style={{ width: `${medPct}%` }} title={`Medium Risk: ${tiers.MEDIUM} (${medPct.toFixed(1)}%)`}></div>
              <div className="tier-segment segment-high" style={{ width: `${highPct}%` }} title={`High Risk: ${tiers.HIGH} (${highPct.toFixed(1)}%)`}></div>
              <div className="tier-segment segment-critical" style={{ width: `${critPct}%` }} title={`Critical Risk: ${tiers.CRITICAL} (${critPct.toFixed(1)}%)`}></div>
            </>
          ) : (
            <div className="tier-segment segment-empty" style={{ width: '100%' }}>No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
