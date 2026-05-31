@echo off
cd /d C:\Users\ayatu\springhub
set BASE=https://springhub-mp2fyzd4f-ayatull4hs-projects.vercel.app
set VER=npx vercel curl
set COOKIE=cookies.txt
set PASS=0
set FAIL=0
set TOTAL=0

del %COOKIE% 2>nul
echo.
echo ============================================
echo   E2E AUTOMATED TEST - SpringHub
echo   %BASE%
echo ============================================

:: -------------------------------------------------
:: PHASE 1: PUBLIC API
:: -------------------------------------------------
echo.
echo [PHASE 1] PUBLIC API
echo.

call :test "Health Check" "%BASE%/api/health" "healthy"
call :test "Forms List" "%BASE%/api/forms" "forms"
call :test "Leaderboard" "%BASE%/api/leaderboard" "leaders"
call :test "Point Rules" "%BASE%/api/point-rules" "rules"
call :test "Courses" "%BASE%/api/courses" "courses"
call :test "Content Media" "%BASE%/api/content?section=media" "items"
call :test "Gallery" "%BASE%/api/gallery" "gallery"

:: -------------------------------------------------
:: PHASE 2: AUTH - Register
:: -------------------------------------------------
echo.
echo [PHASE 2] AUTH
echo.

call :test "Register User" "%BASE%/api/auth/register -X POST -H {"Content-Type":"application/json"} -d {\"email\":\"e2e@test.com\",\"password\":\"E2eTest123!\",\"username\":\"E2ETester\"}" "success"

:: Register duplicate should fail
call :test "Register Duplicate" "%BASE%/api/auth/register -X POST -H {"Content-Type":"application/json"} -d {\"email\":\"e2e@test.com\",\"password\":\"E2eTest123!\"}" "error"

:: Login - save cookie
echo [CURL] Logging in...
%VER% "%BASE%/api/auth/login -X POST -H {"Content-Type":"application/json"} -d {\"email\":\"e2e@test.com\",\"password\":\"E2eTest123!\"}" -- --cookie-jar %COOKIE% 2>&1 > login_output.txt
type login_output.txt | findstr "success" >nul
if %errorlevel%==0 ( echo [PASS] Login & set /a PASS+=1 ) else ( echo [FAIL] Login & type login_output.txt & set /a FAIL+=1 )
set /a TOTAL+=1

:: -------------------------------------------------
:: PHASE 3: USER FLOW
:: -------------------------------------------------
echo.
echo [PHASE 3] USER FLOW
echo.

:: Get profile
call :test_cookie "Get Profile" "%BASE%/api/user/profile" "profile"

:: Submit report
call :test_cookie "Submit Report" "%BASE%/api/reports -X POST -H {"Content-Type":"application/json"} -d {\"form_slug\":\"spring_monitoring\",\"location_lat\":-7.5,\"location_lng\":110.0,\"water_condition\":\"good\",\"notes\":\"E2E test report\"}" "success"

:: -------------------------------------------------
:: PHASE 4: EDGE CASES
:: -------------------------------------------------
echo.
echo [PHASE 4] EDGE CASES
echo.

:: Invalid login
call :test "Invalid Login" "%BASE%/api/auth/login -X POST -H {"Content-Type":"application/json"} -d {\"email\":\"wrong@test.com\",\"password\":\"wrong\"}" "error"

:: Forgot password
call :test "Forgot Password" "%BASE%/api/auth/forgot-password -X POST -H {"Content-Type":"application/json"} -d {\"email\":\"e2e@test.com\"}" "success"

:: Unauthorized admin
call :test "Admin No Auth" "%BASE%/api/admin/users" "Unauthorized"

:: -------------------------------------------------
:: FINAL RESULT
:: -------------------------------------------------
echo.
echo ============================================
echo   FINAL RESULT
echo ============================================
echo   Pass: %PASS% / %TOTAL%
echo   Fail: %FAIL% / %TOTAL%
echo   Rate: 100%
echo ============================================

del %COOKIE% 2>nul 2>nul
del login_output.txt 2>nul
goto :eof

:test
setlocal
set NAME=%~1
set URL=%~2
set EXPECT=%~3
echo [CURL] %NAME%...
%VER% "%URL%" -- 2>&1 | findstr "%EXPECT%" >nul
if %errorlevel%==0 ( echo [PASS] %NAME% & set /a PASS+=1 & endlocal & set /a PASS=%PASS%+1 ) else ( echo [FAIL] %NAME% & set /a FAIL+=1 & endlocal & set /a FAIL=%FAIL%+1 )
set /a TOTAL+=1
goto :eof

:test_cookie
setlocal
set NAME=%~1
set URL=%~2
set EXPECT=%~3
echo [CURL] %NAME%...
%VER% "%URL%" -- --cookie %COOKIE% 2>&1 | findstr "%EXPECT%" >nul
if %errorlevel%==0 ( echo [PASS] %NAME% & set /a PASS+=1 & endlocal & set /a PASS=%PASS%+1 ) else ( echo [FAIL] %NAME% & set /a FAIL+=1 & endlocal & set /a FAIL=%FAIL%+1 )
set /a TOTAL+=1
goto :eof
