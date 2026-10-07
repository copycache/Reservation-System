"use client";

import {
  useState,
  useCallback,
  useEffect,
  type FormEvent,
} from "react";

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

type Court = any;

type CourtFormProps = {
  formType: string;
  courtId?: number;
};

export function CourtForm({
  formType,
  courtId,
}: CourtFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [court, setCourt] = useState<Court | null>(null);

  const isCreate = formType === "create";

  const loadCourt = useCallback(async () => {
    if (!courtId || isCreate) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/courts/${courtId}`,
      );

      const result = await response.json();

      setCourt(result);
    } catch (error) {
      console.error("Failed to load court:", error);
      setError("Failed to load court. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [courtId, isCreate]);

  useEffect(() => {
    if (!isCreate) {
      loadCourt();
    }
  }, [isCreate, loadCourt]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const courtData = {
      court_name: String(formData.get("court_name") || ""),
      type: String(formData.get("type") || ""),
      capacity: Number(formData.get("capacity") || 0),
      status: String(formData.get("status") || ""),
    };

    try {
      const url = isCreate
        ? `/api/admin/courts`
        : `/api/admin/courts/${courtId}`;

      const response = await fetch(url, {
        method: isCreate ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courtData),
      });

      const result = await response.json();

      setCourt(result);
    } catch (error) {
      console.error("Court request failed:", error);

      setError(
        isCreate
          ? "Failed to create court. Please try again."
          : "Failed to update court. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {PascalCase(formType)} Court
        </DialogTitle>
      </DialogHeader>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Loading court...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="court_name">
                  Court Name
                </FieldLabel>

                <Input
                  id="court_name"
                  name="court_name"
                  placeholder="e.g. Court 1"
                  defaultValue={court?.court_name ?? ""}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="type">
                  Court Type
                </FieldLabel>

                <Select
                  name="type"
                  defaultValue={court?.type ?? ""}
                  required
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select court type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="basketball">
                      Basketball
                    </SelectItem>
                    <SelectItem value="volleyball">
                      Volleyball
                    </SelectItem>
                    <SelectItem value="tennis">
                      Tennis
                    </SelectItem>
                    <SelectItem value="badminton">
                      Badminton
                    </SelectItem>
                    <SelectItem value="futsal">
                      Futsal
                    </SelectItem>
                    <SelectItem value="other">
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="capacity">
                  Capacity
                </FieldLabel>

                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  placeholder="e.g. 20"
                  defaultValue={court?.capacity ?? ""}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="status">
                  Status
                </FieldLabel>

                <Select
                  name="status"
                  defaultValue={court?.status ?? ""}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="active">
                      Active
                    </SelectItem>
                    <SelectItem value="maintenance">
                      Maintenance
                    </SelectItem>
                    <SelectItem value="unavailable">
                      Unavailable
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {error && (
                <FieldError>
                  {error}
                </FieldError>
              )}

              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? isCreate
                      ? "Creating..."
                      : "Updating..."
                    : isCreate
                      ? "Create Court"
                      : "Update Court"}
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      )}
    </DialogContent>
  );
}