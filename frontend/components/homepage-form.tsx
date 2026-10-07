"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format_date";
import { formatTime } from "@/lib/format_time";
import { getSettings } from "@/app/admin/settings/actions";

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
  triggerElement?: React.ReactNode;
  editData?: any;
  defaultCourtId?: string | number;
};

export function HomepageForm({ data, bookingSlots = [], onBookingSubmitted, formType, open: controlledOpen, onOpenChange: setControlledOpen, hideTrigger, triggerElement, editData, defaultCourtId }: BookingFormProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourts, setSelectedCourts] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [GcashName, setGcashName] = useState<string>("");
  const [GcashNumber, setGcashNumber] = useState<string>("");

  useEffect(() => {
    async function loadCourts() {
      try {
        const res = await fetch("/api/public/courts");
        if (res.ok) {
          const courtsData = await res.json();
          setCourts(courtsData);
          if (courtsData.length === 1) {
            setSelectedCourts([courtsData[0].court_id.toString()]);
          }
        }
      } catch (err) {
        console.error("Failed to load courts", err);
      }
    }
    loadCourts();
  }, []);

  useEffect(() => {
    getSettings().then((settings) => {
      setGcashName(settings?.GcashName || "")
      setGcashNumber(settings?.GcashNumber || "")
    })
  }, [GcashName, GcashNumber]);

  useEffect(() => {
    if (formType === "edit" && editData) {
      if (editData.slots && editData.slots.length > 1) {
        const allCourtIds = editData.slots.map((s: any) => s.court_id.toString());
        setSelectedCourts(Array.from(new Set(allCourtIds)));
      } else if (editData.court_id) {
        setSelectedCourts([editData.court_id.toString()]);
      }
      if (editData.status) setSelectedStatus(editData.status);
    } else {
      setSelectedStatus("");
      if (defaultCourtId) setSelectedCourts([defaultCourtId.toString()]);
    }
  }, [formType, editData, defaultCourtId]);

  // Compute the status of each court for the selected slots.
  const selectedSlotList = Array.from(data.values());
  const courtStatusMap = new Map<number, string>();
  
  bookingSlots.forEach((existing) => {
    if (!existing.court_id) return;
    // Skip current edit data so we don't disable the currently assigned court
    if (formType === "edit" && editData && existing.date === editData.date && existing.start_time === editData.start_time && existing.court_id === editData.court_id) {
      return;
    }
    if (existing.bookings?.status === "cancelled") return;
    if (!existing.status || existing.status === "open") return;
    
    const overlaps = selectedSlotList.some(
      (sel) =>
        sel.date === existing.date &&
        sel.start_time === existing.start_time &&
        sel.end_time === existing.end_time,
    );
    
    if (overlaps) {
      const currentStatus = courtStatusMap.get(existing.court_id);
      if (existing.status === "booked" || existing.status === "closed") {
        courtStatusMap.set(existing.court_id, "Booked");
      } else if (existing.status === "pending" && currentStatus !== "Booked") {
        courtStatusMap.set(existing.court_id, "Pending");
      } else if (!currentStatus) {
        courtStatusMap.set(existing.court_id, "Unavailable");
      }
    }
  });

  const [customerName, setCustomerName] = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [submittedSlots, setSubmittedSlots] = useState<BookingSlot[]>([]);
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const slots = Array.from(data.values());

  const total = slots.reduce((sum, slot) => {
    return sum + slot.subtotal;
  }, 0) * Math.max(1, selectedCourts.length);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError(null);

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") || "");
    const fbName = String(formData.get("fb_name") || "");
    const email = String(formData.get("email") || "");
    
    const submitter = (event.nativeEvent as any).submitter;
    const action = submitter?.value;

    let finalStatus = selectedStatus;
    if (formType === "edit") {
      if (action === "approve") finalStatus = "booked";
      if (action === "cancel_booking") finalStatus = "cancelled";
    }
    
    if (formType === "edit" && editData) {
      try {
        const slotsToUpdate = editData.slots || [{
          booking_slot_id: editData.booking_slot_id,
          court_id: selectedCourts[0] || "",
          id: editData.booking_slot_id
        }];
        
        await Promise.all(slotsToUpdate.map(async (slot: any) => {
          const slotId = slot.booking_slot_id || slot.id;
          const courtId = slotsToUpdate.length > 1 ? slot.court_id : (selectedCourts[0] || "");
          
          const response = await fetch(
            `/api/admin/dashboard_bookings/${slotId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name,
                fb_name: fbName,
                email,
                status: finalStatus,
                court_id: courtId,
                court_ids: slotsToUpdate.length > 1 ? [courtId] : selectedCourts,
              }),
            }
          );

          if (!response.ok) {
            const result = await response.json();
            throw new Error(result?.message || "Failed to update booking");
          }
        }));
        
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
    formData.append("court_ids", JSON.stringify(selectedCourts));
    selectedCourts.forEach((id) => formData.append("court_ids[]", id));
    
    if (formType !== "homepage") {
      formData.append("status", selectedStatus);
    }

    const apiUrl = formType === "homepage"
      ? "/api/home_bookings"
      : "/api/admin/dashboard_bookings";

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
              triggerElement ? (
                triggerElement
              ) : (
                <Button
                  size="lg"
                  disabled={data.size === 0}
                  className="px-8 py-6 cursor-pointer bg-[#d4a24c] text-white font-bold hover:bg-[#e1b45f]"
                >
                  Book my slot →
                </Button>
              )
            }
          />
        )}

        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-start justify-between pr-6">
                <DialogTitle className="text-lg font-semibold pb-3">
                  Confirm your booking
                </DialogTitle>
                {formType === "edit" && selectedStatus && (
                  <Badge 
                    variant="outline"
                    className={cn(
                      "capitalize font-bold border-transparent",
                      selectedStatus === "booked" ? "bg-green-500/20 text-green-700" :
                      selectedStatus === "cancelled" ? "bg-red-500/20 text-red-700" :
                      selectedStatus === "pending" ? "bg-yellow-500/20 text-yellow-700" :
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {selectedStatus === "booked" ? "Confirmed" : selectedStatus}
                  </Badge>
                )}
              </div>

              {slots.map((slot) => (
                <div
                  key={`${slot.date}-${slot.start_time}`}
                  className="text-xs text-muted-foreground pb-1"
                >
                  {formatDate(slot.date)} · {formatTime(slot.start_time)}-
                  {formatTime(slot.end_time)} — ₱{slot.subtotal.toFixed(0)}
                </div>
              ))}
              
              {formType !== "edit" && (
                <p className="text-xs font-bold border-t border-border py-2">
                  Total to send: ₱{total.toFixed(0)}
                </p>
              )}
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
                  readOnly={formType === "edit"}
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
                   readOnly={formType === "edit"}
                 />
               </Field>

              {formType !== "homepage" && formType !== "edit" && (
                <Field>
                  <Label htmlFor="status">Booking Status *</Label>
                  <Select name="status" required value={selectedStatus} onValueChange={(value) => setSelectedStatus(value ?? "")}>
                    <SelectTrigger className="h-11 focus-visible:ring-[#d4a24c]">
                      <SelectValue className="capitalize" placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="capitalize">
                      <SelectItem value="Open Play">Open Play</SelectItem>
                      <SelectItem value="Club">Club</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field>
                <Label>Select Court(s) *</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={formType === "edit"}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full min-h-11 h-auto justify-start font-normal focus-visible:ring-[#d4a24c] flex-wrap gap-1.5 px-3 py-2",
                      formType === "edit" ? "opacity-70 cursor-not-allowed" : ""
                    )}
                  >
                      {selectedCourts.length > 0
                        ? selectedCourts.map((id) => {
                            const courtName = courts.find((c) => c.court_id.toString() === id)?.type ?? id;
                            return (
                              <Badge key={id} variant="secondary" className="capitalize rounded-md bg-[#d4a24c]/10 text-[#d4a24c] hover:bg-[#d4a24c]/20 border-none font-semibold px-2 py-0.5 pointer-events-none">
                                {courtName}
                              </Badge>
                            );
                          })
                        : <span className="text-muted-foreground">Select court(s)</span>}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="capitalize w-[var(--radix-dropdown-menu-trigger-width)]">
                    {courts.map((court) => {
                      const status = courtStatusMap.get(court.court_id);
                      const disabled = !!status;
                      return (
                        <DropdownMenuCheckboxItem
                          key={court.court_id}
                          checked={selectedCourts.includes(court.court_id.toString())}
                          disabled={disabled}
                          className={disabled ? "opacity-50 cursor-not-allowed" : ""}
                          onSelect={(e) => {
                            e.preventDefault();
                          }}
                          onCheckedChange={(checked) => {
                            if (disabled) return;
                            const val = court.court_id.toString();
                            if (checked) {
                              setSelectedCourts(prev => [...prev, val]);
                            } else {
                              setSelectedCourts(prev => prev.filter(id => id !== val));
                            }
                          }}
                        >
                          {court.type} {status ? `(${status})` : ""}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedCourts.length === 0 && (
                  <input type="text" className="h-0 w-0 opacity-0 absolute" required value="" onChange={()=>{}} />
                )}
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
                  readOnly={formType === "edit"}
                />
              </Field>

              {formType !== "booking" && formType !== "edit" && (
                <Card className="bg-[#c9a55a]/10 border-[#c9a55a] border">
                  <CardContent>
                    <p className="text-xs">💸 Send your payment to</p>
                    <p className="text-base font-bold">GCash:  {GcashNumber}</p> {/* 09293759815 */}
                    <p>{GcashName}</p> {/* An***o S. */}
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

               {formType === "edit" && editData?.bookings && (
              <div className="mb-4 rounded-lg border border-border/50 bg-muted/10 p-4 text-sm space-y-2 mt-4">
                <p className="font-semibold text-primary border-b pb-2 mb-2">Additional Details</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-muted-foreground">Extra Players:</div>
                  <div className="font-medium">{editData.bookings.additional_players || '0'}</div>
                </div>

                {editData.bookings.payment_proof ? (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="text-muted-foreground text-xs mb-2">Proof of Payment:</div>
                    <div className="block rounded-md overflow-hidden border border-border">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_URL || ""}/storage/${editData.bookings.payment_proof}`}
                        alt="Payment Proof"
                        className="w-full max-h-[250px] object-contain bg-black/5 dark:bg-white/5"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )}

              
              
            </FieldGroup>

                        <DialogFooter className="mt-4 flex-col gap-2">
              {bookingError && (
                <p className="w-full text-center text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  ⚠️ {bookingError}
                </p>
              )}
              
              {/* ---> UPDATED BUTTONS <--- */}
              {formType === "edit" ? (
                <div className="flex w-full flex-row gap-3 mt-2">
                  <Button
                    type="submit"
                    name="action"
                    value="cancel_booking"
                    variant="destructive"
                    className="flex-1 h-12 rounded-xl"
                  >
                    Cancel Booking
                  </Button>
                  <Button
                    type="submit"
                    name="action"
                    value="approve"
                    className="flex-1 h-12 rounded-xl bg-[#d4a24c] font-bold text-white hover:bg-[#e1b45f]"
                  >
                    Approve
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-[#d4a24c] font-bold text-white hover:bg-[#e1b45f]"
                >
                  Submit booking
                </Button>
              )}
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
