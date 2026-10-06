import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/format_time";
import { useEffect, useState } from "react";
import { getSettings } from "@/app/admin/settings/actions";

type HeaderProps = {
  onRefresh: () => void;
};

export default function Header({ onRefresh }: HeaderProps) {
  const [lastUpdated, setLastUpdated] = useState(() => formatTime(new Date()));
  const [storeName, setStoreName] = useState("");
  const [storeLogo, setStoreLogo] = useState("");

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.storeName) {
        setStoreName(settings.storeName);
      }
      if (settings?.StoreLogo) {
        setStoreLogo(settings.StoreLogo);
      }
    });
  }, []);

  function handleRefresh() {
    setLastUpdated(formatTime(new Date()));
    onRefresh();
  }

  const legend = [
    { color: "#22c55e", label: "Open — tap to select" },
    { color: "#d4a24c", label: "Selected" },
    { color: "#f59e0b", label: "Pending confirmation", outline: true },
    { color: "#3b82f6", label: "Open Play", outline: true },
    { color: "#6b7280", label: "Booked" },
    { color: "#ef4444", label: "Court closed", outline: true },
    { color: "#8b5cf6", label: "Club", outline: true },
  ];

  return (
    <div className="max-w-5xl mx-auto pt-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-[#c9a55a]">
            LIVE AVAILABILITY
          </p>
          <div className="flex items-center gap-3">
            {storeLogo && (
              <img 
                src={storeLogo} 
                alt={`${storeName} Logo`} 
                className="w-10 h-10 rounded-full object-cover border border-muted"
              />
            )}
            <h1 className="text-3xl font-extrabold tracking-tight uppercase">
              {storeName}
            </h1>
          </div>
          <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
            <p>Open 8AM-10PM (til 12MN Fri &amp; Sat) · Max 10 players</p>
            <p>₱300/hr (8AM-3PM) | ₱400/hr (3PM-12MN)</p>
            <p className="text-xs">
              Excess players beyond 10: ₱100/head, settled at the venue
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Button
          variant="outline"
          size="lg"
          className="gap-2 text-muted-foreground cursor-pointer"
          onClick={handleRefresh}
        >
          Refresh
        </Button>
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdated}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-xs"
              style={
                item.outline
                  ? {
                      border: `1.5px solid ${item.color}`,
                      backgroundColor: `color-mix(in srgb, ${item.color} 50%, transparent)`,
                    }
                  : { backgroundColor: item.color }
              }
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
