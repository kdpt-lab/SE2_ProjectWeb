import React from "react";
import Sidebar from "../components/Sidebar.jsx";
import { Outlet } from "react-router-dom"; // For nested dashboard routes

export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <Outlet /> {/* Nested pages like /dashboard/home will render here */}
      </main>
    </div>
  );
}
