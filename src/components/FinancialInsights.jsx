import { useState, useMemo } from "react";
import { getRevenueForecast, getSalesForecast } from "../../services/api.js";
import ForecastChart from "./ForecastChart.jsx";
import ControlPanel from "./ControlPanel.jsx";
import { TrendingUp, IndianRupee, BarChart3 } from "lucide-react";

function FinancialInsights() {
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

    // 🔥 KPI Calculations
    const { total, avg, max } = useMemo(() => {
        const total = forecastData.reduce((a, b) => a + b, 0);
        const avg = forecastData.length ? total / forecastData.length : 0;
        const max = forecastData.length ? Math.max(...forecastData) : 0;
        return { total, avg, max };
    }, [forecastData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    {/* <h1 className="text-3xl font-bold text-white">
                        Predictive Analytics Dashboard
                    </h1> */}
                    <h1 className="text-slate-400 mb-2 text-sm uppercase tracking-wide">
                        AI-powered Sales & Revenue Forecasting
                    </h1>
                </div>

                {/* Control Panel */}
                <div className="bg-slate-800 shadow-xl rounded-2xl p-6 mb-8 border border-slate-700">
                    <ControlPanel
                        onRevenue={handleRevenue}
                        onSales={handleSales}
                    />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-violet-500"></div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6 border border-red-500/20">
                        {error}
                    </div>
                )}

                {/* KPI + Chart */}
                {!loading && forecastData.length > 0 && (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-slate-400 text-sm">
                                            Projected Total
                                        </h3>
                                        <p className="text-2xl font-bold text-white mt-2">
                                            ₹{total.toLocaleString()}
                                        </p>
                                    </div>
                                    <IndianRupee className="text-emerald-400" />
                                </div>
                            </div>


                            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-slate-400 text-sm">
                                            Average Forecast
                                        </h3>
                                        <p className="text-2xl font-bold text-white mt-2">
                                            ₹{avg.toFixed(2)}
                                        </p>
                                    </div>
                                    <TrendingUp className="text-blue-400" />
                                </div>
                            </div>

                            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-slate-400 text-sm">
                                            Peak Forecast Value
                                        </h3>
                                        <p className="text-2xl font-bold text-white mt-2">
                                            ₹{max.toLocaleString()}
                                        </p>
                                    </div>
                                    <BarChart3 className="text-violet-400" />
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-slate-800 shadow-xl rounded-2xl p-6 border border-slate-700">
                            <ForecastChart
                                data={forecastData}
                                title={`${title} (Next ${forecastData.length} Periods)`}
                            />
                        </div>
                    </>
                )}

                {!loading && forecastData.length === 0 && (
                    <div className="text-center text-slate-400 mt-10">
                        Run a forecast to visualize results 📈
                    </div>
                )}
            </div>
        </div>
    );
}

export default FinancialInsights;
