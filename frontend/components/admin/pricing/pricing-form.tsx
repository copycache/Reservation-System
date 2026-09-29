"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PascalCase } from "@/lib/word_case";

// ─── Types ───────────────────────────────────────────────────────────────────

type PricingRuleSchedule = {
  pricing_rule_schedule_id: number;
  pricing_rule_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

type Pricing = {
  pricing_rule_id: number;
  court_id: number | null;
  name: string;
  type: string;
  price: string;
  priority: number;
  status: "active" | "maintenance" | "unavailable";
  pricing_rule_schedules: PricingRuleSchedule[];
};

type PricingFormProps = {
  formType: string;
  pricingId?: number;
  /** Called after a successful create or update so the parent can refresh its list and close the dialog. */
  onSuccess?: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALL_DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

/**
 * Convert a nullable court_id from the API back to the form's slug format.
 * null → "all", 1 → "court_1", etc.
 */
function courtIdToSlug(courtId: number | null): string {
  if (courtId === null) return "all";
  return `court_${courtId}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PricingForm({ formType, pricingId, onSuccess }: PricingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [pricing, setPricing] = useState<Pricing | null>(null);

  const isCreate = formType === "create";

  // ── 3.6 Derive the active day set from the loaded schedules ─────────────
  // On edit, pre-tick whichever days the existing rule covers.
  // On create, default to Mon–Fri.
  const activeDays: Set<string> = pricing
    ? new Set(pricing.pricing_rule_schedules.map((s) => s.day_of_week))
    : new Set(["mon", "tue", "wed", "thu", "fri"]);

  const [checkedDays, setCheckedDays] = useState<Set<string>>(activeDays);

  useEffect(() => {
    setCheckedDays(activeDays);
  }, [pricing]);

  // ── 3.6 Derive start/end time from first schedule row (all rows share the same time) ──
  const firstSchedule = pricing?.pricing_rule_schedules?.[0];
  // API returns "HH:mm:ss" — slice to "HH:mm" for the time input
  const defaultStartTime = firstSchedule
    ? firstSchedule.start_time.slice(0, 5)
    : "15:00";
  const defaultEndTime = firstSchedule
    ? firstSchedule.end_time.slice(0, 5)
    : "22:00";

  const loadPricing = useCallback(async () => {
    if (!pricingId || isCreate) return;

    setIsLoading(true);
    setError("");

    try {
      // Relative URL — Next.js rewrites /api/* → Laravel.
      // The middleware injects the auth_token cookie as a Bearer header automatically.
      const response = await fetch(`/api/admin/pricings/${pricingId}`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Failed to load pricing");

      const result: Pricing = await response.json();
      setPricing(result);
    } catch (err) {
      console.error("Failed to load pricing:", err);
      setError("Failed to load pricing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [pricingId, isCreate]);

  useEffect(() => {
    if (!isCreate) {
      loadPricing();
    }
  }, [isCreate, loadPricing]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    // ── 3.1 Fix: use "price_per_hour" (the actual input name) ──────────────
    // ── 3.2 Fix: getAll("days") captures every checked checkbox ────────────
    const pricingData = {
      pricing_name: String(formData.get("pricing_name") || ""),
      court: String(formData.get("court") || "all"),
      days: Array.from(checkedDays),           // array of day slugs from controlled state
      start_time: String(formData.get("start_time") || ""),
      end_time: String(formData.get("end_time") || ""),
      price_per_hour: String(formData.get("price_per_hour") || ""),
      priority: String(formData.get("priority") || "0"),
      status: String(formData.get("status") || "active"),
    };

    try {
      // Relative URL — Next.js rewrites /api/* → Laravel.
      // The middleware injects the auth_token cookie as a Bearer header automatically.
      // No manual Authorization header needed here.
      const url = isCreate
        ? "/api/admin/pricings"
        : `/api/admin/pricings/${pricingId}`;

      const response = await fetch(url, {
        method: isCreate ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(pricingData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Surface Laravel validation errors or generic message
        const message =
          result?.message ||
          (isCreate
            ? "Failed to create pricing. Please try again."
            : "Failed to update pricing. Please try again.");
        throw new Error(message);
      }

      // ── 3.5 Close dialog + trigger parent list refresh ──────────────────
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Pricing request failed:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{PascalCase(formType)} Pricing</DialogTitle>
      </DialogHeader>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Loading Pricing...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldSet>
            <FieldGroup>
              {/* Name */}
              <Field>
                <FieldLabel htmlFor="pricing_name">Name</FieldLabel>
                <Input
                  id="pricing_name"
                  name="pricing_name"
                  placeholder="Peak Rate"
                  // ── 3.6 Populate from fetched data (edit mode) ──────────
                  defaultValue={pricing?.name ?? ""}
                  required
                />
              </Field>

              {/* Court */}
              <Field>
                <FieldLabel htmlFor="court">Court</FieldLabel>

                {/* ── 3.3 Convert null court_id back to "all" slug for the select ── */}
                <Select
                  name="court"
                  defaultValue={
                    pricing ? courtIdToSlug(pricing.court_id) : "all"
                  }
                  required
                >
                  <SelectTrigger id="court">
                    <SelectValue placeholder="Select court" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All Courts</SelectItem>
                    <SelectItem value="court_1">Court 1</SelectItem>
                    <SelectItem value="court_2">Court 2</SelectItem>
                    <SelectItem value="court_3">Court 3</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* Days */}
              <Field>
                <FieldLabel>Days</FieldLabel>

                <div className="flex flex-wrap gap-3">
                  {ALL_DAYS.map(({ value, label }) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`day-${value}`}
                        checked={checkedDays.has(value)}
                        onCheckedChange={(checked) => {
                          setCheckedDays((prev) => {
                            const next = new Set(prev);
                            if (checked) {
                              next.add(value);
                            } else {
                              next.delete(value);
                            }
                            return next;
                          });
                        }}
                      />
                      <Label
                        htmlFor={`day-${value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </Field>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="start_time">Start Time</FieldLabel>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    // ── 3.6 Populate from first schedule row ────────────
                    defaultValue={defaultStartTime}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="end_time">End Time</FieldLabel>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    defaultValue={defaultEndTime}
                    required
                  />
                </Field>
              </div>

              {/* Price / Hour */}
              <Field>
                <FieldLabel htmlFor="price_per_hour">Price / Hour</FieldLabel>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₱
                  </span>

                  {/* ── 3.1 name="price_per_hour" matches the backend field ── */}
                  <Input
                    id="price_per_hour"
                    name="price_per_hour"
                    type="number"
                    min="0"
                    // ── 3.6 pricing.price is the API field (not price_per_hour) ──
                    defaultValue={pricing?.price ?? "400"}
                    className="pl-7"
                    required
                  />
                </div>
              </Field>

              {/* Priority */}
              <Field>
                <FieldLabel htmlFor="priority">Priority</FieldLabel>

                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  min="0"
                  defaultValue={pricing?.priority ?? 10}
                  required
                />
              </Field>

              {/* Status */}
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>

                <Select
                  name="status"
                  defaultValue={pricing ? pricing.status : "active"}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {error && <FieldError>{error}</FieldError>}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                {/* ── 3.5 Cancel calls onSuccess to close the dialog ── */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => onSuccess?.()}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Pricing"}
                </Button>
              </div>
            </FieldGroup>
          </FieldSet>
        </form>
      )}
    </DialogContent>
  );
}
