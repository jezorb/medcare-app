import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    personalInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
      },
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

      clinicAddress: {
        type: String,
        required: true,
        trim: true,
      },
    },

    professionalInfo: {
      specializations: [
        {
          type: String,
          required: true,
          trim: true,
        },
      ],

      experienceYears: {
        type: Number,
        required: true,
        min: 0,
        max: 60,
      },

      consultationFees: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
      },
    ],

    availability: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        startTime: String,
        endTime: String,
      },
    ],

    bio: {
      type: String,
      maxlength: 1000,
    },

    achievements: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },

        description: {
          type: String,
          trim: true,
          maxlength: 1000,
        },

        year: {
          type: Number,
          min: 1950,
          max: new Date().getFullYear(),
        },
      },
    ],

    reviews: [
      {
        reviewText: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000,
        },

        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },

        patient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Patient",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    ratingInfo: {
      averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },

      totalReviews: {
        type: Number,
        default: 0,
      },
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    isVerified: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Indexes for performance
doctorSchema.index({ "professionalInfo.specializations": 1 });
doctorSchema.index({ "ratingInfo.averageRating": -1 });

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;

/*

{
  "_id": "67d2c9f8a7e45b21c8912345",

  "personalInfo": {
    "name": "Dr. Amit Deshmukh",
    "gender": "Male",
    "profileImage": "https://cloudinary.com/images/dr-amit.jpg"
  },

  "contactInfo": {
    "phone": "+919876543210",
    "email": "dr.amit@email.com",
    "clinicAddress": "City Care Hospital, College Road, Nashik, Maharashtra"
  },

  "professionalInfo": {
    "specializations": [
      "Cardiology",
      "Internal Medicine",
      "Hypertension Specialist"
    ],
    "experienceYears": 14,
    "consultationFees": 900,
    "licenseNumber": "MH-MED-2012-7789"
  },

  "qualifications": [
    {
      "degree": "MBBS",
      "institution": "BJ Medical College, Pune",
      "year": 2008
    },
    {
      "degree": "MD Cardiology",
      "institution": "AIIMS, New Delhi",
      "year": 2012
    }
  ],

  "availability": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "13:00"
    },
    {
      "day": "Wednesday",
      "startTime": "16:00",
      "endTime": "20:00"
    }
  ],

  "bio": "Experienced cardiologist with 14+ years of clinical expertise in interventional cardiology and preventive heart care.",

  "achievements": [
    {
      "title": "Best Cardiologist Award",
      "description": "Recognized for excellence in cardiac surgery with 98% success rate.",
      "issuedBy": "Indian Medical Association",
      "year": 2023
    },
    {
      "title": "International Research Publication",
      "description": "Published research on advanced heart failure management.",
      "issuedBy": "Global Cardiac Journal",
      "year": 2021
    }
  ],

  "reviews": [
    {
      "_id": "67d2c9f8a7e45b21c890001",
      "reviewText": "Very professional and explains everything clearly. Highly recommended!",
      "rating": 5,
      "patient": "67d1a7b9c5e3f21a8d912345",
      "createdAt": "2026-02-20T10:15:00.000Z"
    },
    {
      "_id": "67d2c9f8a7e45b21c890002",
      "reviewText": "Good doctor but waiting time was slightly long.",
      "rating": 4,
      "patient": "67d1a7b9c5e3f21a8d955555",
      "createdAt": "2026-02-22T12:30:00.000Z"
    }
  ],

  "ratingInfo": {
    "averageRating": 4.5,
    "totalReviews": 2
  },

  "status": "Active",
  "isVerified": true,
  "isDeleted": false,

  "createdAt": "2026-02-15T08:00:00.000Z",
  "updatedAt": "2026-02-25T09:30:00.000Z"
}

*/
