import { useState } from "react";

function ControlPanel({ onRevenue, onSales }) {
    const [steps, setSteps] = useState(6);

    return (
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div>
                <label className="text-slate-300 text-sm">
                    Forecast Periods:
                </label>
                <input
                    type="number"
                    value={steps}
                    min="1"
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="ml-3 px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 w-24"
                />
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => onRevenue(steps)}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition"
                >
                    Revenue Forecast
                </button>

                <button
                    onClick={() => onSales(steps)}
                    className="px-5 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold transition"
                >
                    Sales Forecast
                </button>
            </div>
        </div>
    );
}

export default ControlPanel;
