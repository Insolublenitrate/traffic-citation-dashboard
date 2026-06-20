"use client";

import { useState, useRef, useCallback, useMemo } from 'react';
import Map, { Source, Layer, NavigationControl, FullscreenControl, MapRef, LayerProps } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { MapFilters } from '@/app/page';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_USERNAME = 'insolublenitrate';
const TILESET_ID = `${MAPBOX_USERNAME}.ohio-traffic-stops`;

const INITIAL_VIEW_STATE = {
  longitude: -82.9988,
  latitude: 39.9612,
  zoom: 6,
  pitch: 0,
  bearing: 0
};

// Heatmap layer for low zoom levels - Cyberpunk Aesthetic
const heatmapLayer: LayerProps = {
  id: 'traffic-heatmap',
  type: 'heatmap',
  source: 'traffic-stops',
  'source-layer': 'traffic_stops',
  maxzoom: 12,
  paint: {
    'heatmap-weight': 1,
    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 1,
      12, 4
    ],
    // Neon Cyberpunk Color Ramp
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0,0,0,0)',
      0.1, '#3b0764', // Deep Purple
      0.3, '#7e22ce', // Purple
      0.5, '#db2777', // Hot Pink
      0.7, '#f43f5e', // Rose
      0.9, '#eab308', // Neon Yellow
      1, '#ffffff'    // White Hot
    ],
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 2,
      12, 30
    ],
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
      'Citation', '#f43f5e', // Neon Rose
      'Warning', '#eab308',  // Neon Yellow
      'Arrest', '#9333ea',   // Neon Purple
      '#64748b' // Slate
    ],
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 2,
      16, 8
    ],
    'circle-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 0,
      12, 1
    ],
    'circle-stroke-width': 1,
    'circle-stroke-color': '#09090b'
  }
};

interface TrafficMapProps {
  onDataLoad?: (data: any[]) => void;
  filters: MapFilters;
}

export default function TrafficMap({ onDataLoad, filters }: TrafficMapProps) {
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const mapRef = useRef<MapRef>(null);

  // Build Mapbox filter array based on user selections
  const mapboxFilter = useMemo(() => {
    const activeFilters: any[] = ['all'];
    
    if (filters.department !== 'All') {
      activeFilters.push(['==', ['get', 'agency_name'], filters.department]);
    }
    if (filters.year !== 'All') {
      activeFilters.push(['==', ['get', 'year'], parseInt(filters.year, 10)]);
    }
    if (filters.outcome !== 'All') {
      activeFilters.push(['==', ['get', 'outcome'], filters.outcome]);
    }
    if (filters.reason !== 'All') {
      activeFilters.push(['==', ['get', 'reason'], filters.reason]);
    }

    return activeFilters.length > 1 ? activeFilters : undefined;
  }, [filters]);

  const updateSidebarData = useCallback(() => {
    if (mapRef.current && onDataLoad) {
      const features = mapRef.current.queryRenderedFeatures({
        layers: ['traffic-points', 'traffic-heatmap']
      });
      const propertiesList = features.map(f => f.properties);
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
          <Layer {...(heatmapLayer as any)} filter={mapboxFilter} />
          <Layer {...(pointLayer as any)} filter={mapboxFilter} />
        </Source>
        
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {hoverInfo && (
          <div
            className="absolute bg-zinc-950/90 text-white p-3 rounded-lg shadow-2xl border border-zinc-800 pointer-events-none text-sm z-50 backdrop-blur-md"
            style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
          >
            <div className="font-bold text-lg mb-1 text-zinc-100">{hoverInfo.feature.properties.agency_name}</div>
            <div className="text-zinc-400 mb-3">{hoverInfo.feature.properties.stop_date}</div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <span className="text-zinc-500">Reason</span>
              <span className="font-medium text-right text-zinc-200">{hoverInfo.feature.properties.reason}</span>
              
              <span className="text-zinc-500">Outcome</span>
              <span className={`font-medium text-right ${
                hoverInfo.feature.properties.outcome === 'Citation' ? 'text-pink-500' : 'text-yellow-400'
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
