@echo off
echo ========================================
echo ITR Complete - Installation Script
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found: 
node --version
echo.

echo [2/4] Installing backend dependencies...
cd backend
call yarn install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo [3/4] Installing frontend dependencies...
cd ..\frontend
call yarn install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo [4/4] Creating .env file...
cd ..\backend
if not exist .env (
    copy .env.example .env
    echo .env file created from template
) else (
    echo .env file already exists
)
echo.

cd ..
echo ========================================
echo Installation Complete! 
echo ========================================
echo.
echo To start the application:
echo.
echo 1. Open Terminal 1 and run:
echo    cd ITR_Complete\backend
echo    npm start
echo.
echo 2. Open Terminal 2 and run:
echo    cd ITR_Complete\frontend
echo    npm start
echo.
echo 3. Open http://localhost:3000 in your browser
echo.
echo For more details, see QUICK_START.md
echo ========================================
pause
