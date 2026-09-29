"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type ExistingSlot = {
  date: string;
  start_time: string;
  end_time: string;
  court_id?: number | null;
  status?: string;
  bookings?: { status?: string } | null;
};

type BookingFormProps = {
  data: Map<string, BookingSlot>;
  bookingSlots?: ExistingSlot[];
  onBookingSubmitted: () => void;
  formType?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  editData?: any;
};

export function HomepageForm({ data, bookingSlots = [], onBookingSubmitted, formType, open: controlledOpen, onOpenChange: setControlledOpen, hideTrigger, editData }: BookingFormProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    async function loadCourts() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/public/courts`);
        if (res.ok) {
          const courtsData = await res.json();
          setCourts(courtsData);
          if (courtsData.length === 1) {
            setSelectedCourt(courtsData[0].court_id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load courts", err);
      }
    }
    loadCourts();
  }, []);

  useEffect(() => {
    if (formType === "edit" && editData) {
      if (editData.court_id) setSelectedCourt(editData.court_id.toString());
      if (editData.status) setSelectedStatus(editData.status);
    } else {
      setSelectedStatus("");
    }
  }, [formType, editData]);

  // Compute which court IDs are unavailable for the selected slots.
  // A court is "booked" if any existing non-cancelled slot overlaps
  // with any of the user's selected date + time combinations.
  const selectedSlotList = Array.from(data.values());
  const bookedCourtIds = new Set(
    bookingSlots
      .filter((existing) => {
        if (!existing.court_id) return false;
        // Skip current edit data so we don't disable the currently assigned court
        if (formType === "edit" && editData && existing.date === editData.date && existing.start_time === editData.start_time && existing.court_id === editData.court_id) {
          return false;
        }
        if (existing.bookings?.status === "cancelled") return false;
        if (!existing.status || existing.status === "open") return false;
        return selectedSlotList.some(
          (sel) =>
            sel.date === existing.date &&
            sel.start_time === existing.start_time &&
            sel.end_time === existing.end_time,
        );
      })
      .map((existing) => existing.court_id as number),
  );

  const [customerName, setCustomerName] = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [submittedSlots, setSubmittedSlots] = useState<BookingSlot[]>([]);
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const slots = Array.from(data.values());

  const total = slots.reduce((sum, slot) => {
    return sum + slot.subtotal;
  }, 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError(null);

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") || "");
    const fbName = String(formData.get("fb_name") || "");
    const email = String(formData.get("email") || "");
    
    if (formType === "edit" && editData) {
      formData.append("status", selectedStatus);
      formData.append("court_id", selectedCourt);
      
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/dashboard_bookings/${editData.booking_slot_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              fb_name: fbName,
              email,
              status: selectedStatus,
              court_id: selectedCourt,
            }),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Failed to update booking");
        }
        
        onBookingSubmitted();
        if (setControlledOpen) setControlledOpen(false);
        setBookingOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
        setBookingError(message);
        console.error("Booking edit failed:", error);
      }
      return;
    }

    // Normal POST booking handling below...
    const payment = formData.get("payment");
    formData.append("slots", JSON.stringify(slots));
    formData.append("total", String(total));
    
    if (formType !== "homepage") {
      formData.append("status", selectedStatus);
    }

    const apiUrl = formType === "homepage"
      ? `${process.env.NEXT_PUBLIC_API_URL || ""}/api/home_bookings`
      : `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/dashboard_bookings`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to submit booking");
      }

      const newBookingNumber = result.data?.booking?.booking_number || "";

      setCustomerName(name as string);
      setBookingNumber(newBookingNumber);
      setSubmittedSlots(slots);
      setSubmittedTotal(total);

      setBookingOpen(false);
      setSuccessOpen(true);

      onBookingSubmitted();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setBookingError(message);
      console.error("Booking failed:", error);
    }
  }

  return (
    <>
      <Dialog 
        open={controlledOpen !== undefined ? controlledOpen : bookingOpen} 
        onOpenChange={(open) => { 
          setBookingOpen(open); 
          if (setControlledOpen) setControlledOpen(open);
          if (!open) setBookingError(null); 
        }}
      >
        {!hideTrigger && (
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
        )}

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
                  defaultValue={formType === "edit" ? editData?.bookings?.customers?.name || "" : ""}
                  className="h-11 focus-visible:ring-[#d4a24c]"
                  required
                />
              </Field>

               <Field>
                 <Label htmlFor="fb_name">Facebook Name *</Label>
                 <Input
                   id="fb_name"
                   name="fb_name"
                   defaultValue={formType === "edit" ? editData?.bookings?.customers?.facebook_name || "" : ""}
                   placeholder="So we can reach you on Messenger"
                   className="h-11 focus-visible:ring-[#d4a24c]"
                   required
                 />
               </Field>

              {formType !== "homepage" && (
                <Field>
                  <Label htmlFor="status">Booking Status *</Label>
                  <Select name="status" required value={selectedStatus} onValueChange={(value) => setSelectedStatus(value ?? "")}>
                    <SelectTrigger className="h-11 focus-visible:ring-[#d4a24c]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_play">Open Play</SelectItem>
                      <SelectItem value="club">Club</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field>
                <Label htmlFor="court_id">Select Court *</Label>
                <Select name="court_id" required value={selectedCourt} onValueChange={(value) => setSelectedCourt(value ?? "")}>
                  <SelectTrigger className="h-11 focus-visible:ring-[#d4a24c]">
                    <SelectValue>
                      {selectedCourt
                        ? courts.find((c) => c.court_id.toString() === selectedCourt)?.type ?? selectedCourt
                        : <span className="text-muted-foreground">Select a court</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => {
                      const isBooked = bookedCourtIds.has(court.court_id);
                      return (
                        <SelectItem
                          key={court.court_id}
                          value={court.court_id.toString()}
                          disabled={isBooked}
                          className={isBooked ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {court.type}{isBooked ? " (Booked)" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={formType === "edit" ? editData?.bookings?.customers?.email || "" : ""}
                  placeholder="Your receipt goes here"
                  className="h-11 focus-visible:ring-[#d4a24c]"
                  required
                />
              </Field>

              {formType !== "booking" && formType !== "edit" && (
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
              )}

              {formType !== "edit" && (
                <Field>
                  <Label htmlFor="payment">
                    Payment Screenshot {formType === "booking" ? "(Optional)" : "*"}
                  </Label>
                  <Input
                    id="payment"
                    name="payment"
                    type="file"
                    accept="image/*"
                    className="h-11 focus-visible:ring-[#d4a24c]"
                    required={formType !== "booking"}
                  />
                </Field>
              )}
            </FieldGroup>

            <DialogFooter className="mt-4 sm:justify-center flex-col gap-2">
              {bookingError && (
                <p className="w-full text-center text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  ⚠️ {bookingError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#d4a24c] font-bold text-primary hover:bg-[#e1b45f]"
              >
                {formType === "edit" ? "Save Edit" : "Submit booking"}
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
