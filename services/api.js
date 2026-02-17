import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000",
});

export const getRevenueForecast = (steps) =>
    API.get(`/predict/revenue?steps=${steps}`);

export const getSalesForecast = (steps) =>
    API.get(`/predict/sales?steps=${steps}`);

export const getSegmentation = (income, spending) =>
    API.post(`/segment?income=${income}&spending_score=${spending}`);
