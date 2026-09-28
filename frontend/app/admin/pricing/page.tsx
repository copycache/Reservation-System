"use client";

import { useState, useEffect, useCallback } from "react";

import { EllipsisVertical } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import { PricingForm } from "@/components/admin/pricing/pricing-form";
import { formatTime } from "@/lib/format_time";

export default function PricingPage() {
  const [tabValue, setTabValue] = useState("all");

  // ── 3.5 Shared refresh key: incrementing it causes PricingTable to re-fetch ──
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // ── 3.5 Create dialog open state ─────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);

  function handleCreateSuccess() {
    setCreateOpen(false);
    triggerRefresh();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />

        <div className="col-span-full">
          <Tabs defaultValue="all" value={tabValue} onValueChange={setTabValue}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList variant="default">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="unavailable">Unavailable</TabsTrigger>
              </TabsList>

              {/* ── 3.5 Controlled dialog so we can close it from onSuccess ── */}
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger
                  render={<Button variant="default">Create New Pricing</Button>}
                />

                <PricingForm
                  formType="create"
                  onSuccess={handleCreateSuccess}
                />
              </Dialog>
            </div>

            <PricingTable tabValue={tabValue} refreshKey={refreshKey} onRefresh={triggerRefresh} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}

type pricings = any;

export function PricingTable({
  tabValue,
  refreshKey,
  onRefresh,
}: {
  tabValue: string;
  refreshKey: number;
  onRefresh: () => void;
}) {
  const [pricings, setPricings] = useState<pricings[]>([]);

  // ── Per-row dialog open state keyed by pricing_rule_id ───────────────────
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  const loadPricings = useCallback(async () => {
    try {
      // Relative URL — Next.js rewrites /api/* → Laravel.
      // The middleware injects the auth_token cookie as a Bearer header automatically.
      const response = await fetch("/api/admin/pricings", {
        headers: { Accept: "application/json" },
      });
      const result = await response.json();
      setPricings(result);
    } catch {
      // silently fail — keep the list empty
    }
  }, []);

  useEffect(() => {
    loadPricings();
  }, [loadPricings, refreshKey]);

  function handleEditSuccess() {
    setOpenDialogId(null);
    onRefresh();
  }

  return (
    <TabsContent value={tabValue} className="mt-4">
      <div className="w-full">
        <div className="overflow-hidden rounded-md border">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%] px-4 font-semibold text-foreground">
                  Name
                </TableHead>

                <TableHead className="w-[20%] px-4 font-semibold text-foreground">
                  Time
                </TableHead>

                <TableHead className="w-[20%] px-4 font-semibold text-foreground">
                  Days
                </TableHead>

                <TableHead className="w-[20%] px-4 text-center font-semibold text-foreground">
                  Rate
                </TableHead>

                <TableHead className="w-[20%] px-4 text-center font-semibold text-foreground">
                  Status
                </TableHead>

                <TableHead className="w-[15%] px-4 text-right font-semibold text-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pricings
                .filter(
                  (pricing) =>
                    tabValue === "all" || pricing.is_active === tabValue,
                )
                .map((pricing) => {
                  // Derive display values from the API shape
                  const schedules: { day_of_week: string; start_time: string; end_time: string }[] =
                    pricing.pricing_rule_schedules ?? [];

                  const days = schedules
                    .map((s: { day_of_week: string }) => s.day_of_week.charAt(0).toUpperCase() + s.day_of_week.slice(1))
                    .join(", ");

                  const firstSchedule = schedules[0];
                  const timeRange = firstSchedule
                    ? `${formatTime(firstSchedule.start_time)} – ${formatTime(firstSchedule.end_time)}`
                    : "—";

                  const statusLabel = pricing.is_active ? "Active" : "Closed";

                  return (
                    <TableRow
                      key={pricing.pricing_rule_id}
                      className="odd:bg-muted/50 odd:hover:bg-muted/50 hover:bg-transparent"
                    >
                      <TableCell className="px-4 font-medium">
                        <div className="truncate">{pricing.name}</div>
                      </TableCell>

                      <TableCell className="px-4">
                        <div className="truncate">{timeRange}</div>
                      </TableCell>

                      <TableCell className="px-4">
                        <div className="truncate">{days || "—"}</div>
                      </TableCell>

                      <TableCell className="px-4 text-center">
                        ₱{Number(pricing.price).toFixed(0)}/hr
                      </TableCell>

                      <TableCell className="px-4 text-center">
                        {statusLabel}
                      </TableCell>

                      <TableCell className="px-4 text-right">
                        {/* ── 3.5 Controlled dialog per row ─────────────── */}
                        <Dialog
                          open={openDialogId === pricing.pricing_rule_id}
                          onOpenChange={(open) =>
                            setOpenDialogId(open ? pricing.pricing_rule_id : null)
                          }
                        >
                          <DialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-auto size-8"
                              >
                                <EllipsisVertical className="size-4" />
                              </Button>
                            }
                          />

                          <PricingForm
                            formType="edit"
                            pricingId={pricing.pricing_rule_id}
                            onSuccess={handleEditSuccess}
                          />
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TabsContent>
  );
}
