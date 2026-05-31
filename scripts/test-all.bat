@echo off
cd /d C:\Users\ayatu\springhub
set BASE=https://springhub-mp2fyzd4f-ayatull4hs-projects.vercel.app
set VERC=npx vercel curl
set PASS=0
set FAIL=0

echo ===== PUBLIC API =====

echo [1/12] Health...
%VERC% "%BASE%/api/health" 2>&1 | findstr "healthy" >nul && (set /a PASS+=1 & echo ✅ Health) || (set /a FAIL+=1 & echo ❌ Health)

echo [2/12] Forms...
%VERC% "%BASE%/api/forms" 2>&1 | findstr "forms" >nul && (set /a PASS+=1 & echo ✅ Forms) || (set /a FAIL+=1 & echo ❌ Forms)

echo [3/12] Single Form...
%VERC% "%BASE%/api/forms/spring_monitoring" 2>&1 | findstr "fields" >nul && (set /a PASS+=1 & echo ✅ Single Form) || (set /a FAIL+=1 & echo ❌ Single Form)

echo [4/12] Leaderboard...
%VERC% "%BASE%/api/leaderboard" 2>&1 | findstr "leaders" >nul && (set /a PASS+=1 & echo ✅ Leaderboard) || (set /a FAIL+=1 & echo ❌ Leaderboard)

echo [5/12] Point Rules...
%VERC% "%BASE%/api/point-rules" 2>&1 | findstr "rules" >nul && (set /a PASS+=1 & echo ✅ Point Rules) || (set /a FAIL+=1 & echo ❌ Point Rules)

echo [6/12] Courses...
%VERC% "%BASE%/api/courses" 2>&1 | findstr "courses" >nul && (set /a PASS+=1 & echo ✅ Courses) || (set /a FAIL+=1 & echo ❌ Courses)

echo [7/12] Content Media...
%VERC% "%BASE%/api/content?section=media" 2>&1 | findstr "items" >nul && (set /a PASS+=1 & echo ✅ Content) || (set /a FAIL+=1 & echo ❌ Content)

echo [8/12] Gallery...
%VERC% "%BASE%/api/gallery" 2>&1 | findstr "gallery" >nul && (set /a PASS+=1 & echo ✅ Gallery) || (set /a FAIL+=1 & echo ❌ Gallery)

echo [9/12] Course Detail...
%VERC% "%BASE%/api/courses/spring-conservation" 2>&1 | findstr "modules" >nul && (set /a PASS+=1 & echo ✅ Course Detail) || (set /a FAIL+=1 & echo ❌ Course Detail)

echo [10/12] Single form slug...
%VERC% "%BASE%/api/forms/spring-restoration" 2>&1 | findstr "fields" >nul && (set /a PASS+=1 & echo ✅ Restoration Form) || (set /a FAIL+=1 & echo ❌ Restoration Form)

echo [11/12] Content projects...
%VERC% "%BASE%/api/content?section=projects" 2>&1 | findstr "items" >nul && (set /a PASS+=1 & echo ✅ Projects Content) || (set /a FAIL+=1 & echo ❌ Projects Content)

echo [12/12] Forgot password...
%VERC% "%BASE%/api/auth/forgot-password" -X POST -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\"}" 2>&1 | findstr "success" >nul && (set /a PASS+=1 & echo ✅ Forgot Password) || (set /a FAIL+=1 & echo ❌ Forgot Password)

echo.
echo ===== FINAL RESULT =====
echo Pass: %PASS% / Fail: %FAIL%
echo Total: 12 tests
