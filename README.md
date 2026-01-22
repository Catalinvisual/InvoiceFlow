# SaaS Invoice Management Platform

## Overview
This is a full-stack MVP for an invoice management SaaS platform with automated payment tracking and reminders.

## Tech Stack
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **Frontend**: Next.js (React), Tailwind CSS, NextAuth.js
- **Services**: SendGrid (Email), pdf-lib (PDF Generation), node-cron (Scheduling)

## Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (for local database)
- PostgreSQL (if not using Docker)

## Setup Instructions

### 1. Database Setup
The application is configured to use a PostgreSQL database. You can either use the provided Docker Compose file or an existing PostgreSQL instance.

**Credentials:**
- Host: localhost
- Port: 5432
- User: devuser
- Password: devpass
- Database: devdb

**Option A: Using Docker (Recommended if port 5432 is free)**
```bash
docker-compose up -d
```

**Option B: Using Existing PostgreSQL**
Ensure your running instance matches the credentials above, or update `server/.env` with your correct connection string.

### 2. Backend Setup
```bash
cd server
npm install
npx prisma migrate dev --name init
npm run dev
```
The server runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
The application runs on `http://localhost:3000`.

## Features
- **User Authentication**: Register and Login securely.
- **Dashboard**: Real-time stats on active, paid, and overdue invoices.
- **Clients**: Manage client details.
- **Invoices**: Create, view, and send invoices via email (PDF attached).
- **Reminders**: Automated daily check for overdue invoices (sent via email).
- **Settings**: Configure company logo and email tone.

## Environment Variables
- **Server**: `.env` (DATABASE_URL, JWT_SECRET, SENDGRID_API_KEY)
- **Client**: `.env.local` (NEXTAUTH_URL, NEXTAUTH_SECRET)

## Notes
- To test email sending without SendGrid, the server logs mock emails to the console.
- Ensure the backend is running before using the frontend.
