"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";

import { DayCalendar } from "@/components/admin/dashboard/calendar-tabs";
import { formatDate } from "@/lib/format_date";

export function ScheduleCalendar() {
  const today = new Date();

  return (
    <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min">
      <Tabs defaultValue="overview" className="w-full rounded-lg border">
        <div className="flex items-center justify-between border-b p-4">
          <ButtonGroup>
            <Button variant="outline">Today</Button>
            <Button variant="outline">Back</Button>
            <Button variant="outline">Next</Button>
          </ButtonGroup>

          <div>
            <p className="text-base font-semibold">
              {today
                .toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })
                .replace(",", "")}
            </p>
          </div>

          <TabsList>
            <TabsTrigger value="1">Court 1</TabsTrigger>
            <TabsTrigger value="2">Court 1</TabsTrigger>
            <TabsTrigger value="3">Court 1</TabsTrigger>
            <TabsTrigger value="4">Court 1</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="1">
          {" "}
          <DayCalendar date={today} />{" "}
        </TabsContent>
        <TabsContent value="2"></TabsContent>
        <TabsContent value="3"></TabsContent>
        <TabsContent value="4"></TabsContent>
      </Tabs>
    </div>
  );
}
