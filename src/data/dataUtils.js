// Data utilities to handle large datasets
import customersRaw from "./customers.js";
import ordersRaw from "./orders.js";
import orderItemsRaw from "./orderItems.js";
import orderReturnsRaw from "./orderReturns.js";
import productsRaw from "./product.js";
import caddressRaw from "./caddress.js"
import paymentRaw from "./payments.js"
import shippmentRaw from "./shippments.js"

export const customers = customersRaw.slice(0, 1000); // Limiting to first 1000 customers for performance
export const orders = ordersRaw;
export const caddress=caddressRaw
export const orderItems = orderItemsRaw;
export const payments=paymentRaw
export const shippments=shippmentRaw
export const orderReturns = orderReturnsRaw;
export const products = productsRaw.slice(0, 1000); // Limiting to first 1000 products for performance