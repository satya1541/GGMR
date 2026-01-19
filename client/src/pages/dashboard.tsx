import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { WorldMap } from "@/components/dashboard/WorldMap";
import { DeviceStatusChart } from "@/components/dashboard/DeviceStatusChart"; // Keep original status chart as dedicated component
import { AdvancedPieCharts } from "@/components/dashboard/charts/AdvancedPieCharts";
import { AdvancedLineCharts } from "@/components/dashboard/charts/AdvancedLineCharts";
import { AdvancedBarCharts } from "@/components/dashboard/charts/AdvancedBarCharts";
import { SpecializedCharts } from "@/components/dashboard/charts/SpecializedCharts";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Device } from "@shared/schema";
import { useEffect, useMemo } from "react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { toast } from "sonner";

// Interface matching server/services/ai.ts
interface InferredMetadata {
  originalKey: string;
  label: string;
  unit: string;
  description: string;
  category: "sensor" | "status" | "technical" | "other";
}

export default function Dashboard() {
  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["/api/devices"]
  });

  const { data: readings = [] } = useQuery<any[]>({
    queryKey: ["/api/readings/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/readings/history");
      const data = await res.json();
      return data.reverse();
    }
  });

  // Now returns metadata objects instead of strings
  const { data: activeTypes = [] } = useQuery<InferredMetadata[]>({
    queryKey: ["/api/readings/types"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const queryClient = useQueryClient();

  // WebSocket logic...
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "update") {
        if (message.data && message.data.reading) {
          const newReading = message.data.reading;
          queryClient.setQueryData<any[]>(["/api/readings/history"], (old) => {
            const current = old || [];
            return [...current, newReading].slice(-2000);
          });
          // For metadata, we might need a refresh if it's a new type
          // We can just invalidate strictly
          queryClient.invalidateQueries({ queryKey: ["/api/readings/types"] });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      }
    };
    return () => socket.close();
  }, [queryClient]);

  const onlineCount = devices.filter(d => d.status === 'connected' || d.status === 'Connected').length;
  const offlineCount = devices.filter(d => d.status === 'offline' || d.status === 'Offline').length;
  const errorCount = devices.filter(d => d.status === 'error' || d.status === 'Error').length;

  const statusData = [
    { name: 'Online', value: onlineCount, color: '#10b981' },
    { name: 'Offline', value: offlineCount, color: '#ec4899' },
    { name: 'Error', value: errorCount, color: '#f87171' },
  ];

  const hasGps = readings.some((r: any) =>
    ['lat', 'lon', 'latitude', 'longitude'].some(k => r.type.toLowerCase().includes(k))
  );

  const handleExport = (filename: string, data: any[]) => {
    if (!data.length) return toast.error("No data");
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${filename}_${new Date().toISOString()}.csv`;
    link.click();
    toast.success(`Exported ${filename}`);
  };

  // Universal Smart Configuration
  const getSmartConfig = (typeKey: string, data: any[]) => {
    if (!data.length) return [];

    const latest = data[data.length - 1];
    const val = latest.value;

    // 1. Analyze Data Type
    const isNumber = !isNaN(parseFloat(val)) && isFinite(val);

    // 2. Dynamic Min/Max Calculation from History
    const values = data.map(d => Number(d.value)).filter(n => !isNaN(n));
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal;

    // Buffer for gauge to avoid needle hitting edges
    const gaugeMin = Math.floor(minVal - (range * 0.1));
    const gaugeMax = Math.ceil(maxVal + (range * 0.1));

    // 3. Deterministic Selection
    if (isNumber) {
      const k = typeKey.toLowerCase();

      // CATEGORY A: High Speed / Rotation / Percentages -> GAUGE + SPLINE
      if (k.includes('rpm') || k.includes('speed') || k.includes('percent')) {
        return [
          { title: 'Current Status', component: SpecializedCharts, props: { variant: 'gauge' as const, min: gaugeMin, max: gaugeMax } },
          { title: 'Trend', component: AdvancedLineCharts, props: { variant: 'spline' as const } }
        ];
      }

      // CATEGORY B: Flow / Traffic / Volume -> AREA + HEATMAP
      if (k.includes('traffic') || k.includes('flow') || k.includes('amp') || k.includes('rate')) {
        return [
          { title: 'Volume Flow', component: AdvancedLineCharts, props: { variant: 'area' as const } },
          { title: 'Density', component: SpecializedCharts, props: { variant: 'heatmap' as const } }
        ];
      }

      // CATEGORY C: Pressure / Voltage / Discrete Levels -> BAR + LOLLIPOP
      if (k.includes('press') || k.includes('volt') || k.includes('count') || k.includes('level')) {
        return [
          { title: 'Recent Levels', component: AdvancedBarCharts, props: { variant: 'bar' as const } },
          { title: 'Distribution', component: AdvancedBarCharts, props: { variant: 'lollipop' as const } }
        ];
      }

      // CATEGORY D: Temperature / Environmental -> CANDLESTICK (for volatility) + GAUGE
      // We use Candlestick here specifically for Temperatures/Humidity to show min/max range stability
      if (k.includes('temp') || k.includes('hum') || k.includes('env')) {
        return [
          {
            title: 'Fluctuation Range (OHLC)',
            component: SpecializedCharts,
            props: { variant: 'candlestick' as const }
          },
          {
            title: 'Current Status',
            component: SpecializedCharts,
            props: { variant: 'gauge' as const, min: gaugeMin, max: gaugeMax }
          }
        ];
      }

      // Default Fallback: Line + Gauge
      return [
        { title: 'Live Trend', component: AdvancedLineCharts, props: { variant: 'line' as const } },
        { title: 'Monitor', component: SpecializedCharts, props: { variant: 'gauge' as const, min: gaugeMin, max: gaugeMax } }
      ];

    } else {
      // Non-Number (String/Boolean/Categorical)
      return [
        { title: 'Category Distribution', component: AdvancedPieCharts, props: { variant: 'pie' as const } },
        { title: 'Frequency', component: AdvancedPieCharts, props: { variant: 'donut' as const } }
      ];
    }
  };

  if (devices.length === 0 && readings.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
          <div className="p-6 rounded-full bg-primary/10 mb-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white">Waiting for Stream Data...</h2>
          <p className="text-muted-foreground max-w-md text-center">
            No active devices or telemetry detected. Please connect a device via MQTT or wait for the next heartbeat.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {/* Fixed System Cards */}
        {hasGps && (
          <div className="col-span-1 h-[300px]">
            <DashboardCard title="Field Map Location" className="h-full">
              <WorldMap readings={readings} />
            </DashboardCard>
          </div>
        )}

        <div className="col-span-1 h-[300px]">
          <DashboardCard title="Device Status" className="h-full">
            <DeviceStatusChart data={statusData} />
          </DashboardCard>
        </div>

        <div className="col-span-1 h-[300px]">
          <DashboardCard title="System Type Distribution" className="h-full">
            <AdvancedPieCharts
              data={activeTypes.map(meta => ({ name: meta.label, value: readings.filter((r: any) => r.type === meta.originalKey).length }))}
              variant="semicircle"
            />
          </DashboardCard>
        </div>

        {/* Dynamic Cards By Sensor Type (AI Enriched) */}
        {activeTypes.map((meta, i) => {
          const typeKey = meta.originalKey;

          // Helper to get device name
          const getDeviceName = (id: number) => devices.find(d => d.id === id)?.name || `Device ${id}`;

          const TypeData = readings
            .filter((r: any) => r.type === typeKey)
            .map(r => ({ ...r, deviceName: getDeviceName(r.deviceId) })); // Enrich with Name

          if (!TypeData.length) return null;

          const configs = getSmartConfig(typeKey, TypeData);

          // Color based on original key for consistency, or category
          const color = (typeKey.includes('temp') || typeKey.includes('err')) ? '#ef4444' :
            (typeKey.includes('hum') || typeKey.includes('water')) ? '#3b82f6' :
              (typeKey.includes('volt') || typeKey.includes('power')) ? '#eab308' : '#10b981';

          return configs.map((config, idx) => {
            const ChartComponent = config.component as any;

            // Render: "Temperature Trend" or "Temperature (C) Trend"
            const cardTitle = `${meta.label} ${meta.unit ? `(${meta.unit}) ` : ''}${config.title}`;

            // Unique key for strict reconciliation
            return (
              <div key={`${typeKey}-${idx}`} className="col-span-1 h-[300px] animate-in fade-in zoom-in duration-500">
                <DashboardCard
                  title={cardTitle}
                  className="h-full"
                  onExport={() => handleExport(cardTitle, TypeData)}
                >
                  <ChartComponent
                    data={TypeData}
                    type={meta.label} // Use readable label for tooltip
                    unit={meta.unit}  // Pass unit for tooltip
                    color={color}
                    {...config.props}
                  />
                  {/* Optional: Add AI Description tooltip/icon here in future */}
                </DashboardCard>
              </div>
            )
          });
        })}
      </div>
    </DashboardLayout>
  );
}
