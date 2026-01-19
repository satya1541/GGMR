import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Scatter, Cell
} from "recharts";
import { format } from "date-fns";

interface ChartProps {
    data: any[];
    type?: string;
    variant?: "bar" | "column" | "lollipop";
    color?: string;
}

export function AdvancedBarCharts({ data, type = "value", variant = "bar", color = "#8884d8" }: ChartProps) {
    const chartData = data.map(d => ({
        ...d,
        formattedTime: d.timestamp ? format(new Date(d.timestamp), "HH:mm:ss") : ""
    }));

    const isColumn = variant === "column"; // Horizontal bars
    const isLollipop = variant === "lollipop";

    if (isLollipop) {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="formattedTime" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={40} />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                        itemStyle={{ color: color }}
                        cursor={{ fill: "rgba(255,255,255,0.1)" }}
                    />
                    {/* Stem */}
                    <Bar dataKey="value" barSize={1} fill={color} isAnimationActive={false} />
                    {/* Head */}
                    <Scatter dataKey="value" fill={color} />
                </ComposedChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                layout={isColumn ? "vertical" : "horizontal"}
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} horizontal={!isColumn} vertical={isColumn} />
                {isColumn ? (
                    <>
                        <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="formattedTime" type="category" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={60} />
                    </>
                ) : (
                    <>
                        <XAxis dataKey="formattedTime" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={40} />
                    </>
                )}
                <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    itemStyle={{ color: color }}
                    cursor={{ fill: "rgba(255,255,255,0.1)" }}
                />
                <Bar dataKey="value" fill={color} radius={isColumn ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
                    {/* Optional: Gradient or varying colors */}
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8 + (index / chartData.length) * 0.2} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
