"use client";

import { useState } from 'react';
import TrafficMap from '@/components/TrafficMap';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function Home() {
  const [mapData, setMapData] = useState<any[]>([]);

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar Overlay */}
      <div className="absolute top-0 left-0 h-full z-10 pointer-events-none p-4">
        <div className="pointer-events-auto h-full">
          <DashboardSidebar data={mapData} />
        </div>
      </div>

      {/* Map Background */}
      <div className="flex-1 relative">
        <TrafficMap onDataLoad={setMapData} />
      </div>
    </main>
  );
}
