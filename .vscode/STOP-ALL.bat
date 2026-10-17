@echo off
title Stopping Kiran Enosh Servers
color 0C
echo ============================================
echo   STOPPING ALL SERVERS
echo ============================================
echo.
taskkill /F /IM node.exe 2>nul
echo.
echo Ports 5000 and 5500 are now free.
timeout /t 3