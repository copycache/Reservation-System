"use client";

import { useMemo } from "react";
import { Line, LineChart, YAxis } from "recharts"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    metric: {
        label: "Metric",
        color: "var(--primary)",
    },
} satisfies ChartConfig;

export function PricingKPIs({ pricings }: { pricings: any[] }) {
    // 1. Total Active Rules
    const activeRulesCount = useMemo(() => {
    return pricings.filter(p => p.status === 'active').length;
    }, [pricings]);

    // Graph data for active rules (Active rules count by day of week)
    const activeRulesByDayData = useMemo(() => {
        const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        return days.map(day => {
            const count = pricings.filter(p => 
                p.status === 'active' && 
                p.pricing_rule_schedules?.some((s: any) => s.day_of_week === day)
            ).length;
            return { day: day.charAt(0).toUpperCase() + day.slice(1), rules: count };
        });
    }, [pricings]);

    // 2. Average Hourly Rate (Active)
    const activePricings = pricings.filter(p => p.status === 'active');
    const avgHourlyRate = useMemo(() => {
        if (activePricings.length === 0) return 0;
        const total = activePricings.reduce((sum, p) => sum + Number(p.price), 0);
        return total / activePricings.length;
    }, [activePricings]);

    // Graph data for Avg Rate by day
    const avgRateByDayData = useMemo(() => {
        const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        return days.map(day => {
            const dayRules = activePricings.filter(p => 
                p.pricing_rule_schedules?.some((s: any) => s.day_of_week === day)
            );
            const avg = dayRules.length > 0 
                ? dayRules.reduce((sum, p) => sum + Number(p.price), 0) / dayRules.length 
                : 0;
            return { day: day.charAt(0).toUpperCase() + day.slice(1), rate: avg };
        });
    }, [activePricings]);

    // 3. Scheduled Hours/Week (Sum of all scheduled hours across active rules)
    const totalWeeklyHours = useMemo(() => {
        let totalHours = 0;
        activePricings.forEach(p => {
            (p.pricing_rule_schedules || []).forEach((s: any) => {
                const start = new Date(`1970-01-01T${s.start_time}`);
                const end = new Date(`1970-01-01T${s.end_time}`);
                let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                if (diff < 0) diff += 24; 
                totalHours += diff;
            });
        });
        return totalHours;
    }, [activePricings]);

    const hoursByDayData = useMemo(() => {
        const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        return days.map(day => {
            let dayHours = 0;
            activePricings.forEach(p => {
                (p.pricing_rule_schedules || []).filter((s: any) => s.day_of_week === day).forEach((s: any) => {
                    const start = new Date(`1970-01-01T${s.start_time}`);
                    const end = new Date(`1970-01-01T${s.end_time}`);
                    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    if (diff < 0) diff += 24;
                    dayHours += diff;
                });
            });
            return { day: day.charAt(0).toUpperCase() + day.slice(1), hours: dayHours };
        });
    }, [activePricings]);

    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {/* Card 1: Total Active Rules */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Rules</CardTitle>
                    <div className="text-3xl font-bold">{activeRulesCount}</div>
                    <p className="text-xs text-muted-foreground">Out of {pricings.length} total rules</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={activeRulesByDayData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line type="monotone" dataKey="rules" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Average Hourly Rate */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Hourly Rate</CardTitle>
                    <div className="text-3xl font-bold">₱{avgHourlyRate.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Across active rules</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={avgRateByDayData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Scheduled Hours/Week */}
            <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-90 text-primary-foreground">Scheduled Hours/Week</CardTitle>
                    <div className="text-3xl font-bold">{totalWeeklyHours.toFixed(1)} hrs</div>
                    <p className="text-xs opacity-80 text-primary-foreground">Total availability</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-70 hover:opacity-100 transition-opacity">
                        <ChartContainer config={{ metric: { label: "Hours", color: "var(--primary-foreground)" } }} className="h-[60px] w-full aspect-auto">
                            <LineChart data={hoursByDayData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="text-foreground" />} />
                                <Line type="monotone" dataKey="hours" stroke="var(--primary-foreground)" strokeWidth={3} dot={{ r: 3, fill: "var(--primary-foreground)" }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}