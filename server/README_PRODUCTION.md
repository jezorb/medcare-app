# CareFlow Backend - production-ready upgrade

## What was improved
- Role-aware JWT auth for patients and doctors
- Protected patient, doctor, and appointment routes
- DB-backed OTP storage with TTL and invalid-attempt limits
- Doctor availability validation during booking and reschedule
- Overlapping appointment protection
- Prescription rules enforced:
  - only doctor can prescribe
  - only after appointment end time
  - follow-up must be after appointment date
- Basic rate limiting and security headers
- Centralized error handling and request logging
- Safer cookie settings for production

## Important environment variables
Copy `.env.example` to `.env` and fill real values.

## Recommended next production steps
- Add Redis-based distributed rate limiting
- Add admin module for doctor verification and moderation
- Add request schema validation library such as Zod/Joi
- Add unit/integration tests
- Add real meeting provider integration (Zoom/Google Meet)
- Add Docker/CI/CD pipeline
