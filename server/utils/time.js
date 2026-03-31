export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const normalizeDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

export const isValidTimeFormat = (value = '') => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

export const timeToMinutes = (value = '') => {
  if (!isValidTimeFormat(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export const buildDateTime = (dateValue, timeValue) => {
  const baseDate = normalizeDate(dateValue);
  const minutes = timeToMinutes(timeValue);
  if (!baseDate || minutes === null) return null;
  const date = new Date(baseDate);
  date.setMinutes(minutes, 0, 0);
  return date;
};

export const getDayName = (dateValue) => {
  const date = normalizeDate(dateValue);
  if (!date) return null;
  return DAY_NAMES[date.getDay()];
};

export const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;
