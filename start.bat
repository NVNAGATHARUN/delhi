@echo off
echo ============================================================
echo   Q-Traffic - Quantum-Enhanced AI Traffic Optimizer
echo ============================================================
echo.

:: Start Backend
echo [1/2] Starting Backend (FastAPI)...
start "Q-Traffic Backend" cmd /k "cd /d "%~dp0backend\src" && python main.py"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend (Next.js)...
start "Q-Traffic Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================================
echo   System Starting...
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo ============================================================
echo.
echo Press any key to open the dashboard in your browser...
pause >nul
start http://localhost:3000
