"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PascalCase } from "@/lib/word_case";

type Pricing = any;

type PricingFormProps = {
  formType: string;
  pricingId?: number;
};

export function PricingForm({ formType, pricingId }: PricingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [pricing, setPricing] = useState<Pricing | null>(null);

  const isCreate = formType === "create";

  const loadPricing = useCallback(async () => {
    if (!pricingId || isCreate) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/pricings/${pricingId}`,
      );

      const result = await response.json();

      setPricing(result);
    } catch (error) {
      console.error("Failed to load pricing:", error);
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

    const pricingData = {
      pricing_name: String(formData.get("pricing_name") || ""),
      court: String(formData.get("court") || ""),
      days: String(formData.get("days") || 0),
      start_time: String(formData.get("start_time") || ""),
      end_time: String(formData.get("end_time") || ""),
      price: String(formData.get("price") || ""),
      priority: String(formData.get("priority") || ""),
      status: String(formData.get("status") || ""),
    };

    try {
      const url = isCreate
        ? `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/pricings`
        : `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/pricings/${pricingId}`;

      const response = await fetch(url, {
        method: isCreate ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pricingData),
      });

      const result = await response.json();

      setPricing(result);
    } catch (error) {
      console.error("pricing request failed:", error);

      setError(
        isCreate
          ? "Failed to create pricing. Please try again."
          : "Failed to update pricing. Please try again.",
      );
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
                  defaultValue={pricing?.pricing_name ?? "Peak Rate"}
                  required
                />
              </Field>

              {/* Court */}
              <Field>
                <FieldLabel htmlFor="court">Court</FieldLabel>

                <Select
                  name="court"
                  defaultValue={pricing?.court ?? "all"}
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

                <div className="flex flex-wrap gap-4">
                  {[
                    ["mon", "Mon", true],
                    ["tue", "Tue", true],
                    ["wed", "Wed", true],
                    ["thu", "Thu", true],
                    ["fri", "Fri", true],
                    ["sat", "Sat", false],
                    ["sun", "Sun", false],
                  ].map(([value, label, checked]) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="days"
                        value={value}
                        defaultChecked={checked as boolean}
                        className="h-4 w-4"
                      />
                      {label}
                    </label>
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
                    defaultValue={pricing?.start_time ?? "15:00"}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="end_time">End Time</FieldLabel>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    defaultValue={pricing?.end_time ?? "22:00"}
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

                  <Input
                    id="price_per_hour"
                    name="price_per_hour"
                    type="number"
                    min="0"
                    defaultValue={pricing?.price_per_hour ?? 400}
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
                  defaultValue={pricing?.status ?? "active"}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="close">Close</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {error && <FieldError>{error}</FieldError>}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={isSubmitting}>
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
