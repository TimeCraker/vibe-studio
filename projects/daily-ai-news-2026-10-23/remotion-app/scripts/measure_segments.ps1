# Per-segment Huihui timing. Same voice as make_deck_audio.ps1.
# These files are only used to place sentence cues inside each page wav.
# ASCII only: Windows PowerShell 5.1 reads this file as ANSI.
param(
    [Parameter(Mandatory = $true)][string]$ScriptPath,
    [Parameter(Mandatory = $true)][string]$OutDir
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $ScriptPath)) {
    Write-Output "ERROR: script not found: $ScriptPath"
    exit 1
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$raw = Get-Content -Raw -Encoding UTF8 $ScriptPath
$data = $raw | ConvertFrom-Json

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$huihui = $synth.GetInstalledVoices() |
    Where-Object { $_.VoiceInfo.Name -like "*Huihui*" -and $_.Enabled } |
    Select-Object -First 1
if ($null -eq $huihui) {
    Write-Output "ERROR: Microsoft Huihui Desktop voice not enabled"
    exit 1
}
$synth.SelectVoice($huihui.VoiceInfo.Name)

foreach ($seg in $data.segments) {
    $wavPath = Join-Path $OutDir ("seg-{0}.wav" -f $seg.id)
    $synth.SetOutputToWaveFile($wavPath)
    $synth.Speak([string]$seg.text)
    $synth.SetOutputToNull()
    Write-Output "seg-$($seg.id)"
}
$synth.Dispose()
Write-Output "done: $($data.segments.Count) segments"
exit 0
