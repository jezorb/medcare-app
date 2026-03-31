import { useEffect, useMemo, useState } from 'react';
import { 
  FiCalendar, FiCheckCircle, FiUsers, FiActivity, 
  FiClock, FiXCircle, FiPlus, FiGrid 
} from 'react-icons/fi';
import { getPatientAppointments } from '../api/appointments';
import { getPatientBasic, getPatientDoctors } from '../api/patients';
import AppointmentCard from '../components/AppointmentCard';
import DoctorCard from '../components/DoctorCard';
import Loader from '../components/Loader';
import { useAuth } from '../contexts/AuthContext';
import { cancelAppointment } from '../api/appointments';
import { useNavigate } from 'react-router-dom';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [tab, setTab] = useState('upcoming');

  const load = async () => {
    try {
      setLoading(true);
      const [appointmentRes, profileRes, doctorsRes] = await Promise.all([
        getPatientAppointments(user.id),
        getPatientBasic(user.id),
        getPatientDoctors(user.id),
      ]);
      setAppointments(appointmentRes.data || []);
      setProfile(profileRes.patient || null);
      setDoctors(doctorsRes.doctors || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user.id]);

  const filteredAppointments = useMemo(() => {
    if (tab === 'completed') return appointments.filter((item) => item.status === 'Completed');
    if (tab === 'cancelled') return appointments.filter((item) => item.status === 'Cancelled');
    return appointments.filter((item) => item.status === 'Scheduled');
  }, [appointments, tab]);

  const handleCancel = async (appointmentId) => {
    if(window.confirm("Are you sure you want to cancel this appointment?")) {
      await cancelAppointment(appointmentId, { cancellationReason: 'Cancelled from patient dashboard' });
      load();
    }
  };

  if (loading) return <Loader text="Setting up your health dashboard..." />;

  const stats = [
    { label: 'Upcoming', value: appointments.filter(a => a.status === 'Scheduled').length, icon: <FiCalendar />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed', value: appointments.filter(a => a.status === 'Completed').length, icon: <FiCheckCircle />, color: 'text-green-600 bg-green-50' },
    { label: 'My Doctors', value: doctors.length, icon: <FiUsers />, color: 'text-purple-600 bg-purple-50' },
    { label: 'Condition', value: profile?.condition || 'Stable', icon: <FiActivity />, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className={`p-3 rounded-2xl mb-4 ${stat.color} text-xl`}>
                {stat.icon}
              </div>
              <span className="text-2xl font-black text-gray-900">{stat.value}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Appointments Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <FiClock className="text-blue-500" /> Appointments
                </h2>
                
                {/* Modern Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {['upcoming', 'completed', 'cancelled'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${
                        tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((app) => (
                    <AppointmentCard 
                      key={app._id} 
                      appointment={app} 
                      onCancel={() => handleCancel(app._id)} 
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 italic text-sm">
                    <FiGrid className="text-4xl mb-2 opacity-20" />
                    No {tab} appointments found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Doctors Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <FiUsers className="text-purple-500" /> My Specialists
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <DoctorCard 
                      key={doctor.id} 
                      doctor={doctor} 
                      cta="Visit Profile" 
                      className="border border-gray-50"
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 font-medium tracking-tight">No doctors engaged yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}