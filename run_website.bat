@echo off
title Enfance Pre School Website Server
echo ====================================================
echo Starting Enfance Pre School Website Server...
echo ====================================================

cd /d "%~dp0"
if exist "Enfance_Pre_School_Website" (
    cd "Enfance_Pre_School_Website"
)

:: Check if node command is available, if not use default Program Files path
where node >nul 2>nul
if errorlevel 1 goto NO_PATH_NODE

node server.js
goto END

:NO_PATH_NODE
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" server.js
    goto END
)

echo ERROR: Node.js was not found on your system!
echo Please download and install Node.js from https://nodejs.org/
pause

:END
pause
