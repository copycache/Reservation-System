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
        color: "hsl(var(--secondary))",
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

export function CourtKPIs({ courts = [], bookings = [] }: { courts: any[]; bookings: any[] }) {

    const [period, setPeriod] = useState<Period>("WEEKLY");

    // ── 1. Active Courts (always current — no period filter needed) ───────────
    const { activeCourtsCount, activeData } = useMemo(() => {
        const count = courts.filter((c) => c.status === "active").length;
        const data  = Array.from({ length: 7 }, (_, i) => ({
            day: new Date(dateStr(6 - i) + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
            value: count,
        }));
        return { activeCourtsCount: count, activeData: data };
    }, [courts]);

    // ── 2. Courts in Maintenance (always current) ─────────────────────────────
    const { maintenanceCourtsCount, maintenanceData } = useMemo(() => {
        const count = courts.filter((c) => c.status === "maintenance").length;
        const data  = Array.from({ length: 7 }, (_, i) => ({
            day: new Date(dateStr(6 - i) + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
            value: count,
        }));
        return { maintenanceCourtsCount: count, maintenanceData: data };
    }, [courts]);

    // ── 3. Most Popular Court Type (period-filtered) ──────────────────────────
    const { popularCourtName, popularCourtData } = useMemo(() => {
        const fallbackData = bucketize([], period, []);

        if (!bookings.length) {
            return { popularCourtName: "N/A", popularCourtData: fallbackData };
        }

        // Filter bookings within the selected period using slot date
        const eligible = bookings.filter(
            (b) =>
                (b.status === "completed" || b.status === "approved") &&
                withinPeriod(b.booking_slots?.[0]?.date ?? "", period)
        );

        if (!eligible.length) {
            return { popularCourtName: "No Bookings", popularCourtData: fallbackData };
        }

        // Count per court TYPE (from the eager-loaded court relation on the slot)
        const typeCounts: Record<string, number> = {};
        for (const b of eligible) {
            // Try slot's eager-loaded court first, fallback to courts prop lookup
            const slotCourtType: string | undefined =
                b.booking_slots?.[0]?.court?.type;
            const courtId = b.court_id ?? b.booking_slots?.[0]?.court_id;
            const fallbackType = courts.find((c: any) => c.court_id === courtId)?.type;
            const courtType = slotCourtType ?? fallbackType;
            if (courtType) {
                typeCounts[courtType] = (typeCounts[courtType] ?? 0) + 1;
            }
        }

        if (!Object.keys(typeCounts).length) {
            return { popularCourtName: "No Data", popularCourtData: fallbackData };
        }

        // Find winning court type
        let bestType = "";
        let maxCount = -1;
        for (const [type, count] of Object.entries(typeCounts)) {
            if (count > maxCount) { maxCount = count; bestType = type; }
        }

        // Capitalize for display
        const displayName = bestType
            ? bestType.charAt(0).toUpperCase() + bestType.slice(1)
            : "No Bookings";

        // Trend line for winning court type bucketed by period
        const entries = eligible
            .filter((b) => {
                const slotType = b.booking_slots?.[0]?.court?.type;
                const courtId  = b.court_id ?? b.booking_slots?.[0]?.court_id;
                const fallback = courts.find((c: any) => c.court_id === courtId)?.type;
                return (slotType ?? fallback) === bestType;
            })
            .map((b) => ({ dateString: b.booking_slots?.[0]?.date ?? "", value: 1 }));

        const allSlotDates = eligible.map((b) => b.booking_slots?.[0]?.date ?? "").filter(Boolean);
        const data = bucketize(entries, period, allSlotDates);

        return { popularCourtName: displayName, popularCourtData: data };
    }, [courts, bookings, period]);

    const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "";

    // ─── Render ───────────────────────────────────────────────────────────────
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
                                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
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
                                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
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
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-medium opacity-90 text-primary-foreground">
                            Most Popular Court
                        </CardTitle>
                        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                            <SelectTrigger className="h-7 w-[110px] text-xs px-2 py-0 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">
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
                    <div className="text-3xl font-bold truncate">{popularCourtName}</div>
                    <p className="text-xs opacity-80 text-primary-foreground">
                        {periodLabel} · Highest booking volume
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-70 hover:opacity-100 transition-opacity">
                        <ChartContainer
                            config={{ metric: { label: "Bookings", color: "hsl(var(--primary-foreground))" } }}
                            className="h-[60px] w-full aspect-auto"
                        >
                            <LineChart data={popularCourtData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="text-foreground" />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="black"
                                    strokeWidth={3}
                                    dot={false}
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
