"use client";

import { useMemo, useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "WEEKLY" | "MONTHLY" | "YEARLY" | "ALL";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: "WEEKLY",  label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "YEARLY",  label: "Yearly" },
    { value: "ALL",     label: "All Time" },
];

// ─── Chart config ─────────────────────────────────────────────────────────────

const chartConfig = {
    metric: {
        label: "Metric",
        color: "var(--primary)",
    },
} satisfies ChartConfig;

// ─── Date utilities ───────────────────────────────────────────────────────────

function dateStr(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split("T")[0];
}

function weekStart(ds: string): string {
    if (!ds || ds.length < 10) return "";
    const d = new Date(ds + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
}

function monthKey(ds: string): string { return ds.substring(0, 7); }

function bucketLabel(key: string, period: Period): string {
    if (!key) return "";
    if (period === "WEEKLY") {
        const d = new Date(key + "T00:00:00");
        return isNaN(d.getTime()) ? key : d.toLocaleDateString("en-US", { weekday: "short" });
    }
    if (period === "MONTHLY") {
        const d = new Date(key + "T00:00:00");
        return isNaN(d.getTime()) ? key : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    const [y, m] = key.split("-");
    if (!y || !m) return key;
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
        "en-US",
        period === "YEARLY" ? { month: "short" } : { month: "short", year: "2-digit" }
    );
}

function bucketize(
    entries: { dateString: string; value: number }[],
    period: Period,
    allDates: string[]
): { day: string; value: number }[] {
    const validEntries = entries.filter(
        (e) => e.dateString && e.dateString.length >= 10 && !isNaN(new Date(e.dateString + "T00:00:00").getTime())
    );
    const map = new Map<string, number>();

    if (period === "WEEKLY") {
        for (let i = 6; i >= 0; i--) map.set(dateStr(i), 0);
        for (const e of validEntries) {
            if (map.has(e.dateString)) map.set(e.dateString, (map.get(e.dateString) ?? 0) + e.value);
        }
    } else if (period === "MONTHLY") {
        for (let i = 29; i >= 0; i--) {
            const wk = weekStart(dateStr(i));
            if (wk && !map.has(wk)) map.set(wk, 0);
        }
        for (const e of validEntries) {
            const wk = weekStart(e.dateString);
            if (wk && map.has(wk)) map.set(wk, (map.get(wk) ?? 0) + e.value);
        }
    } else if (period === "YEARLY") {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
            map.set(d.toISOString().substring(0, 7), 0);
        }
        for (const e of validEntries) {
            const mk = monthKey(e.dateString);
            if (map.has(mk)) map.set(mk, (map.get(mk) ?? 0) + e.value);
        }
    } else {
        const validAll = allDates.filter((d) => d && d.length >= 7);
        for (const mk of Array.from(new Set(validAll.map(monthKey))).sort()) map.set(mk, 0);
        for (const e of validEntries) {
            const mk = monthKey(e.dateString);
            if (map.has(mk)) map.set(mk, (map.get(mk) ?? 0) + e.value);
        }
    }

    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({ day: bucketLabel(key, period), value }));
}

function withinPeriod(ds: string, period: Period): boolean {
    if (!ds || ds.length < 10) return false;
    if (period === "ALL")     return true;
    if (period === "WEEKLY")  return ds >= dateStr(6);
    if (period === "MONTHLY") return ds >= dateStr(29);
    if (period === "YEARLY")  return ds >= dateStr(364);
    return true;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingsKPIs({ bookings = [] }: { bookings: any[] }) {

    const [period, setPeriod] = useState<Period>("WEEKLY");

    const allBookingDates = useMemo(
        () => bookings.map((b) => b.created_at?.split("T")[0]).filter(Boolean) as string[],
        [bookings]
    );

    // ── 1. Bookings Volume (period-filtered) ──────────────────────────────────
    const { volumeData, totalVolume } = useMemo(() => {
        const eligible = bookings
            .filter((b) => withinPeriod(b.created_at?.split("T")[0] ?? "", period))
            .map((b) => ({ dateString: b.created_at?.split("T")[0] ?? "", value: 1 }));

        const total = eligible.length;
        const data  = bucketize(eligible, period, allBookingDates);

        return { volumeData: data, totalVolume: total };
    }, [bookings, period, allBookingDates]);

    const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "";

    // ── 2. Active & Upcoming (always next 7 days — period-independent) ────────
    const { upcomingData, totalUpcoming } = useMemo(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        const upcomingBookings = bookings.filter(
            (b) =>
                (b.status === "approved" || b.status === "scheduled") &&
                b.booking_slots?.[0]?.date >= todayStr
        );

        const next7Days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dStr = d.toISOString().split("T")[0];
            next7Days.push({
                day: d.toLocaleDateString("en-US", { weekday: "short" }),
                value: upcomingBookings.filter((b) => b.booking_slots?.[0]?.date === dStr).length,
            });
        }

        return { upcomingData: next7Days, totalUpcoming: upcomingBookings.length };
    }, [bookings]);

    // ── 3. Pending Approvals (always all-time count, last-7-day chart) ────────
    const { pendingData, totalPending } = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const ds = dateStr(i);
            const count = bookings.filter(
                (b) => b.status === "pending" && b.created_at?.startsWith(ds)
            ).length;
            data.push({
                day: new Date(ds + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
                value: count,
            });
        }
        return {
            pendingData: data,
            totalPending: bookings.filter((b) => b.status === "pending").length,
        };
    }, [bookings]);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 mb-6">

            {/* Card 1: Bookings Volume */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Bookings Volume
                        </CardTitle>
                        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                            <SelectTrigger className="h-7 w-[110px] text-xs px-2 py-0">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                {PERIOD_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-3xl font-bold">{totalVolume}</div>
                    <p className="text-xs text-muted-foreground">
                        {periodLabel} · Total reservations made
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={volumeData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="white"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: "var(--primary)" }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Active & Upcoming */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active &amp; Upcoming
                    </CardTitle>
                    <div className="text-3xl font-bold">{totalUpcoming}</div>
                    <p className="text-xs text-muted-foreground">Scheduled for today &amp; future</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-70 hover:opacity-100 transition-opacity">
                        <ChartContainer
                            config={{ metric: { label: "Upcoming", color: "var(--primary-foreground)" } }}
                            className="h-[60px] w-full aspect-auto"
                        >
                            <LineChart data={upcomingData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="text-foreground" />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="white"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: "white" }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Pending Approvals */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
                    <div className="text-3xl font-bold">{totalPending}</div>
                    <p className="text-xs text-muted-foreground">Require admin review</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={pendingData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="white"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: "var(--primary)" }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
