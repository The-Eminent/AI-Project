import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getWildfireData } from '../api';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

function getBrightnessCategory(brightness) {
  if (brightness >= 375) return 'Extreme';
  if (brightness >= 350) return 'Severe';
  if (brightness >= 325) return 'Moderate';
  return 'Small';
}

function getConfidenceCategory(confidenceStr) {
  const numericValue =
    typeof confidenceStr === 'string'
      ? parseFloat(confidenceStr)
      : Number(confidenceStr);

  if (isNaN(numericValue)) return 'Unknown';
  if (numericValue >= 0.8) return 'Very High';
  if (numericValue >= 0.5) return 'High';
  if (numericValue >= 0.3) return 'Medium';
  return 'Low';
}

const MapComponent = forwardRef(
  (
    { 
      brightnessFilter, 
      confidenceFilter, 
      onFiresUpdated, 
      setIsFetching,
      mapStyle // <-- new prop
    },
    ref
  ) => {
    const mapContainerRef = useRef(null);
    const [map, setMap] = useState(null);
    const [wildfires, setWildfires] = useState([]);

    const fetchWildfires = async () => {
      try {
        setIsFetching(true);
        const response = await getWildfireData();
        const data = response.data.data || [];
        setWildfires(data);
        setIsFetching(false);

        if (onFiresUpdated) {
          onFiresUpdated(data.length);
        }
      } catch (error) {
        console.error('Error fetching wildfire data:', error);
        setIsFetching(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refreshWildfires: () => {
        fetchWildfires();
      },
    }));

    // 1) Create map once
    useEffect(() => {
      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Initial style
        center: [-118.2437, 34.0522],
        zoom: 6,
      });
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
      setMap(mapInstance);

      return () => mapInstance.remove();
    }, []);

    // 2) Fetch data once map is ready
    useEffect(() => {
      if (map) {
        fetchWildfires();
      }
    }, [map]);

    // 3) If mapStyle changes, update it
    useEffect(() => {
      if (map && mapStyle) {
        map.setStyle(mapStyle);
      }
    }, [map, mapStyle]);

    // 4) Redraw markers whenever wildfires or filters change
    useEffect(() => {
      if (!map) return;

      // Clear existing markers
      const markers = document.getElementsByClassName('wildfire-marker');
      while (markers.length > 0) {
        markers[0].parentNode.removeChild(markers[0]);
      }

      // Filter data
      const filtered = wildfires.filter((fire) => {
        const bCat = getBrightnessCategory(fire.brightness);
        const cCat = getConfidenceCategory(fire.confidence);

        let passB = true;
        let passC = true;

        if (brightnessFilter && brightnessFilter !== bCat) {
          passB = false;
        }
        if (confidenceFilter && confidenceFilter !== cCat) {
          passC = false;
        }
        return passB && passC;
      });

      if (onFiresUpdated) {
        onFiresUpdated(filtered.length);
      }

      // Add markers
      filtered.forEach((fire) => {
        const el = document.createElement('div');
        el.className = 'wildfire-marker';

        // Dynamic emoji
        if (fire.brightness >= 375) el.innerHTML = '🔥🔥🔥';
        else if (fire.brightness >= 350) el.innerHTML = '🔥🔥';
        else el.innerHTML = '🔥';

        const confidenceCat = getConfidenceCategory(fire.confidence);
        const brightnessCat = getBrightnessCategory(fire.brightness);
        const timeStr = fire.timestamp
          ? new Date(fire.timestamp).toLocaleString()
          : 'Unknown';

        const popupHTML = `
          <div class="wildfire-popup">
            <h4>${brightnessCat} Fire</h4>
            <p><strong>Confidence:</strong> ${confidenceCat}</p>
            <p><strong>Detected at:</strong> ${timeStr}</p>
          </div>
        `;

        new mapboxgl.Marker(el)
          .setLngLat([fire.longitude, fire.latitude])
          .setPopup(new mapboxgl.Popup().setHTML(popupHTML))
          .addTo(map);
      });
    }, [map, wildfires, brightnessFilter, confidenceFilter, onFiresUpdated]);

    return (
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />
    );
  }
);

export default MapComponent;
