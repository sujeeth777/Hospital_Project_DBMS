@echo off
title Hospital Management System — Web Dashboard & Embedded SQL
echo ========================================================
echo  STARTING HOSPITAL MANAGEMENT SYSTEM DASHBOARD
echo  Oracle 23ai Free + Embedded SQL Pro*C Project
echo ========================================================
echo.
echo Connecting to Oracle database at localhost:1521/FREEPDB1...
echo Starting Flask web server on http://localhost:5000 ...
echo.

start "" "http://localhost:5000"
python server.py

pause
