import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiSettings, 
  FiTrash2, FiSave, FiAlertTriangle, FiInfo 
} from 'react-icons/fi';
import { deleteDoctor, updateDoctor, getDoctorById } from '../api/doctors';
import { deletePatient, getPatientById, updatePatient } from '../api/patients';
import MessageBanner from '../components/MessageBanner';
import Loader from '../components/Loader';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('info');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = user.role === 'patient' ? await getPatientById(user.id) : await getDoctorById(user.id);
        const data = res.data;
        
        if (user.role === 'patient') {
          setForm({
            name: data.name || '', age: data.age || '', sex: data.sex || 'Male', 
            illness: data.illness || '', condition: data.condition || 'Stable',
            phone: data.contactInfo?.phone || '', email: data.contactInfo?.email || '', 
            address: data.contactInfo?.address || '',
          });
        } else {
          setForm({
            name: data.personalInfo?.name || '', gender: data.personalInfo?.gender || 'Male', 
            bio: data.bio || '', phone: data.contactInfo?.phone || '', 
            email: data.contactInfo?.email || '', clinicAddress: data.contactInfo?.clinicAddress || '',
          });
        }
      } catch (err) {
        setTone('error');
        setMessage("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.id, user.role]);

  const save = async () => {
    try {
      setMessage('');
      let res;
      if (user.role === 'patient') {
        res = await updatePatient(user.id, {
          name: form.name, age: Number(form.age), sex: form.sex, illness: form.illness, condition: form.condition,
          contactInfo: { phone: form.phone, email: form.email, address: form.address },
        });
      } else {
        res = await updateDoctor(user.id, {
          personalInfo: { name: form.name, gender: form.gender },
          bio: form.bio,
          contactInfo: { phone: form.phone, email: form.email, clinicAddress: form.clinicAddress },
        });
      }
      login({ ...user, profile: res.data });
      setTone('success');
      setMessage('Profile updated successfully');
    } catch (error) {
      setTone('error');
      setMessage(error.message);
    }
  };

  const removeAccount = async () => {
    try {
      if (user.role === 'patient') await deletePatient(user.id);
      else await deleteDoctor(user.id);
      logout();
      navigate('/');
    } catch (error) {
      setTone('error');
      setMessage(error.message);
    }
  };

  if (loading) return <Loader text="Loading your settings..." />;

  // Input helper to render clean labels
  const renderInput = (key, label, icon, type = "text") => {
    const isTextArea = ['bio', 'address'].includes(key);
    const isSelect = ['sex', 'condition', 'gender'].includes(key);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          {icon} {label}
        </label>
        
        {isTextArea ? (
          <textarea
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
            value={form[key]}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          />
        ) : isSelect ? (
          <select
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            value={form[key]}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          >
            {key === 'condition' ? (
              <>
                <option value="Stable">Stable</option>
                <option value="Critical">Critical</option>
                <option value="Recovering">Recovering</option>
              </>
            ) : (
              <>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </>
            )}
          </select>
        ) : (
          <input
            type={type}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={form[key]}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 text-white">
            <FiSettings className="text-2xl animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Account Settings</h1>
            <p className="text-sm text-gray-500 font-medium">Manage your profile and account preferences</p>
          </div>
        </div>

        <MessageBanner tone={tone} message={message} />

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          {/* Section Header */}
          <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FiUser className="text-blue-500" /> Personal Information
            </h2>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('name', 'Full Name', <FiUser />)}
              {user.role === 'patient' 
                ? renderInput('age', 'Age', <FiInfo />, 'number') 
                : renderInput('gender', 'Gender', <FiUser />)}
              
              {user.role === 'patient' 
                ? renderInput('sex', 'Biological Sex', <FiUser />) 
                : null}
              
              {renderInput('email', 'Email Address', <FiMail />, 'email')}
              {renderInput('phone', 'Phone Number', <FiPhone />, 'tel')}
              
              {user.role === 'patient' && renderInput('condition', 'Health Condition', <FiAlertTriangle />)}
            </div>

            <div className="mt-6">
              {user.role === 'patient' 
                ? renderInput('address', 'Residential Address', <FiMapPin />)
                : renderInput('clinicAddress', 'Clinic Address', <FiMapPin />)}
            </div>

            <div className="mt-6">
              {user.role === 'doctor' && renderInput('bio', 'Professional Bio', <FiInfo />)}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-100">
              <button 
                onClick={save}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
              >
                <FiSave /> Save Changes
              </button>

              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-all"
                >
                  <FiTrash2 /> Delete Account
                </button>
              ) : (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                  <span className="text-xs font-bold text-red-600 uppercase">Are you sure?</span>
                  <button onClick={removeAccount} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md">Yes, Delete</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="mt-8 p-6 bg-amber-50 rounded-[24px] border border-amber-100 flex gap-4">
          <FiAlertTriangle className="text-amber-500 text-xl flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-bold text-amber-900 mb-1">Privacy & Security</h4>
            <p className="text-amber-700 leading-relaxed">
              Your contact information is only shared with verified {user.role === 'patient' ? 'doctors' : 'patients'} when an appointment is confirmed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}