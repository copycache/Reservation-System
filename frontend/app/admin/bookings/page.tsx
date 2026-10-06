"use client";

import { useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { BookingTable } from "@/components/admin/booking/booking-table";
import { BookingsKPIs } from "@/components/admin/booking/booking-kpis";

export default function BookingPage() {
  const [tabValue, setTabValue] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookingSlots] = useState<any[]>([]);

  const loadBookingSlots = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/booking", {
        headers: { Accept: "application/json" },
      });
      const slots = await response.json();
      setBookingSlots(slots);
    } catch {
    } finally {
    }
  }, []);

  useEffect(() => {
    loadBookingSlots();
  }, [loadBookingSlots]);

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Reservation management
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, search, and manage every court reservation.
          </p>
        </div>

        <BookingsKPIs bookings={bookings} />
        <Tabs defaultValue="all" value={tabValue} onValueChange={setTabValue}>
          <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <TabsList
              variant="default"
              className="order-2 h-auto w-full justify-start gap-1 bg-transparent p-0 lg:order-1 lg:w-auto"
            >
              <TabsTrigger value="all">All bookings</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            <div className="relative order-1 w-full lg:order-2 lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by booking, customer, or court"
                aria-label="Search bookings"
                className="h-9 pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <BookingTable
            tabValue={tabValue}
            bookings={bookings}
            searchQuery={searchQuery}
            loadBookingSlots={loadBookingSlots}
          />
        </Tabs>
      </div>
    </main>
  );
}
