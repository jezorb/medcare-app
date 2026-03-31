import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },

    sex: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },

    height: {
      type: Number, // cm
      min: 30,
      max: 250,
    },

    weight: {
      type: Number, // kg
      min: 1,
      max: 300,
    },

    contactInfo: {
      phone: {
        type: String,
        required: true,
        unique: true,
        match: /^\+?[1-9]\d{9,14}$/,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^\S+@\S+\.\S+$/,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
    },

    illness: {
      type: String,
      required: true,
      trim: true,
    },

    condition: {
      type: String,
      enum: ["Stable", "Critical", "Recovering"],
      default: "Stable",
    },

    medicalHistory: [
      {
        diagnosis: String,
        treatment: String,
        notes: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    doctorsEngaged: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],

    status: {
      type: String,
      enum: ["Active",  "Inactive"],
      default: "Active",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

//Indexs
patientSchema.index({ name: 1 });
patientSchema.index({ status: 1 });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;

/*
{
  "_id": "67d1a7b9c5e3f21a8d912345",

  "name": "Rahul Sharma",
  "age": 34,
  "sex": "Male",
  "bloodGroup": "B+",
  "height": 172,
  "weight": 75,

  "contactInfo": {
    "phone": "+919876543210",
    "email": "rahul.sharma@email.com",
    "address": "Flat 12, MG Road, Nashik, Maharashtra, India"
  },

  "emergencyContact": {
    "name": "Anita Sharma",
    "relation": "Wife",
    "phone": "+919812345678"
  },

  "illness": "Type 2 Diabetes",

  "condition": "Stable",

  "medicalHistory": [
    {
      "_id": "67d1a7b9c5e3f21a8d900001",
      "diagnosis": "High Blood Sugar",
      "treatment": "Metformin 500mg daily",
      "prescriptionId": "67d1b0c4e9a2f45d8c001234",
      "notes": "Advised low-carb diet and exercise",
      "doctor": "67cfa9c8e2f45a12d9c81234",
      "date": "2026-01-10T09:30:00.000Z"
    }
  ],

  "doctorsEngaged": [
    "67cfa9c8e2f45a12d9c81234",
    "67cfa9c8e2f45a12d9c85678"
  ],

  "status": "Active",
  "isDeleted": false,

  "createdBy": "67cf1111e2f45a12d9c80001",
  "updatedBy": "67cf1111e2f45a12d9c80001",

  "createdAt": "2026-02-25T08:15:00.000Z",
  "updatedAt": "2026-02-25T10:40:00.000Z"
}

*/
