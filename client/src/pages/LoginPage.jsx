import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MessageBanner from '../components/MessageBanner';
import { checkUser, sendOtp, verifyOtp } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

// React Icons
import { 
  FaUser, 
  FaUserDoctor, 
  FaEnvelope, 
  FaLock, 
  FaArrowRight, 
  FaSpinner, 
  FaArrowLeft,
  FaPenToSquare
} from 'react-icons/fa6';

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ role: 'patient', name: '', email: '', otp: '' });
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('info');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const verifyUser = async () => {
    try {
      setLoading(true);
      const res = await checkUser({ role: form.role, name: form.name, email: form.email });
      setTone('success');
      setMessage(res.message);
      setStep(2);
    } catch (error) {
      setTone('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    try {
      setLoading(true);
      const res = await sendOtp({ role: form.role, name: form.name, email: form.email });
      setTone('success');
      setMessage(`${res.message}. OTP valid for ${res.expiresInSeconds} seconds.`);
      setStep(3);
    } catch (error) {
      setTone('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      const res = await verifyOtp({ role: form.role, name: form.name, email: form.email, otp: form.otp });
      login({ role: res.data.role, profile: res.data, id: res.data.id });
      navigate('/dashboard');
    } catch (error) {
      setTone('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Common UI Classes
  const inputStyles = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-gray-800 disabled:bg-gray-100 disabled:text-gray-500";
  const labelStyles = "block text-sm font-semibold text-gray-700 mb-1.5";
  const iconStyles = "absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative">
        
        {/* Back to Home Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6 group w-fit lg:text-2xl"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Login with OTP</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Existing patients and doctors only. Secure, passwordless entry.
          </p>
        </div>

        <MessageBanner tone={tone} message={message} />

        <div className="space-y-5 mt-6">
          
          {/* Form Header (Edit button logic) */}
          {step > 1 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase tracking-wide">User Verified</span>
              <button 
                onClick={() => setStep(1)} 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors"
              >
                <FaPenToSquare /> Edit details
              </button>
            </div>
          )}

          {/* Role Selection Tabs */}
          <div>
            <label className={labelStyles}>Account Type</label>
            <div className={`flex bg-gray-100 p-1.5 rounded-xl shadow-inner ${step > 1 ? 'opacity-60 pointer-events-none' : ''}`}>
              <button
                onClick={() => update('role', 'patient')}
                className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  form.role === 'patient' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaUser /> Patient
              </button>
              <button
                onClick={() => update('role', 'doctor')}
                className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  form.role === 'doctor' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaUserDoctor /> Doctor
              </button>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className={labelStyles}>Full Name</label>
            <div className="relative">
              <FaUser className={iconStyles} />
              <input 
                className={inputStyles} 
                value={form.name} 
                onChange={(e) => update('name', e.target.value)} 
                placeholder="John Doe" 
                disabled={step > 1}
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className={labelStyles}>Email Address</label>
            <div className="relative">
              <FaEnvelope className={iconStyles} />
              <input 
                className={inputStyles} 
                type="email" 
                value={form.email} 
                onChange={(e) => update('email', e.target.value)} 
                placeholder="john@example.com" 
                disabled={step > 1}
              />
            </div>
          </div>

          {/* OTP Input (Only shows on Step 3) */}
          {step === 3 && (
            <div className="animate-fade-in-up">
              <label className={labelStyles}>One-Time Password (OTP)</label>
              <div className="relative">
                <FaLock className={iconStyles} />
                <input 
                  className={`${inputStyles} tracking-widest text-center font-mono text-lg`} 
                  value={form.otp} 
                  onChange={(e) => update('otp', e.target.value)} 
                  placeholder="• • • • • •" 
                  maxLength={6}
                  autoFocus
                />
              </div>
            </div>
          )}

        </div>

        {/* Dynamic Submit Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          {step === 1 && (
            <button className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70" disabled={loading} onClick={verifyUser}>
              {loading ? <><FaSpinner className="animate-spin text-lg" /> Checking...</> : 'Check User'}
            </button>
          )}

          {step === 2 && (
            <button className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70" disabled={loading} onClick={requestOtp}>
              {loading ? <><FaSpinner className="animate-spin text-lg" /> Sending OTP...</> : <><FaEnvelope /> Send OTP</>}
            </button>
          )}

          {step === 3 && (
            <button className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70" disabled={loading} onClick={handleVerifyOtp}>
              {loading ? <><FaSpinner className="animate-spin text-lg" /> Verifying...</> : <>Verify & Login <FaArrowRight /></>}
            </button>
          )}
        </div>
        
        {/* Sign up prompt */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
            Sign up now
          </Link>
        </div>

      </div>
    </div>
  );
}