@echo off
cd /d D:\mam-profisor-main\mam-profisor-main
taskkill /F /IM node.exe >nul 2>&1
start http://localhost:3000
npx ng serve --port 3000
pause
