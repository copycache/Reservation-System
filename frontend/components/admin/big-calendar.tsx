"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTime } from "@/lib/format_time";
import { HomepageForm } from "../homepage-form";

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  time: string;
  court: string;
  courtType: string;
  status: string;
  rawSlot?: any;
  rawSlots?: any[];
  rawBooking?: any;
};

export function BigCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  async function fetchBookings() {
    try {
        const response = await fetch(
          "/api/admin/booking"
        );
        if (!response.ok) throw new Error("Failed to fetch bookings");
        
        const data = await response.json();
        
        const newEvents: CalendarEvent[] = [];
        data.forEach((booking: any) => {
          if (booking.status !== "cancelled" && booking.booking_slots) {
            const dates: string[] = Array.from(new Set(booking.booking_slots.map((s: any) => s.date)));

            dates.forEach(date => {
              const slots = booking.booking_slots.filter((s: any) => s.date === date);
              
              slots.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
              
              const timeStr = slots.map((s: any) => `${formatTime(s.start_time, true)} - ${formatTime(s.end_time, true)}`).join(', ');
              
              const courtNames = Array.from(new Set(slots.map((s: any) => s.court?.court_name).filter(Boolean))).join(', ');
              const courtTypes = Array.from(new Set(slots.map((s: any) => s.court?.type).filter(Boolean))).join(', ');

              newEvents.push({
                id: (slots[0].booking_slot_id || slots[0].id || Math.random().toString()) + "-merged",
                date: date,
                title: booking.customers?.name || "Unknown",
                time: timeStr,
                court: courtNames || "Court",
                courtType: courtTypes,
                status: booking.status === "approved" ? "booked" : (booking.status || slots[0].status),
                rawSlots: slots,
                rawBooking: booking,
              });
            });
          }
        });
        
        setEvents(newEvents);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    }

  useEffect(() => {
    fetchBookings();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const getEvents = (day: number) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;

    return events.filter((event) => event.date === date);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Create calendar cells including the empty cells before the 1st.
  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  // Fill the final week so the grid always has complete rows.
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="w-full rounded-lg border bg-background overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between border-b p-4 bg-muted/20">
        <div>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>

          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Table>
        <TableHeader>
          <TableRow>
            {weekDays.map((day) => (
              <TableHead key={day} className="h-10 text-center font-medium border-x first:border-l-0 last:border-r-0">
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{day.slice(0, 3)}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {weeks.map((week, weekIndex) => (
            <TableRow key={weekIndex} className="hover:bg-transparent">
              {week.map((day, dayIndex) => {
                const dayEvents = day ? getEvents(day) : [];

                return (
                  <TableCell
                    key={dayIndex}
                    className={`h-36 md:h-40 w-[14.28%] align-top p-2 border-x first:border-l-0 last:border-r-0 ${
                      !day ? "bg-muted/10" : ""
                    } ${isToday(day || -1) ? "bg-primary/5" : ""}`}
                  >
                    {day && (
                      <div className="flex h-full flex-col">
                        {/* Date */}
                        <div className="mb-2 flex justify-between items-start">
                          <span
                            className={`
                              flex h-7 w-7 items-center justify-center rounded-full
                              text-sm
                              ${
                                isToday(day)
                                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                  : "text-muted-foreground font-medium"
                              }
                            `}
                          >
                            {day}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium hidden md:inline-block">
                              {dayEvents.length} {dayEvents.length === 1 ? "booking" : "bookings"}
                            </span>
                          )}
                        </div>

                        {/* Events */}
                        <div className="flex-1 space-y-1 overflow-y-auto pr-1 -mr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
                          {dayEvents.map((event, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setSelectedEvent(event)
                                setIsEditOpen(true);
                              }}
                              className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 flex flex-col leading-tight cursor-pointer"
                            >
                              <div className="flex justify-between items-start gap-1">
                                <div className="truncate font-semibold" title={`${event.title} - ${event.court}${event.courtType ? ` (${event.courtType})` : ""}`}>
                                  {event.title} {event.courtType ? `- ${event.courtType}` : ""}
                                </div>
                                {event.status && (
                                  <span className={`text-[8px] px-1 py-0.5 rounded-sm font-bold uppercase ${
                                    event.status === "booked" ? "bg-green-500/20 text-green-700" :
                                    event.status === "cancelled" ? "bg-red-500/20 text-red-700" :
                                    event.status === "pending" ? "bg-yellow-500/20 text-yellow-700" :
                                    "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70"
                                  }`}>
                                    {event.status === "booked" ? "Confirmed" : event.status}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] opacity-80 truncate mt-0.5" title={event.time}>
                                {event.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedEvent && (
        <HomepageForm
          formType="edit"
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          hideTrigger={true}
          onBookingSubmitted={() => {
            fetchBookings();
            setIsEditOpen(false);
          }}
          data={
            selectedEvent.rawSlots 
              ? new Map(selectedEvent.rawSlots.map((slot: any) => [
                  `${slot.date}-${slot.start_time}-${slot.court_id}`, 
                  {
                    date: slot.date,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    subtotal: parseFloat(slot.price || "0")
                  }
                ]))
              : new Map([
                  ["slot", {
                    date: selectedEvent.rawSlot.date,
                    start_time: selectedEvent.rawSlot.start_time,
                    end_time: selectedEvent.rawSlot.end_time,
                    subtotal: parseFloat(selectedEvent.rawSlot.price || "0")
                  }]
                ])
          }
          editData={{
            slots: selectedEvent.rawSlots || [selectedEvent.rawSlot],
            booking_slot_id: selectedEvent.rawSlots ? (selectedEvent.rawSlots[0].booking_slot_id || selectedEvent.rawSlots[0].id) : (selectedEvent.rawSlot.booking_slot_id || selectedEvent.rawSlot.id),
            court_id: selectedEvent.rawSlots ? selectedEvent.rawSlots[0].court_id : selectedEvent.rawSlot.court_id,
            status: selectedEvent.rawSlots ? selectedEvent.rawSlots[0].status : selectedEvent.rawSlot.status,
            date: selectedEvent.rawSlots ? selectedEvent.rawSlots[0].date : selectedEvent.rawSlot.date,
            start_time: selectedEvent.rawSlots ? selectedEvent.rawSlots[0].start_time : selectedEvent.rawSlot.start_time,
            bookings: selectedEvent.rawBooking
          }}
        />
      )}
    </div>
  );
}

