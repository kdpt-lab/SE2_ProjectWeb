import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Static definitions
const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
const CURRENCY = "₱";

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); 
    
    // FIX: Add // eslint-disable-next-line to ignore the unused 'navigate' variable
    const navigate = useNavigate(); // eslint-disable-line no-unused-vars

    const token = localStorage.getItem("access");
    const isAuthenticated = !!token;

    // --- Data Fetching ---
    const fetchAvailableServices = useCallback(async () => {
        setLoading(true);
        try {
            // Hitting the GET /services/ endpoint
            const response = await axios.get(`${BASE_URL}services/`, {
                headers: { 'Authorization': `Bearer ${token}` } // Assuming auth is required even for viewing
            });
            
            // Filter to show only services marked as available
            const available = response.data.filter(s => s.availability);
            setServices(available);
            setError(null);
        } catch (err) {
            console.error("Error fetching services:", err.response || err);
            setError(`Failed to load services. ${err.response?.data?.detail || 'Please try logging in.'}`);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAvailableServices();
    }, [fetchAvailableServices]);


    // --- Action Handlers ---

    const handleBookNow = (service) => {
        if (!isAuthenticated) {
            setMessage("Please log in to book a service.");
            return;
        }

        // NOTE: In a full application, this would redirect to a booking scheduler page, 
        // passing the service ID. For now, we simulate the booking intent.
        
        setMessage(`Booking requested for "${service.name}". Redirecting to scheduling...`);
        // Example redirect to a booking flow:
        // navigate(`/dashboard/schedule-booking/${service.id}`); 
        
        setTimeout(() => {
             setMessage('');
             alert(`Simulated booking for ${service.name} requested!`);
        }, 1500); 
    };

    // --- Render Content ---

    if (loading) {
        return (
            <div className="p-8 text-center bg-chonky-brown-50 min-h-screen">
                <p className="text-default-text">Loading services...</p>
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
    
    if (services.length === 0) {
        return (
             <div className="p-8 text-center bg-chonky-brown-50 min-h-screen">
                <p className="text-default-text font-semibold text-lg">No services are currently available for booking.</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-chonky-brown-50 min-h-screen">
            <h1 className="text-4xl font-extrabold mb-8 text-default-text border-b border-text-brown pb-3 max-w-6xl mx-auto">
                Pet Services & Care
            </h1>
            
            {message && (
                <div className="p-4 mb-6 text-sm bg-green-100 text-green-800 rounded-lg max-w-6xl mx-auto">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {services.map(service => (
                    <div 
                        key={service.id} 
                        className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition duration-300 border border-gray-200 flex flex-col justify-between"
                    >
                        {/* Service Icon/Image Placeholder */}
                        <div className="relative h-40 w-full bg-gray-200 flex items-center justify-center p-4">
                            <span className="text-xl font-bold text-gray-700">Grooming/Care Icon</span>
                            {/* Time/Duration Badge */}
                            <span className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 rounded-full bg-gray-800/50 text-white">
                                {service.duration}
                            </span>
                        </div>

                        {/* Service Details */}
                        <div className="p-4 flex flex-col flex-grow">
                            <h2 className="text-2xl font-bold mb-2 text-default-text">{service.name}</h2>
                            <p className="text-sm text-gray-600 flex-grow">{service.description.substring(0, 100)}...</p>
                            
                            {/* Included List */}
                            <div className="mt-4 text-xs">
                                <strong className="text-default-text">Includes:</strong>
                                <ul className="list-disc list-inside ml-4 text-gray-500 max-h-12 overflow-hidden">
                                    {service.included?.split('\n').slice(0, 3).map((item, i) => (
                                        item.trim() && <li key={i}>{item.trim()}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Price and Action */}
                        <div className="p-4 pt-0 border-t border-gray-100">
                             <div className="flex justify-between items-center mb-3">
                                <span className="text-3xl font-extrabold text-default-text">
                                    {CURRENCY}{parseFloat(service.cost).toFixed(2)}
                                </span>
                            </div>
                             <button
                                onClick={() => handleBookNow(service)} 
                                // Custom button color
                                className="w-full bg-yellow text-default-text font-semibold py-3 rounded-lg hover:opacity-90 transition duration-150 shadow-md"
                            >
                                Book Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
