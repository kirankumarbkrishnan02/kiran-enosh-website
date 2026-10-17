# Kills anything using port 5000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Killing PID $($_.OwningProcess)..."
    Stop-Process -Id $_.OwningProcess -Force
}
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "✅ Port 5000 cleared"