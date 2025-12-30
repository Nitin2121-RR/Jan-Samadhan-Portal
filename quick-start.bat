@echo off
echo ========================================
echo Jan-Samadhan Quick Start Setup
echo ========================================
echo.

echo Step 1: Setting up SQLite database (no PostgreSQL needed!)
cd backend

echo Copying SQLite environment file...
copy .env.sqlite .env

echo Copying SQLite schema...
copy prisma\schema.sqlite.prisma prisma\schema.prisma

echo Generating Prisma client...
call npx prisma generate

echo Running database migrations...
call npx prisma db push

echo Seeding database with sample data...
call npx prisma db seed

echo.
echo ========================================
echo Setup Complete! 
echo ========================================
echo.
echo To start the application:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd "Web App Mockup Design"
echo   npm run dev
echo.
echo Then visit: http://localhost:3000
echo.
echo Test accounts:
echo   Citizen: citizen@test.com / password123
echo   Authority: authority@test.com / password123
echo.
pause