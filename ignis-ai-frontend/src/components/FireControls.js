// src/components/FireControls.js
import React, { useState, useEffect, useRef, useMemo } from 'react';

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

  // geocode
  const [query, setQuery]               = useState('');
  const [suggestions, setSuggestions]   = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const skipNextFetch = useRef(false);

  // panel toggle
  const [isOpen, setIsOpen] = useState(true);

  // sorting toggles
  const [sortClosest, setSortClosest]     = useState(true);
  const [sortDangerous, setSortDangerous] = useState(false);

  // fade-out banner
  useEffect(() => {
    if (fireCount !== null) {
      setShowCount(true);
      const t = setTimeout(() => setShowCount(false), 3000);
      return () => clearTimeout(t);
    }
  }, [fireCount]);

  // debounced geocode
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (!query) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGeocoding(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const fetchGeocoding = async text => {
    if (!mapboxToken) return;
    try {
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          text
        )}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`
      );
      const { features } = await resp.json();
      setSuggestions(features || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = feat => {
    skipNextFetch.current = true;
    const [lng, lat] = feat.center;
    onSelectLocation?.({ lat, lng });
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
      pos => {
        skipNextFetch.current = true;
        onSelectLocation?.({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setQuery('My Current Location');
        setShowSuggestions(false);
        setSuggestions([]);
      },
      () => alert('Unable to retrieve location.')
    );
  };

  const handleRangeChange = e => {
    const val = e.target.value;
    onChangeRange?.(val === '' ? 0 : parseFloat(val));
  };

  // map confidence category to percentage
  const getConfidencePercent = cat => {
    switch (cat) {
      case 'Low':       return 33;
      case 'Medium':    return 66;
      case 'High':      return 90;
      case 'Very High': return 100;
      default:          return 0;
    }
  };

  // map brightness category to severity rank
  const getSeverityRank = cat => {
    switch (cat) {
      case 'Extreme': return 4;
      case 'Severe':  return 3;
      case 'Moderate':return 2;
      case 'Small':   return 1;
      default:        return 0;
    }
  };

  // decide which 10 to display based on checkboxes
  const displayedFires = useMemo(() => {
    let list = [...nearbyFires];

    if (sortClosest && !sortDangerous) {
      // pure distance
      list.sort((a, b) => a.distance - b.distance);
    } else if (!sortClosest && sortDangerous) {
      // pure “danger” → severity first, then confidence
      list.sort((a, b) => {
        const srA = getSeverityRank(a.brightnessCat);
        const srB = getSeverityRank(b.brightnessCat);
        if (srB !== srA) return srB - srA;
        return getConfidencePercent(b.confidenceCat) - getConfidencePercent(a.confidenceCat);
      });
    } else if (sortClosest && sortDangerous) {
      // combined score: 50% normalized severity + 50% normalized inverse distance
      const maxDist = Math.max(...list.map(f => f.distance), 1);
      list = list.map(f => {
        const sevNorm = (getSeverityRank(f.brightnessCat) - 1) / 3;
        const invDist  = (maxDist - f.distance) / maxDist;
        return {
          ...f,
          score: sevNorm * 0.5 + invDist * 0.5
        };
      });
      list.sort((a, b) => b.score - a.score);
    } else {
      // neither checked → fallback to distance
      list.sort((a, b) => a.distance - b.distance);
    }

    return list.slice(0, 10);
  }, [nearbyFires, sortClosest, sortDangerous]);

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.toggleBtn} onClick={() => setIsOpen(o => !o)}>
          {isOpen ? '▼' : '▲'}
        </button>
        <h3 style={styles.title}>Wildfire Controls</h3>
      </div>

      {isOpen && (
        <div style={{ padding: '1rem' }}>
          <button
            style={styles.input}
            onClick={onRefresh}
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
          <select
            style={styles.input}
            onChange={e => onChangeBrightness(e.target.value)}
          >
            <option value="">All</option>
            <option value="Small">🌡️ Small Fire</option>
            <option value="Moderate">⚠️ Moderate Fire</option>
            <option value="Severe">🔴🔥 Severe Fire</option>
            <option value="Extreme">🔥🔥🔥 Extreme Fire</option>
          </select>

          <label style={styles.label}>Confidence Filter:</label>
          <select
            style={styles.input}
            onChange={e => onChangeConfidence(e.target.value)}
          >
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
                onChange={e => onChangeMapStyle(e.target.value)}
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
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul style={styles.suggestionList}>
              {suggestions.map(feat => (
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

          <button style={styles.input} onClick={handleUseMyLocation}>
            Use My Location
          </button>

          <label style={styles.label}>Nearby Fire Range (miles):</label>
          <input
            type="number"
            style={styles.input}
            value={range === 0 ? '' : range}
            onChange={handleRangeChange}
          />

          <div style={styles.sortControls}>
            <label>
              <input
                type="checkbox"
                checked={sortClosest}
                onChange={() => setSortClosest(c => !c)}
              />{' '}
              Closest
            </label>
            <label style={{ marginLeft: '1rem' }}>
              <input
                type="checkbox"
                checked={sortDangerous}
                onChange={() => setSortDangerous(d => !d)}
              />{' '}
              Most Dangerous
            </label>
          </div>

          {displayedFires.length > 0 && (
            <div style={styles.nearbyList}>
              <h4 style={{ margin: 0, marginBottom: 10 }}>Nearby Fires</h4>
              <div style={styles.fireListContainer}>
                <ul style={styles.fireList}>
                  {displayedFires.map((f, idx) => (
                    <li key={idx} style={styles.fireItem}>
                      <strong>{idx + 1}. {f.cityName}</strong><br/>
                      <span style={{ color: 'red' }}>
                        {f.distance.toFixed(1)} miles away
                      </span><br/>
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
  container: {
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
  },
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
  title: { margin: 0, fontSize: '1rem' },
  subHeader: { margin: '0.5rem 0 0.25rem', fontSize: '1rem' },
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
  sortControls: { margin: '0.5rem 0', fontSize: '0.9rem' },
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
    paddingLeft: 0,
    listStyle: 'none'
  },
  fireItem: {
    marginBottom: '0.75rem'
  }
};

export default FireControls;
