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

// Helper to get the last 7 days as an array of date strings and labels
const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            dateString: d.toISOString().split("T")[0],
            label: d.toLocaleDateString("en-US", { weekday: "short" }), 
        });
    }
    return days;
};

export function BookingsKPIs({ bookings = [] }: { bookings: any[] }) {
    
    const last7Days = useMemo(() => getLast7Days(), []);

    // 2. Total Bookings Volume (Last 7 Days)
    const { volumeData, totalVolume } = useMemo(() => {
        let total = 0;
        const data = last7Days.map((day) => {
            const dailyCount = bookings.filter(b => b.created_at?.startsWith(day.dateString)).length;
            total += dailyCount;
            return { day: day.label, value: dailyCount };
        });
        return { volumeData: data, totalVolume: total };
    }, [bookings, last7Days]);

    // 3. Active & Upcoming Bookings
    const { upcomingData, totalUpcoming } = useMemo(() => {
        let total = 0;
        const todayStr = new Date().toISOString().split("T")[0];
        
        // Filter bookings scheduled for today or in the future
        const upcomingBookings = bookings.filter(b => 
            (b.status === 'approved' || b.status === 'scheduled') && 
            b.booking_slots?.[0]?.date >= todayStr
        );
        total = upcomingBookings.length;

        // Chart shows upcoming bookings distributed over the next 7 days
        const next7Days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dStr = d.toISOString().split("T")[0];
            const count = upcomingBookings.filter(b => b.booking_slots?.[0]?.date === dStr).length;
            next7Days.push({ 
                day: d.toLocaleDateString("en-US", { weekday: "short" }), 
                value: count 
            });
        }
        return { upcomingData: next7Days, totalUpcoming: total };
    }, [bookings]);

    // 4. Pending Approvals
    const { pendingData, totalPending } = useMemo(() => {
        let total = 0;
        const data = last7Days.map((day) => {
            // How many pending bookings were created on this day
            const dailyPending = bookings.filter(b => 
                b.status === 'pending' && 
                b.created_at?.startsWith(day.dateString)
            ).length;
            return { day: day.label, value: dailyPending };
        });
        
        // Total pending regardless of when they were created
        total = bookings.filter(b => b.status === 'pending').length;
        
        return { pendingData: data, totalPending: total };
    }, [bookings, last7Days]);

    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 mb-6">
            {/* ROW 1 */}
            
            {/* Card 2: Total Volume */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Bookings Volume (7d)</CardTitle>
                    <div className="text-3xl font-bold">{totalVolume}</div>
                    <p className="text-xs text-muted-foreground">Total reservations made</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={volumeData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line type="monotone" dataKey="value" stroke="white" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--secondary))" }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Upcoming Bookings (INVERTED STYLE) */}
            <Card className="overflow-hidden bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-90 text-primary-foreground">Active & Upcoming</CardTitle>
                    <div className="text-3xl font-bold">{totalUpcoming}</div>
                    <p className="text-xs opacity-80 text-primary-foreground">Scheduled for today & future</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-70 hover:opacity-100 transition-opacity">
                        <ChartContainer config={{ metric: { label: "Upcoming", color: "hsl(var(--primary-foreground))" } }} className="h-[60px] w-full aspect-auto">
                            <LineChart data={upcomingData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="text-foreground" />} />
                                <Line type="monotone" dataKey="value" stroke="black" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--primary-foreground))" }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Pending Approvals */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
                    <div className="text-3xl font-bold">{totalPending}</div>
                    <p className="text-xs text-muted-foreground">Require admin review</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={pendingData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line type="monotone" dataKey="value" stroke="white" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--secondary))" }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
