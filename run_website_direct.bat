@echo off
title Enfance Pre School Website
echo ====================================================
echo Opening Enfance Pre School Website...
echo ====================================================
cd /d "%~dp0"
if exist "Enfance_Pre_School_Website" (
    cd "Enfance_Pre_School_Website"
)
start index.html
exit
