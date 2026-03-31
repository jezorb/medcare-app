import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.model.js';
import Doctor from '../models/Doctor.model.js';
import { forbidden, unauthorized } from '../utils/httpError.js';
import asyncHandler from '../utils/asyncHandler.js';

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies?.jwt;
};

const loadAuthenticatedUser = async ({ userId, role }) => {
  if (role === 'patient') {
    const user = await Patient.findOne({ _id: userId, isDeleted: false }).select('-medicalHistory');
    return user ? { user, role } : null;
  }

  if (role === 'doctor') {
    const user = await Doctor.findOne({ _id: userId, isDeleted: false }).select('-reviews');
    return user ? { user, role } : null;
  }

  return null;
};

export const protectRoute = asyncHandler(async (req, _res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw unauthorized('Unauthorized - No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded?.userId || !decoded?.role) {
    throw unauthorized('Unauthorized - Invalid token');
  }

  const authUser = await loadAuthenticatedUser(decoded);
  if (!authUser) {
    throw unauthorized('Unauthorized - User not found');
  }

  req.user = {
    id: String(authUser.user._id),
    role: authUser.role,
    profile: authUser.user,
  };

  next();
});

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(forbidden('You do not have permission to access this resource'));
  }
  return next();
};

export const allowSelf = (paramKey, role) => (req, _res, next) => {
  if (!req.user) {
    return next(unauthorized('Unauthorized'));
  }

  if (req.user.role !== role) {
    return next(forbidden('You do not have permission to perform this action'));
  }

  if (String(req.params[paramKey]) !== String(req.user.id)) {
    return next(forbidden('You can only access your own resource'));
  }

  return next();
};

export default protectRoute;
