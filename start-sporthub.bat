@echo off
chcp 65001 >nul
setlocal DisableDelayedExpansion

:: ============================================================================
::  SPORTHUB (SWP391_SportsCenter) - ALL-IN-ONE SINGLE-WINDOW LAUNCHER
:: ============================================================================

title SportHub Launcher (SWP391)
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "DB_SCRIPT=%ROOT_DIR%DATABASEchuan.sql"
set "LOG_DIR=%TEMP%\sporthub-logs"
set "BE_LOG=%LOG_DIR%\backend.log"
set "FE_LOG=%LOG_DIR%\frontend.log"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1

:: Initialize ANSI escape sequence for colored output (Windows 10/11)
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"
set "C_RESET=%ESC%[0m"
set "C_BOLD=%ESC%[1m"
set "C_DIM=%ESC%[90m"
set "C_RED=%ESC%[91m"
set "C_GREEN=%ESC%[92m"
set "C_YELLOW=%ESC%[93m"
set "C_CYAN=%ESC%[96m"
set "C_ORANGE=%ESC%[38;5;208m"

:: Optional CLI quick flags: start-sporthub.bat start | reset | restart | stop
if /I "%~1"=="start" goto :ACTION_START_ONLY
if /I "%~1"=="reset" goto :ACTION_RESET_DB
if /I "%~1"=="restart" goto :ACTION_FULL_RESTART
if /I "%~1"=="stop" goto :ACTION_STOP_ALL

:MENU
cls
call :CHECK_PORT 1433 SQL_STATUS
call :CHECK_PORT 8080 BE_STATUS
call :CHECK_PORT 5174 FE_STATUS

echo %C_ORANGE%%C_BOLD%
echo   ____                   _   _   _       _
echo  / ___^| _ __   ___  _ __^| ^|_^| ^| ^| ^|_   _^| ^|__
echo  \___ \^| '_ \ / _ \^| '__^| __^| ^|_^| ^| ^| ^| ^| '_ \
echo   ___^) ^| ^|_^) ^| ^(_^) ^| ^|  ^| ^|_^|  _  ^| ^|_^| ^| ^|_^) ^|
echo  ^|____/^| .__/ \___/^|_^|   \__^|_^| ^|_^|\__,_^|_.__/
echo        ^|_^|   SWP391 SportsCenter Launcher ^(1-Window%C_RESET%)
echo %C_DIM%  ------------------------------------------------------------%C_RESET%
echo   Trang thai dich vu:
echo     SQL Server ^(1433^) : %SQL_STATUS%
echo     Backend    ^(8080^) : %BE_STATUS%
echo     Frontend   ^(5174^) : %FE_STATUS%
echo %C_DIM%  ------------------------------------------------------------%C_RESET%
echo.
echo   %C_CYAN%[1]%C_RESET% Khoi dong he thong ^(Chay ngam BE + FE ^& tu mo trinh duyet^)
echo   %C_CYAN%[2]%C_RESET% Reset Database sach ^(Nap lai DATABASEchuan.sql^)
echo   %C_CYAN%[3]%C_RESET% %C_BOLD%Reset sach DB + Restart toan bo ^(Chuan bi bao ve^)%C_RESET%
echo   %C_CYAN%[4]%C_RESET% Dung Backend ^& Frontend ^(Kill cong 8080 ^& 5174^)
echo   %C_CYAN%[5]%C_RESET% Xem Log Backend / Frontend ngay trong cua so nay
echo   %C_CYAN%[6]%C_RESET% Kiem tra chat luong ^(Lint + Build Frontend^)
echo   %C_CYAN%[0]%C_RESET% Thoat
echo.
set "CHOICE="
set /p "CHOICE=  Chon thao tac [0-6]: "

if "%CHOICE%"=="1" goto :ACTION_START_ONLY
if "%CHOICE%"=="2" goto :ACTION_RESET_DB
if "%CHOICE%"=="3" goto :ACTION_FULL_RESTART
if "%CHOICE%"=="4" goto :ACTION_STOP_ALL
if "%CHOICE%"=="5" goto :ACTION_VIEW_LOGS
if "%CHOICE%"=="6" goto :ACTION_CHECK_FE
if "%CHOICE%"=="0" exit /b 0

echo.
echo   %C_YELLOW%[WARN] Lua chon khong hop le. Vui long chon tu 0 den 6.%C_RESET%
timeout /t 2 >nul
goto :MENU

:: ============================================================================
:: ACTIONS
:: ============================================================================

:ACTION_START_ONLY
echo.
call :PREFLIGHT_BUILD_TOOLS
if errorlevel 1 goto :BACK_OR_EXIT
call :START_SERVICES
call :WAIT_AND_OPEN_BROWSER
goto :BACK_OR_EXIT

:ACTION_RESET_DB
echo.
call :RESET_DATABASE
goto :BACK_OR_EXIT

:ACTION_FULL_RESTART
echo.
call :PREFLIGHT_BUILD_TOOLS
if errorlevel 1 goto :BACK_OR_EXIT
call :STOP_PORT 8080 "Backend"
call :STOP_PORT 5174 "Frontend"
call :RESET_DATABASE
if errorlevel 1 goto :BACK_OR_EXIT
call :START_SERVICES
call :WAIT_AND_OPEN_BROWSER
goto :BACK_OR_EXIT

:ACTION_STOP_ALL
echo.
call :STOP_PORT 8080 "Backend"
call :STOP_PORT 5174 "Frontend"
echo   %C_GREEN%[OK]%C_RESET% Da don dep xong cong 8080 va 5174.
goto :BACK_OR_EXIT

:ACTION_VIEW_LOGS
echo.
echo   %C_CYAN%[1]%C_RESET% Xem 40 dong cuoi Backend Log
echo   %C_CYAN%[2]%C_RESET% Xem 40 dong cuoi Frontend Log
echo   %C_CYAN%[3]%C_RESET% Theo doi log truc tiep ^(Nhan Q de quay lai Menu^)
echo   %C_CYAN%[0]%C_RESET% Quay lai
echo.
set "LOG_CHOICE="
set /p "LOG_CHOICE=  Chon che do xem log [0-3]: "
if "%LOG_CHOICE%"=="1" (
    echo.
    if exist "%BE_LOG%" (
        powershell -NoProfile -Command "Get-Content -Path '%BE_LOG%' -Tail 40"
    ) else (
        echo   %C_DIM%[INFO] Chua co log Backend.%C_RESET%
    )
    goto :BACK_OR_EXIT
)
if "%LOG_CHOICE%"=="2" (
    echo.
    if exist "%FE_LOG%" (
        powershell -NoProfile -Command "Get-Content -Path '%FE_LOG%' -Tail 40"
    ) else (
        echo   %C_DIM%[INFO] Chua co log Frontend.%C_RESET%
    )
    goto :BACK_OR_EXIT
)
if "%LOG_CHOICE%"=="3" (
    echo.
    echo   %C_DIM%Dang theo doi log BE + FE... Nhan phim Q de quay lai Menu.%C_RESET%
    powershell -NoProfile -Command "$be='%BE_LOG%'; $fe='%FE_LOG%'; $bePos=if(Test-Path $be){(Get-Item $be).Length}else{0}; $fePos=if(Test-Path $fe){(Get-Item $fe).Length}else{0}; if(Test-Path $be){ Get-Content $be -Tail 10 | ForEach-Object { Write-Host ('[BE] ' + $_) -ForegroundColor Green } }; if(Test-Path $fe){ Get-Content $fe -Tail 10 | ForEach-Object { Write-Host ('[FE] ' + $_) -ForegroundColor Cyan } }; while($true){ if([Console]::KeyAvailable){ $k=[Console]::ReadKey($true); if($k.Key -eq 'Q'){ break } }; if(Test-Path $be){ $len=(Get-Item $be).Length; if($len -gt $bePos){ $fs=[IO.File]::Open($be,'Open','Read','ReadWrite'); $fs.Seek($bePos,'Begin')|Out-Null; $sr=New-Object IO.StreamReader($fs); while(-not $sr.EndOfStream){ Write-Host ('[BE] ' + $sr.ReadLine()) -ForegroundColor Green }; $bePos=$fs.Position; $sr.Close(); $fs.Close() } }; if(Test-Path $fe){ $len2=(Get-Item $fe).Length; if($len2 -gt $fePos){ $fs2=[IO.File]::Open($fe,'Open','Read','ReadWrite'); $fs2.Seek($fePos,'Begin')|Out-Null; $sr2=New-Object IO.StreamReader($fs2); while(-not $sr2.EndOfStream){ Write-Host ('[FE] ' + $sr2.ReadLine()) -ForegroundColor Cyan }; $fePos=$fs2.Position; $sr2.Close(); $fs2.Close() } }; Start-Sleep -Milliseconds 300 }"
    goto :MENU
)
goto :MENU

:ACTION_CHECK_FE
echo.
where npm >nul 2>&1
if errorlevel 1 (
    echo   %C_RED%[ERR]%C_RESET% Khong tim thay npm trong PATH.
    goto :BACK_OR_EXIT
)
pushd "%FRONTEND_DIR%"
echo   %C_CYAN%[1/2]%C_RESET% Dang chay npm run lint...
call npm run lint
if errorlevel 1 (
    popd
    echo   %C_RED%[ERR]%C_RESET% Lint that bai.
    goto :BACK_OR_EXIT
)
echo   %C_CYAN%[2/2]%C_RESET% Dang chay npm run build...
call npm run build
popd
if errorlevel 1 (
    echo   %C_RED%[ERR]%C_RESET% Build that bai.
) else (
    echo   %C_GREEN%[OK]%C_RESET% Frontend lint + build PASS!
)
goto :BACK_OR_EXIT

:BACK_OR_EXIT
echo.
if not "%~1"=="" exit /b 0
pause
goto :MENU

:: ============================================================================
:: SUBROUTINES
:: ============================================================================

:PREFLIGHT_BUILD_TOOLS
where mvn >nul 2>&1
if errorlevel 1 (
    echo   %C_RED%[ERR]%C_RESET% Khong tim thay Maven ^(mvn^) trong PATH.
    exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
    echo   %C_RED%[ERR]%C_RESET% Khong tim thay Node.js / npm trong PATH.
    exit /b 1
)
if not exist "%BACKEND_DIR%\pom.xml" (
    echo   %C_RED%[ERR]%C_RESET% Khong tim thay backend\pom.xml.
    exit /b 1
)
if not exist "%FRONTEND_DIR%\package.json" (
    echo   %C_RED%[ERR]%C_RESET% Khong tim thay frontend\package.json.
    exit /b 1
)
if not exist "%FRONTEND_DIR%\node_modules" (
    echo   %C_YELLOW%[INFO]%C_RESET% Chua co node_modules, dang chay npm install...
    pushd "%FRONTEND_DIR%"
    call npm install
    if errorlevel 1 (
        popd
        echo   %C_RED%[ERR]%C_RESET% npm install that bai.
        exit /b 1
    )
    popd
)
exit /b 0

:RESET_DATABASE
where sqlcmd >nul 2>&1
if errorlevel 1 (
    echo   %C_RED%[ERR]%C_RESET% Khong tim thay sqlcmd trong PATH.
    exit /b 1
)
if not exist "%DB_SCRIPT%" (
    echo   %C_RED%[ERR]%C_RESET% Khong tim thay file: %DB_SCRIPT%
    exit /b 1
)
echo   %C_CYAN%[DB]%C_RESET% Dang nap lai DATABASEchuan.sql vao localhost,1433...
sqlcmd -S localhost,1433 -U sa -P 12345 -C -f 65001 -b -i "%DB_SCRIPT%"
if errorlevel 1 (
    echo   %C_RED%[ERR]%C_RESET% Reset database that bai. Kiem tra SQL Server cong 1433!
    exit /b 1
)
echo   %C_GREEN%[OK]%C_RESET% Da reset database SportsCenterDB thanh cong!
exit /b 0

:START_SERVICES
netstat -ano | findstr /r /c:":8080 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo   %C_YELLOW%[WARN]%C_RESET% Cong 8080 dang chay san, giu nguyen tien trinh hien tai.
) else (
    echo   %C_CYAN%[BE]%C_RESET% Dang khoi dong ngam Backend ^(http://localhost:8080^)...
    powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','mvn spring-boot:run > \"%BE_LOG%\" 2>&1' -WorkingDirectory '%BACKEND_DIR%' -WindowStyle Hidden"
)

netstat -ano | findstr /r /c:":5174 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo   %C_YELLOW%[WARN]%C_RESET% Cong 5174 dang chay san, giu nguyen tien trinh hien tai.
) else (
    echo   %C_CYAN%[FE]%C_RESET% Dang khoi dong ngam Frontend ^(http://localhost:5174^)...
    powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run dev > \"%FE_LOG%\" 2>&1' -WorkingDirectory '%FRONTEND_DIR%' -WindowStyle Hidden"
)
exit /b 0

:WAIT_AND_OPEN_BROWSER
echo.
echo   %C_DIM%Dang cho Frontend ^(5174^) va Backend ^(8080^) san sang ^(toi da 90 giay^)...%C_RESET%
powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(90); $fe=$false; $be=$false; while ((Get-Date) -lt $deadline) { if (-not $fe) { try { $r=Invoke-WebRequest -Uri 'http://localhost:5174' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { $fe=$true; Write-Host '  [OK] Frontend (5174) da san sang!' -ForegroundColor Cyan } } catch {} }; if (-not $be) { try { $r2=Invoke-WebRequest -Uri 'http://127.0.0.1:8080/api/v1/public/content/sports' -UseBasicParsing -TimeoutSec 2; if ($r2.StatusCode -eq 200) { $be=$true; Write-Host '  [OK] Backend (8080) da san sang!' -ForegroundColor Green } } catch {} }; if ($fe -and $be) { break }; Start-Sleep -Milliseconds 700 }; if (-not ($fe -and $be)) { Write-Host '  [INFO] Het thoi gian cho, van tiep tuc mo trinh duyet...' -ForegroundColor Yellow }"
start "" "http://localhost:5174"
echo.
echo   %C_GREEN%[OPEN]%C_RESET% Da mo trinh duyet tai %C_CYAN%http://localhost:5174%C_RESET%
echo   %C_BOLD%Thong tin truy cap nhanh:%C_RESET%
echo     - Web App  : %C_CYAN%http://localhost:5174%C_RESET%
echo     - API Base : %C_CYAN%http://localhost:8080/api/v1%C_RESET%
echo     - Mat khau : %C_GREEN%SportHub@123%C_RESET% ^(manager@sporthub.com / reception.le@sporthub.com / coach.minh@sporthub.com / khoa.member@gmail.com^)
echo     - Xem Log  : Chon %C_CYAN%[5]%C_RESET% ngay trong cua so nay ^(hoac %LOG_DIR%^)
exit /b 0

:CHECK_PORT
set "PORT_NUM=%~1"
set "OUT_VAR=%~2"
netstat -ano | findstr /r /c:":%PORT_NUM% .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    set "%OUT_VAR%=%C_GREEN%DANG CHAY%C_RESET%"
) else (
    set "%OUT_VAR%=%C_DIM%CHUA CHAY%C_RESET%"
)
exit /b 0

:STOP_PORT
set "TARGET_PORT=%~1"
set "LABEL=%~2"
set "FOUND_ANY=0"
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%TARGET_PORT% .*LISTENING"') do (
    if not "%%p"=="0" (
        set "FOUND_ANY=1"
        taskkill /F /T /PID %%p >nul 2>&1
        echo   %C_YELLOW%[STOP]%C_RESET% Da dung %LABEL% ^(PID %%p, cong %TARGET_PORT%^).
    )
)
if "%FOUND_ANY%"=="0" (
    echo   %C_DIM%[SKIP] %LABEL% ^(cong %TARGET_PORT%^) khong co tien trinh nao dang chay.%C_RESET%
)
exit /b 0
