import React, { useState, useEffect, useRef } from 'react';

/**
 * Props we expect:
 * - mapboxToken: string  (Your Mapbox public access token)
 * - onSelectLocation: ( { lat: number, lng: number } ) => void
 *     Called when user picks a location from the suggestions or uses geolocation.
 * - onChangeRadius: ( number ) => void
 *     Called when user changes the "nearby fires" radius.
 */
function LocationSearch({ mapboxToken, onSelectLocation, onChangeRadius }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [radius, setRadius] = useState(20); // default 20 miles or km, up to you

  const timeoutRef = useRef(null);

  // 1) Typeahead effect with debouncing
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    // Debounce: wait 300 ms after user stops typing
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  const fetchSuggestions = async (searchText) => {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchText
      )}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features) {
        setSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching geocoding suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (feature) => {
    // feature.center = [lng, lat]
    const [lng, lat] = feature.center;
    if (onSelectLocation) {
      onSelectLocation({ lat, lng });
    }
    setQuery(feature.place_name);
    setShowSuggestions(false);
  };

  // 2) Use My Location (browser geolocation)
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
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
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Unable to retrieve your location.');
      }
    );
  };

  // 3) Let the user pick the range for nearby fires
  const handleRadiusChange = (e) => {
    const val = parseFloat(e.target.value);
    setRadius(val);
    if (onChangeRadius) {
      onChangeRadius(val);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Find Location</h3>

      {/* Address Input */}
      <input
        style={styles.input}
        type="text"
        placeholder="Enter address, city, or postal code..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul style={styles.suggestionList}>
          {suggestions.map((feature) => (
            <li
              key={feature.id}
              style={styles.suggestionItem}
              onClick={() => handleSelectSuggestion(feature)}
            >
              {feature.place_name}
            </li>
          ))}
        </ul>
      )}

      <button style={styles.button} onClick={handleUseMyLocation}>
        Use My Location
      </button>

      {/* Radius Selector */}
      <div style={{ marginTop: '1rem' }}>
        <label style={styles.label}>Nearby Fire Range (miles): </label>
        <input
          style={styles.input}
          type="number"
          value={radius}
          onChange={handleRadiusChange}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: '8rem', // some offset so it doesn't overlap your other controls
    left: '1rem',
    zIndex: 999,
    width: '250px',
    background: '#ffffffcc',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    fontFamily: 'sans-serif'
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.1rem'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    marginBottom: '0.5rem',
    fontSize: '0.9rem'
  },
  suggestionList: {
    listStyleType: 'none',
    margin: 0,
    padding: '0.5rem',
    background: '#fff',
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
  button: {
    display: 'block',
    width: '100%',
    padding: '0.5rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '0.5rem'
  },
  label: {
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '0.25rem'
  }
};

export default LocationSearch;
