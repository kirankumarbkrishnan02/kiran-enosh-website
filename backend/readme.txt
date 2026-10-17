Whenever you see EADDRINUSE, you now know exactly what to do:

in powershell :

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Then Press Enter

Then restart your servers. That's it. No PID hunting.