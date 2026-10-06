@echo off
echo ==========================================================
echo   PERSONAL MEDIA HUB - FULL REGRESSION TEST RUNNER
echo ==========================================================

echo.
echo [1/2] Running Backend Test Suite...
apps\api\.venv\Scripts\pytest.exe -c apps\api\pytest.ini apps\api\tests -q
if %errorlevel% neq 0 (
    echo [ERROR] Backend tests failed!
    exit /b %errorlevel%
)
echo Backend tests: PASSED.

echo.
echo [2/2] Running Frontend Build and Typecheck...
call npm run build --prefix apps\web
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    exit /b %errorlevel%
)
echo Frontend build: PASSED.

echo.
echo ==========================================================
echo   ALL TESTS PASSED SUCCESSFULLY! SYSTEM IS STABLE.
echo ==========================================================
