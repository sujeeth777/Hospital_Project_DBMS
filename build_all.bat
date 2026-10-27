@echo off
setlocal enabledelayedexpansion
title Build Hospital Management System (Embedded SQL Pro*C)

echo =======================================================
echo  COMPILING HOSPITAL MANAGEMENT SYSTEM (PRO*C + MSVC)
echo =======================================================

if not defined ORACLE_HOME (
    echo [ERROR] Set ORACLE_HOME to your Oracle Database installation directory.
    echo Example: set "ORACLE_HOME=C:\app\oracle\product\23ai\dbhomeFree"
    pause
    exit /b 1
)

if not defined VSDEVCMD set "VSDEVCMD=%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat"
set "PATH=%ORACLE_HOME%\bin;%PATH%"

if not exist "%VSDEVCMD%" (
    echo [ERROR] Visual Studio developer command script not found at:
    echo %VSDEVCMD%
    echo Set VSDEVCMD to the path of your VsDevCmd.bat file.
    pause
    exit /b 1
)

echo Initializing MSVC x64 build environment...
call "%VSDEVCMD%" -arch=x64 > nul
if errorlevel 1 (
    echo [ERROR] Failed to initialize the MSVC build environment.
    pause
    exit /b 1
)

set FILES=patient_search patient_register doctor_add appointment_book consultation_add billing_payment hospital_reports

for %%F in (%FILES%) do (
    echo.
    echo --- Precompiling %%F.pc ---
    proc.exe iname=%%F.pc
    if !errorlevel! neq 0 (
        echo [ERROR] Pro*C precompilation failed for %%F.pc
        pause
        exit /b 1
    )
    echo --- Compiling %%F.c to %%F.exe ---
    cl.exe /Fe:%%F.exe %%F.c /I "%ORACLE_HOME%\precomp\public" /link /LIBPATH:"%ORACLE_HOME%\precomp\lib" orasql.lib
    if !errorlevel! neq 0 (
        echo [ERROR] Compilation failed for %%F.c
        pause
        exit /b 1
    )
    echo [SUCCESS] %%F.exe built successfully.
)

echo.
echo --- Compiling hospital_menu.c ---
cl.exe /Fe:hospital_menu.exe hospital_menu.c
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed for hospital_menu.c
    pause
    exit /b 1
)
echo [SUCCESS] hospital_menu.exe built successfully.

echo.
echo =======================================================
echo  ALL PRO*C EMBEDDED SQL BINARIES COMPILED SUCCESSFULLY!
echo =======================================================
echo.
pause
