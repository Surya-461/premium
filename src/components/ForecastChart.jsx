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
                                tension: 0.4
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                ticks: { color: "#cbd5e1" },
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
