"use client";

import { useState, useCallback, useEffect } from "react";
import { ScheduleCalendar } from "@/components/admin/dashboard/schedule-calendar";
import { DashboardKPIs } from "@/components/admin/dashboard/dashboard-kpis";

export default function DashboardPage() {
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
        <DashboardKPIs bookings={bookings} />
        <section className="space-y-4" aria-labelledby="schedule-heading">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Live schedule</p>
            <h2 id="schedule-heading" className="mt-1 text-xl font-semibold tracking-tight">Court availability</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review today&apos;s reservations by court and time.</p>
          </div>
          <ScheduleCalendar />
        </section>
      </div>
    </main>
  );
}