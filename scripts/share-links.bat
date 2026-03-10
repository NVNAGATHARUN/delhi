@echo off
echo ============================================================
echo   Q-Traffic - Public Sharing via Localtunnel
echo ============================================================
echo.

echo [1/2] Starting Backend Tunnel (Port 8000)...
start "Q-Traffic Backend Tunnel" cmd /k "npx localtunnel --port 8000"

echo [2/2] Starting Frontend Tunnel (Port 3000)...
start "Q-Traffic Frontend Tunnel" cmd /k "npx localtunnel --port 3000"

echo.
echo ============================================================
echo   Public Sharing Active!
echo   Check the two new windows for your public URLs.
echo   Share the links with your teammates.
echo ============================================================
echo.
pause
