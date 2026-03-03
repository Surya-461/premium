import { useState, useEffect } from "react";

const MLPredict = () => {
    const [features, setFeatures] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [requiredCount, setRequiredCount] = useState(null);

    // 🔹 Fetch model metadata
    useEffect(() => {
        fetch("http://127.0.0.1:8000/")
            .then(res => res.json())
            .then(data => setRequiredCount(data.features_required));
    }, []);

    const handlePredict = async () => {
        setError("");
        setResult(null);

        const values = features.split(",").map(Number);

        if (values.some(isNaN)) {
            setError("Only numbers allowed");
            return;
        }

        if (requiredCount !== null && values.length !== requiredCount) {
            setError(`Model requires exactly ${requiredCount} values`);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("http://127.0.0.1:8000/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features: values })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail);

            setResult(data.prediction);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold text-center mb-4">
                    ML Prediction
                </h2>

                {requiredCount !== null && (
                    <p className="text-sm text-slate-500 text-center mb-2">
                        Enter {requiredCount} comma-separated values
                    </p>
                )}

                <input
                    className="w-full border rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 12,45,6,78"
                    value={features}
                    onChange={e => setFeatures(e.target.value)}
                />

                <button
                    onClick={handlePredict}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                    {loading ? "Predicting..." : "Predict"}
                </button>

                {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
                {result !== null && (
                    <p className="mt-4 text-center text-xl font-bold text-emerald-600">
                        Result: {result}
                    </p>
                )}
            </div>
        </div>
    );
};

export default MLPredict;