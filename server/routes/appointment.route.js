import express from 'express';
import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  addPrescription,
  getAppointmentBasicData,
  getAppointmentsByPatientId,
  getAppointmentsByDoctorId,
} from '../controller/appointment.controller.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.use(protectRoute);
router.post('/create', createAppointment);
router.put('/update/:appointmentId', updateAppointment);
router.patch('/cancel/:appointmentId', cancelAppointment);
router.post('/prescription/:appointmentId', addPrescription);
router.get('/patient/:patientId', getAppointmentsByPatientId);
router.get('/doctor/:doctorId', getAppointmentsByDoctorId);
router.get('/:appointmentId', getAppointmentBasicData);

export default router;
