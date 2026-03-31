import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiStar,
  FiAward,
  FiCheckCircle,
  FiInfo,
  FiAlertCircle,
} from "react-icons/fi";
import { FiVideo, FiHome } from "react-icons/fi";
import { getDoctorById, getDoctorReviews } from "../api/doctors";
import { createAppointment } from "../api/appointments";
import { engageDoctor } from "../api/patients";
import Loader from "../components/Loader";
import MessageBanner from "../components/MessageBanner";
import { useAuth } from "../contexts/AuthContext";
import { formatDate, initials } from "../utils/helpers";

export default function DoctorDetailsPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("info");
  const [booking, setBooking] = useState({
    appointmentDate: "",
    startTime: "",
    endTime: "",
    appointmentType: "Offline",
    reason: "",
    notes: "",
    paymentMethod: "UPI",
  });

  // Base slots jo hum use karenge agar doctor available hai
  const allPossibleSlots = [
    { start: "09:00", end: "09:30" },
    { start: "09:30", end: "10:00" },
    { start: "10:00", end: "10:30" },
    { start: "10:30", end: "11:00" },
    { start: "11:00", end: "11:30" },
    { start: "11:30", end: "12:00" },
    { start: "14:00", end: "14:30" },
    { start: "14:30", end: "15:00" },
    { start: "15:00", end: "15:30" },
    { start: "15:30", end: "16:00" },
  ];

  const load = async () => {
    try {
      setLoading(true);
      const [doctorRes, reviewRes] = await Promise.all([
        getDoctorById(doctorId),
        getDoctorReviews(doctorId),
      ]);
      setDoctor(doctorRes.data);
      setReviews(reviewRes.data || []);
    } catch (error) {
      setTone("error");
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [doctorId]);

  // Logic: Din ke hisab se slots filter karna
  const availableSlotsForDate = useMemo(() => {
    if (!booking.appointmentDate || !doctor?.availability) return [];

    const date = new Date(booking.appointmentDate);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }); // e.g. "Monday"

    // Doctor ki availability check karo us din ke liye
    const dayAvailability = doctor.availability.find((a) => a.day === dayName);

    if (!dayAvailability) return null; // Doctor us din nahi baithta

    // Sirf wo slots dikhao jo doctor ke start aur end time ke beech mein hain
    return allPossibleSlots.filter((slot) => {
      return (
        slot.start >= dayAvailability.startTime &&
        slot.end <= dayAvailability.endTime
      );
    });
  }, [booking.appointmentDate, doctor]);

  const handleBook = async () => {
    try {
      if (!user || user.role !== "patient")
        throw new Error("Please login as patient");
      if (!booking.startTime) throw new Error("Please select a time slot");
      await engageDoctor(user.id, doctorId);
      await createAppointment({ ...booking, patientId: user.id, doctorId });
      setTone("success");
      setMessage("Appointment booked successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      setTone("error");
      setMessage(error.message);
    }
  };

  if (loading) return <Loader text="Loading Profile..." />;
  if (!doctor)
    return (
      <div className="p-10">
        <MessageBanner tone="error" message="Doctor not found" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() =>
            showBooking ? setShowBooking(false) : navigate("/doctors")
          }
          className="flex items-center text-gray-400 hover:text-blue-600 mb-8 transition-all group font-semibold text-sm"
        >
          <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />{" "}
          {showBooking ? "BACK TO PROFILE" : "BACK TO SEARCH"}
        </button>

        <MessageBanner tone={tone} message={message} />

        {!showBooking ? (
          /* --- DOCTOR PROFILE VIEW (Same as before) --- */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="h-28 w-28 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-3xl font-bold border border-blue-100 flex-shrink-0">
                    {initials(doctor.personalInfo?.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {doctor.personalInfo?.name}
                      </h1>
                      <FiCheckCircle className="text-green-500" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {doctor.professionalInfo?.specializations?.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-gray-100 mt-10 gap-8">
                  <button
                    onClick={() => setActiveTab("about")}
                    className={`pb-4 text-sm font-bold capitalize relative ${activeTab === "about" ? "text-blue-600" : "text-gray-400"}`}
                  >
                    About{" "}
                    {activeTab === "about" && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`pb-4 text-sm font-bold capitalize relative ${activeTab === "reviews" ? "text-blue-600" : "text-gray-400"}`}
                  >
                    Reviews{" "}
                    {activeTab === "reviews" && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </button>
                </div>

                <div className="mt-8">
                  {activeTab === "about" ? (
                    <div>
                      <p className="text-gray-600 text-sm leading-loose mb-8">
                        {doctor.bio || "No bio available."}
                      </p>
                      <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                        <FiClock className="text-blue-600" /> Availability
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {doctor.availability?.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                          >
                            <span className="font-bold text-gray-700">
                              {slot.day}
                            </span>
                            <span className="text-blue-600 font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Reviews Mapping */
                    <div className="space-y-4">
                      {reviews.map((rev, i) => (
                        <div
                          key={i}
                          className="p-4 border border-gray-100 rounded-xl"
                        >
                          <div className="font-bold text-gray-800">
                            {rev.patient?.name}
                          </div>
                          <p className="text-gray-500 text-sm italic">
                            "{rev.reviewText}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 sticky top-24">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="text-sm text-gray-500 mb-1">
                  Consultation Fee
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-6">
                  ₹{doctor.professionalInfo?.consultationFees}
                </div>
                <button
                  onClick={() => setShowBooking(true)}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* --- DYNAMIC BOOKING FORM SECTION --- */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Select Date & Time
              </h2>
              <p className="text-gray-400 text-sm mb-10">
                Appointments for {doctor.personalInfo?.name}
              </p>

              <div className="space-y-8">
                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Appointment Date
                  </label>
                  <input
                    className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    type="date"
                    min={new Date().toISOString().split("T")[0]} // Past dates disable
                    value={booking.appointmentDate}
                    onChange={(e) =>
                      setBooking((p) => ({
                        ...p,
                        appointmentDate: e.target.value,
                        startTime: "",
                        endTime: "",
                      }))
                    }
                  />
                </div>

                {/* Slot Selection Logic */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Time Slots
                  </label>

                  {!booking.appointmentDate ? (
                    <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium">
                      <FiInfo /> Please select a date to see available slots.
                    </div>
                  ) : availableSlotsForDate === null ? (
                    <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                      <FiAlertCircle /> Doctor is not available on this day.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableSlotsForDate.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            setBooking((p) => ({
                              ...p,
                              startTime: slot.start,
                              endTime: slot.end,
                            }))
                          }
                          className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${
                            booking.startTime === slot.start
                              ? "bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]"
                              : "bg-white border-gray-100 text-gray-600 hover:border-blue-200"
                          }`}
                        >
                          {slot.start} - {slot.end}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">
                    Consultation Mode
                  </label>
                  <div className="flex gap-4">
                    {[
                      { id: "Offline", label: "In-Clinic", icon: <FiHome /> },
                      { id: "Online", label: "Video Call", icon: <FiVideo /> },
                    ].map((mode) => {
                      const isSelected = booking.appointmentType === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() =>
                            setBooking((p) => ({
                              ...p,
                              appointmentType: mode.id,
                            }))
                          }
                          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold transition-all border-2 ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm"
                              : "border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200"
                          }`}
                        >
                          <span
                            className={`text-lg ${isSelected ? "text-blue-600" : "text-gray-400"}`}
                          >
                            {mode.icon}
                          </span>
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Chota sa helper text production touch ke liye */}
                  {booking.appointmentType === "Online" && (
                    <p className="text-[10px] text-blue-500 font-medium ml-1 animate-in fade-in slide-in-from-left-1">
                      * Meeting link will be shared via Email
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Reason
                  </label>
                  <input
                    className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none"
                    placeholder="Reason for visit"
                    value={booking.reason}
                    onChange={(e) =>
                      setBooking((p) => ({ ...p, reason: e.target.value }))
                    }
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleBook}
                    disabled={!booking.startTime}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-blue-700 shadow-lg transition-all active:scale-95"
                  >
                    Confirm Appointment
                  </button>
                  <button
                    onClick={() => setShowBooking(false)}
                    className="px-8 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
