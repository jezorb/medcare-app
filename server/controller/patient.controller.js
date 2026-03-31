import mongoose from 'mongoose';
import Patient from '../models/Patient.model.js';
import Doctor from '../models/Doctor.model.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';
import asyncHandler from '../utils/asyncHandler.js';
import { badRequest, conflict, notFound, forbidden } from '../utils/httpError.js';

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const normalizeEmail = (email = '') => email.toLowerCase().trim();

export const createPatient = asyncHandler(async (req, res) => {
  const { name, age, sex, bloodGroup, height, weight, contactInfo, illness, condition, medicalHistory, doctorsEngaged } = req.body;

  if (!name || !age || !sex || !contactInfo?.phone || !contactInfo?.email || !contactInfo?.address || !illness) {
    throw badRequest('Missing required patient fields');
  }

  const patient = await Patient.create({
    name: String(name).trim(),
    age: Number(age),
    sex,
    bloodGroup: bloodGroup || undefined,
    height: height ? Number(height) : undefined,
    weight: weight ? Number(weight) : undefined,
    contactInfo: {
      ...contactInfo,
      email: normalizeEmail(contactInfo.email),
    },
    illness: String(illness).trim(),
    condition: condition || 'Stable',
    medicalHistory,
    doctorsEngaged,
  });

  generateTokenAndSetCookie({ userId: patient._id, role: 'patient' }, res);
  res.status(201).json({ success: true, data: patient });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) throw badRequest('Invalid patient ID');
  if (req.user.role !== 'patient' || req.user.id !== id) throw forbidden('You can only update your own patient profile');

  const patient = await Patient.findOne({ _id: id, isDeleted: false });
  if (!patient) throw notFound('Patient not found');

  const allowedFields = ['name', 'age', 'sex', 'bloodGroup', 'height', 'weight', 'illness', 'condition', 'medicalHistory'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      patient[field] = req.body[field];
    }
  }

  if (req.body.contactInfo) {
    patient.contactInfo = {
      ...patient.contactInfo,
      ...req.body.contactInfo,
      ...(req.body.contactInfo.email ? { email: normalizeEmail(req.body.contactInfo.email) } : {}),
    };
  }

  await patient.save();
  res.status(200).json({ success: true, data: patient });
});

export const deletePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) throw badRequest('Invalid patient ID');
  if (req.user.role !== 'patient' || req.user.id !== id) throw forbidden('You can only delete your own patient profile');

  const patient = await Patient.findOne({ _id: id, isDeleted: false });
  if (!patient) throw notFound('Patient not found');

  patient.isDeleted = true;
  patient.status = 'Inactive';
  await patient.save();

  res.clearCookie('jwt');
  res.status(200).json({ success: true, message: 'Patient deleted successfully' });
});

export const getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) throw badRequest('Invalid patient ID');
  if (req.user.role !== 'patient' || req.user.id !== id) throw forbidden('You can only access your own patient profile');

  const patient = await Patient.findOne({ _id: id, isDeleted: false });
  if (!patient) throw notFound('Patient not found');

  res.status(200).json({ success: true, data: patient });
});

export const getPatientEngagedDoctors = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  if (!validateObjectId(patientId)) throw badRequest('Invalid patient ID');
  if (req.user.role !== 'patient' || req.user.id !== patientId) throw forbidden('You can only access your own engaged doctors');

  const patient = await Patient.findOne({ _id: patientId, isDeleted: false, status: 'Active' })
    .populate({
      path: 'doctorsEngaged',
      match: { isDeleted: false, status: 'Active' },
      select: 'personalInfo.name personalInfo.profileImage contactInfo.clinicAddress professionalInfo.specializations professionalInfo.experienceYears professionalInfo.consultationFees ratingInfo.averageRating ratingInfo.totalReviews',
    })
    .lean();

  if (!patient) throw notFound('Patient not found');

  const doctors = (patient.doctorsEngaged || []).map((doctor) => ({
    id: doctor._id,
    name: doctor.personalInfo?.name,
    profileImage: doctor.personalInfo?.profileImage,
    specialization: doctor.professionalInfo?.specializations,
    experienceYears: doctor.professionalInfo?.experienceYears,
    consultationFees: doctor.professionalInfo?.consultationFees,
    clinicAddress: doctor.contactInfo?.clinicAddress,
    rating: doctor.ratingInfo?.averageRating,
    totalReviews: doctor.ratingInfo?.totalReviews,
  }));

  res.status(200).json({ success: true, totalDoctors: doctors.length, doctors });
});

export const getPatientBasicInfo = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  if (!validateObjectId(patientId)) throw badRequest('Invalid patient ID');
  if (req.user.role !== 'patient' || req.user.id !== patientId) throw forbidden('You can only access your own patient info');

  const patient = await Patient.findOne({ _id: patientId, isDeleted: false })
    .select('name age sex bloodGroup height weight illness condition contactInfo.phone contactInfo.email')
    .lean();

  if (!patient) throw notFound('Patient not found');
  res.status(200).json({ success: true, patient });
});

export const getPatientByEmail = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.params.email);
  if (!email) throw badRequest('Email is required');

  const patient = await Patient.findOne({ 'contactInfo.email': email, isDeleted: false })
    .select('name age sex bloodGroup illness condition contactInfo.phone contactInfo.email')
    .lean();

  if (!patient) throw notFound('Patient not found');

  generateTokenAndSetCookie({ userId: patient._id, role: 'patient' }, res);
  res.status(200).json({ success: true, message: 'Patient fetched successfully', patient });
});

export const addDoctorToPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { doctorId } = req.body;

  if (!validateObjectId(patientId) || !validateObjectId(doctorId)) {
    throw badRequest('Invalid patient or doctor ID');
  }
  if (req.user.role !== 'patient' || req.user.id !== patientId) throw forbidden('You can only manage your own engaged doctors');

  const [patient, doctor] = await Promise.all([
    Patient.findOne({ _id: patientId, isDeleted: false, status: 'Active' }),
    Doctor.findOne({ _id: doctorId, isDeleted: false, status: 'Active' }),
  ]);

  if (!patient) throw notFound('Patient not found');
  if (!doctor) throw notFound('Doctor not found');

  const updatedPatient = await Patient.findByIdAndUpdate(
    patientId,
    { $addToSet: { doctorsEngaged: doctorId } },
    { new: true },
  )
    .select('name doctorsEngaged')
    .populate({ path: 'doctorsEngaged', select: 'personalInfo.name professionalInfo.specializations professionalInfo.experienceYears' });

  res.status(200).json({ success: true, message: 'Doctor successfully engaged with patient', patient: updatedPatient });
});
