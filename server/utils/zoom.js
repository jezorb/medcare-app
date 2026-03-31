import axios from "axios";
import dotenv from "dotenv"

dotenv.config();

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET
const ZOOM_TIMEZONE = process.env.ZOOM_TIMEZONE

const validateZoomEnv = () => {
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom environment variables are missing");
  }
};

const getZoomAccessToken = async () => {
  validateZoomEnv();

  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`;

  const response = await axios.post(url, null, {
    auth: {
      username: ZOOM_CLIENT_ID,
      password: ZOOM_CLIENT_SECRET,
    },
    timeout: 15000,
  });

  return response.data.access_token;
};

const getDurationInMinutes = (startTime, endTime) => {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return end - start;
};

export const scheduleZoomMeeting = async ({
  topic,
  appointmentDate,
  startTime,
  endTime,
}) => {
  const token = await getZoomAccessToken();

  const payload = {
    topic,
    type: 2,
    start_time: `${appointmentDate}T${startTime}:00`,
    duration: getDurationInMinutes(startTime, endTime),
    timezone: ZOOM_TIMEZONE,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      waiting_room: true,
      approval_type: 2,
    },
  };

  const response = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  return {
    meetingId: String(response.data.id),
    joinUrl: response.data.join_url,
    startUrl: response.data.start_url,
    password: response.data.password || null,
    raw: response.data,
  };
};

export const updateZoomMeeting = async ({
  meetingId,
  topic,
  appointmentDate,
  startTime,
  endTime,
}) => {
  const token = await getZoomAccessToken();

  const payload = {
    topic,
    start_time: `${appointmentDate}T${startTime}:00`,
    duration: getDurationInMinutes(startTime, endTime),
    timezone: ZOOM_TIMEZONE,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      waiting_room: true,
      approval_type: 2,
    },
  };

  await axios.patch(`https://api.zoom.us/v2/meetings/${meetingId}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  return true;
};

export const deleteZoomMeeting = async (meetingId) => {
  const token = await getZoomAccessToken();

  await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 15000,
  });

  return true;
};