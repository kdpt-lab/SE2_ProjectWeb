import React, { useState, useEffect, useCallback } from "react"; // ADDED useCallback
import axios from "axios";

export default function ProductsDashboard() {
    // FIXED WARNING 1: 'products' is unused. We keep the state but remove setProducts.
    // Since this page is only for creation, we don't need to track the list of products here.
    // If you need to access the list later, you would pass setProducts or the list down from a parent component.
    const [form, setForm] = useState({
        name: "",
        description: "",
        category: "Food", 
        unitOfMeasure: "piece", 
        stocks: 0, 
        price: "", 
        isAvailable: true,
    });
    
    const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
    const token = localStorage.getItem("access");

    // --- INITIAL DATA FETCH (Still helpful for background context) ---
    // FIXED WARNING 2: Wrapped fetchProducts in useCallback to satisfy useEffect dependency.
    const fetchProducts = useCallback(() => {
        if (!token) return;
        // The result is currently unused but the function remains for connection testing.
        axios
            .get(`${BASE_URL}products/`, { 
                headers: { Authorization: `Bearer ${token}` },
            })
            .then(() => {
                // We're just logging success, not setting state here.
            })
            .catch((err) => console.error("Error fetching products:", err));
    }, [token]); // token is the only dependency for fetchProducts

    // FIXED WARNING 2: Now including fetchProducts in the dependency array.
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); 

    // --- HANDLERS FOR ADD FORM ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ 
            ...form, 
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value) 
        });
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        if (!form.name || !form.description || form.stocks < 0 || !form.price) { 
            alert("Please fill in all required fields and ensure stock/price are valid.");
            return;
        }

        const payload = { 
            ...form,
            is_available: form.isAvailable, 
            unit_of_measure: form.unitOfMeasure, 
            price: parseFloat(form.price)
        };
        
        axios
            .post(`${BASE_URL}products/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                alert(`Product "${res.data.name}" added successfully!`);
                
                // Re-fetch list in background to ensure up-to-date state in Django
                fetchProducts(); 
                
                // Reset form to default values for next entry
                setForm({
                    name: "", description: "", category: "Food", unitOfMeasure: "piece",
                    stocks: 0, price: "", isAvailable: true,
                });
            })
            .catch((err) => {
                console.error("Error adding product:", err.response ? err.response.data : err);
                alert("Error adding product. Check console for details.");
            });
    };

    // --- RENDER ---
    return (
        <div className="p-6 flex justify-center">
            {/* Form Section (Add New Product) - NOW CENTERED */}
            <div className="w-full lg:w-2/3 xl:w-1/2 bg-white shadow-2xl rounded-xl p-8 space-y-6">
                <h1 className="text-3xl font-extrabold mb-6 text-indigo-700 border-b pb-3">
                    Add New Pet Product
                </h1>

                <form onSubmit={handleAddProduct} className="space-y-4">
                    
                    {/* Name */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Product Name</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Salmon Flakes Dog Food" required/>
                    </div>
                    
                    {/* Description */}
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Description / Pet Details</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" placeholder="Target pet (dog/cat), age, ingredients, warnings, etc." required/>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Category</label>
                            <select name="category" value={form.category} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500">
                                <option value="Food">Food</option>
                                <option value="Toy">Toy / Entertainment</option>
                                <option value="Necessity">Necessity (Litter, Grooming)</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Unit of Measure */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Unit of Measure</label>
                            <select name="unitOfMeasure" value={form.unitOfMeasure} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500">
                                <option value="piece">Piece</option>
                                <option value="kg">Kilogram (kg)</option>
                                <option value="bag">Bag</option>
                                <option value="can">Can</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Stocks */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Current Stocks</label>
                            <input type="number" name="stocks" value={form.stocks} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 100" required/>
                        </div>

                        {/* Price */}
                        <div className="col-span-2">
                            <label className="block text-gray-700 font-semibold mb-1">Price</label>
                            <div className="flex items-center border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500">
                                <span className="text-gray-600 px-1 text-lg">₱</span>
                                <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full outline-none p-1" placeholder="e.g. 500.00" min="0" required/>
                            </div>
                        </div>
                    </div>
                    
                    {/* Availability Checkbox */}
                    <div className="flex items-center pt-2">
                        <input type="checkbox" id="add-isAvailable" name="isAvailable" checked={form.isAvailable} onChange={handleChange} className="mr-3 h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                        <label htmlFor="add-isAvailable" className="text-gray-700 font-medium">Product available for sale?</label>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-lg text-lg font-semibold mt-6">
                        Add New Product
                    </button>
                </form>
            </div>
            {/* The Products Display Section and the View/Edit Modal have been removed. */}
        </div>
    );
}
