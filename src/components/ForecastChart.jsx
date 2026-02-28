import {
    Line
} from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function ForecastChart({ data, title }) {

    const labels = data.map((_, index) => `Period ${index + 1}`);

    // 🔎 Find Peak & Lowest
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);

    const maxIndex = data.indexOf(maxValue);
    const minIndex = data.indexOf(minValue);

    return (
        <div>
            <h3 className="text-white text-lg font-semibold mb-4">
                {title}
            </h3>

            <div className="h-80">
                <Line
                    data={{
                        labels,
                        datasets: [
                            {
                                label: "Forecast",
                                data,
                                borderColor: "#8b5cf6",
                                backgroundColor: "rgba(139,92,246,0.1)",
                                fill: true,
                                tension: 0.4,

                                // 🎯 Dynamic Point Styling
                                pointBackgroundColor: data.map((value, index) => {
                                    if (index === maxIndex) return "#10b981"; // Green Peak
                                    if (index === minIndex) return "#ef4444"; // Red Low
                                    return "#8b5cf6";
                                }),

                                pointRadius: data.map((_, index) => {
                                    if (index === maxIndex || index === minIndex) return 7;
                                    return 4;
                                }),

                                pointHoverRadius: 9
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },

                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const value = context.raw;
                                        const index = context.dataIndex;

                                        if (index === maxIndex)
                                            return `🔺 Peak: ₹${value.toLocaleString()}`;

                                        if (index === minIndex)
                                            return `🔻 Low: ₹${value.toLocaleString()}`;

                                        return `₹${value.toLocaleString()}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                ticks: {
                                    color: "#cbd5e1",
                                    callback: function (value) {
                                        return "₹" + value.toLocaleString();
                                    }
                                },
                                grid: { color: "rgba(255,255,255,0.05)" }
                            },
                            x: {
                                ticks: { color: "#cbd5e1" },
                                grid: { display: false }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
}

export default ForecastChart;