import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
// FIX: Removed 'useNavigate' as it's no longer used
import { } from 'react-router-dom'; 

const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
const CURRENCY = "₱";

// Store time slots for the 8 AM - 5 PM window
const BUSINESS_HOURS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function Appointment() {
    const [services, setServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null); // The date clicked on the calendar
    const [selectedSlot, setSelectedSlot] = useState(null); // The final date + time slot for modal
    const [monthOffset, setMonthOffset] = useState(0); 
    const [calendarSlots, setCalendarSlots] = useState([]);
    const [bookedDates, setBookedDates] = useState({}); 
    const [upcomingAppointments, setUpcomingAppointments] = useState([]); 
    const [allAppointments, setAllAppointments] = useState([]); // For admin modal
    const [showAdminModal, setShowAdminModal] = useState(false); // Admin appointments modal
    
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // FIX: Removed unused 'navigate' variable definition
    // const navigate = useNavigate(); 
    const token = localStorage.getItem("access");
    const isAuthenticated = !!token;
    const isAdmin = localStorage.getItem("is_staff") === "true";

    // --- Date Calculation ---
    // FIX: Wrap 'today' in useMemo to stabilize dependencies
    const today = useMemo(() => new Date(), []);
    const currentCalendarDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    
    // Helper function to initialize available slots (now uses bookedDates and times)
    const generateSlots = useCallback((year, month, serviceId, bookedMap) => {
        const endOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = endOfMonth.getDate();
        
        let slots = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];

            const isPastDate = (date < today && date.toDateString() !== today.toDateString());
            
            let isAvailable = !isPastDate;
            
            if (isPastDate && date.toDateString() !== today.toDateString()) continue;
            
            // FIX: Check if ALL business hours for this day are booked
            const allSlotsBooked = BUSINESS_HOURS.every(time => {
                const dateTimeKey = `${dateStr}T${time}`;
                return bookedMap[dateTimeKey]; // Check if this specific time slot is in the map
            });
            const isDayOccupied = allSlotsBooked;

            slots.push({
                date: dateStr,
                day: day,
                isToday: date.toDateString() === today.toDateString(),
                isAvailable: isAvailable, 
                isOccupied: isDayOccupied, 
                serviceId: serviceId
            });
        }

        return slots;
    }, [today]); // 'today' dependency is now stable

    // --- Data Fetching: Booked Slots ---
    const fetchBookedSlots = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await axios.get(`${BASE_URL}appointments/booked/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const dateMap = {};
            const upcoming = [];
            
            response.data.forEach(appt => {
                // FIX: Use start_time and end_time provided by the backend
                const startTime = new Date(appt.start_time);
                const endTime = new Date(appt.end_time);

                // Populate the dateMap for *all* hours covered by the booking
                let currentHour = new Date(startTime);
                while (currentHour < endTime) {
                    const dateTimeStr = currentHour.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
                    dateMap[dateTimeStr] = appt.service_id; 
                    currentHour.setHours(currentHour.getHours() + 1);
                }
                
                // For upcoming list display
                if (startTime >= today) {
                   upcoming.push({
                       id: appt.id, 
                       date: startTime.toLocaleDateString(),
                       time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                       service_name: appt.service_name,
                       // Ensure we capture the username from the backend
                       username: appt.user_username 
                   });
                }
            });
            setBookedDates(dateMap);
            // NOTE: We'll now use fetchMyUpcomingAppointments for the user's appointments
        } catch (err) {
            console.error("Error fetching booked slots:", err.response || err);
        }
    }, [token, isAuthenticated, today]); 

    // --- NEW: Fetch current user's upcoming appointments ---
    const fetchMyUpcomingAppointments = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await axios.get(`${BASE_URL}appointments/my-upcoming/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const upcoming = response.data.map(appt => {
                const startTime = new Date(appt.start_time);
                return {
                    id: appt.id, 
                    date: startTime.toLocaleDateString(),
                    time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    service_name: appt.service_name,
                    username: appt.user_username,
                    start_time: appt.start_time,
                    end_time: appt.end_time
                };
            });
            
            setUpcomingAppointments(upcoming);
        } catch (err) {
            console.error("Error fetching user's upcoming appointments:", err.response || err);
        }
    }, [token, isAuthenticated]);

    // --- NEW: Fetch all appointments for admin ---
    const fetchAllAppointments = useCallback(async () => {
        if (!isAuthenticated || !isAdmin) return;
        try {
            const response = await axios.get(`${BASE_URL}appointments/all/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const allAppts = response.data.map(appt => {
                const startTime = new Date(appt.start_time);
                return {
                    id: appt.id, 
                    date: startTime.toLocaleDateString(),
                    time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    service_name: appt.service_name,
                    username: appt.user_username,
                    user_id: appt.user_id,
                    status: appt.status,
                    start_time: appt.start_time,
                    end_time: appt.end_time,
                    booked_at: appt.booked_at
                };
            });
            
            setAllAppointments(allAppts);
        } catch (err) {
            console.error("Error fetching all appointments:", err.response || err);
        }
    }, [token, isAuthenticated, isAdmin]);

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
        fetchMyUpcomingAppointments(); // Fetch user's specific appointments
        if (isAdmin) {
            fetchAllAppointments(); // Fetch all appointments if admin
        }
    }, [fetchServices, fetchBookedSlots, fetchMyUpcomingAppointments, fetchAllAppointments, isAdmin]);

    // 2. Slot Generation: Recalculate slots whenever month, service, or bookedDates changes
    useEffect(() => {
        if (selectedServiceId !== null) {
            setCalendarSlots(generateSlots(currentYear, currentMonth, selectedServiceId, bookedDates));
        }
    }, [selectedServiceId, currentMonth, currentYear, bookedDates, generateSlots]);


    // --- Action Handlers ---

    const handleDateClick = (slot) => {
        // Slot is only clickable if explicitly available 
        if (!slot.isAvailable) return;
        
        setSelectedDate(slot.date);
        setSelectedSlot(null); // Reset final slot selection
    };
    
    const handleTimeSlotClick = (time) => {
        const service = services.find(s => s.id === selectedServiceId);
        if (service) {
            // Combine date and time to create the full ISO booking string
            const dateTimeStr = `${selectedDate}T${time}:00`; 
            
            // Check if this specific date-time slot is booked
            // FIX: Check against the YYYY-MM-DDTHH:MM format
            if (bookedDates[dateTimeStr.slice(0, 16)]) { 
                setMessage("This time slot is already booked.");
                return;
            }

            setSelectedSlot({ 
                service, 
                date: selectedDate, 
                time: time,
                dateTimeStr: dateTimeStr // This is the start_time
            });
            setMessage('');
        }
    };
    
    const handleConfirmBooking = async () => {
        if (!selectedSlot || !isAuthenticated) return;
        
        setBookingLoading(true);
        setMessage('');

        const payload = {
            service: selectedSlot.service.id,
            // FIX: Send 'start_time' to match the serializer
            start_time: selectedSlot.dateTimeStr, 
        };

        try {
            await axios.post(`${BASE_URL}appointments/`, payload, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            setMessage(`Appointment booked for ${selectedSlot.service.name} on ${selectedSlot.date} at ${selectedSlot.time}!`);
            setSelectedSlot(null);
            
            // CRITICAL FIX: Refresh the booked list to immediately update the calendar view
            fetchBookedSlots(); 
            fetchMyUpcomingAppointments(); // Refresh user's appointments
            if (isAdmin) {
                fetchAllAppointments(); // Refresh admin view
            }
            
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
            await axios.delete(`${BASE_URL}appointments/${appointmentId}/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            setMessage(`Appointment for ${serviceName} cancelled successfully.`);
            fetchBookedSlots();
            fetchMyUpcomingAppointments(); // Refresh user's appointments
            if (isAdmin) {
                fetchAllAppointments(); // Refresh admin view
            }
            
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

    // NEW: Admin remove appointment handler
    const handleAdminRemoveAppointment = async (appointmentId, serviceName, username, date) => {
        if (!appointmentId || !isAdmin) {
            return;
        }

        if (!window.confirm(`Are you sure you want to remove ${username}'s appointment for ${serviceName} on ${date}?`)) {
            return;
        }

        setBookingLoading(true);
        try {
            await axios.delete(`${BASE_URL}appointments/${appointmentId}/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            setMessage(`Successfully removed ${username}'s appointment for ${serviceName}.`);
            fetchBookedSlots();
            fetchAllAppointments(); // Refresh admin list
            fetchMyUpcomingAppointments(); // Refresh user list if needed
            
            setTimeout(() => {
                setMessage('');
            }, 3000);
            
        } catch (err) {
            console.error("Admin removal error:", err.response || err);
            setMessage(`Failed to remove appointment. Error: ${err.response?.data?.detail || 'Check console.'}`);
        } finally {
            setBookingLoading(false);
        }
    };

    // NEW: Open admin appointments modal
    const handleOpenAdminModal = () => {
        fetchAllAppointments(); // Refresh data when opening modal
        setShowAdminModal(true);
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
    
    // Determine available slots for the selected date
    const availableSlotsForSelectedDate = selectedDate ? BUSINESS_HOURS.map(time => {
        // FIX: Check YYYY-MM-DDTHH:MM format
        const dateTimeStr = `${selectedDate}T${time}`; 
        return {
            time: time,
            // FIX: Check against the specific time slot in the map
            isBooked: !!bookedDates[dateTimeStr] 
        };
    }) : [];


    return (
        <div className="p-8 bg-chonky-brown-50 min-h-screen">
            <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-2xl border border-text-brown">
                <header className="mb-8 border-b border-text-brown pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-default-text">Book Your Appointment</h1>
                        <p className="text-gray-600 mt-2">Select a service, then pick an available date and time slot.</p>
                    </div>
                    {/* NEW: Admin View Appointments Button */}
                    {isAdmin && (
                        <button
                            onClick={handleOpenAdminModal}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                            View All Appointments
                        </button>
                    )}
                </header>

                {message && (
                    <div className={`p-4 mb-6 rounded-lg font-semibold text-center ${message.includes('booked') || message.includes('cancelled') || message.includes('removed') ? 'bg-green-100 text-green-800' : 'bg-red-110 text-red-800'}`}>
                        {message}
                    </div>
                )}
                
                {/* --- MAIN BOOKING GRID --- */}
                <div className="grid md:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN: Service Selection */}
                    <div className="md:col-span-1 border border-gray-300 rounded-lg p-6 bg-gray-50">
                        <label className="block text-default-text font-bold mb-2">1. Select Service:</label>
                        <select
                            value={selectedServiceId || ''}
                            onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-yellow"
                            disabled={services.length === 0}
                        >
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {/* FIX: Use duration_minutes */}
                                    {service.name} ({CURRENCY}{parseFloat(service.cost).toFixed(2)}) - {service.duration_minutes} min
                                </option>
                            ))}
                        </select>
                        {selectedService && (
                            <div className="mt-4 p-3 bg-white rounded-md text-sm shadow-inner">
                                {/* FIX: Use duration_minutes */}
                                <p className="font-semibold text-default-text">Duration: {selectedService.duration_minutes} minutes</p>
                                <p className="text-gray-600">{selectedService.description.substring(0, 100)}...</p>
                            </div>
                        )}
                    </div>
                    
                    {/* MIDDLE COLUMN: Calendar */}
                    <div className="md:col-span-2 border border-gray-300 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-default-text mb-4">2. Choose a Date</h2>

                        {/* Calendar Header */}
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={() => setMonthOffset(prev => prev - 1)}
                                className="text-default-text hover:text-yellow disabled:opacity-50"
                                disabled={monthOffset <= 0}
                            > &larr; Previous </button>
                            <h2 className="text-xl font-bold text-default-text">{monthYearText}</h2>
                            <button
                                onClick={() => setMonthOffset(prev => prev + 1)}
                                className="text-default-text hover:text-yellow"
                            > Next &rarr; </button>
                        </div>

                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-semibold text-gray-600">
                            {dayNames.map(day => <div key={day}>{day}</div>)}
                        </div>

                        {/* Calendar Grid (Slots) */}
                        <div className="grid grid-cols-7 gap-2">
                            {[...Array(new Date(currentYear, currentMonth, 1).getDay())].map((_, i) => (
                                <div key={`empty-${i}`} className="h-12"></div>
                            ))}

                            {calendarSlots.map(slot => (
                                <div
                                    key={slot.date}
                                    onClick={() => handleDateClick(slot)}
                                    className={`h-16 flex flex-col justify-center items-center rounded-lg shadow-sm transition 
                                                ${slot.isOccupied ? 'bg-red-100 text-red-500 cursor-not-allowed' : 
                                                slot.isAvailable ? 'bg-green-100 hover:bg-green-200 cursor-pointer' : 
                                                'bg-gray-200 text-gray-500 cursor-not-allowed'}
                                                ${slot.isToday ? 'border-2 border-yellow font-bold' : ''}
                                                ${selectedDate === slot.date ? 'border-2 border-indigo-500 bg-green-200' : ''}
                                                `}
                                >
                                    <span className="text-lg">{slot.day}</span>
                                    <span className="text-xs mt-1">
                                        {slot.isOccupied ? 'Fully Booked' : slot.isAvailable ? 'Select Date' : 'Past'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* --- TIME SLOT SELECTION --- */}
                {selectedDate && (
                    <div className="p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200 mt-6">
                        <h2 className="text-xl font-bold text-default-text mb-4">
                            3. Available Times on {new Date(selectedDate).toLocaleDateString()}
                        </h2>
                        
                        <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-3">
                            {availableSlotsForSelectedDate.map(slot => (
                                <button
                                    key={slot.time}
                                    onClick={() => handleTimeSlotClick(slot.time)}
                                    disabled={slot.isBooked}
                                    className={`py-2 rounded-md transition font-semibold text-sm 
                                        ${slot.isBooked 
                                            ? 'bg-red-200 text-red-700 cursor-not-allowed' 
                                            : 'bg-yellow hover:bg-yellow/90 text-default-text shadow-sm'
                                        }`}
                                >
                                    {slot.time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}


                {/* --- Upcoming Appointments Section (Feature 2) --- */}
                <div className="p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200 mt-6">
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
                                        <p className="text-sm text-gray-600">Date: {appt.date} at {appt.time}</p>
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
                            {/* FIX: Display start_time (dateTimeStr) */}
                            **Date/Time:** <span className="font-semibold">{new Date(selectedSlot.dateTimeStr).toLocaleString()}</span>
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

            {/* --- NEW: Admin Appointments Modal (Feature 1) --- */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-2xl font-bold text-default-text">All Appointments</h3>
                            <button
                                onClick={() => setShowAdminModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {allAppointments.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No appointments found.</p>
                        ) : (
                            <div className="space-y-4">
                                {allAppointments.map((appt) => (
                                    <div key={appt.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex-1">
                                            <p className="font-semibold text-default-text text-lg">{appt.service_name}</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-600">User:</span>
                                                    <p className="text-default-text">{appt.username}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-600">Date & Time:</span>
                                                    <p className="text-default-text">{appt.date} at {appt.time}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-600">Status:</span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        appt.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                        appt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                        appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {appt.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-600">Booked:</span>
                                                    <p className="text-default-text">
                                                        {appt.booked_at ? new Date(appt.booked_at).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAdminRemoveAppointment(appt.id, appt.service_name, appt.username, appt.date)}
                                            disabled={bookingLoading}
                                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition disabled:opacity-50 ml-4"
                                            title={`Remove ${appt.username}'s appointment`}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}