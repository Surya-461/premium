import axios from "axios";

const API = axios.create({
    baseURL: "https://backend-e011.onrender.com",
});

export const getRevenueForecast = (steps) =>
    API.get(`/predict/revenue?steps=${steps}`);

export const getSalesForecast = (steps) =>
    API.get(`/predict/sales?steps=${steps}`);

export const getSegmentation = (income, spending) =>
    API.post(`/segment?income=${income}&spending_score=${spending}`);

// ==============================
// 👤 Customer Segmentation API
// ==============================
export const predictCustomerSegment = async (customerData) => {
    const response = await axios.post(
        `${API.defaults.baseURL}/predict/customer-segment`,
        customerData
    );
    return response.data;
};

// ==============================
// 📋 GET ALL CUSTOMERS (NEW)
// ==============================
export const getCustomers = async () => {
    const response = await API.get(`/customers`);
    return response.data;
};