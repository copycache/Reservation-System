"use client";

import { useState, useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";

import { formatDate } from "@/lib/format_date";
import { formatTime } from "@/lib/format_time";

type Bookings = any;

type ViewProps = {
  bookingId: number;
  ontableReload: () => void;
};

export function ViewBooking({ bookingId, ontableReload }: ViewProps) {
  const [bookings, setBooking] = useState<Bookings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadBookingSlots = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/booking/${bookingId}`,
      );
      const data = await response.json();
      setBooking(data);
    } catch {
    } finally {
    }
  }, []);

  useEffect(() => {
    loadBookingSlots();
  }, [loadBookingSlots]);

  const handleBookingAction = async (action: "approve" | "disapprove") => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/booking/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      setBooking(data);
      ontableReload();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Booking details</h2>

          <p className="mt-1 text-xs text-neutral-500">
            #{bookings?.booking_number}
          </p>
        </div>
        <div className="flex items-center gap-3"></div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
        {/* Customer */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Customer
          </h3>
          <div className="mt-2 space-y-1.5">
            <p className="text-sm font-medium text-white">
              {bookings?.customers.name || "—"}
            </p>
            <p className="text-sm text-neutral-400">
              Facebook: {bookings?.customers.facebook_name}
            </p>
            <p className="text-sm text-neutral-400">
              Email: {bookings?.customers.email}
            </p>
          </div>
        </section>

        <div className="my-5 border-t border-white/10" />

        {/* Schedule */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Schedule
          </h3>
          <div className="mt-2 space-y-3">
            {bookings?.booking_slots.map((booking_slot: any) => (
              <div
                key={booking_slot.booking_slot_id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {formatDate(booking_slot.date)} 
                    {booking_slot.court?.type && <span className="ml-2 text-neutral-400">({booking_slot.court.type})</span>}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {formatTime(booking_slot.start_time)} –{" "}
                    {formatTime(booking_slot.end_time)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#e0a458]">
                    {/* {formatCurrency(booking_slot.price)} */}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="my-5 border-t border-white/10" />

        {/* Payment */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Payment
          </h3>
          <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Subtotal</span>
              <span className="text-white">
                {/* {formatCurrency(booking.subtotal)} */}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Additional players</span>
              <span className="text-white">
                {/* {formatCurrency(booking.additional_player_fee)} */}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm font-semibold">
              <span className="text-neutral-300">Total</span>
              <span className="text-[#e0a458]">
                {/* {formatCurrency(booking.total_amount)} */}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="text-neutral-400">Status</span>
            </div>
            {bookings?.payment_proof && (
              <div className="mt-3">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || ""}/storage/${bookings.payment_proof}`}
                  alt="Payment proof"
                  className="w-full rounded-lg border border-white/10 object-contain"
                />
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 flex justify-end gap-3">
          {" "}
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleBookingAction("disapprove")}
          >
            {" "}
            {isSubmitting ? "Processing..." : "Disapprove"}{" "}
          </Button>{" "}
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleBookingAction("approve")}
          >
            {" "}
            {isSubmitting ? "Processing..." : "Approve"}{" "}
          </Button>{" "}
        </div>
      </div>
    </div>
  );
}
