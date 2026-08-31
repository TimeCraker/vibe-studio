# make_deck_audio.ps1 - per-page SAPI voiceover from a narration segment script.
#
# Usage: powershell -File make_deck_audio.ps1 <script.json> <outDir>
#
# Reads the segment script JSON, aggregates segment texts by ref "page N",
# joins page text with a CJK full stop, and speaks each page to page-<N>.wav
# via System.Speech (Microsoft Huihui Desktop voice). Separate wav per page
# gives the natural inter-page gap; no AppendBreak needed.
#
# Formal pipeline swap point: export page-N.wav from Jianying per page and
# drop them in the same directory; downstream stays unchanged.
#
# Kept pure ASCII on purpose: PowerShell 5.1 parses BOM-less files as ANSI.
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

$period = [char]0x3002  # CJK full stop

# aggregate segment texts by page number parsed from ref "page N"
$pages = @{}
foreach ($seg in $data.segments) {
    if ($seg.ref -match 'page\s+(\d+)') {
        $pageNo = [int]$Matches[1]
        if (-not $pages.ContainsKey($pageNo)) { $pages[$pageNo] = @() }
        $pages[$pageNo] += $seg.text
    }
    else {
        Write-Output "ERROR: segment $($seg.id) ref not parseable: $($seg.ref)"
        exit 1
    }
}

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$huihui = $synth.GetInstalledVoices() |
    Where-Object { $_.VoiceInfo.Name -like "*Huihui*" } |
    Select-Object -First 1
if ($null -eq $huihui) {
    Write-Output "ERROR: Microsoft Huihui Desktop voice not installed"
    exit 1
}
$synth.SelectVoice($huihui.VoiceInfo.Name)

foreach ($pageNo in ($pages.Keys | Sort-Object)) {
    $text = (($pages[$pageNo] | ForEach-Object { $_.TrimEnd($period) }) -join $period) + $period
    $wavPath = Join-Path $OutDir ("page-{0}.wav" -f $pageNo)
    $synth.SetOutputToWaveFile($wavPath)
    $synth.Speak($text)
    $synth.SetOutputToNull()
    Write-Output "page-${pageNo}: $wavPath"
}

$synth.Dispose()
Write-Output "done: $($pages.Count) pages"
exit 0
