import { useState, useMemo, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    IndianRupee,
    BarChart3,
    Sparkles
} from "lucide-react";
import { getRevenueForecast, getSalesForecast } from "../../services/api.js";
import ForecastChart from "./ForecastChart.jsx";
import ControlPanel from "./ControlPanel.jsx";

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
        } catch {
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
        } catch {
            setError("Failed to fetch sales forecast.");
        } finally {
            setLoading(false);
        }
    };

    // KPI Calculations
    const { total, avg, max, growth } = useMemo(() => {
        const total = forecastData.reduce((a, b) => a + b, 0);
        const avg = forecastData.length ? total / forecastData.length : 0;
        const max = forecastData.length ? Math.max(...forecastData) : 0;

        const growth =
            forecastData.length > 1
                ? ((forecastData[forecastData.length - 1] -
                    forecastData[0]) /
                    forecastData[0]) *
                100
                : 0;

        return { total, avg, max, growth };
    }, [forecastData]);

    // Animated Counter
    const AnimatedNumber = ({ value }) => {
        const [display, setDisplay] = useState(0);

        useEffect(() => {
            let start = 0;
            const duration = 800;
            const increment = value / (duration / 16);

            const counter = setInterval(() => {
                start += increment;
                if (start >= value) {
                    setDisplay(value);
                    clearInterval(counter);
                } else {
                    setDisplay(Math.floor(start));
                }
            }, 16);

            return () => clearInterval(counter);
        }, [value]);

        return <span>₹{display.toLocaleString()}</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full"></div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        Predictive Financial Intelligence
                    </h1>
                    <p className="text-slate-400 mt-3">
                        AI-powered forecasting using advanced time-series models
                    </p>
                </motion.div>

                {/* Control Panel */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl mb-10">
                    <ControlPanel
                        onRevenue={handleRevenue}
                        onSales={handleSales}
                    />
                </div>

                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-500"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 border border-red-500/30">
                        {error}
                    </div>
                )}

                {!loading && forecastData.length > 0 && (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                            {[
                                {
                                    title: "Projected Total",
                                    value: total,
                                    icon: <IndianRupee className="text-emerald-400" />
                                },
                                {
                                    title: "Average Forecast",
                                    value: avg,
                                    icon: <TrendingUp className="text-blue-400" />
                                },
                                {
                                    title: "Peak Forecast",
                                    value: max,
                                    icon: <BarChart3 className="text-violet-400" />
                                }
                            ].map((card, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.2 }}
                                    whileHover={{ scale: 1.04 }}
                                    className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-violet-500/20 transition"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-slate-400 text-sm">
                                                {card.title}
                                            </h3>
                                            <p className="text-2xl font-bold mt-3">
                                                <AnimatedNumber value={Math.round(card.value)} />
                                            </p>
                                        </div>
                                        {card.icon}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Growth Indicator */}
                        <div className="mb-8 backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                            <div>
                                <h4 className="text-slate-400 text-sm">
                                    Forecast Growth Trend
                                </h4>
                                <p className="text-xl font-semibold mt-2">
                                    {growth.toFixed(2)}%
                                </p>
                            </div>
                            {growth >= 0 ? (
                                <TrendingUp className="text-emerald-400" />
                            ) : (
                                <TrendingDown className="text-red-400" />
                            )}
                        </div>

                        {/* AI Insight */}
                        <div className="mb-10 backdrop-blur-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-3">
                                <Sparkles className="text-violet-400" />
                                <h3 className="text-lg font-semibold">
                                    AI Insight Summary
                                </h3>
                            </div>
                            <p className="text-slate-300 text-sm">
                                Based on the forecasted trend, revenue is expected to{" "}
                                <span className="text-white font-semibold">
                                    {growth >= 0 ? "increase" : "decline"}
                                </span>{" "}
                                over the next {forecastData.length} periods.
                                Strategic inventory and marketing adjustments
                                are recommended to optimize performance.
                            </p>
                        </div>

                        {/* Chart */}
                        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                            <ForecastChart
                                data={forecastData}
                                title={`${title} (Next ${forecastData.length} Periods)`}
                            />
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-6 text-xs text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded-lg p-4">
                            ⚠ Disclaimer: The forecast results are generated using AI-based
                            predictive models and historical data patterns. These projections
                            are estimates only and should not be considered guaranteed
                            financial outcomes. Actual results may vary due to market
                            conditions, operational changes, and external factors.
                        </div>
                    </>
                )}

                {!loading && forecastData.length === 0 && (
                    <div className="text-center text-slate-500 mt-20 text-lg">
                        Run a forecast to generate predictive insights 📊
                    </div>
                )}
            </div>
        </div>
    );
}

export default FinancialInsights;