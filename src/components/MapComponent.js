import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hyaXMtanVhcmV6IiwiYSI6ImNtODZpNzZrMDA0eXUycHB1cnpsdWp6OTcifQ.PcKuaHAAatc3l1Yeh4qrtQ';

const MapComponent = () => {
  const mapContainerRef = React.useRef(null);

  React.useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-118.2437, 34.0522], // Los Angeles coordinates
      zoom: 9
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup on unmount
    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '600px', borderRadius: '8px' }}
    />
  );
};

export default MapComponent;