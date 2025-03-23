import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getWildfireData } from '../api'; // Import API function

//mapboxgl.accessToken = 'pk.eyJ1IjoiY2hyaXMtanVhcmV6IiwiYSI6ImNtODZpNzZrMDA0eXUycHB1cnpsdWp6OTcifQ.PcKuaHAAatc3l1Yeh4qrtQ';
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const MapComponent = () => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [wildfireData, setWildfireData] = useState([]); 

  useEffect(() => {
    // Initialize Mapbox
    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-118.2437, 34.0522], // Los Angeles coordinates
      zoom: 6,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    setMap(mapInstance);

    return () => mapInstance.remove();
  }, []);

  useEffect(() => {
    // Fetch wildfire data and add markers
    const fetchData = async () => {
      try {
        const response = await getWildfireData();
        setWildfireData(response.data.data); // Assuming API returns data in response.data.data

        // Add markers to the map
        response.data.data.forEach((fire) => {
          new mapboxgl.Marker({ color: 'red' })
            .setLngLat([fire.longitude, fire.latitude])
            .setPopup(new mapboxgl.Popup().setText(`🔥 Brightness: ${fire.brightness}`))
            .addTo(map);
        });
      } catch (error) {
        console.error("Error fetching wildfire data:", error);
      }
    };

    if (map) {
      fetchData();
    }
  }, [map]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '600px', borderRadius: '8px' }} />;
};

export default MapComponent;