@echo off
title Enfance Pre School Website Server
echo ====================================================
echo Starting Enfance Pre School Website Server...
echo ====================================================
cd /d "%~dp0Enfance_Pre_School_Website"
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000
npx -y http-server -p 3000
pause
