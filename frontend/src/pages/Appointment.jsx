import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
const CURRENCY = "₱";

export default function Appointment() {
    const [services, setServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null); // For booking modal
    const [monthOffset, setMonthOffset] = useState(0); // For calendar navigation
    const [calendarSlots, setCalendarSlots] = useState([]);
    const [bookedDates, setBookedDates] = useState({}); // Stores confirmed booking dates for calendar marking
    const [upcomingAppointments, setUpcomingAppointments] = useState([]); // NEW: Stores detailed upcoming bookings
    
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // FIX 1: Disabled unused navigate variable
    const navigate = useNavigate(); // eslint-disable-line no-unused-vars
    const token = localStorage.getItem("access");
    const isAuthenticated = !!token;

    // --- Date Calculation (FIX 2: Wrapped `today` in useMemo for stable dependency) ---
    const today = useMemo(() => new Date(), []);
    const currentCalendarDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    
    // Helper function to initialize available slots (now uses bookedDates)
    const generateSlots = useCallback((year, month, serviceId, bookedMap) => {
        const endOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = endOfMonth.getDate();
        
        let slots = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];

            const isPastDate = (date < today && date.toDateString() !== today.toDateString());
            
            // NEW LOGIC: Check if this date string exists in the bookedDates map
            const isOccupied = bookedMap[dateStr] === true || bookedMap[dateStr] === serviceId;

            let isAvailable = !isPastDate;
            
            if (isPastDate && date.toDateString() !== today.toDateString()) continue;
            
            slots.push({
                date: dateStr,
                day: day,
                isToday: date.toDateString() === today.toDateString(),
                isAvailable: isAvailable, 
                isOccupied: isOccupied, 
                serviceId: serviceId
            });
        }

        return slots;
    }, [today]);

    // --- Data Fetching: Booked Slots ---
    const fetchBookedSlots = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            // Hitting the GET /appointments/booked/ endpoint
            const response = await axios.get(`${BASE_URL}appointments/booked/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const dateMap = {};
            const upcoming = [];
            
            response.data.forEach(appt => {
                // For calendar marking (key: date, value: service ID)
                // Note: The backend should return service_id and date for this map
                dateMap[appt.date] = appt.service_id; 
                
                // For upcoming list display
                const apptDate = new Date(appt.date);
                if (apptDate >= today) {
                   // CRITICAL: Ensure 'id' is present here for the DELETE request later
                   upcoming.push({
                       id: appt.id, // Ensure the appointment ID is preserved
                       date: appt.appointment_date, // Use the date field from the response
                       service_name: appt.service_name, // Use the name from the response
                   });
                }
            });
            setBookedDates(dateMap);
            setUpcomingAppointments(upcoming);
            
        } catch (err) {
            console.error("Error fetching booked slots:", err.response || err);
        }
    }, [token, isAuthenticated, today]); // 'today' dependency is now stable

    // --- Data Fetching: Services ---
    const fetchServices = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}services/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const available = response.data.filter(s => s.availability);
            setServices(available);
            if (available.length > 0 && selectedServiceId === null) {
                setSelectedServiceId(available[0].id);
            }
            setError(null);
        } catch (err) {
            console.error("Error fetching services:", err);
            setError("Failed to load services. Check API endpoint.");
        } finally {
            setLoading(false);
        }
    }, [token, isAuthenticated, selectedServiceId]);
    
    // 1. Initial Load: Fetch Services and Booked Slots
    useEffect(() => {
        fetchServices();
        fetchBookedSlots();
    }, [fetchServices, fetchBookedSlots]);

    // 2. Slot Generation: Recalculate slots whenever month, service, or bookedDates changes
    useEffect(() => {
        if (selectedServiceId !== null) {
            setCalendarSlots(generateSlots(currentYear, currentMonth, selectedServiceId, bookedDates));
        }
    }, [selectedServiceId, currentMonth, currentYear, bookedDates, generateSlots]);


    // --- Action Handlers ---

    const handleSlotClick = (slot) => {
        // Slot is only clickable if explicitly available (not past or occupied)
        if (!slot.isAvailable || slot.isOccupied) return;
        
        const service = services.find(s => s.id === selectedServiceId);
        if (service) {
            setSelectedSlot({ ...slot, service });
        }
    };
    
    const handleConfirmBooking = async () => {
        if (!selectedSlot || !isAuthenticated) return;
        
        setBookingLoading(true);
        setMessage('');

        const payload = {
            service: selectedSlot.service.id, // Ensure we send the service ID (integer)
            appointment_date: selectedSlot.date,
        };

        try {
            await axios.post(`${BASE_URL}appointments/`, payload, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            setMessage(`Appointment booked for ${selectedSlot.service.name} on ${selectedSlot.date}!`);
            setSelectedSlot(null);
            
            // CRITICAL FIX: Refresh the booked list to immediately update the calendar view
            fetchBookedSlots(); 
            
            setTimeout(() => {
                setMessage('');
            }, 3000);
            
        } catch (err) {
            console.error("Booking error:", err.response || err);
            setMessage(`Booking failed. Error: ${err.response?.data?.detail || 'Try selecting a different slot.'}`);
        } finally {
            setBookingLoading(false);
        }
    };
    
    // NEW: Cancellation Handler
    const handleCancelAppointment = async (appointmentId, serviceName, date) => {
        // CRITICAL CHECK: Ensure ID is valid before proceeding
        if (!appointmentId) {
             console.error("Cancellation Error: Appointment ID is missing.");
             setMessage("Cannot cancel: Appointment ID is invalid.");
             return;
        }

        if (!isAuthenticated || !window.confirm(`Are you sure you want to cancel your appointment for ${serviceName} on ${date}?`)) {
            return;
        }
        
        setMessage('');
        setBookingLoading(true);

        try {
            // NOTE: This assumes a DELETE endpoint exists for the appointment detail view
            await axios.delete(`${BASE_URL}appointments/${appointmentId}/`, { // Uses valid ID
                headers: { 'Authorization': `Bearer ${token}` },
            });

            setMessage(`Appointment for ${serviceName} cancelled successfully.`);
            
            // Refresh both the appointment list and the calendar view
            fetchBookedSlots();
            
            setTimeout(() => {
                setMessage('');
            }, 3000);
            
        } catch (err) {
            console.error("Cancellation error:", err.response || err);
            setMessage(`Cancellation failed. Error: ${err.response?.data?.detail || 'Check console.'}`);
        } finally {
            setBookingLoading(false);
        }
    };
    
    // --- Render Helpers ---
    
    if (loading) {
        return <div className="p-8 text-center text-default-text">Loading services...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600 font-medium">{error}</div>;
    }

    const selectedService = services.find(s => s.id === selectedServiceId);

    // Get the name of the month and year
    const monthYearText = currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="p-8 bg-chonky-brown-50 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl border border-text-brown">
                <header className="mb-8 border-b border-text-brown pb-4">
                    <h1 className="text-3xl font-extrabold text-default-text text-center">Book Your Appointment</h1>
                    <p className="text-gray-600 text-center mt-2">Select a service and choose an available slot in the calendar.</p>
                </header>

                {message && (
                    <div className={`p-4 mb-6 rounded-lg font-semibold text-center ${message.includes('booked') || message.includes('cancelled') ? 'bg-green-100 text-green-800' : 'bg-red-110 text-red-800'}`}>
                        {message}
                    </div>
                )}
                
                {/* --- MAIN BOOKING CONTENT (Service Selector + Calendar) --- */}
                <div className="border border-gray-300 rounded-lg p-6 mb-8">
                    {/* 1. Service Selection */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-inner">
                        <label className="block text-default-text font-bold mb-2">Select Service:</label>
                        <select
                            value={selectedServiceId || ''}
                            onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-yellow"
                            disabled={services.length === 0}
                        >
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name} ({CURRENCY}{parseFloat(service.cost).toFixed(2)}) - {service.duration}
                                </option>
                            ))}
                        </select>

                        {selectedService && (
                            <p className="mt-3 text-sm text-gray-600">{selectedService.description}</p>
                        )}
                    </div>

                    {/* 2. Calendar */}
                    <div>
                        {/* Calendar Header */}
                        <div className="flex justify-between items-center mb-6">
                            <button
                                onClick={() => setMonthOffset(prev => prev - 1)}
                                className="text-default-text hover:text-yellow disabled:opacity-50"
                                disabled={monthOffset <= 0}
                            >
                                &larr; Previous
                            </button>
                            <h2 className="text-xl font-bold text-default-text">{monthYearText}</h2>
                            <button
                                onClick={() => setMonthOffset(prev => prev + 1)}
                                className="text-default-text hover:text-yellow"
                            >
                                Next &rarr;
                            </button>
                        </div>

                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-semibold text-gray-600">
                            {dayNames.map(day => <div key={day}>{day}</div>)}
                        </div>

                        {/* Calendar Grid (Slots) */}
                        <div className="grid grid-cols-7 gap-2">
                            {/* Empty placeholders for days before the 1st */}
                            {[...Array(new Date(currentYear, currentMonth, 1).getDay())].map((_, i) => (
                                <div key={`empty-${i}`} className="h-12"></div>
                            ))}

                            {/* Date Slots */}
                            {calendarSlots.map(slot => (
                                <div
                                    key={slot.date}
                                    onClick={() => handleSlotClick(slot)}
                                    className={`h-16 flex flex-col justify-center items-center rounded-lg shadow-sm transition 
                                                ${slot.isOccupied ? 'bg-red-100 text-red-500 cursor-not-allowed' : 
                                                  slot.isAvailable ? 'bg-green-100 hover:bg-green-200 cursor-pointer' : 
                                                  'bg-gray-200 text-gray-500 cursor-not-allowed'}
                                                ${slot.isToday ? 'border-2 border-yellow font-bold' : ''}`}
                                >
                                    <span className="text-lg">{slot.day}</span>
                                    <span className="text-xs mt-1">
                                        {slot.isOccupied ? 'Booked' : slot.isAvailable ? 'Available' : 'Past'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* --- Upcoming Appointments Section (New Feature) --- */}
                <div className="p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-default-text mb-4 border-b border-gray-200 pb-2">
                        My Upcoming Appointments ({upcomingAppointments.length})
                    </h2>
                    
                    {upcomingAppointments.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">You have no upcoming confirmed appointments.</p>
                    ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {upcomingAppointments.map((appt) => (
                                <div key={appt.id} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                    <div>
                                        <p className="font-semibold text-default-text">{appt.service_name}</p>
                                        <p className="text-sm text-gray-600">Date: {appt.date}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCancelAppointment(appt.id, appt.service_name, appt.date)}
                                        disabled={bookingLoading}
                                        className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600 transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
            
            {/* --- Booking Confirmation Modal --- */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                        <h3 className="text-2xl font-bold text-default-text mb-4 border-b pb-2">Confirm Booking</h3>

                        <p className="text-default-text mb-2">
                            **Service:** <span className="font-semibold">{selectedSlot.service.name}</span>
                        </p>
                        <p className="text-default-text mb-4">
                            **Date:** <span className="font-semibold">{selectedSlot.date}</span>
                        </p>
                        <p className="text-lg font-bold text-default-text mb-6">
                            **Cost:** <span className="text-yellow">{CURRENCY}{parseFloat(selectedSlot.service.cost).toFixed(2)}</span>
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setSelectedSlot(null)}
                                disabled={bookingLoading}
                                className="px-4 py-2 bg-gray-300 text-default-text rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmBooking}
                                disabled={bookingLoading}
                                className="bg-yellow text-default-text px-6 py-2 rounded-lg hover:opacity-90 transition font-semibold disabled:opacity-50"
                            >
                                {bookingLoading ? 'Processing...' : 'Confirm Appointment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
