@echo off
echo ========================================
echo    Firebase Deployment Only
echo ========================================
echo.

echo [1/2] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo SUCCESS: Project built successfully
echo.

echo [2/2] Deploying to Firebase...
firebase deploy --project glogo-carwash
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy to Firebase!
    pause
    exit /b 1
)
echo.
echo ========================================
echo SUCCESS: Firebase deployment complete!
echo ========================================
echo.
echo Press any key to exit...
pause >nul