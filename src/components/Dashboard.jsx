import { useState } from "react";
import { getRevenueForecast, getSalesForecast } from "../../../KK Premium/services/api.js";
import ForecastChart from "./ForecastChart.jsx";
import ControlPanel from "./ControlPanel.jsx";

function Dashboard() {
    const [forecastData, setForecastData] = useState([]);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRevenue = async (steps) => {
        try {
            setLoading(true);
            setError("");
            const response = await getRevenueForecast(steps);
            setForecastData(response.data.forecast);
            setTitle("Revenue Forecast");
        } catch (err) {
            setError("Failed to fetch revenue forecast.");
        } finally {
            setLoading(false);
        }
    };

    const handleSales = async (steps) => {
        try {
            setLoading(true);
            setError("");
            const response = await getSalesForecast(steps);
            setForecastData(response.data.forecast);
            setTitle("Sales Forecast");
        } catch (err) {
            setError("Failed to fetch sales forecast.");
        } finally {
            setLoading(false);
        }
    };

    // KPI Calculations
    const total = forecastData.reduce((a, b) => a + b, 0);
    const avg = forecastData.length ? (total / forecastData.length).toFixed(2) : 0;
    const max = forecastData.length ? Math.max(...forecastData).toFixed(2) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
            <div className="max-w-7xl mx-auto">

                {/* <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                    📊 Retail ML Forecast Dashboard
                </h1> */}

                {/* Control Panel Card */}
                <div className="bg-white shadow-xl rounded-2xl p-6 mb-8">
                    <ControlPanel
                        onRevenue={handleRevenue}
                        onSales={handleSales}
                    />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* KPI Cards */}
                {!loading && forecastData.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white shadow-lg rounded-2xl p-6 text-center">
                                <h3 className="text-gray-500 text-sm">Total</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    {total.toFixed(2)}
                                </p>
                            </div>

                            <div className="bg-white shadow-lg rounded-2xl p-6 text-center">
                                <h3 className="text-gray-500 text-sm">Average</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {avg}
                                </p>
                            </div>

                            <div className="bg-white shadow-lg rounded-2xl p-6 text-center">
                                <h3 className="text-gray-500 text-sm">Peak Value</h3>
                                <p className="text-2xl font-bold text-purple-600">
                                    {max}
                                </p>
                            </div>
                        </div>

                        {/* Chart Card */}
                        <div className="bg-white shadow-xl rounded-2xl p-6">
                            <ForecastChart data={forecastData} title={title} />
                        </div>
                    </>
                )}

                {!loading && forecastData.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        Run a forecast to visualize results 📈
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
