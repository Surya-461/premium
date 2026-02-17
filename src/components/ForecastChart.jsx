import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Area,
    AreaChart
} from "recharts";

function ForecastChart({ data, title }) {

    const chartData = data.map((value, index) => ({
        day: `Day ${index + 1}`,
        value: Number(value)
    }));

    return (
        <div className="w-full">

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {title}
                </h2>
                <p className="text-sm text-gray-500">
                    Forecast trend over selected time horizon
                </p>
            </div>

            {/* Chart Container */}
            <div className="bg-gray-50 rounded-2xl p-4 shadow-inner h-[450px]">

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>

                        {/* Gradient */}
                        <defs>
                            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="#e5e7eb"
                        />

                        <XAxis
                            dataKey="day"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                        />

                        <YAxis
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            domain={['auto', 'auto']}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#ffffff",
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}
                        />

                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#2563eb"
                            strokeWidth={3}
                            fill="url(#forecastGradient)"
                            dot={false}
                            activeDot={{ r: 6 }}
                            animationDuration={800}
                        />

                    </AreaChart>
                </ResponsiveContainer>

            </div>
        </div>
    );
}

export default ForecastChart;
