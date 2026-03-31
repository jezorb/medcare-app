import express from 'express';
import {
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorById,
  addDoctorReview,
  getDoctorReviews,
  getAllDoctorsBasic,
  searchDoctors,
  getDoctorByEmail,
} from '../controller/doctor.controller.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

router.post('/create', createDoctor);
router.get('/doctors', getAllDoctorsBasic);
router.get('/search', searchDoctors);
router.get('/login/:email', getDoctorByEmail);
router.post('/:doctorId/reviews', protectRoute, addDoctorReview);
router.get('/:doctorId/reviews', getDoctorReviews);
router.get('/:id', getDoctorById);
router.patch('/:id', protectRoute, updateDoctor);
router.delete('/:id', protectRoute, deleteDoctor);

export default router;
