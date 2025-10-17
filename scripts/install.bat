@echo off
setlocal enabledelayedexpansion

where node >nul 2>nul
if errorlevel 1 (
  echo [Error] Node.js is not installed or not on PATH.
  echo Please install Node.js 18 or later before running this script.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [Error] npm is not installed or not on PATH.
  echo Please install npm 9 or later before running this script.
  exit /b 1
)

pushd %~dp0\..

echo Installing dependencies...
call npm install

if errorlevel 1 (
  popd
  exit /b 1
)

echo.
echo Installation complete. You can now launch the app with scripts\start.bat or scripts/start.sh on Unix-like systems.

popd
