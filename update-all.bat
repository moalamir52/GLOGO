@echo off
echo ========================================
echo    GLOGO - Complete Update Script
echo ========================================
echo.

echo [1/5] Adding changes to Git...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add changes to Git!
    pause
    exit /b 1
)
echo SUCCESS: Changes added to Git
echo.

echo [2/5] Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Update GLOGO project
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to commit changes!
    pause
    exit /b 1
)
echo SUCCESS: Changes committed
echo.

echo [3/5] Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push to GitHub!
    pause
    exit /b 1
)
echo SUCCESS: Pushed to GitHub
echo.

echo [4/5] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo SUCCESS: Project built successfully
echo.

echo [5/5] Deploying to Firebase...
firebase deploy --project glogo-carwash
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy to Firebase!
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS: Complete update finished!
echo ========================================
echo.
echo GitHub Pages: https://moalamir52.github.io/GLOGO/
echo Firebase: https://glogo-carwash.web.app
echo.
echo Press any key to exit...
pause >nul