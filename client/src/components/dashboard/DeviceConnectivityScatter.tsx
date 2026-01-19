import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { x: 100, y: 200, z: 200, name: 'Sensor-01' },
  { x: 120, y: 100, z: 260, name: 'Sensor-02' },
  { x: 170, y: 300, z: 400, name: 'Gateway-A' },
  { x: 140, y: 250, z: 280, name: 'Sensor-03' },
  { x: 150, y: 400, z: 500, name: 'Node-Prime' },
  { x: 110, y: 280, z: 200, name: 'Sensor-04' },
];

export function DeviceConnectivityScatter() {
  return (
    <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-6">Link Analysis</h3>
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="stray" 
              unit="ms" 
              stroke="rgba(255,255,255,0.3)" 
              tick={{fontSize: 10}} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="weight" 
              unit="kbps" 
              stroke="rgba(255,255,255,0.3)" 
              tick={{fontSize: 10}} 
              axisLine={false}
              tickLine={false}
            />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="score" unit="%" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                borderColor: 'rgba(255,255,255,0.1)', 
                borderRadius: '12px' 
              }}
            />
            <Scatter name="Devices" data={data} fill="#10b981" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
