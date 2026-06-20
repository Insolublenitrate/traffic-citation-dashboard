"use client";

import { useState, useEffect, useCallback } from 'react';
import Map from 'react-map-gl/mapbox';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { WebMercatorViewport } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const INITIAL_VIEW_STATE = {
  longitude: -77.1528, // Centered on Montgomery County, MD
  latitude: 39.1547,
  zoom: 10,
  pitch: 0,
  bearing: 0
};

interface TrafficMapProps {
  onDataLoad: (data: any[]) => void;
}

export default function TrafficMap({ onDataLoad }: TrafficMapProps) {
  const [data, setData] = useState([]);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const fetchBounds = useCallback(async (vs: typeof INITIAL_VIEW_STATE) => {
    try {
      // Calculate the bounding box of the current view
      const viewport = new WebMercatorViewport({
        width: window.innerWidth || 800,
        height: window.innerHeight || 600,
        ...vs
      });
      const [minLng, minLat, maxLng, maxLat] = viewport.getBounds();
      
      // Call our Next.js API route
      const res = await fetch(`/api/traffic-stops?min_lng=${minLng}&min_lat=${minLat}&max_lng=${maxLng}&max_lat=${maxLat}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      
      const json = await res.json();
      setData(json);
      onDataLoad(json); // Pass data up to the parent dashboard component
    } catch (err) {
      console.error("Error fetching map data:", err);
    }
  }, [onDataLoad]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchBounds(viewState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const layers = [
    new ScatterplotLayer({
      id: 'traffic-stops-layer',
      data,
      getPosition: (d: any) => [d.lng, d.lat],
      getFillColor: (d: any) => {
        // Red for citations, Yellow for warnings
        return d.outcome?.toLowerCase().includes('citation') ? [239, 68, 68, 200] : [234, 179, 8, 200];
      },
      getRadius: 100,
      radiusMinPixels: 4,
      radiusMaxPixels: 15,
      pickable: true,
      autoHighlight: true,
    })
  ];

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-zinc-900 text-white p-8 text-center z-50">
        <div className="max-w-md space-y-4">
          <h2 className="text-xl font-bold text-red-500">Missing Mapbox Token</h2>
          <p>The map cannot render because NEXT_PUBLIC_MAPBOX_TOKEN is not set in your Vercel Environment Variables.</p>
          <p className="text-sm text-zinc-400">Please add your Mapbox token to Vercel and redeploy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-zinc-950">
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        onViewStateChange={({ viewState: newViewState }) => {
          setViewState(newViewState as any);
          // Fetch new data when the map is panned or zoomed
          fetchBounds(newViewState as any);
        }}
        getTooltip={({ object }) => object && `${object.agency_name}\n${object.reason_for_stop}\nOutcome: ${object.outcome}`}
      >
        <Map
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        />
      </DeckGL>
    </div>
  );
}
