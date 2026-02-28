import { useEffect, useState, useMemo } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

function CustomerSegmentation() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/final_df_cleaned.json")
            .then((response) => {
                if (!response.ok) throw new Error("Failed to load JSON");
                return response.json();
            })
            .then((data) => {
                setCustomers(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Unable to load customer data.");
                setLoading(false);
            });
    }, []);

    // 🔥 Premium Badge Styling
    const getSegmentBadge = (label) => {
        if (!label) return {};

        if (label.toLowerCase().includes("high")) {
            return {
                style:
                    "bg-green-600 text-white shadow-lg shadow-green-400/50 hover:shadow-green-500/80 animate-pulse",
                icon: "⭐",
            };
        }

        if (label.toLowerCase().includes("medium")) {
            return {
                style:
                    "bg-yellow-500 text-white shadow-lg shadow-yellow-400/50 hover:shadow-yellow-500/80",
                icon: "🎯",
            };
        }

        return {
            style:
                "bg-red-600 text-white shadow-lg shadow-red-400/50 hover:shadow-red-500/80",
            icon: "⚠",
        };
    };

    const highCount = customers.filter(c =>
        c.Customer_segment_label?.toLowerCase().includes("high")
    ).length;

    const mediumCount = customers.filter(c =>
        c.Customer_segment_label?.toLowerCase().includes("medium")
    ).length;

    const lowCount = customers.filter(c =>
        c.Customer_segment_label?.toLowerCase().includes("low")
    ).length;

    const filteredCustomers = useMemo(() => {
        return customers
            .filter((c) =>
                filter === "All"
                    ? true
                    : c.Customer_segment_label?.toLowerCase().includes(filter.toLowerCase())
            )
            .filter((c) =>
                c.customer_id.toString().includes(search) ||
                c.Customer_segment_label?.toLowerCase().includes(search.toLowerCase())
            );
    }, [customers, filter, search]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen bg-gray-100 p-8 text-black"
        >
            <div className="w-full bg-white rounded-2xl shadow-xl p-8">

                <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold text-center mb-10"
                >
                    Customer Segmentation Dashboard
                </motion.h1>

                {loading && <div className="text-center">Loading data...</div>}
                {error && <div className="text-center text-red-600">{error}</div>}

                {!loading && !error && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {[
                                { title: "High Value Customers", count: highCount, bg: "bg-green-100" },
                                { title: "Medium Value Customers", count: mediumCount, bg: "bg-yellow-100" },
                                { title: "Low Value Customers", count: lowCount, bg: "bg-red-100" }
                            ].map((card, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ y: 40, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.2 }}
                                    whileHover={{ scale: 1.03 }}
                                    className={`${card.bg} p-6 rounded-xl shadow-md`}
                                >
                                    <h2 className="text-lg font-semibold mb-2">
                                        {card.title}
                                    </h2>
                                    <p className="text-3xl font-bold">
                                        {card.count}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Search + Filter */}
                        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                            <input
                                type="text"
                                placeholder="Search by Customer ID or Segment..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border p-3 rounded-lg shadow-sm w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />

                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="All">All Segments</option>
                                <option value="High">High Value</option>
                                <option value="Medium">Medium Value</option>
                                <option value="Low">Low Value</option>
                            </select>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-lg border">
                            <table className="min-w-full text-black">
                                <thead className="bg-gray-200 sticky top-0">
                                    <tr>
                                        <th className="py-3 px-4 text-left">Customer ID</th>
                                        <th className="py-3 px-4 text-left">Total Spending</th>
                                        <th className="py-3 px-4 text-left">Orders</th>
                                        <th className="py-3 px-4 text-left">Days Since Last Purchase</th>
                                        <th className="py-3 px-4 text-left">Purchase Frequency</th>
                                        <th className="py-3 px-4 text-left">Avg Order Value</th>
                                        <th className="py-3 px-4 text-left">Segment</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredCustomers.slice(0, 50).map((customer, index) => {
                                        const badge = getSegmentBadge(
                                            customer.Customer_segment_label
                                        );

                                        return (
                                            <motion.tr
                                                key={index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="border-t hover:bg-gray-50"
                                            >
                                                <td className="py-3 px-4">{customer.customer_id}</td>
                                                <td className="py-3 px-4">₹ {customer.Total_Spending}</td>
                                                <td className="py-3 px-4">{customer.num_of_orders}</td>
                                                <td className="py-3 px-4">{customer.Recency}</td>
                                                <td className="py-3 px-4">{customer.Frequency}</td>
                                                <td className="py-3 px-4">₹ {customer.Average_Order_Value}</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ${badge.style}`}
                                                    >
                                                        {badge.icon}
                                                        {customer.Customer_segment_label}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default CustomerSegmentation;