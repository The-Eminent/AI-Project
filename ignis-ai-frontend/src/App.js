// src/App.js
import React, { useRef, useState } from 'react';
import './App.css';
import Header from './components/Header'; // optional
import Footer from './components/Footer'; // optional
import MapComponent from './components/MapComponent';
import FireControls from './components/FireControls';

function App() {
  const mapRef = useRef(null);

  const [brightnessFilter, setBrightnessFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [fireCount, setFireCount] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  

  //map style toggle:
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');

  const handleRefresh = () => {
    if (mapRef.current && mapRef.current.refreshWildfires) {
      mapRef.current.refreshWildfires();
    }
  };

  const handleFiresUpdated = (count) => {
    setFireCount(count);
  };

  return (
    <div style={styles.appContainer}>
      <Header />

      {/* Main Content = map area */}
      <div style={styles.mapContainer}>

        <MapComponent
          ref={mapRef}
          brightnessFilter={brightnessFilter}
          confidenceFilter={confidenceFilter}
          onFiresUpdated={handleFiresUpdated}
          setIsFetching={setIsFetching}
          mapStyle={mapStyle}
        />

        {/* Our floating panel on the left */}
        <FireControls
          onRefresh={handleRefresh}
          isFetching={isFetching}
          fireCount={fireCount}
          onChangeBrightness={setBrightnessFilter}
          onChangeConfidence={setConfidenceFilter}
          onChangeMapStyle={setMapStyle}  // only if you want style toggling
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
