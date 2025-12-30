Write-Host "========================================" -ForegroundColor Green
Write-Host "Jan-Samadhan Quick Start Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Setting up SQLite database (no PostgreSQL needed!)" -ForegroundColor Yellow
Set-Location backend

Write-Host "Copying SQLite environment file..." -ForegroundColor Cyan
Copy-Item .env.sqlite .env -Force

Write-Host "Copying SQLite schema..." -ForegroundColor Cyan
Copy-Item prisma\schema.sqlite.prisma prisma\schema.prisma -Force

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
& npx prisma generate

Write-Host "Running database migrations..." -ForegroundColor Cyan
& npx prisma db push

Write-Host "Seeding database with sample data..." -ForegroundColor Cyan
& npx prisma db seed

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 - Backend:" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 - Frontend:" -ForegroundColor Cyan
Write-Host "  cd 'Web App Mockup Design'" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then visit: http://localhost:3000" -ForegroundColor Magenta
Write-Host ""
Write-Host "Test accounts:" -ForegroundColor Yellow
Write-Host "  Citizen: citizen@test.com / password123" -ForegroundColor White
Write-Host "  Authority: authority@test.com / password123" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"