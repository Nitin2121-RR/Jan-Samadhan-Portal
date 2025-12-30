# Quick Local Setup Guide

## Prerequisites Check ✅
- [x] Node.js 24.12.0 installed
- [x] npm 11.6.2 installed
- [x] Frontend dependencies installed
- [x] Backend dependencies installed
- [x] Contracts dependencies installed

## Next Steps:

### 1. Install PostgreSQL
**Download and install from:** https://www.postgresql.org/download/windows/

**During installation:**
- Set password for 'postgres' user (remember this!)
- Keep default port: 5432
- Install pgAdmin (optional but helpful)

### 2. Create Database
After PostgreSQL is installed, open Command Prompt as Administrator and run:

```cmd
# Connect to PostgreSQL (enter password when prompted)
psql -U postgres

# In PostgreSQL shell, run these commands:
CREATE USER sam WITH PASSWORD 'hackathon2024';
CREATE DATABASE jansamadhan OWNER sam;
GRANT ALL PRIVILEGES ON DATABASE jansamadhan TO sam;
\q
```

### 3. Update Environment Files

**Backend Environment:**
Edit `backend/.env` and update the DATABASE_URL:
```
DATABASE_URL=postgresql://sam:hackathon2024@localhost:5432/jansamadhan
```

### 4. Run Database Migrations
```cmd
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 5. Start the Application

**Terminal 1 - Backend:**
```cmd
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```cmd
cd "Web App Mockup Design"
npm run dev
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Database Admin: `npx prisma studio` (http://localhost:5555)

## Test Accounts
After seeding, you can login with:
- **Citizen**: citizen@test.com / password123
- **Authority**: authority@test.com / password123

## Troubleshooting

### If PostgreSQL installation fails:
Try using Docker instead:
```cmd
docker run --name postgres-jansamadhan -e POSTGRES_PASSWORD=hackathon2024 -e POSTGRES_USER=sam -e POSTGRES_DB=jansamadhan -p 5432:5432 -d postgres:14
```

### If database connection fails:
1. Check PostgreSQL is running: `services.msc` → find PostgreSQL
2. Verify connection string in backend/.env
3. Test connection: `psql -U sam -d jansamadhan -h localhost`

### If ports are in use:
- Frontend (3000): Change in vite.config.ts
- Backend (5001): Change PORT in backend/.env