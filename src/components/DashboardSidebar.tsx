import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import type { MapFilters } from '@/app/page';

interface DashboardSidebarProps {
  data: any[];
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
  isMobile?: boolean;
}

export default function DashboardSidebar({ data, filters, onFilterChange, isMobile }: DashboardSidebarProps) {
  const metrics = useMemo(() => {
    let citations = 0;
    let warnings = 0;
    let searchesConducted = 0;
    let contrabandFound = 0;
    const violationCounts: Record<string, number> = {};

    data.forEach((stop) => {
      // Outcomes
      const outcome = (stop.outcome || '').toLowerCase();
      if (outcome.includes('citation')) citations++;
      if (outcome.includes('warning')) warnings++;

      // Searches (support boolean or string representations)
      const searchStr = String(stop.search_conducted).toLowerCase();
      if (stop.search_conducted === true || searchStr === 'true' || searchStr === 'y') searchesConducted++;
      
      const contrabandStr = String(stop.contraband_found).toLowerCase();
      if (stop.contraband_found === true || contrabandStr === 'true' || contrabandStr === 'y') contrabandFound++;

      // Violations
      const reason = stop.reason || stop.reason_for_stop || 'Unknown';
      violationCounts[reason] = (violationCounts[reason] || 0) + 1;
    });

    const strictnessIndex = warnings === 0 ? (citations > 0 ? 100 : 0) : ((citations / (citations + warnings)) * 100).toFixed(1);
    const searchHitRate = searchesConducted === 0 ? 0 : ((contrabandFound / searchesConducted) * 100).toFixed(1);

    const topViolations = Object.entries(violationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: data.length,
      citations,
      warnings,
      strictnessIndex,
      searchesConducted,
      contrabandFound,
      searchHitRate,
      topViolations
    };
  }, [data]);

  const updateFilter = (key: keyof MapFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => (v !== 'All' && v !== '' && v !== 'false'));

  return (
    <Card className={`flex flex-col border-r shadow-xl z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 ${isMobile ? 'h-full border-none rounded-none' : 'w-96 h-full'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold tracking-tight">Traffic Dashboard</CardTitle>
          {hasActiveFilters && <Badge variant="secondary" className="bg-primary/20 text-primary">Filtered</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {metrics.total.toLocaleString()} visible stops
        </p>
      </CardHeader>
      
      <Tabs defaultValue="metrics" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 mb-2">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
          </TabsList>
        </div>

        {/* METRICS TAB */}
        <TabsContent value="metrics" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-6">
              
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-medium leading-none">Strictness Index</h3>
                <p className="text-xs text-muted-foreground">Citation vs. Warning ratio</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-3xl font-bold text-red-500">{metrics.strictnessIndex}%</span>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{metrics.citations.toLocaleString()} Citations</p>
                    <p>{metrics.warnings.toLocaleString()} Warnings</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium leading-none">Top Violations</h3>
                <div className="h-48 mt-4 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.topViolations} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {metrics.topViolations.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium leading-none">Search Hit Rate</h3>
                <p className="text-xs text-muted-foreground">Contraband found vs. Searches conducted</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-3xl font-bold text-amber-500">{metrics.searchHitRate}%</span>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{metrics.contrabandFound.toLocaleString()} Found</p>
                    <p>{metrics.searchesConducted.toLocaleString()} Searches</p>
                  </div>
                </div>
              </div>

            </div>
          </ScrollArea>
        </TabsContent>

        {/* FILTERS TAB */}
        <TabsContent value="filters" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-6 pt-2">
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Department</label>
                <Select value={filters.department} onValueChange={(val) => updateFilter('department', val || 'All')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Departments</SelectItem>
                    <SelectItem value="Ohio State Highway Patrol">Ohio State Highway Patrol</SelectItem>
                    <SelectItem value="Columbus Police Department">Columbus Police Department</SelectItem>
                    <SelectItem value="Cincinnati Police Department">Cincinnati Police Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Year</label>
                <Select value={filters.year} onValueChange={(val) => updateFilter('year', val || 'All')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Years</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2019">2019</SelectItem>
                    <SelectItem value="2018">2018</SelectItem>
                    <SelectItem value="2017">2017</SelectItem>
                    <SelectItem value="2016">2016</SelectItem>
                    <SelectItem value="2015">2015</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Outcome</label>
                <Select value={filters.outcome} onValueChange={(val) => updateFilter('outcome', val || 'All')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Outcomes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Outcomes</SelectItem>
                    <SelectItem value="Citation">Citation</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                    <SelectItem value="Arrest">Arrest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Reason for Stop</label>
                <Select value={filters.reason} onValueChange={(val) => updateFilter('reason', val || 'All')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Reasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Reasons</SelectItem>
                    <SelectItem value="Speeding">Speeding</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Moving Violation">Moving Violation</SelectItem>
                    <SelectItem value="Registration">Registration</SelectItem>
                    <SelectItem value="Safe Movement">Safe Movement</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Officer ID</label>
                <Input placeholder="Search by Officer ID Hash..." value={filters.officer_id} onChange={(e) => updateFilter('officer_id', e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Subject Race</label>
                <Select value={filters.subject_race} onValueChange={(val) => updateFilter('subject_race', val || 'All')}>
                  <SelectTrigger><SelectValue placeholder="All Races" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Races</SelectItem>
                    <SelectItem value="W">White</SelectItem>
                    <SelectItem value="B">Black</SelectItem>
                    <SelectItem value="H">Hispanic</SelectItem>
                    <SelectItem value="A">Asian</SelectItem>
                    <SelectItem value="O">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Subject Sex</label>
                <Select value={filters.subject_sex} onValueChange={(val) => updateFilter('subject_sex', val || 'All')}>
                  <SelectTrigger><SelectValue placeholder="All Genders" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Genders</SelectItem>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">County</label>
                <Input placeholder="Filter by County..." value={filters.county_name} onChange={(e) => updateFilter('county_name', e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Search Basis</label>
                <Select value={filters.search_basis} onValueChange={(val) => updateFilter('search_basis', val || 'All')}>
                  <SelectTrigger><SelectValue placeholder="All Search Basis" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Search Basis</SelectItem>
                    <SelectItem value="Probable Cause">Probable Cause</SelectItem>
                    <SelectItem value="Consent">Consent</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Contraband Found</label>
                <Select value={filters.contraband_drugs} onValueChange={(val) => updateFilter('contraband_drugs', val || 'All')}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Any</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Location Details</label>
                <Input placeholder="Search location text..." value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} />
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => onFilterChange({ department: 'All', year: 'All', outcome: 'All', reason: 'All', officer_id: '', subject_race: 'All', subject_sex: 'All', county_name: 'All', search_basis: 'All', violation: 'All', location: '', type: 'All', arrest_made: 'All', warning_issued: 'All', contraband_drugs: 'All' })}
              >
                Reset Filters
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
