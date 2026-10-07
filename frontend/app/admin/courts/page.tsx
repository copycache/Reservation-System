"use client";

import { useState, useEffect, useCallback } from "react";

import { EllipsisVertical, Plus, Search } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

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

import { CourtForm } from "@/components/admin/court/court-form";
import { CourtKPIs } from "@/components/admin/court/court-kpis";

export default function CourtPage() {
  const [tabValue, setTabValue] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [courts, setCourts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const courtsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courts`);
      const courtsData = await courtsRes.json();
      setCourts(courtsData);

      const bookingsRes = await fetch("/api/admin/booking", { headers: { Accept: "application/json" } });
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Facility management
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Courts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor court availability, capacity, and maintenance status.
          </p>
        </div>

        <CourtKPIs courts={courts} bookings={bookings} />

        <Tabs defaultValue="all" value={tabValue} onValueChange={setTabValue}>
          <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <TabsList
              variant="default"
              className="order-2 h-auto w-full justify-start gap-1 bg-transparent p-0 lg:order-1 lg:w-auto"
            >
              <TabsTrigger value="all">All courts</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="unavailable">Unavailable</TabsTrigger>
            </TabsList>

            <div className="flex order-1 w-full flex-col gap-2 sm:flex-row lg:order-2 lg:w-auto">
              <div className="relative w-full lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by court or type"
                  aria-label="Search courts"
                  className="h-9 pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog>
                <DialogTrigger
                  render={
                    <Button className="h-9 shrink-0">
                      <Plus className="size-4" />
                      Add court
                    </Button>
                  }
                />
                <CourtForm formType={"create"} />
              </Dialog>
            </div>
          </div>

          <CourtTable tabValue={tabValue} courts={courts} searchQuery={searchQuery} />
        </Tabs>
      </div>
    </main>
  );
}

type Courts = any;

export function CourtTable({ tabValue, courts, searchQuery }: { tabValue: string, courts: Courts[], searchQuery?: string }) {
  return (
    <TabsContent value={tabValue} className="mt-4">
      <div className="w-full">
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
          <Table className="w-full min-w-[680px] table-fixed">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[25%] px-4 font-semibold text-foreground">
                  Court
                </TableHead>

                <TableHead className="w-[20%] px-4 font-semibold text-foreground">
                  Type
                </TableHead>

                <TableHead className="w-[20%] px-4 font-semibold text-foreground">
                  Status
                </TableHead>

                <TableHead className="w-[20%] px-4 text-center font-semibold text-foreground">
                  Capacity
                </TableHead>

                <TableHead className="w-[15%] px-4 text-right font-semibold text-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {courts
                .filter((court) => tabValue === "all" || court.status === tabValue)
                .filter((court) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    String(court.court_name || "").toLowerCase().includes(query) ||
                    String(court.type || "").toLowerCase().includes(query)
                  );
                })
                .map((court) => (
                  <TableRow
                    key={court.court_id}
                    className="odd:bg-muted/50 odd:hover:bg-muted/50 hover:bg-transparent"
                  >
                    <TableCell className="px-4 font-medium">
                      <div className="truncate">{court.court_name}</div>
                    </TableCell>

                    <TableCell className="px-4">
                      <div className="truncate">{court.type}</div>
                    </TableCell>

                    <TableCell className="px-4">
                      <CourtStatus status={court.status} />
                    </TableCell>

                    <TableCell className="px-4 text-center">
                      {court.capacity}
                    </TableCell>

                    <TableCell className="px-4 text-right">
                      <Dialog>
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

                        <CourtForm formType={"view"} courtId={court.court_id} />
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TabsContent>
  );
}

function CourtStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    maintenance: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    unavailable: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  };

  return (
    <Badge variant="outline" className={`capitalize ${styles[status] ?? ""}`}>
      {status}
    </Badge>
  );
}
