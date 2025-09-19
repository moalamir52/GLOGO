@echo off
echo ========================================
echo    GitHub Pages Deployment Only
echo ========================================
echo.

echo [1/4] Adding changes to Git...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add changes to Git!
    pause
    exit /b 1
)
echo SUCCESS: Changes added to Git
echo.

echo [2/4] Committing changes...
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

echo [3/4] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo SUCCESS: Project built successfully
echo.

echo [4/4] Deploying to GitHub Pages...
call npm run deploy
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy to GitHub Pages!
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS: GitHub Pages deployment complete!
echo ========================================
echo.
echo Live at: https://moalamir52.github.io/GLOGO/
echo.
echo Press any key to exit...
pause >nul