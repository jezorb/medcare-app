import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import patientRouter from './routes/patient.route.js';
import doctorRouter from './routes/doctor.route.js';
import verifyEmailRoute from './routes/mailVerify.route.js';
import appointmentRoute from './routes/appointment.route.js';
import ConnectionToDB from './database/db_connection.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import securityHeaders from './middleware/basicSecurity.js';
import { createRateLimiter } from './middleware/rateLimiter.js';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(requestLogger);
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 500, keyPrefix: 'api' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use('/patient', patientRouter);
app.use('/doctor', doctorRouter);
app.use('/email', createRateLimiter({ windowMs: 10 * 60 * 1000, maxRequests: 30, keyPrefix: 'otp' }), verifyEmailRoute);
app.use('/appointment', appointmentRoute);


app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await ConnectionToDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
