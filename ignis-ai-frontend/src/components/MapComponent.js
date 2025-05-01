// src/components/MapComponent.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef
} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getWildfireData } from '../api';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
const R_EARTH = 3958.8;

// Helpers
function getBrightnessCategory(b) {
  if (b >= 375) return 'Extreme';
  if (b >= 350) return 'Severe';
  if (b >= 325) return 'Moderate';
  return 'Small';
}

// turn a raw confidence string (e.g. "0.41" or "41") into an integer percent
function confidenceToPercent(raw) {
  const n = parseFloat(raw);
  if (isNaN(n)) return 0;
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

// bracket into Low/Medium/High for side-panel
function bracketConfidence(pct) {
  if (pct < 40)       return 'Low';
  if (pct < 85)       return 'Medium';
  return 'High';
}

function getSeverityIcon(cat) {
  if (cat === 'Extreme') return '🔥🔥🔥';
  if (cat === 'Severe')  return '🔴🔥';
  if (cat === 'Moderate') return '⚠️';
  return '🌡️';
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat, lon, token) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${token}&limit=1`;
    const resp = await fetch(url);
    const { features } = await resp.json();
    return features?.[0]?.place_name || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

const MapComponent = forwardRef(({
  brightnessFilter,
  confidenceFilter,
  onFiresUpdated,
  setIsFetching,
  mapStyle,
  userLocation,
  range,
  onNearbyFiresUpdate
}, ref) => {
  const mapContainerRef = useRef();
  const mapRef          = useRef();
  const clickHandlerRef = useRef();
  const [wildfires, setWildfires] = useState([]);

  // 1) Fetch & cache data
  const fetchWildfires = async () => {
    setIsFetching(true);
    try {
      const { data } = await getWildfireData();
      const arr = data.data || [];
      setWildfires(arr);
      onFiresUpdated?.(arr.length);
      updateWildfireSource(arr);
    } finally {
      setIsFetching(false);
    }
  };
  useImperativeHandle(ref, () => ({ refreshWildfires: fetchWildfires }), []);

  // 2) Update wildfire layer source
  const updateWildfireSource = (dataArray = wildfires) => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('wildfires-source');
    if (!src) return;

    const filtered = dataArray.filter(f => {
      // reuse your old category filter logic
      const b = getBrightnessCategory(f.brightness);
      const pct = confidenceToPercent(f.confidence);
      const c = bracketConfidence(pct);
      return (!brightnessFilter || brightnessFilter === b)
          && (!confidenceFilter || confidenceFilter === c);
    });
    onFiresUpdated?.(filtered.length);

    src.setData({
      type: 'FeatureCollection',
      features: filtered.map(f => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.longitude, f.latitude] },
        properties: {
          brightnessCat:  getBrightnessCategory(f.brightness),
          confidenceRaw:  f.confidence,
          timestamp:      f.timestamp
        }
      }))
    });
  };

  // 3) User location marker
  const updateUserSource = () => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('user-source');
    if (!src) return;
    if (!userLocation) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    src.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [userLocation.lng, userLocation.lat] },
        properties: {}
      }]
    });
    const z = map.getZoom();
    map.setCenter([userLocation.lng, userLocation.lat]);
    map.setZoom(z);
  };

  // 4) Create sources/layers + click handler
  const setupLayers = () => {
    const map = mapRef.current;
    if (!map) return;

    // Wildfires layer
    if (map.getLayer('wildfires-layer'))  map.removeLayer('wildfires-layer');
    if (map.getSource('wildfires-source')) map.removeSource('wildfires-source');
    map.addSource('wildfires-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    map.addLayer({
      id: 'wildfires-layer',
      type: 'circle',
      source: 'wildfires-source',
      paint: {
        'circle-radius':       4,
        'circle-color':        '#FF4500',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });

    // Click handler for popups
    if (clickHandlerRef.current) {
      map.off('click','wildfires-layer', clickHandlerRef.current);
    }
    clickHandlerRef.current = async e => {
      const f = e.features[0];
      if (!f) return;
      const { brightnessCat, confidenceRaw, timestamp } = f.properties;
      const coords = f.geometry.coordinates;
      const timeStr = timestamp
        ? new Date(timestamp).toLocaleString()
        : 'Unknown';

      // raw percent for the popup
      const pct = confidenceToPercent(confidenceRaw);
      const address = await reverseGeocode(coords[1], coords[0], mapboxgl.accessToken);
      const icon    = getSeverityIcon(brightnessCat);

      new mapboxgl.Popup()
        .setLngLat(coords)
        .setHTML(`
          <div class="wildfire-popup">
            <h4>${icon} ${brightnessCat} Fire</h4>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Confidence:</strong> ${pct}%</p>
            <p><strong>Captured at:</strong> ${timeStr}</p>
          </div>
        `)
        .addTo(map);
    };
    map.on('click','wildfires-layer', clickHandlerRef.current);

    // User marker layer
    if (map.getLayer('user-layer'))  map.removeLayer('user-layer');
    if (map.getSource('user-source')) map.removeSource('user-source');
    map.addSource('user-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    map.addLayer({
      id: 'user-layer',
      type: 'circle',
      source: 'user-source',
      paint: {
        'circle-radius':       6,
        'circle-color':        '#1E90FF',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });
  };

  // 5) Initialize map once
  useEffect(() => {
    const m = new mapboxgl.Map({
      container: mapContainerRef.current,
      style:     mapStyle,
      center:    [-98, 38],
      zoom:      4,
      maxBounds: [[-130,22],[-66,50]]
    });
    m.addControl(new mapboxgl.NavigationControl());
    mapRef.current = m;

    m.on('load', () => {
      setupLayers();
      fetchWildfires();
      updateWildfireSource();
      updateUserSource();
    });
    return () => m.remove();
  }, []);

  // 6) Reapply on style change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(mapStyle);
    map.once('styledata', () => {
      setupLayers();
      updateWildfireSource();
      updateUserSource();
    });
  }, [mapStyle]);

  // 7) Refresh layer when filters/data change
  useEffect(() => {
    updateWildfireSource();
  }, [wildfires, brightnessFilter, confidenceFilter]);

  // 8) Update user marker
  useEffect(() => {
    updateUserSource();
  }, [userLocation]);

  // 9) Compute & send all in-range fires
  useEffect(() => {
    if (!onNearbyFiresUpdate) return;
    const t = setTimeout(async () => {
      if (!userLocation || wildfires.length === 0 || range <= 0) {
        onNearbyFiresUpdate([]);
        return;
      }
      // 9a) filter/in-range + derive brightnessCat + raw confidence
      const inRange = wildfires
        .map(f => {
          const d = haversineDistance(
            userLocation.lat, userLocation.lng,
            f.latitude, f.longitude
          );
          return {
            ...f,
            distance:      d,
            brightnessCat: getBrightnessCategory(f.brightness),
            confidenceRaw: f.confidence
          };
        })
        .filter(f => f.distance <= range);

      // 9b) enrich cityName + bracket confidence
      const enriched = await Promise.all(
        inRange.map(async f => {
          const pct = confidenceToPercent(f.confidenceRaw);
          const confCat = bracketConfidence(pct);
          const cityName = await reverseGeocode(f.latitude, f.longitude, mapboxgl.accessToken);
          return {
            cityName,
            distance:      f.distance,
            brightnessCat: f.brightnessCat,
            confidenceCat: confCat
          };
        })
      );
      onNearbyFiresUpdate(enriched);
    }, 500);
    return () => clearTimeout(t);
  }, [userLocation, range, wildfires, onNearbyFiresUpdate]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
});

export default MapComponent;
