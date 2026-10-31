<#
.Script to patch frontend/index.html for APNG support.
Run from the project root:
  node tools/_patch-index.ps1
#>
$ErrorActionPreference = 'Stop'
$path = 'C:/Users/Hp/Downloads/404.dev/Anii2/ANILyfe_V1_tailwind_anime/frontend/index.html'
$content = Get-Content -LiteralPath $path -Raw
$content = $content -replace '\r\n?', '`n'

$old1 = '<img src="assets/images/splash.png" width="360" height="640" alt=""'
$new1 = '<div class="apng-mascot apng-splash" style="transform: scale(1.12);"><img src="assets/images/loader-mascot-apng.png" srcset="assets/images/loader-mascot.png" alt="ANIlyfe mascot"'

$old2 = '<img src="assets/images/loader-mascot.png" width="512" height="512" alt="ANIlyfe mascot"'
$new2 = '<div class="apng-mascot apng-splash"><img src="assets/images/loader-mascot-apng.png" srcset="assets/images/loader-mascot.png" alt=""'

$old3 = '<img src="assets/images/loader-mascot.png" width="512" height="512" alt=""'
$new3 = '<div class="apng-mascot apng-loader"><img src="assets/images/loader-mascot-apng.png" srcset="assets/images/loader-mascot.png" alt=""'

$content = $content -replace [regex]::Escape($old1), $new1
$content = $content -replace [regex]::Escape($old2), $new2
$content = $content -replace [regex]::Escape($old3), $new3

$content | Set-Content -LiteralPath $path -Encoding UTF8
Write-Host 'patched index.html'
