# make_fixture.ps1 -- generate Chinese speech test fixture via SAPI TTS
# Products: output/auto-subtitle-tests/fixture-zh.wav + fixture-zh.txt
# Voice: Microsoft Huihui Desktop [zh-CN] (offline)
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
$outDir = Join-Path $repoRoot "output\auto-subtitle-tests"
New-Item -ItemType Directory -Force $outDir | Out-Null

$sentences = @(
    "大家好，欢迎来到本期视频。",
    "今天我们来看一个智能硬件项目的整体架构。",
    "这个系统分为三层，分别是设备端、服务端和网页端。",
    "设备端每一秒钟上报一次传感器数据，服务端收到后立即转发给所有在线的网页客户端，整体延迟低于两百毫秒。",
    "下一期我们讲语音识别的具体实现，感谢观看。"
)

$wavPath = Join-Path $outDir "fixture-zh.wav"
$txtPath = Join-Path $outDir "fixture-zh.txt"

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Huihui Desktop")
$synth.Rate = 3
$synth.SetOutputToWaveFile($wavPath)

$pb = New-Object System.Speech.Synthesis.PromptBuilder
for ($i = 0; $i -lt $sentences.Count; $i++) {
    $pb.AppendText($sentences[$i])
    if ($i -lt $sentences.Count - 1) {
        $pb.AppendBreak([System.TimeSpan]::FromSeconds(1.8))
    }
}
$synth.Speak($pb)
$synth.Dispose()

[System.IO.File]::WriteAllLines($txtPath, $sentences, (New-Object System.Text.UTF8Encoding($false)))

$duration = (& ffprobe -v error -show_entries format=duration -of csv=p=0 $wavPath).Trim()
$wavInfo = Get-Item $wavPath
$txtInfo = Get-Item $txtPath
Write-Output ("WAV: " + $wavInfo.FullName + " (" + $wavInfo.Length + " bytes)")
Write-Output ("TXT: " + $txtInfo.FullName)
Write-Output ("Duration(s): " + $duration)
