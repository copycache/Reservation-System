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

export default function PricingPage() {
  const [tabValue, setTabValue] = useState("all");
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

              <Dialog>
                <DialogTrigger
                  render={<Button variant="default">Create New pricing</Button>}
                />

                <PricingForm formType={"create"} />
              </Dialog>
            </div>

            <PricingTable tabValue={tabValue} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}

type pricings = any;

export function PricingTable({ tabValue }: { tabValue: string }) {
  const [pricings, setPricings] = useState<pricings[]>([]);
  const loadPricings = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/pricings`,
      );
      const result = await response.json();
      setPricings(result);
    } catch {
    } finally {
    }
  }, []);

  useEffect(() => {
    loadPricings();
  }, [loadPricings]);
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
                .filter((pricing) => tabValue === "all" || pricing.is_active === tabValue)
                .map((pricing) => (
                  <TableRow
                    key={pricing.pricing_rule_id}
                    className="odd:bg-muted/50 odd:hover:bg-muted/50 hover:bg-transparent"
                  >
                    <TableCell className="px-4 font-medium">
                      <div className="truncate">{pricing.name}</div>
                    </TableCell>

                    <TableCell className="px-4">
                      <div className="truncate">{pricing.type}</div>
                    </TableCell>

                    <TableCell className="px-4">
                      <div className="truncate">days</div>
                    </TableCell>

                    <TableCell className="px-4 text-center">
                      {pricing.price}
                    </TableCell>
                    
                    <TableCell className="px-4 text-center">
                      {pricing.is_active}
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

                        <PricingForm formType={"view"} pricingId={pricing.pricing_rule_id} />
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
