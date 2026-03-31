import { api } from './client';

export const checkUser = (payload) => api.post('/email/check-user', payload).then((res) => res.data);
export const sendOtp = (payload) => api.post('/email/send-otp', payload).then((res) => res.data);
export const verifyOtp = (payload) => api.post('/email/verify-email', payload).then((res) => res.data);

export const loginPatientByEmail = (email) => api.get(`/patient/login/${email}`).then((res) => res.data);
export const loginDoctorByEmail = (email) => api.get(`/doctor/login/${email}`).then((res) => res.data);

export const createPatient = (payload) => api.post('/patient/create', payload).then((res) => res.data);
export const createDoctor = (payload) => api.post('/doctor/create', payload).then((res) => res.data);
