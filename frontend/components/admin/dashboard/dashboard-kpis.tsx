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

export function DashboardKPIs({ bookings = [] }: { bookings: any[] }) {
    
    const last7Days = useMemo(() => getLast7Days(), []);

    // 1. Total Revenue (Last 7 Days)
    const { revenueData, totalRevenue } = useMemo(() => {
        let total = 0;
        const data = last7Days.map((day) => {
            const dailyBookings = bookings.filter(b => 
                (b.status === 'completed' || b.status === 'approved') && 
                b.created_at?.startsWith(day.dateString)
            );
            
            const dailyRevenue = dailyBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
            total += dailyRevenue;
            
            return { day: day.label, value: dailyRevenue };
        });
        return { revenueData: data, totalRevenue: total };
    }, [bookings, last7Days]);

    // 2. Cancellation Rate
    const { cancellationData, cancelRate } = useMemo(() => {
        let totalCancellations = 0;
        const data = last7Days.map((day) => {
            const dailyCancellations = bookings.filter(b => 
                b.status === 'cancelled' && 
                b.created_at?.startsWith(day.dateString)
            ).length;
            totalCancellations += dailyCancellations;
            return { day: day.label, value: dailyCancellations };
        });

        const rate = bookings.length ? ((bookings.filter(b => b.status === 'cancelled').length / bookings.length) * 100) : 0;
        
        return { cancellationData: data, cancelRate: rate };
    }, [bookings, last7Days]);

    // 3. Court Utilization Rate
    const { utilizationData, totalUtilization } = useMemo(() => {
        const AVAILABLE_HOURS_PER_DAY = 12; 
        const TOTAL_AVAILABLE_HOURS = AVAILABLE_HOURS_PER_DAY; 

        let avgUtilization = 0;
        const data = last7Days.map((day) => {
            const dailyBookings = bookings.filter(b => 
                (b.status === 'completed' || b.status === 'approved') && 
                b.booking_slots?.[0]?.date === day.dateString
            );
            
            const hoursBooked = dailyBookings.reduce((sum, b) => {
                let bookingHours = 0;
                b.booking_slots?.forEach((slot: any) => {
                    const start = new Date(`1970-01-01T${slot.start_time}`);
                    const end = new Date(`1970-01-01T${slot.end_time}`);
                    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    if (diff < 0) diff += 24;
                    bookingHours += diff;
                });
                return sum + bookingHours;
            }, 0);
            
            let percent = (hoursBooked / TOTAL_AVAILABLE_HOURS) * 100;
            if(percent > 100) percent = 100; 

            avgUtilization += percent;
            return { day: day.label, value: percent };
        });

        return { 
            utilizationData: data, 
            totalUtilization: avgUtilization / 7
        };
    }, [bookings, last7Days]);

    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 mb-6">
            
            {/* Card 1: Total Revenue */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue (7d)</CardTitle>
                    <div className="text-3xl font-bold">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">From confirmed bookings</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line type="monotone" dataKey="value" stroke="white" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--secondary))" }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Cancellation Rate */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cancellation Rate</CardTitle>
                    <div className="text-3xl font-bold">{cancelRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Of all bookings</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={cancellationData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line type="monotone" dataKey="value" stroke="white" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--secondary))" }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Court Utilization (INVERTED STYLE) */}
            <Card className="overflow-hidden bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-90 text-primary-foreground">Avg Utilization (7d)</CardTitle>
                    <div className="text-3xl font-bold">{totalUtilization.toFixed(1)}%</div>
                    <p className="text-xs opacity-80 text-primary-foreground">Booked vs Available hours</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-70 hover:opacity-100 transition-opacity">
                        <ChartContainer config={{ metric: { label: "Utilization", color: "hsl(var(--primary-foreground))" } }} className="h-[60px] w-full aspect-auto">
                            <LineChart data={utilizationData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="text-foreground" />} />
                                <Line type="monotone" dataKey="value" stroke="black" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--primary-foreground))" }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
