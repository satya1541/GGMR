import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { format } from "date-fns";

interface ChartProps {
    data: any[];
    type?: string; // Sensor type Label
    unit?: string; // Sensor Unit
    variant?: "line" | "spline" | "area" | "step" | "stream";
    color?: string;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow-lg text-xs">
                <p className="font-semibold text-gray-300">{label}</p>
                <div className="flex flex-col gap-1 mt-1">
                    <p style={{ color: payload[0].color }}>
                        {payload[0].name}: <span className="font-mono">{Number(payload[0].value).toFixed(2)} {unit}</span>
                    </p>
                    {data.deviceName && (
                        <p className="text-gray-400 italic text-[10px]">
                            Source: {data.deviceName}
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export function AdvancedLineCharts({ data, type = "Value", unit = "", variant = "spline", color = "#8884d8" }: ChartProps) {
    // Format timestamps
    const chartData = data.map(d => ({
        ...d,
        formattedTime: d.timestamp ? format(new Date(d.timestamp), "HH:mm:ss") : ""
    }));

    const isArea = variant === "area" || variant === "stream";
    const isStep = variant === "step";
    const curveType = isStep ? "step" : (variant === "spline" || variant === "stream") ? "monotone" : "linear";

    if (isArea) {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`color${type.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="formattedTime" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={40} />
                    <Tooltip content={<CustomTooltip unit={unit} />} />
                    <Area
                        type={curveType as any}
                        dataKey="value"
                        name={type}
                        stroke={color}
                        fillOpacity={1}
                        fill={`url(#color${type.replace(/\s+/g, '')})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="formattedTime" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<CustomTooltip unit={unit} />} />
                <Line
                    type={curveType as any}
                    dataKey="value"
                    name={type}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
