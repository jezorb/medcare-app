# MedCare Hub Frontend

A React frontend designed specifically for the uploaded Node/Express medical appointment server.

## What is already mapped to your backend

- Patient signup: `POST /patient/create`
- Doctor signup: `POST /doctor/create`
- OTP login flow:
  - `POST /email/check-user`
  - `POST /email/send-otp`
  - `POST /email/verify-email`
- Doctors listing and search:
  - `GET /doctor/doctors`
  - `GET /doctor/search?term=...`
  - `GET /doctor/:id`
  - `GET /doctor/:doctorId/reviews`
  - `POST /doctor/:doctorId/reviews`
- Patient features:
  - `GET /patient/:patientId/basic`
  - `GET /patient/:patientId/doctors`
  - `POST /patient/:patientId/doctors`
  - `PATCH /patient/:id`
  - `DELETE /patient/:id`
- Appointment features:
  - `POST /appointment/create`
  - `GET /appointment/patient/:patientId`
  - `GET /appointment/doctor/:doctorId`
  - `PATCH /appointment/cancel/:appointmentId`
  - `POST /appointment/prescription/:appointmentId`
- Doctor settings:
  - `PATCH /doctor/:id`
  - `DELETE /doctor/:id`

## Pages included

- Landing page
- OTP login page
- Patient/doctor signup page
- Doctors search page
- Doctor details page
- Patient dashboard
- Doctor dashboard
- Settings page

## Important backend note

Your backend uses cookie-based auth (`withCredentials: true`).
So make sure:

1. backend `CLIENT_URL` matches your frontend URL
2. frontend talks to the correct backend URL in `.env`
3. browser allows cookies for that backend

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Env

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Suggested next upgrades

- Add real toast notifications
- Add dedicated prescription modal instead of demo preset submit
- Add appointment reschedule modal wired to `PUT /appointment/update/:appointmentId`
- Add profile image support once backend accepts it again
- Add auth bootstrap endpoint on server for refresh-safe login restore
