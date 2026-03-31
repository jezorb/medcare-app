import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    lastSentAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

otpSchema.index({ email: 1, role: 1 }, { unique: true });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
