# Build and Deploy Script for Firebase Functions and Hosting
# Usage: .\build-and-deploy.ps1 [--functions-only] [--hosting-only]

param(
    [switch]$FunctionsOnly,
    [switch]$HostingOnly
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Firebase Build & Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Error handling
$ErrorActionPreference = "Stop"
trap {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error Message: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "1. Check Firebase login: firebase login" -ForegroundColor Yellow
    Write-Host "2. Check project: firebase use" -ForegroundColor Yellow
    Write-Host "3. Check npm/node: node --version && npm --version" -ForegroundColor Yellow
    Write-Host "4. Check build logs in functions directory" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if Firebase CLI is installed
$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
    Write-Host "ERROR: Firebase CLI is not installed!" -ForegroundColor Red
    Write-Host "Please install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if we're logged in
Write-Host "Checking Firebase login status..." -ForegroundColor Yellow
$firebaseUser = & firebase login:list 2>&1
if ($LASTEXITCODE -ne 0 -or $firebaseUser -match "No authorized accounts") {
    Write-Host "Please login to Firebase first:" -ForegroundColor Yellow
    Write-Host "  firebase login" -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ Firebase CLI ready" -ForegroundColor Green
Write-Host ""

# Build Functions
if (-not $HostingOnly) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Building Firebase Functions..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Push-Location functions
    
    # Check if npm is available
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npmCmd) {
        Write-Host "ERROR: npm is not found in PATH!" -ForegroundColor Red
        Write-Host "Please ensure Node.js and npm are installed and in your PATH" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
    
    # Build TypeScript
    Write-Host "Building TypeScript..." -ForegroundColor Yellow
    try {
        & npm run build 2>&1 | ForEach-Object {
            if ($_ -match "error|Error|ERROR") {
                Write-Host $_ -ForegroundColor Red
            } else {
                Write-Host $_
            }
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "TypeScript build failed with exit code $LASTEXITCODE"
        }
        
        # Verify build output
        if (-not (Test-Path "lib/index.js")) {
            throw "Build output not found: lib/index.js"
        }
        
        Write-Host "✓ Functions built successfully" -ForegroundColor Green
        Write-Host "  Build output: lib/index.js" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: Build failed!" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
    
    Pop-Location
    Write-Host ""
}

# Deploy
if ($FunctionsOnly) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deploying Functions only..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    & firebase deploy --only functions
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Functions deployment failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "✓ Functions deployed successfully!" -ForegroundColor Green
    
} elseif ($HostingOnly) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deploying Hosting only..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    & firebase deploy --only hosting
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Hosting deployment failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "✓ Hosting deployed successfully!" -ForegroundColor Green
    
} else {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deploying Functions and Hosting..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    & firebase deploy
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Functions: https://console.firebase.google.com/project/_/functions" -ForegroundColor Yellow
Write-Host "Hosting: https://console.firebase.google.com/project/_/hosting" -ForegroundColor Yellow
Write-Host ""

