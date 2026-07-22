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

## Deployment with Vercel

The project can run on Vercel as a static frontend plus NestJS API routes under `/api`.

1. Create a MongoDB Atlas database. Localhost MongoDB will not work in production.
2. In Vercel, set these environment variables:

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/my_show_time
JWT_SECRET=replace_with_a_long_private_secret
APP_URL=https://your-vercel-project.vercel.app
```

3. Use these Vercel project settings:

```text
Root Directory: my_show_time
Build Command: npm run build
Output Directory: public
```

4. Deploy and test the backend at:

```text
https://your-vercel-project.vercel.app/api/concerts
```

5. To seed the production database, temporarily put the Atlas `MONGODB_URI` in your local `.env`, then run:

```bash
npm run seed
```

If the frontend and backend are deployed on different domains, edit `public/config.js` and set:

```js
window.MY_SHOW_TIME_API_BASE_URL = 'https://your-backend-domain.com';
```

Leave it empty when frontend and backend are on the same Vercel domain.
## Backend on Render

This repository includes `render.yaml` for deploying the NestJS backend as a Render Web Service.

Render settings if you create the service manually:

```text
Name: my-show-time-api
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start:prod
Health Check Path: /api/health
```

Required Render environment variables:

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/my_show_time
JWT_SECRET=replace_with_a_long_private_secret
APP_URL=https://my-show-time-api.onrender.com
NODE_ENV=production
```

After Render deploys, test:

```text
https://my-show-time-api.onrender.com/api/health
https://my-show-time-api.onrender.com/api/concerts
```

The Vercel frontend is configured in `public/config.js` to call the Render backend at `https://my-show-time-api.onrender.com`.
If Render gives the service another URL, update that file and redeploy the frontend.