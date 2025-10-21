import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Static definitions (assuming currency)
const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
const CURRENCY = "₱";

export default function Shop() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // For user feedback

    // --- NEW CART STATE ---
    const [cart, setCart] = useState([]); 
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // For quantity modal
    const [quantity, setQuantity] = useState(1); // For quantity modal input

    const token = localStorage.getItem("access");
    const isAuthenticated = !!token;

    // --- Data Fetching (Unchanged) ---
    const fetchAvailableProducts = useCallback(async () => {
        setLoading(true);
        if (!isAuthenticated) {
            setError("Please log in to view and purchase products.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${BASE_URL}products/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            const available = response.data.filter(p => p.is_available && p.stocks > 0);
            setProducts(available);
            setError(null);
        } catch (err) {
            console.error("Error fetching products:", err.response || err);
            setError(`Failed to load shop items. ${err.response?.data?.detail || 'Please try again later.'}`);
        } finally {
            setLoading(false);
        }
    }, [token, isAuthenticated]);

    useEffect(() => {
        fetchAvailableProducts();
    }, [fetchAvailableProducts]);


    // --- Action Handlers ---

    // 1. Opens the quantity modal
    const handleAddClick = (product) => {
        if (!isAuthenticated) {
            setMessage("You must be logged in to add items to your cart.");
            return;
        }
        setSelectedProduct(product);
        setQuantity(1);
    };

    // 2. Confirms product and quantity, then adds to cart
    const handleConfirmAddToCart = () => {
        if (quantity < 1 || quantity > selectedProduct.stocks) {
            alert(`Please enter a quantity between 1 and ${selectedProduct.stocks}.`);
            return;
        }

        const existingItem = cart.find(item => item.id === selectedProduct.id);
        
        let newCart;
        if (existingItem) {
            // Update quantity if item already exists
            newCart = cart.map(item => 
                item.id === selectedProduct.id 
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            );
        } else {
            // Add new item to cart
            newCart = [...cart, { ...selectedProduct, quantity: quantity }];
        }

        setCart(newCart);
        setMessage(`Added ${quantity} x "${selectedProduct.name}" to cart.`);
        setSelectedProduct(null); // Close the modal
        setTimeout(() => setMessage(''), 3000); 
    };

    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const handleClearCart = () => {
        setCart([]);
        setIsCartModalOpen(false);
        setMessage("Cart cleared successfully.");
        setTimeout(() => setMessage(''), 3000);
    };

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);


    // --- Render Content ---

    if (loading) {
        return (
            <div className="p-8 text-center bg-chonky-brown-50 min-h-screen">
                <p className="text-default-text">Loading shop...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-chonky-brown-50 min-h-screen">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-auto max-w-lg" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            </div>
        );
    }
    
    // Fallback for empty shop
    if (products.length === 0) {
        return (
             <div className="p-8 text-center bg-chonky-brown-50 min-h-screen">
                <p className="text-default-text font-semibold text-lg">No products are currently available in the shop.</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-chonky-brown-50 min-h-screen relative">
            <h1 className="text-4xl font-extrabold mb-8 text-default-text border-b border-text-brown pb-3 max-w-6xl mx-auto">
                Pet Essentials & Supplies
            </h1>
            
            {message && (
                <div className="p-4 mb-6 text-sm bg-green-100 text-green-800 rounded-lg max-w-6xl mx-auto">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-6xl mx-auto">
                {products.map(product => (
                    <div 
                        key={product.id} 
                        className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition duration-300 border border-gray-200 flex flex-col justify-between"
                    >
                        {/* Product Image Placeholder */}
                        <div className="relative h-48 w-full bg-gray-200">
                            <img 
                                src={`https://placehold.co/400x300/F5E6CC/333?text=${product.category}`}
                                alt={product.name} 
                                className="w-full h-full object-cover"
                            />
                            {/* Stock Indicator */}
                             <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${
                                product.stocks <= 10 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                            }`}>
                                {product.stocks} in stock
                            </span>
                        </div>

                        {/* Product Details */}
                        <div className="p-4 flex flex-col flex-grow">
                            <h2 className="text-xl font-bold mb-1 text-default-text">{product.name}</h2>
                            <p className="text-sm text-gray-600 flex-grow">{product.description.substring(0, 70)}...</p>
                            
                            <div className="mt-3">
                                <span className="text-sm font-medium text-gray-500">{product.unit_of_measure.toUpperCase()}</span>
                            </div>
                        </div>

                        {/* Price and Action */}
                        <div className="p-4 pt-0 border-t border-gray-100">
                             <div className="flex justify-between items-center mb-3">
                                <span className="text-2xl font-extrabold text-default-text">
                                    {CURRENCY}{parseFloat(product.price).toFixed(2)}
                                </span>
                                
                            </div>
                             <button
                                onClick={() => handleAddClick(product)} // Calls the handler to open quantity modal
                                // Custom button color
                                className="w-full bg-yellow text-default-text font-semibold py-3 rounded-lg hover:opacity-90 transition duration-150 shadow-md"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- Floating Cart Button --- */}
            {isAuthenticated && (
                <button
                    onClick={() => setIsCartModalOpen(true)}
                    className="fixed bottom-8 right-8 bg-default-text text-yellow p-4 rounded-full shadow-2xl transition duration-300 hover:scale-105 flex items-center space-x-2 z-40"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <span className="font-bold">{cartItemCount}</span>
                </button>
            )}

            {/* --- Quantity Selection Modal --- */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4 text-default-text">Confirm Quantity</h3>
                        <p className="text-gray-700 mb-4">Adding: {selectedProduct.name}</p>
                        
                        <div className="mb-4">
                            <label className="block text-default-text font-semibold mb-2">Quantity (Max: {selectedProduct.stocks})</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, Math.min(selectedProduct.stocks, Number(e.target.value))))}
                                min="1"
                                max={selectedProduct.stocks}
                                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-yellow"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="px-4 py-2 bg-gray-300 text-default-text rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAddToCart}
                                className="bg-yellow text-default-text px-4 py-2 rounded-lg hover:opacity-80 transition font-semibold"
                            >
                                Add {quantity} to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Cart View Modal --- */}
            {isCartModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl">
                        <h3 className="text-2xl font-extrabold mb-4 text-default-text border-b pb-2">Your Shopping Cart</h3>

                        {cart.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Your cart is empty.</p>
                        ) : (
                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                        <div className="flex items-center space-x-4">
                                            <img 
                                                src={`https://placehold.co/60x60/F5E6CC/333?text=${item.category.substring(0, 3)}`}
                                                alt={item.name} 
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                            <div>
                                                <p className="font-semibold text-default-text">{item.name}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="font-bold text-default-text">
                                                {CURRENCY}{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveFromCart(item.id)}
                                                className="text-red-500 hover:text-red-700 transition"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                            <span className="text-xl font-bold text-default-text">Total: {CURRENCY}{cartTotal.toFixed(2)}</span>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleClearCart}
                                    disabled={cart.length === 0}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                                >
                                    Clear Cart
                                </button>
                                <button
                                    onClick={() => alert("Proceeding to checkout!")}
                                    disabled={cart.length === 0}
                                    className="bg-yellow text-default-text px-4 py-2 rounded-lg hover:opacity-80 transition font-semibold disabled:opacity-50"
                                >
                                    Checkout
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setIsCartModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
