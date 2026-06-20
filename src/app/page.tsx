"use client";

import { useState } from 'react';
import TrafficMap from '@/components/TrafficMap';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export type MapFilters = {
  department: string;
  year: string;
  outcome: string;
  reason: string;
  officer_id: string;
  subject_race: string;
  subject_sex: string;
  county_name: string;
  search_basis: string;
  violation: string;
  location: string;
  type: string;
  arrest_made: string;
  warning_issued: string;
  contraband_drugs: string;
};

export default function Home() {
  const [mapData, setMapData] = useState<any[]>([]);
  
  const [filters, setFilters] = useState<MapFilters>({
    department: 'All',
    year: 'All',
    outcome: 'All',
    reason: 'All',
    officer_id: '',
    subject_race: 'All',
    subject_sex: 'All',
    county_name: 'All',
    search_basis: 'All',
    violation: 'All',
    location: '',
    type: 'All',
    arrest_made: 'All',
    warning_issued: 'All',
    contraband_drugs: 'All'
  });

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block absolute top-0 left-0 h-full z-10 pointer-events-none p-4">
        <div className="pointer-events-auto h-full">
          <DashboardSidebar data={mapData} filters={filters} onFilterChange={setFilters} />
        </div>
      </div>

      {/* Mobile Menu Button & Sheet */}
      <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-full shadow-2xl px-6">
            <Menu className="mr-2 h-5 w-5" />
            Dashboard
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl border-t-0 border-zinc-800 bg-background/95 backdrop-blur-md">
            <DashboardSidebar data={mapData} filters={filters} onFilterChange={setFilters} isMobile />
          </SheetContent>
        </Sheet>
      </div>

      {/* Map Background */}
      <div className="flex-1 relative">
        <TrafficMap onDataLoad={setMapData} filters={filters} />
      </div>
    </main>
  );
}
