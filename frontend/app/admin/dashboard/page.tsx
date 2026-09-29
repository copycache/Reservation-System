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
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <DashboardKPIs bookings={bookings} />
        <ScheduleCalendar />
    </div>
  );
}