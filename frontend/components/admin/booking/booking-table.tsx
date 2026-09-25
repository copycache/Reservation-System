"use client";

import { useState, useCallback, useEffect } from "react";

import { Eye } from "lucide-react";

import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { ViewBooking } from "@/components/admin/booking/view-booking";

import { formatDate } from "@/lib/format_date";
import { formatTime } from "@/lib/format_time";

type Booking = any;

type BookingFormProps = {
  tabValue: string;
};

export function PaymentLegend(status: string) {
  if (status === "booked") return "Booked";
}

export function StatusLegend({ status }: { status: string }) {
  if (status === "pending")
    return (
      <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-400">
        Pending
      </Badge>
    );

  if (status === "approved")
    return (
      <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        Confirmed
      </Badge>
    );

  if (status === "cancelled")
    return (
      <Badge className="border border-red-500/30 bg-red-500/10 text-red-400">
        Cancelled
      </Badge>
    );
}

export function BookingTable({ tabValue }: BookingFormProps) {
  const [bookings, setBookingSlots] = useState<Booking[]>([]);
  const loadBookingSlots = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/booking`,
      );
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
    <TabsContent value={tabValue}>
      <div className="w-full">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] whitespace-nowrap px-4 font-semibold text-foreground">
                  Booking #
                </TableHead>
                <TableHead className="min-w-[180px] px-4 font-semibold text-foreground">
                  Customer Name
                </TableHead>
                <TableHead className="min-w-[120px] px-4 font-semibold text-foreground">
                  Court
                </TableHead>
                <TableHead className="w-[180px] whitespace-nowrap px-4 text-center font-semibold text-foreground">
                  Date & Time
                </TableHead>
                <TableHead className="w-[110px] whitespace-nowrap px-4 text-center font-semibold text-foreground">
                  Duration
                </TableHead>
                <TableHead className="w-[100px] px-4 text-center font-semibold text-foreground">
                  Players
                </TableHead>
                <TableHead className="w-[120px] whitespace-nowrap px-4 text-right font-semibold text-foreground">
                  Amount
                </TableHead>
                <TableHead className="w-[130px] px-4 text-right font-semibold text-foreground">
                  Payment
                </TableHead>
                <TableHead className="w-[120px] px-4 text-center font-semibold text-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[100px] px-4 text-center font-semibold text-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings
                .filter(
                  (slot) => tabValue === "all" || slot.status === tabValue,
                )
                .map((booking) => (
                  <TableRow
                    key={`${booking.booking_id}`}
                    className="odd:bg-muted/50 odd:hover:bg-muted/50 hover:bg-transparent"
                  >
                    <TableCell className="w-[120px] px-4 font-medium whitespace-nowrap">
                      {booking.booking_number}
                    </TableCell>
                    <TableCell className="min-w-[180px] px-4">
                      {booking.customers?.name}
                    </TableCell>
                    <TableCell className="min-w-[120px] px-4 whitespace-nowrap">
                      Court
                    </TableCell>
                    <TableCell className="w-[180px] px-4 text-center whitespace-nowrap">
                      {booking.booking_slots?.map((booking_slot: any) => (
                        <div key={booking_slot.booking_slot_id}>
                          {formatDate(booking_slot.date, false)},{" "}
                          {formatTime(booking_slot.start_time, false)} -{" "}
                          {formatTime(booking_slot.end_time, true)}
                        </div>
                      ))}
                    </TableCell>

                    <TableCell className="w-[110px] px-4 text-center whitespace-nowrap">
                      Duration
                    </TableCell>
                    <TableCell className="w-[100px] px-4 text-center">
                      Players
                    </TableCell>
                    <TableCell className="w-[120px] px-4 text-right font-medium whitespace-nowrap">
                      ₱{booking.total_amount}
                    </TableCell>
                    <TableCell className="w-[130px] px-4 text-right">
                      {booking.payment_status}
                    </TableCell>
                    <TableCell className="w-[120px] px-4 text-right">
                      <StatusLegend status={booking.status} />
                    </TableCell>
                    <TableCell className="w-[100px] px-4 text-center">
                      <Dialog>
                        <DialogTrigger>
                          <span className="size-7 [&_svg:not([class*='size-'])]:size-3.5">
                            <Eye />
                          </span>
                        </DialogTrigger>
                        <DialogContent>
                          <ViewBooking bookingId={booking.booking_id} ontableReload={loadBookingSlots}/>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TabsContent>
  );
}
