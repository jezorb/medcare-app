import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createDoctor, createPatient } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import MessageBanner from '../components/MessageBanner';

// React Icons (Added FaPlus and FaXmark)
import { FaUser, FaUserDoctor, FaSpinner, FaArrowRight, FaArrowLeft, FaPlus, FaXmark } from 'react-icons/fa6';

const patientInitial = {
  role: 'patient',
  name: '', age: '', sex: 'Male', bloodGroup: '', height: '', weight: '',
  phone: '', email: '', address: '', illness: '', condition: 'Stable', medicalHistory: '',
};

const doctorInitial = {
  role: 'doctor',
  name: '', gender: 'Male', phone: '', email: '', clinicAddress: '',
  specializations: [], // Ab yeh empty array se shuru hoga
  experienceYears: '', consultationFees: '', bio: '',
  mondayStart: '09:00', mondayEnd: '17:00',
};

export default function SignupPage() {
  const [role, setRole] = useState('patient');
  const [patientForm, setPatientForm] = useState(patientInitial);
  const [doctorForm, setDoctorForm] = useState(doctorInitial);
  const [currentSpec, setCurrentSpec] = useState(''); // New state to track currently typing specialization
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('info');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const submitPatient = async () => {
    const payload = {
      name: patientForm.name,
      age: Number(patientForm.age),
      sex: patientForm.sex,
      bloodGroup: patientForm.bloodGroup || undefined,
      height: patientForm.height ? Number(patientForm.height) : undefined,
      weight: patientForm.weight ? Number(patientForm.weight) : undefined,
      contactInfo: { phone: patientForm.phone, email: patientForm.email, address: patientForm.address },
      illness: patientForm.illness,
      condition: patientForm.condition,
      medicalHistory: patientForm.medicalHistory
        ? [{ diagnosis: patientForm.medicalHistory, notes: 'Added during signup' }]
        : [],
    };
    const res = await createPatient(payload);
    login({ role: 'patient', id: res.data._id, profile: res.data });
  };

  const submitDoctor = async () => {
    const payload = {
      personalInfo: { name: doctorForm.name, gender: doctorForm.gender },
      contactInfo: { phone: doctorForm.phone, email: doctorForm.email, clinicAddress: doctorForm.clinicAddress },
      professionalInfo: {
        specializations: doctorForm.specializations, // Ab directly array pass kar rahe hain
        experienceYears: Number(doctorForm.experienceYears),
        consultationFees: Number(doctorForm.consultationFees),
      },
      availability: [{ day: 'Monday', startTime: doctorForm.mondayStart, endTime: doctorForm.mondayEnd }],
      bio: doctorForm.bio,
    };
    const res = await createDoctor(payload);
    login({ role: 'doctor', id: res.data._id, profile: res.data });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (role === 'patient') await submitPatient();
      else await submitDoctor();
      navigate('/dashboard');
    } catch (error) {
      setTone('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Specialization Tags
  const handleAddSpecialization = (e) => {
    if (e) e.preventDefault();
    if (currentSpec.trim() !== '') {
      if (!doctorForm.specializations.includes(currentSpec.trim())) {
        setDoctorForm((prev) => ({
          ...prev,
          specializations: [...prev.specializations, currentSpec.trim()]
        }));
      }
      setCurrentSpec(''); // Reset input
    }
  };

  const handleRemoveSpecialization = (specToRemove) => {
    setDoctorForm((prev) => ({
      ...prev,
      specializations: prev.specializations.filter(spec => spec !== specToRemove)
    }));
  };

  // Common UI Classes
  const inputStyles = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors outline-none text-gray-800";
  const labelStyles = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10 relative">
        
        {/* Back to Home Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-8 group w-fit lg:text-base"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        </Link>

        {/* Header & Role Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              {role === 'patient' ? <FaUser className="text-blue-600" /> : <FaUserDoctor className="text-blue-600" />}
              Create Account
            </h1>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              Join MedCare Hub. Patient and doctor signup is mapped to your server.
            </p>
          </div>

          {/* Modern Tab Toggle for Role Selection */}
          <div className="flex bg-gray-100 p-1.5 rounded-xl w-full md:w-auto shadow-inner">
            <button
              onClick={() => setRole('patient')}
              className={`flex-1 md:w-32 py-2.5 text-sm font-bold rounded-lg transition-all ${
                role === 'patient' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => setRole('doctor')}
              className={`flex-1 md:w-32 py-2.5 text-sm font-bold rounded-lg transition-all ${
                role === 'doctor' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Doctor
            </button>
          </div>
        </div>

        <MessageBanner tone={tone} message={message} />

        {/* Dynamic Form Content */}
        {role === 'patient' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {[
              ['Full name', 'name', 'text'], ['Age', 'age', 'number'], 
              ['Height (cm)', 'height', 'number'], ['Weight (kg)', 'weight', 'number'], ['Phone', 'phone', 'tel'], 
              ['Email', 'email', 'email'], ['Address', 'address', 'text'], ['Illness', 'illness', 'text']
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className={labelStyles}>{label}</label>
                <input type={type} className={inputStyles} value={patientForm[key]} onChange={(e) => setPatientForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={`Enter ${label.toLowerCase()}`} />
              </div>
            ))}
            
            {/* Blood Group Dropdown */}
            <div>
              <label className={labelStyles}>Blood group</label>
              <select className={inputStyles} value={patientForm.bloodGroup} onChange={(e) => setPatientForm((p) => ({ ...p, bloodGroup: e.target.value }))}>
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className={labelStyles}>Medical history summary</label>
              <input type="text" className={inputStyles} value={patientForm.medicalHistory} onChange={(e) => setPatientForm((p) => ({ ...p, medicalHistory: e.target.value }))} placeholder="Brief history..." />
            </div>

            <div>
              <label className={labelStyles}>Sex</label>
              <select className={inputStyles} value={patientForm.sex} onChange={(e) => setPatientForm((p) => ({ ...p, sex: e.target.value }))}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            
            <div>
              <label className={labelStyles}>Condition</label>
              <select className={inputStyles} value={patientForm.condition} onChange={(e) => setPatientForm((p) => ({ ...p, condition: e.target.value }))}>
                <option>Stable</option><option>Critical</option><option>Recovering</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* Specializations ko map se nikal diya gaya hai */}
            {[
              ['Doctor name', 'name', 'text'], ['Phone', 'phone', 'tel'], ['Email', 'email', 'email'], 
              ['Clinic address', 'clinicAddress', 'text'], 
              ['Experience years', 'experienceYears', 'number'], ['Consultation fees', 'consultationFees', 'number'], 
              ['Monday start', 'mondayStart', 'time'], ['Monday end', 'mondayEnd', 'time']
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className={labelStyles}>{label}</label>
                <input type={type} className={inputStyles} value={doctorForm[key]} onChange={(e) => setDoctorForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={`Enter ${label.toLowerCase()}`} />
              </div>
            ))}

            <div>
              <label className={labelStyles}>Gender</label>
              <select className={inputStyles} value={doctorForm.gender} onChange={(e) => setDoctorForm((p) => ({ ...p, gender: e.target.value }))}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>

            {/* 🔥 Dynamic Specializations Input 🔥 */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelStyles}>Specializations</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className={inputStyles} 
                  value={currentSpec} 
                  onChange={(e) => setCurrentSpec(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSpecialization();
                    }
                  }}
                  placeholder="e.g. Cardiologist, Dermatologist (Press Enter to add)" 
                />
                <button 
                  type="button" 
                  onClick={handleAddSpecialization}
                  className="px-5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                  aria-label="Add specialization"
                >
                  <FaPlus className="text-lg" />
                </button>
              </div>
              
              {/* Display Added Tags */}
              {doctorForm.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {doctorForm.specializations.map((spec, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 shadow-sm rounded-full text-sm font-medium text-gray-700 animate-fade-in-up"
                    >
                      {spec}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                      >
                        <FaXmark />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bio spans full width on smaller screens, 2 cols on large */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelStyles}>Bio</label>
              <textarea 
                className={`${inputStyles} resize-none`} 
                rows="3" 
                value={doctorForm.bio} 
                onChange={(e) => setDoctorForm((p) => ({ ...p, bio: e.target.value }))} 
                placeholder="Brief professional bio..." 
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
          <button 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading} 
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin text-lg" /> Processing...
              </>
            ) : (
              <>
                Create Account <FaArrowRight className="text-sm" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}