import { useEffect, useMemo, useState } from 'react';
import { addPrescription, getDoctorAppointments } from '../api/appointments';
import AppointmentCard from '../components/AppointmentCard';
import Loader from '../components/Loader';
import MessageBanner from '../components/MessageBanner';
import { useAuth } from '../contexts/AuthContext';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState('scheduled');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('info');

  const load = async () => {
    try {
      setLoading(true);
      const res = await getDoctorAppointments(user.id);
      setAppointments(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user.id]);

  const filtered = useMemo(() => {
    if (tab === 'completed') return appointments.filter((item) => item.status === 'Completed');
    if (tab === 'cancelled') return appointments.filter((item) => item.status === 'Cancelled');
    return appointments.filter((item) => item.status === 'Scheduled');
  }, [appointments, tab]);

  const handlePrescription = async (appointmentId) => {
    try {
      await addPrescription(appointmentId, {
        diagnosis: 'General follow-up diagnosis',
        medicines: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '3 days', instructions: 'After food' }],
        labTests: ['CBC'],
        doctorNotes: 'Hydration and rest advised',
      });
      setTone('success');
      setMessage('Prescription added successfully. Patient will receive email.');
      load();
    } catch (error) {
      setTone('error');
      setMessage(error.message);
    }
  };

  if (loading) return <div className="page"><div className="container"><Loader text="Loading doctor dashboard" /></div></div>;

  return (
    <div className="page"><div className="container grid">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="section-title">Doctor dashboard</h1>
        <p className="section-copy">Manage scheduled visits, inspect patients, and complete consultations by adding prescriptions after the appointment time is over.</p>
        <MessageBanner tone={tone} message={message} />
        <div className="kpi-grid" style={{ marginTop: 18 }}>
          <div className="card kpi"><strong>{appointments.filter((item)=>item.status==='Scheduled').length}</strong><span className="muted">Scheduled</span></div>
          <div className="card kpi"><strong>{appointments.filter((item)=>item.status==='Completed').length}</strong><span className="muted">Completed</span></div>
          <div className="card kpi"><strong>{appointments.filter((item)=>item.appointmentInfo?.appointmentType==='Online').length}</strong><span className="muted">Online visits</span></div>
          <div className="card kpi"><strong>{appointments.filter((item)=>item.paymentInfo?.paymentStatus==='Pending').length}</strong><span className="muted">Pending payments</span></div>
        </div>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div className="tabs">{['scheduled','completed','cancelled'].map((item)=><button key={item} className={`tab ${tab===item?'active':''}`} onClick={()=>setTab(item)}>{item}</button>)}</div>
        <div className="list">
          {filtered.length ? filtered.map((appointment)=><AppointmentCard key={appointment._id} appointment={appointment} onComplete={appointment.status==='Scheduled' ? ()=>handlePrescription(appointment._id) : undefined} />) : <div className="empty-state">No appointments in this tab.</div>}
        </div>
      </div>
    </div></div>
  );
}
