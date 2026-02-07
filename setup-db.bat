@echo off
echo 🛠️  Personal Finance Tracker - Database Setup
echo.

echo Checking PostgreSQL installation...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL not found in PATH
    echo.
    echo 📥 Please download PostgreSQL manually from:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo After installation:
    echo 1. Open a new terminal
    echo 2. Run: setup-db.bat
    pause
    exit /b 1
)

echo ✅ PostgreSQL found!
echo.

echo Creating database 'finance_tracker'...
createdb finance_tracker 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Database might already exist or PostgreSQL service not started
    echo Trying to connect to verify...
)

echo.
echo Testing database connection...
psql -U postgres -d finance_tracker -c "SELECT version();" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Cannot connect to database
    echo.
    echo Troubleshooting steps:
    echo 1. Make sure PostgreSQL service is running
    echo 2. Verify username/password in .env file
    echo 3. Check if port 5432 is available
    pause
    exit /b 1
)

echo ✅ Database connection successful!
echo.

echo Running database migrations...
npm run migrate

echo.
echo 🎉 Database setup complete!
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Open: http://localhost:3000
echo.
pause