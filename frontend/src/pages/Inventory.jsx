import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
    const token = localStorage.getItem("access");

    const fetchProducts = useCallback(() => {
        if (!token) {
            setError("Authentication token missing. Please log in.");
            setLoading(false);
            return;
        }

        axios
            .get(`${BASE_URL}products/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setProducts(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching products:", err);
                setError("Failed to load inventory. Check backend connection or admin permissions.");
                setLoading(false);
            });
    }, [token, BASE_URL]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const getStatusStyles = (isAvailable, stocks) => {
        if (!isAvailable) {
            return "bg-gray-500 text-white";
        }
        if (stocks <= 5) {
            return "bg-red-500 text-white";
        }
        if (stocks <= 20) {
            return "bg-yellow-500 text-gray-800";
        }
        return "bg-green-500 text-white";
    };

    if (loading) {
        return <div className="p-8 text-center text-lg font-medium">Loading inventory data...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600 border border-red-200 bg-red-50 rounded-lg">{error}</div>;
    }

    return (
        <div className="p-6 bg-white shadow-xl rounded-xl">
            <h1 className="text-3xl font-extrabold mb-6 text-indigo-700">Product Inventory Overview</h1>
            <p className="mb-4 text-gray-600">Total Products in Stock: {products.reduce((sum, p) => sum + p.stocks, 0)}</p>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₱)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stocks</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50 transition duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {product.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.category}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-700">
                                    {parseFloat(product.price).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                                    {product.stocks} {product.unit_of_measure}
                                </td>
                                {/* FIX: Added text-center here to align the status badge */}
                                <td className="px-6 py-4 whitespace-nowrap text-center"> 
                                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(product.is_available, product.stocks)}`}>
                                        {product.is_available ? (product.stocks === 0 ? 'Out of Stock' : 'In Stock') : 'Unavailable'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {products.length === 0 && (
                 <p className="mt-6 text-center text-gray-500">No products found in the inventory. Add new products via Products Management.</p>
            )}
        </div>
    );
}
