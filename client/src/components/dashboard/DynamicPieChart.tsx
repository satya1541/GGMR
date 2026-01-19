import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Reading } from '@shared/schema';
import { useMemo } from 'react';

interface DynamicPieChartProps {
    data: any[];
    field: string;
    variant?: 'pie' | 'donut';
    hideTitle?: boolean;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export function DynamicPieChart({ data, field, variant = 'donut', hideTitle = false }: DynamicPieChartProps) {
    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};

        if (field === 'global_type_count') {
            // Mode: Count distribution of reading TYPES (e.g. Temp vs Hum)
            data.forEach(r => {
                const key = r.type;
                counts[key] = (counts[key] || 0) + 1;
            });
        } else {
            // Mode: Count distribution of VALUES for a specific type (e.g. Alerts: High vs Low)
            data.filter(r => r.type === field).forEach(r => {
                const key = r.value.toString();
                counts[key] = (counts[key] || 0) + 1;
            });
        }

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [data, field]);

    return (
        <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
            {!hideTitle && (
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white capitalize">
                        {field === 'global_type_count' ? 'Active Sensors' : `${field} Distribution`}
                    </h3>
                </div>
            )}

            <div className="flex-1 w-full min-h-[200px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={variant === 'donut' ? 60 : 0}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
                        Waiting for {field} data...
                    </div>
                )}
            </div>
        </div>
    );
}
