# MyShowTime

MyShowTime is a concert and festival ticket booking website built with **NestJS** and **MongoDB**.

## Features

- Public concert listing with filters by genre, date and group
- Register and login with JWT
- User profile update, including email and password
- Favorite bands list
- Notifications when a favorite band is scheduled
- Ticket booking with QR code generation
- Admin backoffice for users, concerts and booking statistics

## Requirements

- Node.js
- MongoDB running locally or a MongoDB Atlas URI

## Installation

```bash
npm.cmd install
copy .env.example .env
npm.cmd run seed
npm.cmd run start:dev
```

Open the URL configured in `.env`. In this workspace I used `http://localhost:3001` because port `3000` was already occupied.

## Frontoffice / Backoffice Pages

- `/` concert catalog and filters
- `/login.html` login and register
- `/bookings.html` user bookings and QR codes
- `/profile.html` profile, favorite bands and notifications
- `/admin.html` administrator dashboard

## Seeded Accounts

- Admin: `admin@myshowtime.local` / `admin123`
- User: `user@myshowtime.local` / `user123`

## Main API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/concerts`
- `POST /api/bookings`
- `GET /api/bookings/me`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `PATCH /api/users/me/favorites`
- `GET /api/notifications/me`
- `GET /api/stats/bookings` admin only
