import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Reading } from '@shared/schema';

interface SensorHistoryChartProps {
  readings: Reading[];
  type?: string;
  color?: string;
  title?: string;
}

export function SensorHistoryChart({ readings, type = 'temperature', color = '#10b981', title }: SensorHistoryChartProps) {
  // Filter readings by type
  const chartData = readings
    .filter(r => r.type === type)
    .slice(-50)
    .map(r => ({
      name: new Date(r.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: r.value
    }));

  return (
    <div className="h-full flex flex-col">

      <div className="flex-1 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
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
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={3}
                fillOpacity={1}
                fill={`url(#color${type})`}
                connectNulls
              />
            </AreaChart>
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
