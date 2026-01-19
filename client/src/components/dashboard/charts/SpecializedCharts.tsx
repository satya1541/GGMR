import {
    RadialBarChart, RadialBar, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, CartesianGrid
} from "recharts";
import { format } from "date-fns";
import { useMemo } from "react";

interface ChartProps {
    data: any[];
    type?: string;
    unit?: string;
    variant?: "gauge" | "candlestick" | "heatmap";
    color?: string;
    min?: number;
    max?: number;
}

// Candlestick Shape
const CandlestickShape = (props: any) => {
    const { x, y, width, height, low, high, open, close } = props;
    const isUp = close > open;
    const color = isUp ? "#10b981" : "#ef4444";
    // Scale-independent rendering logic
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={color} />
            <line x1={x + width / 2} y1={y - 5} x2={x + width / 2} y2={y + height + 5} stroke={color} strokeWidth={2} />
        </g>
    );
};

export function SpecializedCharts({ data, type = "Value", unit = "", variant = "gauge", color = "#8884d8", min = 0, max = 100 }: ChartProps) {

    // Custom Tooltip (reused)
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // For OHLC/Bar, payload structure is different
            // For Radial, it's also different.
            // Let's degrade gracefully.
            const val = payload[0].value;
            // Trying to find original data object for device source if possible
            // Recharts makes this tricky for RadialBar as 'data' prop is transformed.
            // For BarChart (OHLC), we have chunks, so 'deviceName' is ambiguous (could be mixed).

            return (
                <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow-lg text-xs">
                    <p className="font-semibold text-gray-300">{label || type}</p>
                    <p style={{ color: payload[0].fill || color }}>
                        <span className="font-mono">{Number(val).toFixed(2)} {unit}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // Gauge Implementation
    if (variant === "gauge") {
        const latest = data[data.length - 1] || { value: 0 };
        const val = Number(latest.value);

        const gaugeData = [
            { name: 'val', value: val, fill: color }
        ];

        return (
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    innerRadius="60%"
                    outerRadius="100%"
                    barSize={20}
                    data={gaugeData}
                    startAngle={180}
                    endAngle={0}
                >
                    <RadialBar
                        label={{ position: 'insideStart', fill: '#fff', formatter: () => `${val.toFixed(1)}${unit}` }}
                        background
                        dataKey="value"
                        cornerRadius={10}
                        fill={color}
                    />
                    {/* RadialBarChart tooltip payload is weird, sticking to simple formatter for now */}
                    <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", borderRadius: "8px", border: "none" }}
                        formatter={(value: number) => [`${value} ${unit}`, type]}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
        );
    }

    // Candlestick Implementation (Approximation)
    if (variant === "candlestick") {
        // ... (Aggegration logic same as before)
        const ohlcData = useMemo(() => {
            const chunkSize = 5;
            const chunks = [];
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                if (chunk.length === 0) continue;
                const values = chunk.map(d => d.value);
                chunks.push({
                    time: chunk[0].timestamp,
                    formattedTime: format(new Date(chunk[0].timestamp), "HH:mm"),
                    open: values[0],
                    close: values[values.length - 1],
                    high: Math.max(...values),
                    low: Math.min(...values),
                    bodySize: [Math.min(values[0], values[values.length - 1]), Math.max(values[0], values[values.length - 1])],
                    // Store source from first item in chunk?
                    deviceName: chunk[0].deviceName
                });
            }
            return chunks;
        }, [data]);

        const OHLCTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                    <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow-lg text-xs">
                        <p className="font-semibold text-gray-300">{d.formattedTime}</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-gray-400">
                            <span>Open:</span> <span className="text-white">{d.open.toFixed(1)}</span>
                            <span>Close:</span> <span className="text-white">{d.close.toFixed(1)}</span>
                            <span>High:</span> <span className="text-white">{d.high.toFixed(1)}</span>
                            <span>Low:</span> <span className="text-white">{d.low.toFixed(1)}</span>
                        </div>
                        {d.deviceName && <div className="mt-2 text-[10px] text-gray-500 italic">{d.deviceName}</div>}
                    </div>
                );
            }
            return null;
        };

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ohlcData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="formattedTime" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={40} />
                    <Tooltip content={<OHLCTooltip />} />
                    <Bar dataKey="bodySize" shape={<CandlestickShape />} />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    // 1D Heatmap
    if (variant === "heatmap") {
        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);

        return (
            <div className="w-full h-full flex flex-col justify-center">
                <div className="flex w-full h-12 rounded-lg overflow-hidden relative">
                    {data.slice(-50).map((d, i) => { // Show last 50
                        const intensity = (d.value - minVal) / (maxVal - minVal || 1);
                        return (
                            <div
                                key={i}
                                className="flex-1 hover:brightness-110 transition-all cursor-pointer group relative"
                                style={{
                                    backgroundColor: color,
                                    opacity: 0.3 + (intensity * 0.7)
                                }}
                            >
                                {/* Native generic tooltip */}
                                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap z-10 border border-gray-700">
                                    {d.value.toFixed(2)} {unit}
                                    <br />
                                    <span className="text-gray-400 text-[10px]">{format(new Date(d.timestamp), 'HH:mm:ss')}</span>
                                    {d.deviceName && <><br /><span className="text-gray-500 italic text-[10px]">{d.deviceName}</span></>}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{format(new Date(data[0]?.timestamp || Date.now()), 'HH:mm')}</span>
                    <span>Last 50 Readings Intensity</span>
                    <span>{format(new Date(data[data.length - 1]?.timestamp || Date.now()), 'HH:mm')}</span>
                </div>
            </div>
        );
    }

    return null;
}
