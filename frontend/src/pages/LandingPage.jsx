// src/pages/LandingPage.jsx
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-5xl font-bold mb-4">Welcome to Our Website!</h1>
      <p className="text-xl text-gray-700 mb-6">
        Explore our products and services.
      </p>

      {/* Centered Sign In button */}
      <button
        onClick={() => navigate("/login")}
        className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-500 transition"
      >
        Sign In
      </button>
    </div>
  );
}
