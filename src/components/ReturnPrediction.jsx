import { useState } from "react";

function ReturnPrediction() {
    const [formData, setFormData] = useState({
        Quantity: "",
        Price: "",
        Discount: ""
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const BASE_URL = "https://backend-e011.onrender.com";

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/predict-return`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    Quantity: Number(formData.Quantity),
                    Price: Number(formData.Price),
                    Discount: Number(formData.Discount)
                })
            });

            const data = await response.json();
            setResult(data.prediction);
        } catch (error) {
            console.error("Error:", error);
            alert("Prediction failed!");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-black">
            <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Return Prediction
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="number"
                        name="Quantity"
                        placeholder="Quantity"
                        value={formData.Quantity}
                        onChange={handleChange}
                        className="w-full p-3 border rounded-lg"
                        required
                    />

                    <input
                        type="number"
                        name="Price"
                        placeholder="Price"
                        value={formData.Price}
                        onChange={handleChange}
                        className="w-full p-3 border rounded-lg"
                        required
                    />

                    <input
                        type="number"
                        name="Discount"
                        placeholder="Discount"
                        value={formData.Discount}
                        onChange={handleChange}
                        className="w-full p-3 border rounded-lg"
                        required
                    />

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition"
                    >
                        {loading ? "Predicting..." : "Predict"}
                    </button>
                </form>

                {result !== null && (
                    <div className="mt-6 text-center">
                        <h3 className="text-lg font-semibold">
                            Prediction Result:
                        </h3>
                        <p className="text-2xl font-bold mt-2 text-indigo-600">
                            {result === 1 ? "Likely to Return" : "Not Likely to Return"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReturnPrediction;
