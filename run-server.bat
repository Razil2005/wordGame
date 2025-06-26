@echo off
title Guess the Word - Game Server
cd /d "c:\Users\Razil\Desktop\newgame"
echo Starting Guess the Word multiplayer server...
echo Server will be available at http://localhost:3001
echo.
node server.js
echo.
echo Server stopped. Press any key to close...
pause > nul
