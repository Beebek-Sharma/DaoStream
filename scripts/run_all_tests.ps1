# Personal Media Hub - Full Automated Regression Test Runner
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PERSONAL MEDIA HUB - FULL REGRESSION TEST RUNNER" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Run Backend Pytest Suite
Write-Host "`n[1/2] Running Backend Test Suite..." -ForegroundColor Yellow
$pytestResult = & apps/api/.venv/Scripts/pytest.exe -c apps/api/pytest.ini apps/api/tests -q
Write-Host $pytestResult
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Backend tests: PASSED" -ForegroundColor Green

# 2. Run Frontend Production Build & Typecheck
Write-Host "`n[2/2] Running Frontend Build & Typecheck..." -ForegroundColor Yellow
$npmResult = & npm run build --prefix apps/web
Write-Host $npmResult
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Frontend build: PASSED" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL TESTS PASSED SUCCESSFULLY! SYSTEM IS STABLE." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
