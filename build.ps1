# build.ps1 — build and deploy the webOS Terminal app
# Usage:  .\build.ps1              (package only, outputs .ipk)
#         .\build.ps1 -Deploy      (package + install + launch on TV)
#         .\build.ps1 -Device tv   (use a named ares device; default = "tv")

param(
  [switch]$Deploy,
  [string]$Device = "tv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ROOT    = $PSScriptRoot
$APP     = Join-Path $ROOT "app"
$SERVICE = Join-Path $ROOT "service"
$APPID   = "com.swapnil.lgterminal"

# ── 0. Prerequisites check ───────────────────────────────────────────────────
foreach ($cmd in @("node", "npm", "ares-package")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Error "$cmd not found. Install the webOS TV CLI:  npm install -g @webos-tools/cli"
  }
}

# ── 1. Generate icon.png using .NET (no extra tools required) ────────────────
$iconPath = Join-Path $APP "icon.png"
if (-not (Test-Path $iconPath)) {
  Write-Host "Generating icon.png..." -ForegroundColor Cyan
  Add-Type -AssemblyName System.Drawing
  $bmp  = New-Object System.Drawing.Bitmap 80, 80
  $g    = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(255, 0, 21, 0))
  $font  = New-Object System.Drawing.Font("Courier New", 26, [System.Drawing.FontStyle]::Bold)
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 255, 68))
  $g.DrawString(">_", $font, $brush, [float]4, [float]18)
  $bmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host "  icon.png created." -ForegroundColor Green
}

# ── 2. Install service npm dependencies ──────────────────────────────────────
Write-Host "Installing service dependencies..." -ForegroundColor Cyan
Push-Location $SERVICE
npm install --omit=dev --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Error "npm install failed" }
Pop-Location
Write-Host "  Done." -ForegroundColor Green

# ── 3. Package the app + service into an .ipk ────────────────────────────────
Write-Host "Packaging with ares-package..." -ForegroundColor Cyan
Push-Location $ROOT
ares-package $APP $SERVICE --outdir .
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Error "ares-package failed" }
Pop-Location

$ipk = Get-ChildItem -Path $ROOT -Filter "${APPID}_*.ipk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $ipk) { Write-Error "No .ipk found after packaging" }
Write-Host "  Package: $($ipk.Name)" -ForegroundColor Green

# ── 4. (Optional) Install and launch on TV ───────────────────────────────────
if ($Deploy) {
  Write-Host "Installing on device '$Device'..." -ForegroundColor Cyan
  ares-install --device $Device $ipk.FullName
  if ($LASTEXITCODE -ne 0) { Write-Error "ares-install failed" }

  Write-Host "Launching $APPID..." -ForegroundColor Cyan
  ares-launch --device $Device $APPID
  if ($LASTEXITCODE -ne 0) { Write-Error "ares-launch failed" }

  Write-Host "Done! Terminal launched on your TV." -ForegroundColor Green
} else {
  Write-Host "`nTo deploy:  .\build.ps1 -Deploy" -ForegroundColor Yellow
  Write-Host "Make sure 'tv' device is added in ares first:" -ForegroundColor Yellow
  Write-Host "  ares-setup-device" -ForegroundColor Yellow
}
