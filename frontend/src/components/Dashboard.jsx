import React, { useState, useEffect } from 'react';

export default function Dashboard({ refreshTrigger, onReviewSubmitted }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Review form state
  const [reviewerId, setReviewerId] = useState('Analyst-402');
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = '/api/bookings?limit=100';
      if (statusFilter !== 'ALL') {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      if (tierFilter !== 'ALL') {
        url += `&tier=${encodeURIComponent(tierFilter)}`;
      }
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, tierFilter, refreshTrigger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleOpenDrawer = (booking) => {
    setSelectedBooking(booking);
    setReviewSuccessMsg('');
    setReviewNotes(booking.review?.notes || '');
    setReviewDecision(booking.status === 'REJECTED' ? 'REJECTED' : booking.status === 'ESCALATED' ? 'ESCALATED' : 'APPROVED');
  };

  const handleCloseDrawer = () => {
    setSelectedBooking(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setSubmittingReview(true);
    setReviewSuccessMsg('');
    try {
      const payload = {
        booking_id: selectedBooking.id,
        reviewer_id: reviewerId,
        decision: reviewDecision,
        notes: reviewNotes,
      };

      const res = await fetch('/api/bookings/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to submit review');
      }

      const updatedRecord = await res.json();
      setReviewSuccessMsg(`Review successfully applied: Marked as ${updatedRecord.status}`);
      setSelectedBooking(updatedRecord);

      // Refresh list & stats
      fetchBookings();
      if (onReviewSubmitted) {
        onReviewSubmitted(updatedRecord);
      }
    } catch (err) {
      alert(`Error submitting review: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Control bar: Tabs & Filters */}
      <div className="dashboard-controls">
        <div className="tab-filters">
          <button
            className={`tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Shipments
          </button>
          <button
            className={`tab-btn tab-flagged ${statusFilter === 'FLAGGED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('FLAGGED')}
          >
            🚨 Action Required / Flagged
          </button>
          <button
            className={`tab-btn tab-approved ${statusFilter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('APPROVED')}
          >
            ✓ Approved
          </button>
          <button
            className={`tab-btn tab-rejected ${statusFilter === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('REJECTED')}
          >
            ✕ Rejected (Fraud)
          </button>
          <button
            className={`tab-btn ${statusFilter === 'ESCALATED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ESCALATED')}
          >
            ⚠️ Escalated
          </button>
        </div>

        {/* Search & Tier Filter */}
        <form onSubmit={handleSearchSubmit} className="search-filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, shipper, consignee, cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="select-tier-filter"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="LOW">Tier: Low</option>
            <option value="MEDIUM">Tier: Medium</option>
            <option value="HIGH">Tier: High</option>
            <option value="CRITICAL">Tier: Critical</option>
          </select>
          <button type="submit" className="btn btn-secondary btn-sm">
            🔍 Search
          </button>
        </form>
      </div>

      {/* Bookings Table */}
      <div className="table-responsive">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Trade Corridor</th>
              <th>Counterparties</th>
              <th>Cargo & Valuation</th>
              <th>Risk Score</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  Loading shipments queue...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  No shipments found matching the selected filters.
                </td>
              </tr>
            ) : (
              bookings.map((rec) => {
                const b = rec.booking;
                const s = rec.score;
                const density = b.weight_kg > 0 ? (b.declared_value / b.weight_kg).toFixed(1) : 0;
                const tierClass = s ? `tier-pill-${s.risk_tier.toLowerCase()}` : 'tier-pill-low';
                const statusClass = `status-badge-${rec.status.toLowerCase()}`;

                return (
                  <tr key={rec.id} className={rec.status === 'FLAGGED' ? 'row-flagged' : ''}>
                    <td className="cell-id">
                      <strong>{rec.id}</strong>
                      <span className="cell-date">{b.shipping_date}</span>
                    </td>
                    <td className="cell-route">
                      <span className="route-badge">
                        {b.origin_country} ➔ {b.destination_country}
                      </span>
                      <span className="payment-sub">{b.payment_method}</span>
                    </td>
                    <td className="cell-parties">
                      <div className="party-shipper">
                        <span className="party-role">From:</span> {b.shipper_name}
                      </div>
                      <div className="party-consignee">
                        <span className="party-role">To:</span> {b.consignee_name}
                      </div>
                    </td>
                    <td className="cell-cargo">
                      <div className="cargo-type-tag">{b.cargo_type}</div>
                      <div className="cargo-nums">
                        ${b.declared_value.toLocaleString()} | {b.weight_kg.toLocaleString()}kg
                      </div>
                      <div className="cargo-density">(${density}/kg)</div>
                    </td>
                    <td className="cell-score">
                      {s ? (
                        <div className="score-cell-wrapper">
                          <span className={`tier-pill ${tierClass}`}>{s.risk_tier}</span>
                          <span className="score-val">{(s.risk_score * 100).toFixed(0)}%</span>
                          <div className="mini-meter">
                            <div
                              className={`mini-meter-fill fill-${s.risk_tier.toLowerCase()}`}
                              style={{ width: `${s.risk_score * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted">Unscored</span>
                      )}
                    </td>
                    <td className="cell-status">
                      <span className={`status-badge ${statusClass}`}>{rec.status}</span>
                      {rec.review && (
                        <div className="reviewer-tag">by {rec.review.reviewer_id}</div>
                      )}
                    </td>
                    <td className="cell-action">
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => handleOpenDrawer(rec)}
                      >
                        Inspect 🔎
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Inspection Modal Drawer */}
      {selectedBooking && (
        <div className="modal-backdrop" onClick={handleCloseDrawer}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">Consignment Audit Dossier</span>
                <h3 className="modal-title">Shipment {selectedBooking.id}</h3>
              </div>
              <button className="close-btn" onClick={handleCloseDrawer}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Manifest Overview Grid */}
              <div className="manifest-section">
                <h4 className="modal-subheading">Shipping Manifest Details</h4>
                <div className="manifest-grid">
                  <div className="manifest-item">
                    <span className="manifest-label">Shipper</span>
                    <span className="manifest-value">{selectedBooking.booking.shipper_name}</span>
                  </div>
                  <div className="manifest-item">
                    <span className="manifest-label">Consignee</span>
                    <span className="manifest-value">{selectedBooking.booking.consignee_name}</span>
                  </div>
                  <div className="manifest-item">
                    <span className="manifest-label">Corridor</span>
                    <span className="manifest-value">
                      {selectedBooking.booking.origin_country} ➔ {selectedBooking.booking.destination_country}
                    </span>
                  </div>
                  <div className="manifest-item">
                    <span className="manifest-label">Payment Channel</span>
                    <span className="manifest-value">{selectedBooking.booking.payment_method}</span>
                  </div>
                  <div className="manifest-item">
                    <span className="manifest-label">Cargo Classification</span>
                    <span className="manifest-value">{selectedBooking.booking.cargo_type}</span>
                  </div>
                  <div className="manifest-item">
                    <span className="manifest-label">Declared Value</span>
                    <span className="manifest-value">
                      ${selectedBooking.booking.declared_value.toLocaleString()} USD
                    </span>
                  </div>
                  <div className="manifest-item">
                    <span className="manifest-label">Consignment Weight</span>
                    <span className="manifest-value">
                      {selectedBooking.booking.weight_kg.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="manifest-item">
                    <span className="manifest-label">Valuation Density</span>
                    <span className="manifest-value">
                      $
                      {(
                        selectedBooking.booking.declared_value /
                        Math.max(0.1, selectedBooking.booking.weight_kg)
                      ).toFixed(2)}{' '}
                      / kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Engine Results */}
              {selectedBooking.score && (
                <div className="risk-dossier-section">
                  <h4 className="modal-subheading">Risk Assessment & Intelligence Report</h4>
                  <div className="dossier-score-row">
                    <div className="dossier-tier">
                      Risk Tier: <strong>{selectedBooking.score.risk_tier}</strong>
                    </div>
                    <div className="dossier-probability">
                      Fraud Likelihood:{' '}
                      <strong>{(selectedBooking.score.risk_score * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="dossier-action">
                      Engine Advice: <strong>{selectedBooking.score.recommended_action}</strong>
                    </div>
                  </div>

                  {selectedBooking.score.risk_factors?.length > 0 && (
                    <div className="dossier-factors">
                      <strong>Identified Risk Safeguard Triggers:</strong>
                      <ul>
                        {selectedBooking.score.risk_factors.map((rf, idx) => (
                          <li key={idx}>⚠️ {rf}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="dossier-explanation">
                    <strong>Explainer Narrative:</strong>
                    <p>{selectedBooking.score.explanation}</p>
                  </div>
                </div>
              )}

              {/* Analyst Review Section */}
              <div className="review-action-section">
                <h4 className="modal-subheading">Analyst Adjudication & Decision</h4>

                {reviewSuccessMsg && (
                  <div className="alert alert-success">{reviewSuccessMsg}</div>
                )}

                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="form-group-review">
                    <label>Reviewer Identifier</label>
                    <input
                      type="text"
                      value={reviewerId}
                      onChange={(e) => setReviewerId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group-review">
                    <label>Adjudication Decision</label>
                    <div className="decision-buttons">
                      <button
                        type="button"
                        className={`decision-btn decision-approve ${reviewDecision === 'APPROVED' ? 'selected' : ''}`}
                        onClick={() => setReviewDecision('APPROVED')}
                      >
                        ✓ Approve Booking
                      </button>
                      <button
                        type="button"
                        className={`decision-btn decision-reject ${reviewDecision === 'REJECTED' ? 'selected' : ''}`}
                        onClick={() => setReviewDecision('REJECTED')}
                      >
                        ✕ Reject (Fraud)
                      </button>
                      <button
                        type="button"
                        className={`decision-btn decision-escalate ${reviewDecision === 'ESCALATED' ? 'selected' : ''}`}
                        onClick={() => setReviewDecision('ESCALATED')}
                      >
                        ⚠️ Escalate to Customs
                      </button>
                    </div>
                  </div>

                  <div className="form-group-review">
                    <label>Analyst Inspection Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Add compliance notes, container inspection results, or trade justification..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="modal-footer-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'Submitting...' : '💾 Submit Analyst Decision'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCloseDrawer}
                    >
                      Close Dossier
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
