import { api } from './client';

export const getDoctors = () => api.get('/doctor/doctors').then((res) => res.data);
export const searchDoctors = (term) => api.get(`/doctor/search?term=${encodeURIComponent(term)}`).then((res) => res.data);
export const getDoctorById = (doctorId) => api.get(`/doctor/${doctorId}`).then((res) => res.data);
export const getDoctorReviews = (doctorId, params = '') => api.get(`/doctor/${doctorId}/reviews${params}`).then((res) => res.data);
export const addDoctorReview = (doctorId, payload) => api.post(`/doctor/${doctorId}/reviews`, payload).then((res) => res.data);
export const updateDoctor = (doctorId, payload) => api.patch(`/doctor/${doctorId}`, payload).then((res) => res.data);
export const deleteDoctor = (doctorId) => api.delete(`/doctor/${doctorId}`).then((res) => res.data);
