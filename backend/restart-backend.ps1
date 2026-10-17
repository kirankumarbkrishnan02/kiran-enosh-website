# Kill anything on port 5000 and restart backend
Write-Host "Cleaning up port 5000..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Start-Sleep -Seconds 1

Write-Host "Starting backend..." -ForegroundColor Green
cd "E:\Downloads\KEC website 2026\kiran-enosh-website\backend"
npm run dev