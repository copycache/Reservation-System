"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format_date";
import { formatTime } from "@/lib/format_time";

type BookingSlot = {
  date: string;
  start_time: string;
  end_time: string;
  subtotal: number;
};

type BookingFormProps = {
  data: Map<string, BookingSlot>;
  onBookingSubmitted: () => void;
};

export function HomepageForm({ data, onBookingSubmitted }: BookingFormProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [submittedSlots, setSubmittedSlots] = useState<BookingSlot[]>([]);
  const [submittedTotal, setSubmittedTotal] = useState(0);

  const slots = Array.from(data.values());

  const total = slots.reduce((sum, slot) => {
    return sum + slot.subtotal;
  }, 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") || "");
    const fbName = String(formData.get("fb_name") || "");
    const email = String(formData.get("email") || "");
    const payment = formData.get("payment") as File;

    const bookingData = {
      name,
      fb_name: fbName,
      email,
      payment,
      slots,
      total,
    };

    try {
      const formData = new FormData(event.currentTarget);

      const name = String(formData.get("name") || "");
      const fbName = String(formData.get("fb_name") || "");
      const email = String(formData.get("email") || "");
      const payment = formData.get("payment");

      formData.append("slots", JSON.stringify(slots));
      formData.append("total", String(total));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/home_bookings`,
        {
          method: "POST",
          // headers: {
          //   "Content-Type": "application/json",
          // },
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to submit booking");
      }

      const newBookingNumber = result.data?.booking?.booking_number || "";

      setCustomerName(name);
      setBookingNumber(newBookingNumber);
      setSubmittedSlots(slots);
      setSubmittedTotal(total);

      setBookingOpen(false);
      setSuccessOpen(true);

      onBookingSubmitted();
    } catch (error) {
      console.error("Booking failed:", error);
    }
  }

  return (
    <>
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogTrigger
          render={
            <Button
              size="lg"
              disabled={data.size === 0}
              className="px-8 py-6 cursor-pointer bg-[#d4a24c] text-white font-bold hover:bg-[#e1b45f]"
            >
              Book my slot →
            </Button>
          }
        />

        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold pb-3">
                Confirm your booking
              </DialogTitle>

              {slots.map((slot) => (
                <div
                  key={`${slot.date}-${slot.start_time}`}
                  className="text-xs text-muted-foreground pb-1"
                >
                  {formatDate(slot.date)} · {formatTime(slot.start_time)}-
                  {formatTime(slot.end_time)} — ₱{slot.subtotal.toFixed(0)}
                </div>
              ))}

              <p className="text-xs font-bold border-t border-border py-2">
                Total to send: ₱{total.toFixed(0)}
              </p>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  className="h-11 focus-visible:ring-[#d4a24c]"
                />
              </Field>

              <Field>
                <Label htmlFor="fb_name">Facebook Name *</Label>
                <Input
                  id="fb_name"
                  name="fb_name"
                  placeholder="So we can reach you on Messenger"
                  className="h-11 focus-visible:ring-[#d4a24c]"
                />
              </Field>

              <Field>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Your receipt goes here"
                  className="h-11 focus-visible:ring-[#d4a24c]"
                />
              </Field>

              <Card className="bg-[#c9a55a]/10 border-[#c9a55a] border">
                <CardContent>
                  <p className="text-xs">💸 Send your payment to</p>
                  <p className="text-base font-bold">GCash 09293759815</p>
                  <p>An***o S.</p>
                  <p>
                    Then upload the screenshot below to confirm your booking.
                  </p>
                </CardContent>
              </Card>

              <Field>
                <Label htmlFor="payment">Payment Screenshot *</Label>
                <Input
                  id="payment"
                  name="payment"
                  type="file"
                  accept="image/*"
                  className="h-11 focus-visible:ring-[#d4a24c]"
                />
              </Field>
            </FieldGroup>

            <DialogFooter className="mt-4 sm:justify-center">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#d4a24c] font-bold text-primary hover:bg-[#e1b45f]"
              >
                Submit booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md py-14 px-8"
        >
          <DialogHeader>
            <DialogTitle>
              <div className="mx-auto text-center pb-4">
                <p className="text-4xl pb-4">✅</p>

                <p className="font-bold text-2xl pb-2">BOOKING RECEIVED</p>

                <p className="py-2 text-xs text-muted-foreground">
                  Booking number
                </p>

                <p className="font-black text-lg text-[#d4a24c]">
                  {bookingNumber}
                </p>
              </div>
            </DialogTitle>
            {submittedSlots.map((slot) => (
              <div
                key={`${slot.date}-${slot.start_time}`}
                className="text-xs text-muted-foreground pb-1"
              >
                {formatDate(slot.date)} · {formatTime(slot.start_time)}-
                {formatTime(slot.end_time)} — ₱{slot.subtotal.toFixed(0)}
              </div>
            ))}

            <p className="text-xs font-bold border-t border-border py-2">
              Total sent: ₱{submittedTotal.toFixed(0)} · {customerName}
            </p>
          </DialogHeader>

          <div className="mx-auto text-center">
            <p className="text-xs">
              📸 Please screenshot this page and send it to{" "}
              <span>THE BARRACKS COURT</span> Messenger. One of our admins will
              confirm your booking.
            </p>
          </div>

          <div className="mx-auto">
            <Button
              className="h-10 w-[61px] cursor-pointer rounded-lg border border-muted-foreground/20 bg-transparent p-0 text-sm font-normal text-primary hover:bg-transparent hover:border-muted-foreground"
              onClick={() => setSuccessOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
