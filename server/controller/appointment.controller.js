import mongoose from "mongoose";
import Appointment from "../models/Appointment.model.js";
import Patient from "../models/Patient.model.js";
import Doctor from "../models/Doctor.model.js";
import { sendPrescriptionEmail } from "../mail/mailSender.js";
import asyncHandler from "../utils/asyncHandler.js";
import { badRequest, conflict, forbidden, notFound } from "../utils/httpError.js";
import { buildDateTime, getDayName, rangesOverlap, timeToMinutes } from "../utils/time.js";
import {
  scheduleZoomMeeting,
  updateZoomMeeting,
  deleteZoomMeeting,
} from "../utils/zoom.js";
import { canJoinMeeting } from "../utils/meetingAccess.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const populateAppointment = (query) =>
  query
    .populate({
      path: "patientInfo.patient",
      select: "name age illness condition contactInfo.email contactInfo.phone",
    })
    .populate({
      path: "doctorInfo.doctor",
      select:
        "personalInfo.name professionalInfo.specializations professionalInfo.consultationFees contactInfo.email contactInfo.clinicAddress availability",
    });

const validateAppointmentWindow = ({ appointmentDate, startTime, endTime }) => {
  if (!appointmentDate || !startTime || !endTime) {
    throw badRequest("Appointment date, start time and end time are required");
  }

  const start = buildDateTime(appointmentDate, startTime);
  const end = buildDateTime(appointmentDate, endTime);

  if (!start || !end) throw badRequest("Invalid appointment date or time");
  if (start >= end) throw badRequest("End time must be after start time");
  if (start.getTime() < Date.now()) {
    throw badRequest("Appointments can only be booked for a future date and time");
  }

  return { start, end };
};

const assertDoctorAvailability = (doctor, appointmentDate, startTime, endTime) => {
  const dayName = getDayName(appointmentDate);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const slot = (doctor.availability || []).find((entry) => entry.day === dayName);

  if (!slot) throw badRequest(`Doctor is not available on ${dayName}`);

  const availabilityStart = timeToMinutes(slot.startTime);
  const availabilityEnd = timeToMinutes(slot.endTime);

  if (availabilityStart === null || availabilityEnd === null) {
    throw badRequest("Doctor availability is misconfigured");
  }

  if (startMinutes < availabilityStart || endMinutes > availabilityEnd) {
    throw badRequest("Selected time is outside doctor availability");
  }
};

const assertNoOverlappingAppointment = async ({
  doctorId,
  appointmentDate,
  startTime,
  endTime,
  excludeAppointmentId = null,
}) => {
  const existingAppointments = await Appointment.find({
    ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {}),
    "doctorInfo.doctor": doctorId,
    "appointmentInfo.appointmentDate": new Date(appointmentDate),
    status: { $ne: "Cancelled" },
    isDeleted: false,
  }).select("appointmentInfo.startTime appointmentInfo.endTime");

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const overlapping = existingAppointments.some((existingAppointment) => {
    const existingStart = timeToMinutes(existingAppointment.appointmentInfo.startTime);
    const existingEnd = timeToMinutes(existingAppointment.appointmentInfo.endTime);
    return rangesOverlap(startMinutes, endMinutes, existingStart, existingEnd);
  });

  if (overlapping) {
    throw conflict("Doctor already has another appointment during this time");
  }
};

const assertAppointmentAccess = (reqUser, appointment) => {
  const patientId = String(appointment.patientInfo.patient?._id || appointment.patientInfo.patient);
  const doctorId = String(appointment.doctorInfo.doctor?._id || appointment.doctorInfo.doctor);

  if (reqUser.role === "patient" && reqUser.id !== patientId) {
    throw forbidden("You can only access your own appointments");
  }

  if (reqUser.role === "doctor" && reqUser.id !== doctorId) {
    throw forbidden("You can only access your own appointments");
  }
};

const buildMeetingTopic = ({ doctor, patient }) =>
  `Appointment: Dr. ${doctor?.personalInfo?.name || "Doctor"} with ${patient?.name || "Patient"}`;

const buildJoinAllowedIntoAppointment = (appointment) => {
  const plain = appointment.toObject ? appointment.toObject() : appointment;

  return {
    ...plain,
    joinAllowed:
      plain?.appointmentInfo?.appointmentType === "Online" &&
      plain?.meetingInfo?.status === "scheduled" &&
      !!plain?.meetingInfo?.joinUrl &&
      canJoinMeeting(
        plain.appointmentInfo.appointmentDate,
        plain.appointmentInfo.startTime,
        plain.appointmentInfo.endTime
      ),
  };
};

export const createAppointment = asyncHandler(async (req, res) => {
  const {
    appointmentDate,
    startTime,
    endTime,
    appointmentType,
    patientId,
    doctorId,
    reason,
    notes,
    amount,
    paymentMethod,
  } = req.body;

  if (!appointmentDate || !startTime || !endTime || !patientId || !doctorId || !reason) {
    throw badRequest("Required fields are missing");
  }

  if (!isValidObjectId(patientId) || !isValidObjectId(doctorId)) {
    throw badRequest("Invalid patient or doctor ID");
  }

  if (req.user.role !== "patient" || req.user.id !== String(patientId)) {
    throw forbidden("Patients can only create their own appointments");
  }

  validateAppointmentWindow({ appointmentDate, startTime, endTime });

  const [patient, doctor] = await Promise.all([
    Patient.findOne({ _id: patientId, isDeleted: false, status: "Active" })
      .select("_id doctorsEngaged name contactInfo.email"),
    Doctor.findOne({
      _id: doctorId,
      isDeleted: false,
      status: "Active",
      isVerified: true,
    }).select("_id personalInfo.name professionalInfo.consultationFees availability contactInfo.email"),
  ]);

  if (!patient) throw notFound("Active patient not found");
  if (!doctor) throw notFound("Verified active doctor not found");

  assertDoctorAvailability(doctor, appointmentDate, startTime, endTime);
  await assertNoOverlappingAppointment({ doctorId, appointmentDate, startTime, endTime });

  const finalAmount = Number(amount ?? doctor.professionalInfo?.consultationFees ?? 0);
  if (Number.isNaN(finalAmount) || finalAmount < 0) {
    throw badRequest("Invalid appointment amount");
  }

  let meetingInfo = {
    provider: null,
    meetingId: null,
    joinUrl: null,
    startUrl: null,
    password: null,
    status: "not_required",
  };

  if (appointmentType === "Online") {
    try {
      const zoomMeeting = await scheduleZoomMeeting({
        topic: buildMeetingTopic({ doctor, patient }),
        appointmentDate,
        startTime,
        endTime,
      });

      meetingInfo = {
        provider: "zoom",
        meetingId: zoomMeeting.meetingId,
        joinUrl: zoomMeeting.joinUrl,
        startUrl: zoomMeeting.startUrl,
        password: zoomMeeting.password,
        status: "scheduled",
      };
    } catch (error) {
      throw badRequest(`Zoom meeting schedule nahi ho payi: ${error.message}`);
    }
  }

  const appointment = await Appointment.create({
    appointmentInfo: {
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      appointmentType,
    },
    patientInfo: { patient: patientId },
    doctorInfo: { doctor: doctorId },
    consultationDetails: {
      reason: String(reason).trim(),
      notes: notes ? String(notes).trim() : "",
    },
    paymentInfo: {
      amount: finalAmount,
      paymentMethod,
      paymentStatus: "Pending",
    },
    meetingInfo,
  });

  if (!patient.doctorsEngaged?.some((id) => String(id) === String(doctorId))) {
    patient.doctorsEngaged.push(doctorId);
    await patient.save();
  }

  const hydratedAppointment = await populateAppointment(Appointment.findById(appointment._id));

  res.status(201).json({
    success: true,
    message: "Appointment created successfully",
    data: buildJoinAllowedIntoAppointment(hydratedAppointment),
  });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  if (!isValidObjectId(appointmentId)) throw badRequest("Invalid appointment ID");

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment || appointment.isDeleted) throw notFound("Appointment not found");
  assertAppointmentAccess(req.user, appointment);

  if (appointment.status === "Cancelled" || appointment.status === "Completed") {
    throw badRequest(`Cannot update a ${appointment.status.toLowerCase()} appointment`);
  }

  const {
    appointmentDate,
    startTime,
    endTime,
    appointmentType,
    patientId,
    doctorId,
    reason,
    notes,
    amount,
    paymentStatus,
    paymentMethod,
    status,
  } = req.body;

  if (patientId && (!isValidObjectId(patientId) || String(patientId) !== String(appointment.patientInfo.patient))) {
    throw forbidden("Patient cannot be changed for an appointment");
  }

  if (doctorId && !isValidObjectId(doctorId)) throw badRequest("Invalid doctor ID");

  if (
    doctorId &&
    req.user.role === "doctor" &&
    req.user.id !== String(doctorId) &&
    req.user.id !== String(appointment.doctorInfo.doctor)
  ) {
    throw forbidden("You cannot reassign this appointment to another doctor");
  }

  const nextAppointmentDate = appointmentDate || appointment.appointmentInfo.appointmentDate;
  const nextStartTime = startTime || appointment.appointmentInfo.startTime;
  const nextEndTime = endTime || appointment.appointmentInfo.endTime;
  const nextDoctorId = doctorId || appointment.doctorInfo.doctor;
  const nextAppointmentType = appointmentType || appointment.appointmentInfo.appointmentType;

  validateAppointmentWindow({
    appointmentDate: nextAppointmentDate,
    startTime: nextStartTime,
    endTime: nextEndTime,
  });

  const [doctor, patient] = await Promise.all([
    Doctor.findOne({
      _id: nextDoctorId,
      isDeleted: false,
      status: "Active",
      isVerified: true,
    }).select("_id personalInfo.name availability"),
    Patient.findById(appointment.patientInfo.patient).select("_id name"),
  ]);

  if (!doctor) throw notFound("Verified active doctor not found");

  assertDoctorAvailability(doctor, nextAppointmentDate, nextStartTime, nextEndTime);
  await assertNoOverlappingAppointment({
    doctorId: nextDoctorId,
    appointmentDate: nextAppointmentDate,
    startTime: nextStartTime,
    endTime: nextEndTime,
    excludeAppointmentId: appointmentId,
  });

  appointment.appointmentInfo.appointmentDate = new Date(nextAppointmentDate);
  appointment.appointmentInfo.startTime = nextStartTime;
  appointment.appointmentInfo.endTime = nextEndTime;
  appointment.appointmentInfo.appointmentType = nextAppointmentType;

  if (doctorId) appointment.doctorInfo.doctor = doctorId;
  if (reason) appointment.consultationDetails.reason = String(reason).trim();
  if (notes !== undefined) appointment.consultationDetails.notes = String(notes).trim();
  if (amount !== undefined) {
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      throw badRequest("Invalid appointment amount");
    }
    appointment.paymentInfo.amount = parsedAmount;
  }
  if (paymentStatus) appointment.paymentInfo.paymentStatus = paymentStatus;
  if (paymentMethod) appointment.paymentInfo.paymentMethod = paymentMethod;
  if (status) appointment.status = status;

  const existingMeetingId = appointment.meetingInfo?.meetingId;

  if (nextAppointmentType === "Online") {
    try {
      if (existingMeetingId) {
        await updateZoomMeeting({
          meetingId: existingMeetingId,
          topic: buildMeetingTopic({ doctor, patient }),
          appointmentDate: nextAppointmentDate,
          startTime: nextStartTime,
          endTime: nextEndTime,
        });
      } else {
        const zoomMeeting = await scheduleZoomMeeting({
          topic: buildMeetingTopic({ doctor, patient }),
          appointmentDate: nextAppointmentDate,
          startTime: nextStartTime,
          endTime: nextEndTime,
        });

        appointment.meetingInfo = {
          provider: "zoom",
          meetingId: zoomMeeting.meetingId,
          joinUrl: zoomMeeting.joinUrl,
          startUrl: zoomMeeting.startUrl,
          password: zoomMeeting.password,
          status: "scheduled",
        };
      }
    } catch (error) {
      throw badRequest(`Zoom meeting update nahi ho payi: ${error.message}`);
    }
  } else if (existingMeetingId) {
    try {
      await deleteZoomMeeting(existingMeetingId);
    } catch (error) {
      console.error("Zoom delete error during type change:", error.message);
    }

    appointment.meetingInfo = {
      provider: null,
      meetingId: null,
      joinUrl: null,
      startUrl: null,
      password: null,
      status: "not_required",
    };
  }

  await appointment.save();

  const hydratedAppointment = await populateAppointment(Appointment.findById(appointmentId));

  res.status(200).json({
    success: true,
    message: "Appointment updated successfully",
    data: buildJoinAllowedIntoAppointment(hydratedAppointment),
  });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  if (!isValidObjectId(appointmentId)) throw badRequest("Invalid appointment ID");

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment || appointment.isDeleted) throw notFound("Appointment not found");
  assertAppointmentAccess(req.user, appointment);

  if (appointment.status === "Cancelled") throw badRequest("Appointment is already cancelled");

  const meetingId = appointment.meetingInfo?.meetingId;

  if (meetingId) {
    try {
      await deleteZoomMeeting(meetingId);
    } catch (error) {
      console.error("Zoom cancel error:", error.message);
    }
  }

  appointment.status = "Cancelled";
  appointment.cancellationInfo = {
    cancelledBy: req.user.role === "patient" ? "Patient" : "Doctor",
    cancellationReason: req.body?.cancellationReason || "Cancelled by user",
    cancelledAt: new Date(),
  };

  appointment.meetingInfo = {
    provider: null,
    meetingId: null,
    joinUrl: null,
    startUrl: null,
    password: null,
    status: "not_required",
  };

  await appointment.save();

  const hydratedAppointment = await populateAppointment(Appointment.findById(appointmentId));

  res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully",
    data: buildJoinAllowedIntoAppointment(hydratedAppointment),
  });
});

export const addPrescription = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { diagnosis, medicines = [], labTests = [], followUpDate, doctorNotes } = req.body;

  if (!isValidObjectId(appointmentId)) throw badRequest("Invalid appointment ID");

  const appointment = await populateAppointment(Appointment.findById(appointmentId));
  if (!appointment || appointment.isDeleted) throw notFound("Appointment not found");

  assertAppointmentAccess(req.user, appointment);

  if (req.user.role !== "doctor") throw forbidden("Only doctors can add prescriptions");
  if (appointment.status === "Cancelled") {
    throw badRequest("Cannot add prescription to a cancelled appointment");
  }
  if (!diagnosis?.trim()) throw badRequest("Diagnosis is required");

  const appointmentEnd = buildDateTime(
    appointment.appointmentInfo.appointmentDate,
    appointment.appointmentInfo.endTime
  );

  if (!appointmentEnd || appointmentEnd.getTime() > Date.now()) {
    throw badRequest("Prescription can only be added after the appointment time is over");
  }

  if (followUpDate) {
    const parsedFollowUp = new Date(followUpDate);
    if (Number.isNaN(parsedFollowUp.getTime())) throw badRequest("Invalid follow-up date");
    if (parsedFollowUp <= new Date(appointment.appointmentInfo.appointmentDate)) {
      throw badRequest("Follow-up date must be after the appointment date");
    }
  }

  appointment.prescriptionInfo = {
    diagnosis: diagnosis.trim(),
    medicines,
    labTests,
    followUpDate: followUpDate || undefined,
    doctorNotes,
    prescribedAt: new Date(),
  };

  appointment.status = "Completed";
  await appointment.save();

  const refreshed = await populateAppointment(Appointment.findById(appointmentId));

  try {
    const patientEmail = refreshed.patientInfo?.patient?.contactInfo?.email;
    if (patientEmail) {
      await sendPrescriptionEmail({
        to: patientEmail,
        patientName: refreshed.patientInfo?.patient?.name,
        doctorName: refreshed.doctorInfo?.doctor?.personalInfo?.name,
        appointmentDate: refreshed.appointmentInfo?.appointmentDate,
        diagnosis: refreshed.prescriptionInfo?.diagnosis,
        medicines: refreshed.prescriptionInfo?.medicines || [],
        labTests: refreshed.prescriptionInfo?.labTests || [],
        followUpDate: refreshed.prescriptionInfo?.followUpDate,
        doctorNotes: refreshed.prescriptionInfo?.doctorNotes,
      });
    }
  } catch (mailError) {
    console.error("Prescription email error:", mailError);
  }

  res.status(200).json({
    success: true,
    message: "Prescription added successfully and patient notified by email",
    data: buildJoinAllowedIntoAppointment(refreshed),
  });
});

export const getAppointmentBasicData = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  if (!isValidObjectId(appointmentId)) throw badRequest("Invalid appointment ID");

  const appointment = await populateAppointment(
    Appointment.findOne({ _id: appointmentId, isDeleted: false }).select(
      "appointmentInfo status paymentInfo patientInfo.patient doctorInfo.doctor consultationDetails prescriptionInfo meetingInfo"
    )
  );

  if (!appointment) throw notFound("Appointment not found");
  assertAppointmentAccess(req.user, appointment);

  res.status(200).json({
    success: true,
    data: buildJoinAllowedIntoAppointment(appointment),
  });
});

export const getAppointmentsByPatientId = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  if (!isValidObjectId(patientId)) throw badRequest("Invalid patient ID");

  if (req.user.role !== "patient" || req.user.id !== patientId) {
    throw forbidden("You can only access your own appointments");
  }

  const appointments = await populateAppointment(
    Appointment.find({ "patientInfo.patient": patientId, isDeleted: false }).sort({
      "appointmentInfo.appointmentDate": -1,
      "appointmentInfo.startTime": -1,
    })
  );

  const formattedAppointments = appointments.map(buildJoinAllowedIntoAppointment);

  res.status(200).json({
    success: true,
    count: formattedAppointments.length,
    data: formattedAppointments,
  });
});

export const getAppointmentsByDoctorId = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  if (!isValidObjectId(doctorId)) throw badRequest("Invalid doctor ID");

  if (req.user.role !== "doctor" || req.user.id !== doctorId) {
    throw forbidden("You can only access your own appointments");
  }

  const appointments = await populateAppointment(
    Appointment.find({ "doctorInfo.doctor": doctorId, isDeleted: false }).sort({
      "appointmentInfo.appointmentDate": -1,
      "appointmentInfo.startTime": -1,
    })
  );

  const formattedAppointments = appointments.map(buildJoinAllowedIntoAppointment);

  res.status(200).json({
    success: true,
    count: formattedAppointments.length,
    data: formattedAppointments,
  });
});