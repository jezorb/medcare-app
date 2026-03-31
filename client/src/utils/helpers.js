export const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (value, time) => {
  if (!value) return '—';
  const date = formatDate(value);
  return time ? `${date} • ${time}` : date;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DR';

export const isMeetingJoinAllowed = (appointment) => Boolean(appointment?.meetingInfo?.joinAllowed);

export const appointmentStatusTone = (status) => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Cancelled':
      return 'error';
    default:
      return 'info';
  }
};
