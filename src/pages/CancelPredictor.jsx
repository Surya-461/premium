import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    customers,
    orders,
    orderItems,
    payments
} from "../data/dataUtils.js";

const CancelPredictor = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        order_id: 0,
        customer_id: "",
        order_total_amount: 0,
        num_of_item: 0,
        shipping_charge: 0,
        order_year: 2024,
        order_month: 1,
        order_weekday: "Monday",
        is_weekend: 0,
        ordered_quantity: 0,
        selling_unit_price: 0,
        is_returned: 0,
        payment_method: "COD",
        customer_age: 0,
        customer_gender: "Male",
        customer_is_active: 1,
        customer_age_group: "18-25",
        customer_cancel_rate: 0,
        customer_total_orders: 0,
        customer_avg_order_value: 0
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);

    // ============================
    // AUTO FILL DATA
    // ============================
    useEffect(() => {
        if (!formData.customer_id) return;

        const cid = parseInt(formData.customer_id);
        const user = customers.find(c => c.customer_id === cid);
        if (!user) return;

        const userOrders = orders
            .filter(o => o.customer_id === cid)
            .sort((a, b) => new Date(b.order_created_date) - new Date(a.order_created_date));

        const latestOrder = userOrders[0] || {};
        const latestItem = orderItems.find(i => i.order_id === latestOrder.order_id) || {};
        const latestPayment = payments.find(p => p.order_id === latestOrder.order_id) || {};
        const totalOrders = userOrders.length;

        const avgValue =
            totalOrders > 0
                ? userOrders.reduce((sum, o) => sum + (o.order_total_amount || 0), 0) / totalOrders
                : 0;

        setFormData(prev => ({
            ...prev,
            order_id: latestOrder.order_id || 0,
            customer_id: cid,
            order_total_amount: latestOrder.order_total_amount || 0,
            num_of_item: latestOrder.num_of_item || 1,
            shipping_charge: latestOrder.shipping_charge || 0,
            order_year: latestOrder.order_year || 2024,
            order_month: latestOrder.order_month || 1,
            order_weekday: latestOrder.order_weekday || "Monday",
            is_weekend: latestOrder.is_weekend ? 1 : 0,
            ordered_quantity: latestItem.ordered_quantity || 1,
            selling_unit_price: latestItem.selling_unit_price || 0,
            is_returned: latestItem.is_returned ? 1 : 0,
            payment_method: latestPayment.payment_method || "COD",
            customer_age: user.customer_age || 25,
            customer_gender: user.customer_gender === "M" ? "Male" : "Female",
            customer_is_active: user.customer_is_active ? 1 : 0,
            customer_age_group: user.customer_age_group || "18-25",
            customer_cancel_rate: user.customer_cancel_rate || 0.5,
            customer_total_orders: totalOrders,
            customer_avg_order_value: parseFloat(avgValue.toFixed(2))
        }));
    }, [formData.customer_id]);

    // ============================
    // API CALL
    // ============================
    const fetchPrediction = async (data) => {
        setLoading(true);
        try {
            const response = await fetch("https://backend-vpnc.onrender.com/predict-cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const res = await response.json();
            setResult(res);
        } catch (err) {
            console.error("Prediction error:", err);
        } finally {
            setLoading(false);
        }
    };

    // ============================
    // REAL TIME PREDICTION (DEBOUNCED)
    // ============================
    useEffect(() => {
        if (!formData.customer_id) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            fetchPrediction(formData);
        }, 800);
    }, [formData]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "number" ? (value === "" ? "" : parseFloat(value)) : value
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 p-6 font-sans">
            {/* back button */}
            <div className="max-w-6xl mx-auto mb-4">
                <button
                    onClick={() => navigate('/admindashboard?section=orders')}
                    className="text-blue-600 hover:underline text-sm"
                >
                    &larr; Back to orders
                </button>
            </div>
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: FORM SECTION */}
                <div className="lg:col-span-8 bg-white shadow-xl rounded-3xl p-8 border border-red-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                            Order <span className="text-red-600">Cancel</span> Watch
                        </h2>
                        <div className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                            LIVE INFERENCE
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Target Customer</label>
                            <input
                                type="number"
                                name="customer_id"
                                placeholder="Enter Customer ID (e.g. 1024)"
                                value={formData.customer_id}
                                onChange={handleChange}
                                className="w-full p-4 bg-white border-none rounded-xl text-lg font-bold shadow-inner focus:ring-2 focus:ring-red-400 outline-none transition-all"
                            />
                        </div>

                        {Object.keys(formData).filter(k => k !== 'customer_id' && k !== 'order_id').map((key) => (
                            <div key={key} className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                                    {key.replace(/_/g, ' ')}
                                </label>
                                <input
                                    type={["order_weekday", "payment_method", "customer_gender", "customer_age_group"].includes(key) ? "text" : "number"}
                                    name={key}
                                    value={formData[key]}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:border-red-400 outline-none transition-colors bg-white/50"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: RESULTS & DISCLAIMER */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Result Card */}
                    <div className={`p-8 rounded-3xl shadow-2xl min-h-[300px] flex flex-col items-center justify-center text-center transition-all duration-500 ${loading ? "bg-white border-2 border-dashed border-slate-200" :
                            result ? (result.prediction === 1 ? "bg-red-600 text-white" : "bg-emerald-500 text-white") : "bg-white"
                        }`}>
                        {loading ? (
                            <div className="space-y-4">
                                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Analyzing Behavior...</p>
                            </div>
                        ) : result ? (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Cancellation Risk</p>
                                <h3 className="text-4xl font-black mb-4 uppercase">{result.status}</h3>
                                <div className="text-6xl font-black mb-2">{result.probability}%</div>
                                <div className="w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
                                    <div
                                        className="bg-white h-full transition-all duration-1000"
                                        style={{ width: `${result.probability}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="font-medium">Waiting for Customer ID</p>
                            </div>
                        )}
                    </div>

                    {/* Legal/AI Disclaimer */}
                    <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-3 text-red-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-xs font-black uppercase tracking-widest">Model Disclaimer</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-500 text-justify">
                            This cancellation prediction is powered by a machine learning model analyzing historical customer behavior, payment methods, and order timing.
                            <b> This is a statistical probability, not a certainty.</b>
                            <br /><br />
                            Users should not use this score to automatically penalize customers or cancel orders without manual review. External factors (technical errors, buyer's remorse, or accidental clicks) may cause results to deviate from actual outcomes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CancelPredictor;