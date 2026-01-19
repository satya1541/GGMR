import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Reading } from '@shared/schema';
import { useMemo } from 'react';

interface DynamicBarChartProps {
    data: Reading[];
    type: string;
    color?: string;
}

export function DynamicBarChart({ data, type, color = "#8884d8" }: DynamicBarChartProps) {
    // Aggregate data for frequency distribution or recent values
    const chartData = useMemo(() => {
        // For numeric data like "Index", we might want to show the latest values or a frequency distribution
        // Let's show the last 20 readings for this type
        return data
            .filter(r => r.type === type)
            .slice(-20)
            .map(r => ({
                time: new Date(r.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                value: r.value
            }));
    }, [data, type]);

    return (
        <div className="h-full flex flex-col">

            <div className="flex-1 w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="time"
                                stroke="rgba(255,255,255,0.3)"
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.3)"
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '8px'
                                }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
                        Waiting for {type} data...
                    </div>
                )}
            </div>
        </div>
    );
}
