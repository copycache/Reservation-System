"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  CircleDollarSign,
  Clock3,
  Percent,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type Period = "WEEKLY" | "MONTHLY" | "YEARLY" | "ALL";
type Booking = {
  status?: string;
  created_at?: string;
  total_amount?: number | string;
  booking_slots?: { date?: string; start_time?: string; end_time?: string }[];
};

const PERIOD_OPTIONS = [
  { value: "WEEKLY" as Period, label: "Last 7 days", days: 7 },
  { value: "MONTHLY" as Period, label: "Last 30 days", days: 30 },
  { value: "YEARLY" as Period, label: "Last 12 months", days: 365 },
  { value: "ALL" as Period, label: "All time", days: 0 },
];
const chartConfig = {
  value: { label: "Bookings", color: "var(--primary)" },
  revenue: { label: "Revenue", color: "hsl(160 60% 38%)" },
} satisfies ChartConfig;
const dateOnly = (value?: string) => value?.slice(0, 10) ?? "";
const toDate = (value: string) => new Date(`${value}T00:00:00`);
const today = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};
const offsetDate = (days: number) => {
  const date = today();
  date.setDate(date.getDate() - days);
  return date;
};
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const isInRange = (value: string, start: Date, end: Date) =>
  value ? toDate(value) >= start && toDate(value) <= end : false;
const formatCurrency = (value: number) =>
  `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const percentChange = (current: number, previous: number) =>
  previous === 0
    ? current === 0
      ? 0
      : null
    : ((current - previous) / previous) * 100;

function hoursForBooking(booking: Booking) {
  return (booking.booking_slots ?? []).reduce((total, slot) => {
    if (!slot.start_time || !slot.end_time) return total;
    const start = new Date(`1970-01-01T${slot.start_time}`);
    const end = new Date(`1970-01-01T${slot.end_time}`);
    let hours = (end.getTime() - start.getTime()) / 3600000;
    if (hours < 0) hours += 24;
    return total + hours;
  }, 0);
}

function Trend({
  data,
  kind,
}: {
  data: { label: string; value: number }[];
  kind: "line" | "bar";
}) {
  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      {kind === "line" ? (
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={3}
            dot={{ r: 3, fill: "var(--primary)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      ) : (
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="value" fill="hsl(160 60% 38%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </ChartContainer>
  );
}

function Delta({
  value,
  inverse = false,
}: {
  value: number | null;
  inverse?: boolean;
}) {
  if (value === null) return null;
  const positive = inverse ? value <= 0 : value >= 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-emerald-600" : "text-rose-600"}`}
    >
      <Icon className="size-3.5" /> {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  detail,
  inverse,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  delta: number | null;
  detail: string;
  inverse?: boolean;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {value}
            </p>
          </div>
          <span className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t pt-3">
          {delta === null ? (
            <span className="text-xs text-muted-foreground">
              No comparison available
            </span>
          ) : (
            <>
              <Delta value={delta} inverse={inverse} />
              <span className="text-xs text-muted-foreground">{detail}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardKPIs({ bookings = [] }: { bookings: Booking[] }) {
  const [period, setPeriod] = useState<Period>("WEEKLY");
  const selected =
    PERIOD_OPTIONS.find((option) => option.value === period) ??
    PERIOD_OPTIONS[0];
  const analytics = useMemo(() => {
    const end = today();
    const start =
      period === "ALL" ? new Date(0) : offsetDate(selected.days - 1);
    const previousEnd =
      period === "ALL" ? new Date(0) : new Date(start.getTime() - 86400000);
    const previousStart =
      period === "ALL" ? new Date(0) : offsetDate(selected.days * 2 - 1);
    const completed = (booking: Booking) =>
      booking.status === "completed" || booking.status === "approved";
    const current = bookings.filter((booking) =>
      isInRange(dateOnly(booking.created_at), start, end),
    );
    const previous = bookings.filter(
      (booking) =>
        period !== "ALL" &&
        isInRange(dateOnly(booking.created_at), previousStart, previousEnd),
    );
    const revenue = (items: Booking[]) =>
      items
        .filter(completed)
        .reduce((sum, booking) => sum + Number(booking.total_amount ?? 0), 0);
    const averageHours = (items: Booking[]) => {
      const valid = items.filter(completed);
      return valid.length
        ? valid.reduce((sum, booking) => sum + hoursForBooking(booking), 0) /
            valid.length
        : 0;
    };
    const cancellationRate = (items: Booking[]) =>
      items.length
        ? (items.filter((booking) => booking.status === "cancelled").length /
            items.length) *
          100
        : 0;
    const utilization = Math.min((averageHours(current) / 12) * 100, 100);
    const previousUtilization = Math.min(
      (averageHours(previous) / 12) * 100,
      100,
    );
    const trendPoints =
      period === "WEEKLY" ? 7 : period === "MONTHLY" ? 30 : 12;
    const trend = Array.from({ length: trendPoints }, (_, index) => {
      const date =
        period === "YEARLY"
          ? new Date(
              end.getFullYear(),
              end.getMonth() - (trendPoints - index - 1),
              1,
            )
          : offsetDate(trendPoints - index - 1);
      const key =
        period === "YEARLY"
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          : dateKey(date);
      const items = bookings.filter((booking) =>
        period === "YEARLY"
          ? dateOnly(booking.created_at).startsWith(key)
          : dateOnly(booking.created_at) === key,
      );
      return {
        label:
          period === "YEARLY"
            ? date.toLocaleDateString("en-US", { month: "short" })
            : date.toLocaleDateString("en-US", { weekday: "short" }),
        value: items.filter(completed).length,
        revenue: revenue(items),
      };
    });
    return {
      current,
      previous,
      revenue: revenue(current),
      previousRevenue: revenue(previous),
      bookings: current.length,
      previousBookings: previous.length,
      cancelRate: cancellationRate(current),
      previousCancelRate: cancellationRate(previous),
      utilization,
      previousUtilization,
      trend,
      averageHours: averageHours(current),
      previousAverageHours: averageHours(previous),
    };
  }, [bookings, period, selected.days]);
  const delta = (current: number, previous: number) =>
    percentChange(current, previous);
  return (
    <section className="space-y-6" aria-label="Dashboard analytics">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Performance overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Court operations at a glance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirmed activity and booking health for the selected period.
          </p>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
        >
          <SelectTrigger className="w-full bg-background sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={CircleDollarSign}
          label="Revenue"
          value={formatCurrency(analytics.revenue)}
          delta={delta(analytics.revenue, analytics.previousRevenue)}
          detail="vs prior period"
        />
        <MetricCard
          icon={CalendarCheck}
          label="Confirmed bookings"
          value={analytics.bookings.toLocaleString()}
          delta={delta(analytics.bookings, analytics.previousBookings)}
          detail="vs prior period"
        />
        <MetricCard
          icon={Clock3}
          label="Avg. booking time"
          value={`${analytics.averageHours.toFixed(1)}h`}
          delta={delta(analytics.averageHours, analytics.previousAverageHours)}
          detail="per confirmed booking"
        />
        <MetricCard
          icon={Percent}
          label="Cancellation rate"
          value={`${analytics.cancelRate.toFixed(1)}%`}
          delta={delta(analytics.cancelRate, analytics.previousCancelRate)}
          detail="lower is better"
          inverse
        />
        <MetricCard
          icon={BarChart3}
          label="Avg. utilization"
          value={`${analytics.utilization.toFixed(1)}%`}
          delta={delta(analytics.utilization, analytics.previousUtilization)}
          detail="12h daily capacity"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex-row items-start justify-between space-y-0 border-b pb-4">
            <div>
              <CardTitle className="text-base">
                Confirmed booking trend
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Volume across the {selected.label.toLowerCase()}.
              </p>
            </div>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-5">
            <Trend data={analytics.trend} kind="line" />
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex-row items-start justify-between space-y-0 border-b pb-4">
            <div>
              <CardTitle className="text-base">Revenue pulse</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed and approved booking value.
              </p>
            </div>
            <CircleDollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-5">
            <Trend
              data={analytics.trend.map((point) => ({
                label: point.label,
                value: point.revenue,
              }))}
              kind="bar"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
