import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ServicesDashboard() {
    const [services, setServices] = useState([]);
    const [form, setForm] = useState({
        name: "",
        description: "",
        included: "",
        duration: "",
        durationUnit: "minutes",
        cost: "",
        availability: true,
    });
    const [editingService, setEditingService] = useState(null); // Holds the service object for the modal
    const [editForm, setEditForm] = useState({}); // Holds the editable form data
    const [isEditing, setIsEditing] = useState(false); // NEW STATE: Controls view/edit mode in modal

    const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
    const token = localStorage.getItem("access");

    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        if (!token) return;

        axios
            .get(`${BASE_URL}services/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setServices(res.data))
            .catch((err) => console.error("Error fetching services:", err));
    }, [token]);

    // --- HANDLERS FOR ADD FORM (Unchanged) ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleAddService = (e) => {
        e.preventDefault();
        // ... (Add service logic)
        if (!form.name || !form.description || !form.duration || !form.cost) {
            alert("Please fill in all required fields.");
            return;
        }

        const payload = { ...form, duration: `${form.duration} ${form.durationUnit}` };

        axios
            .post(`${BASE_URL}services/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setServices([res.data, ...services]);
                setForm({
                    name: "",
                    description: "",
                    included: "",
                    duration: "",
                    durationUnit: "minutes",
                    cost: "",
                    availability: true,
                });
            })
            .catch((err) => console.error("Error adding service:", err));
    };

    // --- HANDLERS FOR MODAL (View/Edit) ---

    // 1. Function to open the modal in VIEW mode
    const handleView = (service) => {
        const [duration, durationUnit] = service.duration.split(" ");
        
        // Initialize the edit form state
        setEditForm({
            ...service,
            duration: duration || "",
            durationUnit: durationUnit || "minutes",
        });

        setEditingService(service); // Show the modal
        setIsEditing(false); // Ensure it starts in View mode
    };

    // 2. Handler for changes within the edit modal form
    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // 3. Handler for submitting the updated service data
    const handleUpdateService = (e) => {
        e.preventDefault();

        const id = editingService.id;
        const { duration, durationUnit, ...rest } = editForm;
        
        const payload = { 
            ...rest,
            duration: `${duration} ${durationUnit}`,
            cost: parseFloat(editForm.cost),
        };

        axios
            .put(`${BASE_URL}services/${id}/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setServices((prev) => prev.map((s) => (s.id === id ? res.data : s)));
                setEditingService(null); // Close the modal
                setIsEditing(false); // Reset edit state
            })
            .catch((err) => console.error("Error updating service:", err));
    };

    // Function to close the modal and reset states
    const handleCloseModal = () => {
        setEditingService(null);
        setIsEditing(false);
    }

    // --- HANDLERS FOR ACTIONS (Unchanged) ---

    const handleToggleAvailability = (id) => {
        // ... (Toggle availability logic)
        axios
            .patch(`${BASE_URL}services/${id}/toggle/`, null, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setServices((prev) => prev.map((s) => (s.id === id ? res.data : s)));
            })
            .catch((err) => console.error("Error toggling availability:", err));
    };

    const handleRemoveService = (id) => {
        // ... (Remove service logic)
        if (!window.confirm("Are you sure you want to permanently delete this service?")) return;

        axios
            .delete(`${BASE_URL}services/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then(() => {
                setServices((prev) => prev.filter((s) => s.id !== id));
            })
            .catch((err) => console.error("Error removing service:", err));
    };

    // --- RENDER ---
    return (
        // FIX: Applied main container background color
        <div className="p-6 flex gap-6 bg-chonky-brown-50 min-h-screen"> 
            
            {/* Form Section (Add New Service) */}
            <div className="w-1/2 bg-white shadow-xl rounded-lg p-6 space-y-4 border border-text-brown">
                {/* FIX: Applied text-default-text color */}
                <h1 className="text-3xl font-bold mb-6 text-default-text">Services Dashboard</h1>

                <form onSubmit={handleAddService} className="space-y-4">
                    
                    {/* Input Field Group 1 */}
                    <div>
                        <label className="block text-default-text font-semibold mb-1">Service Name</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange} 
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow focus:border-yellow" 
                                placeholder="Enter service name"/>
                    </div>
                    
                    {/* Input Field Group 2 */}
                    <div>
                        <label className="block text-default-text font-semibold mb-1">Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} 
                                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow focus:border-yellow" 
                                  placeholder="Enter description"/>
                    </div>
                    
                    {/* Input Field Group 3 */}
                    <div>
                        <label className="block text-default-text font-semibold mb-1">What's Included?</label>
                        <textarea name="included" value={form.included} onChange={handleChange} rows={3} 
                                  className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-yellow focus:border-yellow" 
                                  placeholder="List items or features included in this service"/>
                    </div>
                    
                    {/* Input Field Group 4 (Duration/Cost Grid) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-default-text font-semibold mb-1">Duration</label>
                            <div className="flex gap-2">
                                <input type="number" name="duration" value={form.duration} onChange={handleChange} 
                                       className="w-2/3 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow focus:border-yellow" 
                                       placeholder="e.g. 30"/>
                                <select name="durationUnit" value={form.durationUnit} onChange={handleChange} 
                                        className="w-1/3 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow focus:border-yellow">
                                    <option value="minutes">Minutes</option><option value="hours">Hours</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-default-text font-semibold mb-1">Cost</label>
                            <div className="flex items-center border border-gray-300 rounded-md p-2 focus-within:ring-2 focus-within:ring-yellow focus-within:border-yellow">
                                <span className="text-default-text mr-2">₱</span>
                                <input type="number" name="cost" value={form.cost} onChange={handleChange} 
                                       className="w-full outline-none" placeholder="e.g. 500"/>
                            </div>
                        </div>
                    </div>
                    
                    {/* FIX: Applied bg-yellow button styling */}
                    <button type="submit" className="bg-yellow text-default-text font-semibold px-6 py-2 rounded hover:opacity-80 transition shadow-md">
                        Add Service
                    </button>
                </form>
            </div>

            {/* Services Display Section */}
            <div className="w-1/2 space-y-4">
                {/* FIX: Applied text-default-text color */}
                <h2 className="text-2xl font-bold mb-4 text-default-text">Current Services</h2>
                
                {services.length === 0 ? (
                    <p className="text-default-text">No services added yet.</p>
                ) : (
                    services.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white shadow-xl rounded-lg p-4 flex flex-col gap-2 border border-gray-200"
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-default-text">{service.name}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleView(service)} 
                                        className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                                    >
                                        View
                                    </button>

                                    <button
                                        onClick={() => handleToggleAvailability(service.id)}
                                        className={`px-3 py-1 rounded text-white ${
                                            service.availability ? "bg-green-600" : "bg-red-600"
                                        }`}
                                    >
                                        {service.availability ? "Available" : "Unavailable"}
                                    </button>

                                    <button
                                        onClick={() => handleRemoveService(service.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* View/Edit Modal */}
            {editingService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-1/3">
                        <h2 className="text-2xl font-bold mb-4 text-default-text">
                            {isEditing ? `Edit: ${editingService.name}` : `View: ${editingService.name}`}
                        </h2>

                        {/* CONDITIONAL CONTENT RENDERING */}
                        {!isEditing ? (
                            // --- VIEW MODE (Read-Only) ---
                            <>
                                <p className="mb-2 text-default-text"><strong>Description:</strong> {editingService.description}</p>
                                <div className="mb-2 text-default-text">
                                    <strong>What's Included:</strong>
                                    <ul className="list-disc list-inside ml-4">
                                        {editingService.included
                                            ? editingService.included.split("\n").map((item, idx) => <li key={idx}>{item}</li>)
                                            : <li>—</li>}
                                    </ul>
                                </div>
                                <p className="mb-2 text-default-text"><strong>Duration:</strong> {editingService.duration}</p>
                                <p className="mb-4 text-default-text"><strong>Cost:</strong> ₱{editingService.cost}</p>
                                <p className="mb-4 text-default-text"><strong>Availability:</strong> <span className={`font-semibold ${editingService.availability ? 'text-green-600' : 'text-red-600'}`}>{editingService.availability ? 'Available' : 'Unavailable'}</span></p>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)} // Switches to Edit Mode
                                        className="bg-yellow text-default-text px-4 py-2 rounded hover:opacity-80 transition"
                                    >
                                        Edit Service
                                    </button>
                                </div>
                            </>
                        ) : (
                            // --- EDIT MODE (Editable Form) ---
                            // Ensure the form wraps everything in edit mode
                            <form onSubmit={handleUpdateService} className="space-y-4">
                                {/* Service Name */}
                                <div>
                                    <label className="block text-default-text font-semibold mb-1">Name</label>
                                    <input type="text" name="name" value={editForm.name || ''} onChange={handleEditChange} 
                                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow focus:border-yellow"/>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-default-text font-semibold mb-1">Description</label>
                                    <textarea name="description" value={editForm.description || ''} onChange={handleEditChange} 
                                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow focus:border-yellow"/>
                                </div>
                                
                                <div>
                                    <label className="block text-default-text font-semibold mb-1">What's Included?</label>
                                    <textarea name="included" value={editForm.included || ''} onChange={handleEditChange} rows={4} 
                                                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-yellow focus:border-yellow" 
                                                placeholder="List items or features, separated by new lines"/>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Duration */}
                                    <div>
                                        <label className="block text-default-text font-semibold mb-1">Duration</label>
                                        <div className="flex gap-2">
                                            <input type="number" name="duration" value={editForm.duration || ''} onChange={handleEditChange} 
                                                    className="w-2/3 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow focus:border-yellow" min="1"/>
                                            <select name="durationUnit" value={editForm.durationUnit || 'minutes'} onChange={handleEditChange} 
                                                    className="w-1/3 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow focus:border-yellow">
                                                <option value="minutes">Minutes</option><option value="hours">Hours</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Cost */}
                                    <div>
                                        <label className="block text-default-text font-semibold mb-1">Cost</label>
                                        <div className="flex items-center border border-gray-300 rounded-md p-2">
                                            <span className="text-default-text mr-2">₱</span>
                                            <input type="number" name="cost" value={editForm.cost || ''} onChange={handleEditChange} 
                                                    className="w-full outline-none" min="0"/>
                                        </div>
                                    </div>
                                </div>

                                {/* Availability Checkbox */}
                                <div className="flex items-center">
                                    <input type="checkbox" id="edit-availability" name="availability" checked={editForm.availability || false} onChange={handleEditChange} className="mr-2"/>
                                    <label htmlFor="edit-availability" className="text-default-text">Is this service currently available?</label>
                                </div>


                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)} // Switches back to View Mode
                                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                                    >
                                        Cancel Edit
                                    </button>
                                    <button
                                        type="submit" 
                                        className="bg-yellow text-default-text px-4 py-2 rounded hover:opacity-80 transition font-semibold"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
