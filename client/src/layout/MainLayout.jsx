import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// React Icons Imports
import { FaStethoscope, FaChartPie, FaGear, FaArrowRightFromBracket } from "react-icons/fa6";
import { MdMenu, MdClose } from "react-icons/md";

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getStoredAuthData = () => {
    try {
      const possibleKeys = ["auth", "user", "medcare_user", "currentUser"];
      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === "object") {
            return parsed;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to parse localStorage auth data:", error);
      return null;
    }
  };

  const storedAuth = getStoredAuthData();
  const role = user?.role || storedAuth?.role || null;
  const currentUser = user?.user || user || storedAuth?.user || null;

  const isDoctor = role === "doctor";
  const isLoggedIn = !!currentUser;

  // Helper function for NavLink classes to handle active state
  const navLinkClasses = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-600"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-gray-900">
      
      {/* SIFR TAB DIKHAO JAB USER LOGGED IN HO */}
      {isLoggedIn && (
        <>
          {/* Mobile Top Header */}
          <div className="md:hidden flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
            <NavLink className="text-xl font-bold text-blue-600 tracking-tight" to="/">
              MedCare Hub
            </NavLink>
            <button
              className="text-gray-700 p-1 -mr-1 focus:outline-none transition-transform active:scale-95"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <MdClose size={28} /> : <MdMenu size={28} />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <aside
            className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out z-40 
            ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} 
            md:translate-x-0`}
          >
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
              <NavLink className="text-xl font-bold text-blue-600 tracking-tight" to="/">
                MedCare Hub
              </NavLink>
            </div>

            <nav className="flex flex-col flex-1 p-4 gap-2 overflow-y-auto">
              <NavLink className={navLinkClasses} to="/dashboard">
                <FaChartPie className="mr-3 text-lg" /> Dashboard
              </NavLink>
              {!isDoctor && (
                <NavLink className={navLinkClasses} to="/doctors">
                  <FaStethoscope className="mr-3 text-lg" /> Doctors
                </NavLink>
              )}

              <NavLink className={navLinkClasses} to="/settings">
                <FaGear className="mr-3 text-lg" /> Settings
              </NavLink>

              <button
                className="mt-auto flex items-center px-4 py-3 w-full text-left text-red-600 rounded-lg font-medium transition-colors hover:bg-red-50"
                onClick={handleLogout}
              >
                <FaArrowRightFromBracket className="mr-3 text-lg" /> Logout
              </button>
            </nav>
          </aside>

          {/* Overlay for mobile when sidebar is open */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}
        </>
      )}

      {/* Main Content Area */}
      {/* Agar logged in nahi hai, toh margin left aur margin top hata do taaki full screen le le */}
      <div className={`flex-1 flex flex-col min-h-screen ${isLoggedIn ? "md:ml-64 mt-16 md:mt-0" : ""}`}>
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>

        {/* <footer className="p-6 bg-white border-t border-gray-200 text-center text-sm text-gray-500">
          <div className="max-w-4xl mx-auto">
            Built for your Express + MongoDB medical appointment server.
          </div>
        </footer> */}
      </div>
    </div>
  );
}