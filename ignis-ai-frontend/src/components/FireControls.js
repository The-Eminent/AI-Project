// src/components/FireControls.js
import React, { useState, useEffect } from 'react';

/**
 * Props:
 * - onRefresh: () => void           - Trigger new data fetch
 * - isFetching: boolean            - Whether we are currently fetching
 * - fireCount: number | null       - How many fires are displayed
 * - onChangeBrightness: (string) => void
 * - onChangeConfidence: (string) => void
 * - onChangeMapStyle?: (string) => void  // Only if you want to keep style toggling
 */

function FireControls({
  onRefresh,
  isFetching,
  fireCount,
  onChangeBrightness,
  onChangeConfidence,
  onChangeMapStyle
}) {
  const [showCount, setShowCount] = useState(false);

  useEffect(() => {
    if (fireCount !== null) {
      setShowCount(true);
      const timer = setTimeout(() => {
        setShowCount(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fireCount]);

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Wildfire Controls</h3>

      <button
        style={styles.button}
        onClick={handleRefresh}
        disabled={isFetching}
      >
        {isFetching ? 'Refreshing...' : 'Refresh Data'}
      </button>

      {showCount && (
        <div style={styles.countBox}>Currently displaying {fireCount} fires</div>
      )}

      {/* Brightness Filter */}
      <div style={styles.selectGroup}>
        <label style={styles.label}>Brightness Filter:</label>
        <select
          style={styles.select}
          onChange={(e) => onChangeBrightness(e.target.value)}
        >
          <option value="">All</option>
          <option value="Small">Small Fire ⚡</option>
          <option value="Moderate">Moderate Fire 🔥</option>
          <option value="Severe">Severe Fire 🔥🔥</option>
          <option value="Extreme">Extreme Fire 🔥🔥🔥</option>
        </select>
      </div>

      {/* Confidence Filter */}
      <div style={styles.selectGroup}>
        <label style={styles.label}>Confidence Filter:</label>
        <select
          style={styles.select}
          onChange={(e) => onChangeConfidence(e.target.value)}
        >
          <option value="">All</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Very High">Very High</option>
        </select>
      </div>

      {/* Optional Map Style Toggle */}
      {onChangeMapStyle && (
        <div style={styles.selectGroup}>
          <label style={styles.label}>Map Style:</label>
          <select
            style={styles.select}
            onChange={(e) => onChangeMapStyle(e.target.value)}
          >
            <option value="mapbox://styles/mapbox/streets-v12">Streets</option>
            <option value="mapbox://styles/mapbox/outdoors-v12">Outdoors</option>
            <option value="mapbox://styles/mapbox/satellite-streets-v12">Satellite</option>
            <option value="mapbox://styles/mapbox/light-v10">Light</option>
            <option value="mapbox://styles/mapbox/dark-v10">Dark</option>
          </select>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: '1rem',
    left: '1rem', // place on left side
    zIndex: 999,
    width: '220px',
    padding: '1rem',
    backgroundColor: '#ffffffcc',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    fontFamily: 'sans-serif'
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.1rem'
  },
  button: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    marginBottom: '0.5rem',
    cursor: 'pointer'
  },
  countBox: {
    marginBottom: '0.5rem',
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
    padding: '0.5rem',
    borderRadius: '4px',
    fontSize: '0.9rem'
  },
  selectGroup: {
    marginBottom: '0.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.25rem',
    fontWeight: 'bold'
  },
  select: {
    width: '100%',
    padding: '0.3rem',
    fontSize: '0.9rem'
  }
};

export default FireControls;
