import { Link } from 'react-router-dom';
import { 
  FaUserPlus, 
  FaUserDoctor, 
  FaShieldHalved, 
  FaServer 
} from 'react-icons/fa6';
import { MdDashboardCustomize } from 'react-icons/md';

export default function HomePage() {
  return (
    <div className="min-h-full bg-white">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        
        {/* --- Hero Section --- */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 mb-8 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Production-ready React frontend
          </span>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            Doctor-patient appointment UI <br className="hidden md:block" />
            <span className="text-blue-600">built for your current server</span>
          </h1>
          
          {/* Copy */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            OTP login, patient signup, doctor signup, doctor search, profile view, appointment booking,
            role-based dashboard, prescription flow, join-meeting lock, and settings pages are already wired
            according to your Express routes.
          </p>
          
          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:-translate-y-0.5"
            >
              <FaUserPlus className="mr-2.5 text-lg" /> Create account
            </Link>
            
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold rounded-xl text-gray-700 bg-white border-2 border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all hover:-translate-y-0.5"
            >
              <FaUserDoctor className="mr-2.5 text-lg text-blue-600" /> Login
            </Link>
          </div>
        </div>

        {/* --- Features/Stats Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 md:mt-28">
          
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
            <div className="h-14 w-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FaShieldHalved className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">OTP Auth</h3>
            <p className="text-gray-500 leading-relaxed">
              Works perfectly with <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm">/email/check-user</code>, <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm">/send-otp</code> and <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm">/verify-email</code> routes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
            <div className="h-14 w-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MdDashboardCustomize className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Role dashboards</h3>
            <p className="text-gray-500 leading-relaxed">
              Separate patient and doctor flows equipped with robust booking and digital prescriptions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
            <div className="h-14 w-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FaServer className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Server-safe UI</h3>
            <p className="text-gray-500 leading-relaxed">
              Utilizes <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm">withCredentials</code> ensuring cookie-based authentication flows flawlessly with your backend.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}