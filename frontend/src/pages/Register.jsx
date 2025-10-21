// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import CHONKY_LOGO from "../icons/CHONKY_LOGO.png"; // import your logo

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRegister = location.pathname === "/register/admin";
  const endpoint = isAdminRegister
    ? "http://127.0.0.1:8000/api/accounts/register/admin/"
    : "http://127.0.0.1:8000/api/accounts/register/user/";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resetMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!username || !email || !password || !confirmPassword) {
      setErrorMsg("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.status === 201 || res.ok) {
        setSuccessMsg("Registration successful. Redirecting to login...");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        if (typeof data === "object") {
          const text =
            data.message ||
            Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ");
          setErrorMsg(text || "Registration failed.");
        } else {
          setErrorMsg(String(data) || "Registration failed.");
        }
      }
    } catch (err) {
      console.error("Register error:", err);
      setErrorMsg("Network error. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 relative">
      {/* Logo top-left redirects to landing page */}
      <button
        onClick={() => navigate("/landingpage")}
        className="absolute top-4 left-4"
      >
        <img src={CHONKY_LOGO} alt="Logo" className="w-16 h-16 object-contain" />
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Register</h2>

        {isAdminRegister && (
          <div className="text-sm text-yellow-700 text-center mb-4">
            You are creating an <strong>admin</strong> account (backend will set admin privileges).
          </div>
        )}

        {errorMsg && (
          <div className="mb-3 text-red-600 text-sm whitespace-pre-wrap">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="mb-3 text-green-600 text-sm">{successMsg}</div>
        )}

        <form className="flex flex-col space-y-4" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className={`p-3 rounded-md text-white ${
              submitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {submitting ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
