import { api } from './client';

export const getPatientById = (patientId) => api.get(`/patient/${patientId}`).then((res) => res.data);
export const getPatientBasic = (patientId) => api.get(`/patient/${patientId}/basic`).then((res) => res.data);
export const getPatientDoctors = (patientId) => api.get(`/patient/${patientId}/doctors`).then((res) => res.data);
export const engageDoctor = (patientId, doctorId) => api.post(`/patient/${patientId}/doctors`, { doctorId }).then((res) => res.data);
export const updatePatient = (patientId, payload) => api.patch(`/patient/${patientId}`, payload).then((res) => res.data);
export const deletePatient = (patientId) => api.delete(`/patient/${patientId}`).then((res) => res.data);
