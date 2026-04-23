# Clean Next.js cache script
Write-Host "Cleaning Next.js cache..." -ForegroundColor Yellow

# Stop any running node processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Remove .next folder
$nextPath = "apps\web\.next"
if (Test-Path $nextPath) {
    Write-Host "Removing .next folder..." -ForegroundColor Cyan
    Remove-Item -Path $nextPath -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    
    # If still exists, try harder
    if (Test-Path $nextPath) {
        Get-ChildItem -Path $nextPath -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
        Remove-Item -Path $nextPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Cache cleaned successfully!" -ForegroundColor Green
Write-Host "Now run: npm run dev" -ForegroundColor Yellow
