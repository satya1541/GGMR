import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Cell } from 'recharts';
import type { Reading } from '@shared/schema';
import { useMemo } from 'react';

interface DynamicGaugeChartProps {
    data: Reading[];
    type: string;
    min?: number;
    max?: number;
    color?: string;
}

export function DynamicGaugeChart({ data, type, min = 0, max = 100, color = "#10b981" }: DynamicGaugeChartProps) {
    const latestValue = useMemo(() => {
        const reading = data.find(r => r.type === type);
        return reading ? reading.value : 0;
    }, [data, type]);

    const chartData = [{ name: type, value: latestValue }];

    // Determine color based on value (simple logic for now, can be enhanced)
    const gaugeColor = latestValue > 80 ? '#ef4444' : latestValue > 50 ? '#f59e0b' : color;

    return (
        <div className="glass-card p-6 rounded-2xl h-full flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-lg font-bold text-white capitalize mb-2 z-10">{type.replace(/_/g, ' ')} Meter</h3>

            <div className="w-full h-[200px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        barSize={20}
                        data={chartData}
                        startAngle={180}
                        endAngle={0}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[min, max]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar
                            background
                            cornerRadius={10}
                            dataKey="value"
                            fill={gaugeColor}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                    <span className="text-4xl font-bold text-white">{latestValue.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground uppercase">{data.find(r => r.type === type)?.unit || 'Units'}</span>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent z-0 pointer-events-none" />
        </div>
    );
}
