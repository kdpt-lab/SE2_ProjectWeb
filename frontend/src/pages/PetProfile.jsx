import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

// Static array for age unit dropdown
const AGE_UNITS = ["Months", "Years"];

export default function PetProfile() {
    const [form, setForm] = useState({
        petName: '',
        petBreed: '',
        ageValue: '',
        ageUnit: AGE_UNITS[0],
        allergies: '',
        notes: '',
        petPicture: null,
    });
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [petGallery, setPetGallery] = useState([]); // State to hold the fetched pet list
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [galleryLoading, setGalleryLoading] = useState(false);

    const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
    const token = localStorage.getItem("access");

    // --- Data Fetching Logic ---
    const fetchPetGallery = useCallback(async () => {
        if (!token) return;
        setGalleryLoading(true);
        try {
            // Hitting the GET /pets/ endpoint
            const response = await axios.get(`${BASE_URL}pets/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setPetGallery(response.data);
        } catch (err) {
            console.error("Error fetching pet gallery:", err.response || err);
            setMessage(`Failed to load gallery: ${err.response?.data?.detail || 'Check console.'}`);
        } finally {
            setGalleryLoading(false);
        }
    }, [token]);
    
    // Fetch data when component mounts
    useEffect(() => {
        fetchPetGallery();
    }, [fetchPetGallery]);
    
    // --- Handlers ---

    const handleGalleryOpen = () => {
        // We already fetch pet data on mount, but fetching again ensures freshness
        fetchPetGallery(); 
        setIsGalleryOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, petPicture: file });
        }
    };

    const handleAddPet = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!form.petName || !form.petBreed || !form.ageValue) {
            setMessage("Please fill in the Pet Name, Breed, and Age.");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('pet_name', form.petName);
        formData.append('pet_breed', form.petBreed);
        formData.append('age', `${form.ageValue} ${form.ageUnit}`);
        formData.append('allergies', form.allergies);
        formData.append('notes', form.notes);
        if (form.petPicture) {
            // Note: Use the field name expected by Django serializer
            formData.append('pet_picture', form.petPicture); 
        }
        
        // Ensure created_by is set by context in Django, no need to send user ID here.
        
        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/api/accounts/pets/", 
                formData, 
                {
                    headers: { 
                        // axios automatically sets boundary for multipart/form-data
                        'Authorization': `Bearer ${token}` 
                    },
                }
            );
            
            // On successful save, update the gallery list directly and reset form
            setMessage(`Pet ${response.data.pet_name} added successfully!`);
            fetchPetGallery(); // Refresh the list to show the new pet
            
            setForm({ petName: '', petBreed: '', ageValue: '', ageUnit: AGE_UNITS[0], allergies: '', notes: '', petPicture: null });

        } catch (err) {
            console.error("Pet add error:", err.response || err);
            setMessage(`Failed to add pet. Error: ${err.response?.data?.detail || 'Check console for errors.'}`);
        } finally {
            setLoading(false);
        }
    };
    
    // --- Component Rendering ---

    const renderGalleryContent = () => {
        if (galleryLoading) {
            return <div className="text-center py-8 text-default-text">Loading pet profiles...</div>;
        }
        
        if (petGallery.length === 0) {
            return <div className="text-center py-8 text-gray-500">No pets have been added to the gallery yet.</div>;
        }
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {petGallery.map((pet) => (
                    <div key={pet.id} className="bg-chonky-brown-50 p-4 rounded-lg shadow-md flex flex-col items-center text-default-text">
                        <img 
                            src={pet.pet_picture || "https://placehold.co/100x100/F5E6CC/333?text=Pet"}
                            alt={pet.pet_name} 
                            className="w-24 h-24 object-cover rounded-full mb-3 border-2 border-text-brown"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/F5E6CC/333?text=Pet"; }}
                        />
                        <h4 className="font-bold text-lg">{pet.pet_name}</h4>
                        <p className="text-sm text-gray-700">{pet.pet_breed}</p>
                        <p className="text-xs text-gray-500 mt-2">Age: {pet.age}</p>
                        {pet.allergies && <p className="text-xs text-red-500">Allergies: {pet.allergies}</p>}
                        {pet.notes && <p className="text-xs mt-1 italic text-gray-600">Notes: {pet.notes}</p>}
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="p-8 bg-chonky-brown-50 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
                <header className="flex justify-between items-center mb-8 border-b pb-4">
                    <h1 className="text-3xl font-extrabold text-default-text">Pet Profile Management</h1>
                    
                    <button
                        onClick={handleGalleryOpen}
                        // Use custom button styling
                        className="bg-yellow text-default-text px-6 py-2 rounded-lg hover:opacity-80 transition font-semibold shadow-md"
                    >
                        Pet Gallery
                    </button>
                </header>

                {message && (
                    <div className={`p-4 mb-6 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message}
                    </div>
                )}
                
                <h2 className="text-2xl font-bold mb-6 text-default-text">Add New Pet Profile</h2>

                <form onSubmit={handleAddPet} className="space-y-6">
                    
                    {/* Pet Picture Upload */}
                    <div className="flex items-center space-x-6 p-4 border rounded-lg bg-gray-50">
                        <img 
                            src={form.petPicture ? URL.createObjectURL(form.petPicture) : "https://placehold.co/100x100/F5E6CC/333?text=Pet"}
                            alt="Pet Preview" 
                            className="w-24 h-24 object-cover rounded-full shadow-md"
                        />
                        <div>
                            <label className="block text-sm font-medium text-default-text mb-1">Pet Picture</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow file:text-default-text hover:file:opacity-80"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Pet Name */}
                        <div>
                            <label className="block text-default-text font-semibold mb-1">Pet Name</label>
                            <input type="text" name="petName" value={form.petName} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-yellow" placeholder="Bartholomew"/>
                        </div>

                        {/* Pet Breed */}
                        <div>
                            <label className="block text-default-text font-semibold mb-1">Pet Breed</label>
                            <input type="text" name="petBreed" value={form.petBreed} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-yellow" placeholder="Siamese Cat / Golden Retriever"/>
                        </div>
                    </div>
                    
                    {/* Age */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-1">
                            <label className="block text-default-text font-semibold mb-1">Age Value</label>
                            <input type="number" name="ageValue" value={form.ageValue} onChange={handleChange} min="1" className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-yellow" placeholder="e.g. 6"/>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-default-text font-semibold mb-1">Age Unit</label>
                            <select name="ageUnit" value={form.ageUnit} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-yellow">
                                {AGE_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Allergies */}
                    <div>
                        <label className="block text-default-text font-semibold mb-1">Allergies (Comma separated)</label>
                        <textarea name="allergies" value={form.allergies} onChange={handleChange} rows="2" className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-yellow" placeholder="e.g. Chicken, Grain, Pollen"/>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-default-text font-semibold mb-1">Notes / Special Requirements</label>
                        <textarea name="notes" value={form.notes} onChange={handleChange} rows="4" className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-yellow" placeholder="Requires daily brushing. Fear of loud noises."/>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-yellow text-default-text p-3 rounded-lg hover:opacity-80 transition font-semibold shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Adding Pet...' : 'Add Pet Profile'}
                    </button>
                </form>
            </div>

            {/* Pet Gallery Modal */}
            {isGalleryOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl h-3/4 overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4 text-default-text border-b pb-2">Pet Gallery ({petGallery.length} Pets)</h3>
                        
                        {renderGalleryContent()}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsGalleryOpen(false)}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
                            >
                                Close Gallery
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
