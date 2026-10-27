@echo off
setlocal enabledelayedexpansion
title Hospital Management System — All-In-One Launcher

echo ==============================================================
echo       HOSPITAL MANAGEMENT SYSTEM — QUICK START LAUNCHER
echo       Oracle 23ai + Embedded SQL (Pro*C) + Web Dashboard
echo ==============================================================
echo.

:: 1. Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

:: 2. Install Python dependencies
echo [1/4] Checking Python dependencies (Flask, oracledb, python-dotenv)...
python -m pip install -q -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARN] Pip install returned a warning, continuing...
) else (
    echo [OK] All Python dependencies verified.
)
echo.

:: 3. Setup and verify database
echo [2/4] Verifying Oracle database connection and tables...
python setup_database.py
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Database setup could not connect to Oracle.
    echo Please ensure your Oracle Database is running and credentials in .env are correct.
    pause
    exit /b 1
)
echo.

:: 4. Check Pro*C C executables
echo [3/4] Checking Embedded SQL Pro*C binaries...
if not exist hospital_menu.exe (
    echo [INFO] Precompiled C binaries not found.
    where.exe proc.exe >nul 2>&1
    if !errorlevel! equ 0 (
        echo Oracle Pro*C detected. Compiling C programs now...
        call build_all.bat
    ) else (
        echo [NOTE] Pro*C compiler not detected on this machine.
        echo Skipping C compilation. Web Dashboard will run with full functionality.
    )
) else (
    echo [OK] Precompiled Embedded SQL C binaries are ready.
)
echo.

:: 5. Start Web Server and open browser
echo [4/4] Starting Web Dashboard server...
start "Hospital Management System Server" cmd /k "python server.py"

:: Wait 2 seconds for server to initialize
timeout /t 2 /nobreak >nul

echo Opening browser at http://localhost:5000 ...
start "" "http://localhost:5000"

:MENU_LOOP
cls
echo ==============================================================
echo       HOSPITAL MANAGEMENT SYSTEM IS CURRENTLY RUNNING!
echo ==============================================================
echo   Web Dashboard URL : http://localhost:5000
echo   Database          : Oracle 23ai (localhost:1521/FREEPDB1)
echo ==============================================================
echo.
echo   Options:
echo     [1] Open Web Dashboard in Browser
echo     [2] Launch Embedded SQL (Pro*C) C Console Menu
echo     [3] Recompile All Pro*C C Binaries (build_all.bat)
echo     [4] Re-run Database Setup & Verification
echo     [5] Exit Launcher
echo.
set /p USER_CHOICE="Enter your choice (1-5): "

if "%USER_CHOICE%"=="1" (
    start "" "http://localhost:5000"
    goto MENU_LOOP
)
if "%USER_CHOICE%"=="2" (
    if exist hospital_menu.exe (
        start cmd /k ".\hospital_menu.exe"
    ) else (
        echo hospital_menu.exe not found. Running build_all.bat...
        call build_all.bat
        if exist hospital_menu.exe start cmd /k ".\hospital_menu.exe"
    )
    goto MENU_LOOP
)
if "%USER_CHOICE%"=="3" (
    call build_all.bat
    goto MENU_LOOP
)
if "%USER_CHOICE%"=="4" (
    python setup_database.py
    pause
    goto MENU_LOOP
)
if "%USER_CHOICE%"=="5" (
    echo.
    echo Exiting launcher. Note: The server window will remain open in the background.
    echo Press any key to close this window.
    pause >nul
    exit /b 0
)

echo Invalid choice.
timeout /t 1 >nul
goto MENU_LOOP
