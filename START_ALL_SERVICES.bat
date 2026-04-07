@echo off
REM ========================================================================
REM  GU Academic Module + Evolvex-AI Integration - Startup Script
REM  This script starts all required services in separate windows
REM ========================================================================

echo.
echo ========================================================================
echo   Starting GU Academic Module with Evolvex-AI Integration
echo ========================================================================
echo.

REM Get the directory where this script is located
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)
echo ✓ Python found

echo.
echo [2/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found

echo.
echo [3/4] Starting Evolvex-AI Backend (Port 8001)...
start "Evolvex-AI Backend (Port 8001)" cmd /k "cd /d %PROJECT_DIR%Backend\Evolvex-AI && echo Starting Evolvex-AI FastAPI Backend... && python -m uvicorn app.main:app --reload --port 8001"
timeout /t 3 >nul

echo.
echo [4/4] Starting Django Backend (Port 8000)...
start "Django Backend (Port 8000)" cmd /k "cd /d %PROJECT_DIR%Backend && echo Starting Django Backend... && python manage.py runserver"
timeout /t 3 >nul

echo.
echo [5/5] Starting React Frontend (Port 5173)...
start "React Frontend (Port 5173)" cmd /k "cd /d %PROJECT_DIR%frontend && echo Starting React Frontend... && npm run dev"

echo.
echo ========================================================================
echo   All services are starting...
echo ========================================================================
echo.
echo   Three new terminal windows have been opened:
echo   1. Evolvex-AI Backend    → http://localhost:8001
echo   2. Django Backend        → http://localhost:8000
echo   3. React Frontend        → http://localhost:5173
echo.
echo   Wait for all services to start (usually 10-30 seconds), then:
echo   - Open browser to http://localhost:5173
echo   - Login: 23032432001@gnu.ac.in / amaterasu123
echo   - Navigate to Career page
echo   - Scroll down to see Evolvex AI Career Assistant
echo.
echo   To stop all services, close the three terminal windows.
echo ========================================================================
echo.
pause
