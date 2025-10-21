import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";


export default function Sidebar() {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("user");
    const [profilePic, setProfilePic] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [tempUsername, setTempUsername] = useState("");
    const [tempEmail, setTempEmail] = useState("");
    const [tempProfilePic, setTempProfilePic] = useState(null);
    const [tempPassword, setTempPassword] = useState("");
    const [showConfirmExit, setShowConfirmExit] = useState(false);
    const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false);

    const [isMinimized, setIsMinimized] = useState(false);
    const sidebarRef = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUsername(parsed.username || "");
                setEmail(parsed.email || "");
                setRole(parsed.role || "user");
                const storedPic = localStorage.getItem(`profilePic_${parsed.username}`);
                setProfilePic(storedPic || parsed.profilePic || null);
            } catch {
                localStorage.removeItem("user");
            }
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsMinimized(true);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    const openEditModal = () => {
        setTempUsername(username);
        setTempEmail(email);
        setTempProfilePic(profilePic);
        setTempPassword("");
        setShowUserMenu(false);
        setShowModal(true);
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!(file.type === "image/png" || file.type === "image/jpeg")) {
            alert("Please upload a .png or .jpeg image.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setTempProfilePic(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
        const updatedUser = {
            username: tempUsername,
            email: tempEmail,
            role: role,
            profilePic: tempProfilePic,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        if (tempProfilePic) localStorage.setItem(`profilePic_${tempUsername}`, tempProfilePic);

        if (tempPassword && tempPassword.trim() !== "") {
            try {
                const token = localStorage.getItem("access");
                const response = await fetch("http://localhost:8000/api/accounts/change-password/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ new_password: tempPassword }),
                });
                const data = await response.json();
                if (!response.ok) {
                    alert(data.message || "Failed to change password.");
                    return;
                }
            } catch (err) {
                console.error("Password change error:", err);
                alert("Error changing password. Try again.");
                    return;
            }
        }

        setUsername(tempUsername);
        setEmail(tempEmail);
        setProfilePic(tempProfilePic);
        setTempPassword("");
        setShowModal(false);
        alert("Profile saved successfully!");
    };

    const handleCancel = () => setShowConfirmExit(true);
    const confirmExitYes = () => {
        setTempUsername("");
        setTempEmail("");
        setTempProfilePic(null);
        setTempPassword("");
        setShowConfirmExit(false);
        setShowModal(false);
    };
    const confirmExitNo = () => setShowConfirmExit(false);

    const handleDeactivateAccount = async () => {
        try {
            const token = localStorage.getItem("access");
            const response = await fetch("http://localhost:8000/api/accounts/deactivate/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username }),
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.message || "Failed to deactivate account.");
                return;
            }
            alert("Account deactivated successfully.");
            handleLogout();
        } catch (err) {
            console.error("Deactivation error:", err);
            alert("Error deactivating account. Try again.");
        }
    };

    // Temporary icon placeholder component
    const Icon = () => <div className="w-5 h-5 bg-gray-400 rounded-sm"></div>;

    return (
        <>
            {/* Sidebar */}
            <div
                ref={sidebarRef}
                onClick={() => setIsMinimized(false)}
                // Reverted to standard dark gray and white text
                className={`flex flex-col bg-gray-800 text-white h-screen relative transition-all duration-300 ${
                    isMinimized ? "w-16" : "w-64"
                }`}
            >
                {/* Scrollable content below */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                    {/* Main */}
                    <div className="mb-4">
                        {/* Reverted to standard text-gray-400 */}
                        {!isMinimized && <h2 className="text-gray-400 uppercase mb-2">Main</h2>}
                        {/* Links hover bg reverted to standard gray-700 */}
                        <Link to="/dashboard/home" className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2">
                            <Icon />
                            {!isMinimized && <span>Home</span>}
                        </Link>
                        {/* FIX: Changed path to /dashboard/appointment and text to Appointment */}
                        <Link to="/dashboard/appointment" className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2">
                            <Icon />
                            {!isMinimized && <span>Appointment</span>}
                        </Link>
                        <Link to="/services" className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2">
                            <Icon />
                            {!isMinimized && <span>Services</span>}
                        </Link>
                        <Link to="/shop" className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2">
                            <Icon />
                            {!isMinimized && <span>Shop</span>}
                        </Link>
                    </div>

                    {/* Engagement */}
                    <div className="mb-4">
                        {/* Reverted to standard text-gray-400 */}
                        {!isMinimized && <h2 className="text-gray-400 uppercase mb-2">Engagement</h2>}
                        {/* Links hover bg reverted to standard gray-700 */}
                        <Link to="/dashboard/schedule" className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2">
                            <Icon />
                            {!isMinimized && <span>Schedule</span>}
                        </Link>
                        <Link to="/dashboard/memberships" className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2">
                            <Icon />
                            {!isMinimized && <span>Memberships</span>}
                        </Link>
                        <Link to="/dashboard/messages" className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2">
                            <Icon />
                            {!isMinimized && <span>Messages</span>}
                        </Link>
                    </div>

                    {/* Support */}
                    <div className="mb-4">
                        {/* Reverted to standard text-gray-400 */}
                        {!isMinimized && <h2 className="text-gray-400 uppercase mb-2">Support</h2>}
                        {/* Links hover bg reverted to standard gray-700 */}
                        <Link to="/dashboard/contact-us" className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2">
                            <Icon />
                            {!isMinimized && <span>Contact Us</span>}
                        </Link>
                        {/* Feedback link now points to the correct route /dashboard/feedback */}
                        <Link to="/dashboard/feedback" className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2">
                            <Icon />
                            {!isMinimized && <span>Feedback</span>}
                        </Link>
                    </div>

                    {/* Admin (if applicable) */}
                    {role === "admin" && (
                        <div>
                            {/* Reverted to standard text-gray-400 */}
                            {!isMinimized && <h2 className="text-gray-400 uppercase mb-2">Admin</h2>}
                            
                            {/* Inventory Link */}
                            <Link
                                to="/dashboard/inventory"
                                className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2"
                            >
                                <Icon />
                                {!isMinimized && <span>Inventory</span>}
                            </Link>

                            {/* Products Management (Add) Link */}
                            <Link
                                to="/dashboard/products"
                                className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2"
                            >
                                <Icon />
                                {!isMinimized && <span>Products Management</span>}
                            </Link>

                            {/* Services Management Link */}
                            <Link
                                to="/dashboard/servicesmanagement"
                                className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2"
                            >
                                <Icon />
                                {!isMinimized && <span>Services Management</span>}
                            </Link>
                            
                            {/* Pet Profile Link */}
                            <Link
                                to="/dashboard/petprofile" 
                                className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2"
                            >
                                <Icon />
                                {!isMinimized && <span>Pet Profile</span>}
                            </Link>
                            
                            {/* Staff Management link */}
                            <Link
                                to="/dashboard/staff" 
                                className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2"
                            >
                                <Icon />
                                {!isMinimized && <span>Staff Management</span>}
                            </Link>
                            
                            {/* View Logs Link */}
                            <Link
                                to="/dashboard/view-logs"
                                className="flex items-center py-2 px-3 hover:bg-gray-700 rounded space-x-2"
                            >
                                <Icon />
                                {!isMinimized && <span>View Logs</span>}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer user section */}
                {/* Reverted border to standard gray-700 */}
                <div className="p-4 border-t border-gray-700 relative">
                    <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="flex items-center space-x-3">
                            <img
                                src={profilePic || "https://via.placeholder.com/40"}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            {!isMinimized && (
                                <div>
                                    {/* Reverted text to white */}
                                    <div className="text-white text-sm">{username || "Loading..."}</div>
                                    {/* Reverted text to standard gray-400 */}
                                    <div className="text-gray-400 text-xs capitalize">{role}</div>
                                </div>
                            )}
                        </div>
                        {/* Reverted text to white */}
                        {!isMinimized && <div className="text-white text-xl">=</div>}
                    </div>

                    {showUserMenu && !isMinimized && (
                        <div 
                            // Reverted menu background to standard gray-700
                            className="absolute bottom-16 left-4 bg-gray-700 rounded shadow-md w-44 p-2 flex flex-col space-y-2"
                        >
                            <button
                                onClick={openEditModal}
                                // Reverted hover background to standard gray-600
                                className="text-left hover:bg-gray-600 px-2 py-1 rounded"
                            >
                                Update Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                // Reverted hover background to standard gray-600
                                className="text-left hover:bg-gray-600 px-2 py-1 rounded"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Update Profile Modal (Reverted colors) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-60"></div>
                    <div className="relative bg-white rounded-lg w-96 p-6 z-50">
                        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">Update Profile</h2>
                        <div className="flex flex-col items-center mb-4">
                            <img
                                src={tempProfilePic ?? profilePic ?? "https://via.placeholder.com/100"}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover mb-2"
                            />
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                className="text-sm"
                                onChange={handleProfilePicChange}
                            />
                        </div>
                        <label className="block mb-2 text-gray-900">Username</label>
                        <input
                            type="text"
                            value={tempUsername}
                            onChange={(e) => setTempUsername(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 w-full mb-4"
                        />
                        <label className="block mb-2 text-gray-900">Email</label>
                        <input
                            type="email"
                            value={tempEmail}
                            onChange={(e) => setTempEmail(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 w-full mb-4"
                        />
                        <label className="block mb-2 text-gray-900">New Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 w-full mb-4"
                        />
                        <div className="flex justify-between">
                            <button
                                onClick={handleCancel}
                                className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                // Reverted button to standard blue/white
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                                Save
                            </button>
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => setShowConfirmDeactivate(true)}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Exit Modal (Reverted colors) */}
            {showConfirmExit && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-70"></div>
                    <div className="relative bg-white rounded-lg w-80 p-6 shadow-lg z-[10000]">
                        <h3 className="text-lg font-semibold mb-4 text-center">Exit without saving?</h3>
                        <div className="flex justify-between">
                            <button
                                onClick={confirmExitNo}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 w-24"
                            >
                                No
                            </button>
                            <button
                                onClick={confirmExitYes}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-24"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Deactivation Modal (Reverted colors) */}
            {showConfirmDeactivate && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-70"></div>
                    <div className="relative bg-white rounded-lg w-80 p-6 shadow-lg z-[10000]">
                        <h3 className="text-lg font-semibold mb-4 text-center">
                            Are you sure you want to deactivate your account? This action is permanent.
                        </h3>
                        <div className="flex justify-between">
                            <button
                                onClick={() => setShowConfirmDeactivate(false)}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 w-24"
                            >
                                No
                            </button>
                            <button
                                onClick={handleDeactivateAccount}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-24"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
