@echo off
echo Migration Steps:
echo.
echo 1. Create new Firebase project: glogo-carwash
echo 2. Copy config from firebase-new.js to src/firebase.js
echo 3. Update .firebaserc file
echo 4. Deploy to new project
echo.
echo New URL will be: https://glogo-carwash.web.app
echo.
pause

echo Updating .firebaserc...
echo {
echo   "projects": {
echo     "default": "glogo-carwash"
echo   }
echo } > .firebaserc

echo Done! Now run: firebase deploy
pause