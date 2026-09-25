"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HomepageForm } from "@/components/homepage-form";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonthDay, formatWeekday } from "@/lib/format_date";
import { formatTime } from "@/lib/format_time";

type BookingSlot = {
  date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  status: string;
  booking?: {
    status?: string;
  } | null;
};

type SelectedSlot = {
  date: string;
  start_time: string;
  end_time: string;
  subtotal: number;
};

type ScheduleTableProps = {
  refreshKey: number;
  onBookingSubmitted: () => void;
};

export default function ScheduleTable({
  refreshKey,
  onBookingSubmitted,
}: ScheduleTableProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toDateKey = (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

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

  const [startDate, setStartDate] = useState(new Date(today));
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<Map<string, SelectedSlot>>(
    new Map(),
  );

  const loadBookingSlots = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/home_bookings`,
      );
      if (!response.ok) {
        throw new Error("Unable to load bookings");
      }
      const slots = (await response.json()) as BookingSlot[];
      setBookingSlots(slots);
    } catch {
      // Keep the schedule empty if bookings cannot be loaded.
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isAtToday = startDate.getTime() === today.getTime();

  const goToPrev = () => {
    setStartDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 3);
      return next < today ? new Date(today) : next;
    });
  };

  const goToNext = () => {
    setStartDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 3);
      return next;
    });
  };

  function handleDateChange(newDate: Date | undefined) {
    if (!newDate) return;

    const pickedDate = new Date(newDate);
    pickedDate.setHours(0, 0, 0, 0);

    if (pickedDate < today) {
      setStartDate(today);
    } else {
      setStartDate(pickedDate);
    }
  }

  const visibleDays = Array.from({ length: 4 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const isToday = date.getTime() === today.getTime();

    return {
      date,
      key: isToday
        ? "today"
        : formatWeekday(date).toLowerCase(),
      label: isToday
        ? "Today"
        : formatWeekday(date),
      dateLabel: formatMonthDay(date),
    };
  });

  const statusStyles: Record<string, string> = {
    Open: "border border-green-500/70 bg-green-500/10 text-green-400",
    "Open Play": "border border-blue-500/70 bg-blue-500/10 text-blue-400",
    Booked: "border border-gray-500/70 bg-gray-500/10 text-gray-400",
    Club: "border border-violet-500/70 bg-violet-500/10 text-violet-400",
    Pending: "border border-amber-500/70 bg-amber-500/10 text-amber-400",
    Closed: "border border-red-500/70 bg-red-500/10 text-red-400",
    "--": "bg-transparent text-muted-foreground",
  };

  const getScheduleLabel = (startTime: string, endTime: string) =>
    `${formatTime(startTime)}-${formatTime(endTime)}`;

  const getSlotPrice = (price: string | number) =>
    Number(String(price).replace(/[^0-9.]/g, ""));

  const getCellStatus = (date: Date, startTime: string, endTime: string) => {
    const slot = bookingSlots.find((bookingSlot) => {
      return (
        bookingSlot.date === toDateKey(date) &&
        bookingSlot.start_time === startTime &&
        bookingSlot.end_time === endTime
      );
    });

    if (!slot || slot.booking?.status === "cancelled") {
      return "Open";
    }

    if (slot.status === "booked") return "Booked";
    if (slot.status === "open_play") return "Open Play";
    if (slot.status === "club") return "Club";
    if (slot.status === "pending") return "Pending";
    if (slot.status === "closed") return "Closed";
    if (slot.status === "--") return "--";

    return "Open";
  };

  const isPastSlot = (date: Date, startTime: string) => {
    const currentDate = new Date();

    if (toDateKey(date) !== toDateKey(currentDate)) {
      return false;
    }

    const [hours] = startTime.split(":").map(Number);
    const slotTime = new Date();
    slotTime.setHours(hours, 0, 0, 0);

    return currentDate >= slotTime;
  };

  const totalPrice = Array.from(selectedSlots.values()).reduce(
    (sum, slot) => sum + slot.subtotal,
    0,
  );

  const handleCellClick = (
    date: Date,
    schedule: { start_time: string; end_time: string; price: string },
    value: string,
  ) => {
    if (value !== "Open" || isPastSlot(date, schedule.start_time)) return;

    const time = getScheduleLabel(schedule.start_time, schedule.end_time);
    const slotKey = `${toDateKey(date)}::${time}`;

    const next = new Map(selectedSlots);
    if (next.has(slotKey)) {
      next.delete(slotKey);
    } else {
      next.set(slotKey, {
        date: toDateKey(date),
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        subtotal: getSlotPrice(schedule.price),
      });
    }

    setSelectedSlots(next);
  };

  useEffect(() => {
    loadBookingSlots();
  }, [loadBookingSlots, refreshKey]);

  return (
    <div className="max-w-5xl mx-auto">
      <p className="text-xs text-muted-foreground mt-5 mb-2">
        Tap open slots to select them (you can pick several, across different
        days), then press &ldquo;Book my slot&rdquo;.
      </p>

      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className={`gap-1 cursor-pointer ${isAtToday ? "cursor-not-allowed" : ""}`}
            onClick={goToPrev}
            disabled={isAtToday}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev 3 days
          </Button>

          <div className="relative">
            <DatePickerInput date={startDate} onDateChange={handleDateChange} />
          </div>

          <Button
            variant="outline"
            size="lg"
            className="gap-1 cursor-pointer"
            onClick={goToNext}
          >
            Next 3 days
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {visibleDays[0].dateLabel} – {visibleDays[3].dateLabel}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a19] border border-neutral-800 rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="*:border-border [&>:not(:last-child)]:border-r">
              <TableHead className="text-xs py-2">Time Slot</TableHead>
              {visibleDays.map((day) => (
                <TableHead key={day.key} className="text-center text-xs py-2">
                  <div className="whitespace-pre-line">{`${day.label}\n${day.dateLabel}`}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }, (_, index) => (
                  <TableRow
                    key={`loading-${index}`}
                    className="*:border-border [&>:not(:last-child)]:border-r"
                  >
                    <TableCell className="py-2">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    {visibleDays.map((day) => (
                      <TableCell key={`${day.key}-loading-${index}`} className="py-2">
                        <Skeleton className="mx-auto h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : timeSlots.map((schedule) => {
              const slotLabel = getScheduleLabel(
                schedule.start_time,
                schedule.end_time,
              );

              return (
                <TableRow
                  key={slotLabel}
                  className="*:border-border [&>:not(:last-child)]:border-r"
                >
                  <TableCell className="text-xs font-medium py-1.5">
                    {slotLabel}
                    <span className="text-muted-foreground">
                      {" "}
                      . {schedule.price}
                    </span>
                  </TableCell>

                  {visibleDays.map((day) => {
                    const value = getCellStatus(
                      day.date,
                      schedule.start_time,
                      schedule.end_time,
                    );
                    const past = isPastSlot(day.date, schedule.start_time);
                    const slotKey = `${toDateKey(day.date)}::${slotLabel}`;
                    const selected = selectedSlots.has(slotKey) && !past;
                    const bookable = value === "Open" && !past;

                    return (
                      <TableCell
                        key={`${day.key}-${slotLabel}`}
                        onClick={() => handleCellClick(day.date, schedule, value)}
                        className={`text-xs text-center py-1.5 transition-colors
                          ${past ? "" : statusStyles[value]}
                          ${bookable ? "hover:underline cursor-pointer" : ""}
                          ${selected ? "bg-[#c8a461] text-white font-medium" : ""}
                        `}
                      >
                        {past ? "" : selected ? "✓ Selected" : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
              })}
          </TableBody>
        </Table>
      </div>

      <div
        className={`${selectedSlots.size > 0 ? "block" : "hidden"} fixed inset-x-0 bottom-0 z-20 border-t border-neutral-800 bg-[#191a19]/95 px-4 py-2 backdrop-blur-sm`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground">
              {selectedSlots.size} slot{selectedSlots.size === 1 ? "" : "s"}{" "}
              selected
            </span>
            <span className="hidden sm:inline"> · Total ₱{totalPrice}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              className="cursor-pointer"
              onClick={() => setSelectedSlots(new Map())}
              disabled={selectedSlots.size === 0}
            >
              Clear
            </Button>

            <HomepageForm
              data={selectedSlots}
              onBookingSubmitted={() => {
                setSelectedSlots(new Map());
                onBookingSubmitted();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
