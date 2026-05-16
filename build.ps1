# build.ps1 — Build and package the LG Terminal Enact app
# Usage:
#   .\build.ps1              # npm install + pack (production build)
#   .\build.ps1 -Deploy      # + install + launch on TV
#   .\build.ps1 -Device tv   # target a specific ares device (default: "tv")

param(
  [switch]$Deploy,
  [string]$Device = "tv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ROOT   = $PSScriptRoot
$APPID  = "com.swapnil.terminal"

# ── 0. Check prerequisites ────────────────────────────────────────────────────
foreach ($cmd in @("node", "npm", "ares-package")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Error "$cmd not found.`n  Install Node.js from https://nodejs.org`n  Install webOS CLI: npm install -g @webos-tools/cli"
  }
}

# ── 1. npm install (Enact app) ────────────────────────────────────────────────
Write-Host "`nInstalling Enact app dependencies…" -ForegroundColor Cyan
Push-Location $ROOT
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Error "npm install failed" }
Pop-Location

# ── 2. Generate icons with .NET if missing ────────────────────────────────────
$iconDir = Join-Path $ROOT "webos-meta"
$icon80  = Join-Path $iconDir "icon.png"
$icon512 = Join-Path $iconDir "largeIcon.png"

if (-not (Test-Path $icon80) -or -not (Test-Path $icon512)) {
  Write-Host "Generating app icons…" -ForegroundColor Cyan
  Add-Type -AssemblyName System.Drawing

  function New-TermIcon ([string]$path, [int]$size) {
    $bmp   = New-Object System.Drawing.Bitmap $size, $size
    $g     = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 10, 10))

    # Rounded dark-green background circle
    $pad  = [int]($size * 0.08)
    $rect = New-Object System.Drawing.Rectangle $pad, $pad, ($size - 2*$pad), ($size - 2*$pad)
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 26, 15))
    $g.FillEllipse($bgBrush, $rect)

    # ">_" text
    $fontSize = [float]($size * 0.32)
    $font     = New-Object System.Drawing.Font("Courier New", $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 255, 68))
    $sf       = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString(">_", $font, $brush, [System.Drawing.RectangleF]::op_Implicit($rect), $sf)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "  Created $path" -ForegroundColor Green
  }

  New-TermIcon $icon80  80
  New-TermIcon $icon512 512
}

# ── 3. Production build (Enact pack) ─────────────────────────────────────────
Write-Host "`nBuilding Enact app (production)…" -ForegroundColor Cyan
Push-Location $ROOT
npm run pack-p
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Error "Enact build failed" }
Pop-Location

# The packed output goes to dist/ — copy webos-meta files in
$dist = Join-Path $ROOT "dist"
Copy-Item (Join-Path $ROOT "webos-meta\*") $dist -Recurse -Force

# ── 4. Package into .ipk ─────────────────────────────────────────────────────
Write-Host "`nPackaging with ares-package…" -ForegroundColor Cyan
ares-package $dist --outdir $ROOT
if ($LASTEXITCODE -ne 0) { Write-Error "ares-package failed" }

$ipk = Get-ChildItem -Path $ROOT -Filter "${APPID}_*.ipk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $ipk) { Write-Error "No .ipk found after packaging" }
Write-Host "  Package: $($ipk.Name)" -ForegroundColor Green

# ── 5. (Optional) Install + launch on TV ─────────────────────────────────────
if ($Deploy) {
  Write-Host "`nInstalling on '$Device'…" -ForegroundColor Cyan
  ares-install --device $Device $ipk.FullName
  if ($LASTEXITCODE -ne 0) { Write-Error "ares-install failed" }

  Write-Host "Launching $APPID…" -ForegroundColor Cyan
  ares-launch --device $Device $APPID
  if ($LASTEXITCODE -ne 0) { Write-Error "ares-launch failed" }

  Write-Host "`nDone — Terminal launched on your TV." -ForegroundColor Green
} else {
  Write-Host "`nBuild complete.  To deploy:" -ForegroundColor Yellow
  Write-Host "  1. Register your TV:  ares-setup-device" -ForegroundColor Yellow
  Write-Host "  2. Deploy:            .\build.ps1 -Deploy" -ForegroundColor Yellow
}
