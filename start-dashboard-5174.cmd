@echo off
cd /d "%~dp0"
set "PATH=%~dp0..\.tools\node;%PATH%"
set PORT=5174
node server.mjs
pause
