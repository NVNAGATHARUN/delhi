@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   Q-Traffic - PRODUCTION MODE
echo ============================================================
echo.

:: Kill existing processes on ports 3000 and 8000
echo [0/2] Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: Start Backend
echo [1/2] Starting Backend (FastAPI)...
start "Q-Traffic Backend" cmd /k "cd /d "%~dp0backend\src" && python main.py"

:: Wait a moment for backend to initialize
echo Waiting for backend...
timeout /t 5 /nobreak >nul

:: Start Frontend (Production)
echo [2/2] Starting Frontend (Production)...
start "Q-Traffic Frontend" cmd /k "cd /d "%~dp0frontend" && npm run start"

echo.
echo ============================================================
echo   System Starting in PRODUCTION MODE...
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo ============================================================
echo.
echo Press any key to open the dashboard...
pause >nul
start http://localhost:3000
