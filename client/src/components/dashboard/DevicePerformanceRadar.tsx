import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { Reading } from '@shared/schema';

interface DevicePerformanceRadarProps {
  readings: Reading[];
}

export function DevicePerformanceRadar({ readings }: DevicePerformanceRadarProps) {
  // Aggregate data: count occurrences of each reading type
  const typeCounts = readings.reduce((acc: any, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(typeCounts).map(([type, count]) => ({
    subject: type.replace('_', ' ').toUpperCase(),
    value: count,
    fullMark: Math.max(...(Object.values(typeCounts) as number[])) * 1.2
  }));

  return (
    <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-6">Sensor Distribution</h3>
      <div className="flex-1 w-full min-h-[200px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              />
              <Radar
                name="Count"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
            Waiting for sensor data...
          </div>
        )}
      </div>
    </div>
  );
}
