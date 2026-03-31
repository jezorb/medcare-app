import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentInfo: {
      appointmentDate: {
        type: Date,
        required: true,
      },
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      appointmentType: {
        type: String,
        enum: ["Online", "Offline"],
        default: "Offline",
      },
    },

    patientInfo: {
      patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
      },
    },

    doctorInfo: {
      doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
      },
    },

    consultationDetails: {
      reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },
      notes: {
        type: String,
        maxlength: 1000,
      },
    },

    paymentInfo: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Refunded"],
        default: "Pending",
      },
      paymentMethod: {
        type: String,
        enum: ["Cash", "Card", "UPI", "Online"],
      },
      transactionId: {
        type: String,
      },
    },

    meetingInfo: {
      provider: {
        type: String,
        default: null,
      },
      meetingId: {
        type: String,
        default: null,
      },
      joinUrl: {
        type: String,
        default: null,
      },
      startUrl: {
        type: String,
        default: null,
      },
      password: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        enum: ["scheduled", "failed", "not_required"],
        default: "not_required",
      },
    },

    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled", "No-Show"],
      default: "Scheduled",
    },

    cancellationInfo: {
      cancelledBy: {
        type: String,
        enum: ["Patient", "Doctor", "Admin"],
      },
      cancellationReason: {
        type: String,
      },
      cancelledAt: {
        type: Date,
      },
    },

    // ✅ NEW: Prescription Section
    prescriptionInfo: {
      diagnosis: {
        type: String,
        trim: true,
      },

      medicines: [
        {
          medicineName: {
            type: String,
            trim: true,
          },
          dosage: {
            type: String,
          },
          frequency: {
            type: String,
          },
          duration: {
            type: String,
          },
          instructions: {
            type: String,
          },
        },
      ],

      labTests: [
        {
          type: String,
          trim: true,
        },
      ],

      followUpDate: {
        type: Date,
      },

      doctorNotes: {
        type: String,
        maxlength: 2000,
      },

      prescribedAt: {
        type: Date,
      },
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Indexes
appointmentSchema.index({ "patientInfo.patient": 1 });
appointmentSchema.index({ "doctorInfo.doctor": 1 });
appointmentSchema.index({ "appointmentInfo.appointmentDate": 1 });
appointmentSchema.index({ status: 1 });

// Prevent duplicate exact slot bookings among active appointments
appointmentSchema.index(
  {
    "doctorInfo.doctor": 1,
    "appointmentInfo.appointmentDate": 1,
    "appointmentInfo.startTime": 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      status: { $in: ["Scheduled", "Completed", "No-Show"] },
    },
  },
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;

/*

{
  "_id": "65f3b2c4e91a4d0012ab7890",

  "appointmentInfo": {
    "appointmentDate": "2026-03-10T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "10:30",
    "appointmentType": "Online"
  },

  "patientInfo": {
    "patient": "65f3a9d1e91a4d0012ab4567"
  },

  "doctorInfo": {
    "doctor": "65f3aa22e91a4d0012ab9876"
  },

  "consultationDetails": {
    "reason": "Fever and headache for the last 3 days",
    "notes": "Patient reports mild body pain and fatigue"
  },

  "paymentInfo": {
    "amount": 800,
    "paymentStatus": "Paid",
    "paymentMethod": "UPI",
    "transactionId": "TXN9827349823"
  },

  "meetingInfo": {
    "meetingLink": "https://meet.yourapp.com/room/abc123"
  },

  "status": "Scheduled",

  "cancellationInfo": {
    "cancelledBy": null,
    "cancellationReason": null,
    "cancelledAt": null
  },

  "isDeleted": false,

  "createdAt": "2026-02-26T09:15:22.000Z",
  "updatedAt": "2026-02-26T09:15:22.000Z"
}



"status": "Cancelled",
"cancellationInfo": {
  "cancelledBy": "Patient",
  "cancellationReason": "Feeling better now",
  "cancelledAt": "2026-03-09T18:30:00.000Z"
}


*/
