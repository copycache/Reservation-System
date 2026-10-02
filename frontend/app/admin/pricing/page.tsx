"use client";

import { useState, useEffect, useCallback } from "react";

import { EllipsisVertical, Plus, Search } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

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
import { Badge } from "@/components/ui/badge";

import { PricingForm } from "@/components/admin/pricing/pricing-form";
import { formatTime } from "@/lib/format_time";
import { PricingKPIs } from "@/components/admin/pricing/pricing-kpis";

export default function PricingPage() {
  const [tabValue, setTabValue] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ── 3.5 Shared refresh key: incrementing it causes PricingTable to re-fetch ──
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // ── 3.5 Create dialog open state ─────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);

  const [pricings, setPricings] = useState<any[]>([]);

  const loadPricings = useCallback(async () => {
    try {
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

  function handleCreateSuccess() {
    setCreateOpen(false);
    triggerRefresh();
  }

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Revenue management
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Pricing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure hourly rates and the schedules that govern court pricing.
          </p>
        </div>

        <PricingKPIs pricings={pricings} />

        <div className="w-full">
          <Tabs defaultValue="all" value={tabValue} onValueChange={setTabValue}>
            <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <TabsList
                variant="default"
                className="order-2 h-auto w-full justify-start gap-1 bg-transparent p-0 lg:order-1 lg:w-auto"
              >
                <TabsTrigger value="all">All rules</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="unavailable">Unavailable</TabsTrigger>
              </TabsList>

              <div className="order-1 flex w-full flex-col gap-2 sm:flex-row lg:order-2 lg:w-auto">
                <div className="relative w-full lg:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by pricing rule"
                    aria-label="Search pricing rules"
                    className="h-9 pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger
                    render={
                      <Button className="h-9 shrink-0">
                        <Plus className="size-4" />
                        Add pricing rule
                      </Button>
                    }
                  />
                  <PricingForm formType="create" onSuccess={handleCreateSuccess} />
                </Dialog>
              </div>
            </div>
            <PricingTable pricings={pricings} tabValue={tabValue} refreshKey={refreshKey} onRefresh={triggerRefresh} searchQuery={searchQuery} />
          </Tabs>
        </div>
      </div>
    </main>
  );
}

type pricings = any;

export function PricingTable({
  pricings,
  tabValue,
  refreshKey,
  onRefresh,
  searchQuery,
}: {
  pricings: any[];
  tabValue: string;
  refreshKey: number;
  onRefresh: () => void;
  searchQuery?: string;
}) {
  // ── Per-row dialog open state keyed by pricing_rule_id ───────────────────
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  function handleEditSuccess() {
    setOpenDialogId(null);
    onRefresh();
  }

  return (
    <TabsContent value={tabValue} className="mt-4">
      <div className="w-full">
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
          <Table className="w-full min-w-[760px] table-fixed">
            <TableHeader className="bg-muted/50">
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
                    tabValue === "all" || pricing.status === tabValue,
                )
                .filter((pricing) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return String(pricing.name || "").toLowerCase().includes(query);
                })
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

                  const statusLabel =
                    pricing.status === "active"
                      ? "Active"
                      : pricing.status === "maintenance"
                      ? "Maintenance"
                      : "Unavailable";

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
                        <Badge
                          variant="outline"
                          className={`capitalize ${
                            pricing.status === "active"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              : pricing.status === "maintenance"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {statusLabel}
                        </Badge>
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
