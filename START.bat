@echo off
title SWEETO HUB Control Panel
mode con: cols=65 lines=20
color 0B

echo =============================================================
echo               SWEETO HUB TECH-LUXURY CONTROL PANEL           
echo =============================================================
echo.
echo  [1/2] Initializing SQLite database and API server...
start "SWEETO Hub API Server" cmd /k "node server.js"
timeout /t 3 >nul

echo.
echo  [2/2] Booting up Vite frontend Web client...
start "SWEETO Hub Web Client" cmd /k "npm run dev -- --host"
timeout /t 2 >nul

echo.
echo =============================================================
echo  STATUS: ALL SYSTEMS LAUNCHED AND FULLY OPERATIONAL!
echo =============================================================
echo.
echo  - Backend SQLite API:  http://localhost:3000
echo  - Frontend Store Client: http://localhost:5173
echo.
echo  Note: You can access the store from other devices on your
echo        local network using your machine's Local IP address!
echo.
echo =============================================================
echo  To shut down both servers, close their active command windows.
echo =============================================================
echo.
pause
