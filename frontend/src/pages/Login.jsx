import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../icons/CHONKY_LOGO.png"; // Import your logo

export default function Login() {
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const access = localStorage.getItem("access");
        const role = localStorage.getItem("role");
        const storedUser = localStorage.getItem("user");

        if (access && (role === "admin" || role === "user") && storedUser) {
            // Load persistent profile picture if available
            const parsed = JSON.parse(storedUser);
            const storedPic = localStorage.getItem(`profilePic_${parsed.username}`);
            if (storedPic) {
                parsed.profilePic = storedPic;
                localStorage.setItem("user", JSON.stringify(parsed));
            }

            // FIX 1: Always navigate to the defined absolute path: /dashboard/home
            navigate("/dashboard/home", { replace: true });
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch("http://localhost:8000/api/accounts/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                const role = data.is_staff ? "admin" : "user";

                // ✅ Store JWT tokens
                localStorage.setItem("access", data.access);
                localStorage.setItem("refresh", data.refresh);
                localStorage.setItem("role", role);

                // ✅ Prepare user object
                const userObj = {
                    username: data.username,
                    email: data.email,
                    role,
                };

                // ✅ Fetch persistent profile picture if exists
                const storedPic = localStorage.getItem(`profilePic_${data.username}`);
                if (storedPic) {
                    userObj.profilePic = storedPic;
                }

                localStorage.setItem("user", JSON.stringify(userObj));

                // FIX 2: Always navigate to the defined absolute path: /dashboard/home
                navigate("/dashboard/home", { replace: true });

            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An error occurred. Please try again.");
        }
    };

    return (
        // BG: bg-chonky-brown-50 (used for main background)
        <div className="min-h-screen flex items-center justify-center bg-chonky-brown-50 relative">
            {/* Top-left clickable logo */}
            <Link to="/landingpage" className="absolute top-4 left-4">
                <img src={Logo} alt="Chonky Logo" className="h-12 w-auto cursor-pointer" />
            </Link>

            {/* Form Card */}
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
                {/* Text: text-default-text */}
                <h2 className="text-3xl font-bold text-center mb-6 text-default-text">Login</h2>

                {error && <p className="text-red-500 text-center mb-2">{error}</p>}

                <form className="flex flex-col space-y-4" onSubmit={handleLogin}>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        // Focus ring changed to use a gray/brown focus color if needed, sticking to gray-300 border
                        className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-text-brown"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                         // Focus ring changed to use a gray/brown focus color if needed, sticking to gray-300 border
                        className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-text-brown"
                        required
                    />

                    <button
                        type="submit"
                        // Button: bg-yellow (Used for buttons) | Text: text-default-text
                        className="bg-yellow text-default-text p-3 rounded-md hover:opacity-80 transition font-semibold shadow-md"
                    >
                        Login
                    </button>

                    {/* Text: text-default-text (replaces gray-600) */}
                    <p className="text-center text-default-text mt-4">
                        Don’t have an account?{" "}
                        {/* Link text uses custom text-brown or a hover color */}
                        <Link to="/register/user" className="text-text-brown hover:underline">
                            Register
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
