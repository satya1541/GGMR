import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Wine } from "lucide-react";
import type { Reading } from "@shared/schema";

interface AlcoholGaugeProps {
    reading?: Reading;
}

export function AlcoholGauge({ reading }: AlcoholGaugeProps) {
    const value = reading?.value || 0;

    // Normalize value for gauge - typically BAC is 0.00 to 0.40
    const normalizedValue = Math.min(value, 0.20);

    const data = [
        { name: "Level", value: normalizedValue },
        { name: "Empty", value: 0.20 - normalizedValue },
    ];

    const COLORS = [value > 0.08 ? "#f87171" : "#f59e0b", "#334155"];

    return (
        <Card className="col-span-1 border-white/10 bg-white/5 backdrop-blur-md text-white h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alcohol Monitor (BAC)</CardTitle>
                <Wine className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full flex flex-col items-center justify-center mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="70%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center -mt-10 mb-4">
                        <span className="text-3xl font-bold block">{value.toFixed(3)}%</span>
                        <span className="text-xs text-gray-400">Safe Limit &lt; 0.08%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
