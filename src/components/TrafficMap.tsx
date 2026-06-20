"use client";

import { useState, useRef, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl, FullscreenControl, MapRef, LayerProps } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_USERNAME = 'insolublenitrate';
const TILESET_ID = `${MAPBOX_USERNAME}.ohio-traffic-stops`;

const INITIAL_VIEW_STATE = {
  longitude: -82.9988, // Centered on Columbus, OH
  latitude: 39.9612,
  zoom: 6,
  pitch: 0,
  bearing: 0
};

// Heatmap layer for low zoom levels
const heatmapLayer: LayerProps = {
  id: 'traffic-heatmap',
  type: 'heatmap',
  source: 'traffic-stops',
  'source-layer': 'traffic_stops',
  maxzoom: 12,
  paint: {
    // Increase the heatmap weight based on frequency
    'heatmap-weight': 1,
    // Increase the heatmap color weight weight by zoom level
    // heatmap-intensity is a multiplier on top of heatmap-weight
    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 1,
      12, 3
    ],
    // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
    // Begin color ramp at 0-stop with a 0-transparancy color
    // to create a blur-like effect.
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(33,102,172,0)',
      0.2, 'rgb(103,169,207)',
      0.4, 'rgb(209,229,240)',
      0.6, 'rgb(253,219,199)',
      0.8, 'rgb(239,138,98)',
      1, 'rgb(178,24,43)'
    ],
    // Adjust the heatmap radius by zoom level
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 2,
      12, 20
    ],
    // Transition from heatmap to circle layer by zoom level
    'heatmap-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      9, 1,
      13, 0
    ]
  }
};

// Circle layer for high zoom levels
const pointLayer: LayerProps = {
  id: 'traffic-points',
  type: 'circle',
  source: 'traffic-stops',
  'source-layer': 'traffic_stops',
  minzoom: 10,
  paint: {
    // Red for citations, yellow for warnings
    'circle-color': [
      'match',
      ['get', 'outcome'],
      'Citation', '#ef4444', // Red
      'Warning', '#eab308',  // Yellow
      'Arrest', '#b91c1c',   // Dark Red
      '#64748b' // Default slate
    ],
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 2,
      16, 6
    ],
    'circle-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 0,
      12, 1
    ],
    'circle-stroke-width': 1,
    'circle-stroke-color': '#1e293b'
  }
};

interface TrafficMapProps {
  onDataLoad?: (data: any[]) => void;
}

export default function TrafficMap({ onDataLoad }: TrafficMapProps) {
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const mapRef = useRef<MapRef>(null);

  const updateSidebarData = useCallback(() => {
    if (mapRef.current && onDataLoad) {
      // Query rendered features from the Mapbox vector source
      const features = mapRef.current.queryRenderedFeatures({
        layers: ['traffic-points', 'traffic-heatmap']
      });
      // Pass the properties of the features to the sidebar
      const propertiesList = features.map(f => f.properties);
      
      // Deduplicate features if needed, but Mapbox features might represent multiple points in heatmap.
      // We will just pass the properties.
      onDataLoad(propertiesList);
    }
  }, [onDataLoad]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-zinc-900 text-white p-8 text-center z-50">
        <div className="max-w-md space-y-4">
          <h2 className="text-xl font-bold text-red-500">Missing Mapbox Token</h2>
          <p>The map cannot render because NEXT_PUBLIC_MAPBOX_TOKEN is not set in your Vercel Environment Variables.</p>
        </div>
      </div>
    );
  }

  const onHover = (event: any) => {
    const { features, point } = event;
    const hoveredFeature = features && features[0];
    
    if (hoveredFeature) {
      setHoverInfo({
        feature: hoveredFeature,
        x: point.x,
        y: point.y
      });
    } else {
      setHoverInfo(null);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-zinc-950">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={['traffic-points']}
        onMouseMove={onHover}
        onMouseLeave={() => setHoverInfo(null)}
        onIdle={updateSidebarData}
      >
        <Source id="traffic-stops" type="vector" url={`mapbox://${TILESET_ID}`}>
          <Layer {...heatmapLayer} />
          <Layer {...pointLayer} />
        </Source>
        
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {hoverInfo && (
          <div
            className="absolute bg-zinc-900/90 text-white p-3 rounded-lg shadow-xl border border-zinc-700 pointer-events-none text-sm z-50 backdrop-blur-sm"
            style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
          >
            <div className="font-bold text-lg mb-1">{hoverInfo.feature.properties.agency_name}</div>
            <div className="text-zinc-300 mb-2">{hoverInfo.feature.properties.stop_date}</div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-zinc-500">Reason</span>
              <span className="font-medium text-right">{hoverInfo.feature.properties.reason}</span>
              
              <span className="text-zinc-500">Outcome</span>
              <span className={`font-medium text-right ${
                hoverInfo.feature.properties.outcome === 'Citation' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {hoverInfo.feature.properties.outcome}
              </span>
            </div>
          </div>
        )}
      </Map>
    </div>
  );
}
