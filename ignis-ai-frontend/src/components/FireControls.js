// src/components/FireControls.js
import React, { useState, useEffect, useRef } from 'react';

function FireControls({
  onRefresh,
  isFetching,
  fireCount,
  onChangeBrightness,
  onChangeConfidence,
  onChangeMapStyle,

  mapboxToken,
  onSelectLocation,

  range,
  onChangeRange,

  nearbyFires
}) {
  const [showCount, setShowCount] = useState(false);

  // location input
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  // **TOGGLE**: is panel open or closed?
  const [isOpen, setIsOpen] = useState(true);
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // fade out fireCount
  useEffect(() => {
    if (fireCount !== null) {
      setShowCount(true);
      const timer = setTimeout(() => setShowCount(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [fireCount]);

  // debounced geocoding
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGeocoding(query);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const fetchGeocoding = async (searchText) => {
    if (!mapboxToken) return;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      searchText
    )}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.features) {
        setSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (feat) => {
    const [lng, lat] = feat.center;
    if (onSelectLocation) {
      onSelectLocation({ lat, lng });
    }
    setQuery(feat.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (onSelectLocation) {
          onSelectLocation({ lat, lng });
        }
        setQuery('My Current Location');
        setShowSuggestions(false);
        setSuggestions([]);
      },
      (err) => {
        console.error('Geo error:', err);
        alert('Unable to retrieve location.');
      }
    );
  };

  const handleRangeChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    if (onChangeRange) onChangeRange(val);
  };

  const handleRefreshClick = () => {
    if (onRefresh) onRefresh();
  };

  return (
    <div style={{
      position: 'absolute',
      top: '1rem',
      left: '1rem',
      zIndex: 999,
      width: '260px',
      backgroundColor: '#ffffffcc',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      fontFamily: 'sans-serif',
      overflow: 'hidden'
    }}>
      {/* TOP BAR: toggle + title */}
      <div style={styles.topBar}>
        <button style={styles.toggleBtn} onClick={togglePanel}>
          {isOpen ? '▼' : '▲'}
        </button>
        <h3 style={styles.title}>Wildfire Controls</h3>
      </div>

      {/* CONTENT: hidden if isOpen=false */}
      {isOpen && (
        <div style={{ padding: '1rem' }}>
          <button
            style={styles.input}
            onClick={handleRefreshClick}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing...' : 'Refresh Fire Data'}
          </button>

          {showCount && (
            <div style={styles.countBox}>
              Displaying {fireCount} fires
            </div>
          )}

          <label style={styles.label}>Brightness Filter:</label>
          <select style={styles.input} onChange={(e) => onChangeBrightness(e.target.value)}>
            <option value="">All</option>
            <option value="Small">Small Fire ⚡</option>
            <option value="Moderate">Moderate Fire 🔥</option>
            <option value="Severe">Severe Fire 🔥🔥</option>
            <option value="Extreme">Extreme Fire 🔥🔥🔥</option>
          </select>

          <label style={styles.label}>Confidence Filter:</label>
          <select style={styles.input} onChange={(e) => onChangeConfidence(e.target.value)}>
            <option value="">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Very High">Very High</option>
          </select>

          {onChangeMapStyle && (
            <>
              <label style={styles.label}>Map Style:</label>
              <select
                style={styles.input}
                onChange={(e) => onChangeMapStyle(e.target.value)}
              >
                <option value="mapbox://styles/mapbox/streets-v12">Streets</option>
                <option value="mapbox://styles/mapbox/outdoors-v12">Outdoors</option>
                <option value="mapbox://styles/mapbox/satellite-streets-v12">Satellite</option>
                <option value="mapbox://styles/mapbox/light-v10">Light</option>
                <option value="mapbox://styles/mapbox/dark-v10">Dark</option>
              </select>
            </>
          )}

          <h4 style={styles.subHeader}>Find Location</h4>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter city or postal code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul style={styles.suggestionList}>
              {suggestions.map((feat) => (
                <li
                  key={feat.id}
                  style={styles.suggestionItem}
                  onClick={() => handleSelectSuggestion(feat)}
                >
                  {feat.place_name}
                </li>
              ))}
            </ul>
          )}

          <button
            style={styles.input}
            onClick={handleUseMyLocation}
          >
            Use My Location
          </button>

          <label style={styles.label}>Nearby Fire Range (miles):</label>
          <input
            type="number"
            style={styles.input}
            value={range}
            onChange={handleRangeChange}
          />

          {nearbyFires && nearbyFires.length > 0 && (
            <div style={styles.nearbyList}>
              <h4>Nearby Fires</h4>
              <div style={styles.fireListContainer}>
                <ul style={styles.fireList}>
                  {nearbyFires.map((f, idx) => (
                    <li key={idx} style={styles.fireItem}>
                      <span style={{ color: '#000' }}>{f.cityName}</span><br />
                      <span style={{ color: 'red' }}>{f.distance.toFixed(1)} miles away</span><br />
                      <span style={{ color: 'darkblue' }}>
                        {f.brightnessCat} Fire, {f.confidenceCat} Confidence
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  topBar: {
    height: 40,
    background: '#eee',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #ccc',
    padding: '0 0.5rem'
  },
  toggleBtn: {
    background: '#fff',
    border: '1px solid #ccc',
    cursor: 'pointer',
    marginRight: 6,
    borderRadius: 4,
    width: 30,
    height: 30
  },
  title: {
    margin: 0,
    fontSize: '1rem'
  },
  subHeader: {
    margin: '0.5rem 0 0.25rem',
    fontSize: '1rem'
  },
  input: {
    width: '100%',
    padding: '0.4rem',
    fontSize: '0.9rem',
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
  label: {
    fontWeight: 'bold',
    marginBottom: '0.25rem',
    display: 'block'
  },
  suggestionList: {
    listStyle: 'none',
    margin: 0,
    padding: '0.5rem',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    maxHeight: '120px',
    overflowY: 'auto',
    position: 'absolute',
    width: 'calc(100% - 2rem)'
  },
  suggestionItem: {
    padding: '0.3rem 0.5rem',
    cursor: 'pointer'
  },
  nearbyList: {
    marginTop: '0.5rem',
    backgroundColor: '#f9f9f9',
    padding: '0.5rem',
    borderRadius: '4px'
  },
  fireListContainer: {
    maxHeight: '100px',
    overflowY: 'auto'
  },
  fireList: {
    margin: 0,
    paddingLeft: '1.2rem',
    listStyle: 'decimal'
  },
  fireItem: {
    marginBottom: '0.75rem'
  }
};

export default FireControls;
