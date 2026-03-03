/**
 * mlPrediction.js
 * ---------------
 * API client for the FastAPI ML backend.
 *
 * Exports:
 *   fetchCancelPrediction(orderData)         → { cancel_risk, cancel_probability }
 *   fetchReturnPrediction(orderData)          → { return_risk, return_probability }
 *   fetchBothPredictions(orderData)           → combined
 *   predictOrderRisk(orderId, orderData)      → { order_id, cancel_*, return_* }
 *   fetchOrdersWithRisk(status, limit)        → { orders, total, status }
 *   fetchBatchPredictions(limit)              → { cancel: {}, return: {} }
 */

const ML_BASE_URL = import.meta.env.VITE_ML_API_URL || "http://localhost:5000";

// ── Numeric helpers ────────────────────────────────────────────────────────
function cleanNumber(val) {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^\d.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function toNumeric(val) {
    const cleaned = cleanNumber(val);
    if (cleaned > 0) return Math.floor(Math.abs(cleaned));
    const str = String(val || "");
    if (!str || str === "0") return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

// ── Payload builders ───────────────────────────────────────────────────────
function buildCancelPayload(order) {
    const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const date = order.order_date ? new Date(order.order_date) : new Date();
    const itemsCount = order.num_of_item ?? order.items?.length ?? 1;
    const totalQty = order.ordered_quantity ?? order.items?.reduce((a, i) => a + (i.quantity || 1), 0) ?? 1;
    const firstItem = order.items?.[0] ?? {};
    const firstItemPrice = order.selling_unit_price ?? firstItem.selling_unit_price ?? firstItem.price
        ?? (order.order_total_amount / Math.max(totalQty, 1));

    return {
        order_id: toNumeric(order.order_id ?? order.id),
        customer_id: toNumeric(order.customer_id ?? order.userId),
        order_total_amount: cleanNumber(order.order_total_amount ?? order.totalAmount ?? 0),
        num_of_item: cleanNumber(itemsCount),
        shipping_charge: cleanNumber(order.shipping_charge ?? 0),
        order_year: date.getFullYear(),
        order_month: date.getMonth() + 1,
        order_weekday: WEEKDAY[date.getDay()],
        is_weekend: [0, 6].includes(date.getDay()) ? 1 : 0,
        ordered_quantity: cleanNumber(totalQty),
        selling_unit_price: cleanNumber(firstItemPrice),
        is_returned: 0,
        payment_method: (order.payment_method ?? order.paymentMethod ?? firstItem.payment_method ?? "unknown").toLowerCase(),
        customer_age: cleanNumber(order.customer_age ?? order.customer?.age ?? 30),
        customer_gender: (order.customer_gender ?? order.customer?.gender ?? "M").charAt(0).toUpperCase(),
        customer_is_active: 1,
        customer_cancel_rate: cleanNumber(order.customer_cancel_rate ?? 0),
        customer_total_orders: cleanNumber(order.customer_total_orders ?? order.customer?.total_orders ?? 1),
        customer_avg_order_value: cleanNumber(order.customer_avg_order_value ?? order.order_total_amount ?? 0),
    };
}

function buildReturnPayload(order) {
    const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const date = order.order_date ? new Date(order.order_date) : new Date();
    const itemsCount = order.num_of_item ?? order.items?.length ?? 1;
    const totalQty = order.ordered_quantity ?? order.items?.reduce((a, i) => a + (i.quantity || 1), 0) ?? 1;
    const firstItem = order.items?.[0] ?? {};
    const sp = Number(order.selling_unit_price ?? firstItem.selling_unit_price ?? firstItem.price
        ?? (order.order_total_amount / Math.max(totalQty, 1)));

    return {
        order_item_id: toNumeric(order.order_item_id ?? firstItem.order_item_id ?? order.order_id ?? order.id),
        order_id: toNumeric(order.order_id ?? order.id),
        customer_id: toNumeric(order.customer_id ?? order.userId),
        product_id: toNumeric(order.product_id ?? firstItem.product_id ?? firstItem.id),
        selling_unit_price: sp,
        ordered_quantity: cleanNumber(order.ordered_quantity ?? firstItem.quantity ?? totalQty),
        discount_amount: cleanNumber(order.discount_amount ?? firstItem.discount_amount ?? 0),
        total_amount: cleanNumber(order.order_total_amount ?? order.total_amount ?? sp * totalQty),
        order_total_amount: cleanNumber(order.order_total_amount ?? sp * totalQty),
        shipping_charge: cleanNumber(order.shipping_charge ?? 0),
        num_of_item: cleanNumber(itemsCount),
        order_year: date.getFullYear(),
        order_month: date.getMonth() + 1,
        order_weekday: WEEKDAY[date.getDay()],
        is_weekend: [0, 6].includes(date.getDay()) ? 1 : 0,
        payment_method: (order.payment_method ?? order.paymentMethod ?? firstItem.payment_method ?? "unknown").toLowerCase(),
        customer_age: cleanNumber(order.customer_age ?? 30),
        customer_gender: (order.customer_gender ?? "M").charAt(0).toUpperCase(),
        customer_is_active: 1,
        customer_return_rate: cleanNumber(order.customer_return_rate ?? 0.05),
        customer_total_orders: cleanNumber(order.customer_total_orders ?? 1),
        product_return_rate: cleanNumber(order.product_return_rate ?? 0.097),
        product_rating: cleanNumber(order.product_rating ?? firstItem.product_rating ?? 3.5),
        product_rating_count: cleanNumber(order.product_rating_count ?? 100),
        is_product_active: 1,
    };
}

// ── Generic fetch wrapper ─────────────────────────────────────────────────
async function postToML(endpoint, payload) {
    const res = await fetch(`${ML_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.detail?.error || err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// ── Public API ────────────────────────────────────────────────────────────
/** Predict cancellation risk (old-style direct payload) */
export async function fetchCancelPrediction(order) {
    return postToML("/api/predict-cancel", buildCancelPayload(order));
}

/** Predict return risk (old-style direct payload) */
export async function fetchReturnPrediction(order) {
    return postToML("/api/predict-return", buildReturnPayload(order));
}

/** Predict both in one round-trip */
export async function fetchBothPredictions(order) {
    const payload = { ...buildCancelPayload(order), ...buildReturnPayload(order) };
    return postToML("/api/predict-both", payload);
}

/** Batch predictions pre-computed from CSVs on the backend */
export async function fetchBatchPredictions(limit = 0) {
    const url = `${ML_BASE_URL}/api/batch-predict${limit ? `?limit=${limit}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Primary Admin Dashboard endpoint.
 * Sends the full order document to FastAPI for safe, server-side prediction.
 *
 * @param {string} orderId  - Firestore document ID
 * @param {object} orderData - Full order object from Firestore
 * @returns {{ order_id, cancel_probability, cancel_risk, return_probability, return_risk, status }}
 */
export async function predictOrderRisk(orderId, orderData) {
    try {
        const res = await fetch(
            `${ML_BASE_URL}/api/predict-order-risk/${encodeURIComponent(orderId)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_id: orderId, order_data: orderData }),
            }
        );

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.detail?.error || err.error || `HTTP ${res.status}`);
        }

        return await res.json();
    } catch (error) {
        console.error(`[predictOrderRisk] Error for order ${orderId}:`, error);
        return {
            order_id: orderId,
            status: "error",
            error: error.message,
            cancel_probability: null,
            cancel_risk: "Unknown",
            return_probability: null,
            return_risk: "Unknown",
        };
    }
}

/**
 * Fetch categorized orders (New vs Existing) with risk predictions from FastAPI.
 * @param {number} limit - Max orders to process (default 100)
 */
export async function fetchAllOrdersWithRisk(limit = 100) {
    try {
        const url = new URL(`${ML_BASE_URL}/api/all-orders-with-risk`);
        url.searchParams.append("limit", String(limit));

        const res = await fetch(url.toString());
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error("[fetchAllOrdersWithRisk] Error:", error);
        return { status: "error", error: error.message, new_orders: [], existing_orders: [] };
    }
}

/**
 * Fetch live orders + pre-computed risk scores from FastAPI.
 */
export async function fetchOrdersWithRisk(status = "Paid", limit = 20) {
    try {
        const url = new URL(`${ML_BASE_URL}/api/orders-with-risk`);
        url.searchParams.append("status", status);
        url.searchParams.append("limit", String(limit));

        const res = await fetch(url.toString());
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error("[fetchOrdersWithRisk] Error:", error);
        return { status: "error", error: error.message, orders: [], total: 0 };
    }
}

/**
 * Helper: convert probability (0-1) to display string with % sign
 */
// (Keep later implementations below)

/** Format a probability (0-1 or 0-100) into a percentage string */
export function formatProb(prob) {
    if (prob === null || prob === undefined) return '—';
    const num = Number(prob) || 0;
    const asPercent = num <= 1 ? num * 100 : num;
    return `${asPercent.toFixed(1)}%`;
}

/** Return Tailwind classes for a given risk label */
export function riskColor(risk) {
    const r = String(risk || '').toLowerCase();
    if (r === 'high') return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (r === 'medium') return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    if (r === 'low') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    return 'text-slate-400 border-slate-500/20 bg-transparent';
}