@echo off
echo ========================================
echo    Updating GitHub and Firebase
echo ========================================
echo.

echo [1/5] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo SUCCESS: Project built successfully
echo.

echo [2/5] Adding files to Git...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add files!
    pause
    exit /b 1
)
echo SUCCESS: Files added to Git
echo.

echo [3/5] Creating commit...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Update project
git commit -m "%commit_msg%"
if %errorlevel% equ 1 (
    echo INFO: No changes to commit, skipping...
) else if %errorlevel% neq 0 (
    echo ERROR: Failed to create commit!
    pause
    exit /b 1
) else (
    echo SUCCESS: Commit created
)
echo.

echo [4/5] Pushing to GitHub...
git status --porcelain
if %errorlevel% equ 0 (
    git push
    if %errorlevel% neq 0 (
        echo ERROR: Failed to push to GitHub!
        pause
        exit /b 1
    )
    echo SUCCESS: Pushed to GitHub successfully
) else (
    echo INFO: Nothing to push to GitHub
)
echo.

echo [5/5] Deploying to Firebase...
firebase deploy --project schedule-3314f
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy to Firebase!
    pause
    exit /b 1
)
echo.
echo ========================================
echo SUCCESS: Updated GitHub and Firebase!
echo ========================================
echo.
echo Press any key to exit...
pause >nul