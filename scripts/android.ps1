$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectPath
$studioJava = 'C:\Program Files\Android\Android Studio\jbr'
if (Test-Path -LiteralPath (Join-Path $studioJava 'bin\java.exe')) {
    $env:JAVA_HOME = $studioJava
    $env:PATH = "$studioJava\bin;$env:PATH"
}
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
& (Join-Path $projectPath 'node_modules\.bin\react-native.cmd') run-android --active-arch-only
exit $LASTEXITCODE
