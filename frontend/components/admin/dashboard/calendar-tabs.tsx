"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";


import { HomepageForm } from "@/components/homepage-form";
import { formatTime } from "@/lib/format_time";

type BookingSlot = {
  date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  status: string;
  court_id?: number;
  bookings?: {
    status?: string;
    customers?: {
      name?: string;
    } | null;
  } | null;
};

const timeSlots = [
  { start_time: "08:30:00", end_time: "09:00:00", price: "₱300" },
  { start_time: "09:00:00", end_time: "10:00:00", price: "₱300" },
  { start_time: "10:00:00", end_time: "11:00:00", price: "₱300" },
  { start_time: "11:00:00", end_time: "12:00:00", price: "₱300" },
  { start_time: "12:00:00", end_time: "13:00:00", price: "₱300" },
  { start_time: "13:00:00", end_time: "14:00:00", price: "₱300" },
  { start_time: "14:00:00", end_time: "15:00:00", price: "₱300" },
  { start_time: "15:00:00", end_time: "16:00:00", price: "₱400" },
  { start_time: "16:00:00", end_time: "17:00:00", price: "₱400" },
  { start_time: "17:00:00", end_time: "18:00:00", price: "₱400" },
  { start_time: "18:00:00", end_time: "19:00:00", price: "₱400" },
  { start_time: "19:00:00", end_time: "20:00:00", price: "₱400" },
  { start_time: "20:00:00", end_time: "21:00:00", price: "₱400" },
  { start_time: "21:00:00", end_time: "22:00:00", price: "₱400" },
  { start_time: "22:00:00", end_time: "23:00:00", price: "₱400" },
  { start_time: "23:00:00", end_time: "00:00:00", price: "₱400" },
];

const statusStyles: Record<string, string> = {
  Open: "border border-green-500/70 bg-green-500/10 text-green-400",
  "Open Play": "border border-blue-500/70 bg-blue-500/10 text-blue-400",
  Confirmed: "border border-gray-500/70 bg-gray-500/10 text-gray-400",
  Club: "border border-violet-500/70 bg-violet-500/10 text-violet-400",
  Pending: "border border-amber-500/70 bg-amber-500/10 text-amber-400",
  Closed: "border border-red-500/70 bg-red-500/10 text-red-400",
  "--": "bg-transparent text-muted-foreground",
};

type DayCalendarProps = {
  date: Date;
  courtId: number;
};

export function DayCalendar({ date, courtId }: DayCalendarProps) {
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);

  const [openSlotForBooking, setOpenSlotForBooking] = useState<Map<string, any>>(new Map());
  const [isHomepageFormOpen, setIsHomepageFormOpen] = useState(false);
  const [formType, setFormType] = useState<"booking" | "edit">("booking");
  const [editData, setEditData] = useState<BookingSlot | null>(null);

  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  const loadBookingSlots = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/admin/dashboard_bookings",
      );

      if (!response.ok) {
        throw new Error("Unable to load bookings");
      }

      const data = await response.json();
      setBookingSlots(data);
    } catch {
      setBookingSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookingSlots();
  }, [loadBookingSlots]);

  const getSlot = (startTime: string, endTime: string) => {
    return bookingSlots.find(
      (slot) =>
        slot.date === dateKey &&
        slot.start_time === startTime &&
        slot.end_time === endTime &&
        slot.court_id === courtId,
    );
  };

  const isPastSlot = (startTime: string) => {
    const slotDate = new Date(date);
    const [hours, minutes, seconds] = startTime.split(':').map(Number);
    slotDate.setHours(hours, minutes || 0, seconds || 0, 0);
    return new Date() >= slotDate;
  };

  const getStatus = (slot?: BookingSlot, isPast?: boolean) => {
    if (!slot || slot.bookings?.status === "cancelled") {
      return isPast ? "--" : "Open";
    }

    const effectiveStatus = slot.bookings?.status === "approved" ? "booked" : slot.status;

    switch (effectiveStatus) {
      case "booked":
        return "Confirmed";
      case "open_play":
        return "Open Play";
      case "club":
        return "Club";
      case "pending":
        return "Pending";
      case "closed":
        return "Closed";
      case "--":
        return "--";
      default:
        return isPast ? "--" : "Open";
    }
  };

  const isSelected = (slot?: BookingSlot) => {
    if (!selectedSlot || !slot) {
      return false;
    }

    return (
      selectedSlot.date === slot.date &&
      selectedSlot.start_time === slot.start_time &&
      selectedSlot.end_time === slot.end_time
    );
  };

  if (isLoading) {
    return (
      <Table>
        <TableBody>
          {Array.from({ length: 8 }, (_, index) => (
            <TableRow
              key={index}
              className="*:border-border [&>:not(:last-child)]:border-r"
            >
              <TableCell className="py-2">
                <Skeleton className="h-4 w-28" />
              </TableCell>

              <TableCell className="py-2">
                <Skeleton className="mx-auto h-4 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableBody>
        {timeSlots.map((timeSlot) => {
          const slot = getSlot(
            timeSlot.start_time,
            timeSlot.end_time,
          );

          const isPast = isPastSlot(timeSlot.start_time);
          const status = getStatus(slot, isPast);
          const selected = isSelected(slot);

          const customerName = slot?.bookings?.customers?.name;

          const label = `${formatTime(timeSlot.start_time)}-${formatTime(
            timeSlot.end_time,
          )}`;

          return (
            <TableRow
              key={`${dateKey}-${label}`}
              className="*:border-border [&>:not(:last-child)]:border-t"
            >
              <TableCell className="text-xs font-medium py-1.5 w-[150px]">
                {label}

                <span className="text-muted-foreground">
                  {" "}
                  . {timeSlot.price}
                </span>
              </TableCell>

              <Dialog
                open={selected}
                onOpenChange={(open) => {
                  if (!open) {
                    setSelectedSlot(null);
                  }
                }}
              >
                <DialogTrigger
                  nativeButton={false}
                  render={
                    <TableCell
                      className={`${statusStyles[status]} ${status === "--" && isPast ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-80"}`}
                      onClick={() => {
                        if (status === "--" && isPast) return;
                        
                        if (slot) {
                          setSelectedSlot(null);
                          const newMap = new Map();
                          const priceStr = String(timeSlot.price).replace("₱", "").replace(",", "");
                          const subtotal = parseInt(priceStr) || 0;

                          newMap.set(`${dateKey}::${timeSlot.start_time}-${timeSlot.end_time}`, {
                            date: dateKey,
                            start_time: timeSlot.start_time,
                            end_time: timeSlot.end_time,
                            subtotal: subtotal
                          });
                          
                          setOpenSlotForBooking(newMap);
                          setFormType("edit");
                          setEditData(slot);
                          setIsHomepageFormOpen(true);
                        } else {
                          setSelectedSlot(null);
                          
                          const newMap = new Map();
                          const priceStr = String(timeSlot.price).replace("₱", "").replace(",", "");
                          const subtotal = parseInt(priceStr) || 0;

                          newMap.set(`${dateKey}::${timeSlot.start_time}-${timeSlot.end_time}`, {
                            date: dateKey,
                            start_time: timeSlot.start_time,
                            end_time: timeSlot.end_time,
                            subtotal: subtotal
                          });
                          
                          setOpenSlotForBooking(newMap);
                          setFormType("booking");
                          setEditData(null);
                          setIsHomepageFormOpen(true);
                        }
                      }}
                    >
                      {status === "--" && isPast ? "Closed" : status}

                      {status !== "Open" &&
                        status !== "--" &&
                        customerName && (
                          <span className="text-xs">
                            {" "}
                            - {customerName}
                          </span>
                        )}
                    </TableCell>
                  }
                />
              </Dialog>
            </TableRow>
          );
        })}
      </TableBody>
        <HomepageForm
          data={openSlotForBooking}
          bookingSlots={bookingSlots as any}
          onBookingSubmitted={() => {
            setIsHomepageFormOpen(false);
            setOpenSlotForBooking(new Map());
            loadBookingSlots();
          }}
          formType={formType}
          editData={editData}
          open={isHomepageFormOpen}
          onOpenChange={setIsHomepageFormOpen}
          hideTrigger={true}
          defaultCourtId={courtId}
        />
    </Table>
  );
}