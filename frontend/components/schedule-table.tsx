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

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingSlot = {
  date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  status: string;
  court_id?: number | null;
  bookings?: {
    status?: string;
  } | null;
};

type SelectedSlot = {
  date: string;
  start_time: string;
  end_time: string;
  subtotal: number;
};

/** A single 1-hour time block generated from a pricing rule. */
type TimeSlot = {
  start_time: string; // "HH:mm:ss"
  end_time: string;   // "HH:mm:ss"
};

type PricingRuleSchedule = {
  pricing_rule_schedule_id: number;
  pricing_rule_id: number;
  day_of_week: string; // "mon" | "tue" | ...
  start_time: string;  // "HH:mm:ss"
  end_time: string;    // "HH:mm:ss"
};

type PricingRule = {
  pricing_rule_id: number;
  court_id: number | null;
  name: string;
  price: string;      // stored as decimal string e.g. "400.00"
  priority: number;   // lower = higher priority
  is_active: boolean | number;
  pricing_rule_schedules: PricingRuleSchedule[];
};

type ScheduleTableProps = {
  refreshKey: number;
  onBookingSubmitted: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert "HH:mm:ss" or "HH:mm" to total minutes since midnight. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Convert total minutes since midnight to "HH:mm:ss". */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/** Map a JS Date to the day_of_week slug used in the DB ("mon" … "sun"). */
function getDayOfWeek(date: Date): string {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getDay()];
}

/**
 * Expand a start_time → end_time range into contiguous 1-hour blocks.
 * Handles midnight crossing: end_time "00:00:00" is treated as 24:00.
 */
function expandToHourlySlots(startTime: string, endTime: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let current = timeToMinutes(startTime);
  const endMins =
    timeToMinutes(endTime) === 0 ? 24 * 60 : timeToMinutes(endTime);

  while (current < endMins) {
    const next = Math.min(current + 60, endMins);
    slots.push({
      start_time: minutesToTime(current),
      end_time: minutesToTime(next % (24 * 60)),
    });
    current = next;
  }
  return slots;
}

/**
 * Build a de-duplicated, time-sorted union of all 1-hour slots
 * that exist across ALL visible days according to the active pricing rules.
 * This forms the rows of the schedule table.
 */
function generateUnifiedTimeSlots(
  pricingRules: PricingRule[],
  visibleDays: { date: Date }[],
): TimeSlot[] {
  const seen = new Set<string>();
  const slots: TimeSlot[] = [];

  for (const day of visibleDays) {
    const dayOfWeek = getDayOfWeek(day.date);

    for (const rule of pricingRules) {
      for (const schedule of rule.pricing_rule_schedules) {
        if (schedule.day_of_week !== dayOfWeek) continue;

        for (const slot of expandToHourlySlots(
          schedule.start_time,
          schedule.end_time,
        )) {
          const key = `${slot.start_time}-${slot.end_time}`;
          if (!seen.has(key)) {
            seen.add(key);
            slots.push(slot);
          }
        }
      }
    }
  }

  // Sort chronologically
  return slots.sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
  );
}

/**
 * Return the price (₱) for a given date + slot start time.
 * The highest-priority rule (lowest priority number) wins.
 * Returns null if no active pricing rule covers this date + slot.
 */
function getPriceForSlot(
  pricingRules: PricingRule[],
  date: Date,
  startTime: string,
): number | null {
  const dayOfWeek = getDayOfWeek(date);
  const slotMins = timeToMinutes(startTime);

  const applicable = pricingRules.filter((rule) =>
    rule.pricing_rule_schedules.some((s) => {
      if (s.day_of_week !== dayOfWeek) return false;
      const start = timeToMinutes(s.start_time);
      const end =
        timeToMinutes(s.end_time) === 0 ? 24 * 60 : timeToMinutes(s.end_time);
      return slotMins >= start && slotMins < end;
    }),
  );

  if (applicable.length === 0) return null;

  // Highest priority = lowest priority number
  applicable.sort((a, b) => a.priority - b.priority);
  return Number(applicable[0].price);
}

const WEEKEND_DAYS = new Set(["sat", "sun"]);

/**
 * Returns the weekend-discount info for a given slot start time, or null
 * if no weekend-only pricing rule covers this time slot.
 *
 * A "weekend rule" is one whose schedules reference ONLY Sat and/or Sun
 * (i.e. no weekday schedules at all).
 *
 * The returned `label` is a sorted, human-readable day range such as "Sat-Sun".
 */
function getWeekendDiscountForSlot(
  pricingRules: PricingRule[],
  startTime: string,
): { label: string; price: number } | null {
  const slotMins = timeToMinutes(startTime);

  // Identify rules whose schedules are exclusively weekend days
  const weekendRules = pricingRules.filter((rule) => {
    const days = new Set(rule.pricing_rule_schedules.map((s) => s.day_of_week));
    // Must have at least one schedule and ALL of them must be Sat or Sun
    return days.size > 0 && [...days].every((d) => WEEKEND_DAYS.has(d));
  });

  // Among weekend rules, find the one (highest priority) whose time range
  // covers the given slot start time
  weekendRules.sort((a, b) => a.priority - b.priority);

  for (const rule of weekendRules) {
    const covers = rule.pricing_rule_schedules.some((s) => {
      const start = timeToMinutes(s.start_time);
      const end =
        timeToMinutes(s.end_time) === 0 ? 24 * 60 : timeToMinutes(s.end_time);
      return slotMins >= start && slotMins < end;
    });

    if (!covers) continue;

    // Build a human-readable label from the unique days in this rule
    const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const DAY_LABEL: Record<string, string> = {
      mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
      fri: "Fri", sat: "Sat", sun: "Sun",
    };
    const uniqueDays = [
      ...new Set(rule.pricing_rule_schedules.map((s) => s.day_of_week)),
    ].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

    const label = uniqueDays.map((d) => DAY_LABEL[d] ?? d).join("-");
    return { label, price: Number(rule.price) };
  }

  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  const [startDate, setStartDate] = useState(new Date(today));
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);

  // ── 4.2 Pricing rules state ───────────────────────────────────────────────
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  // ── 4.6 Separate loading flags so both fetches drive the skeleton ─────────
  const [isSlotsLoading, setIsSlotsLoading] = useState(true);
  const [isPricingLoading, setIsPricingLoading] = useState(true);

  const [selectedSlots, setSelectedSlots] = useState<Map<string, SelectedSlot>>(
    new Map(),
  );

  // ── 4.2 Fetch active pricing rules (public endpoint, no auth required) ────
  const loadPricingRules = useCallback(async () => {
    setIsPricingLoading(true);
    try {
      const response = await fetch("/api/public/pricings", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Unable to load pricing rules");
      const rules: PricingRule[] = await response.json();
      setPricingRules(rules);
    } catch {
      // Keep the table empty if pricing rules cannot be loaded.
    } finally {
      setIsPricingLoading(false);
    }
  }, []);

  const loadBookingSlots = useCallback(async () => {
    setIsSlotsLoading(true);
    try {
      const response = await fetch("/api/home_bookings", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Unable to load bookings");
      const slots = await response.json();
      setBookingSlots(slots);
    } catch {
      // Keep the schedule empty if bookings cannot be loaded.
    } finally {
      setIsSlotsLoading(false);
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
      key: isToday ? "today" : formatWeekday(date).toLowerCase(),
      label: isToday ? "Today" : formatWeekday(date),
      dateLabel: formatMonthDay(date),
    };
  });

  // ── 4.1 / 4.3 Replace hardcoded timeSlots with dynamic generation ──────────
  // Recomputes whenever pricingRules or the visible date window changes.
  const generatedSlots = generateUnifiedTimeSlots(pricingRules, visibleDays);

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

  const getCellStatus = (date: Date, startTime: string, endTime: string) => {
    const slot = bookingSlots.find((bookingSlot) => {
      return (
        bookingSlot.date === toDateKey(date) &&
        bookingSlot.start_time === startTime &&
        bookingSlot.end_time === endTime
      );
    });

    if (!slot || slot.bookings?.status === "cancelled") {
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

  // ── 4.5 handleCellClick now receives the price as a number ────────────────
  const handleCellClick = (
    date: Date,
    slot: TimeSlot,
    value: string,
    price: number,
  ) => {
    if (value !== "Open" || isPastSlot(date, slot.start_time)) return;

    const time = getScheduleLabel(slot.start_time, slot.end_time);
    const slotKey = `${toDateKey(date)}::${time}`;

    const next = new Map(selectedSlots);
    if (next.has(slotKey)) {
      next.delete(slotKey);
    } else {
      next.set(slotKey, {
        date: toDateKey(date),
        start_time: slot.start_time,
        end_time: slot.end_time,
        subtotal: price,
      });
    }

    setSelectedSlots(next);
  };

  useEffect(() => {
    loadPricingRules();
    loadBookingSlots();
  }, [loadPricingRules, loadBookingSlots, refreshKey]);

  // ── 4.6 Show skeleton while either fetch is in flight ─────────────────────
  const showSkeleton = isSlotsLoading || isPricingLoading;

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
            {/* ── 4.6 Skeleton while either fetch is loading ─────────────── */}
            {showSkeleton ? (
              Array.from({ length: 8 }, (_, index) => (
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
            ) : generatedSlots.length === 0 ? (
              /* ── Empty state when no pricing rules are active ─────────── */
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-xs text-muted-foreground"
                >
                  No active pricing schedules. An admin needs to create pricing
                  rules before slots appear here.
                </TableCell>
              </TableRow>
            ) : (
              /* ── 4.4 Render dynamically generated time slot rows ──────── */
              generatedSlots.map((slot) => {
                const slotLabel = getScheduleLabel(
                  slot.start_time,
                  slot.end_time,
                );

                return (
                  <TableRow
                    key={slotLabel}
                    className="*:border-border [&>:not(:last-child)]:border-r"
                  >
                    {/* Time slot label column — price + optional weekend discount subtext */}
                    <TableCell className="text-xs font-medium py-1.5 whitespace-nowrap">
                      {(() => {
                        // Derive the default (weekday) price for this slot.
                        // We pick Monday as a reference day since it's always
                        // covered by the Default Rate (Mon–Fri) rule.
                        const monday = new Date();
                        monday.setDate(
                          monday.getDate() - ((monday.getDay() + 6) % 7),
                        );
                        const defaultPrice = getPriceForSlot(
                          pricingRules,
                          monday,
                          slot.start_time,
                        );

                        const discount = getWeekendDiscountForSlot(
                          pricingRules,
                          slot.start_time,
                        );

                        return (
                          <>
                            <span>
                              {slotLabel}
                              {defaultPrice !== null && (
                                <span className="font-normal text-muted-foreground">
                                  {" "}·{" "}₱{defaultPrice.toFixed(0)}
                                </span>
                              )}
                            </span>
                            {discount && (
                              <span className="block text-[10px] font-normal text-muted-foreground mt-0.5 leading-tight">
                                {discount.label} ₱{discount.price.toFixed(0)}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </TableCell>

                    {visibleDays.map((day) => {
                      // ── 4.3 / 4.5 Resolve price from active pricing rules ──
                      const price = getPriceForSlot(
                        pricingRules,
                        day.date,
                        slot.start_time,
                      );

                      // No rule covers this day+slot → show unavailable dash
                      if (price === null) {
                        return (
                          <TableCell
                            key={`${day.key}-${slotLabel}`}
                            className="text-xs text-center py-1.5 text-muted-foreground/30"
                          >
                            —
                          </TableCell>
                        );
                      }

                      const value = getCellStatus(
                        day.date,
                        slot.start_time,
                        slot.end_time,
                      );
                      const past = isPastSlot(day.date, slot.start_time);
                      const slotKey = `${toDateKey(day.date)}::${slotLabel}`;
                      const selected = selectedSlots.has(slotKey) && !past;
                      const bookable = value === "Open" && !past;

                      return (
                        <TableCell
                          key={`${day.key}-${slotLabel}`}
                          onClick={() =>
                            handleCellClick(day.date, slot, value, price)
                          }
                          className={`text-xs text-center py-1.5 transition-colors
                            ${past ? "" : statusStyles[value]}
                            ${bookable ? "hover:underline cursor-pointer" : ""}
                            ${selected ? "bg-[#c8a461] text-white font-medium" : ""}
                          `}
                        >
                          {past
                            ? ""
                            : selected
                              ? "✓ Selected"
                              : value === "Open"
                                ? "Open"
                                : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
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
              bookingSlots={bookingSlots}
              onBookingSubmitted={() => {
                setSelectedSlots(new Map());
                onBookingSubmitted();
              }}
              formType={"homepage"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
