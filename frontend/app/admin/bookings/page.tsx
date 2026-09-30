"use client";

import { useState, useCallback, useEffect } from "react";

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
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <BookingsKPIs bookings={bookings} />
      <Tabs defaultValue="all" value={tabValue} onValueChange={setTabValue}>
        <div className="flex flex-col gap-4 mb-4">
          <div>
            <TabsList variant="default">
              <TabsTrigger value="all">All Bookings</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="w-full sm:w-80">
            <Input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <BookingTable tabValue={tabValue} bookings={bookings} searchQuery={searchQuery} loadBookingSlots={loadBookingSlots} />
      </Tabs>
    </div>
  );
}
