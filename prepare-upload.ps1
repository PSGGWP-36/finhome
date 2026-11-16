# Copies only the website files into ..\FinHome-upload (for a manual drag-and-drop upload).
# Not needed when Cloudflare deploys from GitHub: wrangler.jsonc + .assetsignore handle that.
# Run from the FinHome folder:  powershell -ExecutionPolicy Bypass -File .\prepare-upload.ps1
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$dst = Join-Path (Split-Path $src -Parent) 'FinHome-upload'

if (Test-Path $dst) { Remove-Item -LiteralPath $dst -Recurse -Force }
New-Item -ItemType Directory -Path $dst | Out-Null

# site files at the root
Get-ChildItem -LiteralPath $src -File | Where-Object { $_.Extension -in '.html', '.ico', '.txt' -or $_.Name -eq '_headers' } |
  ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $dst }
# site folders
foreach ($dir in 'css', 'js', 'assets') { Copy-Item -LiteralPath (Join-Path $src $dir) -Destination $dst -Recurse }

$files = Get-ChildItem -LiteralPath $dst -Recurse -File
"Ready: {0} files, {1:N0} KB -> {2}" -f $files.Count, (($files | Measure-Object Length -Sum).Sum / 1KB), $dst
