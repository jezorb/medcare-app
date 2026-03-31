import express from 'express';
import {
  createPatient,
  updatePatient,
  deletePatient,
  getPatientById,
  getPatientBasicInfo,
  getPatientByEmail,
  getPatientEngagedDoctors,
  addDoctorToPatient,
} from '../controller/patient.controller.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.post('/create', createPatient);
router.get('/login/:email', getPatientByEmail);
router.get('/:patientId/doctors', protectRoute, getPatientEngagedDoctors);
router.post('/:patientId/doctors', protectRoute, addDoctorToPatient);
router.get('/:patientId/basic', protectRoute, getPatientBasicInfo);
router.get('/:id', protectRoute, getPatientById);
router.patch('/:id', protectRoute, updatePatient);
router.delete('/:id', protectRoute, deletePatient);

export default router;
