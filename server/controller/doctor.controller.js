import mongoose from 'mongoose';
import Doctor from '../models/Doctor.model.js';
import Patient from '../models/Patient.model.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';
import asyncHandler from '../utils/asyncHandler.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const normalizeEmail = (email = '') => email.toLowerCase().trim();

export const createDoctor = asyncHandler(async (req, res) => {
  const { personalInfo, contactInfo, professionalInfo, qualifications, availability, achievements, bio } = req.body;

  if (!personalInfo?.name || !contactInfo?.phone || !contactInfo?.email || !contactInfo?.clinicAddress || !professionalInfo?.specializations?.length || professionalInfo?.consultationFees === undefined || professionalInfo?.experienceYears === undefined) {
    throw badRequest('Missing required doctor fields');
  }

  const doctor = await Doctor.create({
    personalInfo,
    contactInfo: { ...contactInfo, email: normalizeEmail(contactInfo.email) },
    professionalInfo,
    qualifications,
    availability,
    achievements,
    bio,
  });

  generateTokenAndSetCookie({ userId: doctor._id, role: 'doctor' }, res);
  res.status(201).json({ success: true, message: 'Doctor created successfully', data: doctor });
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) throw badRequest('Invalid doctor ID');
  if (req.user.role !== 'doctor' || req.user.id !== id) throw forbidden('You can only update your own doctor profile');

  const doctor = await Doctor.findOne({ _id: id, isDeleted: false });
  if (!doctor) throw notFound('Doctor not found');

  const allowedRootFields = ['bio', 'qualifications', 'availability', 'achievements'];
  for (const field of allowedRootFields) {
    if (req.body[field] !== undefined) doctor[field] = req.body[field];
  }

  if (req.body.personalInfo) {
    doctor.personalInfo = { ...doctor.personalInfo, ...req.body.personalInfo };
  }
  if (req.body.contactInfo) {
    doctor.contactInfo = {
      ...doctor.contactInfo,
      ...req.body.contactInfo,
      ...(req.body.contactInfo.email ? { email: normalizeEmail(req.body.contactInfo.email) } : {}),
    };
  }
  if (req.body.professionalInfo) {
    doctor.professionalInfo = { ...doctor.professionalInfo, ...req.body.professionalInfo };
  }

  await doctor.save();
  res.status(200).json({ success: true, data: doctor });
});

export const getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) throw badRequest('Invalid doctor ID');

  const doctor = await Doctor.findOne({ _id: id, isDeleted: false });
  if (!doctor) throw notFound('Doctor not found');

  res.status(200).json({ success: true, data: doctor });
});

export const getAllDoctorsBasic = asyncHandler(async (_req, res) => {
  const doctors = await Doctor.find({ isDeleted: false, status: 'Active', isVerified: true })
    .select('_id personalInfo.name personalInfo.profileImage professionalInfo.specializations professionalInfo.experienceYears professionalInfo.consultationFees ratingInfo.averageRating ratingInfo.totalReviews')
    .sort({ 'ratingInfo.averageRating': -1, createdAt: -1 });

  res.status(200).json({ success: true, count: doctors.length, data: doctors });
});

export const searchDoctors = asyncHandler(async (req, res) => {
  const { term } = req.query;
  if (!term?.trim()) throw badRequest('Search term is required');

  const doctors = await Doctor.find({
    isDeleted: false,
    status: 'Active',
    isVerified: true,
    $or: [
      { 'personalInfo.name': { $regex: term, $options: 'i' } },
      { 'personalInfo.gender': { $regex: term, $options: 'i' } },
      { 'contactInfo.email': { $regex: term, $options: 'i' } },
      { 'contactInfo.phone': { $regex: term, $options: 'i' } },
      { 'contactInfo.clinicAddress': { $regex: term, $options: 'i' } },
      { 'professionalInfo.specializations': { $regex: term, $options: 'i' } },
      { bio: { $regex: term, $options: 'i' } },
      { 'achievements.title': { $regex: term, $options: 'i' } },
      { 'achievements.description': { $regex: term, $options: 'i' } },
    ],
  })
    .select('_id personalInfo.name personalInfo.profileImage professionalInfo.specializations professionalInfo.experienceYears professionalInfo.consultationFees ratingInfo.averageRating ratingInfo.totalReviews')
    .sort({ 'ratingInfo.averageRating': -1, createdAt: -1 });

  res.status(200).json({ success: true, total: doctors.length, data: doctors });
});

export const getDoctorByEmail = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.params.email);
  if (!email) throw badRequest('Email is required');

  const doctor = await Doctor.findOne({ 'contactInfo.email': email, isDeleted: false });
  if (!doctor) throw notFound('Doctor not found');

  generateTokenAndSetCookie({ userId: doctor._id, role: 'doctor' }, res);
  res.status(200).json({ success: true, data: doctor });
});

export const deleteDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) throw badRequest('Invalid doctor ID');
  if (req.user.role !== 'doctor' || req.user.id !== id) throw forbidden('You can only delete your own doctor profile');

  const doctor = await Doctor.findOne({ _id: id, isDeleted: false });
  if (!doctor) throw notFound('Doctor not found');

  doctor.isDeleted = true;
  doctor.status = 'Inactive';
  await doctor.save();

  res.clearCookie('jwt');
  res.status(200).json({ success: true, message: 'Doctor deleted successfully' });
});

export const addDoctorReview = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { reviewText, rating } = req.body;
  const patientId = req.user?.id;

  if (!validateObjectId(doctorId) || !validateObjectId(patientId)) {
    throw badRequest('Invalid doctor or patient ID');
  }
  if (req.user.role !== 'patient') throw forbidden('Only patients can add doctor reviews');
  if (!reviewText?.trim() || !rating) throw badRequest('Review text and rating are required');
  if (Number(rating) < 1 || Number(rating) > 5) throw badRequest('Rating must be between 1 and 5');

  const [doctor, patient] = await Promise.all([
    Doctor.findOne({ _id: doctorId, isDeleted: false, status: 'Active' }),
    Patient.findOne({ _id: patientId, isDeleted: false, status: 'Active' }),
  ]);

  if (!doctor) throw notFound('Doctor not found');
  if (!patient) throw notFound('Patient not found');

  const alreadyReviewed = doctor.reviews.some((review) => String(review.patient) === String(patientId));
  if (alreadyReviewed) throw badRequest('You have already reviewed this doctor');

  doctor.reviews.push({ reviewText: reviewText.trim(), rating: Number(rating), patient: patientId });
  const totalReviews = doctor.reviews.length;
  const totalRating = doctor.reviews.reduce((sum, review) => sum + review.rating, 0);
  doctor.ratingInfo.averageRating = Number((totalRating / totalReviews).toFixed(1));
  doctor.ratingInfo.totalReviews = totalReviews;
  await doctor.save();

  res.status(201).json({ success: true, message: 'Review added successfully', data: doctor.ratingInfo });
});

export const getDoctorReviews = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
  const sort = req.query.sort || 'latest';

  if (!validateObjectId(doctorId)) throw badRequest('Invalid doctor ID');

  const doctor = await Doctor.findOne({ _id: doctorId, isDeleted: false })
    .populate({ path: 'reviews.patient', select: 'name' })
    .lean();

  if (!doctor) throw notFound('Doctor not found');

  const reviews = [...(doctor.reviews || [])].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating;
    if (sort === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const startIndex = (page - 1) * limit;
  const paginatedReviews = reviews.slice(startIndex, startIndex + limit);

  res.status(200).json({
    success: true,
    page,
    limit,
    total: reviews.length,
    totalPages: Math.ceil(reviews.length / limit),
    data: paginatedReviews,
  });
});
