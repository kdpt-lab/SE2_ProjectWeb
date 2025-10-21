import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Static definitions for branches (should match Django models/logic)
const BRANCH_OPTIONS = ["Matina Branch", "Toril Branch", "Head Office"];
// ROLE_OPTIONS removed as it's not strictly necessary for the current logic

export default function StaffManagement() {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASE_URL = "http://127.0.0.1:8000/api/accounts/";
    const token = localStorage.getItem("access");
    const currentUserRole = localStorage.getItem("role");

    // Memoize fetchStaff to stabilize the dependency array in useEffect
    const fetchStaff = useCallback(async () => {
        if (currentUserRole !== "admin") {
            setError("Access denied. Admin privileges required.");
            setLoading(false);
            return;
        }

        try {
            // NOTE: This endpoint assumes your Django backend has a view at users/staff/
            const res = await axios.get(`${BASE_URL}users/staff/`, { 
                headers: { Authorization: `Bearer ${token}` },
            });
            // FIX: Ensure the retrieved data is mutable and correctly structured
            setStaffList(res.data.map(staff => ({
                ...staff,
                branch: staff.branch || 'Matina Branch' // Default branch if null
            })));
            setError(null);
        } catch (err) {
            console.error("Error fetching staff:", err);
            setError("Failed to load staff list. Check API endpoint and permissions.");
        } finally {
            setLoading(false);
        }
    }, [token, currentUserRole]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleUpdateField = async (userId, fieldName, value) => {
        if (currentUserRole !== "admin") {
            alert("Permission denied. Only site administrators can manage staff.");
            return;
        }

        // Prepare payload: use dynamic keys for the updated field
        const payload = { [fieldName]: value };
        
        // **CRITICAL DEBUGGING STEP**
        console.log(`Sending PATCH request for User ID: ${userId}`);
        console.log('Payload being sent:', payload); 

        try {
            // NOTE: This assumes a dedicated PATCH endpoint to update user roles/branches
            const res = await axios.patch(`${BASE_URL}users/${userId}/update-profile/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // CRITICAL FIX: We trigger a full refresh to guarantee the table uses the latest, complete data
            alert(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} updated successfully for ${res.data.username}.`);
            
            fetchStaff(); 

        } catch (err) {
            console.error(`Error updating ${fieldName}:`, err.response?.data || err);
            // Include serializer errors if available for debugging
            alert(`Failed to update ${fieldName}. Error: ${err.response?.data?.branch || err.response?.data?.detail || 'Check console.'}`);
        }
    };
    
    // NEW: Handler for deleting a staff member
    const handleDeleteStaff = async (userId, username) => {
        if (currentUserRole !== "admin" || !window.confirm(`Are you sure you want to permanently delete the staff member: ${username}?`)) {
            return;
        }

        try {
            // NOTE: This assumes a DELETE endpoint exists for the user detail view (e.g., users/{id}/)
            await axios.delete(`${BASE_URL}users/${userId}/`, { 
                headers: { Authorization: `Bearer ${token}` },
            });

            // Filter the deleted user out of the local state
            setStaffList(prev => prev.filter(staff => staff.id !== userId));
            alert(`${username} has been successfully removed.`);

        } catch (err) {
            console.error(`Error deleting staff member ${username}:`, err);
            alert(`Failed to delete staff member. Error: ${err.response?.data?.detail || 'Check console.'}`);
        }
    };


    if (loading) {
        return <div className="p-8 text-center text-indigo-600">Loading staff data...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600 font-medium">{error}</div>;
    }
    
    // We only filter for display purposes here.
    const staffMembers = staffList.filter(staff => staff.role !== 'user');

    if (staffMembers.length === 0) {
        return <div className="p-8 text-center text-gray-500">No staff members (Admin or Manager) found.</div>;
    }

    return (
        <div className="p-8 bg-white shadow-xl rounded-lg mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold mb-6 text-indigo-700 border-b pb-2">Staff Management</h1>
            <p className="text-gray-600 mb-6">View and manage staff roles and branch assignments.</p>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {staffMembers.map((staff) => (
                            <tr key={staff.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.email}</td>
                                
                                {/* Display Role as read-only text with styling */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                    <span 
                                        className={`px-3 py-1 text-xs rounded-full ${
                                            staff.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                        }`}
                                    >
                                        {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                                    </span>
                                </td>
                                
                                {/* Branch dropdown remains editable */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <select
                                        // The displayed value should reflect the staff object's current branch
                                        value={staff.branch || BRANCH_OPTIONS[0]}
                                        onChange={(e) => handleUpdateField(staff.id, 'branch', e.target.value)}
                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        {BRANCH_OPTIONS.map(branch => (
                                            <option key={branch} value={branch}>{branch}</option>
                                        ))}
                                    </select>
                                </td>

                                {/* Actions column now has a Delete button */}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    {/* Prevent the currently logged-in user from deleting themselves */}
                                    {staff.username !== localStorage.getItem('user') ? ( 
                                        <button 
                                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                                            onClick={() => handleDeleteStaff(staff.id, staff.username)}
                                        >
                                            Delete Staff
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-xs">Cannot Delete Self</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
