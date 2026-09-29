"use client";

import { useMemo } from "react";
import { Line, LineChart, YAxis } from "recharts";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
    metric: {
        label: "Metric",
        color: "hsl(var(--secondary))",
    },
} satisfies ChartConfig;

// Helper to get the last 30 days as an array of date strings and labels
const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            dateString: d.toISOString().split("T")[0],
            label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), 
        });
    }
    return days;
};

export function CourtKPIs({ courts = [], bookings = [] }: { courts: any[], bookings: any[] }) {
    
    const last30Days = useMemo(() => getLast30Days(), []);

    // 1. Total Active Courts
    const { activeCourtsCount, activeData } = useMemo(() => {
        const count = courts.filter(c => c.status === 'active').length;
        // Flat line representing the current count for the chart
        const data = last30Days.map(day => ({ day: day.label, value: count }));
        return { activeCourtsCount: count, activeData: data };
    }, [courts, last30Days]);

    // 2. Courts in Maintenance
    const { maintenanceCourtsCount, maintenanceData } = useMemo(() => {
        const count = courts.filter(c => c.status === 'maintenance').length;
        // Flat line representing the current count for the chart
        const data = last30Days.map(day => ({ day: day.label, value: count }));
        return { maintenanceCourtsCount: count, maintenanceData: data };
    }, [courts, last30Days]);

    // 3. Most Popular Court (Last 30 Days)
    const { popularCourtName, popularCourtData } = useMemo(() => {
        if (!bookings.length || !courts.length) return { popularCourtName: "N/A", popularCourtData: last30Days.map(d => ({ day: d.label, value: 0 })) };

        // Count bookings per court over the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffStr = thirtyDaysAgo.toISOString().split("T")[0];

        const recentBookings = bookings.filter(b => 
            (b.status === 'completed' || b.status === 'approved') && 
            b.booking_slots?.[0]?.date >= cutoffStr
        );

        const courtCounts: Record<number, number> = {};
        recentBookings.forEach(b => {
            const cId = b.court_id || b.booking_slots?.[0]?.court_id;
            if (cId) {
                courtCounts[cId] = (courtCounts[cId] || 0) + 1;
            }
        });

        // Find max
        let bestCourtId = null;
        let maxCount = -1;
        for (const [cId, count] of Object.entries(courtCounts)) {
            if (count > maxCount) {
                maxCount = count;
                bestCourtId = Number(cId);
            }
        }

        const bestCourt = courts.find(c => c.court_id === bestCourtId);
        const bestCourtName = bestCourt ? bestCourt.court_name : (bestCourtId ? `Court ID ${bestCourtId}` : "No Bookings");

        // Generate trend line for this specific court over last 30 days
        const data = last30Days.map(day => {
            const dailyCount = recentBookings.filter(b => 
                (b.court_id === bestCourtId || b.booking_slots?.[0]?.court_id === bestCourtId) && 
                b.booking_slots?.[0]?.date === day.dateString
            ).length;
            return { day: day.label, value: dailyCount };
        });

        return { popularCourtName: bestCourtName, popularCourtData: data };
    }, [courts, bookings, last30Days]);

    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 mb-6">
            {/* Card 1: Active Courts */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Courts</CardTitle>
                    <div className="text-3xl font-bold">{activeCourtsCount}</div>
                    <p className="text-xs text-muted-foreground">Currently operational</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={activeData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line type="monotone" dataKey="value" stroke="white" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Courts in Maintenance */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">In Maintenance</CardTitle>
                    <div className="text-3xl font-bold">{maintenanceCourtsCount}</div>
                    <p className="text-xs text-muted-foreground">Temporarily unavailable</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={maintenanceData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line type="monotone" dataKey="value" stroke="white" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Most Popular Court (INVERTED STYLE) */}
            <Card className="overflow-hidden bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-90 text-primary-foreground">Most Popular Court (30d)</CardTitle>
                    <div className="text-3xl font-bold truncate">{popularCourtName}</div>
                    <p className="text-xs opacity-80 text-primary-foreground">Highest booking volume</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-70 hover:opacity-100 transition-opacity">
                        <ChartContainer config={{ metric: { label: "Bookings", color: "hsl(var(--primary-foreground))" } }} className="h-[60px] w-full aspect-auto">
                            <LineChart data={popularCourtData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="text-foreground" />} />
                                <Line type="monotone" dataKey="value" stroke="black" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
