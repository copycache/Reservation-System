"use client";

import { useState } from "react";
import Header from "@/components/header";
import ScheduleTable from "@/components/schedule-table";
import Footer from "@/components/footer";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <Header onRefresh={() => setRefreshKey((key) => key + 1)} />
      <ScheduleTable
        refreshKey={refreshKey}
        onBookingSubmitted={() => setRefreshKey((key) => key + 1)}
      />
      <Footer />
    </>
  );
}