import { api } from './client';

export const createAppointment = (payload) => api.post('/appointment/create', payload).then((res) => res.data);
export const updateAppointment = (appointmentId, payload) => api.put(`/appointment/update/${appointmentId}`, payload).then((res) => res.data);
export const cancelAppointment = (appointmentId, payload) => api.patch(`/appointment/cancel/${appointmentId}`, payload).then((res) => res.data);
export const addPrescription = (appointmentId, payload) => api.post(`/appointment/prescription/${appointmentId}`, payload).then((res) => res.data);
export const getPatientAppointments = (patientId) => api.get(`/appointment/patient/${patientId}`).then((res) => res.data);
export const getDoctorAppointments = (doctorId) => api.get(`/appointment/doctor/${doctorId}`).then((res) => res.data);
export const getAppointment = (appointmentId) => api.get(`/appointment/${appointmentId}`).then((res) => res.data);
