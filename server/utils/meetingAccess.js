export const canJoinMeeting = (appointmentDate, startTime, endTime) => {
  const now = new Date();

  const dateOnly = new Date(appointmentDate);
  const yyyy = dateOnly.getFullYear();
  const mm = String(dateOnly.getMonth() + 1).padStart(2, "0");
  const dd = String(dateOnly.getDate()).padStart(2, "0");

  const start = new Date(`${yyyy}-${mm}-${dd}T${startTime}:00`);
  const end = new Date(`${yyyy}-${mm}-${dd}T${endTime}:00`);

  return now >= start && now <= end;
};