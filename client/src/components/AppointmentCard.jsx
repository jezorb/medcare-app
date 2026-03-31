import { appointmentStatusTone, formatDateTime, isMeetingJoinAllowed } from '../utils/helpers';

export default function AppointmentCard({ appointment, onCancel, onComplete }) {
  const doctorName = appointment?.doctorInfo?.doctor?.personalInfo?.name;
  const patientName = appointment?.patientInfo?.patient?.name;
  const roleName = doctorName || patientName || 'Consultation';
  const tone = appointmentStatusTone(appointment?.status);
  const canJoin = isMeetingJoinAllowed(appointment);
  const joinUrl = appointment?.meetingInfo?.joinUrl;

  return (
    <div className="card appointment-card">
      <div className="split">
        <div>
          <h3 style={{ margin: '0 0 8px' }}>{roleName}</h3>
          <div className="muted">{appointment?.consultationDetails?.reason}</div>
        </div>
        <div className={`badge`} style={{ background: tone === 'success' ? '#edf9f1' : tone === 'error' ? '#fff0f0' : '#eff4ff' }}>
          {appointment?.status}
        </div>
      </div>
      <div style={{ height: 14 }} />
      <div className="info-row">
        <span>{formatDateTime(appointment?.appointmentInfo?.appointmentDate, appointment?.appointmentInfo?.startTime)}</span>
        <span>{appointment?.appointmentInfo?.appointmentType}</span>
      </div>
      <div className="info-row" style={{ marginTop: 8 }}>
        <span>Ends at {appointment?.appointmentInfo?.endTime}</span>
        <span>Payment: {appointment?.paymentInfo?.paymentStatus}</span>
      </div>
      {!!appointment?.prescriptionInfo?.diagnosis && (
        <div style={{ marginTop: 12 }} className="banner info">
          Prescription: {appointment.prescriptionInfo.diagnosis}
        </div>
      )}
      <div style={{ height: 16 }} />
      <div className="split">
        <div className="pills">
          {joinUrl ? (
            canJoin ? (
              <a className="btn btn-primary" href={joinUrl} target="_blank" rel="noreferrer">Join Meeting</a>
            ) : (
              <span className="pill">Link activates at appointment time</span>
            )
          ) : null}
        </div>
        <div className="pills">
          {onComplete ? <button className="btn btn-secondary" onClick={onComplete}>Add Prescription</button> : null}
          {onCancel && appointment?.status === 'Scheduled' ? <button className="btn btn-danger" onClick={onCancel}>Cancel</button> : null}
        </div>
      </div>
    </div>
  );
}
