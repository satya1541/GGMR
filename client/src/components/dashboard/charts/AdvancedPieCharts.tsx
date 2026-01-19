import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

interface ChartProps {
    data: any[];
    dataKey?: string;
    nameKey?: string;
    variant?: "pie" | "donut" | "semicircle";
}

export function AdvancedPieCharts({ data, dataKey = "value", nameKey = "name", variant = "pie" }: ChartProps) {
    // Aggregate data if it's raw readings
    // Assuming data might be raw readings, we might need to group them. 
    // For now, let's assume the parent passes pre-aggregated data OR we do simple counting if it's raw.
    // Actually, for consistency, let's expect the parent to pass { name, value } or we map it.

    const formattedData = data.map((d, i) => ({
        name: d[nameKey] || `Item ${i}`,
        value: Number(d[dataKey]) || 0,
    }));

    const isDonut = variant === "donut";
    const isSemi = variant === "semicircle";

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={formattedData}
                    cx="50%"
                    cy={isSemi ? "70%" : "50%"}
                    labelLine={!isSemi && !isDonut}
                    label={!isSemi && !isDonut ? renderCustomizedLabel : undefined}
                    outerRadius={isSemi ? "140%" : "80%"}
                    innerRadius={isDonut ? "50%" : isSemi ? "80%" : "0%"}
                    startAngle={isSemi ? 180 : 0}
                    endAngle={isSemi ? 0 : 360}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={isDonut ? 5 : 0}
                >
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }} itemStyle={{ color: "#f3f4f6" }} />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
        </ResponsiveContainer>
    );
}
