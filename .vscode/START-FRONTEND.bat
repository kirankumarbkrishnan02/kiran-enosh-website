@echo off
cd /d "E:\Downloads\KEC website 2026\kiran-enosh-website\frontend"
title Kiran Enosh Frontend (Port 5500)
color 0B
echo ============================================
echo   KIRAN ENOSH - FRONTEND
echo ============================================
echo.
echo Laptop URL:  http://localhost:5500
echo Phone URL:   http://192.168.31.89:5500
echo.
echo Keep this window open while using the site.
echo.
npx http-server -p 5500 -c-1 -a 0.0.0.0
pause