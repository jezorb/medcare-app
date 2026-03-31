import { useEffect, useState } from "react";
import DoctorCard from "../components/DoctorCard";
import Loader from "../components/Loader";
import MessageBanner from "../components/MessageBanner";
import { getDoctors, searchDoctors } from "../api/doctors";
import { FiSearch, FiUser, FiMapPin, FiStar, FiActivity } from "react-icons/fi";
export default function DoctorsPage() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [term, setTerm] = useState("");
  const [message, setMessage] = useState("");

  const loadDoctors = async (search = "") => {
    try {
      setLoading(true);
      const res = search ? await searchDoctors(search) : await getDoctors();
      setDoctors(res.data || []);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Find Doctors
            </h1>
            <p className="mt-2 text-gray-600">
              Search by name, specialization, or clinic location.
            </p>
          </div>

          {/* Search Bar - Responsive */}
          <div className="relative flex items-center w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
              placeholder="Search doctors..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadDoctors(term)}
            />
            <button
              onClick={() => loadDoctors(term)}
              className="ml-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Search
            </button>
          </div>
        </div>
        <div style={{ height: 18 }} />
        <MessageBanner tone="error" message={message} />
        {loading ? (
          <Loader text="Loading doctors" />
        ) : doctors.length ? (
          <div className="grid grid-3">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="card empty-state">No doctors found.</div>
        )}
      </div>
    </div>
  );
}
