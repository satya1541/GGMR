import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LogsPage() {
    const [limit, setLimit] = useState("500");

    const { data: readings = [] as any[], isLoading, refetch } = useQuery<any[]>({
        queryKey: ["/api/readings/history", limit],
        queryFn: (context) => getQueryFn({ on401: "throw" })({ ...context, queryKey: [`/api/readings/history?limit=${limit}`] }) as Promise<any[]>
    });

    return (
        <DashboardLayout>
            <DashboardCard title="System Telemetry Logs" className="h-[calc(100vh-140px)]">
                <div className="flex flex-col h-full">
                    {/* Controls Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-border/50 pb-4">
                        <div className="text-xs text-muted-foreground">
                            Showing last <span className="text-primary font-bold">{readings.length}</span> entries
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="w-[100px] h-8 text-xs bg-black/20 border-white/10">
                                    <SelectValue placeholder="Limit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="100">100 entries</SelectItem>
                                    <SelectItem value="500">500 entries</SelectItem>
                                    <SelectItem value="1000">1000 entries</SelectItem>
                                    <SelectItem value="2000">2000 entries</SelectItem>
                                </SelectContent>
                            </Select>

                            <button
                                onClick={() => refetch()}
                                className="p-1.5 hover:bg-white/5 rounded text-muted-foreground hover:text-primary transition-colors"
                                title="Refresh Logs"
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Logs Table */}
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 -mr-4 pr-4">
                            <div className="w-full text-left text-sm font-mono relative overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="sticky top-0 bg-[#161616] z-10 text-xs uppercase text-muted-foreground font-semibold">
                                        <tr>
                                            <th className="pb-3 pl-2">Timestamp</th>
                                            <th className="pb-3">Type</th>
                                            <th className="pb-3">Value</th>
                                            <th className="pb-3">Unit</th>
                                            <th className="pb-3">Device ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                                        {readings.map((reading: any, i: number) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                <td className="py-2 pl-2 text-muted-foreground">
                                                    {reading.timestamp ? format(new Date(reading.timestamp), "MMM dd, HH:mm:ss.SSS") : "-"}
                                                </td>
                                                <td className="py-2 font-semibold">
                                                    <span className={`${reading.type === 'alert' ? 'text-destructive' :
                                                        reading.type === 'status' ? 'text-blue-400' : 'text-primary'
                                                        }`}>
                                                        {reading.type}
                                                    </span>
                                                </td>
                                                <td className="py-2">{reading.value}</td>
                                                <td className="py-2 text-muted-foreground">{reading.unit}</td>
                                                <td className="py-2 text-muted-foreground">#{reading.deviceId}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {readings.length === 0 && (
                                    <div className="text-center text-muted-foreground py-10">No logs found.</div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DashboardCard>
        </DashboardLayout>
    );
}
