"use client";

import { useState, useEffect } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { DayCalendar } from "@/components/admin/dashboard/calendar-tabs";
import { formatDate } from "@/lib/format_date";

type Court = {
  court_id: number;
  court_name: string;
  type: string;
  capacity: number;
  status: string;
};

export function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await fetch("/api/admin/courts");
        if (res.ok) {
          const data: Court[] = await res.json();
          setCourts(data);
          if (data.length > 0) {
            setActiveTab(data[0].court_id.toString());
          }
        }
      } catch (error) {
        console.error("Failed to fetch courts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourts();
  }, []);

  const handleToday = () => setCurrentDate(new Date());

  const handleBack = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  return (
    <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full rounded-lg border">
        <div className="flex items-center justify-between border-b p-4">
          <ButtonGroup>
            <Button variant="outline" onClick={handleToday}>Today</Button>
            <Button variant="outline" onClick={handleBack}>Back</Button>
            <Button variant="outline" onClick={handleNext}>Next</Button>
          </ButtonGroup>

          <div>
            <p className="text-base font-semibold">
              {currentDate
                .toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })
                .replace(",", "")}
            </p>
          </div>

          <TabsList>
            {loading ? (
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            ) : courts.length > 0 ? (
              courts.map((court) => (
                <TabsTrigger key={court.court_id} value={court.court_id.toString()}>
                  {court.court_name}
                </TabsTrigger>
              ))
            ) : (
              <div className="text-sm text-muted-foreground px-4">No courts found</div>
            )}
          </TabsList>
        </div>
        {!loading && courts.map((court) => (
          <TabsContent key={court.court_id} value={court.court_id.toString()}>
            {" "}
            <DayCalendar date={currentDate} courtId={court.court_id} />{" "}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
