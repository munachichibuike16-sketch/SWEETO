@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo Setting Git identity...
%GIT% config --global user.email "munachichibuike16@gmail.com"
%GIT% config --global user.name "munachichibuike16-sketch"

echo Adding all files...
%GIT% add .

echo Committing changes...
%GIT% commit -m "Update Google OAuth Client ID to new credentials"

echo Setting branch to main...
%GIT% branch -M main

echo Pushing to GitHub...
%GIT% push -u origin main

echo Done!
pause
