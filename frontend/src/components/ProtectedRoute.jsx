// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // ✅ If not logged in, go back to login page
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // ✅ If logged in, allow access
  return children;
}
