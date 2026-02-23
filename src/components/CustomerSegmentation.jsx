import { useState } from "react";
import { predictCustomerSegment } from "../../services/api.js";

function CustomerSegmentation() {
    const [formData, setFormData] = useState({
        total_spending: "",
        num_of_orders: "",
        average_order_value: "",
        recency: "",
        frequency: "",
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await predictCustomerSegment({
                total_spending: Number(formData.total_spending),
                num_of_orders: Number(formData.num_of_orders),
                average_order_value: Number(formData.average_order_value),
                recency: Number(formData.recency),
                frequency: Number(formData.frequency),
            });

            setResult(response);
        } catch (error) {
            console.error("Prediction error:", error);
            alert("Error predicting customer segment");
        }

        setLoading(false);
    };

    const getBadgeColor = () => {
        if (!result) return "";
        if (result.customer_type === "High Value Customer")
            return "bg-green-100 text-green-700 border-green-400";
        if (result.customer_type === "Medium Value Customer")
            return "bg-yellow-100 text-yellow-700 border-yellow-400";
        return "bg-red-100 text-red-700 border-red-400";
    };

    return (
        <div className="min-h-screen  from-teal-100 via-cyan-100 to-sky-200 flex items-center justify-center  sm:px-6 lg:px-8  text-black">


            <div className="w-full max-w-3xl backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl p-10 transition-all duration-500">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
                        Customer Segmentation
                    </h1>
                    <p className="text-gray-600">
                        Analyze customer behavior and classify them into value-based segments.
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Spending
                        </label>
                        <input
                            type="number"
                            name="total_spending"
                            placeholder="₹ 10,000"
                            value={formData.total_spending}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Orders
                        </label>
                        <input
                            type="number"
                            name="num_of_orders"
                            placeholder="e.g. 25"
                            value={formData.num_of_orders}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Average Order Value
                        </label>
                        <input
                            type="number"
                            name="average_order_value"
                            placeholder="₹ 500"
                            value={formData.average_order_value}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recenct (Days Since Last Purchase)
                        </label>
                        <input
                            type="number"
                            name="recency"
                            placeholder="e.g. 3"
                            value={formData.recency}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Purchase Frequency
                        </label>
                        <input
                            type="number"
                            name="frequency"
                            placeholder="e.g. 15"
                            value={formData.frequency}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="md:col-span-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold shadow-lg  transform transition duration-300"
                    >
                        {loading ? "Analyzing Customer..." : "Predict Customer Segment"}
                    </button>
                </form>

                {/* Result Section */}
                {result && (
                    <div className="mt-10 p-6 rounded-2xl border border-gray-200 bg-white shadow-md animate-fadeIn">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            Segmentation Result
                        </h3>

                        <div className="flex flex-col items-center gap-3">
                            <div className="text-gray-600">
                                Cluster ID:{" "}
                                <span className="font-semibold text-gray-800">
                                    {result.segment_number}
                                </span>
                            </div>

                            <div
                                className={`px-6 py-2 rounded-full border text-sm font-semibold ${getBadgeColor()}`}
                            >
                                {result.customer_type}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CustomerSegmentation;
