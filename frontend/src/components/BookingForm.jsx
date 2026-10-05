import React, { useState } from 'react';

const PRESETS = [
  {
    name: '✅ Legitimate High-Tech (Apple)',
    desc: 'Normal commercial electronics corridor',
    data: {
      shipper_name: 'Foxconn Logistics Ltd',
      consignee_name: 'Apple Operations Americas',
      origin_country: 'CN',
      destination_country: 'US',
      cargo_type: 'Electronics',
      declared_value: 180000,
      weight_kg: 1200,
      payment_method: 'Letter of Credit',
    },
  },
  {
    name: '🚨 Trade-Based Money Laundering',
    desc: 'Low-grade scrap declared at $1,500/kg',
    data: {
      shipper_name: 'Apex Anonymous Forwarders',
      consignee_name: 'Universal Shell Corp',
      origin_country: 'US',
      destination_country: 'CY',
      cargo_type: 'Scrap Metal',
      declared_value: 450000,
      weight_kg: 300,
      payment_method: 'Third-Party Remittance',
    },
  },
  {
    name: '⚠️ Severe Tariff Under-Invoicing',
    desc: 'Massive electronics shipment declared for $4k',
    data: {
      shipper_name: 'FastCash Import Export Ltd',
      consignee_name: 'Target Logistics Network',
      origin_country: 'VN',
      destination_country: 'US',
      cargo_type: 'Electronics',
      declared_value: 4200,
      weight_kg: 2800,
      payment_method: 'Cash on Delivery',
    },
  },
  {
    name: '🚫 Sanctioned Corridor + Crypto',
    desc: 'High-risk trade route paid with untraceable crypto',
    data: {
      shipper_name: 'Shadow Logistics FZE',
      consignee_name: 'Medtronic Global Distribution',
      origin_country: 'IR',
      destination_country: 'DE',
      cargo_type: 'Pharmaceuticals',
      declared_value: 125000,
      weight_kg: 850,
      payment_method: 'Cryptocurrency',
    },
  },
  {
    name: '📦 Phantom Machine Anomaly',
    desc: 'Industrial machinery declared at only 2.1kg',
    data: {
      shipper_name: 'Panama QuickCargo S.A.',
      consignee_name: 'Boeing Commercial Spares',
      origin_country: 'PA',
      destination_country: 'GB',
      cargo_type: 'Industrial Machinery',
      declared_value: 290000,
      weight_kg: 2.1,
      payment_method: 'Anonymous Prepaid Card',
    },
  },
];

const CARGO_BENCHMARKS = {
  Electronics: { min: 25, max: 500, label: '$25 - $500 / kg' },
  Pharmaceuticals: { min: 40, max: 1200, label: '$40 - $1,200 / kg' },
  'Luxury Goods': { min: 150, max: 4000, label: '$150 - $4,000 / kg' },
  Textiles: { min: 5, max: 85, label: '$5 - $85 / kg' },
  'Industrial Machinery': { min: 10, max: 180, label: '$10 - $180 / kg' },
  'Scrap Metal': { min: 0.4, max: 8, label: '$0.40 - $8.00 / kg' },
  Chemicals: { min: 8, max: 160, label: '$8 - $160 / kg' },
  'Automotive Parts': { min: 12, max: 200, label: '$12 - $200 / kg' },
};

function generateBookingId() {
  return `BK-${Math.floor(10000 + Math.random() * 90000)}`;
}

export default function BookingForm({ onBookingScored }) {
  const [formData, setFormData] = useState({
    booking_id: generateBookingId(),
    shipper_name: 'Foxconn Logistics Ltd',
    consignee_name: 'Apple Operations Americas',
    origin_country: 'CN',
    destination_country: 'US',
    cargo_type: 'Electronics',
    declared_value: 180000,
    weight_kg: 1200,
    shipping_date: new Date().toISOString().split('T')[0],
    payment_method: 'Letter of Credit',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      booking_id: generateBookingId(),
      ...preset.data,
      shipping_date: new Date().toISOString().split('T')[0],
    }));
    setResult(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'declared_value' || name === 'weight_kg' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/bookings/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`Scoring failed (${res.status}): ${res.statusText}`);
      }

      const scoreData = await res.json();
      setResult(scoreData);
      if (onBookingScored) {
        onBookingScored(scoreData);
      }
    } catch (err) {
      setError(err.message || 'Error communicating with scoring engine');
    } finally {
      setLoading(false);
    }
  };

  // Unit density calculation
  const density = formData.weight_kg > 0 ? (formData.declared_value / formData.weight_kg).toFixed(2) : 0;
  const benchmark = CARGO_BENCHMARKS[formData.cargo_type];
  const isUnderValued = benchmark && parseFloat(density) < benchmark.min;
  const isOverValued = benchmark && parseFloat(density) > benchmark.max;

  return (
    <div className="booking-card">
      <div className="booking-header">
        <div>
          <h3 className="section-title">Shipment Risk Assessment & Intake</h3>
          <p className="section-subtitle">
            Evaluate incoming consignment manifests against the ML Risk Engine and trade heuristics.
          </p>
        </div>
      </div>

      {/* Preset simulation buttons */}
      <div className="presets-wrapper">
        <span className="presets-label">⚡ Quick Presets:</span>
        <div className="presets-buttons">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-btn"
              onClick={() => applyPreset(p)}
              title={p.desc}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-grid">
          {/* Booking ID & Shipping Date */}
          <div className="form-group">
            <label htmlFor="booking_id">Booking Reference ID</label>
            <input
              type="text"
              id="booking_id"
              name="booking_id"
              value={formData.booking_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="shipping_date">Shipping Date</label>
            <input
              type="date"
              id="shipping_date"
              name="shipping_date"
              value={formData.shipping_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Shipper & Consignee */}
          <div className="form-group">
            <label htmlFor="shipper_name">Shipper / Consignor Entity</label>
            <input
              type="text"
              id="shipper_name"
              name="shipper_name"
              placeholder="e.g. Foxconn Logistics Ltd"
              value={formData.shipper_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="consignee_name">Consignee / Destination Receiver</label>
            <input
              type="text"
              id="consignee_name"
              name="consignee_name"
              placeholder="e.g. Apple Operations Americas"
              value={formData.consignee_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Origin & Destination */}
          <div className="form-group">
            <label htmlFor="origin_country">Origin Country Code</label>
            <input
              type="text"
              id="origin_country"
              name="origin_country"
              maxLength={2}
              placeholder="e.g. US, CN, DE, SG"
              value={formData.origin_country}
              onChange={(e) => setFormData({ ...formData, origin_country: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="destination_country">Destination Country Code</label>
            <input
              type="text"
              id="destination_country"
              name="destination_country"
              maxLength={2}
              placeholder="e.g. US, DE, NL, JP"
              value={formData.destination_country}
              onChange={(e) => setFormData({ ...formData, destination_country: e.target.value.toUpperCase() })}
              required
            />
          </div>

          {/* Cargo Type & Payment */}
          <div className="form-group">
            <label htmlFor="cargo_type">Cargo Classification</label>
            <select
              id="cargo_type"
              name="cargo_type"
              value={formData.cargo_type}
              onChange={handleChange}
              required
            >
              <option value="Electronics">Electronics</option>
              <option value="Pharmaceuticals">Pharmaceuticals</option>
              <option value="Luxury Goods">Luxury Goods</option>
              <option value="Textiles">Textiles</option>
              <option value="Industrial Machinery">Industrial Machinery</option>
              <option value="Scrap Metal">Scrap Metal</option>
              <option value="Chemicals">Chemicals</option>
              <option value="Automotive Parts">Automotive Parts</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="payment_method">Settlement & Payment Method</label>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
            >
              <option value="Letter of Credit">Letter of Credit (Standard)</option>
              <option value="Corporate Wire Transfer">Corporate Wire Transfer</option>
              <option value="Commercial Trade Credit">Commercial Trade Credit</option>
              <option value="Cryptocurrency">Cryptocurrency (High Risk)</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
              <option value="Third-Party Remittance">Third-Party Remittance</option>
              <option value="Anonymous Prepaid Card">Anonymous Prepaid Card</option>
            </select>
          </div>

          {/* Declared Value & Weight */}
          <div className="form-group">
            <label htmlFor="declared_value">Declared Cargo Value (USD $)</label>
            <input
              type="number"
              id="declared_value"
              name="declared_value"
              min="1"
              step="any"
              value={formData.declared_value}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight_kg">Consignment Gross Weight (kg)</label>
            <input
              type="number"
              id="weight_kg"
              name="weight_kg"
              min="0.1"
              step="any"
              value={formData.weight_kg}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Live Density Meter */}
        <div className="density-preview-card">
          <div className="density-info">
            <span className="density-label">Cargo Density Metric:</span>
            <span className="density-value">${density} / kg</span>
            <span className="density-benchmark">
              (Benchmark for {formData.cargo_type}: {benchmark?.label || 'N/A'})
            </span>
          </div>
          {isUnderValued && (
            <span className="badge badge-warning">⚠️ Sub-Benchmark (Potential Under-Invoicing)</span>
          )}
          {isOverValued && (
            <span className="badge badge-danger">🚨 Above Benchmark (Potential Money Laundering)</span>
          )}
          {!isUnderValued && !isOverValued && (
            <span className="badge badge-success">✓ Within Expected Valuation Range</span>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Evaluating Risk Pipeline...' : '🛡️ Analyze & Score Shipment'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setFormData((prev) => ({ ...prev, booking_id: generateBookingId() }));
              setResult(null);
            }}
          >
            New ID
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Result Card */}
      {result && (
        <div className={`score-result-card tier-${result.risk_tier.toLowerCase()}`}>
          <div className="score-result-header">
            <div>
              <span className="score-result-eyebrow">Scoring Complete</span>
              <h4 className="score-result-title">Shipment {result.booking_id} Evaluation</h4>
            </div>
            <div className="score-badge-group">
              <span className={`badge-tier badge-tier-${result.risk_tier.toLowerCase()}`}>
                {result.risk_tier} RISK
              </span>
              <span className="score-numeric-circle">
                {(result.risk_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Action Recommendation Banner */}
          <div className="action-recommendation-bar">
            <span className="action-tag">Recommended Action:</span>
            <span className="action-value">{result.recommended_action.replace(/_/g, ' ')}</span>
          </div>

          {/* Risk Factors Breakdown */}
          {result.risk_factors && result.risk_factors.length > 0 && (
            <div className="risk-factors-block">
              <h5>Detected Risk Indicators ({result.risk_factors.length})</h5>
              <ul className="factors-list">
                {result.risk_factors.map((f, i) => (
                  <li key={i} className="factor-item">
                    <span className="factor-bullet">⚠️</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Explainer Narrative */}
          {result.explanation && (
            <div className="explanation-block">
              <h5>FraudShield Intelligence Report</h5>
              <p className="explanation-text">{result.explanation}</p>
            </div>
          )}

          <div className="result-footer-note">
            ✓ Consignment record automatically routed to Reviewer Dashboard queue.
          </div>
        </div>
      )}
    </div>
  );
}
