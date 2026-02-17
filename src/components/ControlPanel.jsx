import { useState } from "react";

function ControlPanel({ onRevenue, onSales }) {
    const [steps, setSteps] = useState(30);

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">

            <div className="flex flex-col w-full md:w-1/4">
                <label className="text-gray-600 text-sm mb-1">
                    Forecast Days
                </label>
                <input
                    type="number"
                    value={steps}
                    min="1"
                    onChange={(e) => setSteps(e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
            </div>

            <button
                onClick={() => onRevenue(steps)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition transform hover:scale-105"
            >
                💰 Revenue Forecast
            </button>

            <button
                onClick={() => onSales(steps)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg transition transform hover:scale-105"
            >
                📦 Sales Forecast
            </button>
        </div>
    );
}

export default ControlPanel;
