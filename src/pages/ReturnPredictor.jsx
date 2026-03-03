import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    customers,
    orderItems,
    orders,
    products, shippments
} from '../data/dataUtils.js';

const ReturnPredictor = () => {
    const [formData, setFormData] = useState({
        customer_id: "",
        product_id: "",
        order_item_id: "",
        order_total_amount: 0,
        num_of_item: 0,
        selling_unit_price_x: 0,
        discount_amount: 0,
        shipping_charge: 0,
        ordered_quantity: 0,
        delivery_days: 0,
        delivery_delay_flag: 0,
        customer_age: 0,
        customer_gender: "Male",
        customer_is_active: 1,
        customer_total_orders: 0,
        customer_return_rate: 0,
        customer_avg_order_value: 0,
        product_category: "Electronics"
    });

    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Auto-fill logic based on Customer ID
    useEffect(() => {
        if (!formData.customer_id) return;

        const cid = parseInt(formData.customer_id);
        const user = customers.find(c => c.customer_id === cid);

        if (user) {
            const userOrders = orders.filter(o => o.customer_id === cid);
            const totalOrders = userOrders.length;
            const avgValue = totalOrders > 0
                ? userOrders.reduce((sum, o) => sum + o.order_total_amount, 0) / totalOrders
                : 0;

            const latestOrder = userOrders[0] || {};
            const latestShipment = shippments.find(s => s.order_id === latestOrder.order_id) || {};
            const latestItem = orderItems.find(oi => oi.order_id === latestOrder.order_id) || {};
            const latestProduct = products.find(p => p.product_id === latestItem.product_id) || {};

            let dDays = 0, dDelay = 0;
            if (latestShipment.dispatched_date && latestShipment.delivered_date) {
                const start = new Date(latestShipment.dispatched_date);
                const end = new Date(latestShipment.delivered_date);
                const promised = new Date(latestShipment.promised_delivery_date);
                dDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                dDelay = end > promised ? 1 : 0;
            } else {
                dDays = Math.floor(Math.random() * 7) + 1;
                dDelay = Math.random() > 0.8 ? 1 : 0;
            }

            setFormData(prev => ({
                ...prev,
                customer_age: user.customer_age || 30,
                customer_gender: user.customer_gender === 'M' ? "Male" : "Female",
                customer_is_active: user.customer_is_active ? 1 : 0,
                customer_return_rate: user.customer_return_rate || 0.1,
                customer_total_orders: totalOrders,
                customer_avg_order_value: parseFloat(avgValue.toFixed(2)),
                product_id: latestItem.product_id || 0,
                order_item_id: latestItem.order_item_id || 0,
                order_total_amount: latestOrder.order_total_amount || 0,
                num_of_item: latestOrder.num_of_item || 1,
                selling_unit_price_x: latestItem.selling_unit_price || 0,
                discount_amount: latestItem.discount_amount || 0,
                shipping_charge: latestOrder.shipping_charge || 0,
                ordered_quantity: latestItem.ordered_quantity || 1,
                delivery_days: dDays,
                delivery_delay_flag: dDelay,
                product_category: latestProduct.product_category || "Electronics"
            }));
        }
    }, [formData.customer_id]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === "" ? "" : parseFloat(value)) : value
        }));
    };

    const handlePredict = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('https://backend-vpnc.onrender.com/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            setResult(data);
        } catch (err) {
            alert("Error: Backend is offline.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-10 px-4 font-sans text-slate-800">
            {/* back button */}
            <div className="max-w-6xl mx-auto mb-6">
                <button
                    onClick={() => navigate('/admindashboard?section=orders')}
                    className="text-blue-600 hover:underline text-sm"
                >
                    &larr; Back to orders
                </button>
            </div>
            {/* Page Header */}
            <div className="max-w-6xl mx-auto text-center mb-12">
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                    SmartReturn AI
                </h1>
                <p className="text-slate-500 font-medium italic">High-fidelity predictive analytics for retail logistics</p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Input Form */}
                <div className="lg:col-span-8 bg-white/60 backdrop-blur-lg border border-white/40 shadow-xl rounded-3xl p-8 transition-all hover:shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-1 bg-blue-500 rounded-full"></div>
                        <h2 className="text-xl font-bold">Inference Parameters</h2>
                    </div>

                    <form onSubmit={handlePredict} className="space-y-6">
                        {/* ID Input Focus Area */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50 mb-8">
                            <label className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 block">Lookup Customer Profile</label>
                            <input
                                type="number"
                                name="customer_id"
                                placeholder="Enter Customer ID (e.g., 22528)"
                                value={formData.customer_id}
                                onChange={handleChange}
                                className="w-full bg-white border-none rounded-xl p-4 text-lg font-semibold shadow-inner focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.keys(formData).filter(k => k !== 'customer_id').map((key) => (
                                <div key={key} className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block transition-colors group-focus-within:text-blue-500">
                                        {key.replace(/_/g, ' ')}
                                    </label>

                                    {key === 'customer_gender' || key === 'product_category' ? (
                                        <select
                                            name={key}
                                            value={formData[key]}
                                            onChange={handleChange}
                                            className="w-full bg-white/80 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            {key === 'customer_gender' ? (
                                                <><option value="Male">Male</option><option value="Female">Female</option></>
                                            ) : (
                                                <><option value="Electronics">Electronics</option><option value="Clothing">Clothing</option><option value="Home">Home</option><option value="Accessories">Accessories</option></>
                                            )}
                                        </select>
                                    ) : (
                                        <input
                                            type="number"
                                            name={key}
                                            value={formData[key]}
                                            onChange={handleChange}
                                            className="w-full bg-white/80 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none transition-all"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest shadow-lg transition-all transform active:scale-[0.98] ${loading ? 'bg-slate-400 animate-pulse' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200 hover:translate-y-[-2px]'
                                }`}
                        >
                            {loading ? "Computing Gradients..." : "Generate Prediction"}
                        </button>
                    </form>
                </div>

                {/* Right Column: Results & Disclaimer */}
                <div className="lg:col-span-4 space-y-6 flex flex-col">
                    {result ? (
                        <div className={`relative overflow-hidden p-8 rounded-3xl border border-white/50 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${result.prediction === 1 ? 'bg-orange-50/80 backdrop-blur-md' : 'bg-emerald-50/80 backdrop-blur-md'
                            }`}>
                            <div className={`absolute top-0 right-0 p-4 font-black opacity-10 text-6xl select-none ${result.prediction === 1 ? 'text-orange-600' : 'text-emerald-600'
                                }`}>
                                {result.prediction === 1 ? '!' : '✓'}
                            </div>

                            <h3 className="text-slate-500 text-sm font-bold uppercase mb-4">Inference Result</h3>
                            <div className={`text-3xl font-black mb-6 ${result.prediction === 1 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                {result.status}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Return Probability</span>
                                        <span className="text-2xl font-black text-slate-800">{result.probability}%</span>
                                    </div>
                                    <div className="w-full bg-white/50 rounded-full h-4 p-1 shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${result.prediction === 1 ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                                }`}
                                            style={{ width: `${result.probability}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/40 rounded-2xl border border-white text-xs leading-relaxed text-slate-600">
                                    <span className="font-bold text-slate-800 block mb-1">Observation:</span>
                                    Prediction synthesized from customer historical return rate of <b>{formData.customer_return_rate * 100}%</b> and current transaction metrics.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300 italic font-serif">i</div>
                            <p className="text-slate-400 font-medium">Ready for input data...</p>
                        </div>
                    )}

                    {/* AI Disclaimer Section */}
                    <div className="bg-slate-800/5 backdrop-blur-sm border border-slate-200 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-3 text-slate-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-bold uppercase tracking-wider">AI Disclaimer</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-500">
                            Predictions generated by <b>SmartReturn AI</b> are based on historical data patterns and statistical probabilities. They do not guarantee future outcomes. This tool should be used as a <b>decision-support aid</b> and not as the sole basis for restrictive customer actions. Data processed here is for demonstration purposes and may vary based on real-time market shifts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnPredictor;