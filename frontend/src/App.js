import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    Outlet,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Shop from "./pages/Shop.jsx";
import ServicesDashboard from "./pages/ServicesDashboard.jsx"; // This remains the MANAGEMENT page
import AboutUs from "./pages/AboutUs.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DashboardHome from "./components/DashboardHome.jsx";
import ViewLogs from "./pages/ViewLogs.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ProductsDashboard from "./pages/ProductsDashboard.jsx"; 
import Inventory from "./pages/Inventory.jsx"; 
import StaffManagement from "./pages/StaffManagement.jsx"; 
import PetProfile from "./pages/PetProfile.jsx";
import Feedback from "./pages/Feedback.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
// ✅ NEW: Import Appointment page
import Appointment from "./pages/Appointment.jsx";


// ✅ ProtectedRoute Component (JWT-based)
function ProtectedRoute({ children }) {
    const access = localStorage.getItem("access");

    if (!access) return <Navigate to="/login" replace />;

    try {
        const payload = JSON.parse(atob(access.split(".")[1]));
        const now = Date.now() / 1000;
        if (payload.exp < now) {
            localStorage.clear();
            return <Navigate to="/login" replace />;
        }
    } catch (err) {
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }

    return children;
}

// ✅ Layout with sidebar
function SidebarLayout() {
    return (
        // Reverted to stable light gray
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
}


export default function App() {
    return (
        <Router>
            <Routes>
                {/* Public pages without sidebar */}
                <Route path="/login" element={<Login />} />
                <Route path="/register/user" element={<Register />} />
                <Route path="/register/admin" element={<Register />} />
                <Route path="/" element={<LandingPage />} />
                <Route path="/landingpage" element={<LandingPage />} />

                {/* Pages with sidebar (accessible via sidebar links) */}
                <Route element={<SidebarLayout />}>
                    <Route path="shop" element={<Shop />} />
                    <Route path="about" element={<AboutUs />} />
                    
                    {/* Public Services route */}
                    <Route path="services" element={<ServicesPage />} /> 

                    {/* Protected dashboard pages */}
                    <Route
                        path="dashboard/*"
                        element={
                            <ProtectedRoute>
                                <Outlet />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="home" element={<DashboardHome />} />
                        <Route path="view-logs" element={<ViewLogs />} />
                        
                        {/* FIX 1: Appointment route added */}
                        <Route path="appointment" element={<Appointment />} />
                        
                        {/* Services management page */}
                        <Route path="servicesmanagement" element={<ServicesDashboard />} />
                        
                        <Route path="inventory" element={<Inventory />} /> 

                        <Route path="products" element={<ProductsDashboard />} /> 
                        
                        <Route path="petprofile" element={<PetProfile />} /> 
                        
                        <Route path="staff" element={<StaffManagement />} /> 
                        
                        <Route path="feedback" element={<Feedback />} /> 

                        <Route path="*" element={<Navigate to="home" replace />} />
                    </Route>
                </Route>

                {/* Redirect unknown paths */}
                <Route path="*" element={<Navigate to="/landingpage" />} />
            </Routes>
        </Router>
    );
}
