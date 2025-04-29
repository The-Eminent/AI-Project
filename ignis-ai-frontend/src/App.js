// src/App.js
import React, { useRef, useState } from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import MapComponent from './components/MapComponent';
import FireControls from './components/FireControls';

function App() {
  const mapRef = useRef(null);

  const [brightnessFilter, setBrightnessFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [fireCount, setFireCount] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');

  // user location + range
  const [userLocation, setUserLocation] = useState(null);
  const [range, setRange] = useState(20);

  // store array of nearby fires
  const [nearbyFires, setNearbyFires] = useState([]);

  const handleRefresh = () => {
    if (mapRef.current && mapRef.current.refreshWildfires) {
      mapRef.current.refreshWildfires();
    }
  };

  const handleFiresUpdated = (count) => {
    setFireCount(count);
  };

  // called by MapComponent with enriched "nearby fires"
  const handleNearbyFiresUpdate = (fires) => {
    setNearbyFires(fires);
  };

  return (
    <div style={styles.appContainer}>
      <Header />
      <div style={styles.mapContainer}>
        <MapComponent
          ref={mapRef}
          brightnessFilter={brightnessFilter}
          confidenceFilter={confidenceFilter}
          onFiresUpdated={handleFiresUpdated}
          setIsFetching={setIsFetching}
          mapStyle={mapStyle}
          userLocation={userLocation}
          range={range}
          onNearbyFiresUpdate={handleNearbyFiresUpdate}
        />

        <FireControls
          onRefresh={handleRefresh}
          isFetching={isFetching}
          fireCount={fireCount}
          onChangeBrightness={setBrightnessFilter}
          onChangeConfidence={setConfidenceFilter}
          onChangeMapStyle={setMapStyle}

          mapboxToken={process.env.REACT_APP_MAPBOX_TOKEN}
          onSelectLocation={setUserLocation}

          range={range}
          onChangeRange={setRange}
          nearbyFires={nearbyFires}
        />
      </div>
      <Footer />
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh'
  },
  mapContainer: {
    position: 'relative',
    flex: 1,
    overflow: 'hidden'
  }
};

export default App;
