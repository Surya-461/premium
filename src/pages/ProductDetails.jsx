import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { products } from "../data/dataUtils";
import { addItem } from "../slices/cartSlice";
import { FaShoppingCart, FaBolt, FaStar } from "react-icons/fa";

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const product = products.find(
        (p) => p.product_id.toString() === id
    );

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                Product not found
            </div>
        );
    }

    // Similar products (same category)
    const similarProducts = products
        .filter(
            (p) =>
                p.product_category === product.product_category &&
                p.product_id !== product.product_id
        )
        .slice(0, 4);

    const handleAddToCart = () => {
        dispatch(
            addItem({
                product_id: product.product_id,
                product_name: product.product_name,
                selling_unit_price: product.selling_unit_price,
                image_url: product.image_url,
                quantity: 1,
            })
        );
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate("/cart");
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white px-6 py-16">

            {/* PRODUCT DETAILS */}
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">

                {/* Image */}
                <div>
                    <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="rounded-3xl w-full object-cover shadow-xl"
                    />
                </div>

                {/* Info */}
                <div>
                    <p className="text-slate-400 mb-2">
                        {product.product_department} / {product.product_category}
                    </p>

                    <h1 className="text-4xl font-bold mb-4">
                        {product.product_name}
                    </h1>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                        {[...Array(5)].map((_, i) => (
                            <FaStar
                                key={i}
                                className={
                                    i < Math.round(product.product_rating || 4)
                                        ? "text-yellow-400"
                                        : "text-slate-600"
                                }
                            />
                        ))}
                        <span className="text-slate-400 text-sm">
                            ({product.product_rating || 4} Reviews)
                        </span>
                    </div>

                    <p className="text-3xl text-blue-400 font-bold mb-6">
                        ₹{product.selling_unit_price.toFixed(2)}
                    </p>

                    <p className="text-slate-300 mb-8 leading-relaxed">
                        Premium quality product crafted with attention to detail.
                        Designed for comfort, durability, and modern style.
                        A perfect addition to your wardrobe.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={handleAddToCart}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-2"
                        >
                            <FaShoppingCart /> Add to Cart
                        </button>

                        <button
                            onClick={handleBuyNow}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center gap-2"
                        >
                            <FaBolt /> Buy Now
                        </button>
                    </div>
                </div>
            </div>

            {/* SIMILAR PRODUCTS */}
            {similarProducts.length > 0 && (
                <div className="max-w-6xl mx-auto mt-20">
                    <h2 className="text-2xl font-bold mb-8">
                        Similar Products
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {similarProducts.map((p) => (
                            <div
                                key={p.product_id}
                                onClick={() => navigate(`/product/${p.product_id}`)}
                                className="bg-slate-800 p-4 rounded-2xl cursor-pointer hover:scale-105 transition"
                            >
                                <img
                                    src={p.image_url}
                                    alt={p.product_name}
                                    className="rounded-xl mb-3"
                                />
                                <h3 className="text-sm font-semibold">
                                    {p.product_name}
                                </h3>
                                <p className="text-blue-400 font-bold">
                                    ₹{p.selling_unit_price.toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;