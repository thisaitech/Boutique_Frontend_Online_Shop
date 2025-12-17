@echo off
echo Setting up images for ThisAI Boutique...

REM Create public/images directory if not exists
if not exist "public\images" mkdir "public\images"

REM Copy images from glamics folder
xcopy "..\glamics.temptics.com\assets\img\*" "public\images\" /Y /E

echo Images setup complete!
echo.
echo Now run: npm install
echo Then run: npm run dev
pause
