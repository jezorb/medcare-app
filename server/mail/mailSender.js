
import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: { user, pass },
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  const from = process.env.MAIL_USER;

  if (!transporter || !from) {
    console.warn(`MAIL_USER/MAIL_PASS missing. Email skipped for ${to}. Subject: ${subject}`);
    return false;
  }

  await transporter.sendMail({ from, to, subject, text, html });
  return true;
};

const sendOtpEmail = async (email, name) => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  await sendEmail({
    to: email,
    subject: "CareFlow Email Verification OTP",
    text: `Dear ${name},

Your verification OTP is ${otp}. It is valid for 5 minutes.

If you did not request this code, you can ignore this email.

Regards,
CareFlow Team`,
  });

  return otp;
};

export const sendPrescriptionEmail = async ({
  to,
  patientName,
  doctorName,
  appointmentDate,
  diagnosis,
  medicines = [],
  labTests = [],
  followUpDate,
  doctorNotes,
}) => {
  const formattedAppointmentDate = appointmentDate
    ? new Date(appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Not available";
  const formattedFollowUpDate = followUpDate
    ? new Date(followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Not scheduled";

  const medicineLines = medicines.length
    ? medicines
        .map((medicine, index) => {
          const name = medicine?.medicineName || medicine?.name || `Medicine ${index + 1}`;
          return `${index + 1}. ${name} | Dosage: ${medicine?.dosage || "As prescribed"} | Frequency: ${medicine?.frequency || "As directed"} | Duration: ${medicine?.duration || "As prescribed"}${medicine?.instructions ? ` | Instructions: ${medicine.instructions}` : ""}`;
        })
        .join("\n")
    : "No medicines added.";

  const labTestLines = labTests.length ? labTests.map((test, index) => `${index + 1}. ${test}`).join("\n") : "No lab tests added.";

  return sendEmail({
    to,
    subject: "CareFlow Prescription Summary",
    text: `Dear ${patientName || "Patient"},

Your prescription is now available for the consultation on ${formattedAppointmentDate}.

Doctor: ${doctorName || "Doctor"}
Diagnosis: ${diagnosis || "Not added"}

Medicines:
${medicineLines}

Lab tests:
${labTestLines}

Follow-up date: ${formattedFollowUpDate}
Doctor notes: ${doctorNotes || "No extra notes"}

Please log in to CareFlow to view the full prescription details.

Regards,
CareFlow Team`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Prescription Summary</h2>
        <p>Dear ${patientName || "Patient"},</p>
        <p>Your prescription is now available for the consultation on <strong>${formattedAppointmentDate}</strong>.</p>
        <p><strong>Doctor:</strong> ${doctorName || "Doctor"}<br/>
        <strong>Diagnosis:</strong> ${diagnosis || "Not added"}<br/>
        <strong>Follow-up date:</strong> ${formattedFollowUpDate}</p>
        <h3 style="margin-top: 20px;">Medicines</h3>
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${medicineLines}</pre>
        <h3>Lab tests</h3>
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${labTestLines}</pre>
        <h3>Doctor notes</h3>
        <p>${doctorNotes || "No extra notes"}</p>
        <p>Please log in to CareFlow to view the full prescription details.</p>
      </div>
    `,
  });
};

export default sendOtpEmail;
