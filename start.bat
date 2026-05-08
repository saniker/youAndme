@echo off
echo ☕ YouAndMe 서버 시작 중...
echo.

:: 백엔드 서버 (포트 4000)
start "YouAndMe Backend" cmd /k "cd /d D:\claude\youAndme\server && node index.js"

:: 잠시 대기
timeout /t 2 /nobreak > nul

:: 프론트엔드 서버 (포트 5173)
start "YouAndMe Frontend" cmd /k "cd /d D:\claude\youAndme\client && npm run dev"

echo.
echo ✅ 서버가 시작됐습니다!
echo    참가자: http://localhost:5173
echo    운영자: http://localhost:5173/admin
echo.
echo    운영자 계정: admin@youandme.kr / admin1234
pause
