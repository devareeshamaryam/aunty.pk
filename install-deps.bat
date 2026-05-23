@echo off
echo Installing dependencies for my-ecom project...
echo.

echo Step 1: Cleaning old installations...
if exist "apps\web\.next" rmdir /s /q "apps\web\.next"
if exist "node_modules" rmdir /s /q "node_modules"
if exist "apps\web\node_modules" rmdir /s /q "apps\web\node_modules"
if exist "apps\api\node_modules" rmdir /s /q "apps\api\node_modules"
if exist "package-lock.json" del /f "package-lock.json"

echo.
echo Step 2: Installing root dependencies...
call npm install --no-audit --no-fund

echo.
echo Step 3: Installing workspace dependencies...
cd apps\web
call npm install --no-audit --no-fund
cd ..\..

cd apps\api
call npm install --no-audit --no-fund
cd ..\..

echo.
echo Installation complete!
echo You can now run: npm run dev
pause
