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

/** YYYY-MM-DD string for a date offset by `offsetDays` from today */
function dateStr(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split("T")[0];
}

/** Start-of-week (Monday) for a given YYYY-MM-DD date string */
function weekStart(ds: string): string {
    if (!ds || ds.length < 10) return "";
    const d = new Date(ds + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    const day = d.getDay(); // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
}

/** YYYY-MM prefix for a given YYYY-MM-DD date string */
function monthKey(ds: string): string {
    return ds.substring(0, 7);
}

/** YYYY prefix for a given YYYY-MM-DD date string */
function yearKey(ds: string): string {
    return ds.substring(0, 4);
}

/** Human-readable label for a bucket key depending on period */
function bucketLabel(key: string, period: Period): string {
    if (!key) return "";
    if (period === "WEEKLY") {
        // key is YYYY-MM-DD → weekday short
        const d = new Date(key + "T00:00:00");
        return isNaN(d.getTime()) ? key : d.toLocaleDateString("en-US", { weekday: "short" });
    }
    if (period === "MONTHLY") {
        // key is week-start YYYY-MM-DD → "MMM D"
        const d = new Date(key + "T00:00:00");
        return isNaN(d.getTime()) ? key : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    if (period === "YEARLY") {
        // key is YYYY-MM → "MMM"
        const [y, m] = key.split("-");
        if (!y || !m) return key;
        return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short" });
    }
    // ALL → key is YYYY-MM → "MMM YY"
    const [y, m] = key.split("-");
    if (!y || !m) return key;
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/**
 * Given a list of { dateString, value } entries and a period,
 * bucket them and return sorted chart-ready array { day, value }[].
 */
function bucketize(
    entries: { dateString: string; value: number }[], // entries with empty dateString are ignored
    period: Period,
    allDates: string[]          // used to determine range for ALL
): { day: string; value: number }[] {
    // Drop any entries with missing/invalid dateStrings to avoid RangeError
    const validEntries = entries.filter(
        (e) => e.dateString && e.dateString.length >= 10 && !isNaN(new Date(e.dateString + "T00:00:00").getTime())
    );
    const map = new Map<string, number>();

    if (period === "WEEKLY") {
        // One bucket per day for last 7 days
        for (let i = 6; i >= 0; i--) {
            const ds = dateStr(i);
            map.set(ds, 0);
        }
        for (const e of validEntries) {
            if (map.has(e.dateString)) {
                map.set(e.dateString, (map.get(e.dateString) ?? 0) + e.value);
            }
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => ({ day: bucketLabel(key, period), value }));
    }

    if (period === "MONTHLY") {
        // One bucket per week (Mon-Sun) for last 30 days
        for (let i = 29; i >= 0; i--) {
            const ds = dateStr(i);
            const wk = weekStart(ds);
            if (wk && !map.has(wk)) map.set(wk, 0);
        }
        for (const e of validEntries) {
            const wk = weekStart(e.dateString);
            if (wk && map.has(wk)) {
                map.set(wk, (map.get(wk) ?? 0) + e.value);
            }
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => ({ day: bucketLabel(key, period), value }));
    }

    if (period === "YEARLY") {
        // One bucket per month for last 12 months
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - i);
            const mk = d.toISOString().substring(0, 7);
            map.set(mk, 0);
        }
        for (const e of validEntries) {
            const mk = monthKey(e.dateString);
            if (map.has(mk)) {
                map.set(mk, (map.get(mk) ?? 0) + e.value);
            }
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => ({ day: bucketLabel(key, "YEARLY"), value }));
    }

    // ALL — one bucket per month across all available dates
    const validAllDates = allDates.filter((d) => d && d.length >= 7);
    const allMonths = Array.from(new Set(validAllDates.map(monthKey))).sort();
    for (const mk of allMonths) map.set(mk, 0);
    for (const e of validEntries) {
        const mk = monthKey(e.dateString);
        if (map.has(mk)) {
            map.set(mk, (map.get(mk) ?? 0) + e.value);
        }
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({ day: bucketLabel(key, "ALL"), value }));
}

/** Filter bookings to those within the selected period */
function withinPeriod(dateString: string, period: Period): boolean {
    if (!dateString || dateString.length < 10) return false; // guard: skip records with no date
    if (period === "ALL") return true;
    if (period === "WEEKLY")  return dateString >= dateStr(6);
    if (period === "MONTHLY") return dateString >= dateStr(29);
    if (period === "YEARLY")  return dateString >= dateStr(364);
    return true;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardKPIs({ bookings = [] }: { bookings: any[] }) {

    // Shared period for Revenue + Utilization
    const [period, setPeriod] = useState<Period>("WEEKLY");

    // All booking dates in dataset (for "ALL" range)
    const allBookingDates = useMemo(
        () =>
            bookings
                .map((b) => b.created_at?.split("T")[0])
                .filter(Boolean) as string[],
        [bookings]
    );

    // ── 1. Total Revenue ──────────────────────────────────────────────────────
    const { revenueData, totalRevenue } = useMemo(() => {
        const eligible = bookings
            .filter(
                (b) =>
                    (b.status === "completed" || b.status === "approved") &&
                    withinPeriod(b.created_at?.split("T")[0] ?? "", period)
            )
            .map((b) => ({
                dateString: b.created_at?.split("T")[0] ?? "",
                value: Number(b.total_amount || 0),
            }));

        const total = eligible.reduce((s, e) => s + e.value, 0);
        const data  = bucketize(eligible, period, allBookingDates);

        return { revenueData: data, totalRevenue: total };
    }, [bookings, period, allBookingDates]);

    // ── 2. Cancellation Rate (always all-time, not filtered by period) ────────
    const { cancellationData, cancelRate } = useMemo(() => {
        // Keep chart as last 7 days for a consistent at-a-glance view
        const last7: { dateString: string; value: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const ds = dateStr(i);
            const count = bookings.filter(
                (b) => b.status === "cancelled" && b.created_at?.startsWith(ds)
            ).length;
            last7.push({ dateString: ds, value: count });
        }

        const data = last7.map((e) => ({
            day: new Date(e.dateString + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
            value: e.value,
        }));

        const rate = bookings.length
            ? (bookings.filter((b) => b.status === "cancelled").length / bookings.length) * 100
            : 0;

        return { cancellationData: data, cancelRate: rate };
    }, [bookings]);

    // ── 3. Court Utilization (shares the same period filter) ─────────────────
    const { utilizationData, totalUtilization } = useMemo(() => {
        const AVAILABLE_HOURS_PER_DAY = 12;

        // Build per-day hours-booked entries
        const eligible = bookings.filter(
            (b) =>
                (b.status === "completed" || b.status === "approved") &&
                withinPeriod(b.booking_slots?.[0]?.date ?? "", period)
        );

        const dailyMap = new Map<string, number>();
        for (const b of eligible) {
            const slotDate: string = b.booking_slots?.[0]?.date ?? "";
            if (!slotDate) continue;
            let hours = 0;
            b.booking_slots?.forEach((slot: any) => {
                const start = new Date(`1970-01-01T${slot.start_time}`);
                const end   = new Date(`1970-01-01T${slot.end_time}`);
                let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                if (diff < 0) diff += 24;
                hours += diff;
            });
            dailyMap.set(slotDate, (dailyMap.get(slotDate) ?? 0) + hours);
        }

        // Convert to percent-of-day entries
        const entries: { dateString: string; value: number }[] = Array.from(
            dailyMap.entries()
        ).map(([ds, hrs]) => ({
            dateString: ds,
            value: Math.min((hrs / AVAILABLE_HOURS_PER_DAY) * 100, 100),
        }));

        const allSlotDates = Array.from(dailyMap.keys());
        const data = bucketize(entries, period, allSlotDates);

        // Average utilization across bucketed points
        const avg = data.length
            ? data.reduce((s, d) => s + d.value, 0) / data.length
            : 0;

        return { utilizationData: data, totalUtilization: avg };
    }, [bookings, period]);

    const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "";

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 mb-6">

            {/* Card 1: Total Revenue */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Revenue
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
                    <div className="text-3xl font-bold">
                        ₱{totalRevenue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {periodLabel} · From confirmed bookings
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-50 hover:opacity-100 transition-opacity">
                        <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
                            <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="white"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: "hsl(var(--secondary))" }}
                                    activeDot={{ r: 5 }}
                                />
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
                                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="white"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: "hsl(var(--secondary))" }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Avg Utilization — shares the same period dropdown */}
            <Card className="overflow-hidden bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-medium opacity-90 text-primary-foreground">
                            Avg Utilization
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
                    <div className="text-3xl font-bold">{totalUtilization.toFixed(1)}%</div>
                    <p className="text-xs opacity-80 text-primary-foreground">
                        {periodLabel} · Booked vs Available hours
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[60px] w-full mt-2 opacity-70 hover:opacity-100 transition-opacity">
                        <ChartContainer
                            config={{ metric: { label: "Utilization", color: "hsl(var(--primary-foreground))" } }}
                            className="h-[60px] w-full aspect-auto"
                        >
                            <LineChart data={utilizationData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="text-foreground" />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="black"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: "hsl(var(--primary-foreground))" }}
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
