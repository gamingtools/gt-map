<#
Sane cleanup + reinstall script for Windows PowerShell

Usage examples (run from repo root):
  pwsh ./win-repair-node.ps1               # clean, install, rebuild across workspaces
  pwsh ./win-repair-node.ps1 -Build        # also run root build script after install
  pwsh ./win-repair-node.ps1 -CleanOnly    # only remove node_modules and locks, no install
  pwsh ./win-repair-node.ps1 -SkipCache    # skip npm cache clean

This script:
  - Deletes all node_modules folders recursively
  - Deletes all package-lock.json files
  - Cleans npm cache (unless -SkipCache)
  - Runs `npm install` at the repo root
  - Runs `npm rebuild --workspaces` to ensure native deps (e.g., lightningcss) bind correctly
  - Optionally runs `npm run build` at the repo root (-Build)
#>

[CmdletBinding()]
param(
  [switch]$CleanOnly,
  [switch]$SkipCache,
  [switch]$Build,
  [switch]$NoRebuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section([string]$text) {
  Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function Try-Run([string]$cmd, [string[]]$Arguments) {
  try {
    Write-Host "> $cmd $($Arguments -join ' ')" -ForegroundColor DarkGray
    & $cmd @Arguments
  } catch {
    throw $_
  }
}

Write-Section "Detect Node/NPM"
$nodeCmd = (Get-Command node -ErrorAction SilentlyContinue)
if ($null -ne $nodeCmd) {
  Write-Host ("node: {0}" -f $nodeCmd.Source) -ForegroundColor DarkGray
} else {
  Write-Warning "Node.js not found in PATH. Script may fail."
}

# Determine if we are on Windows without relying on $IsWindows (not present in Windows PowerShell 5.1)
$IsWin = $false
try { if ($env:OS -eq 'Windows_NT') { $IsWin = $true } } catch {}

function Resolve-Npm {
  # Prefer npm.cmd on Windows to avoid npm.ps1 shim issues
  param()
  if ($IsWin) {
    $cmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue)
    if ($cmd) { return $cmd.Source }
    return 'npm.cmd'
  }
  return 'npm'
}

$NPM = Resolve-Npm
Try-Run $NPM @('--version')

Write-Section "Remove node_modules"
$nm = Get-ChildItem -Path . -Filter node_modules -Directory -Recurse -Force -ErrorAction SilentlyContinue
if ($nm) {
  $count = 0
  foreach ($dir in $nm) {
    try {
      Remove-Item -LiteralPath $dir.FullName -Recurse -Force -ErrorAction Stop
      $count++
    } catch {
      Write-Warning "Failed to remove: $($dir.FullName). Try closing editors/terminals and rerun."
    }
  }
  Write-Host "Removed node_modules dirs: $count"
} else {
  Write-Host "No node_modules directories found"
}

Write-Section "Remove lockfiles"
$lockList = @(Get-ChildItem -Path . -Recurse -Force -Include package-lock.json -File -ErrorAction SilentlyContinue)
if ($lockList.Count -gt 0) {
  $lockList | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue }
  Write-Host ("Removed package-lock.json files: {0}" -f $lockList.Count)
} else {
  Write-Host "No package-lock.json files found"
}

if (-not $SkipCache) {
  Write-Section "Clean npm cache"
  Try-Run $NPM @('cache','clean','--force')
}

if ($CleanOnly) {
  Write-Host "Clean-only requested. Skipping install/rebuild." -ForegroundColor Yellow
  exit 0
}

Write-Section "npm install (root workspace)"
Try-Run $NPM @('install')

if (-not $NoRebuild) {
  Write-Section "npm rebuild (all workspaces)"
  # NPM 8+: --workspaces rebuilds across all workspaces
  Try-Run $NPM @('rebuild','--workspaces')
}

if ($Build) {
  Write-Section "npm run build (root)"
  Try-Run $NPM @('run','build')
}

Write-Host "`nDone. You can now run: npm run dev" -ForegroundColor Green
