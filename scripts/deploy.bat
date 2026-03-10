@echo off
echo ============================================================
echo   Q-Traffic - Dockerized Deployment
echo ============================================================
echo.

echo [1/1] Building and starting containers...
docker-compose up --build -d

echo.
echo ============================================================
echo   Deployment Started In Background!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ============================================================
echo.
pause
