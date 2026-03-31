import crypto from 'crypto';
import express from 'express';
import mailSender from '../mail/mailSender.js';
import Patient from '../models/Patient.model.js';
import Doctor from '../models/Doctor.model.js';
import Otp from '../models/Otp.model.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';

const router = express.Router();
const OTP_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const normalizeEmail = (email = '') => email.toLowerCase().trim();
const normalizeName = (name = '') => name.trim().replace(/\s+/g, ' ').toLowerCase();
const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const findExistingUserByRole = async ({ role, email, name }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = normalizeName(name);

  if (role === 'patient') {
    const patient = await Patient.findOne({ 'contactInfo.email': normalizedEmail, isDeleted: false, status: 'Active' }).select('name contactInfo.email');
    if (!patient || normalizeName(patient.name) !== normalizedName) return null;
    return { role, id: patient._id, name: patient.name, email: patient.contactInfo?.email };
  }

  if (role === 'doctor') {
    const doctor = await Doctor.findOne({ 'contactInfo.email': normalizedEmail, isDeleted: false, status: 'Active' }).select('personalInfo.name contactInfo.email');
    if (!doctor || normalizeName(doctor.personalInfo?.name) !== normalizedName) return null;
    return { role, id: doctor._id, name: doctor.personalInfo?.name, email: doctor.contactInfo?.email };
  }

  return null;
};

router.post('/check-user', async (req, res, next) => {
  try {
    const { email, name, role } = req.body;
    if (!email || !name || !role) {
      return res.status(400).json({ success: false, message: 'Name, email and role are required' });
    }
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await findExistingUserByRole({ email, name, role });
    if (!user) {
      return res.status(404).json({ success: false, message: `${role === 'patient' ? 'Patient' : 'Doctor'} does not exist. Please check name and email or complete signup first.` });
    }

    return res.status(200).json({ success: true, message: 'User verified successfully', data: user });
  } catch (error) {
    next(error);
  }
});

router.post('/send-otp', async (req, res, next) => {
  try {
    const { email, name, role } = req.body;
    if (!email || !name || !role) {
      return res.status(400).json({ success: false, message: 'Email, name and role are required' });
    }
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existingUser = await findExistingUserByRole({ email, name, role });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: `${role === 'patient' ? 'Patient' : 'Doctor'} does not exist. Please check name and email or complete signup first.` });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingEntry = await Otp.findOne({ email: normalizedEmail, role });
    if (existingEntry && Date.now() - new Date(existingEntry.lastSentAt).getTime() < RATE_LIMIT_MS) {
      return res.status(429).json({ success: false, message: 'Please wait before requesting another OTP' });
    }

    const otp = await mailSender(normalizedEmail, name.trim());
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, role },
      {
        email: normalizedEmail,
        role,
        name: normalizeName(name),
        otpHash: hashOtp(otp),
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({ success: true, message: 'OTP sent successfully', expiresInSeconds: OTP_TTL_MS / 1000 });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, otp, role, name } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const query = { email: normalizedEmail, ...(role ? { role } : {}) };
    const entries = await Otp.find(query).sort({ updatedAt: -1 });
    const entry = entries[0];

    if (!entry) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP' });
    }
    if (Date.now() > new Date(entry.expiresAt).getTime()) {
      await Otp.deleteOne({ _id: entry._id });
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new OTP' });
    }

    entry.attempts += 1;
    if (entry.attempts > MAX_ATTEMPTS) {
      await Otp.deleteOne({ _id: entry._id });
      return res.status(429).json({ success: false, message: 'Too many invalid attempts. Please request a new OTP' });
    }

    if (entry.otpHash !== hashOtp(String(otp).trim())) {
      await entry.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user = await findExistingUserByRole({ email: normalizedEmail, name: name || entry.name, role: entry.role });
    if (!user) {
      await Otp.deleteOne({ _id: entry._id });
      return res.status(404).json({ success: false, message: 'User no longer exists or details do not match' });
    }

    await Otp.deleteOne({ _id: entry._id });
    generateTokenAndSetCookie({ userId: user.id, role: user.role }, res);
    return res.status(200).json({ success: true, message: 'Email verified successfully', data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
