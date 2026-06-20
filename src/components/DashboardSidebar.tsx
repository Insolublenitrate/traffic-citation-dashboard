import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardSidebarProps {
  data: any[];
}

export default function DashboardSidebar({ data }: DashboardSidebarProps) {
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

      // Searches
      if (stop.search_conducted) searchesConducted++;
      if (stop.contraband_found) contrabandFound++;

      // Violations
      const reason = stop.reason_for_stop || 'Unknown';
      violationCounts[reason] = (violationCounts[reason] || 0) + 1;
    });

    const strictnessIndex = warnings === 0 ? (citations > 0 ? 100 : 0) : ((citations / (citations + warnings)) * 100).toFixed(1);
    const searchHitRate = searchesConducted === 0 ? 0 : ((contrabandFound / searchesConducted) * 100).toFixed(1);

    // Top violations sorted
    const topViolations = Object.entries(violationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

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

  return (
    <Card className="w-96 h-full flex flex-col border-r shadow-xl z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Traffic Dashboard</CardTitle>
        <p className="text-sm text-muted-foreground">
          Showing {metrics.total.toLocaleString()} visible stops
        </p>
      </CardHeader>
      
      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="space-y-6">
          
          {/* Strictness Index */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium leading-none">Strictness Index</h3>
            <p className="text-xs text-muted-foreground">Citation vs. Warning ratio</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-bold text-red-500">{metrics.strictnessIndex}%</span>
              <div className="text-right text-xs text-muted-foreground">
                <p>{metrics.citations} Citations</p>
                <p>{metrics.warnings} Warnings</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Most Common Violations */}
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

          {/* Search Hit Rates */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium leading-none">Search Hit Rate</h3>
            <p className="text-xs text-muted-foreground">Contraband found vs. Searches conducted</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-bold text-amber-500">{metrics.searchHitRate}%</span>
              <div className="text-right text-xs text-muted-foreground">
                <p>{metrics.contrabandFound} Found</p>
                <p>{metrics.searchesConducted} Searches</p>
              </div>
            </div>
          </div>

        </div>
      </ScrollArea>
    </Card>
  );
}
