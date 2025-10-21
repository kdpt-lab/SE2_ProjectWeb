import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// FontAwesome star icons (assuming a general icon library is available, or using SVG)
// Using inline SVG for stability
const StarIcon = ({ filled, onClick }) => (
    <svg 
        onClick={onClick}
        className={`w-8 h-8 cursor-pointer transition-colors duration-200 ${
            filled ? 'text-yellow' : 'text-gray-300 hover:text-yellow/70'
        }`}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.072 6.365a1 1 0 00.95.69h6.704c.969 0 1.371 1.24.588 1.81l-5.404 3.931a1 1 0 00-.364 1.118l2.072 6.365c.3.921-.755 1.688-1.54 1.118l-5.404-3.931a1 1 0 00-1.176 0l-5.404 3.931c-.784.57-1.84-.197-1.54-1.118l2.072-6.365a1 1 0 00-.364-1.118L2.062 9.792c-.783-.57-.381-1.81.588-1.81h6.704a1 1 0 00.95-.69l2.072-6.365z"></path>
    </svg>
);

// Small Star for display in the gallery
const SmallStarIcon = ({ filled }) => (
    <svg 
        className={`w-4 h-4 ${filled ? 'text-yellow' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.072 6.365a1 1 0 00.95.69h6.704c.969 0 1.371 1.24.588 1.81l-5.404 3.931a1 1 0 00-.364 1.118l2.072 6.365c.3.921-.755 1.688-1.54 1.118l-5.404-3.931a1 1 0 00-1.176 0l-5.404 3.931c-.784.57-1.84-.197-1.54-1.118l2.072-6.365a1 1 0 00-.364-1.118L2.062 9.792c-.783-.57-.381-1.81.588-1.81h6.704a1 1 0 00.95-.69l2.072-6.365z"></path>
    </svg>
);


export default function Feedback() {
    const [rating, setRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [galleryData, setGalleryData] = useState([]); // State for public feedback
    const [galleryLoading, setGalleryLoading] = useState(true); // State for gallery loading
    
    // FIX: Disable ESLint warning since `Maps` is intentionally unused after redirect removal
    const navigate = useNavigate(); // eslint-disable-line no-unused-vars 

    const token = localStorage.getItem("access");
    const isAuthenticated = !!token;

    const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
    
    // --- Gallery Fetch Handler ---
    const fetchGallery = useCallback(async () => {
        setGalleryLoading(true);
        try {
            // NOTE: Assuming a new public endpoint /feedback/gallery/
            const res = await axios.get(`${BASE_URL}feedback/gallery/`);
            setGalleryData(res.data);
        } catch (err) {
            console.error("Error fetching gallery:", err);
            // Non-critical error, just log and display empty list
            setGalleryData([]);
        } finally {
            setGalleryLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    // --- Submission Handlers ---

    const handleRatingClick = (newRating) => {
        setRating(newRating);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        
        if (!isAuthenticated) {
            setMessage("You must be logged in to submit feedback.");
            return;
        }

        if (rating === 0 || feedbackText.trim() === '') {
            setMessage("Please provide a star rating and your feedback text.");
            return;
        }
        
        setLoading(true);

        const payload = {
            rating: rating,
            feedback_text: feedbackText,
            // Django view should automatically associate this with the user ID from the token
        };

        try {
            await axios.post(`${BASE_URL}feedback/`, payload, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
            });
            
            setMessage(`Thank you for your ${rating}-star feedback!`);
            setFeedbackText('');
            setRating(0);
            
            // CRITICAL: Refresh the gallery list immediately
            fetchGallery(); 
            
            // REDIRECT REMOVED: Page will now stay here after submission, showing the success message.
            // setTimeout(() => navigate('/dashboard/home'), 2000); 

        } catch (err) {
            console.error("Feedback submission error:", err.response || err);
            setMessage(`Submission failed. Error: ${err.response?.data?.detail || 'Check console for errors.'}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Render Content ---

    const renderStars = (score) => {
        return (
            <div className="flex space-x-0.5">
                {[1, 2, 3, 4, 5].map((index) => (
                    <SmallStarIcon key={index} filled={index <= score} />
                ))}
            </div>
        );
    };

    return (
        <div className="p-8 bg-chonky-brown-50 min-h-screen">
            {/* FIX 1: Increased max-w to accommodate two columns */}
            <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
                <header className="mb-8 border-b border-text-brown pb-4">
                    <h1 className="text-3xl font-extrabold text-default-text text-center">We Value Your Feedback</h1>
                    <p className="text-gray-600 text-center mt-2">Help us improve our service by sharing your experience.</p>
                </header>

                {message && (
                    <div className={`p-4 mb-6 rounded-lg font-semibold text-center ${message.includes('Thank you') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message}
                    </div>
                )}
                
                {/* FIX 2: Main Content Grid (Submission Form on Left, Gallery on Right) */}
                <div className="grid md:grid-cols-2 gap-8">
                    
                    {/* --- LEFT COLUMN: Submission Form --- */}
                    <div className="p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200">
                        <h2 className="text-2xl font-bold text-default-text mb-6">Submit Your Review</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Star Rating Section */}
                            <div className="text-center p-4 border rounded-lg border-gray-300 bg-white">
                                <label className="block text-xl font-bold text-default-text mb-4">Your Rating</label>
                                <div className="flex justify-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((index) => (
                                        <StarIcon 
                                            key={index} 
                                            filled={index <= rating} 
                                            onClick={() => handleRatingClick(index)} 
                                        />
                                    ))}
                                </div>
                                {rating > 0 && <p className="mt-2 text-default-text">You rated us {rating} out of 5.</p>}
                            </div>

                            {/* Feedback Text Area */}
                            <div>
                                <label className="block text-default-text font-semibold mb-2">Detailed Feedback</label>
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    rows="6"
                                    className="w-full border border-gray-300 rounded-md p-4 focus:ring-2 focus:ring-yellow"
                                    placeholder="Tell us about your recent experience with our services or products."
                                    disabled={loading}
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-yellow text-default-text p-3 rounded-lg hover:opacity-80 transition font-semibold shadow-lg disabled:opacity-50"
                            >
                                {loading ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </form>
                    </div>

                    {/* --- RIGHT COLUMN: Feedback Gallery --- */}
                    <div className="p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200">
                        <h2 className="text-2xl font-bold text-default-text mb-4 border-b border-gray-200 pb-2">
                            Customer Reviews ({galleryData.length})
                        </h2>
                        
                        {galleryLoading ? (
                            <p className="text-center text-gray-500 py-6">Loading reviews...</p>
                        ) : galleryData.length === 0 ? (
                            <p className="text-center text-gray-500 py-6">Be the first to leave feedback!</p>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {galleryData.map((review, index) => (
                                    // Individual Feedback Bubble
                                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-sm text-default-text">
                                                User: {review.username || 'Anonymous'}
                                            </p>
                                            {renderStars(review.rating)}
                                        </div>
                                        <p className="text-sm italic text-gray-700">
                                            "{review.feedback_text}"
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2 text-right">
                                            Submitted: {new Date(review.submitted_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
            </div>
        </div>
    );
}
