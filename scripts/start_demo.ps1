# ==============================================================
#   Quantum-Enhanced Smart Traffic Optimization System
#   One-Click Demo Launcher for Windows (PowerShell)
# ==============================================================

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Quantum-Enhanced Smart Traffic Optimization System" -ForegroundColor Cyan
Write-Host "              Full Demo Launcher v1.0" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start the FastAPI Backend
Write-Host "[1/3] Starting FastAPI Backend..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "python" `
    -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" `
    -WorkingDirectory "$PSScriptRoot\..\backend\src" `
    -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 3

# 2. Start the Next.js Frontend
Write-Host "[2/3] Starting Next.js Frontend..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npm" `
    -ArgumentList "run dev" `
    -WorkingDirectory "$PSScriptRoot\..\frontend" `
    -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 5

# 3. Trigger the Demo Sequence
Write-Host "[3/3] Triggering Demo Mode..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:8000/demo/start" -Method POST | Out-Null
    Write-Host ""
    Write-Host "✅ Demo is LIVE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  👉 Open your browser at: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "  Demo Scenes:" -ForegroundColor Magenta
    Write-Host "    [1] Normal traffic     → Balanced signals" -ForegroundColor Gray
    Write-Host "    [2] N-S Congestion     → Quantum shifts to NS Green" -ForegroundColor Yellow
    Write-Host "    [3] Decongestion       → Quantum clears queue" -ForegroundColor Gray
    Write-Host "    [4] 🚨 Ambulance!       → Emergency Green Corridor" -ForegroundColor Red
    Write-Host "    [5] Emergency cleared  → Returns to normal" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Press ENTER to stop the demo and close all services." -ForegroundColor DarkGray
    Read-Host
} catch {
    Write-Host "❌ Failed to connect to backend. Did it start correctly?" -ForegroundColor Red
}

# Cleanup
Write-Host "Stopping services..." -ForegroundColor DarkGray
Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue
Write-Host "Done." -ForegroundColor Gray
