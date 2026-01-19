import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { Wind } from "lucide-react";
import type { Reading } from "@shared/schema";

interface AirQualityChartProps {
    reading?: Reading;
}

export function AirQualityChart({ reading }: AirQualityChartProps) {
    const value = reading?.value || 0;

    const data = [
        {
            name: "AQI",
            value: value,
            fill: value > 150 ? "#f87171" : value > 100 ? "#fbbf24" : "#10b981",
        }
    ];

    const getStatus = (val: number) => {
        if (val === 0) return "No Data";
        if (val <= 50) return "Good";
        if (val <= 100) return "Moderate";
        if (val <= 150) return "Unhealthy (SG)";
        return "Unhealthy";
    };

    return (
        <Card className="col-span-1 border-white/10 bg-white/5 backdrop-blur-md text-white h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Air Quality</CardTitle>
                <Wind className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={data}>
                            <PolarAngleAxis type="number" domain={[0, 500]} angleAxisId={0} tick={false} />
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={10}
                            />
                            <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-3xl font-bold">
                                {Math.round(value)}
                            </text>
                            <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-400 text-xs font-medium">
                                {getStatus(value)}
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
