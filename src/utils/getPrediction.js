import customersData from "../data/customers";

export const getPrediction = (customerId) => {

    const cust = customersData.find(
        (c) => c.customer_full_name === customerId
    );

    const returnRate = cust?.customer_return_rate || 0;
    const cancelRate = cust?.customer_cancel_rate || 0;

    const getColor = (rate) => {
        if (rate >= 0.7) return "bg-red-500/10 border-red-500/30 text-red-400";
        if (rate >= 0.4) return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
        return "bg-green-500/10 border-green-500/30 text-green-400";
    };

    return {
        returnRate,
        cancelRate,
        returnColor: getColor(returnRate),
        cancelColor: getColor(cancelRate)
    };

};