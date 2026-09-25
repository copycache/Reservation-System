"use client";

import { useState } from "react";
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

const events = [
  {
    date: "2026-09-16",
    title: "Team Meeting",
  },
  {
    date: "2026-09-18",
    title: "Project Deadline",
  },
  {
    date: "2026-09-22",
    title: "Design Review",
  },
  {
    date: "2026-09-25",
    title: "Client Call",
  },
];

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function BigCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

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
    <div className="w-full rounded-lg border bg-background">
      {/* Calendar header */}
      <div className="flex items-center justify-between border-b p-4">
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
              <TableHead key={day} className="h-10 text-center font-medium">
                {day.slice(0, 3)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {weeks.map((week, weekIndex) => (
            <TableRow key={weekIndex}>
              {week.map((day, dayIndex) => {
                const dayEvents = day ? getEvents(day) : [];

                return (
                  <TableCell
                    key={dayIndex}
                    className="h-32 w-[14.28%] align-top p-2"
                  >
                    {day && (
                      <div className="flex h-full flex-col">
                        {/* Date */}
                        <div className="mb-2">
                          <span
                            className={`
                              flex h-7 w-7 items-center justify-center rounded-full
                              text-sm
                              ${
                                isToday(day)
                                  ? "bg-primary text-primary-foreground font-semibold"
                                  : ""
                              }
                            `}
                          >
                            {day}
                          </span>
                        </div>

                        {/* Events */}
                        <div className="space-y-1">
                          {dayEvents.map((event, index) => (
                            <div
                              key={index}
                              className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {event.title}
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
    </div>
  );
}
