"use client";

import { useState, useEffect, useCallback } from "react";

import { EllipsisVertical } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

import { CourtForm } from "@/components/admin/court/court-form";
import { CourtKPIs } from "@/components/admin/court/court-kpis";

export default function CourtPage() {
  const [tabValue, setTabValue] = useState("all");
  const [courts, setCourts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const courtsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/courts`);
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
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <CourtKPIs courts={courts} bookings={bookings} />
      
      <div className="w-full">
        <Tabs defaultValue="all" value={tabValue} onValueChange={setTabValue}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList variant="default">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="unavailable">Unavailable</TabsTrigger>
              </TabsList>

              <Dialog>
                <DialogTrigger
                  render={<Button variant="default">Create New Court</Button>}
                />

                <CourtForm formType={"create"} />
              </Dialog>
            </div>

            <CourtTable tabValue={tabValue} courts={courts} />
          </Tabs>
      </div>
    </div>
  );
}

type Courts = any;

export function CourtTable({ tabValue, courts }: { tabValue: string, courts: Courts[] }) {
  return (
    <TabsContent value={tabValue} className="mt-4">
      <div className="w-full">
        <div className="overflow-hidden rounded-md border">
          <Table className="w-full table-fixed">
            <TableHeader>
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
                      <div className="truncate">{court.status}</div>
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
