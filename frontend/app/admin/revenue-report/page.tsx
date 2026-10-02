"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarRange,
  CircleDollarSign,
  Download,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BookingSlot = {
  date?: string | null;
  court?: {
    court_name?: string | null;
    type?: string | null;
  } | null;
};

type Booking = {
  booking_id?: number | string;
  booking_number?: string | null;
  status?: string | null;
  payment_status?: string | null;
  total_amount?: number | string | null;
  created_at?: string | null;
  customers?: { name?: string | null } | null;
  booking_slots?: BookingSlot[] | null;
};

const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

function toCurrency(value: number | string | null | undefined) {
  return money.format(Number(value ?? 0) || 0);
}

function normalizeStatus(value: string | null | undefined) {
  const status = (value ?? "").trim().toLowerCase();

  if (["approved", "booked", "scheduled", "confirmed"].includes(status)) {
    return "approved";
  }

  if (status.includes("cancel")) {
    return "cancelled";
  }

  if (status.includes("pending") || status.includes("waiting")) {
    return "pending";
  }

  return "pending";
}

function normalizePaymentStatus(value: string | null | undefined) {
  const status = (value ?? "").trim().toLowerCase();

  if (["paid", "approved", "completed"].includes(status)) {
    return "paid";
  }

  if (status.includes("cancel")) {
    return "cancelled";
  }

  return "pending";
}

function statusTone(status: "approved" | "pending" | "cancelled") {
  if (status === "approved") {
    return "default";
  }

  if (status === "pending") {
    return "secondary";
  }

  return "destructive";
}

function ticketLabel(status: string | null | undefined) {
  const normalized = normalizeStatus(status);

  if (normalized === "approved") return "Approved";
  if (normalized === "cancelled") return "Cancelled";
  return "Pending";
}

function paymentLabel(status: string | null | undefined) {
  const normalized = normalizePaymentStatus(status);

  if (normalized === "paid") return "Paid";
  if (normalized === "cancelled") return "Cancelled";
  return "Pending";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch("/api/admin/booking", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Unable to load booking data.");
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as Booking[]) : [];
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function exportRevenue(bookings: Booking[]) {
  const rows = [
    ["Booking #", "Customer", "Reservation date", "Court", "Status", "Payment", "Amount"],
    ...bookings.map((booking) => {
      const slots = booking.booking_slots ?? [];
      const dates = slots
        .map((slot) => slot.date)
        .filter(Boolean)
        .join(" | ");
      const courts = [...new Set(slots.map((slot) => slot.court?.court_name || slot.court?.type || "Court"))].join(" | ");

      return [
        booking.booking_number || booking.booking_id || "",
        booking.customers?.name || "Walk-in customer",
        dates,
        courts,
        ticketLabel(booking.status),
        paymentLabel(booking.payment_status),
        Number(booking.total_amount ?? 0).toFixed(2),
      ];
    }),
  ];

  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `revenue-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RevenueReportPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "cancelled">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setBookings(await fetchBookings());
    } catch {
      setError("Revenue data could not be loaded. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const bookingDates = (booking.booking_slots ?? [])
        .map((slot) => slot.date)
        .filter((value): value is string => Boolean(value));

      const matchesDate =
        bookingDates.length === 0
          ? true
          : bookingDates.some((date) => {
              const isAfterStart = !startDate || date >= startDate;
              const isBeforeEnd = !endDate || date <= endDate;
              return isAfterStart && isBeforeEnd;
            });

      const matchesStatus =
        statusFilter === "all" || normalizeStatus(booking.status) === statusFilter;

      const searchText = [
        booking.booking_number,
        booking.customers?.name,
        booking.status,
        booking.payment_status,
        ...(booking.booking_slots ?? []).flatMap((slot) => [
          slot.court?.court_name,
          slot.court?.type,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return matchesDate && matchesStatus && (!query || searchText.includes(query));
    });
  }, [bookings, endDate, search, startDate, statusFilter]);

  const summary = useMemo(() => {
    const totalRevenue = filteredBookings.reduce(
      (sum, booking) => sum + Number(booking.total_amount ?? 0),
      0,
    );
    const paidRevenue = filteredBookings
      .filter((booking) => normalizePaymentStatus(booking.payment_status) === "paid")
      .reduce((sum, booking) => sum + Number(booking.total_amount ?? 0), 0);
    const pendingRevenue = Math.max(totalRevenue - paidRevenue, 0);

    return {
      totalBookings: filteredBookings.length,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      averageValue: filteredBookings.length ? totalRevenue / filteredBookings.length : 0,
    };
  }, [filteredBookings]);

  const currency = (value: number) => toCurrency(value);

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Reports</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Revenue report
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track bookings, payments, and income in one simple overview.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadBookings()} disabled={isLoading}>
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="ml-2">Refresh</span>
            </Button>
            <Button onClick={() => exportRevenue(filteredBookings)} disabled={filteredBookings.length === 0}>
              <Download className="size-4" />
              <span className="ml-2">Export CSV</span>
            </Button>
          </div>
        </header>

        <section className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1.1fr_2fr]">
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Start date
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-9"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            End date
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-9"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Status
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter((value as typeof statusFilter) ?? "all")}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Customer, court, booking #"
                className="h-9 pl-8"
              />
            </span>
          </label>
        </section>

        {error ? (
          <div className="rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total revenue</span>
                <CircleDollarSign className="size-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{currency(summary.totalRevenue)}</div>
              <p className="mt-2 text-xs text-muted-foreground">Across {summary.totalBookings} booking(s)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Collected</span>
                <TrendingUp className="size-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-emerald-600">{currency(summary.paidRevenue)}</div>
              <p className="mt-2 text-xs text-muted-foreground">Paid bookings in this range</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Pending</span>
                <ArrowUpRight className="size-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-amber-600">{currency(summary.pendingRevenue)}</div>
              <p className="mt-2 text-xs text-muted-foreground">Awaiting confirmation or payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Average booking</span>
                <CalendarRange className="size-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{currency(summary.averageValue)}</div>
              <p className="mt-2 text-xs text-muted-foreground">Mean revenue per booking</p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Booking list</CardTitle>
            </div>
            <Badge variant="secondary">{filteredBookings.length} records</Badge>
          </CardHeader>
          <CardContent className="px-0">
            {filteredBookings.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No bookings match the current filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reservation</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const status = normalizeStatus(booking.status);
                    const payment = normalizePaymentStatus(booking.payment_status);
                    const slotDates = (booking.booking_slots ?? [])
                      .map((slot) => formatDate(slot.date))
                      .filter(Boolean);
                    const courts = [...new Set((booking.booking_slots ?? []).map((slot) => slot.court?.court_name || slot.court?.type || "Court"))];

                    return (
                      <TableRow key={String(booking.booking_id ?? booking.booking_number ?? Math.random())}>
                        <TableCell>
                          <div className="font-medium">{booking.booking_number || `#${booking.booking_id ?? "-"}`}</div>
                          <div className="text-muted-foreground">{formatDate(booking.created_at)}</div>
                        </TableCell>
                        <TableCell>{booking.customers?.name || "Walk-in customer"}</TableCell>
                        <TableCell>{slotDates.length ? slotDates.join(" • ") : "—"}</TableCell>
                        <TableCell>{courts.length ? courts.join(" • ") : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={statusTone(status)}>{ticketLabel(booking.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment === "paid" ? "default" : payment === "cancelled" ? "destructive" : "secondary"}>
                            {paymentLabel(booking.payment_status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {toCurrency(booking.total_amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
