@echo off
setlocal enabledelayedexpansion

pushd %~dp0\..

echo Starting NovelAI Prompt ^& Character Manager in development mode...
call npm run dev

popd
